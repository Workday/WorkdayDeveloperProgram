# Workforce insights skill

## What it is

A markdown skill for an agent that answers workforce questions with computed analysis of pay spread, organization span and missing data, always saying who was analysed. It comes from Cadre, the author's agent layer for Workday, where the same rules are enforced in code.

## What's inside

- `SKILL.md` is the skill: the three analyses over the worker roster (pay spread, organization span, missing data), the small-group and no-estimate rules, the rule to say who was analysed, and the output format.
- `example.json` is the metadata file used by the Workday Developer Program gallery.

## How to use it

1. Read `SKILL.md`.
2. Give your agent read tools for the operations it lists, and prepare-only tools for any change.
3. Put an approval step between the proposal and the Workday call.
4. Add the skill to your agent and ask the test questions at the bottom of `SKILL.md`.

## Before you deploy

- **Read only**: the skill changes nothing in Workday. It never proposes a pay change.
- **Sensitivity**: pay data is restricted. Gate the skill to the same roles that may see pay in Workday, and share outlier names only with the person asking.
- **Access**: the roster needs a role that may run WQL on `allWorkers`. Reading `totalBasePayAmount` needs the worker compensation domain; without it the pay analysis is not available and the other two still run.
- **Compute**: the median, quartiles and outlier fences must be computed by a tool, not written by the model. The skill forbids estimates for that reason.
- **Tool names**: map the operations in `SKILL.md` to your platform's tools.
- **Tested how**: on 25 November 2026 the author ran the roster read on a Workday development tenant: one WQL query on `allWorkers` selecting `workdayID, worker, businessTitle, supervisoryOrganization, isManager, totalBasePayAmount, workerActive, location, hireDate, managementLevel, jobFamily, employeeType, timeType, costCenter` returned all 113 workers (82 active). `totalBasePayAmount` came back as an object with `value` and `currency`; 79 workers had a base pay above zero, all in one currency, enough for a median and quartiles. `isManager` was true for 23, 23 organizations held an active worker, and the only field missing among active workers was `employeeType` (3 workers).
