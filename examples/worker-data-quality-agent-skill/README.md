# Worker data quality skill

## What it is

A markdown skill for an agent that finds workers with missing personal data through read-only WQL and prepares a date of birth correction for approval. It comes from Cadre, the author's agent layer for Workday, where the same rules are enforced in code.

## What's inside

- `SKILL.md` is the skill: the read-only WQL check, the one correction it supports, the rule that the value comes from the person, and the output format.
- `example.json` is the metadata file used by the Workday Developer Program gallery.

## How to use it

1. Read `SKILL.md`.
2. Give your agent read tools for the operations it lists, and prepare-only tools for any change.
3. Put an approval step between the proposal and the Workday call.
4. Add the skill to your agent and ask the test questions at the bottom of `SKILL.md`.

## Before you deploy

- **Approval gate**: build the approval step before connecting write access. A date of birth is personal data and the change runs Workday's own business process.
- **Access**: the account needs a role that may run WQL over worker data and may read personal information. Results follow that account's security, so a count can be lower than the true number.
- **Scope**: finding gaps is read-only. The only correction is a date of birth, one worker at a time. There is no bulk edit.
- **Tool names**: map the operations in `SKILL.md` to your platform's tools.
- **Tested how**: on 11 November 2026 the author ran the check on a Workday development tenant: `SELECT worker FROM allWorkers WHERE dateOfBirth IS EMPTY` returned the workers with no date of birth, and `GET /workers` on staffing/v6 returned worker records. The two SOAP operations follow Workday's published definitions and were not run to completion (the test account was not authorised for `Get_Workers`), so try each one in a non-production tenant first.
