# Learning enrolment skill

## What it is

A markdown skill for an agent that finds learning content through read-only WQL and prepares enrolments for a person or their team, for approval. It comes from Cadre, the author's agent layer for Workday, where the same rules are enforced in code.

## What's inside

- `SKILL.md` is the skill: how to find a course by its Workday ID, the rule that a manager enrols only their own team, and the output format.
- `example.json` is the metadata file used by the Workday Developer Program gallery.

## How to use it

1. Read `SKILL.md`.
2. Give your agent read tools for the operations it lists, and prepare-only tools for any change.
3. Put an approval step between the proposal and the Workday call.
4. Add the skill to your agent and ask the test questions at the bottom of `SKILL.md`.

## Before you deploy

- **Approval gate**: build the approval step before connecting write access. An enrolment appears in the learner's Workday and may carry a due date.
- **Access**: the account needs a role that may run WQL over learning content and may enrol the learners it names. If it lacks either, the skill reports a refusal.
- **Scope**: one proposal per learner, and a manager is limited to their direct reports and themselves.
- **Tool names**: map the operations in `SKILL.md` to your platform's tools.
- **Tested how**: on 11 November 2026 the author ran the lookup on a Workday development tenant: the data source search with `searchString=learning` returned sixteen sources including `learningContent`, and `SELECT workdayID FROM learningContent` returned course IDs. `Enroll_In_Learning_Content` follows Workday's published SOAP definition and was not run to completion, so try it in a non-production tenant first.
