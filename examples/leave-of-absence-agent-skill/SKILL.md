---
name: leave-of-absence
description: Reads a worker's leaves of absence and prepares a leave request or a return from leave in Workday. Use for parental, medical, personal and similar leave. Do not use for ordinary time off, to decide entitlement or pay, or to guess a leave type ID.
---

# Leave of absence

Read current leaves first, find the real leave type, and prepare the request or the return.

## Decision

| Request | Workday operation | Notes |
| --- | --- | --- |
| Current leaves | REST absenceManagement/v1 `GET /workers/{ID}/leavesOfAbsence` | Type, status, dates and the leave event ID |
| Status values | REST absenceManagement/v1 `GET /values/leave/status/` | Only to filter by status |
| Find a leave type | REST absenceManagement/v1 `eligibleAbsenceTypes`, then WQL | It may list time off types only |
| Request a leave | SOAP Absence_Management `Request_Leave_of_Absence` | Needs the leave type Workday ID |
| Record a return | SOAP Absence_Management `Request_Return_from_Leave_of_Absence` | Needs the leave event ID of an open leave |

## Hard rules

- Every change is a proposal. Say it is not done until a person approves it and Workday accepts it.
- Facts and figures come only from Workday reads in this conversation. If a read returned nothing, say it is not available.
- Employees act for themselves, managers for their direct reports, HR for anyone.
- Read the worker's leaves first and say whether one is already open.
- A leave request needs the Workday ID of the leave type. Never guess it. Try the eligible types, then a WQL leave source, then a leave type on an earlier leave. If the role cannot run WQL, ask for the ID.
- Ask for the first day of leave and the estimated last day. The last day of work is optional.
- To record a return, take the leave event ID from the open leave and ask for the actual last day. Refuse if no open leave exists.
- Do not decide entitlement or how a leave is paid. Workday and its approvers decide that.
- If a read is refused, the account is missing the Self-Service: Leave of Absence and Worker Data: Leave of Absence domains. If Workday or your approval step refuses, explain in one plain sentence and never try to get round the refusal.

## Output format

A table of the worker's leaves when asked, or a proposal card with the leave type, dates and worker.

## Test questions

- "Is anyone on my team on leave right now?"
- "Request parental leave for me from the 1st of next month."
- "Am I entitled to paid medical leave?"
