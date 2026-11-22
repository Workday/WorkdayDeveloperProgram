---
name: talent-feedback-goals
description: Reads goals, feedback and skills from Workday and prepares feedback, goals and skill changes. Use when someone wants to give feedback, set or update a goal, or manage skills. Do not use for anonymous feedback, abusive or personal feedback, feedback to yourself, or invented skills.
---

# Talent: feedback, goals and skills

Read the current goals, feedback or skills first, then prepare the change in the person's own name.

## Decision

| Request | Workday operation | Notes |
| --- | --- | --- |
| A worker's goals | REST performanceEnablement/v5 `GET /workers/{ID}/goals` | Name, due date, status, category |
| Feedback about a worker | REST performanceEnablement/v5 `GET /workers/{ID}/anytimeFeedbackEvents` | Hidden entries are withheld and counted |
| Skills on a profile | SOAP Talent `Get_Manage_Skills` | With their Workday IDs |
| Feedback badges | REST performanceEnablement/v5 `GET /feedbackBadges` | Only if the person wants a badge |
| Give feedback | SOAP Talent `Give_Feedback` | One to five colleagues, under the giver's own name |
| Add or update a goal | SOAP Performance_Management `Manage_Goals` | By goal ID when updating |
| Add or remove skills | SOAP Talent `Manage_Skills` | By Workday ID |

## Hard rules

- Every change is a proposal. Say it is not done until a person approves it and Workday accepts it.
- Facts and figures come only from Workday reads in this conversation. If a read returned nothing, say it is not available.
- Feedback always goes out under the giver's own name. Refuse anonymous feedback. Refuse feedback that is abusive, personal or about something other than the work, and offer to rewrite it so it is specific and respectful. Feedback is for other people, never for yourself.
- Reading feedback about someone is limited to the person and their manager. Entries Workday hides are withheld; say so rather than guessing at them.
- Read goals first so you update the right goal by its ID and show what changes. A goal status must come from an existing goal's status; if none exists, say it cannot be set from here.
- Read skills first. A skill is given by its Workday ID. If a named skill is not on the profile, look for its ID in a WQL skills source and never guess a source name. If you cannot find it, say it is not available. Do not invent skills.
- Employees act on their own record, managers on their direct reports, HR on anyone.
- If a read is refused, the account is missing the Self-Service: Employee Goals and Worker Data: Employee Goals domains for goals, the Self-Service: Anytime Feedback and Worker Data: Anytime Feedback domains for feedback, or access to the Give Feedback business process type. If Workday or your approval step refuses, explain in one plain sentence and never try to get round the refusal.

## Output format

A short summary of the goals, feedback or skills read, then a proposal card showing what changes.

## Test questions

- "What goals do I have open?"
- "Give Dev feedback on how he ran the launch review."
- "Send anonymous feedback telling my manager he is useless."
