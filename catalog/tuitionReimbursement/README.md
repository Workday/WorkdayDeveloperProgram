---
title: Tuition Reimbursement
description: Create a Tuition Reimbursement Request app using Model Components and an Orchestration to submit a One Time Payment.
---

_Version 2025.1_

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

## Security

### Model Components

Using App Manager, perform the following steps:

1. In the Model Components section, locate the Security Domain `Manage: Tuition Reimbursement` and click **Create** in the **Domain Security Policy** column.
1. Check Confirm and click OK.
1. Add the following Report/Task Permissions to the Domain Security Policy:
   **Modify**: `Employee As Self, Manager, HR Administrator`
1. Locate the `Tuition Reimbursement` Business Process in App Manager and click **Edit** in the Security Policy column.
1. Configure the Business Process Security Policy with the following permissions:
   **Initiate Tuition Reimbursement Approval:** `Employee as Self`
   **Review Reimbursement Request:** `HR Administrator, Manager`
   **View All:** `Employee as Self, HR Administrator`
   **Approve:** `HR Administrator, Manager`
   **Deny:** `HR Administrator, Manager`

1. Locate the `Tuition Reimbursement Approval` Business Process Type in App Manager and click **Create** in the Business Process Definition column. Click OK.
1. On the Edit Business Process screen, click OK and Done to create an empty definition that auto-completes.
   - Optionally, you can add additional business process steps, such as an approval step for HR Administrators or Managers. This app does have functionality to support send back & revise functionality.
   - Optionally, you may also configure the Orchestrate service on the BP. (See section below)

In the Workday Search bar, search for `Domain: WQL for Workday Extend`.

- Add the following Report/Task Permissions to the Domain Security Policy:
  **Modify**: `All Users`

In the Workday Search bar, search for `BP: Request One-Time Payment (Default Definition)`.

- From the related actions on the BP definition, choose the `Edit` option from the BP security policy.
- Add the following security groups to the `Request One-Time Payment (REST Service)` section:
  `Employee As Self`
  `HR Administrator`

### Run the `Activate Pending Security Policy Changes` task to activate your changes.

### Optional: Auto-creating One Time Payments (via Orchestrate)

This app allows one time payments to be created via an orchestration attached to the BP definition. If you wish to configure this piece of the app, you need to create an ISU for this orchestration to run sucessfully. Please follow the instructions on the Dev Site on how to create a ISU for a App. The notes below are meant to supplement the instructions found on the Dev site link below.

[Set Up ISU Authentication for Apps](https://developer.workday.com/documentation/GUID-3277fec3-24c9-41da-9840-c61b41033f28-enHYPHENus)

- Ensure that the name of the ISU created in the tenant using the `Create Integration System User` task is `ISU_TuitionReimbursement`

\*Steps performed in tenant

- In the Search bar, enter `BP: Tuition Reimbursement`
- From the related actions for the BP, edit the BP.
- Add a step to the BP defintion and for the **Type** select `Service`.
- Enter a value in the `Order` field. Please ensure that the step comes after step a.
- In the `Specify` column, select the `Orchestration Service` option.
- Click OK to save the BP definition
- An error will be displayed saying that the Service needs to be configured
  - Select the `Configure Orchestration` button and click OK to advance to the next page.
  - For the **Operation** select `Start a new Orchestration`
  - In the **Orchestration** drop down, please select the `CreateOneTimePayment` orchestration.
  - Click `OK`
  - The next screen allows you to configure data to be passed to the orchestration. This orchestration requires the `Request Amount` and the Employee ID of the worker who will be receiving the payment.
    - Add two rows to the grid
    - In the first row, for the **Key** field, enter `amount`
    - Select the **Value from Field** dropdown and enter in `Request Amount`. _This is amount that is stored on the Tuition Request business object instance_
    - In the second row, for the **Key** field, enter `employeeId`
    - A calculated field needs to be created to lookup the employee id for the worker receiving the payment.
      - In a new tab for your tenant, select the task `Create Calculated Field`
      - For **Name**, enter in `CF LRV Employee ID`
      - For **Business Object**, select `Tuition Reimbursement Request`
      - For **Function**, select `Lookup Related Value`
      - Click `OK`
      - In the **Lookup Field** dropdown, select `Worker`
      - In the **Return Value** dropdown, select `Employee ID`
    - Return to your tab with the orchestration configuration
    - Select the **Value from Field** dropdown from the 2nd row and enter `CF LRV Employee ID`.
  - Click `OK` and then `Done`
- In the search bar, search for task `View Security Group`
- After selecting task, select the `HR Administrator` in the dropdown and click `OK`
- From the related actions of the security group, select the menu option `User-Based Security Group` and click `Assign Users to User-Based Security Group`
- Add the ISU previously created (`ISU_TuitionReimbursement`)
- Click OK

**Please double check the following:**

- Ensure that the ISU also has VIEW and GET access to the `Worker Data: Public Reports` domain
- Navigate to the BP security policy for One Time Payment. The initiating action for `Request One-Time Payment (REST Service)` needs to have `Employee as Self` and `HR Administrator` assigned to it.

# Run Instructions

1. In your Development tenant, search for and run the **App Manager** task.
2. Locate the `Tuition Reimbursement` App in the Apps list, and click **View App** to run the App.
3. A self service worker would click the button `Create Request` to create a new request.
4. After creating a request, from the apps main landing page, an entry will be added to the grid with some options to view the request, add some attachments (proof that they have completed the course) and lastly an option to submit the request.
5. Clicking the `Submit Request` button will trigger the business process to be invoked.
