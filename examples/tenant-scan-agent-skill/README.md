# Tenant scan skill

## What it is

A markdown skill for an agent that summarises what a Workday tenant offers from a single scan of its data sources, worker and organization counts and live capabilities. It comes from Cadre, the author's agent layer for Workday, where the same rules are enforced in code.

## What's inside

- `SKILL.md` is the skill: the three reads behind a tenant scan, the rule that every figure comes from a read, the not-available rule and the output format.
- `example.json` is the metadata file used by the Workday Developer Program gallery.

## How to use it

1. Read `SKILL.md`.
2. Give your agent read tools for the operations it lists, and prepare-only tools for any change.
3. Put an approval step between the proposal and the Workday call.
4. Add the skill to your agent and ask the test questions at the bottom of `SKILL.md`.

## Before you deploy

- **Read only**: the skill changes nothing in Workday. The approval step in "How to use it" matters only if you add write tools beside it.
- **Access**: the data source list needs a role that may run WQL, and the organization count needs access to supervisory organizations. The scan reads what the account may see, so a narrow account gives a narrow report and the skill says so.
- **Honesty**: a count is the `total` Workday returns. A part that is refused is reported as not available with its reason, never filled in.
- **Tool names**: map the operations in `SKILL.md` to your platform's tools.
- **Tested how**: on 25 November 2026 the author ran every read on a Workday development tenant with an OAuth token for a signed-in user: WQL `GET /dataSources` returned a total of 1,281 sources, `?searchString=learning` returned 16, `GET /dataSources/{ID}/fields` for `allWorkers` returned a total of 2,784 fields, `SELECT workdayID FROM allWorkers` with `limit=1` returned one row and a total of 113, and `GET /supervisoryOrganizations` on common/v1 returned a total of 27.
