---
title: Update Service Date Boomerang
description: Update service date based on a certain condition
---

_Version 2025.1_

_For details and updates associated with this version of the app, see the [App Catalog Changelog](https://forum.developer.workday.com/t/app-catalog-changelog/8423)._

# Overview

_View [the Update Service Date Boomerang forum page](https://forum.developer.workday.com/t/update-service-dates-boomerang/19516) for even more details._

In this example case, Rehires should have their 'Benefit Service date' set to previous hire date if the break in service is less than 6 months. This app can be adjusted based on other requirements eg: for any particular termination reason category or to update any other service date.

# Deploy Instructions

## Create Copy (Recommended)

1.  Click the "Create Copy" button above.
2.  To modify app source code:
    1.  Open the app in the [Console](https://developer.workday.com/console/apps).
    2.  Click **Open in App Builder**.
3.  After making any changes, **Save and Deploy**.

# Configuration Instructions

## Create Custom Report

1.  In your tenant, search for the `Create Custom Report` task.
2.  Fill in the form as outlined below:
    - **Report Name:** `Update Service dates Report`
    - **Report Type:** `Advanced`
    - **Data Source:** `Workers For HCM Reporting`
3.  Add the following Fields to your report:  
    **Business Object:** `Worker`

| **Field**                                                                                                                                | **Column Heading Override XML Alias** |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Worker                                                                                                                                   | Worker                                |
| Hire Date                                                                                                                                | CurrentHireDate                       |
| Employee ID                                                                                                                              | Emp_ID                                |
| Previous_HireDate (Calculated Field - Effective date of second last Hire Event from Hire History)                                        | Previous_Hire_Date                    |
| Last Termination Date (Calculated Field - Effective date of last termination Event from Termination History)                             | Last_Term_Date                        |
| Break in Months (Date Difference Calculated Field between Current Hire Date and Last Termination Date (in Months))                       | BreakMonths                           |
| Adjusted Service date (Evaluate Expression Calculated Field to get the previous hire date if break is less than 6 months else Hire Date) | NEW_SERVICE_DATE                      |

4.  Filter on Instances
    **Field:** `Previous Hire Date` is not blank.

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
    - Add an Integration Attribute called: `ReportCall`
5.  From your Integration System, access the `Configure Integration Attributes`.
    - Configure the `Application Reference ID`, and the `Orchestration Name` to match your app.
    - Configure `ReportCall` to point to your Custom Report by pasting the `reportOwner/reportName` you noted before.

# Usage Instructions

1. Log in to your tenant
2. Search for and run the `Launch / Schedule Integration` Task
3. Enter name assigned during configuration as the Integration System and click **OK**.
4. Provide values for the Launch Parameters as appropriate and click **OK**.
5. Review the Integration Event screen to monitor execution and completion status of the event.
