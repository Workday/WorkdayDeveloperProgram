---
title: Generate WQL With the AI Gateway
description: Create WQL Statements with either UI or natural language query using the AI Gateway.
---

_Version 2024.1_

_For details and updates associated with this version of the app, see the [App Catalog Changelog](https://forum.developer.workday.com/t/app-catalog-changelog/8423)._

# Introduction

_View [Document Search With AI Gateway forum page](https://forum.developer.workday.com/t/ai-gateway-reference-apps/11854) for more information on this app._

# Deploy Instructions

## Create Copy (Recommended)

1. Click the "Create Copy" button above.
2. To modify app source code:
   1. Open the app on the [Dev Site](https://developer.workday.com).
   2. Click **Open in App Builder**
3. After making any changes, **Save and Deploy**.

## Manual Deploy (Alternative)

1. Install the [Workday Extend Plugin for IntelliJ](/downloads#wcp-plugin).
1. Download and unzip the app source code.
1. Open in IntelliJ
   1. Go to Tools > Workday Extend > Log in to Workday Extend. You will be prompted to login to Workday Extend.
   1. Go to Tools > Workday Extend > Log in to Tenant. You will be prompted to choose your tenant.
   1. Go to Tools > Workday Extend > Deploy App to Tenant. Select your application.

# Configuration Instructions

1. Login to your development tenant and run `App Manager`
1. Locate the **Generate WQL With the AI Gateway** app and click `Configure`
1. Under the **Security Domains** section, click `Create` next to the **View: Data Query Builder** domain.
1. Add the following `Report/Task Permissions`:
   - **View:**`All Users`
   - This is all that is needed to run the `Data Query Builder` task in the tenant.
1. Run task **Activate Pending Security Policy Changes**.

# Usage Instructions

1. Review this [Developer Forum topic](https://forum.developer.workday.com/t/generate-wql-v1beta-rest-api/11339) for a quick overview of the Generate WQL REST API.
1. Run task `Data Query Builder` to access the Extend app and start using the Data Query APIs in your WCPDev tenant.
