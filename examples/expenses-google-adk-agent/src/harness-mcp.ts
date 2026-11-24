import { createHash } from "node:crypto";
import { BaseToolset, MCPToolset } from "@google/adk";
import type { BaseTool, ReadonlyContext } from "@google/adk";
import { requireHarnessCredentials } from "./harness-credentials.js";
import { getTurnCredentials } from "./turn-credentials.js";
import { logError, logInfo, logWarn, truncate } from "./logger.js";

// Workday tools for the agent: Workday Agent Harness serves the user's Workday
// tools over MCP at `/sandbox/v1/mcp`, using this turn's X-ACR-Token.
//
// ADK's `MCPToolset` takes a fixed URL and fixed headers when it is built,
// but the credentials change per turn here: the token arrives as X-ACR-Token
// on each invoke (the Agent Harness URL is fixed, see harness-credentials.ts). So the
// toolset gets a custom `fetch` (the MCP SDK's `transportOptions.fetch`) that
// resolves them on every HTTP request, from the turn that makes the request
// (see turn-credentials.ts). The URL given to `MCPToolset` is a placeholder the
// fetch always replaces.
const MCP_PATH = "/sandbox/v1/mcp";
const PLACEHOLDER_URL = `http://harness.invalid${MCP_PATH}`;

export function harnessMcpFetch(fetchImpl: typeof fetch = fetch): typeof fetch {
  return (async (_input: string | URL | Request, init?: RequestInit) => {
    const { harnessToken, wdTenant, harnessUrl } = requireHarnessCredentials();
    const headers = new Headers(init?.headers);
    headers.set("x-acr-token", harnessToken);
    headers.set("wd-tenant", wdTenant);
    const url = `${harnessUrl}${MCP_PATH}`;

    const body = typeof init?.body === "string" ? init.body : undefined;
    logInfo("mcp", `--> ${init?.method ?? "GET"} ${url}`, {
      wdTenant,
      body: body !== undefined ? truncate(body) : "<non-string body>",
    });

    const startedAt = Date.now();
    let response: Response;
    try {
      response = await fetchImpl(url, { ...init, headers });
    } catch (error) {
      logError("mcp", `${init?.method ?? "GET"} ${url} failed before a response was received`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    // Cloned so the MCP SDK (the real consumer) still gets a fresh,
    // unconsumed body stream to read -- this call only peeks for logging.
    const loggable = response.clone();
    void loggable
      .text()
      .then((text) => {
        logInfo("mcp", `<-- ${init?.method ?? "GET"} ${url} ${response.status}`, {
          durationMs: Date.now() - startedAt,
          body: truncate(text),
        });
      })
      .catch(() => {
        logWarn("mcp", `<-- ${init?.method ?? "GET"} ${url} ${response.status}: response body unavailable to log`);
      });

    return response;
  }) as typeof fetch;
}

// Two jobs around the real `MCPToolset`:
//
// 1. Optional: a turn whose token has no tool access gets 403 from
//    `/sandbox/v1/mcp`, and ADK would fail the whole turn on a toolset
//    error. This keeps such turns working: no tools, LLM only. Logs the failure's class, never its
//    message (it can carry upstream detail).
// 2. Cache the tool list. ADK asks for the tools twice before every model
//    call, and each ask is a new MCP session (initialize + initialized +
//    tools/list) plus more work in Agent Harness.
//    - A successful list is kept for `ttlMs` (10 minutes), shared by all turns
//      of the tenant. Agent Harness sends a new token every turn, so the token cannot
//      be the key. This assumes one instance serves one user/agent/skill (the
//      tool list depends on them); the tenant is part of the key as a guard.
//      Tool calls are still authorised by Agent Harness with each turn's own token.
//    - A failed list (no tools) is NOT kept across turns: it is remembered only
//      for the turn that made it (keyed by a hash of its token, so the cache
//      never holds the credential itself), so a later turn with tool access
//      lists again.
const TOOL_LIST_TTL_MS = 10 * 60 * 1000;

export interface OptionalToolsetOptions {
  ttlMs?: number;
  now?: () => number;
}

export class OptionalToolset extends BaseToolset {
  private cached?: { tenant: string; expiresAt: number; tools: BaseTool[] };
  private inFlight?: { tenant: string; tools: Promise<BaseTool[]> };
  private failed?: { key: string; tools: BaseTool[] };
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(
    private readonly inner: BaseToolset,
    options: OptionalToolsetOptions = {},
  ) {
    super([]);
    this.ttlMs = options.ttlMs ?? TOOL_LIST_TTL_MS;
    this.now = options.now ?? Date.now;
  }

  async getTools(context?: ReadonlyContext): Promise<BaseTool[]> {
    const turn = getTurnCredentials();
    const token = turn?.harnessToken;
    const tenant = turn?.wdTenant ?? "";
    const turnKey = token ? createHash("sha256").update(token).digest("hex") : "";

    // No token means no turn is running: ADK also asks for tools outside a
    // turn, e.g. to build the A2A agent card when the process starts, which
    // can happen before the first request arrives. There is nothing to
    // call Agent Harness with then, so return no tools without trying (and without
    // caching, so the first real turn lists normally).
    if (!token) {
      logInfo("mcp", "no X-ACR-Token yet (not in a turn); skipping tool listing");
      return [];
    }

    if (this.cached && this.cached.tenant === tenant && this.now() < this.cached.expiresAt) {
      logInfo("mcp", "reusing cached tool list");
      return this.cached.tools;
    }
    if (this.failed?.key === turnKey) {
      logInfo("mcp", "reusing this turn's failed tool list (no tools)");
      return this.failed.tools;
    }
    if (this.inFlight?.tenant === tenant) {
      return this.inFlight.tools;
    }

    logInfo("mcp", "listing tools (cache miss)");
    const tools = this.listTools(tenant, turnKey, context);
    this.inFlight = { tenant, tools };
    try {
      return await tools;
    } finally {
      if (this.inFlight?.tools === tools) this.inFlight = undefined;
    }
  }

  private async listTools(tenant: string, turnKey: string, context?: ReadonlyContext): Promise<BaseTool[]> {
    try {
      const tools = await this.inner.getTools(context);
      logInfo("mcp", `got ${tools.length} tool(s)`, { tools: tools.map((tool) => tool.name) });
      this.cached = { tenant, expiresAt: this.now() + this.ttlMs, tools };
      this.failed = undefined;
      return tools;
    } catch (error) {
      logWarn("mcp", `tools unavailable for this turn (${(error as Error)?.name ?? "Error"}); continuing without tools`);
      this.cached = undefined;
      this.failed = { key: turnKey, tools: [] };
      return [];
    }
  }

  async close(): Promise<void> {
    await this.inner.close();
  }
}

export function createHarnessMcpToolset(fetchImpl: typeof fetch = fetch): BaseToolset {
  return new OptionalToolset(
    new MCPToolset({
      type: "StreamableHTTPConnectionParams",
      url: PLACEHOLDER_URL,
      transportOptions: { fetch: harnessMcpFetch(fetchImpl) },
    }),
  );
}
