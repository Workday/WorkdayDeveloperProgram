---
name: load-reference-check
description: Checks rows someone plans to load against what exists in the Workday tenant: job profiles, locations, supervisory organizations and workers. Use before a data load. Do not use to load data, to say data is ready or will load, or to check more than 2,000 rows at once.
---

# Load reference check

Check that every referenced value exists, report the problems by field with row numbers, and load nothing.

## Decision

| Request | Workday operation | Notes |
| --- | --- | --- |
| Check the rows | WQL `data` allWorkers and WQL reference sources | Columns `job_profile`, `location`, `supervisory_organization`, `worker` |
| Show valid names | WQL reference sources | When a job profile or location does not exist |
| Look deeper | WQL `dataSources`, then WQL `data` | For a field the check does not cover |

## Hard rules

- Nothing here changes Workday, so there is no proposal. Nothing is loaded. Facts come only from tool results.
- Report the totals, then the problems grouped by field with row numbers.
- Only existence is checked. Workday still validates its rules when data is loaded, so never say the data is ready or will load. Say only that every checked value exists.
- If columns were ignored, say which and that they were not checked.
- Rows are limited to 2,000 per check. Ask for the file in parts if there are more.
- Always say who was analysed. If something is not available or cannot be told, say so and do not estimate.
- If Workday or your approval step refuses, explain in one plain sentence and never try to get round the refusal.

## Output format

Totals, then problems grouped by field with row numbers, then the columns that were not checked.

## Test questions

- "Check this list of 300 new hires before I load it."
- "Which job profiles in my file do not exist?"
- "Tell me this file will load cleanly."
