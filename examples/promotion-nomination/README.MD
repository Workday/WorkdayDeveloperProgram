# Promotion Nomination

## What it is

A Workday Extend app that lets a manager nominate one of their direct reports for promotion. The manager picks an employee, sees career details pulled from Workday, adds a justification, and submits. The nomination is saved to a custom business object and sent into a business process for approval. A second page shows a submitted nomination as read-only details when someone opens the business process event.

It is a good reference if you want to see WQL-driven form prefill, a two-step submit (save an object, then start a business process on it), and a VIEW page driven by a business process event ID.

## What's inside

- `presentation/managerNomination.pmd`: the landing page (route `/`). Employee picker, prefilled career fields, nomination form, and the submit logic.
- `presentation/eventDetails.pmd`: the read-only page (route `/eventDetails/{eventId}`). Loads the business process event, follows it to the saved nomination, and displays it.
- `presentation/promotionNomination_rvylxm.amd`: the app definition. Declares the two routes and the five data providers (`workday-staffing`, `workday-wql`, `workday-common`, `workday-bp`, `app`), all built on `apiGatewayEndpoint`.
- `presentation/promotionNomination_rvylxm.smd`: the site definition. Holds the app and site ids, the language, and the SSO authentication scheme.

Both pages use the `ManagerPromotionNomination` security domain.

## How to use it

1. **Pick an employee.** The list comes from a WQL query on `myDirectReports`.
2. **Review the prefilled data.** Once an employee is chosen, the page fills in current job profile, current job title, time in job profile, hire date and last promotion date. These fields are read-only.
3. **Complete the nomination.** Choose a reason (Merit/Performance, Increased Responsibilities, or Organizational Restructuring), a proposed effective date and a proposed job profile. The promotion cycle is set to the current year. Then answer three required questions: why the worker is being considered, what the business need is, and how the worker suits the role.
4. **Submit.** The page posts the nomination to the `promotionNominationBOS` business object, then posts to `promotionNominationBPEvents` with that object as the business process target. The new event ID is returned to the flow as `PromotionSubmissionResponseValue`.
5. **View the result.** Opening the business process event lands on `eventDetails`, which shows the nominee, nominator, reason, dates, job profiles and the three written answers.

To test, sign in as a manager with direct reports and run through the steps above. Also try an employee with no hire date, and a submission with no proposed job profile selected. Both should still submit.

## Before you deploy

- **App reference id.** If he site.applicationid throws an error on the app builder, please replace it with your application ID.
- **Worker type ID.** The `getEmployeeList` endpoint in `managerNomination.pmd` limits direct reports to one worker type, using the ID `d588c41a446c11de98360015c5e6daf6`. That ID is specific to the tenant this example came from. Replace it with the worker type you want, or remove the filter.
- **Security domain.** Map `ManagerPromotionNomination` to the security groups that should submit and view nominations, then activate pending security policy changes.
- **Business object and business process.** The app expects a `promotionNominationBOS` business object and a `promotionNominationBPEvents` business process. Approval steps, such as routing to a next-level manager or a People Business Partner, are set up in the business process definition, not in these page files. Configure them for your own approval chain.
- **Last promotion date fallback.** When a worker has no last promotion date, `managerNomination.pmd` uses `2020-01-01`. Change that default in the employee `onChange` if it does not suit your data.
