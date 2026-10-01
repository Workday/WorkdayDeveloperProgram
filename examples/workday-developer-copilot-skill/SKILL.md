---
name: workday-developer-copilot
description: Shapes prompts for the product Workday Developer Copilot. Use when the user names Workday Developer Copilot and wants a prompt for an Extend model, a PMD page, an orchestration, or an API payload. Do not use for reviewing application source.
---

# Workday Developer Copilot

Write one prompt the user can paste. Then list what you left out. Do not invent tenant data to fill the prompt.

After Copilot returns JSON, check a page with `workday-pmd`, a model with `workday-extend`, and a flow with `workday-orchestrate`. A generated page that uses `rootWidget` does not match catalog `.pmd` files. Rebuild it as `id`, `securityDomains`, `endPoints`, and `presentation`.

## The prompt names

- The artifact: business object, PMD page, orchestration, or API payload.
- Widget ids and field labels when the target is a page.
- The data source or route name when the target is a page or a flow.
- The HTTP method, path, and scope when the target is an API call.
- Multi-line JSON with 2-space indentation.

## Do not paste

- A client secret, access token, refresh token, certificate, or webhook URL.
- Production worker rows, pay, bank data, government ids, or documents.
- A tenant hostname. Say "sandbox tenant" instead.

## Test questions

- "Write a Workday Developer Copilot prompt for a PMD page that registers a vehicle."
- "Can I paste this access token so Copilot can test the call?"
- "Copilot returned a page with rootWidget. What should I do next?"
