# WQL workforce analyst skill

## What it is

A markdown skill that teaches an agent to answer workforce questions from a tenant's own data. The agent finds a WQL data source, reads its fields, runs one read-only SELECT, and explains the result without adding any figure the query did not return. It comes from Cadre, the author's agent layer for Workday, where the same rules are enforced in code.

## What's inside

- `SKILL.md` is the skill: the WQL steps, the read-only rules, how to handle truncated results, and the output format.
- `example.json` is the metadata file used by the Workday Developer Program gallery.

## How to use it

1. Read `SKILL.md`.
2. Give your agent tools for WQL `dataSources`, the fields of a data source, and WQL `data`, plus a worker search. Name them as your platform requires and keep the rules.
3. Add the skill to your agent using your platform's skill setup.
4. Ask the test questions at the bottom of `SKILL.md` and check that the agent shows the query it ran.

## Before you deploy

- **Tool names**: `SKILL.md` describes the Workday operations, not your platform's tool names. Map each operation to a tool in your agent.
- **Access**: WQL results depend on the security of the account your agent uses. Confirm the account can read the data sources your questions need; the skill reports a refusal instead of guessing.
- **Data sources**: none are written into the skill. The agent discovers them in your tenant.
- **Row limit**: set the maximum rows your tool returns; the skill reports when results are truncated.
- **Tested how**: the operations follow Workday's published REST and SOAP definitions as the author read them. Not every operation has been run to completion in a tenant, so try each one in a non-production tenant first.
