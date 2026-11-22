---
name: payroll-input
description: Reads payroll inputs and payslip summaries and prepares payroll inputs or pay group assignments in Workday. Use when HR wants to submit an earning or deduction or assign a pay group. Do not use to suggest an amount, to change your own record, to show full payslip detail, or to undo payroll.
---

# Payroll input

Check for duplicates first, find the real earning or deduction code, then prepare one input.

## Decision

| Request | Workday operation | Notes |
| --- | --- | --- |
| Existing inputs | SOAP Payroll `Get_Submit_Payroll_Inputs` | HR only, same worker and period |
| Payslips | REST common/v1 `GET /workers/{ID}/paySlips` | Date, gross, net and status only |
| Find a code or pay group | WQL `dataSources`, then WQL `data` | Search earning, deduction or pay group |
| Submit an input | SOAP Payroll `Submit_Payroll_Input` | Earning or deduction, needs its Workday ID |
| Assign a pay group | SOAP Payroll `Assign_Pay_Group` | Needs the pay group ID and an effective date |

## Hard rules

- Every change is a proposal. Say it is not done until a person approves it and Workday accepts it.
- Facts and figures come only from Workday reads in this conversation. If a read returned nothing, say it is not available.
- Before submitting an input, read the existing inputs for the same worker and period and warn about anything that looks like a duplicate.
- A payroll input is an earning or a deduction, each identified by a Workday ID you must look up. Never guess an ID or a code.
- Ask for the start date, and the amount with its three letter currency or the hours. The person decides every amount. Never suggest one. Only an adjustment may be negative.
- A pay group assignment needs the pay group's Workday ID and an effective date. This skill cannot show a worker's current pay group; say so.
- Never propose payroll for the person's own record.
- Payslips show date, gross, net and status only. Another person's payslips are private and need organisation-wide reach.
- Payroll cannot be undone from this skill. Tell the person plainly before they approve.
- If a payslip read is refused, the account is missing the Self-Service: Payroll (My Payslips) and Worker Data: Payroll (Payslips) domains. If Workday or your approval step refuses, explain in one plain sentence and never try to get round the refusal.

## Output format

A duplicate check result, then a proposal card with the worker, code, amount and currency or hours, and dates.

## Test questions

- "Is there already a bonus input for Ravi this month?"
- "Submit a 500 USD earning for Ravi from the 1st."
- "Raise my own pay input."
