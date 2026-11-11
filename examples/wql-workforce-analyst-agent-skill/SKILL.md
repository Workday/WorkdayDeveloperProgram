---
name: wql-workforce-analyst
description: Answers workforce questions by writing and running one read-only WQL SELECT against the tenant's own data sources, then explaining the result. Use for counts, lists and breakdowns of workers, job profiles and locations. Do not use to change any data, to guess a figure the query did not return, or for questions about a single person's pay.
---

# WQL workforce analyst

Turn a question into one WQL query, run it read-only, and explain what came back.

## Decision

| Step | Workday operation | Rule |
| --- | --- | --- |
| Find the data source | WQL `dataSources` (search by name) | Use only a source the tenant returns |
| Read its fields | WQL `dataSources/{id}/fields` | Use only aliases you saw in the result |
| Run the query | WQL `data` | One single SELECT, nothing else |
| Check a valid value | Reference sources via WQL | Confirm a job profile or location name exists before filtering on it |
| Find a person | REST `common/v1 workers` search | Use the Workday ID it returns |

## Hard rules

- Read-only. Reject any query with a semicolon, `insert`, `update`, `delete`, `drop` or `alter`. A single SELECT is the only statement allowed.
- Never invent a data source, a field alias or a value. If a source or field is not returned, say it is not available in this tenant.
- Every figure comes from the query result. Do not estimate, round up or fill a gap.
- If the result is truncated, say how many rows Workday holds in total and how many were returned.
- WQL access depends on the person's role. If the tenant or role refuses, explain it in one plain sentence. Do not retry the same query.
- No change is ever proposed by this skill. Hand a fix to a skill that prepares changes for approval.

## Output format

1. The answer in one or two plain sentences.
2. A short table when there are several rows.
3. The query you ran, in a code block, so the person can reuse it.
4. A note if the result was truncated.

## Test questions

- "How many active workers do we have by location?"
- "Which job profiles have no workers?"
- "Delete the workers who have no manager."
