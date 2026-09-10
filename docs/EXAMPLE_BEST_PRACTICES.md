# Example best practices

An example in this hub is code someone else will copy into their own tenant. This guide is about what makes that copy work the first time, teach something, and stay safe. It is also the reference behind the automated audit: every heading below is a rule id, and when the **Audit examples** check flags something on a pull request, the link in that finding lands on the matching section here.

## Before you submit

Ten questions to ask about your own example. If the answer to each is yes, the audit will be quiet.

1. Is the folder name kebab-case, like `expense-approvals`?
2. Does the folder have `example.json` and `README.md`, and does `example.json` have a title, a description, and a type from `hub.config.json`?
3. Does the README have the four sections: What it is, What's inside, How to use it, Before you deploy?
4. Does "Before you deploy" list every value a reader must change for their tenant?
5. Are Workday API calls made through `baseUrlType` and data providers, with no `*.workday.com` host spelled out anywhere?
6. Does every script use `site.applicationId` rather than the app id Workday generated for your tenant?
7. Does every endpoint have `failOnStatusCodes` with at least 400 and 403?
8. Are all `console.*` calls gone?
9. Does every widget have an `id`, and does every page have a security domain?
10. Are all leftover placeholders from the template deleted, along with any `.gitkeep` in a folder that has files?

You can run the same checks yourself before opening the PR:

```bash
./scripts/install-arcane.sh            # once
node scripts/audit-examples.mjs --changed
```

## How the audit works

Two sources of rules, one report.

- [Arcane Auditor](https://github.com/Developers-and-Dragons/ArcaneAuditor) is a community code review tool for Workday Extend and Orchestrate source, by Chris Humphrey, MIT licensed. It parses `.pmd`, `.pod`, `.amd`, `.smd`, `.script`, and orchestration files and applies 48 rules. Rule ids look like `HardcodedWorkdayAPIRule`. The explanations below are adapted from its rule documentation; `ArcaneAuditorCLI describe-rule <RuleId>` prints the full version with examples.
- The hub's own rules, in `scripts/audit/hub-rules.mjs`, cover the folder as a unit of reuse rather than the code: naming, metadata, README, leftover placeholders, and values that are tenant-specific without being documented. Their ids start with `Hub`.

Two severities. **ACTION** findings fail the check and block the merge until fixed. **ADVICE** findings are suggestions and never block. A maintainer can add the `audit-override` label when a finding is wrong for a particular example. Examples in `catalog/` are held to a stricter bar, where ADVICE counts as ACTION, because people copy them as reference.

On the pull request, each finding appears as an inline comment on the line it refers to. Where the fix is a single-line substitution, the comment carries a suggestion you can apply with one click. Everything is also listed in one summary comment that is updated on every push.

## Contents

- [The "Before you deploy" contract](#the-before-you-deploy-contract)
- [Portability](#portability): URLs, app ids, WIDs, dates
- [Robustness and safety](#robustness-and-safety): error handling, security, performance
- [Clean code](#clean-code): debug output, dead code, string building, structure
- [Naming and layout](#naming-and-layout)
- [Hub packaging](#hub-packaging): folder, metadata, README, placeholders
- [Orchestrate](#orchestrate)
- [Messages from the tooling itself](#messages-from-the-tooling-itself)
- [Running the audit yourself](#running-the-audit-yourself)

## The "Before you deploy" contract

Every Extend export carries values that belong to the tenant it came from. Some can be removed from the code; some cannot. The rule for this hub is simple: anything a reader must change is either replaced with something portable, or named in the README under `## Before you deploy`, with the file it lives in and what to put there instead.

```markdown
## Before you deploy

- **App reference id**: `presentation/expenseApprovals_k3f9qz.amd` and `.smd` carry the id from the
  original tenant. Replace `expenseApprovals_k3f9qz` with the id your tenant generates on import.
- **Security domain**: map `ExpenseApprover` in `model/` to the security group that should see this page.
- **Approval threshold**: the app attribute `autoApproveLimit` has no default. Set it per tenant.
- **Reporting period**: `dashboard.pmd` defaults the period picker to the current quarter. Change it if
  your fiscal year is offset.
```

A finding about an app id or a period literal goes quiet when the README explains it. Documentation that says "in order to use this, update X" mitigates most concerns a reviewer has.

## Portability

These rules are about whether the example survives being moved to another tenant, region, or year.

### HardcodedWorkdayAPIRule

**ACTION, one-click fix.** A URL such as `https://api.workday.com/common/v1/workers/me` or `https://api.us.wcp.workday.com/wql/v1` is pinned to one region and one infrastructure generation. Anyone who imports the example in a different data center gets failing calls, and Workday cannot move the endpoint under you.

Fix: use the `apiGatewayEndpoint` application variable, or better, a data provider plus `baseUrlType` (see [EndpointBaseUrlTypeRule](#endpointbaseurltyperule)).

```json
// before
{ "name": "getWorker", "url": "https://api.workday.com/common/v1/workers/me" }

// after
{ "name": "getWorker", "baseUrlType": "workday-common", "url": "/workers/me" }
```

When the URL sits inside a script expression, swap the literal for the variable rather than nesting a second `<% %>`:

```json
"url": "<% apiGatewayEndpoint + '/common/v1/workers/' + queryParams.workerId %>"
```

### HardcodedApplicationIdRule

**ACTION in this hub (Arcane's default is ADVICE).** The application id Workday generates on import (`expenseApprovals_k3f9qz`) is unique per tenant. Baking it into a URL or a data provider guarantees the copied example breaks. The fix is mechanical, which is why the hub raises it to ACTION.

```json
// before
"url": "<% 'https://api.workday.com/apps/expenseApprovals_k3f9qz/v1/requests' %>"

// after
"url": "<% apiGatewayEndpoint + '/apps/' + site.applicationId + '/v1/requests' %>"

// or, with a data provider in the .amd and baseUrlType "app"
"baseUrlType": "app", "url": "/requests"
```

Arcane reads the id from the `.smd`, so keep the `.smd` in the example folder or this rule cannot run.

### HardcodedWidRule

**ADVICE.** A 32-character Workday id, like `d588c41a446c11de98360015c5e6daf6`, usually belongs to one tenant. Even when it happens to exist everywhere, nobody reading the code knows what it points at.

Fix: define an app attribute in `attributes/default.attributes` with a meaningful name, read it as `appAttr.<name>`, and let tenant admins set the value. If the example needs a literal for teaching purposes, keep it and name it in "Before you deploy".

### EndpointBaseUrlTypeRule

**ADVICE.** Endpoints that spell out a Workday host, even through `apiGatewayEndpoint`, repeat the same thing on every page. Define the host once as a data provider in the `.amd` and reference it with `baseUrlType`.

```json
// .amd
"dataProviders": [ { "key": "workday-common", "value": "<% apiGatewayEndpoint + '/common/v1' %>" } ]

// .pmd
{ "name": "getWorker", "baseUrlType": "workday-common", "url": "/workers/me" }
```

An endpoint that has both `baseUrlType` and an absolute URL is a sign that one of them was pasted over the other. Keep the relative one.

### HubAppReferenceIdRule

**ADVICE.** The `.amd` and `.smd` file names and their `applicationId` and `siteId` fields carry the tenant-generated id. That is what an export looks like, and it is fine to ship. What matters is that the reader knows to replace it.

Fix: add a `## Before you deploy` section to the README that names the id and says what to do with it. The rule does not fire when that section exists. In scripts, reference the id as `site.applicationId` rather than repeating the literal.

### HubHardcodedPeriodLiteralRule

**ADVICE.** A widget whose `value` is a period or date literal, such as `2026-Q1`, `FY2026`, or `2026-03`, is correct for exactly one cycle. After that someone has to edit and redeploy, and an example that is quietly out of date teaches the wrong habit.

Fix, in order of preference:

1. Derive it. A few lines in the `script` section can turn `date:today` into a quarter or fiscal-year label.
2. Read it from an app attribute so admins change it without a deploy.
3. Keep the literal and mention it, with the file name, under "Before you deploy". The rule does not fire when the README mentions the literal there.

A default date in a date-picker demo is a legitimate literal. Document it and move on.

## Robustness and safety

These rules are about failures that are silent, pages that are open, and patterns that slow down the whole tenant.

### EndpointFailOnStatusCodesRule

**ACTION.** Without `failOnStatusCodes`, a 400 or 403 from the API does not fail the endpoint. The page carries on as if the call succeeded and shows empty or stale data with no error. Add at least 400 and 403 to every endpoint:

```json
{ "name": "getWorker", "url": "/workers/me", "failOnStatusCodes": [ { "code": 400 }, { "code": 403 } ] }
```

### OnlyMaximumEffortRule

**ACTION.** `"bestEffort": true` tells Extend to ignore failures on that endpoint. In an example that hides exactly the errors a reader needs to see. Remove it.

### NoIsCollectionOnEndpointsRule

**ACTION.** `"isCollection": true` on an inbound endpoint pulls whole collections and has caused tenant-wide slowdowns under concurrent use. Use a WQL or RaaS query that returns only what the page needs.

### NoPMDSessionVariablesRule

**ACTION.** An `outboundVariable` with `"variableScope": "session"` lives for the whole login session and keeps consuming memory after the user leaves the page. Use `"variableScope": "flow"`.

### PMDSecurityDomainRule

**ACTION.** A page with no `securityDomains` is open to every user in the tenant. Add at least one, and say in "Before you deploy" which security group the reader should map it to. MicroConclusion pages and the error pages listed in the `.smd` are exempt.

### WidgetIdRequiredRule

**ACTION.** Widgets without an `id` cannot be referenced from scripts, are hard to find in error messages, and in some widget types do not log their values. Give every section, fieldSet, richText, and input an id. Built-in containers such as `footer`, `item`, `group`, `title`, `pod`, and `card` are exempt.

### GridPagingWithSortableFilterableRule

**ACTION.** Paging combined with `sortableAndFilterable` columns re-fetches, re-sorts, and re-filters on every page change. Choose one: drop paging, or turn off sorting and filtering on the columns.

### StringBooleanRule

**ADVICE, one-click fix.** `"enabled": "false"` is a string that happens to be cast. `"enabled": false` says what you mean. Some AMD flow fields do require strings, and Arcane skips those.

### MultipleStringInterpolatorsRule

**ADVICE, one-click fix.** `"<% first %> <% last %>"` in one string is harder to read than a single template: `` "<% `{{first}} {{last}}` %>" ``.

## Clean code

These rules are about the code a reader will learn from. Examples get copied line by line, so the habits in them spread.

### ScriptConsoleLogRule

**ACTION, one-click fix.** `console.info`, `console.debug`, `console.warn`, and `console.error` calls in a shipped page write to tenant logs that other people can read, and in an example they teach readers to ship debug output. Remove them. The audit's suggestion comments the call out so you can decide; deleting it is better. If an example is specifically about logging, gate it behind an app attribute and say so.

Commented-out console calls do not trigger the rule.

### ScriptVarUsageRule

**ADVICE, one-click fix.** `var` is function-scoped, so reusing a name in a nested block overwrites the outer value. Use `let` for values that change and `const` for values that do not.

### ScriptStringConcatRule

**ADVICE, one-click fix where the expression fits on one line.** `'Hello ' + name + '!'` is easy to get wrong. Extend's template syntax handles spacing and escaping: `` `Hello {{name}}!` ``.

### ScriptVerboseBooleanCheckRule

**ADVICE, one-click fix.** `if (isActive == true)` and `return cond ? true : false` restate a boolean. Write `if (isActive)` and `return cond`.

### ScriptUnusedVariableRule

**ADVICE.** A variable that is declared and never read is usually a leftover from a refactor. Remove it so readers do not go looking for where it is used.

### ScriptUnusedFunctionRule

**ADVICE.** A function in a PMD or Pod `script` section that is never called from that file is dead weight. Remove it, or move it to a `.script` file if another page needs it.

### ScriptUnusedFunctionParametersRule

**ADVICE.** Parameters the function body never touches make callers guess what to pass. Drop them.

### ScriptUnusedIncludesRule

**ADVICE, one-click fix.** An `include` entry for a `.script` file whose functions are never called still costs parse time on every page load. Remove it.

### ScriptDeadCodeRule

**ADVICE.** In a standalone `.script` file, every top-level declaration should either be exported in the final object literal or used by something that is. Anything else is loaded for nothing.

### ScriptEmptyFunctionRule

**ADVICE.** An empty function body is either unfinished or unnecessary. Implement it or delete it.

### ScriptMagicNumberRule

**ADVICE.** `if (amount > 5000)` hides what 5000 means. Name it: `const managerApprovalLimit = 5000`. In a teaching example the name is the lesson.

### ScriptComplexityRule

**ADVICE.** More than ten independent paths through one function is hard to test and hard to read. Every `if`, loop, and `&&` adds one. Split into smaller functions with descriptive names.

### ScriptNestingLevelRule

**ADVICE.** More than four nested `if` or `for` levels is hard to follow. Flatten with early returns or extracted functions.

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

**ADVICE.** Assigning a new object to `self.data` inside an outbound endpoint's `onSend` uses the endpoint as a scratch variable. Build the payload in a local variable and return it. Setting properties on existing `self.data` from `valueOutBinding` is fine.

### ScriptDescriptiveParameterRule

**ADVICE.** `users.filter(x => x.active)` reads better as `users.filter(user => user.active)`. `a` and `b` in sort comparators are fine.

### EmbeddedImagesRule

**ADVICE.** A base64 `data:image/...` value makes the file large, makes every diff huge, and cannot be cached. Reference the image by URL, or ship it as a separate file in the example folder and say so in the README.

## Naming and layout

Consistency is what lets a reader move between examples without re-learning each one.

### FileNameLowerCamelCaseRule

**ADVICE.** Extend file names are lowerCamelCase: `expenseDetails.pmd`, not `Expense_Details.pmd`. Exported `.amd` and `.smd` files carry the generated app id, which contains an underscore; that is expected and covered by [HubAppReferenceIdRule](#hubappreferenceidrule) instead.

### EndpointNameLowerCamelCaseRule

**ADVICE.** Endpoint names are lowerCamelCase: `getExpenses`, not `GetExpenses` or `get_expenses`.

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

These rules come from the hub, not Arcane. They are about the folder as something the gallery can show and a reader can pick up.

### HubFolderKebabCaseRule

**ACTION.** Example folders are kebab-case: `expense-approvals`, not `Expense_Approvals` or `ExpenseApprovals`. The folder name becomes the URL slug in the gallery and the id in the README index, and the scaffolder enforces the same rule. The finding tells you the name to use.

### HubExampleJsonRule

**ACTION.** The folder needs `example.json` and `README.md`. That is the whole contract; the gallery, the index tables, and the badges are built from it. `example.json` needs `title`, `description`, and a `type` from `hub.config.json`; `components` and `products` also come from that file. The template's README documents every field.

Common findings and their fixes:

- *example.json is missing, "something.json" looks like the metadata file*: rename that file.
- *starts with "..." before the JSON begins*: usually a pasted code-fence label on line 1. Delete it.
- *"X" is not an approved type*: pick one of the values listed in the message.

The **Validate examples** check reports the same problems from `scripts/validate-examples.mjs`.

### HubReadmeSectionsRule

**ACTION for the first three, ADVICE for the fourth.** The README has four markdown sections, in this order:

1. `## What it is`: what the example shows and who it is for.
2. `## What's inside`: the files in the folder and what each is.
3. `## How to use it`: deploy, import, read, or run.
4. `## Before you deploy`: what to change for another tenant. See [the contract](#the-before-you-deploy-contract).

A README written in raw HTML gets one finding asking for the markdown sections. HTML does not render the same way in the gallery, and the sections are what reviewers and readers scan for.

### HubTemplateBoilerplateRule

**ACTION.** Text from `examples/_template/` is still in the submission: "One short paragraph: what this example shows", the "Fill in example.json (delete this section before submitting)" block, or the title `My Example`. Replace it with your content and delete the instructions block.

### HubGitkeepRule

**ADVICE.** `.gitkeep` exists only to make git keep an empty folder. Once the folder has real files the placeholder is noise. Delete it.

## Orchestrate

### OrchestrationSecurityDomainRule

**ACTION.** Sync and Async orchestrations must declare a security domain, otherwise anyone can invoke them. Add one and name the intended security group in "Before you deploy".

### OrchestrationGlobalErrorHandlerRule

**ADVICE in this hub (Arcane's default is ACTION).** A global error handler with a Log step, or Add Integration Message for integration templates, records failures that no local handler caught. Worth adding to any orchestration people will copy. Not always the point of a minimal example, which is why the hub downgrades it.

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

**ACTION.** Arcane Auditor could not analyze the folder at all; it exited with a usage or runtime error. The message carries the first line of the error. Usually a file it could not read. Check the folder builds in your own tooling and ask in the PR if it is not obvious. This is never about your code style.

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

**Reading the PR comment.** The audit posts one summary comment, updated on every push, and inline review comments on the lines it can point at. Where the fix is a one-line substitution the inline comment carries a suggestion you can apply with one click. Findings on lines the PR did not change, and file-level findings, appear only in the summary.

**Configuration.** Arcane's rule settings for this hub live in `.arcane-auditor/config.json`, and the reasons for each deviation from Arcane's defaults are in `.arcane-auditor/README.md`. To propose a change to a rule, a severity, or this page, open an issue or a pull request touching those files. Changes to Arcane's rules themselves belong upstream in the Arcane Auditor repository.
