# Load reference check skill

## What it is

A markdown skill for an agent that checks rows someone plans to load against what exists in the Workday tenant: job profiles, locations, supervisory organizations and workers. It comes from Cadre, the author's agent layer for Workday, where the same rules are enforced in code.

## What's inside

- `SKILL.md` is the skill: the existence checks for job profiles, locations, supervisory organizations and workers, the 2,000 row limit, the rule never to say a file will load, and the output format.
- `example.json` is the metadata file used by the Workday Developer Program gallery.

## How to use it

1. Read `SKILL.md`.
2. Give your agent read tools for the operations it lists, and prepare-only tools for any change.
3. Put an approval step between the proposal and the Workday call.
4. Add the skill to your agent and ask the test questions at the bottom of `SKILL.md`.

## Before you deploy

- **Read only**: the skill loads nothing and changes nothing in Workday.
- **Scope**: existence only. Whether a value is allowed for a row (a job profile in that organization, for example) is decided by Workday when the data is loaded, so keep Workday's own load validation as the final check.
- **Access**: the account needs a role that may run WQL on the reference sources and on `allWorkers`. An organization is matched through the workers in it, so an organization with nobody in it is reported as not found.
- **Tool names**: map the operations in `SKILL.md` to your platform's tools.
- **Tested how**: on 25 November 2026 the author ran the reference reads on a Workday development tenant: `SELECT workdayID, jobProfileName, referenceID1 FROM allJobProfiles` returned 162 job profiles, `SELECT workdayID, location, referenceID1 FROM locationsUsedAsBusinessSite` returned 15 locations, and the `allWorkers` roster returned 113 workers across 23 organizations with an active worker. The row-by-row comparison is done by the agent's own tool and was not part of this run.
