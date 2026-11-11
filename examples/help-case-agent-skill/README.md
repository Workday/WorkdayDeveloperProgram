# Help case skill

## What it is

A markdown skill for an agent that routes an HR question to the right help case type in Workday, prepares the case for approval, and prepares a comment on an existing case, with a clickable link when one is needed. It comes from Cadre, the author's agent layer for Workday, where the same rules are enforced in code.

## What's inside

- `SKILL.md` is the skill: the Workday help case operations, the two comment body shapes (plain text and rich text with a link), the rules on sensitive data, and the output format.
- `example.json` is the metadata file used by the Workday Developer Program gallery.

## How to use it

1. Read `SKILL.md`.
2. Give your agent read tools for the operations it lists, and prepare-only tools for filing a case and adding a comment.
3. Put an approval step between the proposal and the Workday call.
4. Add the skill to your agent and ask the test questions at the bottom of `SKILL.md`.

## Before you deploy

- **Approval gate**: build the approval step before connecting write access. A case and a comment are both read by an HR team and by the worker.
- **Access**: the account the agent uses needs the Help Case Management domains for the cases it reads and writes. An integration system user gets them through an integration system security group, not directly.
- **Who the case is for**: Workday records a case filed through the API for the worker the account belongs to, with the source "Integration". Name the real person in the case text, or run the skill inside an Extend app where Workday knows who is signed in.
- **Tool names**: map the operations in `SKILL.md` to your platform's tools.
- **Tested how**: on 11 November 2026 the author ran every operation in `SKILL.md` on a Workday development tenant with helpCase/v4 and looked at the result on the case page: read the service categories, filed a case (201), read it back, read a timeline, and added comments. A plain `textBody` that contained an address and an `<a>` tag was shown as literal text, not a link. A `content` document with a `link` mark was drawn as a link that opens in a new tab, and it matches what the case page's own editor writes when an address is typed. When the link text and `href` differed, the page followed the text. Sending `textBody` and `content` together was refused with "You cannot add both rich text and plain text in the same comment." Other tenants and versions may differ, so look at one comment in yours first.
