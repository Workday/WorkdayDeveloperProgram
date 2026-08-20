# PTO & Leave Policy Agent Skill

## What it is

A markdown skill that teaches an AI agent how to answer employee questions about Paid Time Off (PTO), annual accrual rates, rollover limits, and sick leave, with built-in escalation workflows. It shows how to encode leave policies and Workday navigation steps into a self-service agent instruction file.

## What's inside

- `SKILL.md` is the skill: trigger description, policy matrix, Workday navigation paths, tone rules, and escalation behavior.
- `example.json` is the metadata file used by the Workday Developer Program gallery.

## How to use it

1. Read `SKILL.md` and adjust the sample policy values (accrual rates, rollover caps, escalation email) to match your organization's employee handbook.
2. Add the skill to your AI agent or Copilot platform following your platform's skill setup.
3. Test with the example questions at the bottom of `SKILL.md` before deploying to employees.

## Customizing

Keep the guardrails and escalation rules intact when you adapt it: an agent answering leave and medical questions should protect employee medical privacy and never approve unaccrued negative balances without manager sign-off.
