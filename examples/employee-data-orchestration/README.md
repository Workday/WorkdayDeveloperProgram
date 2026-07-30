# Get and Create Employee Data

## What it is

An orchestration that fetches worker data through the Workday REST API and creates matching records, following the official Get and Create Workday Employee Data walkthrough on the Workday developer site. Use it to learn the basic read-then-write orchestration pattern: call an API, map the response with Create Values steps, and post the result.

Status: this is a sample entry that demonstrates the hub's format. The `orchestration/` folder holds a placeholder until the exported orchestration definition lands.

## What's inside

- `orchestration/` is where the orchestration definition exported from Orchestration Builder lives.
- The Tutorial button on this example's page links to the official walkthrough this orchestration follows.

## How to use it

1. Import the orchestration definition from `orchestration/` in Orchestration Builder.
2. Point the orchestration credentials at your tenant's Integration System User.
3. With Workday Extend, push straight to your development tenant and run it. Without Extend, promote the orchestration to IMPL, then deploy it to your tenant.
4. Check Orchestration Activity for the execution log.

## Related documentation

- The full walkthrough: Get and Create Workday Employee Data on the Workday developer site.
- Orchestration Builder concepts, steps, and debugging live under the Orchestration section of developer.workday.com.
