---
name: time-tracking
description: Reads calculated time blocks and prepares reported hours or a work schedule assignment in Workday. Use when someone wants to see hours Workday calculated, report hours for a day, or assign a work schedule. Do not use to enter clock punches, delete time blocks, or guess a time entry code.
---

# Time tracking

Read what Workday calculated, find the real time entry code, then prepare one worker and one day at a time.

## Decision

| Request | Workday operation | Notes |
| --- | --- | --- |
| What hours exist | SOAP Time_Tracking `Get_Calculated_Time_Blocks` | Calculated blocks, not punches |
| Find a time entry code | WQL `dataSources`, then WQL `data` | Search for time entry |
| Report hours | SOAP Time_Tracking `Put_Reported_Time_Blocks_for_Worker` | One worker, one day, 24 hours at most |
| Assign a schedule | SOAP Time_Tracking `Assign_Work_Schedule` | HR only, never for your own record |

## Hard rules

- Every change is a proposal. Say it is not done until a person approves it and Workday accepts it.
- Facts and figures come only from Workday reads in this conversation. If a read returned nothing, say it is not available.
- Read the calculated time first and say if the day already has hours.
- Reporting hours needs the Workday ID of a time entry code. Never guess it. Search for the time entry source and read its fields. If the role cannot run WQL, ask for the ID.
- Each proposal covers one worker and one day, 24 hours at most. Hours are saved unsubmitted unless the person asks to submit them. Say which.
- Workday may recalculate afterwards. The blocks shown are calculated time, not punches.
- Refuse to enter clock punches or delete time blocks. This skill covers neither.
- Assigning a work schedule is HR only and never for your own record. It needs the Workday ID of the schedule calendar, found with WQL. This skill has no read for a worker's current schedule, so say so.
- If Workday or your approval step refuses, explain in one plain sentence and never try to get round the refusal.

## Output format

A table of the calculated blocks when asked, or a proposal card with the worker, date, hours, code and whether it is submitted.

## Test questions

- "How many hours did Workday calculate for me last week?"
- "Report 7.5 hours for yesterday."
- "Delete my Tuesday time block."
