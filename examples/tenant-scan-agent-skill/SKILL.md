---
name: tenant-scan
description: Summarises what a Workday tenant offers from a single scan of its data sources, worker and organization counts and live capabilities. Use when an implementer wants to know what a tenant can do before building. Do not use to change anything, to state a figure the scan did not return, or to guess why something is unavailable.
---

# Tenant scan

Call the scan once, explain it in plain words, and go deeper only by searching a named area.

## Decision

| Request | Workday operation | Notes |
| --- | --- | --- |
| What does this tenant offer | WQL `dataSources` and REST common/v1 `supervisoryOrganizations` | One scan |
| Search one area | WQL `dataSources` | By name |
| Fields of a source | WQL `dataSources` fields | Aliases it exposes |

## Hard rules

- Nothing here changes Workday, so there is no proposal. Say so if asked to change something. Facts come only from the scan and the reads that follow it.
- Summarise the data sources by area, the worker and organization counts, and, if your platform records which operations it has used on this tenant, which are used, not available (with the reason) or not checked yet.
- If a part says it is not available, give its reason. Anything unanswered is Not available.
- Every figure you state must come from a tool result. Never estimate or write a statistic yourself.
- When many operations are not checked yet, say so and do not imply that they work.
- If the scan is refused, the account lacks the WQL and Organization domains the scan uses. Name them. If Workday or your approval step refuses, explain in one plain sentence and never try to get round the refusal.

## Output format

A short plain summary by area, then a list of not available items with reasons.

## Test questions

- "What can this tenant do?"
- "Which data sources exist for learning?"
- "How many workers will we have next year?"
