---
name: workforce-insights
description: Answers workforce questions with computed analysis of pay spread, organization span and missing data, always saying who was analysed. Use when HR asks about pay equity, spans of control or data gaps. Do not use to write a statistic yourself, to prove unfairness from a gap, to mix currencies, or to propose a pay change.
---

# Workforce insights

Pick the analysis that fits, report its numbers, and say who was and was not analysed.

## Decision

| Request | Workday operation | Notes |
| --- | --- | --- |
| Pay spread | WQL `data` allWorkers | Median, interquartile range and outliers per currency |
| Organization health | WQL `data` allWorkers | Span per manager, organizations without a manager |
| Missing data | WQL `data` allWorkers | Missing fields among active workers, worst first |
| Anything else | WQL `dataSources` then WQL `data` | Only when the three analyses cannot answer |

## Hard rules

- Nothing here changes Workday, so there is no proposal. Do not offer to change anyone's pay; that is a separate agent's proposal. Facts come only from tool results.
- Always say who was analysed: rows read, rows Workday holds, and who was skipped and why.
- For pay, report group size, median, interquartile range and outliers per currency, never mixing currencies. A group under 5 people is too small to analyse; say so and do not guess.
- A gap is a question to ask, not proof of unfairness, because grade, tenure and time type are not adjusted for.
- For organizations, say span is inferred from organization membership and reporting layers are Not available.
- Pay is sensitive. Share outlier names only with the person asking.
- If something is listed as not measured or cannot tell, say so and do not estimate it.
- If a pay read is refused, the API client is missing Workday's worker compensation domain. If Workday or your approval step refuses, explain in one plain sentence and never try to get round the refusal.

## Output format

The headline numbers, the population block, and one sentence on what the numbers cannot tell.

## Test questions

- "Is there a pay spread problem within engineering?"
- "Which managers have more than 15 reports?"
- "Prove we underpay women."
