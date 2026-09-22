---
name: workday-extend
description: Reviews and writes Workday Extend app shells and data models. Use when editing .amd, .smd, .businessobject, .businessprocess, .securitydomain, .attachment, or appManifest.json. Do not use for .pmd pages, .card files, or .orchestration flows.
---

# Workday Extend

Review or write the Extend app shell and model. Report only genuine problems.

Open first: `catalog/vehicleRegistration`. For a business process, also open `catalog/tuitionReimbursement`.

If the file is `.pmd`, `.script`, `.card`, or `.orchestration`, stop. Those belong to the page, card, or orchestration skill.

## Rules

- Register each page as an AMD task with `id`, `routingPattern`, and `page.id`. `routingPattern` starts with `/`. The hub task uses `"/"`.
- Set `page.id` to the `.pmd` file's `id`.
- Set `applicationId` to the same value as `appManifest.json` `referenceId`.
- Keep Workday base URLs in `dataProviders` with `{{apiGatewayEndpoint}}` and `site.applicationId`. Never write a `*.workday.com` host.
- Set SMD `siteAuth.authTypes` to scheme `SSO` and id `sso`. Map status codes 401, 404, 500, and 503 to a real error page.
- List every `languages[].code` that has a file in `presentation/presentationLabels/`.
- Put `.amd` and `.smd` in `presentation/`. Put business objects, security domains, and business processes in `model/`.
- Use catalog field types: `TEXT`, `INTEGER`, `DATE`, `BOOLEAN`, `DECIMAL`, `SINGLE_INSTANCE`. A worker reference uses `target` `WORKER` and `secureByTarget: true`.
- Give every page a `securityDomains` entry, and use that same name on the business object's `defaultSecurityDomains`.
- Never put an API key, password, or token in an AMD, SMD, or business object.

## Output format

For each issue, state the file and line, name the rule, and show a short before and after. Skip clean files.

## Test questions

- "Does this AMD route match a page id?"
- "Is the security domain name the same on the model and the page?"
- "This data provider uses a workday.com host. What should replace it?"
