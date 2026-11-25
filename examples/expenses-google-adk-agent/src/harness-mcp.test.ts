import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { BaseToolset } from "@google/adk";
import type { BaseTool } from "@google/adk";
import { OptionalToolset, harnessMcpFetch } from "./harness-mcp.js";
import { withTurnCredentials } from "./turn-credentials.js";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.WORKDAY_AGENT_HARNESS_URL = "https://harness.example/";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function recordingFetch() {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response("{}", { status: 200 });
  }) as typeof fetch;
  return { calls, fetchImpl };
}

test("sends each MCP request to this turn's Agent Harness /sandbox/v1/mcp with this turn's token and tenant", async () => {
  const { calls, fetchImpl } = recordingFetch();
  const mcpFetch = harnessMcpFetch(fetchImpl);

  await withTurnCredentials(
    { harnessToken: "turn-token", wdTenant: "test-tenant" },
    () =>
      mcpFetch("http://harness.invalid/sandbox/v1/mcp", {
        method: "POST",
        headers: { accept: "application/json, text/event-stream", "mcp-session-id": "s-1" },
        body: '{"jsonrpc":"2.0","id":1,"method":"tools/list"}',
      }),
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://harness.example/sandbox/v1/mcp");
  const headers = new Headers(calls[0].init.headers);
  assert.equal(headers.get("x-acr-token"), "turn-token");
  assert.equal(headers.get("wd-tenant"), "test-tenant");
  assert.equal(headers.get("accept"), "application/json, text/event-stream");
  assert.equal(headers.get("mcp-session-id"), "s-1");
  assert.equal(calls[0].init.body, '{"jsonrpc":"2.0","id":1,"method":"tools/list"}');
});

test("reads the credentials of the turn that makes the request, not the turn that built the toolset", async () => {
  const { calls, fetchImpl } = recordingFetch();
  const mcpFetch = harnessMcpFetch(fetchImpl);

  for (const token of ["turn-1", "turn-2"]) {
    await withTurnCredentials({ harnessToken: token, wdTenant: "test-tenant" }, () =>
      mcpFetch("http://harness.invalid/sandbox/v1/mcp", { method: "POST" }),
    );
  }

  assert.deepEqual(
    calls.map((call) => new Headers(call.init.headers).get("x-acr-token")),
    ["turn-1", "turn-2"],
  );
});

test("fails before any network call when the turn has no token", async () => {
  const { calls, fetchImpl } = recordingFetch();
  const mcpFetch = harnessMcpFetch(fetchImpl);

  await assert.rejects(
    () => withTurnCredentials({ wdTenant: "test-tenant" }, () => mcpFetch("http://x/", {})),
    /X-ACR-Token is not available/,
  );
  assert.equal(calls.length, 0);
});

test("sends MCP requests to https://agent-harness.workday.com when WORKDAY_AGENT_HARNESS_URL is not set", async () => {
  delete process.env.WORKDAY_AGENT_HARNESS_URL;
  const { calls, fetchImpl } = recordingFetch();
  const mcpFetch = harnessMcpFetch(fetchImpl);

  await withTurnCredentials({ harnessToken: "t", wdTenant: "test-tenant" }, () => mcpFetch("http://x/sandbox/v1/mcp", {}));

  assert.equal(calls[0].url, "https://agent-harness.workday.com/sandbox/v1/mcp");
});

class FailingToolset extends BaseToolset {
  constructor(private readonly error: Error) {
    super([]);
  }
  async getTools(): Promise<BaseTool[]> {
    throw this.error;
  }
  async close(): Promise<void> {}
}

test("an unavailable MCP server leaves the agent with no tools instead of failing the turn", async () => {
  // A turn invoked without the MCP inputs gets 403 from /sandbox/v1/mcp; the
  // agent must still answer from the LLM alone.
  const toolset = new OptionalToolset(new FailingToolset(new Error("Failed to create MCP session: HTTP 403")));

  assert.deepEqual(await toolset.getTools(), []);
});

class CountingToolset extends BaseToolset {
  calls = 0;
  constructor(public error?: Error) {
    super([]);
  }
  async getTools(): Promise<BaseTool[]> {
    this.calls += 1;
    // Yield, so overlapping callers really overlap.
    await Promise.resolve();
    if (this.error) throw this.error;
    return [{ name: "view_expenses" } as unknown as BaseTool];
  }
  async close(): Promise<void> {}
}

const turn = (token: string) => ({ harnessToken: token, wdTenant: "test-tenant" });

test("lists the MCP tools once per turn, not before every model call", async () => {
  // ADK asks for the tools twice before each model call; each ask is a new
  // MCP session and more work in Agent Harness.
  const inner = new CountingToolset();
  const toolset = new OptionalToolset(inner);

  await withTurnCredentials(turn("turn-1"), async () => {
    await toolset.getTools();
    await toolset.getTools();
    await toolset.getTools();
  });

  assert.equal(inner.calls, 1);
});

test("reuses the tool list across turns with different tokens until the TTL expires", async () => {
  // Agent Harness sends a new token every turn, so the token cannot be the cache key.
  let clock = 0;
  const inner = new CountingToolset();
  const toolset = new OptionalToolset(inner, { ttlMs: 600_000, now: () => clock });

  await withTurnCredentials(turn("turn-1"), () => toolset.getTools());
  clock = 599_000;
  await withTurnCredentials(turn("turn-2"), () => toolset.getTools());
  assert.equal(inner.calls, 1);

  clock = 600_001;
  await withTurnCredentials(turn("turn-3"), () => toolset.getTools());
  assert.equal(inner.calls, 2);
});

test("concurrent calls share one in-flight listing", async () => {
  // ADK asks for the tools twice before each model call, at the same time.
  const inner = new CountingToolset();
  const toolset = new OptionalToolset(inner);

  const results = await withTurnCredentials(turn("turn-1"), () => Promise.all([toolset.getTools(), toolset.getTools()]));

  assert.equal(inner.calls, 1);
  assert.deepEqual(results[0], results[1]);
});

test("a refresh after the TTL that fails drops the cached list and returns no tools", async () => {
  let clock = 0;
  const inner = new CountingToolset();
  const toolset = new OptionalToolset(inner, { ttlMs: 600_000, now: () => clock });

  assert.equal((await withTurnCredentials(turn("turn-1"), () => toolset.getTools())).length, 1);

  clock = 600_001;
  inner.error = new Error("HTTP 403");
  assert.deepEqual(await withTurnCredentials(turn("turn-2"), () => toolset.getTools()), []);

  // The stale list is gone: once Agent Harness recovers, the next turn lists again.
  inner.error = undefined;
  assert.equal((await withTurnCredentials(turn("turn-3"), () => toolset.getTools())).length, 1);
  assert.equal(inner.calls, 3);
});

test("does not share a cached tool list across tenants", async () => {
  const inner = new CountingToolset();
  const toolset = new OptionalToolset(inner);

  await withTurnCredentials({ harnessToken: "a", wdTenant: "t1" }, () => toolset.getTools());
  await withTurnCredentials({ harnessToken: "b", wdTenant: "t2" }, () => toolset.getTools());

  assert.equal(inner.calls, 2);
});

test("a failed listing is not kept for later turns", async () => {
  const inner = new CountingToolset(new Error("HTTP 403"));
  const toolset = new OptionalToolset(inner);

  await withTurnCredentials(turn("turn-1"), () => toolset.getTools());
  await withTurnCredentials(turn("turn-2"), () => toolset.getTools());

  assert.equal(inner.calls, 2);
});

test("does not list tools when there is no token (e.g. at startup)", async () => {
  const inner = new CountingToolset(new Error("X-ACR-Token is not available"));
  const toolset = new OptionalToolset(inner);

  const results = [await toolset.getTools(), await toolset.getTools()];

  assert.deepEqual(results, [[], []]);
  assert.equal(inner.calls, 0);
});

test("lists tools on the first turn that has a token after a tokenless call", async () => {
  const inner = new CountingToolset();
  const toolset = new OptionalToolset(inner);

  assert.deepEqual(await toolset.getTools(), []);
  const tools = await withTurnCredentials(turn("turn-1"), () => toolset.getTools());

  assert.equal(tools.length, 1);
  assert.equal(inner.calls, 1);
});

test("does not retry an unavailable MCP server within the same turn", async () => {
  const inner = new CountingToolset(new Error("HTTP 403"));
  const toolset = new OptionalToolset(inner);

  const results = await withTurnCredentials(turn("turn-1"), async () => [await toolset.getTools(), await toolset.getTools()]);

  assert.deepEqual(results, [[], []]);
  assert.equal(inner.calls, 1);
});
