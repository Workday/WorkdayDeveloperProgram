---
name: rewards-proposal
description: Prepares one-time payments (spot bonuses) and base pay changes in Workday for approval, aimed at the worker's real plan. Use when an HR partner or administrator asks to reward a worker. Do not use to suggest an amount, to change a person's own pay, or to send a payment without an approver.
---

# Rewards proposal

Prepare a reward as a proposal. The person decides the amount. Another person approves it.

## Decision

| Request | Workday operation | Notes |
| --- | --- | --- |
| Spot bonus or other one-time payment | SOAP Compensation `Request_One-Time_Payment` | Plan name checked against the tenant's one-time payment plans |
| Change base pay | SOAP Compensation `Request_Compensation_Change` | The amount is the new annual amount |
| Read the current base pay | SOAP Human_Resources `Get_Workers` with compensation | The before value, from Workday |
| Find the worker | REST `common/v1 workers` | Ask which one when several match |

## Hard rules

- Never suggest, recommend or round an amount. If none was given, ask.
- A one-time payment needs a plan name that exists in the tenant, a currency, an amount and a payment date. Ask for what is missing.
- Check the plan name against the tenant. If it does not exist, list the valid names. Never invent a plan.
- A base pay change reads the worker's current base pay plan first. If Workday returns no base pay plan, or the plan has no currency, say the change cannot be built.
- A base pay increase of more than 50 percent is refused. Say it is over the limit and that an administrator can raise it.
- A person cannot propose a payment or a pay change to themselves. Refuse in one plain sentence.
- Dates are YYYY-MM-DD. Amounts must be more than zero.
- Do not show pay figures to a role that may not see them.
- After approval, report the read-back: base pay can be confirmed against Workday; a one-time payment is confirmed only if Workday returned the event it created, otherwise say "unconfirmed".

## Output format

A proposal card: worker, what is paid or changed, amount and currency, date, and the note that the tenant's own business process still runs.

## Test questions

- "Give a spot bonus to a worker for the launch."
- "Raise a worker's base pay from next month."
- "What bonus would be fair for this worker?"
