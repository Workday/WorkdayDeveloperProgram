# Integration health skill

## What it is

A markdown skill for an agent that reports how Workday integrations are doing from real event counts and prepares launches and cancellations. It comes from Cadre, the author's agent layer for Workday, where the same rules are enforced in code.

## What's inside

- `SKILL.md` is the skill: the Workday operations for integration events, systems and system load, the rule that health numbers are reported exactly as returned, and the output format.
- `example.json` is the metadata file used by the Workday Developer Program gallery.

## How to use it

1. Read `SKILL.md`.
2. Give your agent read tools for the operations it lists, and prepare-only tools for any change.
3. Put an approval step between the proposal and the Workday call.
4. Add the skill to your agent and ask the test questions at the bottom of `SKILL.md`.

## Before you deploy

- **Approval gate**: build the approval step before connecting write access. A launch runs a real integration and a cancel stops one mid-run.
- **Access**: the event and system reads need integration event and integration configuration access. System load needs the System Monitor Administrator or System Monitor Support domain. If the account lacks them, the skill reports a refusal.
- **Scope**: reading integration events and systems, system load, launching an integration with its saved settings and cancelling a running event. It does not pass launch parameters and does not cancel finished events.
- **Tool names**: map the operations in `SKILL.md` to your platform's tools.
- **Tested how**: on 22 November 2026 the author ran the reads on a Workday development tenant with an OAuth token for a signed-in user: SOAP Integrations v46.2 `Get_Integration_Systems` returned 168 integration systems, `Get_Integration_Events` returned 47,442 events (paged, 3 per page in the test), and REST systemMetrics/v1 `GET /systemMetricsOverview` returned the live session count. `Launch_Integration` and `Cancel_Integration_Event` follow Workday's published Integrations definitions and were not run, so try each one in a non-production tenant first.
