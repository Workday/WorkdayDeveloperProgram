---
title: Supplier Invoices Inbound
description: Use Orchestrate for Integrations to import supplier invoices.
---

_Version 2024.1_

_For details and updates associated with this version of the app, see the [App Catalog Changelog](https://forum.developer.workday.com/t/app-catalog-changelog/8423)._

# Introduction

_View [Supplier Invoices Inbound forum page](https://forum.developer.workday.com/t/supplier-invoices-inbound/9927) for more information on this app._

_To use Orchestrate for Integrations, an Innovation Service Agreement opt-in is required and you will need to contact Workday for Limited General Availability access. [Please see this post for more details.](https://forum.developer.workday.com/t/orchestrate-for-integrations-now-in-limited-general-availability/9260)_

# Overview

The purpose of this orchestration is to demonstrate the following:

1. Loading Supplier Invoice Data into Workday via Import Supplier Invoices web service
2. Checking the result of an Import Web service.

This orchestration is used to load supplier invoices into Workday via the Import_Supplier_Invoice web service. The orchestration contains a test file that is based on the Coupa Supplier Invoice XML format. The orchestration performs some validations on the supplier invoice data, before transforming it to the Import_Supplier_Invoice format and posting it to Workday. The import process is an asynchronous process and can take some time when loading large amounts of data.

After the supplier invoice orchestration is complete, the second integration is triggered from the Business Process to check the result of the import job. It’s calling the Get_Import_Processes web service to check the import result. If any errors occurred, it calls the Get_Import_Process_Messages web service to get information on the errors. It creates an audit file with the import status of all supplier invoices.

# Deploy Instructions

## Create Copy

1. Click the "Create Copy" button above.
2. To modify Orchestration source code:
   1. Open the app in the [Console](https://developer.workday.com/console/apps).
   2. Click the **INT_Supplier_Invoices_Inbound** link under Orchestrations to open Orchestration Builder.
3. After making any changes, **Save to App Hub**.
4. If you are an Extend customer and would like to work out of a dev tenant:
   1. Deploy the app to your dev tenant.
5. If you are not an Extend customer, or would prefer to work out of an implementation or sandbox tenant:
   1. Visit the App Overview, click on the **Promotions** tab and **promote** the app from Development to Implementation Release (for implementation tenants) or Sandbox Release (for sandbox tenants) and then **install** the app to the target tenant. _If you have an implementation tenant available we highly recommend you install to the implementation tenant first and test there before moving to sandbox._

# Configuration Instructions

## Configure Tenant Manually

You need to create 2 integration systems. The first integration loads supplier invoices via the Import_Supplier_Invoice web service. The second integration checks the result of the import status and creates and audit files with the results.

### Create First Integration System to Import Supplier Invoices

1. In your tenant, search for the `Create Integration System` task.
2. Fill in the form as outlined below:
3. \*System Name:\*\* `{Your Integration's ID and name - this does not have to be the same as the app or Orchestration name}`
4. \*New using Template:\*\* `Orchestrate Integration Template`
5. Click **OK**
6. Add Integration Attributes
   1. Click the **Related Actions** icon next to the Integration System name in the header
   2. From the menu, select Integration System > Maintain Integration Attributes
   3. Add the first attribute:
7. \*Name:\*\* `debugMode`
8. \*Attribute Type:\*\* `Data Type` (radio button)
9. \*Data Type:\*\* `Boolean`
10. \*Option(s):\*\* `Required for Launch`
11. Add Integration Maps
    1. Click the **Related Actions** icon next to the Integration System name in the header
    2. From the related actions, select Integration System > Maintain Integration Maps
    3. Add the first Integration Map:
       1. \*Name:\*\* `PaymentTerms`
       2. \*Integration Map Type:\*\* `Data Type` (radio button)
       3. \*Data Type:\*\* `Payment Terms`
    4. Configure the Integration Map
       1. From the related actions, select Integration System > Configure Integration Maps
       2. Add the default value of "NET_30" to the PaymentTerms map.
       3. Click OK

### Create Second Integration System to Check Import Status

1. In your tenant, search for the `Create Integration System` task to create the integration system that checks the import results
2. Fill in the form as outlined below:
   1. \*System Name:\*\* `{Your Integration's ID and name - this does not have to be the same as the app or Orchestration name}`
   2. \*New using Template:\*\* `Orchestrate Integration Template`
   3. Click **OK**
   4. Add Integration Attributes
      1. Click the **Related Actions** icon next to the Integration System name in the header
      2. From the menu, select Integration System > Maintain Integration Attributes
      3. Add the first attribute:
         1. \*Name:\*\* `debugMode`
         2. \*Attribute Type:\*\* `Data Type` (radio button)
         3. \*Data Type:\*\* `Boolean`
         4. \*Option(s):\*\* `Required for Launch`
         5. \*Name:\*\* `documentTags`
         6. \*Attribute Type:\*\* `Data Type` (radio button)
         7. \*Data Type:\*\* `Document Tags` (Delivered Workday ID: eef1d7fe8ea9408e85a43ce755c69ef2)
         8. \*Option(s):\*\* `Required for Launch`

## Configure Tenant Security

1. In your tenant, search for the `Create Integration System User` task.
   1. Use this task to create an ISU.
2. Search for the `Create Security Group` task.
   1. Fill in the form as outlined below:
3. \*Type of Tenanted Security Group:\*\* `Integration System Security Group (Unconstrained)`
4. \*Name:\*\* `{Your Integration System Security Group name - align to your naming standards}`

   1. Add the ISU from the previous step to the group members.
   2. Give the security group VIEW permissions to the following Domain Policies:
      1. `View: Supplier`
   3. Give the security group MODIFY permissions to the following Domain Policies:
      1. `Workday Query Language`
   4. Give the security group Get and Put permissions to the following Domain Policies:
      1. `Process: Supplier Invoice`
      2. `Integration Event`
   5. Add the security group to the following Actions of the ` Supplier Invoice Event` Business Process Policy
      1. **Initiating Action:** `Initiate (Import Supplier Invoice (WS Background Process)`

5. Repeat the above steps to create an ISU for the second integration system. The only permissions required for the ISU to check the import result is access to the `Integration Event' Domain Policy.
6. Search for the `Activate Pending Security Policy Changes` task.
   1. Review the domain and BP policy changes
   2. Confirm and activate

## Configure 1st Integration System

1. In your tenant, search for the supplier invoice Integration System created above.
2. Assign a Workday Account
   1. Click the **Related Actions** icon next to the Integration System name in the header
   2. From the menu, select Workday Account > Edit
   3. Select the ISU created above.
   4. Click **OK**
3. Configure Integration Attributes
   1. Click the **Related Actions** icon next to the Integration System name in the header
   2. From the menu, select Integration System > Configure Integration Attributes
   3. Set configuration:
      1. \*Attribute:\*\* `Orchestration Name`
      2. \*Value:\*\* `INT_Supplier_Invoices_Orch_Inbound`
   4. Set configuration:
      1. \*Attribute:\*\* `Application Reference ID`
      2. \*Value:\*\* use the name of the app from the developer site
   5. Set configuration:
      1. \*Attribute:\*\* `debugMode`
         1. \*Value:\*\* `No`
         2. \*Attribute:\*\* `XvalidateMode`
         3. \*Value:\*\* `No`

> Note: The **debugMode** attribute enables the the Import Supplier Invoice web service request and response as well as the check invoice status WQL response to be stored to the integration event. This can be helpful for troubleshooting, but may affect performance. debugMode should only be enabled during testing/troubleshooting as needed and disabled in production to increase performance. **XvalidateMode**: Validate only mode enables you to test and validate a SOAP request without actually updating Workday

## Configure 2nd Integration System

1. In your tenant, search for the import results Integration System created above.
2. Assign a Workday Account
3. Click the **Related Actions** icon next to the Integration System name in the header
4. From the menu, select Workday Account > Edit
5. Select the ISU created above.
6. Click **OK**
7. Configure Integration Attributes
   1. Click the **Related Actions** icon next to the Integration System name in the header
   2. From the menu, select Integration System > Configure Integration Attributes
   3. Set configuration:
      1. \*Attribute:\*\* `Orchestration Name`
      2. \*Value:\*\* `INT_Check_Import_Result_Orch`
   4. Set configuration:
      1. \*Attribute:\*\* `Application Reference ID`
      2. \*Value:\*\* use the name of the app from the developer site
   5. Set configuration:
      1. \*Attribute:\*\* `documentTags`
      2. \*Value:\*\* `importMessages`

## Create an Integration Business Process

1. Click the **Related Actions** icon next to the supplier invoice Integration System name in the header
2. From the menu, select Business Process > Create, Copy or Link Definition
3. Configure the Integration Business Process
   1. Select the `Business Process Definitions` tab on the View Integration System screen.
   2. From the related actions of the Business Process Definition, choose Business Process > Edit Definition.
   3. Click the plus button in the left margin to add another step with the following values:
      1. \*Order:\*\* `c`
      2. \*Type:\*\* `Integration`
4. Click **OK**
5. Click the `Configure Integration Step` button and select the import result integration that you created

# Usage Instructions

The sample file contains 2 supplier invoices with references to data available in a GMS tenant. The first invoice should load successfully, the second invoice will throw an error related to an invalid Spend_Category_ID. Below is the output of the audit file called ImportResults.csv
|Timestamp|Severity|Message|Details|
|---|---|---|---|
|2024-03-25T11:43:56.039-07:00|Info|Invoice 1130 successfully created/updated|Completed|
|2024-03-25T11:43:50.745-07:00|Error|Invoice INVOICE5541Error failed to process|Invalid ID value. 'HARDWARE_COMPUTERS_Error ' is not a valid ID value for type = 'Spend_Category_ID'|
