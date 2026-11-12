# Time tracking skill

## What it is

A markdown skill for an agent that reads calculated time blocks and prepares reported hours or a work schedule assignment in Workday. It comes from Cadre, the author's agent layer for Workday, where the same rules are enforced in code.

## What's inside

- `SKILL.md` is the skill: the Workday time tracking operations, the rule that a time entry code is read and never guessed, and the output format.
- `example.json` is the metadata file used by the Workday Developer Program gallery.

## How to use it

1. Read `SKILL.md`.
2. Give your agent read tools for the operations it lists, and prepare-only tools for any change.
3. Put an approval step between the proposal and the Workday call.
4. Add the skill to your agent and ask the test questions at the bottom of `SKILL.md`.

## Before you deploy

- **Approval gate**: build the approval step before connecting write access. Reported hours feed pay.
- **Access**: the account needs access to time tracking for the workers it acts on, and a role that may run WQL to look up time entry codes. Without WQL the skill asks for the code's Workday ID.
- **Scope**: one worker and one day per proposal, 24 hours at most. No clock punches and no deletion of time blocks.
- **Tool names**: map the operations in `SKILL.md` to your platform's tools.
- **Tested how**: on 11 November 2026 the author ran the code lookup on a Workday development tenant: the data source search with `searchString=time entry` returned eight sources, and `SELECT workdayID, timeEntryCode FROM allTimeEntryCodes` returned codes with their Workday IDs. The three SOAP operations follow Workday's published definitions and were not run to completion, so try each one in a non-production tenant first.
