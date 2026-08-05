---
title: Charitable Donations with Sentiment Analysis
description: Enable employees to donate to charities with one-time and recurring payroll deductions. Features hubs and cards.
---

_Version 2024.2_

_For details and updates associated with this version of the app, see the [App Catalog Changelog](https://forum.developer.workday.com/t/app-catalog-changelog/8423)._

_View the [Additional Docs for this App on the Forum](https://forum.developer.workday.com/t/draft-devcon-2025-reference-app-charitable-donations-pro-update/24293) for more details._

# Deploy Instructions

## Create Copy (Recommended)

1. Click the "Create Copy" button above.
2. To modify app source code:
   1. Open the app in the [Console](https://developer.workday.com/console/apps).
   2. Click **Open in App Builder**.
3. After making any changes, **Save and Deploy**.

## Manual Deploy (Alternative)

1. Install the [Workday Extend Plugin for IntelliJ](/downloads#wcp-plugin).
1. Download and unzip the app source code.
1. Open in IntelliJ
   1. Go to Tools > Workday Extend > Log in to Workday Extend. You will be prompted to login to Workday Developer Site.
   1. Go to Tools > Workday Extend > Log in to Tenant. You will be prompted to choose your tenant.
   1. Go to Tools > Workday Extend > Deploy App to Tenant. Select your application.

# Configuration Instructions

## Security

### Model Components

Using **App Manager**, perform the following steps:

1. In the **Model Components** section, locate the Security Domain `Manage: Charities` and click **Create** in the **Domain Security Policy** column.
2. Check `Confirm` and click **OK**.
3. Add the following `Report/Task Permissions` to the Domain Security Policy:
   **Modify:** `All Employees`
4. Locate the `Create Charity` Business Process in App Manager and click **Edit** in the Security Policy column.
5. Configure the Business Process Security Policy with the following permissions:
   **Initiate Create Charity:** `Employee as Self`
   **View All:** `Employee as Self`, `Payroll Administrator`
   **Approve:** `Payroll Administrator`
   **Deny:** `Payroll Administrator`
6. Run the `Activate Pending Security Policy Changes` task to activate your changes.
7. Locate the `Create Charity` Business Process in App Manager and click **Create** in the Business Process Definition column. Click **OK**.
8. On the Edit Business Process screen, click **OK** and **Done** to create an empty definition that auto-completes.
   - Optionally, you can add additional business process steps, such as an approval step for **Payroll Administrators**.

### Payroll Input REST API

1. In your Development tenant, search for `domain: payroll public api`.
2. Find the `Self-Service: Payroll Public API (Payroll Input)` Security Domain in the search results, and perform a related action to select `Domain > Edit Security Permissions`.
3. Make sure that the status is set to `Active`, If status is not active, use the related actions under Functional Areas `Core Payroll > View Domain Security Policies`. Scroll down to 'Payroll Public API (Payroll Input)'. Use the related actions for `Domain Security Policy > Enable`. Go back to edit the domain security policy of `Self-Service: Payroll Public API (Payroll Input)`.
4. Add the following `Report/Task Permissions` to the Domain Security Policy:
   **Modify:** `Employee as Self`, `Employee Pay Component Visibility`
5. Click **OK**.
6. Run the `Activate Pending Security Policy Changes` task to activate your changes.

# Usage Instructions

1. In your Development tenant, search for and run the `Charity Home` **Task**.
2. Click on the **Create Charity** button to create a new charity if one does not yet exist.
3. Click on the **Manage Charities** button to create or update Charities.
4. Click on the **Donate to Charity** button to donate to Charities. A charity must already exist to use the Donations page.
5. Click on the **My Charitable Donations** button to manage your Charitable Donations.
6. Use the **View Payroll Input(s) by Worker** task, or other Workday Payroll tasks, to view Pay Inputs created by the app.
7. Access the **All Charities** task from Global Search or App Manager to view the new report.
