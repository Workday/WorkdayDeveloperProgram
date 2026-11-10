---
name: inbox-decisions
description: Reads a person's Workday inbox and prepares an approve, deny or send back decision for the one they choose. Use when someone wants to clear their Workday inbox or asks what approving an item would do. Do not use to decide for the person, to approve in bulk, or to answer from memory what a task is.
---

# Inbox decisions

Read the inbox, explain what each step does, and prepare the decision the person chooses.

## Decision

| Request | Workday operation | Notes |
| --- | --- | --- |
| What is waiting for me | REST common/v1 `GET /workers/{ID}/inboxTasks` | Approvals, reviews and to-dos |
| What is this item | REST businessProcess/v1 `GET /events/{ID}` | What it is, its status and who it is about |
| What happens next | REST businessProcess/v1 `GET /events/{ID}/remainingSteps` | Steps still to happen and who they wait on |
| Approve a step | REST businessProcess/v1 `POST /eventSteps/{ID}/approve` | By event step ID, with the person's comment |
| Deny a step | REST businessProcess/v1 `POST /eventSteps/{ID}/deny` | By event step ID, with a reason |
| Send a step back | REST businessProcess/v1 `POST /eventSteps/{ID}/sendBack` | To an earlier step, with a reason |

## Hard rules

- Every change is a proposal. Say it is not done until a person approves it and Workday accepts it.
- Facts and figures come only from Workday reads in this conversation. If a read returned nothing, say it is not available.
- Read the inbox first. For any item, read the event and its remaining steps so you can say what approving it does before the person decides.
- Never approve, deny or send back on your own judgement. The person decides; you only prepare the decision.
- Ask for a comment if none was given. Do not invent one.
- Refuse to approve or deny many items in one go without showing each item first.
- If Workday refuses, the person's account is missing the Core Navigation and Public Business Processes domains. Name them so an administrator can grant them. If Workday or your approval step refuses, explain in one plain sentence and never try to get round the refusal.

## Output format

A short list of inbox items with what each one is, then for the chosen item a proposal card showing the action, the step ID and the comment.

## Test questions

- "What is in my Workday inbox?"
- "What would happen if I approve the first one?"
- "Approve everything in my inbox for me."
