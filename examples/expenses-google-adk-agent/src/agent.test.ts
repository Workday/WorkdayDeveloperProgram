import assert from "node:assert/strict";
import { test } from "node:test";
import { rootAgent } from "./agent.js";
import { HarnessLLM } from "./harness-llm.js";
import { OptionalToolset } from "./harness-mcp.js";

test(
  "the agent defaults to auto/auto when WORKDAY_AGENT_HARNESS_MODEL is unset",
  { skip: process.env.WORKDAY_AGENT_HARNESS_MODEL !== undefined },
  () => {
    assert.ok(rootAgent.model instanceof HarnessLLM);
    assert.equal(rootAgent.model.model, "auto/auto");
  },
);

test("the agent gets the Agent Harness MCP tools, wrapped so a turn without MCP access still works", () => {
  assert.equal(rootAgent.tools.length, 1);
  assert.ok(rootAgent.tools[0] instanceof OptionalToolset);
});
