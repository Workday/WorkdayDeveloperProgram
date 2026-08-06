---
title: Prism And Extend Design Patterns
description: This app highlights the importance for designing scalable pages when interacting with large data sets. It also highlights a single threaded pattern for triggering Prism Data Change Tasks (DCT).
---

_Version 2025.1_

_For details and updates associated with this version of the app, see the [App Catalog Changelog](https://forum.developer.workday.com/t/app-catalog-changelog/8423)._

# Overview

_**Please Note:** This application requires your GMS development tenant to be Prism enabled. See the following [forum post](https://forum.developer.workday.com/t/prism-analytics-is-now-live-in-workday-extend-gms-dev-tenants/25321) to enable your development tenant._

_View [Prism And Extend Design Patterns forum page](https://forum.developer.workday.com/t/app-catalog-app-prism-and-extend-design-pattern/27367) for more information on this app._

# Deploy Instructions

### Create Copy (Recommended)

1. Click the "Create Copy" button above.
2. To modify app source code:
   - Open the app in the Console.
   - Click Open in App Builder.
   - After making changes, Save and Deploy.

### Manual Deploy (Alternative)

1. Install the Workday Extend Plugin for IntelliJ.
2. Download and unzip the app source code.
3. Open in IntelliJ.
4. Go to Tools > Workday Extend > Log in to Workday Extend (login to Workday Developer Site).
5. Go to Tools > Workday Extend > Log in to Tenant (choose your tenant).
6. Go to Tools > Workday Extend > Deploy App to Tenant (select your application).

# Configuration Instructions

## Configure Security

### Update Security on Model Components

1. Navigate to **App Manager** and click the **Configure** link for the application.
2. Scroll to the **_Model Components_** section and locate the **_Security Domains_** grid.
3. In the **_Domain Security Policy_** column for that row, click the **Create** button.
4. On the **_Create Security Policy for Domain_** micro page, click **_Confirm_** checkbox and then click **_OK_**.
5. Under **_Report/Task Permissions_**, Give the **_HR Administrator_** security group **View** and **Modify** permissions.
6. Click **OK** to save the policy.

### Activate All Pending Security Changes

1. We'll need to activate our security changes, so navigate to the task called **Activate Pending Security Policy Changes**.
2. Put in a description for your security changes, then choose the checkbox, then _OK_ to activate the new security.

## Configure Prism

### Create Prism Table

1.  Access the task **_Prism Design Patterns_** through the Global Search (Must be a HR Administrator like lmcneil).
2.  On the left menu of the hub, click the **_installation_** link. This will take you to the Installation page.
3.  Click the **_Prism Table_** button.

### Create Data Change Task

1.  On the installation page, download the "Sample.csv" file by clicking the **_Sample CSV_** link.
2.  Navigate to the **_Data Catalog_** task.
3.  Click the **_+ Create_** button in the top left of the page.
4.  Click **_Data Change Task_** from the dropdown.
5.  On **_Source_** step, do the following:
    1. Edit the Data Change Task Details:
       1. Click the pencil icon to modify the name of the Data Change Task to open up the **_Edit Data Change Task Details_** micro page.
       2. Set the **_Data Change Task Name_** to "prismCommissionUpsert". **_Note:_** This must be named exactly as instructed or the App will not be able to trigger the DCT successfully.
       3. Set the **_Data Change Task API Name_** to "prismCommissionUpsert". To edit you must click the pencil icon.
       4. Select the "Sales Commission" tag in the **_Tags_** instance list.
       5. Click **_Apply_** to save your changes.
    2. Drop the downloaded sample file from step1 into the file uploader widget.
    3. Click the **_Next_** button.
6.  On **_Source Options_** step, do the following:
    1.  Click the **_amount_** column. Modify the **_Digits after_** to be "2".
    2.  Click the **_Next_** button.
7.  On **_Target_** step, do the following:
    1.  Select "Sales Commission - TBL" for the **_Target Table_**.
    2.  Select "Upsert" for the **_Target Operation_**.
    3.  Click **_Next_** button.
8.  On the **_Mapping_** step, do the following:
    1.  Select "transactionId" for the **_Upsert Key_**.
    2.  Click **_Next_** button.
9.  On the **_Review_** step, do the following:
    1.  Click **_Finish_** button.
    2.  Select **_Save_** option from the dropdown.

### Load Prism Table With Sample Data

1. Access the task **_Prism Design Patterns_** through the Global Search.
2. On the left menu of the hub, click the **_installation_** link.
3. Click the **_Prism Data_** button.

### Load Extend Business Object

1. On the installation page, click the **_Extend Data_** button.
