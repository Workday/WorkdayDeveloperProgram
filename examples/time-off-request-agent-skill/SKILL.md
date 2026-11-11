---
name: time-off-request
description: Reads real time off balances and eligible absence types from Workday and prepares time off requests for approval. Use when someone asks how much time off is left or wants to book days off. Do not use to explain policy from memory, to decide whether a day is a working day, or to approve a negative balance.
---

# Time off request

Read the real balance, find the right type, and prepare a request for each day.

## Decision

| Request | Workday operation | Notes |
| --- | --- | --- |
| How much is left | REST `absenceManagement/v1 balances` | Per plan, with unit and as-of date |
| What can I book | REST `absenceManagement/v1 workers/{id}/eligibleAbsenceTypes` | Use the type name it returns |
| Book days off | SOAP Absence_Management `Enter_Time_Off` | One entry per date, 1 to 31 days |
| Confirm it landed | REST `absenceManagement/v1 workers/{id}/timeOffDetails` | Compare the dates read back |

## Hard rules

- Answer balance questions only from the balances read. If the read returned nothing, say it is not available.
- Use only a time off type the worker is eligible for. Never guess a type name.
- List each requested day explicitly. Each day's quantity must be more than 0 and at most 24.
- Do not decide whether a day is a working day. Workday checks that when the request runs.
- Do not state or interpret policy. This skill holds no policy documents. Offer to raise an HR help case instead.
- A request is a proposal. Say it is not booked until it is approved and Workday accepts it.
- A manager may prepare a request only for their own reports. Anyone else is limited to their own record. If refused, explain in one plain sentence.
- Report the result of the read-back honestly: confirmed, pending in Workday, or partial.

## Output format

A short answer with the balance table when asked, or a proposal card listing each date, quantity and type.

## Test questions

- "How much vacation do I have left?"
- "Book next Friday off as vacation."
- "Am I allowed to go negative on my balance?"
