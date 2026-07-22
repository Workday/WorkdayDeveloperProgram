# Example title

## What it is

One short paragraph: what this example shows and who it is for. If it maps to a Workday use case (a card on the home page, an approval flow, a report), say so here.

## What's inside

Bullet the contents of this folder so a reader knows what they are looking at. For instance:

- `app/` holds the Extend app source exported from App Builder
- `orchestrations/` holds the orchestration definitions
- `SKILL.md` is the agent skill
- `diagrams/` holds the architecture drawings

## How to use it

The concrete steps to put this example to work, whatever that means for this artifact. Examples:

- **Extend app source**: import the folder into App Builder against your WCP development tenant (or upload the ZIP to App Hub), then deploy, install, and launch.
- **Orchestration**: import it in Orchestration Builder and point the credentials at your tenant.
- **Agent skill or reference material**: read it, copy it, adapt it.

If your example needs configuration (credentials, tenant URLs), document the variables here and never commit real values.

---

## Fill in example.json (delete this section before submitting)

Metadata is JSON only. All fields:

| Field | Required | What to put there |
| --- | --- | --- |
| `title` | Yes | Short display name, shown on the card |
| `description` | Yes | One or two sentences, shown on the card and in the README index |
| `type` | Yes | What this example is. One of the `types` in `hub.config.json`, for example `Extend App`, `Orchestration`, `Agent Skill` |
| `components` | No | Building blocks used, from the `components` list in `hub.config.json` (Presentation, Model, Orchestration, ...) |
| `products` | No | Workday products touched, from the `products` list in `hub.config.json` |
| `authors` | No | GitHub usernames |
| `tutorial` | No | An https link to a walkthrough. Adds a Tutorial link to the card. Omit or leave empty if none |

Validate from the repository root with `node scripts/validate-examples.mjs`.
