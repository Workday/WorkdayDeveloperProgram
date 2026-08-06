---
title: Work From Almost Anywhere
description: Enable employees to request to work from anywhere, for a manager to approve, and use a calendar view.
---

_Version 2025.2_

_For details and updates associated with this version of the app, see the [App Catalog Changelog](https://forum.developer.workday.com/t/app-catalog-changelog/8423)._

# Introduction

_View [the Work From Almost Anywhere forum page](https://forum.developer.workday.com/t/app-catalog-app-work-from-almost-anywhere/7493) for even more details and a video demo of the app._

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

### App Attributes

Using **App Manager**, perform the following steps:

1. In the **App Attributes** section, click the `Update App Configuration` button.
2. Check `Confirm` and click **OK**.
3. In the table that appears, click the `Edit` button in the rightmost column.
4. Click the plus in the `Max Remote Days` row and add a numeric value (e.g., 30) in the `Value` column. This will be the maximum days a worker can request to Work From Anywhere in a given calendar year.
5. Click OK to save.

### Model Components

#### Manage: Work From Anywhere Security Domain

Using **App Manager**, perform the following steps:

1. In the **Model Components** section, locate the Security Domain `Manage: Work From Anywhere` and click **Create** in the **Domain Security Policy** column.
2. Check `Confirm` and click **OK**.
3. Add the following `Report/Task Permissions` to the Domain Security Policy:
   1. **Modify:** `HR Administrator`

#### Remote Work Self Service Security Domain

Using **App Manager**, perform the following steps:

1. In the **Model Components** section, locate the Security Domain `Remote Work Self Service` and click **Create** in the **Domain Security Policy** column.
2. Check `Confirm` and click **OK**.
3. Add the following `Report/Task Permissions` to the Domain Security Policy:
   1. **Modify:** `All Employees`

#### Work From Anywhere Request Business Process

1. Locate the `Work From Anywhere Request` Business Process in App Manager and click **Edit** in the Security Policy column.
2. Configure the Business Process Security Policy with the following permissions:
   1. **Initiate Work From Anywhere Request:** `Employee as Self`
   2. **Action Steps: Right To Work Verification:** `Employee as Self`
   3. **View All:** `Employee as Self`, `HR Administrator`, `Manager`
   4. **Approve:** `Manager`
   5. **Deny:** `Manager`
3. Run the `Activate Pending Security Policy Changes` task to activate your changes.
4. Locate the `Work From Anywhere Request` Business Process in App Manager and click **Create** in the Business Process Definition column. Click **OK**.
5. On the Edit Business Process screen, click **OK** and **Done** to create an empty definition that auto-completes.
   - Optionally, you can add additional business process steps, such as:
     - the **Right To Work Verification** review step for **Employee as Self** as step B and
     - an approval step for **Manager** as step C.

# Usage Instructions

1. In your Development tenant, search for and run the `Work From Almost Anywhere` **Task** to view the hub, `Manage Work From Anywhere Requests` **Task** to view a calendar of existing requests, or the `Request Work From Anywhere` **Task** to submit a new request.
2. Click on the **Request to Work Remote** button to create a new Work From Anywhere Request if one does not yet exist.
3. Click on the **Manage Requests** button to view or update Work From Anywhere Requests.
4. Click on the **Calendar View** button to view, create, and edit Work From Anywhere Requests using a Multi-Select Calendar widget.

# Sample Configuration

The following screenshots show what the security policy configuration would look like by following the above instructions:

<img src="/cms/devsite/media/app-catalog/workFromAlmostAnywhere/sampleBPLayoutWFAA.png" alt="BP Configured following the above instructions" width="700" />
<img src="/cms/devsite/media/app-catalog/workFromAlmostAnywhere/sampleManageWFAADomain.png" alt="Security Domain Configured following the above instructions" width="700" />
<img src="/cms/devsite/media/app-catalog/workFromAlmostAnywhere/SampleSelfServiceDomainWFAA.png" alt="Security Domain Configured following the above instructions" width="700" />
