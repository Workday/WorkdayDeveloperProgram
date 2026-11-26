# Workday web-service request schemas: v46.2 compared with v47.1

Services compared: 13. Operations in v47.1: 1,860. Identical requests: 1,754. Changed: 84. New operations: 22. Removed operations: 3. Operations with a newly required element: 1.

Requests only, not responses. Element paths are followed seven levels below the request element. This compares published schemas; it does not test what a tenant answers.

## Absence Management

16 operations in v47.1: 10 identical requests, 6 changed, 0 new, 0 removed.

| Operation | Added | Removed | Retyped | First addition | First removal | Newly required |
|---|---|---|---|---|---|---|
| Enter Time Off | 4 | 0 | 0 | Enter Time Off Data > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference |  |  |
| Import Request Leave of Absence Events | 4 | 0 | 0 | Request Leave of Absence Event > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference |  |  |
| Import Request Return from Leave of Absence Events | 4 | 0 | 0 | Request Return from Leave Event > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference |  |  |
| Import Time Off Request Event Batch | 4 | 0 | 0 | Enter Time Off Data > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference |  |  |
| Request Leave of Absence | 4 | 0 | 0 | Request Leave of Absence Data > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference |  |  |
| Request Return from Leave of Absence | 4 | 0 | 0 | Request Return from Leave of Absence Data > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference |  |  |

## Compensation

68 operations in v47.1: 64 identical requests, 4 changed, 0 new, 1 removed.

Removed operations: Retrieve Severance Worksheet.

| Operation | Added | Removed | Retyped | First addition | First removal | Newly required |
|---|---|---|---|---|---|---|
| Import Request Compensation Change | 3 | 0 | 0 | Request Compensation Request Information HV > Request Compensation Change Data > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference |  |  |
| Import Request One Time Payment | 3 | 0 | 0 | Request One-Time Payment Request Information HV > One-Time Payment Data > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference |  |  |
| Request Compensation Change | 4 | 0 | 0 | Request Compensation Change Data > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference |  |  |
| Request One-Time Payment | 4 | 0 | 0 | One-Time Payment Data > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference |  |  |

## Financial Management

418 operations in v47.1: 389 identical requests, 20 changed, 9 new, 2 removed.

New operations: Get Cost and Profitability Condition Rules, Get Cost and Profitability Group Sets, Get Cost and Profitability Model Definitions, Get Cost and Profitability Rules, Put Cost and Profitability Condition Rule, Put Cost and Profitability Group Set, Put Cost and Profitability Model Definition, Put Cost and Profitability Rule, Submit Tax Declaration Run.

Removed operations: Get Receivables Overpayment Reasons, Put Receivables Overpayment Reason.

| Operation | Added | Removed | Retyped | First addition | First removal | Newly required |
|---|---|---|---|---|---|---|
| Bulk Import Submit Accounting Journal | 4 | 0 | 0 | Submit Accounting Journal Request > Accounting Journal Data > Specific Approver Reference |  |  |
| Get Receivables Reasons | 5 | 0 | 4 | Request Criteria |  |  |
| Import Accounting Journal | 4 | 0 | 0 | Accounting Journal Data > Specific Approver Reference |  |  |
| Put Account Reconciliation Definition | 4 | 0 | 0 | Account Reconciliation Definition Data > Autodecertification Rule Reference |  |  |
| Put Business Entity Contact | 5 | 0 | 0 | Business Entity Contact Data > Supplier Portal Tenant Access Data |  |  |
| Put Company ID Definition | 4 | 0 | 0 | Company ID Definition Data > ID Definition Data > Company ID Definitions > Tax Declaration Netting Transaction Sequence Generator Reference |  |  |
| Put Company Tax Details | 11 | 9 | 0 | Company Tax Details Data > Tax Reporting Data | Company Tax Details Data > Default Tax Code Reference |  |
| Put Currency Rate Type | 1 | 0 | 0 | Currency Rate Type Data > Prevent Rate Override |  |  |
| Put Funding Source | 4 | 1 | 0 | Funding Source Data > Funding Source Status Reference | Funding Source Data > On Hold | Funding Source Data > Funding Source Status Reference |
| Put Receivables Reason | 11 | 0 | 4 | Receivables Reason Data > Tax Recovery on Writeoff Data |  |  |
| Put Recurring Journal Template | 14 | 0 | 0 | Business Process Parameters |  |  |
| Put Supporting Balance | 11 | 0 | 0 | Supporting Balance Data > Fiscal Period Reference |  |  |
| Put Transaction Tax Code | 1 | 0 | 0 | Tax Code Data > Inactive |  |  |
| Put Transaction Tax Rule for Country | 5 | 4 | 0 | Transaction Tax Rule for Country Data > Transaction Country Tax Rule Line Data > Tax Attributes Reference > Transaction Tax Code Configuration Reference | Transaction Tax Rule for Country Data > Transaction Country Tax Rule Line Data > Tax Code Reference |  |
| Put Transaction Tax Rule for Items | 5 | 4 | 0 | Items Tax Rule Data > Items Tax Rule Line Data > Tax Attributes Reference > Transaction Tax Code Configuration Reference | Items Tax Rule Data > Items Tax Rule Line Data > Tax Code Reference |  |
| Put Transaction Tax Rule for Worktags | 5 | 4 | 0 | Worktags Tax Rule Data > Worktags Tax Rule Line Data > Tax Attributes Reference > Transaction Tax Code Configuration Reference | Worktags Tax Rule Data > Worktags Tax Rule Line Data > Tax Code Reference |  |
| Put Withholding Tax Code | 1 | 0 | 0 | Withholding Tax Code Data > Inactive |  |  |
| Put Withholding Tax Rule for Country | 5 | 4 | 0 | Withholding Tax Rule for Country Data > Withholding Tax Rule for Country Line > Withholding Tax Code Configuration Data | Withholding Tax Rule for Country Data > Withholding Tax Rule for Country Line > Tax Code Reference |  |
| Put Withholding Tax Rule for Items | 5 | 4 | 0 | Withholding Tax Rule for Items Data > Withholding Items Tax Rule Line Data > Withholding Tax Code Configuration Data | Withholding Tax Rule for Items Data > Withholding Items Tax Rule Line Data > Tax Code Reference |  |
| Put Withholding Tax Rule for Worktags | 5 | 4 | 0 | Withholding Worktags Tax Rule Data > Withholding Worktags Tax Rule Line Data > Withholding Tax Code Configuration Data | Withholding Worktags Tax Rule Data > Withholding Worktags Tax Rule Line Data > Tax Code Reference |  |

## Human Resources

322 operations in v47.1: 315 identical requests, 7 changed, 0 new, 0 removed.

| Operation | Added | Removed | Retyped | First addition | First removal | Newly required |
|---|---|---|---|---|---|---|
| Add Academic Appointment | 0 | 9 | 0 |  | Add Academic Appointment Data > Create Workday Account Sub Business Process for Academic Affiliate > Create Workday Account Data > Delegated Authentication Configuration Reference |  |
| Add Workday Account | 0 | 9 | 0 |  | Workday Account for Worker Data > Delegated Authentication Configuration Reference |  |
| Change Legal Name | 4 | 0 | 0 | Change Legal Name Data > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference |  |  |
| Change Personal Information | 4 | 0 | 0 | Change Personal Information Data > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference |  |  |
| Put Onboarding Plan | 4 | 0 | 0 | Onboarding Plan Data > Onboarding Security Category Reference |  |  |
| Put Service Center Representative Workday Account | 0 | 9 | 0 |  | Service Center Representative Workday Account Data > Workday Account Data > Delegated Authentication Configuration Reference |  |
| Update Workday Account | 0 | 9 | 0 |  | Workday Account for Worker Data > Delegated Authentication Configuration Reference |  |

## Integrations

34 operations in v47.1: 33 identical requests, 1 changed, 0 new, 0 removed.

| Operation | Added | Removed | Retyped | First addition | First removal | Newly required |
|---|---|---|---|---|---|---|
| Put Integration System | 0 | 3 | 0 |  | Integration System Data > Integration Service Data > Job Integration Delivery Configuration Data > Integration Transport Protocol Assignment Data > Integration Transport Protocol Data > Email Transport Protocol Data > Bcc Internet Email Address |  |

## Learning

104 operations in v47.1: 102 identical requests, 1 changed, 1 new, 0 removed.

New operations: Get Observational Checklist Revision.

| Operation | Added | Removed | Retyped | First addition | First removal | Newly required |
|---|---|---|---|---|---|---|
| Manage Learning Course | 2 | 0 | 0 | Manage Learning Course Data > Learning Blended Course > Learning Course Data > Disable View Course Again |  |  |

## Payroll

104 operations in v47.1: 102 identical requests, 2 changed, 0 new, 0 removed.

| Operation | Added | Removed | Retyped | First addition | First removal | Newly required |
|---|---|---|---|---|---|---|
| Put Payroll Accounting Options | 40 | 2 | 0 | Payroll Accounting Options Data > Payroll Accounting Options Accounting Reallocation Data | Payroll Accounting Options Data > Payroll Accounting Options General Data > Allocate Net Pay Liability Based on Earning Proration |  |
| Put Payroll Deduction Recipient | 5 | 4 | 0 | Payroll Deduction Recipient Data > Deduction Recipient Snapshot Data > Payroll Third-Party Payment Configuration Data > Enable Salary Sacrifice | Payroll Deduction Recipient Data > Deduction Recipient Snapshot Data > Payroll Third-Party Payment Configuration Data > Deduction Reference |  |

## Performance Management

45 operations in v47.1: 43 identical requests, 2 changed, 0 new, 0 removed.

| Operation | Added | Removed | Retyped | First addition | First removal | Newly required |
|---|---|---|---|---|---|---|
| Import Employee Reviews | 16 | 0 | 0 | Employee Review Data > Careers Review Section data > Review Career Data > Skill Interest Reference |  |  |
| Load Employee Reviews | 16 | 0 | 0 | Employee Review Data > Careers Review Section data > Review Career Data > Skill Interest Reference |  |  |

## Recruiting

108 operations in v47.1: 104 identical requests, 2 changed, 2 new, 0 removed.

New operations: Get Recruiting Document Category Groups, Put Recruiting Document Category Group.

| Operation | Added | Removed | Retyped | First addition | First removal | Newly required |
|---|---|---|---|---|---|---|
| Bulk Import Put Candidate | 13 | 0 | 0 | Put Candidate Request > Candidate Data > Job Application Data > Additional Attachment Data |  |  |
| Put Candidate Attachment | 22 | 9 | 0 | Job Application Attachment Data > Additional Attachment Data | Job Application Attachment Data > Attachment Data |  |

## Resource Management

364 operations in v47.1: 335 identical requests, 19 changed, 10 new, 0 removed.

New operations: Assign Capital Project Transaction, Capitalize Project Asset, Get Capital Project Transactions, Get Company Expenses Options, Get Project Assets for Capitalization, Get Project Resource Assignments, Get Project Resource Requests, Put Company Expenses Options, Submit Project Resource Assignment, Submit Project Resource Request.

| Operation | Added | Removed | Retyped | First addition | First removal | Newly required |
|---|---|---|---|---|---|---|
| Adjust Asset | 4 | 0 | 0 | Adjust Asset Data > Proposed Adjustment Per Book > Adjustment Amount |  |  |
| Bulk Import Asset Book Configuration | 1 | 0 | 0 | Update Asset Book Configuration Request > Asset Book Configuration Data > Accumulated Impairment |  |  |
| Bulk Import Register Asset | 1 | 0 | 0 | Register Asset Request > Business Asset Data > Depreciation Schedule Data > Accumulated Impairment |  |  |
| Bulk Import Submit Purchase Order Change Order | 1 | 0 | 0 | Submit Purchase Order Change Order Request > Purchase Order Change Order Data > Change Order Service Line Data > Recurring |  |  |
| Bulk Import Submit Supplier | 10 | 8 | 0 | Submit Supplier Request > Supplier Data > Transaction Tax Code Configuration Data | Submit Supplier Request > Supplier Data > Default Tax Code Reference |  |
| Bulk Import Submit Supplier Invoice | 16 | 0 | 1 | Submit Supplier Invoice Request > Supplier Invoice Data > Attachment Data > Attachment Category Reference |  |  |
| Get Supplier Contracts | 1 | 0 | 0 | Response Group > Exclude Attachment Data |  |  |
| Import Supplier Invoice | 16 | 0 | 1 | Supplier Invoice Data > Attachment Data > Attachment Category Reference |  |  |
| Put Business Entity Contact | 5 | 0 | 0 | Business Entity Contact Data > Supplier Portal Tenant Access Data |  |  |
| Put Requirements for Resource Plan | 1 | 1 | 0 | Resource Plan Requirement Data > Resource Plan Line Requirement Data > Resource Plan Line Requirement Parameter Data > Project Resource Requirement Parameter ID | Resource Plan Requirement Data > Resource Plan Line Requirement Data > Resource Plan Line Requirement Parameter Data > Resource Plan Line Requirement Parameter ID |  |
| Put Resource Pool | 4 | 0 | 0 | Resource Pool Data > Resource Pool Audience Reference |  |  |
| Put Supplier | 10 | 8 | 0 | Supplier Data > Transaction Tax Code Configuration Data | Supplier Data > Default Tax Code Reference |  |
| Put Supplier Invoice Text Only | 6 | 0 | 0 | Supplier Invoice Text Only Data > Attachment Data > Attachment Category Reference |  |  |
| Submit Purchase Order | 1 | 0 | 0 | Purchase Order Data > Service Line Replacement Data > Recurring |  |  |
| Submit Receipt | 4 | 0 | 0 | Receipt Data > Receipt Creation Source Reference |  |  |
| Submit Requisition | 192 | 0 | 0 | Requisition Data > Recurring Request Data |  |  |
| Submit Supplier Invoice Adjustment | 6 | 0 | 1 | Supplier Invoice Adjustment Data > Attachment Data > Attachment Category Reference |  |  |
| Submit Supplier Invoice Contract | 1 | 0 | 0 | Supplier Invoice Contract Data > Supplier Invoice Line Replacement Data > Exclude Receipt Accrual |  |  |
| Submit Supplier Invoice Request | 5 | 0 | 1 | Supplier Invoice Request Data > Attachment Data > Attachment Category Reference |  |  |

## Staffing

147 operations in v47.1: 128 identical requests, 19 changed, 0 new, 0 removed.

| Operation | Added | Removed | Retyped | First addition | First removal | Newly required |
|---|---|---|---|---|---|---|
| Add Additional Job | 4 | 7 | 0 | Add Additional Job Data > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference | Add Additional Job Data > Add Academic Appointment Sub Process > Add Academic Appointment Data > Create Workday Account Sub Business Process for Academic Affiliate > Create Workday Account Data > Delegated Authentication Configuration Reference |  |
| Bulk Import End Additional Job | 3 | 0 | 0 | End Additional Job Request > End Additional Job Data > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference |  |  |
| Cancel Personnel Action Request Event | 6 | 0 | 0 | Cancel Personnel Action Request Data > Personnel Action Request Data Header |  |  |
| Change Job | 4 | 0 | 0 | Change Job Data > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference |  |  |
| Change Personal Information | 4 | 0 | 0 | Change Personal Information Data > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference |  |  |
| Contract Contingent Worker | 0 | 9 | 0 |  | Contract Contingent Worker Data > Create Workday Account Sub Process > Create Workday Account Data > Delegated Authentication Configuration Reference |  |
| Correct Personnel Action Request Event | 6 | 0 | 0 | Correct Personnel Action Request Data > Personnel Action Request Data Header |  |  |
| Edit Service Dates | 4 | 0 | 0 | Edit Service Dates Data > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference |  |  |
| Hire Employee | 4 | 16 | 0 | Hire Employee Data > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference | Hire Employee Data > Add Academic Appointment Sub Process > Add Academic Appointment Data > Create Workday Account Sub Business Process for Academic Affiliate > Create Workday Account Data > Delegated Authentication Configuration Reference |  |
| Import Add Additional Job | 3 | 3 | 0 | Add Additional Job Information HV > Add Additional Job Data > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference | Add Additional Job Information HV > Add Additional Job Data > Add Academic Appointment Sub Process > Add Academic Appointment Data > Create Workday Account Sub Business Process for Academic Affiliate > Create Workday Account Data > Delegated Authentication Configuration Reference |  |
| Import Change Job | 3 | 0 | 0 | Change Job Information HV > Change Job Data > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference |  |  |
| Import Contract Contingent Worker | 0 | 9 | 0 |  | Contract Contingent Worker Information HV > Contract Contingent Worker Data > Create Workday Account Sub Process > Create Workday Account Data > Delegated Authentication Configuration Reference |  |
| Import Hire Employee | 3 | 12 | 0 | Hire Employee Information HV > Hire Employee Data > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference | Hire Employee Information HV > Hire Employee Data > Add Academic Appointment Sub Process > Add Academic Appointment Data > Create Workday Account Sub Business Process for Academic Affiliate > Create Workday Account Data > Delegated Authentication Configuration Reference |  |
| Import Personnel Action Status Update | 4 | 0 | 0 | Personnel Action Status Update Item > Personnel Action Request Event Status Reference |  |  |
| Import Terminate Employee | 3 | 0 | 0 | Terminate Employee Information HV > Terminate Employee Data > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference |  |  |
| Put Legal Authority | 4 | 0 | 0 | Legal Authority Data > Parameter Data > Class Report Field Reference |  |  |
| Put Nature of Action | 6 | 1 | 0 | Nature of Action Data > Legal Authorities Optional | Nature of Action Data > Don t Require Legal Authority and Remark |  |
| Put Remark | 4 | 0 | 0 | Remark Data > Parameter Data > Class Report Field Reference |  |  |
| Terminate Employee | 4 | 0 | 0 | Terminate Employee Data > Personnel Action Request Sub Process > Personnel Action Request Data > Personnel Action Request Data Header > Personnel Action Assignment Type Reference |  |  |

## Talent

120 operations in v47.1: 119 identical requests, 1 changed, 0 new, 0 removed.

| Operation | Added | Removed | Retyped | First addition | First removal | Newly required |
|---|---|---|---|---|---|---|
| Put Development Item | 14 | 0 | 0 | Development Item Data > Development Item Version Data > Learning Content Reference |  |  |

## Time Tracking

10 operations in v47.1: 10 identical requests, 0 changed, 0 new, 0 removed.
