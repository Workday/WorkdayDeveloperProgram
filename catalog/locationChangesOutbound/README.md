---
title: Location Changes Outbound
description: 'Post-process the output of Core Connector: Locations with Workday Orchestrate.'
---

_Version 2024.2_

_For details and updates associated with this version of the app, see the [App Catalog Changelog](https://forum.developer.workday.com/t/app-catalog-changelog/8423)._

# Introduction

_View [the Location Changes Outbound forum page](https://forum.developer.workday.com/t/app-catalog-app-location-changes-outbound/17239) for even more details._

# Deploy Instructions

## Create Copy (Recommended)

1.  Click the "Create Copy" button above.
2.  To modify app source code:
    1.  Open the app in the [Console](https://developer.workday.com/console/apps).
    2.  Click **Open in App Builder**.
3.  After making any changes, **Save and Deploy**.

# Configuration Instructions

1. Download the app from App Catalog
2. Create an Integration System. Select the integration template `Orchestrate Integration Template`.
3. Set the attributes for `Orchestration Name` and `Application Reference ID` as per the settings on your Orchestration App
4. Create and configure the launch parameter for Output File Type

## Launch Parameters

_Name_: Output File Type  
_Launch Parameter Type_: Enumeration - FileOutputType

| Enumeration                  | Value       |
| ---------------------------- | ----------- |
| FileOutputType / Delimited   | Delimited   |
| FileOutputType / Fixed Width | Fixed Width |

5. Create another Integration System.
   1. Select the Integration Template `Core Connector: Locations`
6. Configure the Business Process Definition on the Core Connector.
7. Add a step for Integration.
8. Configure the step on the business process by defining the integration as `Orchestrate Integration` created in step 2 above.
9. Specify the value for `Output File Type` as `Delimited` or `Fixed Width`.
10. Launch the integration and view the output file.
11. Customize the app by adding/removing fields as needed.
12. Customize the app by adjusting field width for fixed width format.
