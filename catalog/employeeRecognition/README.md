---
title: Employee Recognition
description: Give feedback to your coworkers and even reward them with gift cards for their hard work.
---

_Version 2025.1_

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
1. Download and unzip the app source code.
1. Open in IntelliJ
   1. Go to Tools > Workday Extend > Log in to Workday Extend. You will be prompted to login to Workday Developer Site.
   1. Go to Tools > Workday Extend > Log in to Tenant. You will be prompted to choose your tenant.
   1. Go to Tools > Workday Extend > Deploy App to Tenant. Select your application.

## Security

### Model Components

Using **App Manager**, perform the following steps:

1. In the **Model Components** section, locate the Security Domain `Manage: Employee Recognition` and click **Create** in the **Domain Security Policy** column.
2. Check `Confirm` and click **OK**.
3. Add the following `Report/Task Permissions` to the Domain Security Policy:
   **Modify:** `HR Administrator`, `HR Partner`, `Manager`

### Request One-Time Payment REST API

1. In your development tenant, search for and select the 'Edit Business Process Security Policy' task.
2. Enter in 'Request One-Time Payment'.
3. Click 'OK'.

4. Scroll down to the section with the `Initiating Item` titled `Request One-Time Payment (REST Service)`.
5. Under the `Security Groups` item, add the following three groups: `HR Administrator`, `HR Partner`, `Manager`
6. Click 'OK' and then 'Done'.
7. In your development tenant, search for the 'Activate Pending Security Policy Changes' task.
8. You should see the changes we just implemented here.
9. Fill in a comment and then select confirm on the follow up screen.

# Run the Application

## Run as a Task (for Direct Reports)

1. Search for _Give Employee Recognition_ in the Workday global search bar.
2. Prompt and select the recipient of the recognition. Only direct reports will appear in the dropdown. Hit `OK` and continue to the main app.

## Run as a Related Action off a Worker

1. In your development tenant, search for an employee, i.e. 'Adam Carlton'.
2. Under related actions for that employee, scroll down to 'Worker', and select 'Worker' > 'Employee Recognition' to be taken to the Employee Recognition app with information for that employee pre-loaded.
