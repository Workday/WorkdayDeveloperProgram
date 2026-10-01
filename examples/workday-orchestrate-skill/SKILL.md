---
name: workday-orchestrate
description: Reviews and writes Workday Orchestrate and Integration App flows. Use when editing .orchestration or .suborchestration files, listeners, or Orchestrate expression language. Do not use for .pmd pages or .amd files.
---

# Workday Orchestrate

Review or write orchestration files. Report only genuine problems.

Open first: `catalog/orchestrateForIntegrationsSampler/orchestration/GetWorkers.orchestration`. For a real outbound integration, open `catalog/employeeDemographicOutbound`.

## Rules

- Keep `flowVersion`, `_type` `Flow`, and `_value` when editing a catalog flow. Add a step by cloning a nearby step in the same file.
- Keep the flow name equal to the file name without `.orchestration`.
- Do not rewrite a Maya flow into a simplified `listener` and `steps` document. Use that shape only to decide what the flow must do.
- Use single quotes for string literals inside an expression. Use `?.` before a field that may be missing, and `??` for a fallback.
- Use `jsonpath()` for JSON and `xpath()` for XML. Do not hand-parse either.
- Use client credentials for a headless system-to-system call. Never put a client secret, password, or certificate body in the orchestration JSON.
- Grant an Integration System User only the GET or PUT operations the flow calls.
- Retry status codes 429, 500, 502, 503, and 504. Do not retry 400 or 401.

## Output format

For each issue, state the file and line, name the rule, and show a short before and after. Skip clean files.

## Test questions

- "Can I replace this Maya flow with a listener and steps JSON object?"
- "Where should the client secret live?"
- "Which HTTP status codes should the outbound step retry?"
