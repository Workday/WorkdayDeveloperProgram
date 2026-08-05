---
title: Learning Enrollments
description: This is a sample app that demonstrates fetching the workers that meet a certain condition and enrolling them in a course. In the example case, Workers who are not enrolled in the ‘Test Content’ course are being fetched and enrolled.
---

_Version 2024.1_

_For details and updates associated with this version of the app, see the [App Catalog Changelog](https://forum.developer.workday.com/t/app-catalog-changelog/8423)._

# Overview

In this example case, Workers who are not enrolled in the ‘Test Content’ course are being fetched and enrolled.

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
    1.  **Report Name:** `Learning Enrollments`  
        **Report Type:** `Advanced`  
        **Data Source:** `Indexed Campaign Item Records`
3.  Add the following Fields to your report:  
    **Business Object:** `Campaign Record`

    - **Field:** `Worker`
    - **Field:** `Learning Enrollment`
    - **Field:** `Campaign Item`
    - **Field:** `Campaign Item Delivered`

    **Business Object:** `Worker`

    - **Field:** `Employee ID`

    **Business Object:** `Campaign Item`

    - **Field:** `Campaign Item Content`

    **Business Object:** `Campaign Item Delivered`

    - **Field:** `Workday ID`

4.  Filter on Instances
    **Field:** `Campaign Item` (In the Selection List, Specified in this filter - "Test Content")
    **Field** `Campaign Record` (is not empty)

## Create an Integration System

1.  In your Tenant, run the `Create Integration System` task.
2.  Name your Integration System
3.  Set the template as `Orchestration Integration Template`
4.  From your Integration System, access the `Maintain Integration Attributes`.
    1.  Add an Integration Attribute called - `ReportReference`
5.  From your Integration System, access the `Configure Integration Attributes`.
    1.  Configure the `Application Reference ID`, and The `Orchestration Name` to match your app.
    2.  Configure `ReportReference` to match your Custom Report

# Usage Instructions

1. Log in to your tenant
1. Search for and run the `Launch / Schedule Integration` Task
1. Enter name assigned during configuration as the Integration System and click **OK**.
1. Provide values for the Launch Parameters as appropriate and click **OK**.
1. Review the Integration Event screen to monitor execution and completion status of the event.
