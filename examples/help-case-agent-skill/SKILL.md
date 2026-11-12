---
name: help-case
description: Routes an HR question to the right help case type in Workday, prepares the case for approval, and prepares a comment on an existing case, with a clickable link when one is needed. Use when someone has a payslip, manager-of-record, benefits or similar HR question that needs a person, or wants to add a comment to a case. Do not use to answer policy from memory or to decide a case.
---

# Help case

Find the right case type, write the case or the comment, and let the person approve it.

## Decision

| Request | Workday operation | Notes |
| --- | --- | --- |
| Pick the case type | REST helpCase/v4 `GET /serviceCategories` | Categories, each with its case types |
| File the case | REST helpCase/v4 `POST /cases` | `caseType.id`, `title`, `detailedMessage`. Sent only after approval |
| Confirm it was filed | REST helpCase/v4 `GET /cases/{ID}` | Compare the title read back, give the person `caseID` and `caseLink` |
| Read what happened on a case | REST helpCase/v4 `GET /cases/{ID}/timeline` | Creation, status changes, comments and notes |
| Add a comment | REST helpCase/v4 `POST /cases/{ID}/comment` | Body is `comment.textBody` or `comment.content`, never both |

## Comment bodies

A comment is plain text or rich text. Workday refuses a request that carries both.

Plain text. Workday stores it as written, so an address or an HTML tag in it is shown as text and is not clickable:

```json
{ "comment": { "textBody": "Your enrolment window is open until Friday." } }
```

Rich text. `content` is a string that holds a JSON document: paragraphs of text nodes, where a link is a `link` mark on the text node. Workday derives `textBody` from it:

```json
{
  "comment": {
    "content": "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"You can read the plan details here: \"},{\"type\":\"text\",\"text\":\"https://example.com/benefits\",\"marks\":[{\"type\":\"link\",\"attrs\":{\"href\":\"https://example.com/benefits\",\"title\":\"https://example.com/benefits\"}}]}]}]}"
  }
}
```

The text of the link node must be the address itself. The case page builds the link from that text, not from `href`: a node whose text is "Benefits page" is drawn as a link that leads nowhere useful. So put the label in an ordinary text node before the link, as above.

Build the document as an object and serialise it. Do not write the escaped string by hand.

## Hard rules

- Do not answer policy questions from memory. If the question needs a policy answer, offer to file a case.
- Choose the case type from the categories Workday returns. If two fit, ask. If none fits, say so. Never invent a case type ID.
- The title needs at least 5 characters and the description at least a full sentence. Keep the title to 200 characters and the description to 4,000.
- Do not put health details, government identifiers or bank details in the case text or a comment. Ask the person to keep those for the HR team.
- A case filed through an integration account is recorded by Workday with the source "Integration" and for the worker that account belongs to. The case text must name the person it is really for. Say this in the proposal.
- A link in a comment comes from the person or from a Workday read in this conversation. Never invent an address. The address is shown in full as the link text, so never try to hide it behind a label.
- A case and a comment are proposals until approved. Never say either was sent before then. A comment can move a case from New to In Progress, so say that too.
- If Workday or your approval step refuses, explain in one plain sentence and never try to get round the refusal.

## Output format

A proposal card. For a case: case type in plain words, title, description, and who it is for. For a comment: the case number and title, the comment text, and any link with its full address.

## Test questions

- "I have a question about my payslip."
- "My manager changed and Workday still shows the old one."
- "Add a comment to my benefits case with a link to the enrolment page."
- "Close all the open cases for my team."
