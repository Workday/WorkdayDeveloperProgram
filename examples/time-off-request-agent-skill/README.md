# Time off request skill

## What it is

A markdown skill that teaches an agent to answer time off balance questions from Workday and to prepare time off requests for approval. Balances and eligible types are read from Workday; the agent never quotes policy from memory. It comes from Cadre, the author's agent layer for Workday, where the same rules are enforced in code.

## What's inside

- `SKILL.md` is the skill: the Workday operations (REST `absenceManagement/v1` balances and eligible absence types, SOAP `Enter_Time_Off`), the day-by-day request rules, and the output format.
- `example.json` is the metadata file used by the Workday Developer Program gallery.

## How to use it

1. Read `SKILL.md`.
2. Give your agent read tools for balances, eligible absence types and time off details, and a prepare-only tool for `Enter_Time_Off`.
3. Put an approval step between the proposal and the Workday call.
4. Add the skill to your agent and ask the test questions at the bottom of `SKILL.md`.

## Before you deploy

- **Approval gate**: build the approval step before connecting write access.
- **Absence plans**: balance and type names come from your tenant. Nothing is hard coded in the skill.
- **Access**: the account the agent uses needs read access to absence balances and permission to enter time off. If it lacks either, the skill reports a refusal.
- **Policy**: the skill holds no policy. If you want policy answers, add a separate skill like Workday's PTO policy example and keep this one for live data.
- **Tool names**: map the operations in `SKILL.md` to your platform's tools.
- **Tested how**: the operations follow Workday's published REST and SOAP definitions as the author read them. Not every operation has been run to completion in a tenant, so try each one in a non-production tenant first.
