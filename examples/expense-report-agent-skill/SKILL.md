---
name: expense-report
description: Prepares and submits expense reports and cancels reports that are not yet approved in Workday. Use when someone wants to claim what they spent or cancel a report. Do not use to invent an amount, date or receipt, or to cancel an approved report.
---

# Expense report

Collect every line, find the real expense item for each, then prepare the report.

## Decision

| Request | Workday operation | Notes |
| --- | --- | --- |
| Existing reports | SOAP Resource_Management `Get_Expense_Reports` | Status, memo and total |
| Find an expense item | REST expense/v1 `GET /expenseItems` | Search by what the person calls it, use the ID returned |
| Submit a report | SOAP Resource_Management `Submit_Expense_Report` | Purpose, currency and every line |
| Cancel a report | SOAP Resource_Management `Cancel_Expense_Report` | Only if not yet approved |

## Hard rules

- Every change is a proposal. Say it is not done until a person approves it and Workday accepts it.
- Facts and figures come only from Workday reads in this conversation. If a read returned nothing, say it is not available.
- Before proposing a report, ask for the business purpose, the currency, and for each line the date, the amount and what it was for.
- Find each expense item and use the ID it returns. If no item matches, say so; do not pick a near one without asking.
- Company and payment type are copied from the person's latest report. If Workday has none, ask the person or look for them with WQL. Never guess a data source name.
- Never invent an amount, a date or a receipt. If there is a receipt, mark the line as having one; if not, say Workday's policy may ask for it.
- Report totals back exactly as computed from the lines given.
- To cancel, read the reports first and confirm which one. Only a report not yet approved can be cancelled.
- Employees act on their own expenses. Managers and HR can act for someone else only where their role allows it.
- If the item search is refused, the account is missing the Access Expense Item (Segmented) and View: Expense Item domains, and submitting needs Self-Service: Expense Report. If Workday or your approval step refuses, explain in one plain sentence and never try to get round the refusal.

## Output format

A table of the lines with item, date and amount and the computed total, then a proposal card.

## Test questions

- "Claim two taxi rides and a hotel night from the Pune trip."
- "Cancel my last expense report."
- "Add a 4,000 rupee dinner I did not actually have."
