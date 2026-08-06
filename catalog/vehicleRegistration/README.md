---
title: Vehicle Registration
description: Allow employees to register their car according to their location. Includes translations, and powered by Workday Graph API and external APIs.
---

_Version 2024.3_

_For details and updates associated with this version of the app, see the [App Catalog Changelog](https://forum.developer.workday.com/t/app-catalog-changelog/8423)._

# Introduction

_View [the Vehicle Registration forum page](https://forum.developer.workday.com/t/app-catalog-app-vehicle-registration/8454) for even more details and a video demo of the app._

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

## Localization and Translation

This app is pre-configured with `.properties` files which enable the Presentation Components within the app to render elements on the pages of the app in the preferred language of the user.

Any label or static text that would otherwise have rendered text using the `value` attribute in a PMD will instead point to a key within any available translation files, e.g. `"<% presentationLabels.VehicleRegistration %>"`

This expression instructs the app to look in the "presentationLabels" folder in the app source and to look to the "VehicleRegistration" translation key in the appropriate translation file.

### Which translation file will be used?

Translation files are triggered based on the Preferred Display Language of the user interacting with the app. That Display Language resolves to an expression with a locale code such as "en-us" for English USA, "es-ES" for Español, España, etc.
The valid locale code values are listed when you create a translation key within IntelliJ. [Visit the Developer Site Documentation for more information on creating Translation Keys for values in a PMD file](https://developer.workday.com/documentation/asf1579369476848).

## Model Components in Graph API

### Graph Queries are Static, Even if They Include App Ids

Remember that because Graph API query strings must be static, and queries about model components will have the name of your app in the query. When you create a copy of this app, you will need to update any references to the current app ID (e.g., `vehicleRegistration20241_nkzjqw`) and update it to be _your_ App ID.

### Use Aliases in Your Queries to Make Your Code More Portable

This app uses Graph Query files and aliases the queries to minimize references to a specific App ID. Note how the queries in each query file have a prefix such as `locations:` or `currentVehicle:`, etc and then the PMDs that use the queries refer to the Graph response _using the alias_.

### Updating the Code to Point to Your App's Model Components

The Graph API schema in your tenant is specific to _your tenant_ and you must explicitly type (or copy paste) the App ID wherever you see, for example, `vehicleRegistration20241_nkzjqw` in this example application.

To update references to a static App ID in your Graph Queries, repeat the following for each Graph Query file:

1. Find and replace (in a case-sensitive way) the name of the app in the App Catalog source **with lower case initial capitalization** (e.g. `vehicleRegistration20241_nkzjqw`) with YOUR app reference ID, **with lower case initial capitalization**.
2. Find and replace (in a case-sensitive way) the name of the app in the App Catalog source **with an initial capitalization** (e.g. `VehicleRegistration20241_nkzjqw`) and replace with YOUR app reference ID, **with initial capitalization**.

Let's say the name of your new app is `newApp_nkzjqw`. If the find and replace is done correctly, the `createVehicle` Graph Query file will have this as the first line in the query string:
`mutation newApp_nkzjqw_createVehicle($createVehicle_input: NewApp_nkzjqw_VehiclesSummary_CreateInput!) {`

Remember that you must first `Save and Deploy` your app for the model components to be in the Graph API schema for your tenant.

## App Manager

You can access **App Manager** within your tenant by doing a search for _App Manager_ and choosing the task, or by clicking the _Manage App_ button within IntelliJ after deploying your app to a tenant.

1. Navigate to **App Manager**. Choose _Configure_ on the Vehicle Registration app.
2. In the **Model Components** section, locate the Security Domain `Manage: Vehicles` and click **Create** in the **Domain Security Policy** column.
3. Check `Confirm` and click **OK**.
4. Add the following Security Group to `Report/Task Permissions` section of the Domain Security Policy:

   **Modify** :

   `Employee as Self`

   `Manager`

   `HR Administrator`

## Graph API Applications Domain

Be sure to also enable and set permissions for the `Workday Graph API Applications` security policy.

# Usage Instructions

1.  Open the home page for this application in your browser.
1.  Click on the Register Button.
1.  Log out and log in as a different user. Register a new car.
1.  Click the `Directory` button to see vehicles by location.
