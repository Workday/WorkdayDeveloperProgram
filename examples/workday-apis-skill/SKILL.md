---
name: workday-apis
description: Chooses and reviews Workday REST, SOAP, Graph API, and WQL calls. Use when editing .graphquery or .wqlquery files, or when writing REST, SOAP, OAuth, or pagination handling. Do not use for .pmd layout or .orchestration step structure.
---

# Workday APIs

Pick the API, then review the call. Report only genuine problems.

| Need | API | Open first |
| --- | --- | --- |
| A few fields in one round trip | Graph | `catalog/vehicleRegistration/presentation/graphQueries` |
| Create or update one resource | REST | `catalog/updateWorkdayAccounts` |
| Bulk XML | SOAP | `catalog/workerInboundImageUpload` |
| A report or extract | WQL | `catalog/employeeRecognition/presentation/wqlQueries` and `catalog/wql` |
| One Graph call that creates a record | Graph | `catalog/createSpotBonus` |

## Rules

- Store a Graph query as `.graphquery` JSON with `id` and `query`. The page sets `graphQuery.queryId` to that id, `baseUrlType` `workday-graph`, and `httpMethod` `POST`.
- Store a WQL query in `presentation/wqlQueries/<id>.wqlquery` with `id`, `parameters`, and `query`. Every `<% name %>` token is listed in `parameters`.
- Get a REST token with the client-credentials grant. Never write the client id, client secret, or access token into a source file.
- Page REST results with `limit` (maximum 100) and `offset`. On 429, back off. On 401, refresh the token.
- Address SOAP by the tenant service host name. Do not pin an IP. Keep the envelope in an orchestration, not in a page.
- Never log a token or a body that contains pay or a government identifier.

## Output format

For each issue, state the file and line, name the rule, and show a short before and after. Skip clean files.

## Test questions

- "The page needs five worker fields. Which API do I use?"
- "Where does the Graph query text live?"
- "The REST call returns 429. What should the client do?"
