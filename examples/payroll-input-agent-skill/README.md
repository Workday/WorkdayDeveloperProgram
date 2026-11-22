# Payroll input skill

## What it is

A markdown skill for an agent that reads payroll inputs and payslip summaries and prepares payroll inputs or pay group assignments in Workday. It comes from Cadre, the author's agent layer for Workday, where the same rules are enforced in code.

## What's inside

- `SKILL.md` is the skill: the Workday payroll operations, the duplicate check before any input, the rule that an earning or deduction ID is looked up and never guessed, and the output format.
- `example.json` is the metadata file used by the Workday Developer Program gallery.

## How to use it

1. Read `SKILL.md`.
2. Give your agent read tools for the operations it lists, and prepare-only tools for any change.
3. Put an approval step between the proposal and the Workday call.
4. Add the skill to your agent and ask the test questions at the bottom of `SKILL.md`.

## Before you deploy

- **Approval gate**: build the approval step before connecting write access. A payroll input changes what a person is paid and cannot be undone from the skill.
- **Access**: reading and submitting inputs needs payroll input access for the workers involved. Payslips need the Self-Service: Payroll (My Payslips) and Worker Data: Payroll (Payslips) domains. If the account lacks them, the skill reports a refusal.
- **Scope**: reading existing payroll inputs and payslip summaries, looking up earning, deduction and pay group IDs, submitting one input and assigning a pay group. It never suggests an amount and never acts on the requester's own record.
- **Tool names**: map the operations in `SKILL.md` to your platform's tools.
- **Tested how**: on 22 November 2026 the author ran the reads on a Workday development tenant: SOAP Payroll v46.2 `Get_Submit_Payroll_Inputs` returned the tenant's one payroll input, and WQL found the lookups the skill needs (`allEarningsForPayroll` returned 209 earnings with their Workday IDs, `allPayGroups` returned 4 pay groups such as USA Weekly). On an earlier development tenant (12 November 2026) the author created one-time inputs through REST payroll/v2 `POST /payrollInputs` and deleted them again; that is the REST equivalent of `Submit_Payroll_Input`, which itself was not run. The payslip read was refused on this tenant for the test user, so it is untested here, and `Assign_Pay_Group` was not run. Try each write in a non-production tenant first.
