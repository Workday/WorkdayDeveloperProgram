# Work From Almost Anywhere

## Introduction

An Extend app that lets employees request to work from anywhere, routes the request to their manager for approval, and shows everyone's arrangements on a calendar view.

Status: this is a sample entry that demonstrates the hub's format. The `app-source/` folder holds a placeholder until the real App Builder export lands.

## What's inside

- `app-source/` is where the app source exported from App Builder lives: app metadata (amd), site metadata (smd), pages (pmd), business objects, and security domains.
- `example.json` drives the card in the gallery and the index table in the repository README.

## Deploy instructions

### App Builder (recommended)

1. Open App Builder against your WCP development tenant.
2. Import this folder with Open a Local Folder, or upload the source as a ZIP to App Hub.
3. Save and Deploy, then install and launch the app in your tenant.

### IntelliJ plugin (alternative)

1. Install the Workday Extend Plugin for IntelliJ.
2. Open this folder in IntelliJ.
3. Log in to Workday Extend and your tenant, then deploy the app to the tenant.

## Configuration

### Security

Review the app's security domains in App Manager and confirm the domains match your tenant's security policy before installing.

### Business process

The approval flow extends a Workday business process. Check the routing so requests land with the right manager role.

## Usage

Employees open the app from the home page, pick their dates, and submit a request. Managers approve from their inbox, and approved arrangements appear on the shared calendar.
