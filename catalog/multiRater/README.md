---
title: MultiRater
description: This app enhances the performance review process by allowing multiple raters to provide feedback and the manager to update ratings based on this feedback.
---

_Version 2024.1_

_For details and updates associated with this version of the app, see the [App Catalog Changelog](https://forum.developer.workday.com/t/app-catalog-changelog/8423)._

# Overview

This app enhances the performance review process by allowing multiple raters to provide feedback and the manager to update ratings based on this feedback.

_View [See the app forum post for more information on setting this app up.](https://forum.developer.workday.com/t/app-catalog-app-multi-rater-for-employee-reviews/15466) for more details._

# Deploy Instructions

### Create Copy (Recommended)

1. Click the "Create Copy" button above.
2. To modify app source code:
   - Open the app in the Console.
   - Click Open in App Builder.
   - After making changes, Save and Deploy.

### Manual Deploy (Alternative)

1. Install the Workday Extend Plugin for IntelliJ.
2. Download and unzip the app source code.
3. Open in IntelliJ.
4. Go to Tools > Workday Extend > Log in to Workday Extend (login to Workday Developer Site).
5. Go to Tools > Workday Extend > Log in to Tenant (choose your tenant).
6. Go to Tools > Workday Extend > Deploy App to Tenant (select your application).

# Configuration Instructions

## Configure Security

- **Update Security on Employee Review Domains**
  - In the Workday-delivered domain "Set Up: Employee Reviews", update the population to include users who will provide comments and ratings.
  - (Optional) In the "Process: Employee Reviews" domain, add the manager population if they will submit the final rating.

### **Update Security on Model Components**

- In App Manager, configure the Multi-Rater domain to cover users who will maintain the process and complete ratings/comments.

## Configure Business Processes

### **Create Extend Business Process for Multi-Rater Process**

1.  In App Manager, create a new sub-business process.
2.  Link to the Release Note of the new functionality.
3.  Name the business process step for use in the Start Performance Review process.
4.  Update the Business Process Definition and add the steps "Evaluate Worker" and "Review and Submit the Rating".
5.  Set "Evaluate Worker" as Employee as Self and Exclude Initiator. Then, click the checkbox under the All column.
6.  Set "Review and Submit the Rating" as Initiator and set the step to completion.

### **Update Start Performance Review Business Process(es)**

1.  Edit the Business Process Definition for relevant Start Performance Review processes.
2.  Add your Extend Business Process as a step after "Complete Self Evaluation" and "Complete Manager Evaluation".
3.  Enable a security group with ownership to a supervisory org.

# Usage Instructions

1. Employee completes the "Complete Self Evaluation" process.
2. Manager completes the "Complete Manager Evaluation" process.
3. Manager selects multi-raters from their inbox.
4. Additional Raters provide ratings and comments from their inbox.
5. Manager provides a final rating in a process in their inbox.

**Note:** This process integrates with the Start Performance Reviews Business Process.
