---
title: Help Case Creation
description: Build a custom Workday UI to facilitate creation of Workday Help Cases.
---

_Version 2024.1_

_For details and updates associated with this version of the app, see the [App Catalog Changelog](https://forum.developer.workday.com/t/app-catalog-changelog/8423)._

# Deploy Instructions

## Create Copy (Recommended)

1. Click the "Create Copy" button above.
2. To modify app source code:
   1. Open the app in the [Console](https://developer.workday.com/console/apps).
   2. Click **Open in App Builder**.
3. After making any changes, **Save and Deploy**.

## Manual Deploy (Alternative)

1. Install the [Workday Extend Plugin for IntelliJ](/downloads#wcp-plugin).
2. Download and unzip the app source code.
3. Open in IntelliJ
   1. Go to Tools > Workday Extend > Log in to Workday Extend. You will be prompted to login to Workday Developer Site.
   2. Go to Tools > Workday Extend > Log in to Tenant. You will be prompted to choose your tenant.
   3. Go to Tools > Workday Extend > Deploy App to Tenant. Select your application.

# Configuration Instructions

## Workday Help

It is recommended that you use a new(er) Dev tenant to work with Journeys and Help, so if you've had your Dev tenant for a while, might be time for a refresh.

There is no additional configuration required to run the Help reference app as a new Dev tenant will have the required configuration set up properly. For further information on getting started with Journeys and Help please refer to this [Developer Forum topic](https://forum.developer.workday.com/t/getting-started-with-journeys-help/112).

## Model Components

Using **App Manager**, perform the following steps:

1. In the **Model Components** section, locate the Security Domain `Self Service: Create Case with Workday Extend` and click **Create** in the **Domain Security Policy** column.
2. Check `Confirm` and click **OK**.
3. Add the following `Report/Task Permissions` to the Domain Security Policy:
   **Modify:** `All Employees`
4. Locate the Security Domain `Set up: Help Case Management` and click the magnifying glass for `View Domain Security Policy`
5. Add the following `Report/Task Permissions` to the Domain Security Policy:
   **Modify:** `HR Administrator`
6. Run the `Activate Pending Security Policy Changes` task to activate your changes.
7. Run task `Manage Service Categories` and add at least one Service Category and one Case Type under a Service Category.

# Usage Instructions

1. In your Development Tenant, search for and run the **Create Case with Workday Extend** task.
