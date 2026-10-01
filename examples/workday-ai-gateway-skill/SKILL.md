---
name: workday-ai-gateway
description: Reviews Workday AI Gateway calls and the AWS starter pattern in the Workday catalog. Use when editing document intelligence, WQL generation, sentiment analysis, or AWS Translate, Textract, Comprehend, or badge flows. Do not use for ordinary .pmd layout or for prompts to Workday Developer Copilot.
---

# Workday AI Gateway

Review the Gateway or AWS call. Report only genuine problems. The page still follows `workday-pmd`. The flow still follows `workday-orchestrate`.

| Need | Open first |
| --- | --- |
| Natural language to WQL | `catalog/generateWQL` |
| Document intelligence | `catalog/documentIntelligenceWithTheAIGateway` |
| AWS Translate, Textract, and Comprehend | `catalog/AWSStarterKit` |
| Badge photo and EventBridge | `catalog/AWSBadgeGenerator` |
| Sentiment on stored text | `catalog/charitableDonationsWithSentimentAnalysis` |

## Rules

- Call the Gateway from an orchestration or an Extend endpoint inside the Workday boundary. Do not send worker documents from the browser to a public model.
- Follow the call shape in the catalog sample you opened. Do not invent a Gateway path.
- Treat model output as untrusted until the page or flow validates required fields.
- Call AWS from the orchestration, not from the page. Store credentials in the tenant secret store.
- Never write a secret, tenant host, access key, or webhook into a page, an AMD, or this skill.

## Output format

For each issue, state the file and line, name the rule, and show a short before and after. Skip clean files.

## Test questions

- "Where should the AWS secret key be stored?"
- "Can the page call Textract directly?"
- "The model omitted a required field. What should the flow do?"
