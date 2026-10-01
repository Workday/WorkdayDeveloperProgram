---
name: workday
description: Chooses which Workday skill to apply when starting an app or when a task spans more than one artifact. Use when the user asks to build a new Workday app, choose Extend versus an Integration App versus an API, or the change touches pages, models, orchestrations, and queries together.
---

# Workday

Pick one skill and one catalog sample. Do not restate that skill's rules. If the task is a single file type, stop and use only the matching skill.

## Decision

| You are building or changing | Skill | Open first |
| --- | --- | --- |
| App shell, AMD, SMD, business object, security domain, business process, manifest | `workday-extend` | `catalog/vehicleRegistration` |
| Model plus approval business process | `workday-extend` | `catalog/tuitionReimbursement` |
| `.pmd`, `.script`, charts, `.properties` | `workday-pmd` | `catalog/pmdWidgetDictionary` |
| `.card`, `.carddefinition`, `.cardtenantsetting` | `workday-home-cards` | `catalog/employeeRecognition/cards` |
| `.orchestration`, `.suborchestration` | `workday-orchestrate` | `catalog/orchestrateForIntegrationsSampler` |
| Outbound integration file | `workday-orchestrate` | `catalog/employeeDemographicOutbound` |
| `.graphquery`, `.wqlquery`, REST, SOAP | `workday-apis` | `catalog/vehicleRegistration/presentation/graphQueries` |
| AI Gateway or an AWS starter call | `workday-ai-gateway` | `catalog/generateWQL` |
| A prompt for Workday Developer Copilot | `workday-developer-copilot` | `catalog/generateWQL` |

## Which runtime

- User-facing UI inside Workday: Extend (`workday-extend` plus `workday-pmd`).
- Headless sync, file drop, schedule, or business event: an Integration App (`workday-orchestrate`).
- A caller outside Workday reading or writing data: an API (`workday-apis`). Use Graph for an exact field set, REST for one resource, SOAP for bulk XML, and WQL for reporting.

## Layout

Match the catalog sample. Do not invent a tree.

- `presentation/` for `.amd`, `.smd`, `.pmd`, `graphQueries/`, `wqlQueries/`, `scripts/`, `presentationLabels/`, and in-page `.card` files
- `model/` for business objects, security domains, and business processes
- `orchestration/` for flows
- `cards/` at the app root for `.carddefinition` and `.cardtenantsetting`
- `attributes/` and `appManifest.json` at the app root

Copy only apps under `catalog/`. Do not invent security domain ids, routes, or endpoints.

## Test questions

- "I need a new Extend app with a page and a business object. Where do I start?"
- "This change is only a .pmd file. Which skill applies?"
- "Should this be an orchestration or a REST call?"
