# Inbox decisions skill

## What it is

A markdown skill that teaches an agent to read a person's Workday inbox, explain what each step does and prepare an approve, deny or send back decision for approval. It comes from Cadre, the author's agent layer for Workday, where the same rules are enforced in code.

## What's inside

- `SKILL.md` is the skill: the Workday business process operations, the rule that the person decides, and the output format.
- `example.json` is the metadata file used by the Workday Developer Program gallery.

## How to use it

1. Read `SKILL.md`.
2. Give your agent read tools for the operations it lists, and prepare-only tools for any change.
3. Put an approval step between the proposal and the Workday call.
4. Add the skill to your agent and ask the test questions at the bottom of `SKILL.md`.

## Before you deploy

- **Approval gate**: build the approval step before connecting write access. Approving a Workday step is a business decision.
- **Access**: the account the agent uses needs the Core Navigation and Public Business Processes domains. If it lacks them, the skill reports a refusal.
- **Scope**: the skill works one item at a time and does not bulk approve.
- **Tool names**: map the operations in `SKILL.md` to your platform's tools.
- **Tested how**: the operations follow Workday's published REST and SOAP definitions as the author read them. Not every operation has been run to completion in a tenant, so try each one in a non-production tenant first.
