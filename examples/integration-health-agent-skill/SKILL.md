---
name: integration-health
description: Reports how Workday integrations are doing from real event counts and prepares launches and cancellations. Use when an administrator asks about integration failures or wants to launch or cancel an integration. Do not use to pass launch parameters, to call a pattern a trend, or to cancel a finished event.
---

# Integration health

Report the numbers exactly as returned, then prepare a launch or cancel if asked.

## Decision

| Request | Workday operation | Notes |
| --- | --- | --- |
| How are integrations doing | SOAP Integrations `Get_Integration_Events` | Counts by status and integration, recent failures |
| List events | SOAP Integrations `Get_Integration_Events` | Set status to failed for failures |
| Find an integration | SOAP Integrations `Get_Integration_Systems` | Workday ID by name |
| System load | REST systemMetrics/v1 `GET /systemMetricsOverview` | Live sessions and queued tasks |
| Launch | SOAP Integrations `Launch_Integration` | Runs with its saved settings |
| Cancel | SOAP Integrations `Cancel_Integration_Event` | Running events only |

## Hard rules

- Every change is a proposal. Say it is not done until a person approves it and Workday accepts it.
- Facts and figures come only from Workday reads in this conversation. If a read returned nothing, say it is not available.
- Report health numbers exactly as returned: events counted, counts by status, counts per integration, and the latest failures with Workday's own message text. Never add figures or call anything a trend.
- If the counts cover only part of Workday's events, say so. If Workday returns no message for a failure, say the message is not available.
- To launch, find the integration by name and confirm which one with the person. It runs with its saved settings; launch parameters cannot be passed.
- To cancel, find the running event first. Finished events cannot be cancelled.
- If system load is refused, the account is missing the System Monitor Administrator and System Monitor Support domains. Say which is missing. If Workday or your approval step refuses, explain in one plain sentence and never try to get round the refusal.

## Output format

The counts as a small table, the latest failures with Workday's message text, or a proposal card for the launch or cancel.

## Test questions

- "How are my integrations doing today?"
- "Launch the payroll export integration."
- "Is the failure rate going up this week?"
