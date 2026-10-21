# Smart CSV Org Assignment Loader

## What it is

An Extend app and orchestration for Workday admins who change organization assignments in bulk. The Assign Organization EIB expects one parent row per worker plus a child row per custom organization, and a single inactive or misspelled Reference ID fails the row with a SOAP fault. This example takes a flat CSV instead, one row per worker, checks each worker and position against the tenant with WQL before anything is written, and then loads the valid rows through the Staffing `Change_Organization_Assignments` web service (v42.0), writing each row's result back so you can see what succeeded.

## What's inside

- `presentation/uploadAndValidateOrgCsv.pmd`: paste the CSV, click **Validate**, review the results grid, then **Load valid rows**. Rows marked ERROR are skipped; only VALID rows are staged and loaded.
- `presentation/scripts/csvParserAndValidator.script`: parses the CSV, builds WQL queries that fetch only the IDs in the file, validates each row, and builds the SOAP request body. Blank organization columns are left out of the request, so Workday keeps the existing assignment.
- `presentation/viewLoadBatchHistory.pmd`: every staged row with its status (`STAGED`, `COMPLETED`, `SOAP_FAULT`) and message.
- `model/OrgAssignmentLoadRow.businessobject` and `model/SmartOrgLoaderDomain.securitydomain`: the staging business object and its security domain.
- `orchestration/processOrgAssignmentLoad.orchestration`: an **asynchronous** orchestration, launched once by the page with the `batchId` and every valid row. For each row it creates a `STAGED` record in the business object, sends one SOAP call, and patches the record with `COMPLETED` or the SOAP fault text.
- `samples/assign_org_sample_template.csv`: five rows, three valid and two with deliberate errors.

### What the validation catches

| Check | Example message |
| --- | --- |
| Employee isn't an active worker | `Employee_ID 'EMP_99999' is not an active worker` |
| Position isn't held by that worker | `Position 'P-00999' isn't held by EMP_21001` |
| Date format | `Effective_Date '11/01/2026' must be YYYY-MM-DD` |
| Same worker twice for one date | `Duplicate of row 2: one change per worker per effective date` |
| Quoted cells | `Remove quotes: Reference IDs never contain commas` |

Up to three custom organizations per row (`Custom_Org_1` to `Custom_Org_3`). Blank cells keep the worker's existing assignment.

Organization Reference IDs (unknown IDs, wrong type for the column, types not allowed on positions) and business-process conflicts (e.g. pending actions on the worker) are checked by Workday itself at load. Each row's result, including Workday's exact fault text, appears in **Batch history** as `COMPLETED` or `SOAP_FAULT`. Rows marked `ERROR` in pre-validation are skipped, never sent.

## How to use it

1. Deploy the app source to your development tenant (App Builder, the IDE plugins, or the WDCLI), then install it.
2. Import `orchestration/processOrgAssignmentLoad.orchestration` in Orchestration Builder and deploy it to the same app.
3. Map `SmartOrgLoaderDomain` to a security group that may change organization assignments.
4. Open **Smart CSV Org Assignment Loader**, paste `samples/assign_org_sample_template.csv` with your own tenant's IDs, and click **Validate**.
5. Fix rows in red (or let them be skipped), then click **Load valid rows**. The load runs in the background, so the page returns straight away, even for hundreds of rows. Open **Batch history** to watch progress: rows appear as `STAGED` and turn `COMPLETED` or `SOAP_FAULT` as Workday processes them. Refresh the page until no `STAGED` rows remain.

**Auto-complete** is off by default, so each change goes through your normal business process approvals. Turn it on only when you mean to skip them.

## Before you deploy

- **App reference id**: the orchestration builds its business object path from `context.appReferenceId()`, so it follows whatever reference id Workday generates for your app.
- **WQL field names**: the worker query uses `employeeID` and `positionID` on `workersForHCMReporting`. Confirm them in your tenant (the `wql` catalog app helps) and adjust the script if they differ. Organization IDs aren't pre-checked with WQL; Workday validates them at load.
- **Organization type names**: the type check compares against `Cost Center`, `Company` and `Region`. Change these if your tenant names the types differently.
- **Load size**: the whole file goes in one asynchronous launch, so loads aren't bound by the synchronous request timeout. Each row's SOAP request travels in the launch body (about 1 KB a row). **Batch history** shows the latest 100 rows.
- **Web service version**: the request uses Staffing v42.0. Update the version in the script and the orchestration's SOAP path together.

### Tested so far

Run end to end in a Workday development tenant (October 2026): CSV parsing, blank cells, bad dates, duplicate worker/date rows and unknown positions are caught before load; valid rows complete and show up in Worker History as Assign Organizations events; invalid organization IDs and pending-action conflicts come back as `SOAP_FAULT` with Workday's message. A 47-row file loaded in one background launch and finished in about a minute. Not yet observed: a change that routes to approval (the test user's changes auto-completed) and a successful custom organization assignment.
