---
title: Request Credit Card
description: Create a Credit Card request using Workday Orchestrate.
---

_Version 2025.1_

_For details and updates associated with this version of the app, see the [App Catalog Changelog](https://forum.developer.workday.com/t/app-catalog-changelog/8423)._

# Introduction

Employees can request a corporate credit card which will be issued in real-time by Stripe.

# Deploy Instructions

## Click to Deploy (Recommended)

1. Click the "Create Copy" button above.
2. To modify app source code:
   1. Open the app in the [Console](https://developer.workday.com/console/apps).
   2. Click **Open in App Builder**.
3. After making any changes, **Save and Deploy**.

# Prerequisites

1. Install [Workday Extend Plugin for IntelliJ](/downloads#wcp-plugin).

# Setup

## Configure the App

### Create an ISU

1. Login to your tenant as Logan McNeil (lmcneil)
2. Navigate to the task **Create Integration System User** in your tenant.
3. Name this user `Default_ISU`
   **NOTE:** The ISU name MUST be the exact name above, including underscore, if you are going to deploy this app to your tenant with no changes to the Orchestration (recommended).
4. Set a password for this user. You will need to remember this for later steps, as we will be setting up the ISU authentication type.
5. Click the \*_OK_ button.

### Create an Integration System Security Group

1. Navigate to the task **Create Security Group** in your tenant.
2. Type of Tenanted Security Group: `Integration System Security Group (Unconstrained)`
3. Choose a name for this group. Example: `ISSG Request Credit Card`
4. Choose the Integration System User `Default_ISU` from the drop-down list.
5. Click the **OK** button.

### Create the ISU Authentication Type for the App

1. Follow the instructions [here to setup the ISU Authentication](https://developer.workday.com/documentation/GUID-3277fec3-24c9-41da-9840-c61b41033f28-enHYPHENus).
   **NOTE**: When creating your API Client, please use the scope `System`, as this is the only one needed.

## Security

### Model Components: Domain Security Policy

You can access **App Manager** within your tenant by doing a search for _App Manager_ and choosing the task, or by clicking the _Manage App_ button within IntelliJ after deploying your app to a tenant.

1. Navigate to **App Manager**. Choose _Configure_ on your Request Credit Card app.
2. In the **Model Components** section, locate the Security Domain `Manage: Credit Card Requests` and click **Create** in the **Domain Security Policy** column.
3. Check `Confirm` and click **OK**.
4. Add the following Security Group to `Report/Task Permissions` section of the Domain Security Policy:

   **Modify** :

   `ISSG Request Credit Card`

   `Employee as Self`

   `Credit Card Administrator`

   `Manager`

   `HR Administrator`

5. Choose the _OK_ button at the bottom of the screen, then _Done_.

### Model Components: Business Process Security Policy

6. Navigate back to **App Manager**.
7. Locate the `Request Credit Card` Business Process in App Manager (at the bottom of the screen) and click the **Edit** button in the Security Policy column.
8. Configure the Business Process Security Policy with the following permissions:

   **Initiate Request Corporate Credit Card:** `Employee as Self`

   **View All:** `Employee as Self`, `Credit Card Administrator`, `Manager`

   **Approve:** `Manager`

   **Deny:** `Manager`

9. Click the _OK_ button at the bottom of the screen.
10. Navigate to the task called **Activate Pending Security Policy Changes**.
11. Put in a description for your security changes, then choose the checkbox, then _OK_ to activate the new security.
12. Navigate back to **App Manager**.
13. Locate the `Request Credit Card` Business Process in App Manager (at the bottom of the screen) and click **Create** in the Business Process Definition column. Click **OK**.
14. On the Edit Business Process screen under the Business Process Steps tab, choose the circular `+` button to add 2 steps to our BP:

    **Order:** `b`

    **Type:** `Approval`

    **Group:** `Manager`

    **Order:** `c`

    **Type:** `Service`

    **Specify:** `Orchestration Service`

15. Click the _OK_ button.
16. On the next screen, choose the **Configure Orchestration Service** button on the Steps list. Choose _OK_ on the next screen.
17. Select the option **Launch a new Orchestration** and browse for the `RequestCreditCardOrchestration` option associated with your app.
18. Check the **Advance business process step when orchestration completes** checkbox.
19. Click **OK**.
20. In the **Orchestration Data** table, in the row with the `actionEvent` key, in the `*Value` column, select `Value from Field` and search for `Workday ID`. There will only be one result; its **Business Object** will be **Default Business Object**. This returns the WID of the Action Event associated with the Business Process, and lets our BP-Triggered Orchestration look up details of the Business Process that is in progress, as well as the requester and the Credit Card Model Business Object.

### Security Setup for Users

1. In your Development tenant, search for the `ISSG Request Credit Card` security group.
2. Find the `ISSG Request Credit Card` Security Group in the search results, and then click the _OK_ button.
3. From the related actions menu, navigate to `Security Group` >> `Maintain Domain Permissions for Security Group`
4. Provide `VIEW` access for the `Worker Data: Staffing` domain. This will allow the ISU to make a WQL call in the Orchestration.
5. Provide `GET` and `PUT` access to the `Set Up: Credit Card` domain. This will allow the ISU to make the SOAP call that assigns the credit card.
6. Click **OK**.
7. Provide `VIEW` access for the `WQL for Workday Extend` domain. This will allow the ISU to make a WQL call in the Orchestration.
8. Activate your security policy changes using the `Activate Pending Security Policy Changes` task.

## Running the App

### Request a Credit Card

1. Log in to the Development tenant with _lmcneil_
2. Navigate to your new task (either **My Credit Card Requests** using related actions off of the Worker or **Manage Credit Card Requests** in the search bar)
3. Choose the **Request Credit Card** button.
4. On the next screen, put in any amount you would like to request that is under \$100k.
5. Put in a business reason. This will be sent to the manager for reference.
6. Next, it should take you back to the main app screen.
7. Log out of the tenant with this user.
8. Sign back in to the tenant or proxy as user `jbanks` (Joy Banks).
9. On the top-right of the screen, choose the **Inbox** icon.
10. You should see a new notification for Logan requesting a credit card. Verify that you can see the `Requested Credit Limit` and `Business Reason`.
11. Click the **Approve** button.
12. Log out of the tenant.
13. Log back in as Logan (`lmcneil`).
14. Click on Logan's profile picture at the top of the screen, and choose **View Profile**.
15. On the left-hand navigation of Logan's profile, choose **Company Property**.
16. On the Credit Card tab, you should now see Logan's new Stripe card.
17. Navigate back to the custom task **My Credit Card Requests**.
18. You should now see the new card on this screen as well.
