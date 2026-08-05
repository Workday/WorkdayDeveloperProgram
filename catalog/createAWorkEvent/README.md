---
title: Create A Work Event
description: Enable employees to propose and create work events, to register for events, and use a calendar view.
---

_Version 2025.1_

_For details and updates associated with this version of the app, see the [App Catalog Changelog](https://forum.developer.workday.com/t/app-catalog-changelog/8423)._

# Introduction

_View [the Create A Work Event forum page](https://forum.developer.workday.com/t/app-catalog-app-create-a-work-event/7301) for even more details and a video demo of the app._

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

#### Manage: Create an Event Security Domain

Using **App Manager**, perform the following steps:

1. In the **Model Components** section, locate the Security Domain `Manage: Create an Event` and click **Create** in the **Domain Security Policy** column.
2. Check `Confirm` and click **OK**.
3. Add the following `Report/Task Permissions` to the Domain Security Policy:
   **Modify:** `HR Administrator`

#### Register For Events Security Domain

Using **App Manager**, perform the following steps:

1. In the **Model Components** section, locate the Security Domain `Register For Events` and click **Create** in the **Domain Security Policy** column.
2. Check `Confirm` and click **OK**.
3. Add the following `Report/Task Permissions` to the Domain Security Policy:
   **Modify:** `All Employees`

#### Create a Work Event Business Process

1. Locate the `Create Work Event` Business Process in App Manager and click **Edit** in the Security Policy column.
2. Configure the Business Process Security Policy with the following permissions:
   1. **Initiate Create a Work Event:** `Employee as Self`
   2. **Action Steps: Book Event Space:** `HR Administrator`
   3. **View All:** `Employee as Self`, `HR Administrator`
   4. **Approve:** `Manager`
   5. **Deny:** `Manager`
3. Run the `Activate Pending Security Policy Changes` task to activate your changes.
4. Locate the `Create a Work Event` Business Process in App Manager and click **Create** in the Business Process Definition column. Click **OK**.
5. On the Edit Business Process screen, click **OK** and **Done** to create an empty definition that auto-completes.
   - Optionally, you can add additional business process steps, such as an approval step for **HR Administrators**.

# Usage Instructions

1. In your Development tenant, search for and run the `Work Event Registration` **Task**.
2. Click on the **Create an Event** button to create a new work event if one does not yet exist.
3. Click on the **Manage Events** button to create or update Work Events.
4. Click on the **Register for an Event** button to sign up for an existing Work Event. You can sign up for an event only once. A charity must already exist to use the Donations page.
5. Click on the **Manage My Events** button to view and manage your existing registrations.
6. Click on the **Calendar View** button to view, create, and register for work events using a Multi-Select Calendar widget.
