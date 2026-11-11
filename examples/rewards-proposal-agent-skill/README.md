# Rewards proposal skill

## What it is

A markdown skill that teaches an agent to prepare spot bonuses and base pay changes in Workday as proposals. The person decides the amount; the agent resolves the plan from the tenant and a different person approves. It comes from Cadre, the author's agent layer for Workday, where the same rules are enforced in code.

## What's inside

- `SKILL.md` is the skill: the SOAP Compensation operations (`Request_One-Time_Payment`, `Request_Compensation_Change`), the checks before a proposal, the refusals, and the output format.
- `example.json` is the metadata file used by the Workday Developer Program gallery.

## How to use it

1. Read `SKILL.md`.
2. Give your agent a worker search, a way to list one-time payment plans, and prepare-only tools for the two operations.
3. Put an approval step between the proposal and the Workday call.
4. Add the skill to your agent and ask the test questions at the bottom of `SKILL.md`.

## Before you deploy

- **Approval gate**: build the approval step, with a different approver from the requester, before connecting write access.
- **Pay increase limit**: the skill refuses a base pay increase of more than 50 percent. Change that figure to your own policy, in `SKILL.md` and in your tool.
- **One-time payment plans**: plan names come from your tenant. The skill lists them rather than assuming any.
- **Access**: the account needs permission to request one-time payments and compensation changes. If it lacks it, the skill reports a refusal.
- **Pay data**: restrict who can use this skill to roles that may see and propose pay.
- **Tool names**: map the operations in `SKILL.md` to your platform's tools.
- **Tested how**: the operations follow Workday's published REST and SOAP definitions as the author read them. Not every operation has been run to completion in a tenant, so try each one in a non-production tenant first.
