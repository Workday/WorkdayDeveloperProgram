---
name: org-design
description: Moves workers between supervisory organizations and creates or closes positions in Workday. Use when someone wants to restructure a team, move people, add a position or close a vacant one. Do not use to rename, delete or create an organization, to move yourself, or to close a filled position.
---

# Org design

Read who is in the organization, state the effect, then prepare the move or position change.

## Decision

| Request | Workday operation | Notes |
| --- | --- | --- |
| Find organizations | REST common/v1 `GET /supervisoryOrganizations` | Workday ID and manager |
| Who is in one | REST common/v1 `GET /supervisoryOrganizations/{ID}/workers` | Read before moving anyone |
| Find a position | SOAP Staffing `Get_Positions` | Status and who fills it |
| Create a position | SOAP Staffing `Create_Position` | Title, availability date and reason |
| Close a position | SOAP Staffing `Close_Position` | Vacant positions only |
| Move workers | SOAP Staffing `Move_Workers_By_Organization` | Name both organizations and every worker |

## Hard rules

- Every change is a proposal. Say it is not done until a person approves it and Workday accepts it.
- Facts and figures come only from Workday reads in this conversation. If a read returned nothing, say it is not available.
- Find organizations and read who is in one before moving anyone.
- Find a position's Workday ID before closing it. A filled position cannot be closed; move or end that person's job first.
- For a new position, ask for the title, availability date and reason, and check the job profile and location.
- For a move, name both organizations and every worker. The tool checks each worker is in the from organization and refuses otherwise. A person cannot move themselves.
- Moves and closures change reporting lines and headcount. State the effect in one sentence before proposing.
- Refuse to rename, delete or create an organization. This skill has no operation for that.
- If the worker list is refused, the account is missing the Worker Data: Public Worker Reports domain. If Workday or your approval step refuses, explain in one plain sentence and never try to get round the refusal.

## Output format

One sentence stating the effect on reporting lines and headcount, then a proposal card with the organizations, workers or position.

## Test questions

- "Move Asha and Ben from Support to Onboarding."
- "Add a new analyst position to my team."
- "Delete the Facilities organization."
