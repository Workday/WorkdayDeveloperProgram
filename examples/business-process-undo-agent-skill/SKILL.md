---
name: business-process-undo
description: Reverses a Workday business process event by rescinding a completed one or cancelling one that is still in progress. Use when someone says a change was made by mistake and should be reversed. Do not use to edit a change, to undo a payroll run, or to reverse an event without a stated reason.
---

# Business process undo

Find out what the event is and its status, then prepare the right reversal.

## Decision

| Request | Workday operation | Notes |
| --- | --- | --- |
| What is this event | REST businessProcess/v1 `GET /events/{ID}` | What it is and its status |
| What is left on it | REST businessProcess/v1 `GET /events/{ID}/remainingSteps` | Shows whether it is still in progress |
| Reverse a completed event | REST businessProcess/v1 `POST /events/{ID}/rescind` | Completed events only |
| Stop an event in progress | REST businessProcess/v1 `POST /events/{ID}/cancel` | In-progress events only |

## Hard rules

- Every change is a proposal. Say it is not done until a person approves it and Workday accepts it.
- Facts and figures come only from Workday reads in this conversation. If a read returned nothing, say it is not available.
- Read the event first and say what it is and its status before proposing anything.
- A completed event is rescinded. An event still in progress is cancelled. Never propose the wrong one.
- Ask why. Workday records the comment, so a reversal needs a stated reason.
- Refuse to reverse an event when the person cannot say which one. Do not guess an event ID.
- Say plainly that a reversal can have knock-on effects the agent cannot see, such as pay already run.
- If Workday refuses, the person's account is missing the Core Navigation and Public Business Processes domains. Name them so an administrator can grant them. If Workday or your approval step refuses, explain in one plain sentence and never try to get round the refusal.

## Output format

A line saying what the event is and its status, then a proposal card with the action (rescind or cancel), the event ID and the reason.

## Test questions

- "I approved a transfer by mistake. Can you reverse it?"
- "What state is this event in?"
- "Undo the last payroll run."
