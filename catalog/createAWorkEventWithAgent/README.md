---
title: Create A Work Event With Agent
description: Enable employees to propose, manage, and register for work events via interactive UI views or an AI Custom Agent featuring Agent File Uploads and Custom Scripts in Skill Files.
version: 2026.1
---

# Create A Work Event With Agent

Enable employees to propose, manage, and register for work events using interactive UI views (including a multi-select calendar widget) or through an AI Custom Agent featuring **Agent File Uploads** and **Custom Scripts in Skill Files**.

- **Version:** 2026.1

---

## 1. Resources

### Extend App Overview

- [Review the Create A Work Event forum page](https://forum.developer.workday.com/t/app-catalog-app-create-a-work-event/7301) for even more details and a video demo of the app.

### Agent Feature References

- [Feature Overview: Agent File Uploads in Custom Agents](https://forum.developer.workday.com/t/feature-overview-agent-file-uploads-in-custom-agents/47396)
- [Feature Overview: Custom Scripts in Agent Skills](https://forum.developer.workday.com/t/feature-overview-custom-scripts-in-agent-skills/47481)

---

## 2. Deployment Instructions

> ⚠️ **Important:** The application, its data models, and business process components **must be deployed first** to establish tenant-specific App Reference IDs and WIDs before configuring agent skill files.

### Step 1: Package the Application
1. Clone or download this repository.
2. Compress (zip) the `createAWorkEventWithAgent` folder located in the `catalog/` directory.
3. Use this `.zip` package when importing the application into Workday App Builder.

### Step 2: Import & Deploy via App Builder
1. Build an Extend App by choosing the `Upload a Zip File` option.
2. Import the `createAWorkEventWithAgent` package.
3. Deploy the application to your tenant.

> ℹ️ **Expected Warning During Initial Deployment:**  
> You may see an **"Agent Registry Update Failed"** error modal stating:  
> *"The app was deployed successfully, but the agent could not be registered with the Agent System of Record."*  
> **This is expected and normal.** The underlying data model components and application deployed successfully. The agent registration fails at this stage because the skill `.md` files contain invalid placeholder WIDs and source tool names. You will fix these references in **Section 4**.

---

## 3. Security & Business Process Configuration

### A. Domain Security Policies (App Manager)

#### 1. Manage: Create an Event Security Domain
1. In the **Model Components** section of App Manager, locate the Security Domain `Manage: Create an Event` and click **Create** in the **Domain Security Policy** column.
2. Check `Confirm` and click **OK**.
3. Add the following permissions:
   - **Report/Task Permissions (Modify):** `HR Administrator`

#### 2. Register For Events Security Domain
1. In the **Model Components** section of App Manager, locate the Security Domain `Register For Events` and click **Create** in the **Domain Security Policy** column.
2. Check `Confirm` and click **OK**.
3. Add the following permissions:
   - **Report/Task Permissions (Modify):** `All Employees`

---

### B. Business Process Configuration

#### 1. Create a Work Event Business Process Security
1. Locate the `Create Work Event` Business Process in App Manager and click **Edit** in the **Security Policy** column.
2. Configure the Business Process Security Policy with the following permissions:
   - **Initiate Create a Work Event:** `Employee as Self`
   - **Action Steps: Book Event Space:** `HR Administrator`
   - **View All:** `Employee as Self`, `HR Administrator`
   - **Approve:** `Manager`
   - **Deny:** `Manager`
3. Run the **Activate Pending Security Policy Changes** task to activate your updates.

#### 2. Business Process Definition
1. Locate the `Create a Work Event` Business Process in App Manager and click **Create** in the **Business Process Definition** column. Click **OK**.
2. On the **Edit Business Process** screen, click **OK** and **Done** to create an empty definition that auto-completes.
   - *(Optional)* Add additional steps as needed (e.g., an approval step for **HR Administrators**).

---

## 4. Custom Agent Configuration & Activation

### Step 1: Update Skill Files Using Developer Agent
1. In **App Builder**, verify you are connected to your active tenant.
2. Open and run **Developer Agent** using the following prompt:

> *"The Agent Skill files were imported from an application outside the current organization. Please find all references in the skill files to `createAWorkEventWithAgent_mcwslt` and replace them with the current app reference ID. For any tool where you make this change, also update the tool with the valid WID for this tenant. Do not make changes to any other tools."*

### Step 2: Re-Deploy the Application
1. Save all updated skill files in App Builder.
2. Deploy the application again to apply the updated, tenant-specific references.

### Step 3: Register & Activate the Agent
1. In Workday, navigate to the **Agent System of Record**.
2. Register the newly configured **Work Event** agent.
3. Verify that all skills, custom scripts, and tools are associated correctly.
4. Set the agent status to **Active**.

---

## 5. Usage & Verification

### Standard UI Usage
1. In your Development tenant, search for and run the **Work Event Registration** task.
2. **Create an Event:** Propose a new work event.
3. **Manage Events:** Create or update existing Work Events.
4. **Register for an Event:** Sign up for an existing Work Event (users may register only once per event; a charity must exist to use the Donations page).
5. **Manage My Events:** View and manage existing event registrations.
6. **Calendar View:** View, create, and register for work events using the Multi-Select Calendar widget.

### Agent Verification (Workday Chat)
1. In **Workday Tenant Agent Chat**, start a session with your newly registered Work Event agent.
2. Test natural-language event creation (e.g., *"Help me create an Event for the Holiday Party"*).