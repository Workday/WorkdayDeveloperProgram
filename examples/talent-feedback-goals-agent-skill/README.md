# Talent feedback, goals and skills skill

## What it is

A markdown skill for an agent that reads goals, feedback and skills from Workday and prepares feedback, goals and skill changes. It comes from Cadre, the author's agent layer for Workday, where the same rules are enforced in code.

## What's inside

- `SKILL.md` is the skill: the Workday operations for goals, anytime feedback, feedback badges and skills, the rules that feedback always goes out under the giver's own name and that a skill or goal is changed only by its Workday ID, and the output format.
- `example.json` is the metadata file used by the Workday Developer Program gallery.

## How to use it

1. Read `SKILL.md`.
2. Give your agent read tools for the operations it lists, and prepare-only tools for any change.
3. Put an approval step between the proposal and the Workday call.
4. Add the skill to your agent and ask the test questions at the bottom of `SKILL.md`.

## Before you deploy

- **Approval gate**: build the approval step before connecting write access. Feedback reaches a colleague under the giver's name, and a goal or skill change edits a person's profile.
- **Access**: goals need the Self-Service: Employee Goals and Worker Data: Employee Goals domains, feedback needs the Self-Service: Anytime Feedback and Worker Data: Anytime Feedback domains, and giving feedback needs access to the Give Feedback business process type. If the account lacks them, the skill reports a refusal.
- **Scope**: reading goals, feedback, feedback badges and skills, giving feedback to one to five colleagues, adding or updating a goal and adding or removing skills. It refuses anonymous, abusive or self-directed feedback and never invents a skill.
- **Tool names**: map the operations in `SKILL.md` to your platform's tools.
- **Tested how**: on 22 November 2026 the author ran the reads on a Workday development tenant with an OAuth token for a signed-in user: REST performanceEnablement/v5 `GET /workers/{ID}/goals` returned a worker's two goals with their IDs and linked reviews, `GET /workers/{ID}/anytimeFeedbackEvents` returned an empty list for the same worker, `GET /feedbackBadges` returned 17 badges such as Teamwork, and SOAP Talent v46.2 `Get_Manage_Skills` returned skill records for 31 workers, each skill with its Workday ID. The feedback read had no entries, so a populated feedback list was not seen. `Give_Feedback`, `Manage_Goals` and `Manage_Skills` follow Workday's published Talent and Performance_Management definitions and were not run, so try each one in a non-production tenant first.
