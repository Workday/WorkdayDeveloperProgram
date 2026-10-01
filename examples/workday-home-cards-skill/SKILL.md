---
name: workday-home-cards
description: Reviews and writes Workday Home cards. Use when editing .card, .carddefinition, or .cardtenantsetting files, or when placing a card on Workday Home. Do not use for ordinary .pmd pages that are not cards.
---

# Workday Home Cards

Review or write Home card files. Report only genuine problems.

Open first: `catalog/employeeRecognition/cards/createRecognitionCard.carddefinition`. For a tenant setting, open `catalog/workFromAlmostAnywhere/cards`.

## Rules

- Store the Home card in `cards/<name>.carddefinition` at the app root.
- Set a stable `id`. Employee Recognition uses `createRecognitionCard`. A page `cardContainer` references that id as `cardId`.
- Use `presentation.type` `inlineCard`, `header.type` `cardHeader`, and `body.type` `simpleCard`.
- Keep the icon on a file the app already ships. Do not invent an icon name.
- Add a footer action whose `taskReference.taskId` is an AMD task id when the card launches a page.
- Add a `.cardtenantsetting` beside the definition when the card is launched from Home. Include `securityDomains` and a `routePath` that starts with `/`.
- A card file does not appear on Home by itself. Place it in Workday Home settings after deploy.
- Never hardcode a tenant host or a secret in the card.
- In-page cards that are not on Home live in `presentation/cards/*.card`. Copy tags from `catalog/pmdWidgetDictionary/presentation/cards/`.

## Output format

For each issue, state the file and line, name the rule, and show a short before and after. Skip clean files.

## Test questions

- "Where does a Home card definition live?"
- "The card launches a page. What must the footer name?"
- "Is a .carddefinition enough for the card to show on Home?"
