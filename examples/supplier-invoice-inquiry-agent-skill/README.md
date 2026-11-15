# Supplier invoice inquiry skill

## What it is

A markdown skill for an agent that checks supplier invoice status, explains payment holds and match exceptions, and prepares AP escalation notes in Workday Financials. It helps suppliers, procurement buyers, and accounts payable specialists quickly look up invoice lifecycle states, verify scheduled payment dates, and understand why an invoice may be held up (such as 2-way or 3-way match variances) without exposing sensitive banking credentials.

## What's inside

- `SKILL.md` is the agent skill: the Workday Financial Management operations, status and hold lifecycle definitions, financial security guardrails against exposing bank account details, and output formats.
- `example.json` is the metadata file used by the Workday Developer Program gallery and validation tooling.

## How to use it

1. Read `SKILL.md`.
2. Provide your agent with read tools for the Workday Financials REST and WQL operations listed in the decision table.
3. Add a prepare-only tool for drafting AP escalation notes or invoice comments, gated by human approval.
4. Integrate the skill with your agent runtime (such as Claude Code, Cursor, or an internal enterprise agent) and verify with the test questions at the bottom of `SKILL.md`.

## Before you deploy

- **Approval gate & separation of duties**: Hold release and payment settlement are strictly governed internal financial processes. The agent must never release holds or trigger payments autonomously. Escalation notes must be confirmed by a human before posting to Workday.
- **Security domains & permissions**: The integration system user or caller needs the `View: Supplier Invoice` domain to read invoices, lines, and payment statuses, and `Process: Supplier Invoice` or `Manage: Supplier Invoice` if posting escalation notes.
- **Banking data protection**: Strict enterprise compliance applies. The agent is instructed never to disclose bank routing numbers, full bank account numbers, SWIFT/IBAN codes, or taxpayer identification numbers (EIN/VAT). Ensure your underlying API responses either omit or mask bank account details before passing them into the model context.
- **Tool names**: Map the operations in `SKILL.md` to your platform's specific tool calls (e.g. `workday_rest_api` or `workday_wql_query`).
- **Tested how**: Operations and query patterns were validated against Workday Financial Management REST APIs (`financialManagement/v1/supplierInvoices`) and WQL queries over the `supplierInvoices` data source in a Workday development tenant.
