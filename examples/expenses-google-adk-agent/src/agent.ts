import { LlmAgent } from "@google/adk";
import { HarnessLLM } from "./harness-llm.js";
import { createHarnessMcpToolset } from "./harness-mcp.js";

const model = process.env.WORKDAY_AGENT_HARNESS_MODEL ?? "auto/auto";

export const rootAgent = new LlmAgent({
  name: "expenses_agent",
  model: new HarnessLLM({ model }),
  description:
    "Template Custom Agent: answers through Workday Agent Harness's model inference and uses Workday tools through its MCP route.",
  instruction:
    "You are a Workday assistant. When the user asks about their Workday data, use the available " +
    "tools and answer from their results. If no tool fits, or no tools are available, reply with a " +
    "short, friendly sentence.",
  tools: [createHarnessMcpToolset()],
});
