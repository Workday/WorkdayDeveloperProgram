---
title: Document Intelligence With The AI Gateway
description: Leverage Workday AI Gateway's Document Intelligence API to scan and capture text from resumes, receipts, and more.
---

_Version 2024.1_

_For details and updates associated with this version of the app, see the [App Catalog Changelog](https://forum.developer.workday.com/t/app-catalog-changelog/8423)._

# Introduction

_View [the Document Intelligence With The AI Gateway forum page](https://forum.developer.workday.com/t/app-catalog-app-document-intelligence-with-the-ai-gateway/4666) for even more details._

# Deploy Instructions

## Create Copy (Recommended)

1. Click the "Create Copy" button above.
2. To modify app source code:
   1. Open the app in the [Console](https://developer.workday.com/console/apps).
   2. Click Open in **App Builder**
3. After making any changes, **Save and Deploy**.

## Manual Deploy (Alternative)

1. Install the [Workday Extend Plugin for IntelliJ](/downloads#wcp-plugin).
2. Download and unzip the app source code.
3. Open in IntelliJ
   1. Go to Tools > Workday Extend > Log in to Workday Extend. You will be prompted to login to Workday Extend.
   2. Go to Tools > Workday Extend > Log in to Tenant. You will be prompted to choose your tenant.
   3. Go to Tools > Workday Extend > Deploy App to Tenant. Select your application.

# Configuration Instructions

1. In the **Model Components** section, locate the Security Domain `Self Service: Scan Documents` and click **Create** in the Domain Security Policy column.
2. Check `Confirm` and click **OK**.
3. Add the following `Report/Task Permissions` to the Domain Security Policy `Self Service: Scan Documents`:
   - **Modify**: `All Users`
4. Run task **Activate Pending Security Policy Changes**.

# Usage Instructions

1. Review these [Instructions](https://forum.developer.workday.com/t/app-catalog-app-document-intelligence-with-the-ai-gateway/4666) to obtain sample documents for parsing and the Document Intelligence API specification.
2. Sign on as **lmcneil** and search for and run the task `Scan Document with the AI Gateway` to scan your document.
3. This application can scan the following document types: **1. Resume**, **2. Receipt** and **3. Image with Text**.
4. Note the **Scan Another Document** button to continue scanning more documents.
5. Please note, that you will need the Innovation Service Agreement turned on in your tenant (all WCPDEV tenants have this on). Additionally, the Innovation Services Opt-in task needs to have `Available Services` -> `WCP` -> `Workday AI Gateway` turned on.
