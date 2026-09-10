# Example best practices

Every example in this hub exists to be copied into someone else's tenant. This page lists the things that make that copy succeed or fail, and it is the reference the automated audit links to. Each heading is a rule id; when the **Audit examples** check flags something on your pull request, the link in that finding lands on the matching section here.

The audit combines two sources:

- [Arcane Auditor](https://github.com/Developers-and-Dragons/ArcaneAuditor), a community code review tool for Workday Extend and Orchestrate source by Chris Humphrey (MIT). Its rule ids look like `HardcodedWorkdayAPIRule`. The explanations below are adapted from its rule documentation; run `ArcaneAuditorCLI describe-rule <RuleId>` for the full version.
- The hub's own rules in `scripts/audit/hub-rules.mjs`, about packaging and portability rather than code. Their ids start with `Hub`.

Two severities. **ACTION** findings fail the check and should be fixed before merge. **ADVICE** findings are suggestions and never block. A maintainer can add the `audit-override` label when a finding is wrong for a particular example. Examples in `catalog/` are held to a stricter bar (ADVICE counts as ACTION there) because people copy them as reference.

The review rubric behind all of this is the one in [CONTRIBUTING.md](../CONTRIBUTING.md): it works, it teaches, it is safe.

## Contents

- [The "Before you deploy" contract](#the-before-you-deploy-contract)
- [Portability](#portability): `HardcodedWorkdayAPIRule`, `HardcodedApplicationIdRule`, `HardcodedWidRule`, `EndpointBaseUrlTypeRule`, `HubAppReferenceIdRule`, `HubHardcodedPeriodLiteralRule`
- [Robustness and safety](#robustness-and-safety): endpoints, security domains, orchestration error handling
- [Clean code](#clean-code): debug logging, `var`, dead code, string building, structure
- [Naming and layout](#naming-and-layout)
- [Hub packaging](#hub-packaging): folder name, `example.json`, README sections, leftover template text, `.gitkeep`
- [Orchestrate](#orchestrate)
- [Messages from the tooling itself](#messages-from-the-tooling-itself)
- [Running the audit yourself](#running-the-audit-yourself)

## The "Before you deploy" contract

The single most useful thing an example README can do is tell the reader what to change. A hardcoded value is not a problem when the README says "replace this". It becomes a problem when the reader only finds out at runtime.

Every example README has a `## Before you deploy` section (the template in `examples/_template/README.md` has a skeleton). List each tenant-specific thing by file and value:

```markdown
## Before you deploy

- **App reference id**: `presentation/promotionNomination_rvylxm.amd` and `.smd` carry the id from the
  original tenant. Rename the files and replace `promotionNomination_rvylxm` with your own id.
- **Promotion cycle**: `managerNomination.pmd` sets `promotionCycleWidget` to `2026-Q1`. Change it, or
  replace it with a script that derives the quarter from today's date.
- **Worker type WID**: the WQL in `getEmployeeList` filters on a WID from the original tenant.
  Replace it with the id of the worker type you want.
- **Security domains**: map `ManagerPromotionNomination` to your manager security group.
```

Several rules below relax when this section exists and mentions the value in question. Documentation that says "in order to use this, update xyz" mitigates most concerns a reviewer has.

## Portability

### HardcodedWorkdayAPIRule

**ACTION, one-click fix.** A URL like `https://api.workday.com/common/v1/workers/me` or `https://api.us.wcp.workday.com/wql/v1` is pinned to one region and one infrastructure generation. Anyone who imports the example in another data center gets failing calls, and Workday cannot move the endpoint under you.

Fix: use the `apiGatewayEndpoint` application variable, or better, a data provider plus `baseUrlType` (see [EndpointBaseUrlTypeRule](#endpointbaseurltyperule)).

```json
// before
{ "name": "workerInfo", "url": "https://api.workday.com/common/v1/workers/me" }

// after
{ "name": "workerInfo", "baseUrlType": "workday-common", "url": "/workers/me" }
```

When the URL sits inside a script expression, swap the literal for the variable rather than nesting a second `<% %>`:

```json
"url": "<% apiGatewayEndpoint + '/businessProcess/v1/events/' + queryParams.eventId %>"
```

### HardcodedApplicationIdRule

**ACTION in this hub (Arcane's default is ADVICE).** The application id Workday generates (`promotionNomination_rvylxm`) is unique per tenant. Baking it into a URL or a data provider guarantees the copied example breaks on import. The fix is mechanical, which is why the hub raises it to ACTION.

```json
// before
"url": "<% 'https://api.workday.com/apps/promotionNomination_rvylxm/v1/nominations' %>"

// after
"url": "<% apiGatewayEndpoint + '/apps/' + site.applicationId + '/v1/nominations' %>"

// or, with a data provider in the .amd and baseUrlType "app"
"baseUrlType": "app", "url": "/nominations"
```

Arcane only detects this when the `.smd` is present in the folder, because that is where it reads the id from. Keep the `.smd` in the example.

### HardcodedWidRule

**ADVICE.** A 32-character Workday id (`d588c41a446c11de98360015c5e6daf6`) usually belongs to one tenant. Even when it happens to exist everywhere, nobody reading the code knows what it points at.

Fix: store it in an app attribute (`attributes/default.attributes`) with a meaningful name and read it as `appAttr.<name>`. Tenant admins set the value per tenant. If the example needs a literal for teaching purposes, name it in the README's "Before you deploy" section.

### EndpointBaseUrlTypeRule

**ADVICE.** Endpoints that spell out a Workday URL, even through `apiGatewayEndpoint`, duplicate the same host across every page. Define the host once as a data provider in the `.amd` and use `baseUrlType` on each endpoint.

```json
// .amd
"dataProviders": [ { "key": "workday-common", "value": "<% apiGatewayEndpoint + '/common/v1' %>" } ]

// .pmd
{ "name": "me", "baseUrlType": "workday-common", "url": "/workers/me" }
```

Declaring `baseUrlType` and an absolute URL on the same endpoint is a sign the second one won the copy-paste. Pick one.

### HubAppReferenceIdRule

**ADVICE.** The `.amd` and `.smd` file names and their `applicationId` / `siteId` fields carry the tenant-generated id (`stocknotifications_svfbfp`). That is normal for an export. What matters is that the reader knows to replace it.

Fix: add a `## Before you deploy` section to the README that names the id and says to replace it. The rule does not fire when that section exists. Scripts should reference the id as `site.applicationId` rather than repeating the literal.

### HubHardcodedPeriodLiteralRule

**ADVICE.** A widget whose `value` is a period or date literal (`2026-Q1`, `FY2026`, `2026-03`) is correct for exactly one cycle. After that someone has to edit and redeploy the app, and an example that is silently wrong teaches the wrong lesson.

Fix, in order of preference:

1. Derive it. A few lines in the `script` section can turn `date:today` into a quarter label.
2. Read it from an app attribute so admins change it without a deploy.
3. Keep the literal and mention it, with the file name, under "Before you deploy". The rule does not fire when the README mentions the literal there.

Legitimate defaults for a date picker demo are fine; document them.

## Robustness and safety

### EndpointFailOnStatusCodesRule

**ACTION.** Without `failOnStatusCodes`, a 400 or 403 from the API does not fail the endpoint. The page carries on as if the call succeeded and shows empty or stale data with no error. Add at least 400 and 403 to every endpoint:

```json
{ "name": "getWorkers", "url": "/workers", "failOnStatusCodes": [ { "code": 400 }, { "code": 403 } ] }
```

### OnlyMaximumEffortRule

**ACTION.** `"bestEffort": true` tells Extend to ignore failures on that endpoint. In an example that hides exactly the errors a reader needs to see. Remove it.

### NoIsCollectionOnEndpointsRule

**ACTION.** `"isCollection": true` on an inbound endpoint pulls entire collections and has caused tenant-wide slowdowns under concurrent use. Use a WQL or RaaS query that returns what the page needs.

### NoPMDSessionVariablesRule

**ACTION.** An `outboundVariable` with `"variableScope": "session"` lives for the whole login session and keeps consuming memory after the user leaves the page. Use `"variableScope": "flow"`.

### PMDSecurityDomainRule

**ACTION.** A page with no `securityDomains` is open to every user in the tenant. Add at least one, and describe in "Before you deploy" which security group the reader should map it to. MicroConclusion pages and error pages listed in the `.smd` are exempt.

### WidgetIdRequiredRule

**ACTION.** Widgets without an `id` cannot be referenced from scripts, are hard to find in error messages, and in some widget types (panelList, for example) do not log their values. Give every section, fieldSet, richText, and input an id. Built-in containers like `footer`, `item`, `group`, `title`, `pod`, and `card` are exempt.

### GridPagingWithSortableFilterableRule

**ACTION.** Paging combined with `sortableAndFilterable` columns re-fetches, re-sorts, and re-filters on every page change. Choose one: drop paging, or turn off sorting and filtering on the columns.

### StringBooleanRule

**ADVICE, one-click fix.** `"enabled": "false"` is a string that happens to be cast. `"enabled": false` says what you mean. Some AMD flow fields do require strings; Arcane skips those.

### MultipleStringInterpolatorsRule

**ADVICE, one-click fix.** `"<% a %> and <% b %>"` in one string is harder to read than a single template: `` "<% `{{a}} and {{b}}` %>" ``.

## Clean code

### ScriptConsoleLogRule

**ACTION, one-click fix.** `console.info`, `console.debug`, `console.warn`, and `console.error` calls in a shipped page write to tenant logs that other people can read, and in an example they teach readers to ship debug output. Remove them. The audit suggests commenting the call out so you can decide; deleting it is better. If an example needs logging, gate it behind an app attribute and say so.

Commented-out console calls do not trigger the rule.

### ScriptVarUsageRule

**ADVICE, one-click fix.** `var` is function-scoped, so reusing a name in a nested block overwrites the outer value. Use `let` for values that change and `const` for values that do not.

### ScriptStringConcatRule

**ADVICE, one-click fix where the expression fits on one line.** `'Hello ' + name + '!'` is easy to get wrong (missing spaces, wrong types). Extend's template syntax handles it: `` `Hello {{name}}!` ``.

### ScriptVerboseBooleanCheckRule

**ADVICE, one-click fix.** `if (isActive == true)` and `return cond ? true : false` restate a boolean. Write `if (isActive)` and `return cond`.

### ScriptUnusedVariableRule

**ADVICE.** A variable that is declared and never read is usually a leftover from a refactor. Remove it so readers do not go looking for where it is used.

### ScriptUnusedFunctionRule

**ADVICE.** A function in a PMD or Pod `script` section that is never called from that file is dead weight. Remove it, or move it to a `.script` file if another page needs it.

### ScriptUnusedFunctionParametersRule

**ADVICE.** Parameters the function body never touches make callers guess what to pass. Drop them.

### ScriptUnusedIncludesRule

**ADVICE, one-click fix.** An `include` entry for a `.script` file whose functions are never called (`script.function()`) still costs parse time on every page load. Remove it.

### ScriptDeadCodeRule

**ADVICE.** In a standalone `.script` file, every top-level declaration should either be exported in the final object literal or used by something that is. Anything else is loaded for nothing.

### ScriptEmptyFunctionRule

**ADVICE.** An empty function body is either unfinished or unnecessary. Implement it or delete it.

### ScriptMagicNumberRule

**ADVICE.** `if (score > 85)` hides what 85 means. Name it: `const promotionThreshold = 85`. In a teaching example the name is the lesson.

### ScriptComplexityRule

**ADVICE.** More than ten independent paths through one function (every `if`, loop, and `&&` adds one) is hard to test and hard to read. Split it into smaller functions with descriptive names.

### ScriptNestingLevelRule

**ADVICE.** More than four nested `if` / `for` levels is hard to follow. Flatten with early returns or extracted functions.

### ScriptLongFunctionRule

**ADVICE.** Functions over 50 lines are doing several things. Split them.

### ScriptLongBlockRule

**ADVICE.** Inline handlers (`onLoad`, `onChange`, `onSend`) over 30 lines belong in named functions in the `script` section, or in a `.script` file if shared.

### ScriptFunctionParameterCountRule

**ADVICE.** More than four parameters invites wrong-order bugs. Pass an object, or split the function.

### ScriptFunctionReturnConsistencyRule

**ADVICE.** If some paths return a value and others return nothing, callers get `null` by surprise. Make every path return explicitly, `null` included.

### ScriptArrayMethodUsageRule

**ADVICE.** Manual index loops are where off-by-one bugs live. `map`, `filter`, and `forEach` say what the loop is for.

### ScriptNestedArraySearchRule

**ADVICE.** `workers.map(w => orgs.find(o => o.id == w.orgId))` searches the whole inner array for every outer item. With thousands of records that is slow and can run out of memory. Build a map once with `list:toMap()` and look up by key.

### ScriptOnSendSelfDataRule

**ADVICE.** Assigning a new object to `self.data` inside an outbound endpoint's `onSend` uses the endpoint as a scratch variable. Build the payload in a local variable and return it. Setting properties on existing `self.data` (from `valueOutBinding`) is fine.

### ScriptDescriptiveParameterRule

**ADVICE.** `users.filter(x => x.active)` reads better as `users.filter(user => user.active)`. `a` and `b` in sort comparators are fine.

### EmbeddedImagesRule

**ADVICE.** A base64 `data:image/...` value makes the file large, makes every diff huge, and is not cacheable. Reference the image by URL, or ship it as a separate file in the example folder and say so in the README.

## Naming and layout

### FileNameLowerCamelCaseRule

**ADVICE.** Extend file names are lowerCamelCase: `managerNomination.pmd`, not `Manager_Nomination.pmd`. Exported `.amd` and `.smd` files carry the generated app id, which contains an underscore; that is expected and covered by [HubAppReferenceIdRule](#hubappreferenceidrule) instead.

### EndpointNameLowerCamelCaseRule

**ADVICE.** Endpoint names are lowerCamelCase: `getEmployeeList`, not `GetEmployeeList` or `get_employee_list`.

### WidgetIdLowerCamelCaseRule

**ADVICE.** Widget ids are lowerCamelCase for the same reason.

### ScriptVariableNamingRule

**ADVICE.** Variables are lowerCamelCase.

### ScriptFunctionParameterNamingRule

**ADVICE.** Parameters are lowerCamelCase.

### PMDSectionOrderingRule

**ADVICE.** Top-level PMD sections in a consistent order (`id`, `securityDomains`, `include`, `script`, `endPoints`, `onSubmit`, `outboundData`, `onLoad`, `presentation`) make every page scan the same way. Reorder the keys; nothing else changes.

### FooterPodRequiredRule

**ADVICE.** A footer defined inline on every page has to be edited on every page. Put it in a pod and include the pod. Hub, tabbed, and microConclusion pages are exempt.

## Hub packaging

These rules come from the hub, not Arcane. They are about the folder as a unit of reuse.

### HubFolderKebabCaseRule

**ACTION.** Example folders are kebab-case: `promotion-nomination`, not `Promotion_Nomination` or `PromotionNomination`. The folder name becomes the URL slug in the gallery and the id in the README index, and the scaffolder enforces the same rule. The finding tells you the name to use.

### HubExampleJsonRule

**ACTION.** The folder needs `example.json` and `README.md`. That is the whole contract; the gallery, the index tables, and the badges are built from it. `example.json` needs `title`, `description`, and a `type` from `hub.config.json`; `components` and `products` also come from that file. The template's README documents every field.

Common findings and their fixes:

- *example.json is missing, "app-info.json" looks like the metadata file*: rename the file.
- *starts with "JSON" before the JSON begins*: a pasted code-fence label. Delete the first line.
- *"X" is not an approved type*: pick one of the values listed in the message.

The **Validate examples** check reports the same problems from `scripts/validate-examples.mjs`.

### HubReadmeSectionsRule

**ACTION for the first three, ADVICE for the fourth.** The README has four markdown sections, in this order:

1. `## What it is`: what the example shows and who it is for.
2. `## What's inside`: the files in the folder and what each is.
3. `## How to use it`: deploy, import, read, or run.
4. `## Before you deploy`: what to change for another tenant. See [the contract](#the-before-you-deploy-contract).

A README written in raw HTML (`<h1 align="center">`) gets one finding asking for the markdown sections. HTML does not render the same way in the gallery, and the sections are what reviewers and readers scan for.

### HubTemplateBoilerplateRule

**ACTION.** Text from `examples/_template/` is still in the submission: "One short paragraph: what this example shows", the "Fill in example.json (delete this section before submitting)" block, or the title `My Example`. Replace it with your content and delete the instructions block.

### HubGitkeepRule

**ADVICE.** `.gitkeep` exists only to make git keep an empty folder. Once the folder has real files the placeholder is noise. Delete it.

## Orchestrate

### OrchestrationSecurityDomainRule

**ACTION.** Sync and Async orchestrations must declare a security domain, otherwise anyone can invoke them. Add one and name the intended security group in "Before you deploy".

### OrchestrationGlobalErrorHandlerRule

**ADVICE in this hub (Arcane's default is ACTION).** A global error handler with a Log step (or Add Integration Message for integration templates) records failures that no local handler caught. Worth adding to any orchestration people will copy; not always the point of a minimal example, which is why the hub downgrades it.

### OrchestrationApiStepErrorHandlerRule

**ADVICE in this hub (Arcane's default is ACTION).** Each API step should have a local error handler with a Log step, so transient failures are recorded rather than swallowed. Same reasoning as above.

### OrchestrationBranchOnConditionsNestingRule

**ADVICE.** More than three nested Branch on Conditions steps is hard to follow in the builder. Extract a suborchestration.

### OrchestratePreferExplicitDefaultAccessor

**ADVICE.** Some accessor functions throw when a value is missing. Prefer the variant that takes a default so the missing case is handled where it happens.

### OrchestrationVerboseBooleanCheckRule

**ADVICE.** A Conditional wrapper that returns `true` or `false` around a condition that is already boolean is redundant. Use the condition directly.

## Messages from the tooling itself

### ArcaneAuditorError

**ACTION.** Arcane Auditor could not analyze the folder at all (it exited with a usage or runtime error). The message carries the first line of the error. Usually a file it could not read; check the folder builds in your own tooling and ask in the PR if it is not obvious. This is never about your code style.

### ArcaneAuditorWarning

**ADVICE.** Arcane analyzed the folder but its script parser gave up on one block, so script rules were skipped for that block. The message names the line. Often the script uses a construct Arcane's grammar does not know yet, which is worth an issue on the Arcane repository; sometimes it is a real syntax slip worth a second look.

## Running the audit yourself

From the repository root:

```bash
./scripts/install-arcane.sh            # once; downloads the Arcane CLI into .arcane-auditor/bin/
node scripts/audit-examples.mjs --changed
```

`--changed` audits every example folder that differs from `origin/main`. Other forms:

```bash
node scripts/audit-examples.mjs --dirs examples/my-example     # one folder
node scripts/audit-examples.mjs --changed --skip-arcane        # hub rules only, no download needed
node scripts/audit-examples.mjs --changed --format markdown    # what the PR comment will say
node scripts/audit-examples.mjs --changed --format json --output audit/report.json
```

The exit code is 1 when there are blocking findings, the same as CI.

**Reading the PR comment.** The audit posts one summary comment (updated on every push, never duplicated) and inline review comments on lines it can point at. Where the fix is a one-line substitution the inline comment carries a GitHub suggestion you can apply with one click. Findings on lines the PR did not change, and file-level findings, appear only in the summary.

**Configuration.** Arcane's rule settings for this hub live in `.arcane-auditor/config.json`; the reasons for each deviation from Arcane's defaults are in `.arcane-auditor/README.md`. To propose a change to a rule, a severity, or this page, open an issue or a pull request touching those files. Changes to Arcane's rules themselves belong upstream in the Arcane Auditor repository.
