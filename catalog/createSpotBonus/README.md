---
title: Create Spot Bonus
description: Create Spot Bonuses using a single API request from Orchestrate. Powered by Workday Graph API.
---

_Version 2024.1_

_For details and updates associated with this version of the app, see the [App Catalog Changelog](https://forum.developer.workday.com/t/app-catalog-changelog/8423)._

# Introduction

An Orchestration powered by Workday Graph API that creates Spot Bonuses (One-Time Payment with Anytime Feedback) using a single API request from your Workday Extend app or an external system.

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

# Configuration Instructions

## Update Security

### Graph API Applications Domain

Be sure to enable and set permissions for the `Workday Graph API Applications` security policy.

### One-Time Payment REST API

1. In your Development Tenant, search for `bp: request one-time payment`.
2. Click on the `Request One-Time Payment` Business Process you will use with this app.
3. Configure the **Business Process Security Policy** to add the following permissions for the `Request One-Time Payment (REST Service)`:
   - **Initiating Action**: `Manager`
4. Click **OK**.
5. Run the `Activate Pending Security Policy Changes` task to activate your changes.

### Security for API Clients

1. If using an API Client to submit the Spot Bonus from an external system, the following scopes must be added:
   - **Staffing**
   - **Core Compensation**
   - **Talent Core**

# Usage Instructions

1. Deploy the app to **App Hub**.
2. Navigate to the Orchestration for the app in **App Console**.
3. Click on the **Settings** button (gear icon) in the main Orchestration view. Note the **API** endpoint for this Orchestration for use in your Workday Extend app or external system.
   1. To use in your Workday Extend app pages, launch the Orchestration from an _outboundEndpoint_.
   1. To use in an external system, click **Download OpenAPI** to download the OpenAPI schema for this Orchestration, and import into a tool such as [Postman](https://learning.postman.com/docs/getting-started/importing-and-exporting-data/) to launch the Orchestration.
4. Launching the Orchestration as user **lmcneil**, the following is an example request body that will create a Spot Bonus in **GMS** Developer Tenants for user **bliu** using Workday Graph API:
   ```
   {
     "oneTimePaymentData": {
     "effectiveDate": "2023-06-03",
     "planId": "SPOT_BONUS",
     "planIdType" : "One-Time_Payment_Plan_ID",
     "amount": 100,
     "currencyId": "USD",
     "sendToPayroll": true
   },
     "feedbackData": {
       "badgeId": "266d32856b2f1070d37c87c19c320063",
       "comment": "You did a great job!",
       "showFeedbackProviderName": true
     },
     "workerId": "21008",
     "workerIdType" : "Employee_ID"
   }
   ```
