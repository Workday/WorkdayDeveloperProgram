---
title: Employee Relations Incident Management
description: Enable HR to manage protected cases of HR incidents
---

_Version 2026.1_

_For details and updates associated with this version of the app, see the [App Catalog Changelog](https://forum.developer.workday.com/t/app-catalog-changelog/8423)._

# Overview

_View [Employee Relations Incident Management forum page](https://forum.developer.workday.com/t/app-catalog-app-employee-relations-incident-management/30999). for more information on this app._

# Deploy Instructions

## Create Copy (Recommended)

1. Click the "Create Copy" button above.
2. To modify app source code:
   1. Open the app in the [Console](https://developer.workday.com/console).
   2. Click **Open in App Builder**.
3. After making any changes, **Save and Deploy**.

# Configuration Instructions

## Prerequisites

### Workday Help Case Management in Development Tenant

The app allows for the linking of employee relation incidents to Workday Help cases. **Workday Help Case Management** needs to be enabled in your Development Tenant.

### Enable Customer Central in Development Tenant

The app leverages [Reusable Tenant Configuration](https://forum.developer.workday.com/t/product-update-reusable-tenant-configuration-in-apps-updated-info/26290) functionality.

The functionality requires that Object Transporter is enabled and Customer Central is setup in your Development Tenant.

- [Object Transporter Enablement](https://doc.workday.com/admin-guide/en-us/manage-workday/tenant-configuration/implementation-tools/customer-central/object-transporter/loj1642437052331.html?toc=1.19.2.6.2&lang=en-us)
- [Setup Customer Central in Developer Tenant](https://doc.workday.com/admin-guide/en-us/manage-workday/tenant-configuration/implementation-tools/customer-central/set-up-customer-central-production-access/msj1617876877872.html)

## Tenant Configuration

### Install Tenant Configuration

Using **App Manager**, perform the following steps:

1. Ensure that workday account **lmcneil** has access to the domain: **Help Case Data**.
2. Navigate to **App Manager** within your tenant by doing a search for 'App Manager' and choosing the task or by clicking 'Manage App' after you deploy.
3. Choose _Configure_ on the Employee Relations Incident Management app.
4. Under the **Tenant Configuration** section, click the 'Install' button. This will redirect you to customer central to download the configuration package. For more information see the following [link](https://developer.workday.com/documentation/GUID-65d0bd19-d7c7-4ca3-8c7f-de91c62148e6-enHYPHENus).

### Update Integration System

1. Navigate to **App Manager** within your tenant.
2. Choose _Configure_ on the Employee Relations Incident Management app.
3. Copy the _Reference ID_ under **App Details**.
4. Navigate to **View Integration System** task.
5. Select _INT O4I Employee Relations Incident Management Outbound_ in the **Integration System** field.
6. Click **OK**.
7. Using the related action (...) button, navigate to **Integration -> Configure Integration Attributes** task.
8. Replace the **Application Reference ID** with the _Reference ID_ from step 3.
9. Click **OK**.

## Security

### Model Components

Using **App Manager**, perform the following steps:

1. Navigate to **App Manager** within your tenant by doing a search for 'App Manager' and choosing the task or by clicking 'Manage App' after you deploy.
2. For `Manage: Protected Cases` add the following groups to `Report/Task Permissions`:

   **Modify** :

`HR Administrator`

`HR Partner by Location (Unconstrained)`

`HR Auditor`

3. For `Delete Protected Cases` add the following groups to `Report/Task Permissions`:

   **Modify** :

`HR Administrator`

`HR Partner by Location (Unconstrained)`

`HR Integration Administrator`

4. Run the `Activate Pending Security Policy Changes` task to activate your changes.

### Integration Security

Create ISU: `ISU INTO4I employee relations` and Integration System Security Group: `ISSG INT04I employee relations`.
Assign the following security to the group:

- View
  - Help Case Data
  - WQL for Workday Extend
  - Manage: Protected Cases ({your app id})
- Modify
  - Custom Report Creation
  - Manage Protected Cases ({your app id})
- Get
  - Manage Protected Cases ({your app id})
  - Help Case Data
  - Process: Help Cases
  - Questionnaire Results
    - Integration Event
- Put
  - Integration Event

Once these permissions have been granted, don’t forget to **Activate Pending Security Policy Changes** and assign the ISU as the owner of the Integration System `INT O4I Employee Relations Incident Management Outbound` and RaaS report `INT O4I Employee Relations Incident Management Outbound - Extract Linked Help Cases`.

### Assign Integration System Users to App

Please follow the [instructions](https://developer.workday.com/documentation/GUID-72d57df4-c4ec-4825-a6e8-fdd596cf930e) on the Dev Site to assign ISU: `ISU INTO4I employee relations` to the app.

## App Attributes

1. Navigate to the **App Manager** task within the tenant.
2. Click the button _Update App Configuration_. This will populate the configuration options on the screen.
3. Once you see the _default_ configuration, choose the _Edit_ button in the grid.
4. For _protectedCaseObjectWID_, hit the **+** button to add a new value.
5. In another tab, go to **App Manager** and then under **Business Objects** locate `Protected Cases`. Click related actions on this object and then select **Integration IDs->view IDs**. Copy the Workday ID.
6. On the first tab, paste the Workday ID into the `value` column of the `protectedCaseObjectWID` object. Then Click **OK**.

# Usage Instructions

1.  In your Development tenant, search for and run the `Employee Relations Incident Management` **Task**.
2.  Navigate to **Admin: View Configuration** on the left navigation panel
3.  You'll see three tabs on this page:

    a.**Configuration Values**

        i. Case Tags: Many case tags can be added here which will appear as selectable tags.

        ii. Workday Help Type Filter: A filter can be applied here to all references of Workday Help cases within this solution.

    b.**Case Templates**

        i.Any number of case templates can be added via the **Add Case Template** button

    c.**Case Statuses**

    Some case statuses are required for the application to work correctly. You should add at least 2 for the application to work correctly. For example "**Reported**" with _Inital_ selected and _Resolved_ unselected, and **Closed** with _Resolved_ selected and _Initial_ unselected would be sufficient as a prototype.

        i.	Any number of case statuses can be added via the Add Case Statuses button
        ii.	Ensure that at least one status is marked as Initial so that when a new case is created, the default status will be set to this value
        iii.	Also ensure that at least one status is marked as Resolved so that all screens and reports capture both open and resolves cases separately

4.  Click **Home** to return to the main page
5.  Click **Create New Case** and click **OK** to move to the report screen.
6.  Fill out all required fields. Fill in the "Assigned To" field with `Logan McNeil`.
7.  Press **Save**
8.  When you click "**Assigned to Me**" you should see your newest case assigned to you.
