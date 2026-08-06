---
title: Worker Image Upload Inbound
description: Use an Integration System orchestration to retrieve and load worker photos.
---

_Version 2024.2_

_For details and updates associated with this version of the app, see the [App Catalog Changelog](https://forum.developer.workday.com/t/app-catalog-changelog/8423)._

# Introduction

_View [Worker Image Upload Inbound forum page](https://forum.developer.workday.com/t/app-catalog-app-worker-inbound-image-upload/8182) for more information on this app._

_To use Orchestrate for Integrations, an Innovation Service Agreement opt-in is required and you will need to contact Workday for Limited General Availability access. [Please see this post for more details.](https://forum.developer.workday.com/t/orchestrate-for-integrations-now-in-limited-general-availability/9260)_

# Deploy Instructions

## Create Copy

1. Click the "Create Copy" button above.
2. To modify Orchestration source code:
   1. Open the app in the [Console](https://developer.workday.com/console/apps).
   1. Click the **WorkerPhotoInbound** link under Orchestrations to open Orchestration Builder.
3. After making any changes, **Save to App Hub**.
4. If you are an Extend customer and would like to work out of a dev tenant:
   1. Deploy the app to your dev tenant.
5. If you are not an Extend customer, or would prefer to work out of an implementation or sandbox tenant:
   1. Visit the App Overview, click on the **Promotions** tab and **promote** the app from Development to Implementation Release (for implementation tenants) or Sandbox Release (for sandbox tenants) and then **install** the app to the target tenant. _If you have an implementation tenant available we highly recommend you install to the implementation tenant first and test there before moving to sandbox._

## Customization (Optional)

### Filename Patterns and Employee IDs

The `INT Employee Image Upload Inbound` solution supports both the _Employee_ and _Contingent Worker_ Worker Types. The value of the Employee_ID and/or Contingent_Worker_ID reference types must be extracted from the inbound image filename.

The provided code assumes that the filename is of the format: `employeeId.extension`, e.g. **21001.png**. If your inbound files cannot be named accordingly, then you must change the code to handle the pattern being provided.

To update the parsing of filenames for Employee IDs:

1. Select the `WorkerPhotoJSON` component.
1. In the properties window, Edit the following line:  
   **Key:** `employeeId`  
   **Value:** change the expression to correctly extract the ID value from your filename format

# Configuration Instructions

## Configure Tenant with Customer Central

1. Log into your Customer Central tenant.
1. Migrate the `INT ORC Worker Image Upload Inbound` package to your target tenant.
1. (Optional) Rename the `INT ORC Worker Image Upload Inbound` Integration System to conform to your naming conventions.

## Configure Tenant Manually

### Create Integration System

1. In your tenant, search for the `Create Integration System` task.
1. Fill in the form as outlined below:  
   **System Name:** `{Your Integration's ID and name - this does not have to be the same as the app or Orchestration name}`  
   **New using Template:** `Orchestrate Integration Template`
1. Click **OK**
1. Add Integration Attributes
   1. Click the **Related Actions** icon next to the Integration System name in the header
   1. From the menu, select Integration System > Maintain Integration Attributes
   1. Add the first attribute:  
      **Name:** `Input Document Tag(s)`  
      **Attribute Type:** `Data Type` (radio button)  
      **Data Type:** `Document Tag` (Delivered Workday ID: 5242ed284a574130affb6653f3e0d93b)  
      **Option(s):** `Required for Launch`
   1. Add the second attribute:  
      **Name:** `Use Import When Images Exceed`  
      **Attribute Type:** `Data Type` (radio button)
      **Data Type:** `Numeric`
   1. Add the third attribute:
      **Name:** `SOAP API Version`  
      **Attribute Type:** `Data Type` (radio button)  
      **Data Type:** `Web Service API Version` (Delivered Workday ID: 643097491d2410000a9da38c99860026)  
      **Option(s):** `Required for Launch`
1. Add Launch Parameters
   1. Click the **Related Actions** icon next to the Integration System name in the header
   1. From the menu, select Integration System > Maintain Launch Parameters
   1. Add the first launch parameter:  
      **Name:** `Import for Worker Type(s)`  
      **Launch Parameter Type:** `Data Type` (radio button)  
      **Data Type:** `Worker Type` (Delivered Workday ID: df27ece133931000076b8c93a7cf0026)  
      **Option(s):** `Required`  
      **Default at Launch**: `checked` (checkbox)  
      **Value Type:** `Specify Value` (dropdown)  
      **Instance (plural) Specified for Parameter:**
      - `Contingent Worker`
      - `Employee`
   1. Add the second launch parameter:  
      **Name:** `Add Only (Do Not Update)`  
      **Launch Parameter Type:** `Data Type` (radio button)  
      **Data Type:** `Boolean`  
      **Default at Launch**: `unchecked` (checkbox)
   1. Add the third launch parameter:  
      **Name:** `Run with Debug Logging`  
      **Launch Parameter Type:** `Data Type` (radio button)  
      **Data Type:** `Boolean`  
      **Default at Launch**: `unchecked` (checkbox)
   1. Add the fourth launch parameter:
      **Name:** `Run in Validation Mode`  
      **Launch Parameter Type:** `Data Type` (radio button)  
      **Data Type:** `Boolean`  
      **Default at Launch**: `unchecked` (checkbox)

## Configure Tenant Security

1. In your tenant, search for the `Create Integration System User` task.
   1. Use this task to create an ISU.
1. Search for the `Create Security Group` task.
   1. Fill in the form as outlined below:  
      **Type of Tenanted Security Group:** `Integration System Security Group (Unconstrained)`  
      **Name:** `{Your Integration System Security Group name - align to your naming standards}`
   1. Add the ISU from the previous step to the group members.
   1. Give the security group VIEW permissions to the following Domain Policies:
      1. `Person Data: Personal Photo`
      1. `Worker Data: Active and Terminated Workers`
      1. `Worker Data: Worker ID`
   1. Give the security group MODIFY permissions to the following Domain Policies:
      1. `Integration Event`
      1. `Integration Process`
      1. `Integration Reports`
      1. `WQL for Workday Extend`
   1. Add the security group to the following Actions of the `Photo Change` Business Process Policy
      1. **Initiating Action:** `Change Person Photo (Web Service)`
      1. **Initiating Action:** `Import Person Photos (WS Background Process)`
1. Search for the `Activate Pending Security Policy Changes` task.
   1. Review the domain and BP policy changes
   1. Confirm and activate

## Configure Integration System

1. In your tenant, search for the Integration System created above.
1. Assign a Workday Account
   1. Click the **Related Actions** icon next to the Integration System name in the header
   1. From the menu, select Workday Account > Edit
   1. Select the ISU created above.
   1. Click **OK**
1. Configure Integration Attributes
   1. Click the **Related Actions** icon next to the Integration System name in the header
   1. From the menu, select Integration System > Configure Integration Attributes
   1. Set configuration:  
      **Attribute:** `Orchestration Name`  
      **Value:** `WorkerPhotoInbound`
   1. Set configuration:  
      **Attribute:** `Application Reference ID`  
      **Value:** Copy and paste the application reference id from your app here. This should be located on your app overview page.
   1. Set configuration:  
      **Attribute:** `Input Document Tag(s)`  
      **Value:** `Retrieved`
   1. Set configuration:  
      **Attribute:** `Use Import When Images Exceed`  
      **Value:** `100`
   1. Set configuration:  
      **Attribute:** `SOAP API Version`  
      **Value:** `v40.1`  
      **Note:** _most recently officially tested and verified with v40.1_
1. Create an Integration Business Process
   1. Click the **Related Actions** icon next to the Integration System name in the header
   1. From the menu, select Business Process > Create, Copy or Link Definition
1. Configure the Integration Business Process
   1. Select the `Business Process Definitions` tab on the View Integration System screen.
   1. From the related actions of the Business Process Definition, choose Business Process > Edit Definition.
   1. Change the value of the `Order` field on the Service / Fire Integration step from `b` to `c`.
   1. Click the plus button in the left margin to add another step with the following values:  
      **Order:** `b`  
      **Type:** `Service`  
      **Specify:** `Document Retrieval`
   1. Click **OK**
   1. Click the `Configure Document Retrieval` button and configure the Document Retrieval service appropriately for your business and the tenant environment, e.g. implementation vs. sandbox vs. production.

# Usage Instructions

1. Stage worker photo files to be found by the Document Retrieval service.
1. Log in to your tenant
1. Search for and run the `Launch / Schedule Integration` Task
1. Enter `INT Worker Image Upload Inbound` (or the new name assigned during configuration) as the Integration System and click **OK**.
1. Provide values for the Launch Parameters as appropriate and click **OK**.
1. Review the Integration Event screen to monitor execution and completion status of the event.
