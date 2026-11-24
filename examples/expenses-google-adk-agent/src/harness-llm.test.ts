import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import type { LlmRequest } from "@google/adk";
import { HarnessLLM } from "./harness-llm.js";
import { getTurnCredentials, withTurnCredentials } from "./turn-credentials.js";

const ORIGINAL_ENV = { ...process.env };
const WORKDAY_URL = "https://harness.example.com";

beforeEach(() => {
  process.env.WORKDAY_AGENT_HARNESS_URL = WORKDAY_URL;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function makeRequest(text: string): LlmRequest {
  return {
    contents: [{ role: "user", parts: [{ text }] }],
    liveConnectConfig: {},
    toolsDict: {},
  };
}

const DEFAULT_CREDENTIALS = { harnessToken: "test-token", wdTenant: "acme-corp" };

// Credentials only come from the inbound request's headers, so a test that
// doesn't set its own turn credentials gets these defaults.
async function collect<T>(gen: AsyncGenerator<T, void>): Promise<T[]> {
  const run = async () => {
    const out: T[] = [];
    for await (const item of gen) out.push(item);
    return out;
  };
  return getTurnCredentials() ? run() : withTurnCredentials(DEFAULT_CREDENTIALS, run);
}

// beforeEach points WORKDAY_AGENT_HARNESS_URL at WORKDAY_URL so no test calls the real
// default address; the two tests that exercise the default clear it.

test("sends the X-ACR-Token and wd-tenant headers, forwards the model + messages", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ choices: [{ message: { content: "hi there" } }] }), {
      status: 200,
    });
  }) as typeof fetch;

  const llm = new HarnessLLM({ model: "auto/auto", fetchImpl });

  const responses = await withTurnCredentials(DEFAULT_CREDENTIALS, () =>
    collect(llm.generateContentAsync(makeRequest("hello"))),
  );

  assert.equal(responses.length, 1);
  assert.equal(responses[0].content?.parts?.[0]?.text, "hi there");
  assert.equal(responses[0].turnComplete, true);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://harness.example.com/sandbox/v1/chat/completions");
  const headers = calls[0].init.headers as Record<string, string>;
  assert.equal(headers["x-acr-token"], "test-token");
  assert.equal(headers["wd-tenant"], "acme-corp");

  const body = JSON.parse(calls[0].init.body as string);
  assert.equal(body.model, "auto/auto");
  assert.deepEqual(body.messages, [{ role: "user", content: "hello" }]);
});

test("raises when the X-ACR-Token header is missing", async () => {
  const llm = new HarnessLLM({
    model: "auto/auto",
    fetchImpl: (async () => {
      throw new Error("fetch should not be called");
    }) as typeof fetch,
  });

  await assert.rejects(
    () =>
      withTurnCredentials({ wdTenant: "acme-corp" }, () =>
        collect(llm.generateContentAsync(makeRequest("hello"))),
      ),
    /X-ACR-Token is not available/,
  );
});

test("raises when the wd-tenant header is missing", async () => {
  const llm = new HarnessLLM({
    model: "auto/auto",
    fetchImpl: (async () => {
      throw new Error("fetch should not be called");
    }) as typeof fetch,
  });

  await assert.rejects(
    () =>
      withTurnCredentials({ harnessToken: "test-token" }, () =>
        collect(llm.generateContentAsync(makeRequest("hello"))),
      ),
    /wd-tenant is not available/,
  );
});

test("calls https://agent-harness.workday.com when WORKDAY_AGENT_HARNESS_URL is not set", async () => {
  delete process.env.WORKDAY_AGENT_HARNESS_URL;
  const calls: string[] = [];
  const fetchImpl = (async (url: string) => {
    calls.push(url);
    return new Response(JSON.stringify({ choices: [{ message: { content: "hi" } }] }), { status: 200 });
  }) as typeof fetch;

  const llm = new HarnessLLM({ model: "auto/auto", fetchImpl });
  await collect(llm.generateContentAsync(makeRequest("hello")));

  assert.deepEqual(calls, ["https://agent-harness.workday.com/sandbox/v1/chat/completions"]);
});

test("the Agent Harness address never comes from turn data", async () => {
  const calls: string[] = [];
  const fetchImpl = (async (url: string) => {
    calls.push(url);
    return new Response(JSON.stringify({ choices: [{ message: { content: "hi" } }] }), { status: 200 });
  }) as typeof fetch;

  const llm = new HarnessLLM({ model: "auto/auto", fetchImpl });
  // A value an attacker could put in the turn data.
  const turn = { ...DEFAULT_CREDENTIALS, workdayUrl: "https://attacker.example" } as Record<string, string>;
  await withTurnCredentials(turn, () => collect(llm.generateContentAsync(makeRequest("hello"))));

  assert.deepEqual(calls, [`${WORKDAY_URL}/sandbox/v1/chat/completions`]);
});

test("raises before any network call when WORKDAY_AGENT_HARNESS_URL is not https", async () => {
  process.env.WORKDAY_AGENT_HARNESS_URL = "http://harness.example.com";
  const llm = new HarnessLLM({
    model: "auto/auto",
    fetchImpl: (async () => {
      throw new Error("fetch should not be called");
    }) as typeof fetch,
  });

  await assert.rejects(() => collect(llm.generateContentAsync(makeRequest("hello"))), /WORKDAY_AGENT_HARNESS_URL must be https/);
});

test("forwards systemInstruction as a system message, not a user message", async () => {
  const calls: Array<{ init: RequestInit }> = [];
  const fetchImpl = (async (_url: string, init: RequestInit) => {
    calls.push({ init });
    return new Response(JSON.stringify({ choices: [{ message: { content: "hi there" } }] }), {
      status: 200,
    });
  }) as typeof fetch;

  const llm = new HarnessLLM({ model: "auto/auto", fetchImpl });

  const request: LlmRequest = {
    ...makeRequest("hello"),
    config: { systemInstruction: "Reply with a short, friendly one-sentence greeting." },
  };
  await withTurnCredentials(DEFAULT_CREDENTIALS, () =>
    collect(llm.generateContentAsync(request)),
  );

  const body = JSON.parse(calls[0].init.body as string);
  assert.deepEqual(body.messages, [
    { role: "system", content: "Reply with a short, friendly one-sentence greeting." },
    { role: "user", content: "hello" },
  ]);
});

test("sends this turn's credentials", async () => {
  const calls: Array<{ init: RequestInit }> = [];
  const fetchImpl = (async (_url: string, init: RequestInit) => {
    calls.push({ init });
    return new Response(JSON.stringify({ choices: [{ message: { content: "hi there" } }] }), {
      status: 200,
    });
  }) as typeof fetch;

  const llm = new HarnessLLM({ model: "auto/auto", fetchImpl });

  await withTurnCredentials(
    { harnessToken: "turn-token", wdTenant: "turn-tenant" },
    () => collect(llm.generateContentAsync(makeRequest("hello"))),
  );

  const headers = calls[0].init.headers as Record<string, string>;
  assert.equal(headers["x-acr-token"], "turn-token");
  assert.equal(headers["wd-tenant"], "turn-tenant");
});

test("raises on a non-2xx response from Workday Agent Harness", async () => {
  const fetchImpl = (async () =>
    new Response("missing wd-tenant header", { status: 400 })) as typeof fetch;

  const llm = new HarnessLLM({ model: "auto/auto", fetchImpl });

  await withTurnCredentials(DEFAULT_CREDENTIALS, () =>
    assert.rejects(() => collect(llm.generateContentAsync(makeRequest("hello"))), /HTTP 400/),
  );
});

test("does not leak the upstream response body into the thrown error", async () => {
  // If Workday Agent Harness forwards a verbose/sensitive inference error body verbatim, it
  // must not leak into whatever logs Node/ADK write for an uncaught error.
  const sensitiveBody = "upstream error for tenant acme-corp, detail=sensitive-0000";
  const fetchImpl = (async () => new Response(sensitiveBody, { status: 502 })) as typeof fetch;

  const llm = new HarnessLLM({ model: "auto/auto", fetchImpl });

  await withTurnCredentials(DEFAULT_CREDENTIALS, async () => {
    try {
      await collect(llm.generateContentAsync(makeRequest("hello")));
      assert.fail("expected generateContentAsync to throw");
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      assert.equal(messageText, "Workday Agent Harness inference call failed: HTTP 502");
      assert.ok(!messageText.includes("sensitive-0000"), "thrown message must not include the upstream body");
    }
  });
});

test("raises when Workday Agent Harness returns an empty choices array", async () => {
  const fetchImpl = (async () =>
    new Response(JSON.stringify({ choices: [] }), { status: 200 })) as typeof fetch;

  const llm = new HarnessLLM({ model: "auto/auto", fetchImpl });

  await withTurnCredentials(DEFAULT_CREDENTIALS, () =>
    assert.rejects(
      () => collect(llm.generateContentAsync(makeRequest("hello"))),
      /choices\[0\]\.message\.content is empty/,
    ),
  );
});

test("raises when Workday Agent Harness returns a choice with empty message content", async () => {
  const fetchImpl = (async () =>
    new Response(JSON.stringify({ choices: [{ message: {} }] }), { status: 200 })) as typeof fetch;

  const llm = new HarnessLLM({ model: "auto/auto", fetchImpl });

  await withTurnCredentials(DEFAULT_CREDENTIALS, () =>
    assert.rejects(
      () => collect(llm.generateContentAsync(makeRequest("hello"))),
      /choices\[0\]\.message\.content is empty/,
    ),
  );
});

test("raises with context when Workday Agent Harness returns a non-JSON body", async () => {
  const fetchImpl = (async () => new Response("<html>502 Bad Gateway</html>", { status: 200 })) as typeof fetch;

  const llm = new HarnessLLM({ model: "auto/auto", fetchImpl });

  await withTurnCredentials(DEFAULT_CREDENTIALS, () =>
    assert.rejects(
      () => collect(llm.generateContentAsync(makeRequest("hello"))),
      /Workday Agent Harness returned HTTP 200 with a non-JSON body/,
    ),
  );
});

test("aborts and throws when Workday Agent Harness does not respond within the configured timeout", async () => {
  const fetchImpl = ((_url: string, init: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      const signal = init.signal as AbortSignal;
      signal.addEventListener("abort", () => reject(new Error("simulated network abort")));
    })) as typeof fetch;

  const llm = new HarnessLLM({ model: "auto/auto", fetchImpl, timeoutMs: 10 });

  await withTurnCredentials(DEFAULT_CREDENTIALS, () =>
    assert.rejects(
      () => collect(llm.generateContentAsync(makeRequest("hello"))),
      /Workday Agent Harness call timed out after 10ms/,
    ),
  );
});

test("does not time out when Workday Agent Harness responds before the deadline", async () => {
  const fetchImpl = (async () =>
    new Response(JSON.stringify({ choices: [{ message: { content: "hi there" } }] }), {
      status: 200,
    })) as typeof fetch;

  const llm = new HarnessLLM({ model: "auto/auto", fetchImpl, timeoutMs: 10 });

  const responses = await withTurnCredentials(DEFAULT_CREDENTIALS, () =>
    collect(llm.generateContentAsync(makeRequest("hello"))),
  );
  assert.equal(responses[0].content?.parts?.[0]?.text, "hi there");
});
