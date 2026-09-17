# Promotion Nomination App

A streamlined promotion nomination platform that enables managers to identify, evaluate, and advocate for top-performing direct reports.

## What it is

The Promotion Nomination App automates the collection of employee career data and routes nominations through a multi-level approval workflow. It ensures consistent evaluation, transparency, and governance across all promotion decisions by handling everything from employee selection through final approval and archival.

## What's inside

**Core components:**
- **managerNomination**: Landing page where managers submit and track nominations
- **eventDetails**: Business process approval page definition for multi-level review

**Key capabilities:**
- Employee selection from direct reports with intuitive dropdown interface
- Auto-populated career data (current job profile, tenure, hire date, promotion history)
- Optional integration with Workday Talent details or third-party platforms
- Structured fields for nomination rationale and target role alignment
- Promotion cycle tracking (e.g., 2026-Q1)
- Multi-level approval routing to next-level managers and People Business Partner
- Secure storage and audit trail via Custom Business Object

## How to use it

**1. Select Employee**
Manager selects an eligible worker from their list of direct reports.

**2. Auto-Populate Career History**
The system automatically pulls:
- Current job profile and time in position
- Original hire date
- Last promotion date

**3. Build the Nomination**
Manager provides promotion justification with:
- Reason for promotion (merit, increased responsibilities, restructuring)
- Target role (proposed job profile)
- Timeline (proposed effective date)
- Business impact statement

**4. Route Through Approvals**
The nomination enters the multi-level approval chain. Once all approvals are granted, data is archived to the Custom Business Object.

## Before you deploy

- Update the app base URL in the AMD file with your app name
- Optionally configure Workday Orchestrate integration to automatically trigger the Change Job business process upon final approval
- Test the approval workflow with test users at each level
