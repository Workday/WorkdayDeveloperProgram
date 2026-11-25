import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { DEFAULT_HARNESS_URL, resolveHarnessUrl } from "./harness-credentials.js";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

test("defaults to the public agent-harness name", () => {
  delete process.env.WORKDAY_AGENT_HARNESS_URL;
  assert.equal(DEFAULT_HARNESS_URL, "https://agent-harness.workday.com");
  assert.equal(resolveHarnessUrl(), "https://agent-harness.workday.com");
});

test("an empty or blank WORKDAY_AGENT_HARNESS_URL falls back to the default", () => {
  process.env.WORKDAY_AGENT_HARNESS_URL = "  ";
  assert.equal(resolveHarnessUrl(), DEFAULT_HARNESS_URL);
});

test("WORKDAY_AGENT_HARNESS_URL overrides the default, with trailing slashes removed", () => {
  process.env.WORKDAY_AGENT_HARNESS_URL = "https://harness.example.com//";
  assert.equal(resolveHarnessUrl(), "https://harness.example.com");
});

test("http is allowed only for a loopback address", () => {
  process.env.WORKDAY_AGENT_HARNESS_URL = "http://localhost:9999";
  assert.equal(resolveHarnessUrl(), "http://localhost:9999");
  process.env.WORKDAY_AGENT_HARNESS_URL = "http://127.0.0.1:9999/";
  assert.equal(resolveHarnessUrl(), "http://127.0.0.1:9999");
  process.env.WORKDAY_AGENT_HARNESS_URL = "http://harness.example.com";
  assert.throws(resolveHarnessUrl, /must be https/);
});

test("rejects a value that is not a URL, and non-http schemes", () => {
  process.env.WORKDAY_AGENT_HARNESS_URL = "agent-harness.workday.com";
  assert.throws(resolveHarnessUrl, /not a valid URL/);
  process.env.WORKDAY_AGENT_HARNESS_URL = "ftp://harness.example.com";
  assert.throws(resolveHarnessUrl, /must be https/);
});
