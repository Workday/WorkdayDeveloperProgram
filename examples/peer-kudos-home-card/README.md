# Peer Kudos & Recognition Card

## What it is

An Extend application that brings employee recognition directly to the Workday homepage. The solution features an interactive Home Page Card (`kudosSpotlight`) displaying recent team shoutouts, a Presentation Page (`sendKudos.pmd`) where employees can submit kudos tied to core company values, a custom Business Object (`PeerKudos`) to store submissions, and an Orchestration flow (`KudosNotification`) to prepare notification summaries for managers.

## What's inside

- `appManifest.json`: Application configuration defining the app metadata, reference ID, and version.
- `cards/kudosSpotlight.carddefinition`: The Home page card definition providing quick visibility and direct launch actions into the recognition flow.
- `presentation/peerKudos.amd`: Application Metadata Definition registering the home and send kudos tasks and navigation routes.
- `presentation/peerKudos.smd`: Site Metadata Definition configuring site authentication and supported languages.
- `presentation/home.pmd`: Team recognition landing page displaying recent shoutouts.
- `presentation/sendKudos.pmd`: Interactive form for selecting a peer, choosing a value badge, writing an appreciation note, and submitting.
- `model/PeerKudos.businessobject`: Custom business object schema storing recipient, sender, badge type, message, and timestamp.
- `model/KudosSecurityDomain.securitydomain`: Security domain definition controlling access permissions for pages and orchestrations.
- `orchestration/KudosNotification.orchestration`: Orchestrate workflow triggered on submission that queries recent kudos entries and formats manager notifications with full error-handling scaffolding.
- `sample-data/sample-kudos-entry.json`: Fictional JSON response illustrating stored peer kudos records.
- `example.json`: Metadata file used by the Workday Developer Program gallery.

## How to use it

1. Deploy the app source to your Workday Cloud Platform (WCP) development tenant using App Builder, the Workday CLI (WDCLI), or Local Disk Sync.
2. Configure or map the `KudosSecurityDomain` to your target security groups (e.g., All Employees) so users can view the card and submit kudos.
3. Import `orchestration/KudosNotification.orchestration` into Workday Orchestration Builder and deploy it to your tenant.
4. Add the `kudosSpotlight` card to your default Home page configuration in Workday Home Settings.
5. Open Workday; the card appears on the desktop and mobile homepage ready for team members to share recognition.

## Before you deploy

Before deploying this example to your target tenant, verify the following configuration points:

- **App reference id**: `peerKudos` in `appManifest.json`, `presentation/peerKudos.amd`, and `presentation/peerKudos.smd` is the sample app reference ID. When deploying to your tenant, replace it with the app reference ID generated for your application, or reference it dynamically using `site.applicationId` in scripts and PMD expressions.
- **Security domains**: Map `KudosSecurityDomain` in `model/KudosSecurityDomain.securitydomain` to your organization's security groups (e.g., Employee Self-Service / All Workers) to grant create and view permissions.
- **Base URLs**: Endpoints in `sendKudos.pmd` use `baseUrlType: "workday-apps"` to resolve your tenant's API host automatically without hardcoding tenant URLs.
- **Manager Notifications**: In `orchestration/KudosNotification.orchestration`, update the notification recipient mapping to route to your organization's communication channel (such as Slack, Microsoft Teams, or Workday Notifications) as needed.
