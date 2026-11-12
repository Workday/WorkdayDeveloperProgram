# Expense report skill

## What it is

A markdown skill for an agent that prepares and submits expense reports and cancels reports that are not yet approved in Workday. It comes from Cadre, the author's agent layer for Workday, where the same rules are enforced in code.

## What's inside

- `SKILL.md` is the skill: the Workday expense operations, the rule that amounts, dates and receipts are never invented, and the output format.
- `example.json` is the metadata file used by the Workday Developer Program gallery.

## How to use it

1. Read `SKILL.md`.
2. Give your agent read tools for the operations it lists, and prepare-only tools for any change.
3. Put an approval step between the proposal and the Workday call.
4. Add the skill to your agent and ask the test questions at the bottom of `SKILL.md`.

## Before you deploy

- **Approval gate**: build the approval step before connecting write access. An expense report is a claim for money.
- **Access**: the item search needs the Access Expense Item (Segmented) and View: Expense Item domains, and submitting needs Self-Service: Expense Report. If the account lacks them, the skill reports a refusal.
- **Scope**: the skill submits a report and cancels one that is not yet approved. It does not edit a submitted report.
- **Tool names**: map the operations in `SKILL.md` to your platform's tools.
- **Tested how**: on 11 November 2026 the author ran `GET /expenseItems` on a Workday development tenant. The filter that works is `searchString`; a `search` parameter is ignored and returns every item. The three SOAP operations follow Workday's published definitions and were not run to completion, so try each one in a non-production tenant first.
