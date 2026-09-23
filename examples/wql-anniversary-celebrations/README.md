# WQL Milestone Celebrations Orchestration

## What it is

An orchestration that queries Workday via Workday Query Language (WQL) to identify active workers celebrating milestone work anniversaries (1, 5, 10, 15, and 20+ years of service) in an upcoming period, extracts worker details, and prepares a structured celebration payload for team communication channels (such as Slack, Microsoft Teams, or email digests). Use this example to learn how to combine WQL data retrieval with Workday Orchestrate to automate employee milestone recognition without custom integration code.

## What's inside

- `wql/anniversaries.wql`: The standalone WQL query selecting workers, hire dates, length of service, and management structure from the `allActiveWorkers` data source.
- `wql/milestoneAnniversaries.wqlquery`: The structured WQL query definition configured for Orchestration and Presentation components.
- `orchestration/milestoneAnniversaries.orchestration`: The complete Workday Orchestrate flow definition with input handling, WQL execution, error logging, and response formatting.
- `sample-data/sample-wql-response.json`: Fictional WQL query response showing the returned worker attributes and milestone data.
- `sample-data/sample-webhook-payload.json`: Formatted card payload ready for delivery to incoming collaboration webhooks.
- `example.json`: Metadata file used by the Workday Developer Program gallery.

## How to use it

1. Import `orchestration/milestoneAnniversaries.orchestration` into Workday Orchestration Builder.
2. In your Workday tenant, configure or assign an Integration System User (ISU) with permissions for:
   - `Workday Query Language (WQL)`
   - `Worker Data: Public Worker Reports`
3. Point the orchestration's Workday credential reference to your tenant's ISU credential.
4. Schedule the orchestration to execute on a recurring cadence (e.g., weekly on Monday morning) or trigger it via a REST endpoint.
5. Review execution runs and payload output in Orchestration Activity logs.

## Before you deploy

Before deploying this orchestration to your target tenant, verify the following configuration points:

- **Security Domains**: Ensure your Integration System User (ISU) has read access to `Worker Data: Public Worker Reports` and execution privileges for WQL.
- **WQL Endpoint Path**: The example uses the standard relative path `/wql/v1/data` with `_DEFAULT_WORKDAY_CREDENTIAL`. Confirm your tenant supports WQL REST API version 1.
- **Downstream Webhook Destination**: If connecting to an external collaboration channel (Slack, Microsoft Teams, or internal service), create an Outbound HTTP step and populate the target webhook URL via tenant environment variables rather than hardcoding.
- **Date Window Filtering**: Adjust the date logic in the WQL query (`WHERE hireDate IS NOT NULL`) to match your organization's celebration cadence (e.g., matching the current calendar month or seven-day forward window).
