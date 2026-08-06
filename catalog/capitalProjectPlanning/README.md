---
title: Capital Project Planning
description: This application simplifies requesting new capital projects and managing their planned capital funds, providing transparency and accountability. It allows you to track financial impact, manage funds efficiently, and make informed investment decisions. Built to complement Workday Adaptive Planning capabilities, it enhances the end-user experience and streamlines capital project request workflows, especially beneficial for Healthcare, SLED, and beyond.
---

_Version 2025.1_

_For details and updates associated with this version of the app, see the [App Catalog Changelog](https://forum.developer.workday.com/t/app-catalog-changelog/8423)._

# Introduction

_View [Capital Planning Project forum page](https://forum.developer.workday.com/t/app-catalog-app-capital-project-planning/28455) for more information on this app._

# Deploy Instructions

## Create Copy (Recommended)

1. Click the "Create Copy" button above.
2. To modify app source code:
   1. Open the app in the [Console](https://developer.workday.com/console).
   2. Click **Open in App Builder**.
3. After making any changes, **Save and Deploy**.

---

## Configuration Instructions

The solution has two main components: the **Capital Project Planning Extend application** and an **Adaptive Planning instance**. Customers need a Workday tenant with an active Extend subscription to deploy this app.

The application can function in a standalone mode and be linked to Adaptive Planning later. This means the following deployment scenarios are supported:

- Deploying the Extend component now, with Planning deployment scheduled for the future.
- An existing Planning instance, with the Extend component added later.
- Simultaneous deployment of both the Extend and Planning components.

While user synchronization between the core Workday tenant and Adaptive Planning is recommended, it's not a strict requirement.

---

### Security Setup

You need to create the following assignable roles in the tenant:

#### Assignable Roles

| Role Name                | Enabled For                        | Assigned By            |
| :----------------------- | :--------------------------------- | :--------------------- |
| Capital Project Planner  | Cost Center, Cost Center Hierarchy | Security Administrator |
| Capital Project Approver | Cost Center, Cost Center Hierarchy | Security Administrator |

The recommended security group setup is as follows:

#### Security Groups

| Group                                    | Type                                              | Role                     | Access Rights to Organizations            |
| :--------------------------------------- | :------------------------------------------------ | :----------------------- | :---------------------------------------- |
| Capital Project Planner (Cost Center)    | Role-Based (Constrained)                          | Capital Project Planner  | Current Organization and All Subordinates |
| Capital Project Approver (Cost Center)   | Role-Based (Constrained)                          | Capital Project Approver | Current Organization and All Subordinates |
| Capital Project Planner (Unconstrained)  | Role-Based (Unconstrained)                        | Capital Project Planner  | N/A                                       |
| Capital Project Approver (Unconstrained) | Role-Based (Unconstrained)                        | Capital Project Approver | N/A                                       |
| Capital Project Planning Administrator   | User-Based                                        | N/A                      | N/A                                       |
| ISSG_CapitalProjectPlanning              | Integration System Security Group (Unconstrained) | N/A                      | N/A                                       |

---

## Installation and Post-Installation

1.  **Import** the app into your Extend company.
2.  **Validate and Deploy** the app into a tenant.
3.  **Open App Manager** and find the app to open the configuration.
4.  **Create Domain Policies** for all Security Domains and assign groups.
5.  **Create Integration System User (ISU)**: `ISU_CapitalProjectPlanning`.
6.  **Assign the ISU** to the `ISSG_CapitalProjectPlanning` security group.
7.  **Click "Update App Configuration"** and confirm.
8.  **Edit the Application attribute "default"**: set `appISU` to `ISU_CapitalProjectPlanning` and select all applicable environments.
9.  **Assign your user** (the one configuring the app) to the `Capital Project Planning Administrator` group and the `WCP Integration System User Security` domain policy.
10. **Add all remaining domains** to the `ISSG_CapitalProjectPlanning` security group.

### Assign Integration System Users to App

Please follow the [instructions](https://developer.workday.com/documentation/GUID-72d57df4-c4ec-4825-a6e8-fdd596cf930e) on the Dev Site to assign ISU: `ISU_CapitalProjectPlanning` to the app.

---

## Usage Instructions

### Application Initialization

After installation, run the application initialization by opening the tenant task `Configure Capital Project Planning` and clicking **Initialize Application**. Once complete, review the configuration tabs and ensure the following required fields are set:

- **Plan Cycles**: Status
- **Service Categories**: Approving Cost Centers
- **Services**: Service Categories
- **Adaptive Planning Sync**: Planning Task Trigger should be set to `On Schedule` to start

---

## Calculated Fields, Sequences, BPs, and User Security

You need to create the following calculated fields to feed the graphs on the main page:

- **CF LRV Request Plan Cycle**

  - **Business Object**: Capital Project Request
  - **Lookup Field**: Request Header
  - **Related Business Object**: Capital Project Request Header
  - **Return Value**: Plan Cycle

- **CF LRV Funds Plan Cycle**

  - **Business Object**: Requested Fund
  - **WQL Alias**: `cf_CFLRVPlanCycleID`
  - **Lookup Field**: Capital Project Request
  - **Related Business Object**: Capital Project Request
  - **Return Value**: CF LRV Request Plan Cycle

Next, create the following Sequence Generator:

- Open the task `Create ID Definition / Sequence Generator`.
- Set **Sequence Name** to `Capital Project Planing Request ID Sequence`.
- Set **Increment Sequence ID By** to `1`.
- Configure the sequence format (e.g., `CAP-[Seq]`).
- In the **Web Service** section, update **Reference ID** to `CapitalProjectPlanning_RequestID_Sequence`.

Finally, assign the **Capital Project Planner** and **Capital Project Approver Roles** on Cost Centers as needed, create a plan cycle, and test the application thoroughly.

---

## Integration System

An integration system is required to manage business process orchestrations.

- **System Name**: `CapitalProjectPlanningBPMonitor`
- **Integration Template**: `Orchestrate Integration Template`
- **Integration Attributes**:
  - **Orchestration Name**: `CapitalProjectPlanningBPMonitor`
  - **Application Reference ID**: `capitalProjectPlanning_<application suffix>`

Schedule this integration to run regularly, for example, every 15 minutes:

- **Run Frequency**: Minute Recurrence
- **Recurrence Interval**: Every 15 minutes
- **Catch Up Behaviour**: None

---

## Security Groups

The following tables outline the recommended security settings for each group:

### ISSG_CapitalProjectPlanning

| Domain Security Policy                                                      | View | Modify | Get | Put |
| :-------------------------------------------------------------------------- | :--- | :----- | :-- | :-- |
| Capital Project Planning (capitalProjectPlanning\_\<suffix\>)               | X    | X      | X   | X   |
| Capital Project Planning Administrator (capitalProjectPlanning\_\<suffix\>) | X    | X      | X   | X   |
| Capital Project Planning Common (capitalProjectPlanning\_\<suffix\>)        | X    | X      | X   | X   |
| Capital Project Planning Restricted (capitalProjectPlanning\_\<suffix\>)    | X    | X      | X   | X   |
| Integration Process                                                         | X    | X      |     |     |
| Manage: Company                                                             | X    |        | X   |     |
| Manage: Cost Center                                                         | X    |        | X   |     |
| Manage: Project                                                             | X    |        | X   |     |
| Manage: Supervisory Organization                                            | X    |        | X   |     |
| WCP Integration System User Security                                        | X    | X      | X   | X   |
| Worker Data: Current Staffing Information                                   | X    |        | X   |     |

### Capital Project Planner/Approver (Cost Center)

| Domain Security Policy                                        | View | Modify | Get | Put |
| :------------------------------------------------------------ | :--- | :----- | :-- | :-- |
| Capital Project Planning (capitalProjectPlanning\_\<suffix\>) | X    | X      | X   | X   |

### Capital Project Planner/Approver (Unconstrained)

| Domain Security Policy                                               | View | Modify | Get | Put |
| :------------------------------------------------------------------- | :--- | :----- | :-- | :-- |
| Capital Project Planning Common (capitalProjectPlanning\_\<suffix\>) | X    |        | X   |     |

### Capital Project Planning Administrator

| Domain Security Policy                                                      | View | Modify | Get | Put |
| :-------------------------------------------------------------------------- | :--- | :----- | :-- | :-- |
| Capital Project Planning (capitalProjectPlanning\_\<suffix\>)               | X    | X      | X   | X   |
| Capital Project Planning Administrator (capitalProjectPlanning\_\<suffix\>) | X    | X      | X   | X   |
| Capital Project Planning Common (capitalProjectPlanning\_\<suffix\>)        | X    | X      | X   | X   |

---

## Business Process (BP) Security and Configuration

The initial setup for the two BPs, `Create Capital Project Request` and `Request Services`, is as follows.

### Create Capital Project Request

This BP requires at least an Initiation and an Approval step.

- **Who Can Start**: `Capital Project Approver (Cost Center)`, `Capital Project Approver (Unconstrained)`, `Capital Project Planner (Cost Center)`, `Capital Project Planner (Unconstrained)`, and `Capital Project Planning Administrator`.
- **Who Can View All**: `Capital Project Approver (Cost Center)`, `Capital Project Approver (Unconstrained)`, `Capital Project Planner (Cost Center)`, `Capital Project Planner (Unconstrained)`, and `Capital Project Planning Administrator`.
- **Who Can Approve**: `Capital Project Approver (Cost Center)`.
- **Who Can Deny**: `Capital Project Approver (Cost Center)`.

### Request Services

This BP also requires at least an Initiation and an Approval step.

- **Who Can Start**: `Capital Project Approver (Cost Center)`, `Capital Project Approver (Unconstrained)`, `Capital Project Planner (Cost Center)`, `Capital Project Planner (Unconstrained)`, and `Capital Project Planning Administrator`.
- **Who Can View All**: `Capital Project Planner (Cost Center)`, `Capital Project Planner (Unconstrained)`, and `Capital Project Planning Administrator`.
- **Who Can Approve**: `Capital Project Approver (Cost Center)`.
- **Who Can Deny**: `Capital Project Approver (Cost Center)`.
