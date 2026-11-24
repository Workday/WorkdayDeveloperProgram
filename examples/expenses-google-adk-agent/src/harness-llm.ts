import type { BaseLlmConnection, LlmRequest, LlmResponse } from "@google/adk";
import { BaseLlm, MCPTool } from "@google/adk";
import type { Content, Part } from "@google/genai";
import { requireHarnessCredentials } from "./harness-credentials.js";
import { logError, logInfo, logWarn, truncate } from "./logger.js";

// A `BaseLlm` adapter for model inference through Workday Agent Harness:
// text and OpenAI-style tool calls (function declarations out, `tool_calls`
// back, and function calls/results replayed in the history), no streaming, no
// live connect() support. Tool calls are what let the agent use the Workday
// tools that `harness-mcp.ts` lists through Agent Harness's `/sandbox/v1/mcp`.
//
// It posts to Agent Harness's OpenAI-compatible `/sandbox/v1/chat/completions`
// rather than to a model provider directly. TypeScript ADK's `RunConfig` has
// no hook to add per-turn HTTP headers, so this adapter sets the `X-ACR-Token`
// and `wd-tenant` headers on its own fetch call.
//
// harnessToken/wdTenant come from `getTurnCredentials()` (turn-credentials.ts):
// Agent Harness sends `X-ACR-Token`/`wd-tenant` as headers on the A2A invoke
// request itself, captured per-request by index.ts's custom `UserBuilder` and
// threaded here via `AsyncLocalStorage` (see that module for why). The token
// is per turn: a new one arrives on each A2A request, and the agent sends it
// back on every call it makes to Agent Harness during that turn.
//
// The Agent Harness URL is not per turn: it is WORKDAY_AGENT_HARNESS_URL,
// defaulting to https://agent-harness.workday.com (see harness-credentials.ts).
// It never comes from the request.
export class HarnessLLM extends BaseLlm {
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(params: { model: string; fetchImpl?: typeof fetch; timeoutMs?: number }) {
    super({ model: params.model });
    // Injectable purely for testing without a real network call.
    this.fetchImpl = params.fetchImpl ?? fetch;
    // Nothing outside this process watches for a hung upstream call --
    // without a timeout, an unresponsive Workday Agent Harness leaves the
    // process (and the turn) stuck indefinitely instead of failing fast.
    this.timeoutMs = params.timeoutMs ?? 30_000;
  }

  async *generateContentAsync(
    llmRequest: LlmRequest,
  ): AsyncGenerator<LlmResponse, void> {
    const { harnessToken, wdTenant, harnessUrl } = requireHarnessCredentials();

    const messages: ChatMessage[] = llmRequest.contents.flatMap(toChatMessages);

    const systemInstruction = llmRequest.config?.systemInstruction;
    if (typeof systemInstruction === "string" && systemInstruction) {
      // Genuinely a system prompt, not a user turn -- OpenAI-compatible
      // `/sandbox/v1/chat/completions` (what Workday Agent Harness exposes) has a
      // dedicated `system` role for exactly this.
      messages.unshift({ role: "system", content: systemInstruction });
    }

    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(new Error(`Workday Agent Harness call timed out after ${this.timeoutMs}ms`)),
      this.timeoutMs,
    );

    const requestBody = JSON.stringify({ model: this.model, messages, ...toolsField(llmRequest) });
    const url = `${harnessUrl}/sandbox/v1/chat/completions`;
    logInfo("agent-harness", `--> POST ${url}`, {
      wdTenant,
      body: truncate(requestBody),
    });

    const startedAt = Date.now();
    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          // Agent Harness reads the token from `X-ACR-Token`, not `Authorization: Bearer`.
          "x-acr-token": harnessToken,
          "wd-tenant": wdTenant,
        },
        body: requestBody,
        signal: controller.signal,
      });
    } catch (error) {
      // Real `fetch` implementations don't consistently surface the abort
      // reason as the rejection value, so check the signal directly rather
      // than inspecting `error`.
      if (controller.signal.aborted) {
        logError("agent-harness", `POST ${url} timed out after ${this.timeoutMs}ms`);
        throw new Error(`Workday Agent Harness call timed out after ${this.timeoutMs}ms`);
      }
      logError("agent-harness", `POST ${url} failed before a response was received`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      clearTimeout(timer);
    }

    const durationMs = Date.now() - startedAt;

    if (!response.ok) {
      // Deliberately excludes the response body from the *thrown error*: if
      // Workday Agent Harness forwards a verbose/sensitive upstream error body
      // verbatim, including it there would leak into whatever logs
      // Node/ADK write for an uncaught error. It's still logged here, at
      // this one controlled call site, since that's exactly the payload
      // needed to debug the failure.
      const errorBody = await response.text().catch(() => "<failed to read response body>");
      logError("agent-harness", `<-- POST ${url} ${response.status}`, {
        durationMs,
        body: truncate(errorBody),
      });
      throw new Error(`Workday Agent Harness inference call failed: HTTP ${response.status}`);
    }

    const responseText = await response.text();
    logInfo("agent-harness", `<-- POST ${url} ${response.status}`, {
      durationMs,
      body: truncate(responseText),
    });

    let payload: { choices?: Array<{ message?: { content?: string | null; tool_calls?: ChatToolCall[] } }> };
    try {
      payload = JSON.parse(responseText) as typeof payload;
    } catch {
      throw new Error(`Workday Agent Harness returned HTTP ${response.status} with a non-JSON body`);
    }

    const message = payload.choices?.[0]?.message;
    const toolCalls = message?.tool_calls ?? [];
    if (toolCalls.length > 0) {
      logInfo("agent-harness", "model requested tool calls", {
        tools: toolCalls.map((call) => call.function.name),
      });
      yield {
        content: { role: "model", parts: toolCalls.map(toFunctionCallPart) },
        turnComplete: true,
      };
      return;
    }

    const text = message?.content ?? "";
    if (!text) {
      // An empty/missing content string is a valid-looking OpenAI-compatible
      // payload, so without this check the turn "succeeds" with an empty
      // reply -- no exception, no non-2xx status, nothing for a real A2A
      // caller to notice.
      throw new Error(
        `Workday Agent Harness returned HTTP ${response.status} but choices[0].message.content is empty or absent`,
      );
    }

    yield {
      content: { role: "model", parts: [{ text }] },
      turnComplete: true,
    };
  }

  async connect(): Promise<BaseLlmConnection> {
    throw new Error("HarnessLLM does not support live connections.");
  }
}

// --- OpenAI chat-completions <-> ADK content translation -------------------

interface ChatToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ChatToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

// One ADK `Content` can become several chat messages: text, a batch of
// function calls (one assistant message), or one `tool` message per
// function result.
function toChatMessages(content: Content): ChatMessage[] {
  const parts: Part[] = content.parts ?? [];
  const text = parts
    .filter((part) => typeof part.text === "string")
    .map((part) => part.text as string)
    .join("");

  if (content.role === "model") {
    const toolCalls: ChatToolCall[] = parts
      .filter((part) => part.functionCall)
      .map((part) => ({
        id: part.functionCall!.id ?? "",
        type: "function" as const,
        function: { name: part.functionCall!.name ?? "", arguments: JSON.stringify(part.functionCall!.args ?? {}) },
      }));
    if (toolCalls.length > 0) {
      return [{ role: "assistant", content: text || null, tool_calls: toolCalls }];
    }
    return text ? [{ role: "assistant", content: text }] : [];
  }

  const toolResults: ChatMessage[] = parts
    .filter((part) => part.functionResponse)
    .map((part) => ({
      role: "tool" as const,
      tool_call_id: part.functionResponse!.id ?? "",
      content: JSON.stringify(part.functionResponse!.response ?? {}),
    }));
  return text ? [{ role: "user", content: text }, ...toolResults] : toolResults;
}

function toFunctionCallPart(call: ChatToolCall): Part {
  let args: Record<string, unknown>;
  try {
    args = call.function.arguments ? (JSON.parse(call.function.arguments) as Record<string, unknown>) : {};
  } catch {
    // The arguments can carry user data, so they stay out of the message.
    throw new Error(`Workday Agent Harness: the tool call arguments for ${call.function.name} are not valid JSON`);
  }
  return { functionCall: { id: call.id, name: call.function.name, args } };
}

// `tools` for the chat-completions body, or nothing when the agent has no
// tools (so a tool-less request stays byte-for-byte what it was before).
function toolsField(llmRequest: LlmRequest): { tools?: unknown[] } {
  const declarations = (llmRequest.config?.tools ?? []).flatMap(
    (tool) => (tool as { functionDeclarations?: FunctionDeclarationLike[] }).functionDeclarations ?? [],
  );
  if (declarations.length === 0) return {};
  return {
    tools: declarations.map((declaration) => ({
      type: "function",
      function: {
        name: declaration.name,
        description: declaration.description,
        parameters: parametersFor(declaration, llmRequest),
      },
    })),
  };
}

interface FunctionDeclarationLike {
  name: string;
  description?: string;
  parameters?: GeminiSchema;
  parametersJsonSchema?: unknown;
}

interface GeminiSchema {
  type?: string;
  description?: string;
  enum?: unknown[];
  format?: string;
  required?: string[];
  properties?: Record<string, GeminiSchema>;
  items?: GeminiSchema;
  anyOf?: GeminiSchema[];
}

function parametersFor(declaration: FunctionDeclarationLike, llmRequest: LlmRequest): unknown {
  // An MCP tool's own JSON Schema is exactly what the OpenAI format wants;
  // ADK's Gemini-schema copy of it drops `$ref`/`definitions`.
  const tool = llmRequest.toolsDict?.[declaration.name];
  if (tool instanceof MCPTool) {
    const inputSchema = mcpInputSchema(tool);
    if (inputSchema) return inputSchema;
    warnMissingMcpSchema(declaration.name);
  }
  if (declaration.parametersJsonSchema) return declaration.parametersJsonSchema;
  return declaration.parameters ? toJsonSchema(declaration.parameters) : { type: "object", properties: {} };
}

// Not a public ADK API: `MCPTool` keeps the tools/list entry in a private
// `mcpTool` field (checked against @google/adk 2.5.0). The tests build a real
// `MCPTool`, so an ADK upgrade that moves the field fails them; at run time
// the fallback is ADK's Gemini schema, with a warning.
function mcpInputSchema(tool: MCPTool): unknown {
  return (tool as unknown as { mcpTool?: { inputSchema?: unknown } }).mcpTool?.inputSchema;
}

const warnedMcpSchema = new Set<string>();

function warnMissingMcpSchema(toolName: string): void {
  if (warnedMcpSchema.has(toolName)) return;
  warnedMcpSchema.add(toolName);
  logWarn(
    "agent-harness",
    `MCP tool ${toolName}: no raw inputSchema on ADK's MCPTool; sending ADK's Gemini schema, which drops $ref/definitions`,
  );
}

// Gemini `Schema` (upper-case `Type` values) -> JSON Schema (lower-case).
function toJsonSchema(schema: GeminiSchema): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (schema.type) out.type = schema.type.toLowerCase();
  if (schema.description) out.description = schema.description;
  if (schema.enum) out.enum = schema.enum;
  if (schema.format) out.format = schema.format;
  if (schema.properties) {
    out.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([key, value]) => [key, toJsonSchema(value)]),
    );
  }
  if (schema.required) out.required = schema.required;
  if (schema.items) out.items = toJsonSchema(schema.items);
  if (schema.anyOf) out.anyOf = schema.anyOf.map(toJsonSchema);
  return out;
}
