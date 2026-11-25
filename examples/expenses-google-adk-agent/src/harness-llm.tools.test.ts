import assert from "node:assert/strict";
import { test } from "node:test";
import { MCPTool } from "@google/adk";
import type { LlmRequest } from "@google/adk";
import { HarnessLLM } from "./harness-llm.js";
import { withTurnCredentials } from "./turn-credentials.js";

const CREDENTIALS = { harnessToken: "test-token", wdTenant: "acme-corp" };
process.env.WORKDAY_AGENT_HARNESS_URL = "https://harness.example.com";

// The raw MCP JSON Schema, as an MCP server's tools/list returns it -- with a
// `$ref` into `definitions`, which ADK's Gemini-schema conversion can't
// carry, so the adapter must forward this object unchanged.
const VIEW_EXPENSES_INPUT_SCHEMA = {
  type: "object",
  properties: { reportNumber: { type: "string" }, dateRange: { $ref: "#/definitions/DateRange" } },
  definitions: { DateRange: { type: "object", properties: { from: { type: "string" } } } },
};

// A real ADK `MCPTool`, so the test fails if an ADK upgrade moves the raw
// schema the adapter reads. The session manager is never used here.
function realMcpTool(): MCPTool {
  type Args = ConstructorParameters<typeof MCPTool>;
  return new MCPTool({ name: "view_expenses", inputSchema: VIEW_EXPENSES_INPUT_SCHEMA } as Args[0], {} as Args[1]);
}

function toolRequest(
  contents: LlmRequest["contents"],
  toolsDict: Record<string, unknown> = { view_expenses: realMcpTool() },
): LlmRequest {
  return {
    contents,
    config: {
      tools: [
        {
          functionDeclarations: [
            { name: "view_expenses", description: "Retrieves the user's expense lines.", parameters: { type: "OBJECT" } },
            {
              name: "get_time",
              description: "Current time.",
              parameters: {
                type: "OBJECT",
                properties: { zone: { type: "STRING", description: "IANA zone", enum: ["UTC", "PST"] } },
                required: ["zone"],
              },
            },
          ],
        },
      ],
    },
    liveConnectConfig: {},
    toolsDict: toolsDict as LlmRequest["toolsDict"],
  } as LlmRequest;
}

function recordingFetch(reply: unknown) {
  const bodies: Array<Record<string, unknown>> = [];
  const fetchImpl = (async (_url: string, init: RequestInit) => {
    bodies.push(JSON.parse(init.body as string));
    return new Response(JSON.stringify(reply), { status: 200 });
  }) as typeof fetch;
  return { bodies, fetchImpl };
}

async function collect<T>(gen: AsyncGenerator<T, void>): Promise<T[]> {
  const out: T[] = [];
  for await (const item of gen) out.push(item);
  return out;
}

test("sends the request's tools in OpenAI format, MCP tools with their raw JSON Schema", async () => {
  const { bodies, fetchImpl } = recordingFetch({ choices: [{ message: { content: "ok" } }] });
  const llm = new HarnessLLM({ model: "m", fetchImpl });

  await withTurnCredentials(CREDENTIALS, () =>
    collect(llm.generateContentAsync(toolRequest([{ role: "user", parts: [{ text: "my expenses?" }] }]))),
  );

  assert.deepEqual(bodies[0].tools, [
    {
      type: "function",
      function: {
        name: "view_expenses",
        description: "Retrieves the user's expense lines.",
        parameters: VIEW_EXPENSES_INPUT_SCHEMA,
      },
    },
    {
      type: "function",
      function: {
        name: "get_time",
        description: "Current time.",
        parameters: {
          type: "object",
          properties: { zone: { type: "string", description: "IANA zone", enum: ["UTC", "PST"] } },
          required: ["zone"],
        },
      },
    },
  ]);
});

test("falls back to ADK's Gemini schema for a tool that is not an MCP tool", async () => {
  const { bodies, fetchImpl } = recordingFetch({ choices: [{ message: { content: "ok" } }] });
  const llm = new HarnessLLM({ model: "m", fetchImpl });

  await withTurnCredentials(CREDENTIALS, () =>
    collect(
      llm.generateContentAsync(
        toolRequest([{ role: "user", parts: [{ text: "my expenses?" }] }], {
          view_expenses: { name: "view_expenses", mcpTool: { inputSchema: VIEW_EXPENSES_INPUT_SCHEMA } },
        }),
      ),
    ),
  );

  const tools = bodies[0].tools as Array<{ function: { parameters: unknown } }>;
  assert.deepEqual(tools[0].function.parameters, { type: "object" });
});

test("omits tools entirely when the request has none", async () => {
  const { bodies, fetchImpl } = recordingFetch({ choices: [{ message: { content: "ok" } }] });
  const llm = new HarnessLLM({ model: "m", fetchImpl });

  await withTurnCredentials(CREDENTIALS, () =>
    collect(
      llm.generateContentAsync({
        contents: [{ role: "user", parts: [{ text: "hi" }] }],
        liveConnectConfig: {},
        toolsDict: {},
      }),
    ),
  );

  assert.equal("tools" in bodies[0], false);
});

test("yields the model's tool calls as ADK function calls", async () => {
  const { fetchImpl } = recordingFetch({
    choices: [
      {
        message: {
          content: "",
          tool_calls: [{ id: "call-1", type: "function", function: { name: "view_expenses", arguments: '{"reportNumber":"4447"}' } }],
        },
        finish_reason: "tool_calls",
      },
    ],
  });
  const llm = new HarnessLLM({ model: "m", fetchImpl });

  const [response] = await withTurnCredentials(CREDENTIALS, () =>
    collect(llm.generateContentAsync(toolRequest([{ role: "user", parts: [{ text: "expense 4447?" }] }]))),
  );

  assert.deepEqual(response.content?.parts, [
    { functionCall: { id: "call-1", name: "view_expenses", args: { reportNumber: "4447" } } },
  ]);
});

test("sends earlier function calls and their results back as assistant tool_calls and tool messages", async () => {
  const { bodies, fetchImpl } = recordingFetch({ choices: [{ message: { content: "You have 11 lines." } }] });
  const llm = new HarnessLLM({ model: "m", fetchImpl });

  const [response] = await withTurnCredentials(CREDENTIALS, () =>
    collect(
      llm.generateContentAsync(
        toolRequest([
          { role: "user", parts: [{ text: "my expenses?" }] },
          { role: "model", parts: [{ functionCall: { id: "call-1", name: "view_expenses", args: {} } }] },
          {
            role: "user",
            parts: [{ functionResponse: { id: "call-1", name: "view_expenses", response: { status: "ok", count: 11 } } }],
          },
        ]),
      ),
    ),
  );

  assert.deepEqual(bodies[0].messages, [
    { role: "user", content: "my expenses?" },
    {
      role: "assistant",
      content: null,
      tool_calls: [{ id: "call-1", type: "function", function: { name: "view_expenses", arguments: "{}" } }],
    },
    { role: "tool", tool_call_id: "call-1", content: '{"status":"ok","count":11}' },
  ]);
  assert.equal(response.content?.parts?.[0]?.text, "You have 11 lines.");
});

test("raises without echoing the arguments when a tool call's arguments are not valid JSON", async () => {
  const { fetchImpl } = recordingFetch({
    choices: [{ message: { tool_calls: [{ id: "c", type: "function", function: { name: "view_expenses", arguments: "{secret" } }] } }],
  });
  const llm = new HarnessLLM({ model: "m", fetchImpl });

  await assert.rejects(
    () =>
      withTurnCredentials(CREDENTIALS, () =>
        collect(llm.generateContentAsync(toolRequest([{ role: "user", parts: [{ text: "x" }] }]))),
      ),
    (error: Error) => /tool call arguments for view_expenses are not valid JSON/.test(error.message) && !error.message.includes("secret"),
  );
});
