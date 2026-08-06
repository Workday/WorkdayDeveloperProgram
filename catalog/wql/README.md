---
title: Workday Query Language (WQL)
description: Compare organization data from the standard endpoint with the data from WQL.
---

_Version 2024.1_

_For details and updates associated with this version of the app, see the [App Catalog Changelog](https://forum.developer.workday.com/t/app-catalog-changelog/8423)._

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

## Create Custom Task (Optional)

1. In your tenant, search for the `Create Custom Task` task.
1. Fill in the form as outlined below:  
   **Title:** `Build WQL Query`  
   **Application ID:** `{Your App's Reference ID}` (ex: workdayQueryLanguage_abcdef)  
   **Site ID:** `{Your App's Reference ID}` (ex: workdayQueryLanguage_abcdef)  
   **Route Path:** `/`
1. Under Business Object:  
   **Business Object:** `Worker` (dropdown)  
   **Selection:**: `No Selection` (radio button)
1. Under Security  
   **Domains:** `Core Navigation`  
   **_Testing Mode Only:_** `false` (unchecked)

# Usage Instructions

1. The application lets you build and execute WQL queries and view the results on a single page
2. Prompt for a Data Source then prompt for fields from that Data Source, view the resulting WQL query string and hit the `Execute Query` pageActionButton to see the raw results of the WQL call as well as the results of each row in a grid format. You can then modify your WQL query and re-execute as needed without having to refresh the page.
