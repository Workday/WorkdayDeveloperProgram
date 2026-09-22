---
name: workday-pmd
description: Reviews and writes Workday Extend presentation files. Use when editing .pmd pages, .script files, chart pages, or .properties localization bundles. Do not use for .card, .carddefinition, .cardtenantsetting, .amd, or .orchestration files.
---

# Workday PMD

Review or write pages, scripts, and charts. Report only genuine problems.

Open first: `catalog/pmdWidgetDictionary`. For scripts, open `catalog/pmdScripting`. For charts, open `catalog/chartDictionary`. For a real page with endpoints, open `catalog/vehicleRegistration/presentation/home.pmd`.

## Rules

- Set the page `id` to the AMD task's `page.id`.
- Give every page a `securityDomains` entry that matches the business object's `defaultSecurityDomains`.
- Give every widget an `id`.
- Put data calls in `endPoints`. Set `baseUrlType` to a key declared in the AMD `dataProviders`.
- Call Graph with `httpMethod` `POST` and `graphQuery.queryId` set to the `.graphquery` file's `id`.
- Set `authType` to `sso` on Workday endpoints.
- List `failOnStatusCodes` for at least 400 and 403 on every endpoint.
- Bind with `<% ... %>`. Put user-facing copy in `<% presentationLabels.KeyName %>` and in `presentation/presentationLabels/`.
- Never leave a `console.*` call in a page or a binding.
- Never write a `*.workday.com` host, client secret, token, or webhook in the page.
- Copy widget tags from `catalog/pmdWidgetDictionary/presentation/`. Do not invent a widget type.
- Put scripts in `presentation/scripts/` and end each script with an export object. Include the script from the page before calling it.

## Output format

For each issue, state the file and line, name the rule, and show a short before and after. Skip clean files.

## Test questions

- "This page has no securityDomains. Is that a problem?"
- "The endpoint fails on 400 only. What is missing?"
- "A label is hardcoded in the page. Where should the text live?"
