---
title: AWS Starter Kit with Amazon Web Services and Amazon Translate
description: Jumpstart your AWS app with the AWS starter kit examples.
---

_Version 2024.1_

_For details and updates associated with this version of the app, see the [App Catalog Changelog](https://forum.developer.workday.com/t/app-catalog-changelog/8423)._

# Introduction

_View [See the app forum post for more information on setting this app up.](https://forum.developer.workday.com/t/app-catalog-app-aws-starter-kit/14617) for more details._

_To use the Extend-AWS native integration, an [Innovation Service Agreement opt-in](https://developer.workday.com/documentation/GUID-95f51ac6-4d40-4959-b128-fdca23c8387d-enHYPHENus/IntroductiontoWorkdayExtendIntegrationwithAWS) is required._

_To deploy an app to your Workday-managed AWS account, [a Company Administrator must provide you AWS account access](https://developer.workday.com/documentation/GUID-7535b433-5b9b-480a-aeed-62de473cc874-enHYPHENus)._

## Overview

This app showcases using the AWS Lambda connectors to utilitize all of the advanced capabilities supported by Workday

# Deploy Instructions

## Create Copy (Recommended)

1. Click the "Create Copy" button above.
2. To modify app source code:
3. Open the app in the [Console](https://developer.workday.com/console/apps).
4. Click **Open in App Builder**.
5. After making any changes, **Save and Deploy**.

# Configuration Instructions

To fully deploy and configure this app, you will need [access to the AWS account for your organization](https://developer.workday.com/documentation/GUID-7535b433-5b9b-480a-aeed-62de473cc874-enHYPHENus) to create and deploy the AWS Lambda function, and you must install the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html).

For this application, ensure that your AWS configuration is set to the **US West Oregon** `us-west-2` region.

This app does not require any additional Workday configuration.

## Create an AWS SAM Application

To host the AWS Lambda code that the Extend app leverages, you will need to use the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/using-sam-cli.html) to:

1. [Authenticate to AWS using your short-term credential](https://developer.workday.com/documentation/GUID-306fac40-0f62-4016-9720-1e01021cd939-enHYPHENus/ObtainShortTermCredentialforAWSCommandLineInterface)
2. [Create and deploy an AWS Lambda application](https://developer.workday.com/documentation/GUID-807619f6-1b04-4a31-8f29-661aa92058d4-enHYPHENus/ExampleCreateanAWSLambdaFunctionUsingSAMCLI)

## AWS Lambda Instructions

See [the How to use AWS Lambda capabilities documentation page](https://developer.workday.com/documentation/GUID-a8a83c29-7a27-434d-88a7-7c24668467e2-enHYPHENus/AWSLambda) for instructions on creating a new Lambda function.

You can also review the Back to Basics video on [how to get started with the Extend-AWS integration using the AWS Toolkit for VS Code and the AWS SAM CLI](https://forum.developer.workday.com/t/extend-experience-season-6/12984).

See [the app forum page for the Lambda code with .yaml file](https://forum.developer.workday.com/t/app-catalog-app-aws-starter-kit/14617) to get the lambda code zip and a sample `template.yaml` for the app.

1. Unzip the lambda code into your local workspace for your AWS SAM Application.
2. In the AWS SAM CLI, either from the command line or from a tool such as [VS Code’s AWS Toolkit](https://developer.workday.com/documentation/GUID-9e6f8a4a-d50b-4ac9-91c6-4da4e5692bd4-enHYPHENus/InstalltheAWSToolkitforVisualStudioCodeVSCode), edit the `template.yaml` file for the project:

   1. Make sure the `CodeUri` points to the location in the project directory where the `lambda_function.py` code is located
   2. Make sure the `Handler` points to `lambda_function.lambda_handler`
   3. Make sure the `Runtime` is set to `python3.9`

3. Sync the SAM Application to upload and deploy your changes.
4. Once complete, the new code should now be deployed to your Lambda Function and ready to use.

**Note:** You may need to add an entry to the `requirements.txt` file in the folder containing your lambda python code with:

```
urllib3<2
```

If you run the app and receive an error regarding urllib, you can fix it by adding the above line to that file.

## Orchestration Code Changes

When making a copy of this app, the Amazon S3 bucket name is specified in the `detectDocumentText` orchestration
on the `CreateValues` component. Before deploying to your tenant, you will need to update the `bucket`
value to use your Workday-provided S3 bucket name.

You can find this bucket name using the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/using-sam-cli.html).

```
Example: workday-wcp-wcpexttest-us-west-2
```

_See [How to use Amazon S3 capabilities](https://developer.workday.com/documentation/GUID-b2064357-e4f4-49e7-9bd3-1191c9f5bd70-enHYPHENus/AmazonS3) for more info._

Once updated, save and deploy the application to your tenant.

## Usage Instructions

1. Login as Logan McNeil or another user, then open the app home page (i.e. from App Manager)
2. Drag and drop (or select) a photo of any text to upload

- Note that this app works best when it's a clear photo of a US driver's license.
- Other [types of documents are supported](https://docs.aws.amazon.com/textract/latest/dg/how-it-works-identity.html) by Amazon Textract.

3. Submit the page
4. The following page should show the text extracted from the photo.

Note that uploaded photos are stored in Amazon S3 in a private bucket specific to your AWS account and
encrypted using an account-specific AWS KMS encryption key. This app does not automatically delete the
uploaded photos, but the Workday-provided S3 bucket has a lifecycle policy to delete files once they reach
30 days of age.
