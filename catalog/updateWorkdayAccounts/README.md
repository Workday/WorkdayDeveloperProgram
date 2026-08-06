---
title: Update Workday Accounts Boomerang
description: Fetch workers that meet a certain condition and update their workday accounts.
---

# Overview

In this example case, Workers from Hong Kong should have ‘\_hk’ as a suffix added to their workday account usernames.

# Deploy Instructions

## Create Copy (Recommended)

1.  Click the "Create Copy" button above.
2.  To modify app source code:
    1.  Open the app in the [Console](https://developer.workday.com/console/apps).
    2.  Click **Open in App Builder**.
3.  After making any changes, **Save and Deploy**.

# Configuration Instructions

## Create Custom Report

1. In your tenant, search for the `Create Custom Report` task.
2. Fill in the form as outlined below:
   - **Report Name:** `Workday Accounts To Update`
   - **Report Type:** `Advanced`
   - **Data Source:** `Workers For HCM Reporting`
3. Add the following Fields to your report:  
   **Business Object:** `Worker`

| **Field**               | **Column Heading Override XML Alias** |
| ----------------------- | ------------------------------------- |
| Legal Name - First Name | First_Name                            |
| Legal Name - Last Name  | Last_Name                             |
| Employee ID             | Employee_ID                           |
| Worker Type             | Worker_Type                           |
| Workday Account         | Workday_Account                       |

4.  Filter on Instances:

    - **Field:** `Location Address Country` (In the Selection List, Specified in this filter - "Hong Kong")

5.  Advanced:

    - Select: **Enable As Web Service**
    - Modify: **Namespace** to be: `urn:com.workday/bsvc`

6.  Save the custom report
7.  Find the report owner and name for the API call:
    - Click on ther reports' Related Actions and select Web Service -> View URLs
    - Right-Click REST Workday XML -> Copy URL
    - The URL will follow this format: `https://subdomain.part.myworkday.com/ccx/service/customreport2/tenantname/REPORT_OWNER/REPORT_NAME`
    - Take note of the last two elements, including the **/**, for example `lmcneil/WorkdayAccounts`

## Create an Integration System

1.  In your Tenant, run the `Create Integration System` task.
2.  Name your Integration System
3.  Set the template as `Orchestration Integration Template`
4.  From your Integration System, access the `Maintain Integration Attributes`.
    - Add an Integration Attribute called: `ReportReference`
    - Set the `Attribute Type` to `Data Type` and then select `Text`
5.  From your Integration System, access the `Configure Integration Attributes`.
    - Configure the `Application Reference ID`, and the `Orchestration Name` to match your app.
    - Configure `ReportReference` to point to your Custom Report by pasting the `reportOwner/reportName` you noted before.

# Usage Instructions

1. Log in to your tenant
2. Search for and run the `Launch / Schedule Integration` Task
3. Enter name assigned during configuration as the Integration System and click **OK**.
4. Provide values for the Launch Parameters as appropriate and click **OK**.
5. Review the Integration Event screen to monitor execution and completion status of the event.
