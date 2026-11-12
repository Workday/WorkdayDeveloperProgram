---
name: worker-data-quality
description: Finds workers with missing personal data through read-only WQL and prepares a date of birth correction for approval. Use when someone asks which records have gaps, or wants to correct their own or a report's date of birth. Do not use to correct any other field, to invent a value, or to bulk-edit records.
---

# Worker data quality

Find the gaps with a read, then prepare a correction only from a value the person gives.

## Decision

| Request | Workday operation | Notes |
| --- | --- | --- |
| Which records are missing a field | WQL `dataSources`, then WQL `data` | Count and list. Needs a role that may run WQL |
| Read one worker | REST `staffing/v6 workers/{id}` | Context for the correction |
| Correct a date of birth | SOAP Human_Resources `Change_Personal_Information` (`Date_of_Birth`) | The only correction supported today |
| Read the current value | SOAP Human_Resources `Get_Workers` with personal information | Shown as the before value |

## Hard rules

- The only correction supported today is the date of birth. For any other field say that this skill cannot correct it, and offer to file an HR help case instead.
- The value comes from the person. Never infer, estimate or suggest a date.
- A date of birth must be written as YYYY-MM-DD and must be in the past.
- Counts and lists come only from the query result. If a field is not exposed by any data source in the tenant, say it is not available.
- Read-only WQL: a single SELECT, no semicolon, no data-changing words.
- Each correction is one proposal for one worker. There is no bulk edit.
- Personal data is shown only to a person whose role allows it. If refused, explain in one plain sentence.
- After approval, read the value back and report it as confirmed, pending in Workday, or partial.

## Output format

For a check: the count, a short list, and the query used. For a correction: a proposal card with worker, before value (or "not set"), after value, and a note that Workday's own process still runs.

## Test questions

- "Which workers are missing a date of birth?"
- "My date of birth is wrong, please correct it."
- "Fix the home address for everyone in the Pune office."
