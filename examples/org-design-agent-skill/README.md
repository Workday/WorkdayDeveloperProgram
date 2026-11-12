# Org design skill

## What it is

A markdown skill for an agent that moves workers between supervisory organizations and creates or closes positions in Workday. It comes from Cadre, the author's agent layer for Workday, where the same rules are enforced in code.

## What's inside

- `SKILL.md` is the skill: the Workday operations for organizations and positions, the rule that the members of an organization are read before anyone is moved, and the output format.
- `example.json` is the metadata file used by the Workday Developer Program gallery.

## How to use it

1. Read `SKILL.md`.
2. Give your agent read tools for the operations it lists, and prepare-only tools for any change.
3. Put an approval step between the proposal and the Workday call.
4. Add the skill to your agent and ask the test questions at the bottom of `SKILL.md`.

## Before you deploy

- **Approval gate**: build the approval step before connecting write access. A move changes reporting lines and a position change alters headcount.
- **Access**: listing the workers of an organization needs the Worker Data: Public Worker Reports domain. The position and move operations need staffing access for the organizations involved. If the account lacks them, the skill reports a refusal.
- **Scope**: moving workers between supervisory organizations, creating a position and closing a vacant one. It does not rename, create or delete an organization.
- **Tool names**: map the operations in `SKILL.md` to your platform's tools.
- **Tested how**: on 12 November 2026 the author ran both reads on a Workday development tenant: `GET /supervisoryOrganizations` on common/v1 returned 27 organizations, each with its name, code and manager, and `GET /supervisoryOrganizations/{ID}/workers` returned the four workers of one of them with their business titles. The four SOAP operations follow Workday's published Staffing definitions and were not run to completion, so try each one in a non-production tenant first.
