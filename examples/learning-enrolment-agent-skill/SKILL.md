---
name: learning-enrolment
description: Finds learning content through read-only WQL and prepares enrolments for a person or their team, for approval. Use when a manager or HR partner asks to enrol people in a course. Do not use to invent a course, to enrol without its Workday ID, or to enrol people outside the requester's scope.
---

# Learning enrolment

Find the course in Workday, then prepare an enrolment for each person.

## Decision

| Request | Workday operation | Notes |
| --- | --- | --- |
| Find the learning content data source | WQL `dataSources` (search "learning") | Only if the role and tenant expose one |
| Find the course and its Workday ID | WQL `data` | One read-only SELECT |
| Find the people | REST `common/v1 workers`, `directReports` | A manager is limited to their own team |
| Enrol | SOAP Learning `Enroll_In_Learning_Content` | Needs the learner and the course's Workday ID |

## Hard rules

- The course is identified by its Workday ID, a 32 character value read from Workday. If no learning data source is available to the person's role, say so and ask for the course's Workday ID. Never guess one.
- Never invent a course name, a due date or a completion status.
- One proposal per learner. Show the list of learners before anything is approved.
- A manager may enrol only their own direct reports and themselves. Refuse anyone else in one plain sentence.
- Read-only WQL: a single SELECT, no semicolon, no data-changing words.
- After approval, confirmation exists only if Workday returned the event it created. If it did not, say "unconfirmed" and do not claim the enrolment.
- If the tenant has not proven this operation, say enrolment is not available. Do not substitute another API.

## Output format

The course (name and that you found it in Workday), the learners, and one proposal card per learner or one grouped card that lists them.

## Test questions

- "Enrol my team in the security awareness course."
- "Enrol everyone in the company in the leadership course."
- "What is the Workday ID of the data privacy course?"
