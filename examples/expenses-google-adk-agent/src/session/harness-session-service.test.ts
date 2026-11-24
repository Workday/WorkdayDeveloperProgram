import assert from "node:assert/strict";
import { test } from "node:test";
import { createEvent, type Event } from "@google/adk";
import { HarnessSessionService, type HarnessCredentials, type SessionLogEntry } from "./harness-session-service.js";

const TOKEN = "secret-token-value";
const credentials: HarnessCredentials = { harnessToken: TOKEN, wdTenant: "test-tenant", harnessUrl: "https://harness.test" };

// Stands in for the agent's per-turn credential store.
let current: HarnessCredentials | undefined;
const turnCredentials = () => current;

async function withTurnCredentials<T>(value: HarnessCredentials, fn: () => Promise<T>): Promise<T> {
  current = value;
  try {
    return await fn();
  } finally {
    current = undefined;
  }
}

interface StoredSession {
  id: string;
  appName: string;
  userId: string;
  state: Record<string, unknown>;
  events: Event[];
}

// Fake Workday Agent Harness with the three session routes. `contextId` stands for the
// turn's session (none on turn 1). `fail` makes the next calls fail.
class FakeHarness {
  sessions = new Map<string, StoredSession>();
  calls: string[] = [];
  contextId: string | undefined;
  fail: Array<number | "network"> = [];

  fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    this.calls.push(`${method} ${url.pathname}`);
    const headers = init?.headers as Record<string, string>;
    assert.equal(headers["x-acr-token"], TOKEN);
    assert.equal(headers["wd-tenant"], "test-tenant");
    const failure = this.fail.shift();
    if (failure === "network") throw new TypeError("fetch failed");
    if (failure !== undefined) return new Response("{}", { status: failure });
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;

    if (method === "GET" && url.pathname === "/sandbox/v1/sessions") {
      const session = this.contextId ? this.sessions.get(this.contextId) : undefined;
      if (!session) return Response.json({ detail: "not found" }, { status: 404 });
      return Response.json({ ...session, lastUpdateTime: 1 });
    }
    if (method === "POST" && url.pathname === "/sandbox/v1/sessions") {
      if (this.sessions.has(body.sessionId)) return Response.json({}, { status: 409 });
      const session = { id: body.sessionId, appName: body.appName, userId: body.userId, state: body.state, events: [] };
      this.sessions.set(session.id, session);
      return Response.json({ ...session, lastUpdateTime: 1 }, { status: 201 });
    }
    const match = url.pathname.match(/^\/sandbox\/v1\/sessions\/([^/]+)\/events$/);
    if (method === "POST" && match) {
      const session = this.sessions.get(decodeURIComponent(match[1]));
      if (!session) return Response.json({}, { status: 404 });
      const index = session.events.findIndex((event) => event.id === body.id);
      if (index >= 0) session.events[index] = body;
      else session.events.push(body);
      Object.assign(session.state, body.actions?.stateDelta ?? {});
      return Response.json({ lastUpdateTime: 1234 });
    }
    return new Response("{}", { status: 500 });
  };
}

function setup() {
  const harness = new FakeHarness();
  const logs: SessionLogEntry[] = [];
  const service = new HarnessSessionService({ credentials: turnCredentials, fetch: harness.fetch, logger: (entry) => logs.push(entry) });
  return { harness, logs, service };
}

function userEvent(text: string, stateDelta: Record<string, unknown> = {}): Event {
  return createEvent({
    author: "user",
    invocationId: "inv-1",
    content: { role: "user", parts: [{ text }] },
    actions: { stateDelta, artifactDelta: {}, requestedAuthConfigs: {}, requestedToolConfirmations: {} },
  });
}

const key = { appName: "agent", userId: "A2A_USER_ctx-1", sessionId: "ctx-1" };

// The calls ADK makes in one A2A turn: executor get (+ create), runner get.
async function startTurn(service: HarnessSessionService) {
  const session = (await service.getSession(key)) ?? (await service.createSession(key));
  const again = await service.getSession(key);
  assert.ok(again);
  return session;
}

test("turn 1 creates the session and serves the second get from memory", async () => {
  const { harness, service } = setup();
  await withTurnCredentials(credentials, async () => {
    const session = await startTurn(service);
    await service.appendEvent({ session, event: userEvent("hello", { turn: 1 }) });
    assert.equal(session.lastUpdateTime, 1234);
  });
  assert.deepEqual(harness.calls, [
    "GET /sandbox/v1/sessions",
    "POST /sandbox/v1/sessions",
    "POST /sandbox/v1/sessions/ctx-1/events",
  ]);
  assert.deepEqual(harness.sessions.get("ctx-1")?.state, { turn: 1 });
});

test("a new process loads the session from the Agent Harness", async () => {
  const first = setup();
  await withTurnCredentials(credentials, async () => {
    const session = await startTurn(first.service);
    await first.service.appendEvent({ session, event: userEvent("hello", { turn: 1 }) });
  });

  const second = new HarnessSessionService({ credentials: turnCredentials, fetch: first.harness.fetch, logger: () => {} });
  first.harness.contextId = "ctx-1";
  await withTurnCredentials(credentials, async () => {
    const session = await startTurn(second);
    assert.equal(session.events.length, 1);
    assert.deepEqual(session.state, { turn: 1 });
  });
});

test("partial events and temp: keys are not stored", async () => {
  const { harness, service } = setup();
  await withTurnCredentials(credentials, async () => {
    const session = await startTurn(service);
    const partial = userEvent("par");
    partial.partial = true;
    await service.appendEvent({ session, event: partial });
    await service.appendEvent({ session, event: userEvent("full", { "temp:scratch": 1, kept: 2 }) });
  });
  const stored = harness.sessions.get("ctx-1")!;
  assert.equal(stored.events.length, 1);
  assert.deepEqual(stored.events[0].actions.stateDelta, { kept: 2 });
  assert.deepEqual(stored.state, { kept: 2 });
});

test("a failed append is queued and later events wait behind it, in order", async () => {
  const { harness, logs, service } = setup();
  await withTurnCredentials(credentials, async () => {
    const session = await startTurn(service);
    harness.fail = [503];
    await service.appendEvent({ session, event: userEvent("one", { x: 1 }) });
    harness.fail = ["network"];
    await service.appendEvent({ session, event: userEvent("two", { x: 2 }) });
    assert.equal(harness.sessions.get("ctx-1")!.events.length, 0);
    // The turn continues: memory has both events.
    assert.equal(session.events.length, 2);
    await service.appendEvent({ session, event: userEvent("three", { x: 3 }) });
  });
  const stored = harness.sessions.get("ctx-1")!;
  assert.deepEqual(
    stored.events.map((event) => event.content?.parts?.[0].text),
    ["one", "two", "three"],
  );
  assert.deepEqual(stored.state, { x: 3 });
  assert.ok(logs.some((entry) => entry.level === "error" && entry.status === 503));
  assert.ok(logs.some((entry) => entry.level === "error" && entry.error === "TypeError: fetch failed"));
});

test("the queue is sent on the next turn with that turn's credentials", async () => {
  const { harness, service } = setup();
  let session!: Awaited<ReturnType<typeof startTurn>>;
  await withTurnCredentials(credentials, async () => {
    session = await startTurn(service);
    harness.fail = [500];
    await service.appendEvent({ session, event: userEvent("one") });
  });
  // The last write of turn 1 failed; nothing retries between turns.
  assert.equal(harness.sessions.get("ctx-1")!.events.length, 0);
  await withTurnCredentials(credentials, async () => {
    const next = await startTurn(service);
    assert.equal(next, session);
    await service.appendEvent({ session: next, event: userEvent("two") });
  });
  assert.equal(harness.sessions.get("ctx-1")!.events.length, 2);
});

test("a rejected append is dropped and does not block later events", async () => {
  const { harness, logs, service } = setup();
  await withTurnCredentials(credentials, async () => {
    const session = await startTurn(service);
    harness.fail = [400];
    await service.appendEvent({ session, event: userEvent("bad") });
    await service.appendEvent({ session, event: userEvent("good") });
  });
  assert.deepEqual(
    harness.sessions.get("ctx-1")!.events.map((event) => event.content?.parts?.[0].text),
    ["good"],
  );
  assert.ok(logs.some((entry) => entry.message.includes("dropped") && entry.status === 400));
});

test("a failed create is queued and sent before the first event", async () => {
  const { harness, service } = setup();
  await withTurnCredentials(credentials, async () => {
    harness.fail = [404, 502];
    const session = await startTurn(service);
    await service.appendEvent({ session, event: userEvent("hello") });
  });
  assert.equal(harness.sessions.get("ctx-1")!.events.length, 1);
});

test("a full queue drops the oldest event, never the create", async () => {
  const harness = new FakeHarness();
  const logs: SessionLogEntry[] = [];
  const service = new HarnessSessionService({ credentials: turnCredentials, fetch: harness.fetch, logger: (entry) => logs.push(entry), maxPendingOperations: 2 });
  const session = await startTurn(service);
  await service.appendEvent({ session, event: userEvent("one") });
  await service.appendEvent({ session, event: userEvent("two") });
  await withTurnCredentials(credentials, async () => {
    await service.appendEvent({ session, event: userEvent("three") });
  });
  assert.deepEqual(
    harness.sessions.get("ctx-1")?.events.map((event) => event.content?.parts?.[0].text),
    ["three"],
  );
  assert.ok(logs.some((entry) => entry.message.includes("queue full") && entry.operation === "appendEvent"));
  assert.ok(!logs.some((entry) => entry.message.includes("queue full") && entry.operation === "createSession"));
});

test("a failed read starts an empty session; create 409 loads it when possible", async () => {
  const { harness, logs, service } = setup();
  harness.sessions.set("ctx-1", { ...key, id: "ctx-1", state: { turn: 4 }, events: [userEvent("old")] });
  harness.contextId = "ctx-1";
  await withTurnCredentials(credentials, async () => {
    harness.fail = [503];
    const session = await startTurn(service);
    // The read failed, the create got 409, and the second read worked.
    assert.equal(session.events.length, 1);
    assert.deepEqual(session.state, { turn: 4 });
  });
  assert.ok(logs.some((entry) => entry.operation === "getSession" && entry.status === 503));
});

test("a session with another id is not returned", async () => {
  const { harness, service } = setup();
  harness.sessions.set("other", { ...key, id: "other", state: {}, events: [] });
  harness.contextId = "other";
  await withTurnCredentials(credentials, async () => {
    assert.equal(await service.getSession(key), undefined);
  });
});

test("no credentials: nothing is sent, the turn continues, and the queue waits", async () => {
  const { harness, logs, service } = setup();
  const session = await startTurn(service);
  await service.appendEvent({ session, event: userEvent("hello") });
  assert.deepEqual(harness.calls, []);
  assert.ok(logs.some((entry) => entry.level === "error" && entry.message.includes("No turn credentials")));
  await withTurnCredentials(credentials, async () => {
    await service.appendEvent({ session, event: userEvent("again") });
  });
  assert.equal(harness.sessions.get("ctx-1")!.events.length, 2);
});

test("logs never contain the token", async () => {
  const { harness, logs, service } = setup();
  await withTurnCredentials(credentials, async () => {
    harness.fail = [500, "network", 403];
    const session = await startTurn(service);
    await service.appendEvent({ session, event: userEvent("hello") });
  });
  assert.ok(logs.length > 0);
  assert.ok(!JSON.stringify(logs).includes(TOKEN));
});

test("listSessions and deleteSession are not supported", async () => {
  const { service } = setup();
  await assert.rejects(service.listSessions(), /not supported/);
  await assert.rejects(service.deleteSession(), /not supported/);
});
