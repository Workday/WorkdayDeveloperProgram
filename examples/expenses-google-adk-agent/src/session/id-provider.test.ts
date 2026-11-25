import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createEvent, newId, resetIdProvider, setIdProvider } from "@google/adk";
import { HarnessSessionService } from "./harness-session-service.js";
import { installUrandomIdProvider, urandomUuid } from "./urandom-uuid.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// The provider is global to the process.
afterEach(() => resetIdProvider());

test("urandomUuid returns distinct v4 UUIDs", () => {
  const first = urandomUuid();
  const second = urandomUuid();
  assert.match(first, UUID);
  assert.match(second, UUID);
  assert.notEqual(first, second);
});

test("a UUID source that throws is not installed", () => {
  const failing = () => {
    throw new Error("ENOENT: /dev/urandom");
  };
  assert.equal(installUrandomIdProvider(failing), false);
  // ADK's default event id is 8 alphanumeric characters.
  assert.match(createEvent({ author: "user" }).id, /^[A-Za-z0-9]{8}$/);
});

test("the session service installs a UUID id provider by default", () => {
  new HarnessSessionService({ credentials: () => undefined });
  const ids = Array.from({ length: 1000 }, () => createEvent({ author: "user" }).id);
  assert.ok(ids.every((id) => UUID.test(id)));
  assert.equal(new Set(ids).size, ids.length);
  assert.match(newId(), UUID);
});

test("installIdProvider: false leaves ADK's default event ids", () => {
  new HarnessSessionService({ credentials: () => undefined, installIdProvider: false });
  // ADK's default event id is 8 alphanumeric characters.
  assert.match(createEvent({ author: "user" }).id, /^[A-Za-z0-9]{8}$/);
});

test("createSession without a sessionId takes its id from the provider", async () => {
  const service = new HarnessSessionService({ credentials: () => undefined, installIdProvider: false, logger: () => {} });
  setIdProvider(() => "provided-id");
  const session = await service.createSession({ appName: "agent", userId: "user" });
  assert.equal(session.id, "provided-id");
});
