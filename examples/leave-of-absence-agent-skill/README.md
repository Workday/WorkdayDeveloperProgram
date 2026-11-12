# Leave of absence skill

## What it is

A markdown skill for an agent that reads a worker's leaves of absence and prepares a leave request or a return from leave in Workday. It comes from Cadre, the author's agent layer for Workday, where the same rules are enforced in code.

## What's inside

- `SKILL.md` is the skill: the Workday leave operations, the rule that a leave type ID is read and never guessed, and the output format.
- `example.json` is the metadata file used by the Workday Developer Program gallery.

## How to use it

1. Read `SKILL.md`.
2. Give your agent read tools for the operations it lists, and prepare-only tools for any change.
3. Put an approval step between the proposal and the Workday call.
4. Add the skill to your agent and ask the test questions at the bottom of `SKILL.md`.

## Before you deploy

- **Approval gate**: build the approval step before connecting write access. A leave changes a worker's status and can affect pay.
- **Access**: the reads need the Self-Service: Leave of Absence and Worker Data: Leave of Absence domains, and the leave type lookup through WQL needs a role that may run WQL. Without WQL the skill asks for the leave type's Workday ID.
- **Scope**: reading leaves, one leave request and one return from leave. It does not decide entitlement or pay, and it does not handle ordinary time off.
- **Tool names**: map the operations in `SKILL.md` to your platform's tools.
- **Tested how**: on 12 November 2026 the author ran the reads on a Workday development tenant: `GET /workers/{ID}/leavesOfAbsence` on absenceManagement/v1 returned an empty list for a worker with no leave, `GET /values/leave/status/` returned five status values, `GET /workers/{ID}/eligibleAbsenceTypes` returned 25 types including leave types such as Bereavement Leave, and `SELECT workdayID, leaveType, leaveFamily FROM allLeaveOfAbsenceTypes` returned leave types with their Workday IDs. The worker read had no leave, so a populated leave list was not seen. The two SOAP operations follow Workday's published definitions and were not run to completion, so try each one in a non-production tenant first.
