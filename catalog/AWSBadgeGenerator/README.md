---
title: Employee Badge Provisioning with Amazon Web Services
description: Allow employees to get a photo badge with AI-powered face detection and image generation with Amazon Web Services (AWS). Now featuring Event Bridge for logic routing.
---

_Version 2025.1_

_For details and updates associated with this version of the app, see the [App Catalog Changelog](https://forum.developer.workday.com/t/app-catalog-changelog/8423)._

# Introduction

_View the [Amazon Web Services starting page on the developer forum](https://forum.developer.workday.com/t/start-here-welcome-to-the-ea-program/5550) for more details._

_View the [Additional Docs for this App](https://forum.developer.workday.com/t/new-devcon-2025-reference-app-badge-generator/24279) for more details._

## Overview

This app extends Workday’s delivered onboarding business process to:

1. Guide new hires on uploading a photo for the new badge
2. Provide interactive validation and feedback to new hires on their photo
3. Automate the decision making process of whether the HR Partner should approve the photo
4. Automate the provisioning of a virtual badge

# Deploy Instructions

## Create Copy (Recommended)

1. Click the "Create Copy" button above.
2. To modify app source code:
   1. Open the app in the [Console](https://developer.workday.com/console/apps).
   2. Click **Open in App Builder**.
3. After making any changes, **Save and Deploy**.

# Workday Configuration Instructions

## App Security

### Create an ISU

1. Navigate to your app under the App Manager Task.
2.
3. Name this user `AWSExtendISU`.
4. Set a password for this user.
5. Click the _OK_ button.

### Create a New Integration System Security Group (ISSG)

1. Navigate to the task `Create Security Group`
2. For the Type of Tenanted Security Group choose `Integration System Security Group (Unconstrained)`
3. Name your Security Group `AWSExtendISSG`. Click _OK_.
4. Add the ISU you created `AWSExtendISU` to the Integration System Users field. Click OK.

### Client Credentials Mapping

1. [Create Your API Client](https://developer.workday.com/documentation/zwx1518028675482). Make note of the client ID and client secret of your app. For _Redirect URI_ and _Authorized CORS Domains_, you can input any value as they will not be used for this application.
2. Navigate to the task _Create Client Credentials Mapping_ in your tenant.
3. For Client ID, input the client ID from Step 1.
4. Add the ISU you created `AWSExtendISU` to the _Integration System User_ field. Click _OK_.

### Create Model Security Domains

Using _App Manager_, perform the following steps:

1. In the _Model Components_ section, locate the Security Domain `AWS Onboarding App` and click _Create_ in the _Domain Security Policy_ column.
2. Check `Confirm` and click _OK_.
3. Add the following `Report/Task Permissions` to the Domain Security Policy: _Modify:_ `Employee as Self` and `AWSExtendISSG`

### Business Process Security Policy

1. In the Search Bar within your tenant, type in `bp: onboarding`. Then, choose the definition you would like to modify. For example, choose the _Onboarding for Global Modern Services_ business process definition if you are in a GMS tenant.
2. Next, choose the _Related Actions_ next to the definition, and choose `Business Process Policy -> Edit`. Click the _OK_ button on the pop-up screen.
3. Add the `AWSExtendISSG` security group to the _View All_ action.
4. Click the _OK_ button at the bottom of the screen.
5. Run task Activate Pending Security Policy Changes.

## **Business Process and Notifications**

The purpose of this automation is to automatically validate Worker images and provision badges when onboarding new hires. We'll need to modify the onboarding business process:

1. In the Search Bar within your tenant, type in bp: onboarding. Then, choose the definition you would like to modify. For example, choose the _Onboarding for Global Modern Services_ business process definition if you are in a GMS tenant.
2. Next, choose the _Related Actions_ next to the definition, and choose Business Process -\> Edit Definition. Click the _OK_ button on the pop-up screen.
3. Here, click the + button to add a new step to the Business Process:

- Input a new _Order_. For example, input _b_ so that badge provisioning is the first step after initiation of the business process.
- For _Type_, choose `To Do`
- For _Specify_, choose `Get your badge`
- For _Group_, choose `Employee as Self` and `AWSExtendISSG`
- Click _OK_

4. After you've added the step, we now need to configure a custom notification to the new hire letting them know their badge has been created. Choose the _Related Actions_ next to the definition, and choose Business Process -\> Add Notification. Click the _OK_ button on the pop-up screen.
5. In the **Triggers** section, choose On Exit and select the business process step you created in step 3. For example, b - To Do: Get your badge.
6. In the **Recipients** section, choose Employee as Self in the **Groups** field.
7. In the **Message Content** section, input Your badge has been created. in the Text field of the **Subject** sub-section.
8. In the **Message Content** section, add the following 4 rows in the **Body** sub-section:

- Text: `Congratulations! Your badge has been created.`
- Field: `Line Break`
- Field: `Line Break`
- Text: `\<a href="url"\>www.workday.com\</a\>`

##

## AWS Configuration Instructions

All AWS services required for the sample Badge application are already configured in your account. Review the following items in your AWS account as a guide to using AWS services.

**Lambda Functions**

Your AWS account contains two Lambda Functions. From the AWS Console, navigate to Lambda from the top Service menu. This takes you to the Functions list screen where you see the functions:

- **badge-validate-photo** – this function validates the photo submitted by the user of the Extend app. It is invoked by the _ **validatePhoto** _ orchestration in Extend.
- **badge-create** – this function generates a badge from the photo submitted by the user and places the badge image file in your S3 bucket.

Source code for these Lambda functions is located in your S3 bucket under the **apps/badge-create** folder. The Python source code for each function is located in a ZIP file, which you can download, open, and review.

**S3 Bucket**

All files and data for your application are located in one S3 bucket named:

- workday-devcon-hackathon-[team name]

To review the contents of this bucket, navigate to the S3 service using the AWS Console.

**Event Bridge**

All messages between Extend and AWS are sent on the Event Bridge Event Bus named

- tenant-event-bus

An example of sending messages from Extend to AWS using the event bus can be reviewed in the **generateBadge** orchestration in Extend.

To send messages from AWS back to Extend, three items are configured in your AWS account. These are all visible by navigating to the Event Bridge service from the Services menu in the AWS Console. These include:

- **API Destination Connection** named _WorkdayExtendConnection_. This item contains the OAuth credentials and Endpoint to authenticate requests to your Extend tenant. It is configured with the _client Id_ and _secret_ referred to in the Client Credentials Mapping section above
- **API Destination** named _APIDestination-xxxxxxx._ This item is configured to POST messages back to the **inboundBadgeComplete** orchestration in the Extend sample app. The destination is configured with an endpoint specific to that orchestration. The API Destination uses the API Destination Connection to authenticate the POST request. If you create additional Extend orchestrations to process inbound messages, you must create a new API Destination for each orchestration, but can reuse the same API Destination Connection.
- **Event Bus Rules** are accessed from the _Buses / Rules_ menu item in Event Bridge and by selecting the _tenant-event-bus_.
  - **APIDestinationInboundRule** handles messages put to the _tenant-event-bus_ by the **badge-create** Lambda function. These messages are posted back to the **inboundBadgeComplete** orchestration in the Extend sample
  - **SampleAppBadgeCreateRule** handles messages posted from the **generateBadge** orchestration in Extend and are routed to the **badge-create** Lambda function for processing.

##

## Usage Instructions

1. Run the **Launch Onboarding** task to initiate the onboarding process for a new hire. For example, in a GMS tenant, Logan McNeil can initiate the process for James Walker.
2. Run task **Manage Badges** to view all badges issued for the current Worker.
3. Click on the **Create Badge** task in the new hire's inbox.
4. Run task **View My Badge** to view the badge for the current Worker.

Note that the last 3 tasks can only be run by the current user for themselves (Employee As Self), per the **Create Model Security Domains** configuration instructions above.
