---
title: AP E-Invoice Application
description: An application that takes an XML based electoric Invoice (e-invoice) and processes it to create a Supplier Invoice in Workday.
---
*Version 2026.2*

# Introduction

*View [AP E-Invoice forum page Mock-up](https://miro.com/app/board/uXjVGOeZbhE=/?share_link_id=69114798645) for more information on this app.*

# Overview

The AP E-Invoice application is a Workday Entend Application that exposes an inbound endpoint and associated orchestration logic to receive text-based electronic invoices in multiple XML schemas.
The orchestration performs schema handling, data validation, mapping, and other processing before invoking Workday Financials services to generate a Supplier Invoice (AP Invoice) record in Workday.

Follow the instructions below to deploy and set up the application on the GMS tenant. Once it is deployed and the one-time setup is performed, you can immediately see how it works with the seed data and sample invoices.

# Deploy Instructions

1. Download the AP E-Invoice app source apeinvoice.zip. The delivered application has an App Reference ID of 'apeinvoiceextend_nkzjqw'. The App Reference ID is composed of the  application name (apeinvoiceextend) + "_" + org (company) specific suffix (nkzjqw).
2. Determine the suffix for your org by looking at an existing app or create a dummy app.  Let's say you determined the suffix to be "abcdef"
3. Execute the delivered script updateAppid.sh (Mac/Linux) or updateAppid.ps1 (Window) as follow
  updateAppid.sh  apeinvoice.zip apeinvoiceextend_nkzjqw  newAppName_abcdef
4. A new zip called "newAppName_abcdef.zip" will be created.
5. Open the app console [Console](https://developer.workday.com/console/apps).
6. Select "Create Extend App->Upload a Zip file"
7. Give as App Name and Reference ID the app name you provided to the Update Utility in step 3. (i.e. newAppName)
8. Select Create and Edit
9. Deploy



# Configuration Instructions



## App Manager

You can access **App Manager** within your tenant by doing a search for *App Manager* and choosing the task.

1. Navigate to **App Manager**. Choose *Configure* on the AP E-Invoice app.
2. In the **Model Components** section, locate the Security Domain `EInvoice App Domain` and click **Create** in the **Domain Security Policy** column.
3. Check `Confirm` and click **OK**.



## Configure Tenant Security

Below, we have provided instructions on how to configure the Einvoice Application to work out of the box for the GMS tenant using the 'lmcneil' (Logan McNeil) user account.

**Security Configuration for GMS Tenant for user lmcneil:**

1. Add Security Group **HR Administrator** with VIEW and MODIFY permissions to the following Domain Policies:
  1. `Reports: Supplier Invoice Text Only`
  2. `Process: Supplier Invoice Work Queue`
  3. `EInvoice App Domain`
2. Add Security Group **HR Administrator** with Get and Put permissions to the following Domain Policies:
  1. `Process: Supplier Invoice`
  2. `EInvoice App Domain`
  3. `Process: Supplier Invoice Work Queue`

**Summary of Required Security Groups configuration for other tenants:**

1. In your tenant, make sure the user you want to use for this application belongs to security groups that give the following pemissions:
  1. Security group has VIEW permissions to the following Domain Policies:
    1. `View: Supplier`
  2. Security group has VIEW and MODIFY permissions to the following Domain Policies:
    1. `Workday Graph API Applications`
    2. `Workday Query Language`
    3. `Integration Event`
    4. `Reports: Supplier Invoice Text Only`
    5. `Process: Supplier Invoice Work Queue`
    6. `EInvoice App Domain`
  3. Security group has Get and Put permissions to the following Domain Policies:
    1. `Process: Supplier Invoice`
    2. `Integration Event`
    3. `Process: Supplier Invoice Work Queue`
    4. `EInvoice App Domain`
2. Search for the `Activate Pending Security Policy Changes` task.
  1. Review the  changes
  2. Confirm and activate



## Einvoice Application One Time Setup

We have provided a one-time setup task that completes the configuration of the Einvoice application.

Follow the following steps to perform the One Time Setup:

- Login as 'lmcneil' 
- Naviagte to the E-Invoice Home (EInvoice Home) 
- Select 'One Time Setup' on the side menu 
- Click the 'Perform One-Time Setup' button

The "Perform One-Time Setup" button will create the required integration systems and seed sample invoices and data to provide a demo of the eInvoice application out of the box. The button disappears after it is clicked. To confirm the setup completed successfully, go back to the overview page and compare the number of records loaded to the expected counts below. If the counts do not match, you can come back to this page and run the setup again.

# Test Instructions

Now that you have configured the security and performed the One-Time-Setup, it is time to test the application. 

- Login as 'lmcneil' 
- Navigate to the E-Invoice Home (EInvoice Home) 
- Select Integration Systems on the side menu 
- Launch the integration system  - AP E-invoice Process Single Invoice
- Use 1 for the 'queuedInvoiceId' the required parameter . (1 is the id for the seeded invoice) and click OK. 
- Navigate to the E-Invoice Home (EInvoice Home) to monitor the processing and access the completed invoice. 
- When complete, select 'E-Invoice Runs' on the side menu to view the processed invoice.

In the Demo Video, we show how to launch the Einvoice processing using http protocol. 