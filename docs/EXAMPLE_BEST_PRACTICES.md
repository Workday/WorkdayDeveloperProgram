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

- [Arcane Auditor](https://github.com/Developers-and-Dragons/ArcaneAuditor) is a community code review tool for Workday Extend and Orchestrate source, by Chris Humphrey, MIT licensed. It parses `.pmd`, `.pod`, `.amd`, `.smd`, `.script`, and orchestration files and applies 48 rules. Rule ids look like `HardcodedWorkdayAPIRule`. Each Arcane section below quotes Arcane's own rule documentation verbatim: the reasoning, the before-and-after example, and the recommendation, exactly as `ArcaneAuditorCLI describe-rule <RuleId>` prints them for v2.0.0. Only the severity line and any hub policy note are ours.
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

**ACTION, one-click fix.**

Hardcoded workday.com URLs are not update safe and lack regional awareness. Using the `apiGatewayEndpoint` variable ensures your endpoints work across all environments and regions without code changes. If Workday adds additional regional endpoints or changes infrastructure, using the `apiGatewayEndpoint` application variable keeps your app update safe and regionally aware.

**Example violations:**

```json
// AMD dataProvider
{
  "dataProviders": [
    {
      "key": "workday-common",
      "value": "https://api.workday.com/common/v1/"  // ❌ Hardcoded workday.com URL
    }
  ]
}

// PMD endpoint
{
  "name": "getWorker",
  "url": "https://api.workday.com/common/v1/workers/me"  // ❌ Hardcoded workday.com URL
}
```

**Fix:**

```json
// AMD dataProvider
{
  "dataProviders": [
    {
      "key": "workday-common",
      "value": "<% apiGatewayEndpoint + '/common/v1/' %>"  // ✅ Use apiGatewayEndpoint
    }
  ]
}

// PMD/POD endpoint
{
  "name": "getWorker",
  "url": "<% apiGatewayEndpoint + '/common/v1/workers/me' %>"  // ✅ Use apiGatewayEndpoint
}
```

**Recommendation:** Use the `apiGatewayEndpoint` application variable instead of hardcoded *.workday.com URLs. This ensures your endpoints work across all environments and regions, and keeps your app update safe if Workday changes infrastructure.

### HardcodedApplicationIdRule

**ACTION, one-click fix.** Arcane rates this ADVICE; this hub raises it to ACTION because examples exist to be copied and a hardcoded app id guarantees the copy breaks.

Hardcoded application IDs break when you deploy the same code to different customer environments, because each has a unique ID. Using `site.applicationId` makes your code environment-agnostic and prevents runtime failures.

**Example violations:**

```javascript
const appId = "acmeCorp_speedy"; // ❌ Hardcoded applicationId
```

**Fix:**

```javascript
const appId = site.applicationId; // ✅ Use site.applicationId
```

**Recommendation:** Replace hardcoded applicationId values with `site.applicationId` to make your code environment-agnostic and prevent deployment failures across different customer environments.

### HardcodedWidRule

**ADVICE.**

Hardcoded WIDs (Workday IDs) are often environment-specific - a worker or job WID from your WCPDev tenant won't exist in Production. This causes runtime errors when the code tries to look up non-existent data. But even if you're using a common WID that exists across environments, it is meaningless to a developer looking at your code (possibly including yourself!). Storing WIDs in app attributes allows different values per environment, makes your application portable across tenants and instances, and allows for you to name it in a way that makes sense!

**Example violations:**

```javascript
const query = "SELECT worker FROM allIndexedWorkers WHERE country = 'd9e41a8c446c11de98360015c5e6daf6'"; // ❌ Hardcoded WID
```

**Fix:**

```javascript
const usaLocation = appAttr.usaLocation; // ✅ Use app attribute
const query = "SELECT worker FROM allIndexedWorkers WHERE country = usaLocation"
```

**App attribute definition** lives in `attributes/default.attributes` (JSON array at the project root):

```json
[
  { "name": "usaLocation", "type": "string",  "alias": "usaLocation" },
  { "name": "retries",     "type": "numeric", "alias": "retries" },
  { "name": "enableDebug?",    "type": "boolean", "alias": "enableDebug?" }
]
```

Supported `type` values: `string`, `numeric`, `boolean`.

**Recommendation:** Store WID values in app attributes instead of hardcoding them. This makes the app portable across tenants and lets you name the value meaningfully.

**Agent guidance:**

1. App attribute **definitions** live in `attributes/default.attributes` (JSON array at the project root). If the file does not exist, it can be created.
2. Each definition has shape `{"name": "...", "type": "string|numeric|boolean", "alias": "..."}`. Only those three types are supported.
3. Per-tenant **values** for these attributes are set in the Workday tenant by an admin — there is no API and no project file an agent can edit to set them. The agent can add the *definition*, but the user must populate values in each tenant.
4. Reference the attribute from script via `appAttr.<name>` (e.g., `appAttr.usaLocation`).
5. Before adding a new definition, check `attributes/default.attributes` for an existing entry that fits — don't create duplicates.

### EndpointBaseUrlTypeRule

**ADVICE.**

Workday APIs are heavily used within most Extend applications. Creating a re-usable definition in the AMD dataProviders array is recommended. When dataProviders are defined, developers can use `baseUrlType` on inbound and outbound endpoints (like 'workday-common' or 'workday-app'). This prevents the developer from explicitly including the entire URL both within and across pages. It has the added benefit of reducing the length of URLs on your endpoint definitions, making them easier to read and maintain.

**Example violations:**

```json
// Hardcoded workday.com URL
{
  "name": "getWorker",
  "url": "https://api.workday.com/common/v1/workers/me"  // ❌ Hardcoded workday.com
}

// Direct apiGatewayEndpoint usage
{
  "name": "getWorker",
  "url": "<% apiGatewayEndpoint + '/common/v1/workers/me' %>"  // ❌ Should use baseUrlType
}
```

**Fix:**

```json
{
  "name": "getWorker",
  "url": "/workers/me",  // ✅ Relative URL
  "baseUrlType": "workday-common"  // ✅ Use baseUrlType instead
}
```

**Recommendation:** Extract Workday API endpoints to shared AMD dataProviders and use `baseUrlType` on endpoints instead of hardcoded URLs. This reduces duplication and makes URLs easier to read and maintain.

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

**ACTION, one-click fix.**

Without proper error handling (failOnStatusCodes), your endpoints silently swallow errors like "400 Bad Request" or "403 Forbidden", causing your application to proceed as if the call succeeded when it actually failed. This leads to data inconsistencies, broken workflows, and debugging nightmares. Explicit error handling ensures failures are properly caught and handled.

**Example violations:**

```json
{
  "endPoints": [{
    "name": "getCurrentUser",
    "url": "/users/me"
    // ❌ Missing failOnStatusCodes
  }]
}
```

**Fix:**

```json
{
  "endPoints": [{
    "name": "getCurrentUser", 
    "url": "/users/me",
    "failOnStatusCodes": [
      {"code": 400},
      {"code": 403}
    ]
  }]
}
```

**Recommendation:** Always include `failOnStatusCodes` with at least codes 400 and 403 on all endpoints to ensure errors are properly caught and handled, preventing silent failures.

### OnlyMaximumEffortRule

**ACTION, one-click fix.**

Using `bestEffort: true` on endpoints silently swallows API failures, causing your code to continue executing as if the call succeeded when it actually failed. This leads to data inconsistency, partial updates, and bugs that are extremely hard to debug because you have no visibility into the failure.

**Example violations:**

```json
{
  "name": "getWorkers",
  "bestEffort": true  // ❌ Can mask API failures
}
```

**Fix:**

```json
{
  "name": "getWorkers"
  // ✅ Remove bestEffort property
}
```

**Recommendation:** Remove `bestEffort: true` from all endpoints to ensure API failures are properly caught and handled, preventing silent failures and data inconsistencies.

### NoIsCollectionOnEndpointsRule

**ACTION.**

Using `isCollection: true` on inbound endpoints may cause severe performance degradation when apps are in use simultaneously by different users. This can slow down the entire Workday instance for all users, not just your application. Avoiding isCollection on inbound endpoints is critical for maintaining app performance.

**Example violations:**

```json
{
  "inboundEndpoints": [
    {
      "name": "getWorkers",
      "isCollection": true  // ❌ May cause performance issues
    }
  ]
}
```

**Fix:**

Consider utilizing WQL or RaaS instead, which will allow for fewer API calls that return larger datasets.

**Recommendation:** Remove `isCollection: true` from inbound endpoints. Use WQL or RaaS queries instead for better performance and to avoid tenant-wide performance degradation.

### NoPMDSessionVariablesRule

**ACTION.**

Session-scoped variables persist for the entire user session (potentially hours), continuously consuming memory even after the user leaves your page. This memory isn't released until logout, degrading performance over time and potentially causing issues for long-running sessions.

**Example violations:**

```json
{
  "outboundEndpoints": [
    {
      "name": "saveUserPreference",
      "type": "outboundVariable",
      "variableScope": "session"  // ❌ Lasts entire session - performance issue
    }
  ]
}
```

**Fix:**

```json
{
  "outboundEndpoints": [
    {
      "name": "saveUserPreference",
      "type": "outboundVariable",
      "variableScope": "flow"  // ✅ Use a flow variable, instead
    }
  ]
}
```

**Recommendation:** Use `variableScope: "flow"` instead of `"session"` for outboundVariable endpoints to prevent memory accumulation and performance degradation.

### PMDSecurityDomainRule

**ACTION.**

Security domains control who can access your PMD pages in Workday. Missing security domains means your page is accessible to all users, which could lead to a security incident.

**Smart Exclusions (configurable):**
- **MicroConclusion pages**: Pages with `presentation.microConclusion: true` are excluded (unless strict mode)
- **Error pages**: Pages whose ID appears in SMD `errorPageConfigurations` are excluded (unless strict mode)

**Example violations:**

```javascript
// ❌ Missing security domains
{
  "id": "myPage",
  "presentation": {
    "body": { ... }
  }
}

// ✅ Proper security domains
{
  "id": "myPage", 
  "securityDomains": ["ViewAdminPages"],
  "presentation": {
    "body": { ... }
  }
}

// ✅ MicroConclusion page (excluded in normal mode)
{
  "id": "microPage",
  "presentation": {
    "microConclusion": true,
    "body": { ... }
  }
}
```

**Recommendation:** Always define at least one security domain for PMD pages to control access and prevent security incidents. Use strict mode to enforce security domains on all pages, including microConclusion and error pages.

### WidgetIdRequiredRule

**ACTION.**

Widget IDs are essential for referencing widgets in scripts (to get/set values, show/hide, etc.) and for debugging. Without IDs, you can't interact with widgets programmatically, making dynamic behavior impossible. IDs also help identify widgets in error messages and make code maintenance much easier when you need to find where a widget is defined or used. There are also known issues where missing IDs will result in logs not showing the data someone may expect (i.e. a panelList widget may not log its values without all IDs set).

**Smart Exclusions:**
Built-in widget types that don't require IDs: `footer`, `item`, `group`, `title`, `pod`, `cardContainer`, `card`, `instanceList`, `taskReference`, `editTasks`, `multiSelectCalendar`, `bpExtender`, `hub`, and column objects (which use `columnId` instead).

**Example violations:**

```json
{
  "type": "richText",  // ❌ Missing id field
  "label": "Welcome",
  "value": "Hello, user!"
}
```

**Fix:**

```json
{
  "type": "richText",
  "id": "welcomeMessage",  // ✅ Added id field
  "label": "Welcome",
  "value": "Hello, user!"
}
```

**Recommendation:** Always include an `id` field for widgets that need to be referenced in scripts or for debugging. This enables programmatic interaction and makes code maintenance easier.

### GridPagingWithSortableFilterableRule

**ACTION.**

Combining paging with sortable/filterable columns can cause severe performance degradation due to how data is fetched and processed. This combination forces the system to fetch, sort, and filter data on every page change, leading to slow response times and potential timeout issues.

**Example violations:**

```json
{
  "type": "grid",
  "id": "workerGrid",
  "autoPaging": true,  // ❌ Paging enabled
  "columns": [
    {
      "columnId": "workerName",
      "sortableAndFilterable": true  // ❌ Sortable/filterable with paging
    }
  ]
}
```

**Fix:**

```json
{
  "type": "grid",
  "id": "workerGrid",
  "autoPaging": true,  // ✅ Keep paging
  "columns": [
    {
      "columnId": "workerName",
      "sortableAndFilterable": false  // ✅ Disable sortable/filterable when using paging
    }
  ]
}
```

**OR remove paging if sorting/filtering is required:**

```json
{
  "type": "grid",
  "id": "workerGrid",
  // ✅ No paging
  "columns": [
    {
      "columnId": "workerName",
      "sortableAndFilterable": true  // ✅ Can use sortable/filterable without paging
    }
  ]
}
```

**Recommendation:** Either remove paging from grids that need sortable/filterable columns, or disable sortableAndFilterable on all columns when using paging. This combination causes severe performance issues.

### StringBooleanRule

**ADVICE, one-click fix.**

Booleans should be represented as actual boolean values (true / false), not strings ("true" / "false"). While the backend may gracefully cast string values, this "magic conversion" hides the true intent of the data.

**🧙 Wizard's Note:** Some areas of Extend actually *require* you to use strings, instead of bools (for example: for some values in your AMD flows), so we won't check in those places and just accept this "gotcha" with Extend.

**Example violations:**

```json
{
  "visible": "true",  // ❌ String instead of boolean
  "enabled": "false"  // ❌ String instead of boolean
}
```

**Fix:**

```json
{
  "visible": true,  // ✅ Actual boolean
  "enabled": false  // ✅ Actual boolean
}
```

**Recommendation:** Use actual boolean values (true/false) instead of strings ("true"/"false") to clearly express intent and avoid relying on implicit type conversion.

### MultipleStringInterpolatorsRule

**ADVICE, one-click fix.**

Multiple interpolators (<% %>) in a single string are harder to read and maintain. Using a single template literal with embedded expressions is cleaner and more performant.

**Example violations:**

```json
"My name is <% name %> and I like <% food %>"  // ❌ Multiple interpolators
```

**Fix:**

```json
"<% `My name is {{name}} and I like {{food}}` %>"  // ✅ Single interpolator with template literal
```

**Recommendation:** Use a single interpolator with template literals (backticks and `{{variable}}` syntax) instead of multiple interpolators in a single string. This improves readability.

## Clean code

These rules are about the code a reader will learn from. Examples get copied line by line, so the habits in them spread.

### ScriptConsoleLogRule

**ACTION, one-click fix.**

Console statements left in production code can expose sensitive data in production logs, which may be accessible to individuals who should not have access to that same data. They're debugging artifacts that should be removed before deployment. Accidentally shipping console logs can leak business logic, data structures, or user information.

**🧙 Wizard's Note:** If your code uses an app attribute flag to enable/disable logging based on environments, you may think you don't need this rule. However, my recommendation would be to keep the rule in place and use it as a reminder to quickly verify any logging in place and ensure that those statements are implemented using your attribute flags. If a log entry slips in that didn't use it, this means your code may unintentionally write to production logs, leading to the kind of PII leakage that the rule is intended to help avoid!

**Example violations:**

```javascript
function processData(data) {
    console.debug("Processing data:", data); // ❌ Debug statement
    return data.map(item => item.value);
}
```

**Fix:**

```javascript
function processData(data) {
    // Comment out or remove
    // console.debug("Processing data:", data);
    return data.map(item => item.value);
}
```

**Recommendation:** Remove all console log statements from production code. If logging is needed, use app attribute flags to control logging based on environment, ensuring sensitive data is never exposed in production logs.

### ScriptVarUsageRule

**ADVICE, one-click fix.**

The `var` keyword has function scope, which can cause unexpected behavior and bugs when the same name is reused in nested blocks. Using `let` (block scope) and `const` (immutable) makes your code more predictable and prevents accidental variable shadowing issues.

Using the `const` keyword is also a good way to communicate `intent` to your readers.

**Example violations:**

```javascript
var myVariable = "value";  // ❌ Should use 'let' or 'const'
```

**Fix:**

```javascript
const myVariable = "value";  // ✅ Use 'const' for immutable values
let myVariable = "value";    // ✅ Use 'let' for mutable values
```

**Recommendation:** Replace `var` declarations with `let` for mutable variables or `const` for immutable values. This ensures block scoping and prevents variable shadowing issues.

### ScriptStringConcatRule

**ADVICE, one-click fix.**

String concatenation with `+` is verbose, error-prone (easy to forget spaces), and harder to read than template syntax. Workday Extend's template syntax (`{{variable}}`) is specifically designed for building strings with dynamic values, handles escaping automatically, and makes the intent clearer. Using the right tool prevents formatting bugs and improves readability.

**Example violations:**

```javascript
const message = "Hello " + userName + ", welcome to " + appName; // ❌ String concatenation
```

**Fix:**

```javascript
const message = `Hello {{userName}}, welcome to {{appName}}`; // ✅ PMD template syntax
```

**Recommendation:** Use PMD template syntax with backticks and `{{variable}}` instead of string concatenation. This makes code more readable, prevents formatting errors, and handles escaping automatically.

### ScriptVerboseBooleanCheckRule

**ADVICE, one-click fix.**

Verbose boolean checks like `if (isActive == true)` or `return (condition) ? true : false` add unnecessary noise and make code harder to scan. The value is already boolean, so the comparison is redundant. Concise expressions (`if (isActive)` or `return condition`) are clearer, more idiomatic, and reduce visual clutter.

**Example violations:**

```javascript
if (user.active == true) { }     // ❌ Verbose
if (user.active != false) { }    // ❌ Verbose
return (condition) ? true : false; // ❌ Redundant
```

**Fix:**

```javascript
if (user.active) { }              // ✅ Concise
if (!user.active) { }             // ✅ Concise
return condition;                 // ✅ Direct return
```

**Recommendation:** Use concise boolean expressions instead of verbose comparisons. Direct boolean values and conditions are clearer and more idiomatic.

### ScriptUnusedVariableRule

**ADVICE.**

Unused variables clutter code and create confusion - developers waste time wondering if the variable is actually used somewhere they can't see. They also suggest incomplete refactoring or abandoned features. Removing unused variables improves code clarity and reduces the mental load of understanding what's actually active in your application.

**Example violations:**

```javascript
function processData() {
    const unusedVar = "never used"; // ❌ Unused variable
    const result = calculateResult();
    return result;
}
```

**Fix:**

```javascript
function processData() {
    const result = calculateResult();
    return result;
}
```

**Recommendation:** Remove unused variables to improve code clarity and reduce bundle size. Unused variables suggest incomplete refactoring or abandoned features.

### ScriptUnusedFunctionRule

**ADVICE.**

Unused functions add unnecessary code that developers must read and maintain, creating mental overhead when trying to understand what the page actually does. They also increase parsing time and memory usage. Removing unused functions keeps your PMD/Pod files focused and makes the actual logic easier to follow.

**What This Rule Does:** This rule tracks function usage within PMD and Pod files. Unlike standalone `.script` files that use export patterns, embedded scripts don't have formal exports. This rule identifies function variables that are declared but never called anywhere in the script or across related script sections in the same file.

**Note:** This rule is separate from `ScriptDeadCodeRule`, which validates export patterns in standalone `.script` files. Use `ScriptDeadCodeRule` for `.script` files and `ScriptUnusedFunctionRule` for embedded scripts in PMD/Pod files.

**Example violations:**

```javascript
// In myPage.pmd
<%
  const processData = function(data) {  // ✅ Used below
    return data.filter(item => item.active);
  };
  
  const unusedHelper = function(val) {  // ❌ Never called - unused function
    return val * 2;
  };
  
  const results = processData(pageVariables.items);
%>
```

**Fix:**

```javascript
// In myPage.pmd
<%
  const processData = function(data) {  // ✅ Used
    return data.filter(item => item.active);
  };
  
  // ✅ Removed unusedHelper - it was never called
  
  const results = processData(pageVariables.items);
%>
```

**Recommendation:** Remove unused functions from PMD/Pod embedded scripts. If a function is not called anywhere in the file, it should be removed to reduce code complexity and improve maintainability.

### ScriptUnusedFunctionParametersRule

**ADVICE.**

Unused parameters make function signatures misleading - callers think they need to pass values that are actually ignored. This wastes developer time figuring out what to pass and creates confusion about the function's actual requirements. Removing unused parameters clarifies the API and prevents wasted effort.

**Example violations:**

```javascript
function processUser(user, preferences) { // ❌ preferences unused
    return user.name;
}
```

**Fix:**

```javascript
function processUser(user) { // ✅ Only used parameters
    return user.name;
}
```

**Recommendation:** Remove unused parameters from function signatures. This clarifies the function's actual requirements and prevents confusion for callers.

### ScriptUnusedIncludesRule

**ADVICE, one-click fix.**

Including unused script files forces the engine to parse and load code that's never executed, directly impacting page load time. Each unnecessary include adds to your application's bundle size and slows down the initial page render. Removing unused includes makes pages load faster and removes potential developer confusion as to why the script is being included in the first place.

**Example violations:**

```javascript
// In sample.pmd
{
  "include": ["util.script", "helper.script"], // ❌ helper.script never called
  "onLoad": "<%
    pageVariables.winningNumbers = util.getFutureWinningLottoNumbers(); // Only util.script is used
  %>"
}
```

**Fix:**

```javascript
// In sample.pmd
{
  "include": ["util.script"], // ✅ Only include scripts that are actually used
  "onLoad": "<%
    pageVariables.winningNumbers = util.getFutureWinningLottoNumbers();
  %>"
}
```

**Recommendation:** Remove unused script includes from PMD files. Only include script files that are actually called via `script.function()` patterns. This improves page load time and reduces bundle size.

### ScriptDeadCodeRule

**ADVICE.**

Dead code in standalone script files increases your application's bundle size and memory footprint, making pages load slower. Every unused function or constant is still parsed and loaded, wasting resources. Removing dead code keeps your application lean and makes it easier for other developers to understand what's actually being used.

This rule validates the export pattern specific to standalone `.script` files. Standalone script files use an export object literal at the end to expose functions and constants. This rule checks that ALL declared top-level variables (functions, strings, numbers, objects, etc.) are either:

1. Exported in the final object literal, OR
2. Used internally by other code in the file

**Intent:** Ensure standalone script files follow proper export patterns and don't contain unused declarations that increase bundle size.

**Example violations:**

```javascript
// In util.script
const getCurrentTime = function() { return date:now(); };
const unusedHelper = function() { return "unused"; };    // ❌ Dead code - not exported or used
const apiUrl = "https://api.example.com";  // ❌ Dead code - constant not exported or used

{
  "getCurrentTime": getCurrentTime  // ❌ unusedHelper and API_KEY are dead code
}
```

**Fix:**

```javascript
// In util.script
const getCurrentTime = function() { return date:now(); };
const helperFunction = function() { return "helper"; };    // ✅ Will be exported
const apiUrl = "https://api.example.com";  // ✅ Will be exported

{
  "getCurrentTime": getCurrentTime,
  "helperFunction": helperFunction,
  "apiUrl": apiUrl  // ✅ All declarations are exported
}
```

**Example with internal usage:**

```javascript
// In util.script
const cacheTtl = 3600;  // ✅ Used internally (not exported)
const getCurrentTime = function() { 
  return { "time": date:now(), "ttl": cacheTtl };  // Uses cacheTtl
};

{
  "getCurrentTime": getCurrentTime  // ✅ cacheTtl is used internally
}
```

**Recommendation:** Ensure all top-level variables in standalone script files are either exported in the final object literal or used internally by other code. Remove any unused declarations to reduce bundle size and improve code clarity.

### ScriptEmptyFunctionRule

**ADVICE.**

Empty functions are usually placeholder code that was never implemented or handlers that were meant to do something but don't. They add confusion (developers wonder if they're intentional), increase code size unnecessarily (which have hard limits!), and can mask missing functionality. Either implement them or remove them to keep your codebase clean and intentional.

**Example violations:**

```javascript
function processData(data) {
    // ❌ Empty function body
}

const handler = function() { }; // ❌ Empty function
```

**Fix:**

```javascript
function processData(data) {
    // ✅ Implement the function or remove it
    return data.map(item => item.value);
}

// ✅ Or remove if not needed
```

**Recommendation:** Implement empty functions with actual logic or remove them entirely. Empty functions add confusion and unnecessary code size.

### ScriptMagicNumberRule

**ADVICE.**

Magic numbers (like `if (price > 1000)` or `return value * 0.15`) hide meaning and make code harder to maintain. When the number appears in multiple places, updating it requires finding every occurrence, risking missed updates. Named constants (`const premiumThreshold = 1000`) make the purpose clear and provide a single source of truth for values that might need to change.

**Example violations:**

```javascript
function calculateDiscount(price) {
    if (price > 1000) {        // ❌ Magic number
        return price * 0.15;   // ❌ Magic number
    }
    return price * 0.05;       // ❌ Magic number
}
```

**Fix:**

```javascript
const premiumThreshold = 1000;
const premiumDiscount = 0.15;
const standardDiscount = 0.05;

function calculateDiscount(price) {
    if (price > premiumThreshold) {
        return price * premiumDiscount;
    }
    return price * standardDiscount;
}
```

**Recommendation:** Replace magic numbers with named constants that clearly express their purpose. This makes code more maintainable and provides a single source of truth for values that might need to change.

### ScriptComplexityRule

**ADVICE.**

Cyclomatic complexity measures the number of independent paths through your code (every *if*, *else*, *loop*, etc. adds to it). High complexity (default threshold: 10, configurable) means your function has too many decision points, making it exponentially harder to test all scenarios and increasing the chance of bugs. Breaking complex functions into smaller, focused ones makes testing easier and reduces defects.

**🧙‍♂️ Wizard's Note:** This rule currently evaluates **either** individual functions **or** procedural script blocks, but not both mixed together. If your script has inline function declarations, only those functions are checked; the procedural code between functions is not separately analyzed for complexity.

**Example violations:**

```javascript
const processOrder = function(order) {
    // Function starts with score of 1 as base

    const highValueMin = 1000;
    const discountMin = 500;
    const vipYearMin = 5

    // Decision point +1: if
    if (order.type == 'premium') {
        // Decision point +1: if
        if (order.amount > highValueMin) {
            // Decision point +1: if
            if (order.customer.vip) {
                // Decision point +1: if
                if (order.customer.loyaltyYears > vipYearMin) {
                    applyVIPDiscount();
                }
            }
            // Decision point +1: if
            if (order.shippingAddress.country == 'US') {
                applyDomesticShipping();
            }
        // Decision point +1: else if
        } else if (order.amount > discountMin) {
            applyStandardDiscount();
        }
    // Decision point +1: else if
    } else if (order.type == 'standard') {
        // Decision point +1: for
        for (var i = 0; i < order.items.length; i++) {
            // Decision point +1: if
            if (order.items[i].category == 'electronics') {
                // Decision point +1: if
                if (order.items[i].warrantyRequired) {
                    addWarranty(order.items[i]);
                }
            // Decision point +1: else if (EXCEEDS THRESHOLD)
            } else if (order.items[i].category == 'clothing') {
                applyClothingTax();
            }
        }
    }
    // Cyclomatic Complexity: 12 (exceeds default threshold of 10)
}
```

**Fix:**

Break the function into smaller, focused functions:

```javascript
const processOrder = function(order) {
    if (order.type == 'premium') {
        processPremiumOrder(order);
    } else if (order.type == 'standard') {
        processStandardOrder(order);
    }
    // Complexity: 3 ✅
}

const processPremiumOrder = function(order) {
    const highValueMin = 1000;
    const discountMin = 500;

    if (order.amount > maxAmount) {
        processHighValueOrder(order);
    } else if (order.amount > discountMin) {
        applyStandardDiscount();
    }
    // Complexity: 3 ✅
}

const processHighValueOrder = function(order) {
    if (order.customer.vip && order.customer.loyaltyYears > 5) {
        applyVIPDiscount();
    }
    if (order.shippingAddress.country == 'US') {
        applyDomesticShipping();
    }
    // Complexity: 4 ✅
}

const processStandardOrder = function(order) {
    order.items.forEach(item => {
      processOrderItem(item);
    })
    // Complexity: 1 ✅
}

const processOrderItem = function(item) {
    if (item.category == 'electronics' && item.warrantyRequired) {
        addWarranty(item);
    } else if (item.category == 'clothing') {
        applyClothingTax();
    }
    // Complexity: 4 ✅
}
```

**Recommendation:** Break complex functions into smaller, focused functions with fewer decision points. Each function should handle a single responsibility, making the code easier to test and maintain. Aim for cyclomatic complexity below the configured threshold (default: 10). You can adjust the threshold in your rule configuration if your team has different complexity standards.

### ScriptNestingLevelRule

**ADVICE.**

Deep nesting (more than 4 levels of if/for/while statements) makes code exponentially harder to read, test, and debug. Each nesting level adds cognitive load, making it difficult to track which conditions are active and increasing the likelihood of logic errors. Flattening nested code through early returns or extracted functions dramatically improves maintainability.

**Example violations:**

```javascript
function processData(data) {
    if (!empty data) { // Level 1
        if (data.isValid) { // Level 2
            if (data.hasContent) { // Level 3
                if (data.content.size() > 0) { // Level 4
                    if (data.content[0].isActive) { // Level 5 ❌ Too deep!
                        return data.content[0];
                    }
                }
            }
        }
    }
}
```

**Fix:**

```javascript
function processData(data) {
    if (empty data.content || !data.isValid || !data.hasContent) {
        return null;
    }

    return data.content[0].isActive ? data.content[0] : null;
}
```

**Recommendation:** Flatten nested code by using early returns, extracting functions, or combining conditions. Keep nesting levels to 4 or fewer to improve readability and maintainability.

### ScriptLongFunctionRule

**ADVICE.**

Functions longer than 50 lines typically violate the single responsibility principle - they're doing too many things. Long functions are harder to understand, test, and reuse, and they often hide bugs in the complexity. Breaking them into smaller, focused functions with clear names makes code self-documenting and easier to maintain.

**Example violations:**

```pmd
const processLargeDataset = function(data) {
    // ... 60 lines of code ...
    // This function is doing too many things
};
```

**Fix:**

```pmd
const processLargeDataset = function(data) {
    const validated = validateData(data);
    const processed = transformData(validated);
    return formatOutput(processed);
};

const validateData = function(data) {
    // ... validation logic ...
};

const transformData = function(data) {
    // ... transformation logic ...
};

const formatOutput = function(data) {
    // ... formatting logic ...
};
```

**Recommendation:** Break long functions into smaller, focused functions with clear names. Each function should have a single responsibility, making the code easier to understand, test, and maintain.

### ScriptLongBlockRule

**ADVICE.**

Embedded script blocks (in event handlers like onLoad, onChange, onSend, or widget properties) should be kept small and focused. When these blocks grow beyond 30 lines, they become difficult to read, test, and maintain. Long embedded blocks often contain complex logic that should be extracted into reusable functions in the `script` section (or `.script` files in the case of functionality that could be shared across pages).

This rule enforces the principle that embedded blocks should contain only simple, focused logic while complex operations belong in dedicated functions.

**Example violations:**

```pmd
// In onLoad field
<%
    const workerData = getWorkerData();
    const processedData = processWorkerData(workerData);
    const validationResults = validateWorkerData(processedData);
    const formattedData = formatWorkerData(validationResults);
    const enrichedData = enrichWorkerData(formattedData);
    const finalData = applyBusinessRules(enrichedData);
    const displayData = prepareDisplayData(finalData);
    const summaryData = generateSummary(displayData);
    const reportData = createReport(summaryData);
    const exportData = prepareExport(reportData);
    const notificationData = prepareNotifications(exportData);
    const auditData = createAuditTrail(notificationData);
    const cacheData = prepareCache(auditData);
    const responseData = formatResponse(cacheData);
    // ... 20+ more lines of data processing ...
    pageVariables.workerData = responseData;
%>
```

**Fix:**

```pmd
// Break into focused functions
<%
    const workerData = getWorkerData();
    const processedData = processWorkerData(workerData);
    pageVariables.workerData = processedData;
%>

// Define functions in script section
const processWorkerData = function(rawData) {
    const validated = validateWorkerData(rawData);
    const formatted = formatWorkerData(validated);
    const enriched = enrichWorkerData(formatted);
    return enriched;
};

const validateWorkerData = function(data) {
    // ... focused validation logic
    return data;
};

const formatWorkerData = function(data) {
    // ... focused formatting logic
    return data;
};
```

**Recommendation:** Extract complex logic from embedded script blocks into focused functions in the `script` section or `.script` files. Keep embedded blocks small and focused, containing only simple, direct logic.

### ScriptFunctionParameterCountRule

**ADVICE.**

Functions with more than 4 parameters can lead to bugs when arguments are passed in the wrong order. Refactoring to use parameter objects or breaking into smaller functions makes your code clearer and less error-prone.

**Example violations:**

```javascript
function createUser(name, email, phone, address, age, department) { // ❌ 6 parameters
    // ... function body
}
```

**Fix:**

```javascript
// Break into smaller functions
function createUser(personalInfo, contactInfo, workInfo) { // ✅ 3 logical groups
    // ... function body
}
```

**Recommendation:** Refactor functions with more than 4 parameters to use parameter objects or break them into smaller, focused functions. This reduces the chance of passing arguments in the wrong order and makes the code clearer.

### ScriptFunctionReturnConsistencyRule

**ADVICE.**

Functions with inconsistent returns (some code paths return a value, others return nothing) cause subtle bugs where callers receive `null` unexpectedly. This leads to null reference errors downstream or incorrect conditional logic. Ensuring all code paths explicitly return (even if explicitly `null`) makes function behavior predictable and prevents runtime errors. This rule also recognizes valid guard clause patterns where early returns handle error conditions while the main logic continues.

**Note:** Nested functions are analyzed independently - each function's return consistency is evaluated separately. Guard clause patterns are recognized as valid - when `else` branches return early for error handling while `if` branches continue with main logic.

**Example violations:**

```pmd
// Missing return statement
const processUser = function(user) {
    if (user.active) {
        return user.name;
    }
    // ❌ Missing return statement
};

// Inconsistent return pattern
const calculateDiscount = function(price) {
    if (price > 1000) {
        return price * 0.15;  // Returns value
    } else {
        console.log("Standard price");  // ❌ No return
    }
    return price * 0.05;  // Final return
};

// Unreachable code
const getValue = function(data) {
    if (empty data) {
        return null;
    }
    return data.value;
    console.log("This never executes");  // ❌ Unreachable
};
```

**Valid patterns:**

```pmd
// Guard clause pattern (✅ Valid)
const processData = function(data) {
    if (empty data) {
        return null;  // Early return for error
    }
  
    // Main logic continues
    const processed = data.map(item => item.value);
    return processed;  // Final return
};

// Consistent returns (✅ Valid)
const processUser = function(user) {
    if (user.active) {
        return user.name;
    }
    return null;  // ✅ Explicit return
};
```

**Recommendation:** Ensure all code paths in functions explicitly return a value (or `null`). Use guard clauses for early error returns, but ensure the main logic path also returns. Remove unreachable code after return statements.

### ScriptArrayMethodUsageRule

**ADVICE.**

Array methods like map, filter, and forEach are more concise, less error-prone (no off-by-one errors), and communicate intent better than manual for-loops. They're also harder to get wrong since you don't manage the loop index yourself. Modern array methods make code more readable and reduce bugs related to loop boundaries or index manipulation.

**Example violations:**

```javascript
const results = [];
for (let i = 0; i < items.length; i++) {  // ❌ Manual loop
    if (items[i].active) {
        results.add(items[i].name);
    }
}
```

**Fix:**

```javascript
const results = items
    .filter(item => item.active)     // ✅ Array higher-order methods
    .map(item => item.name);
```

**Recommendation:** Replace manual for-loops with array higher-order methods (map, filter, forEach) to improve code readability, reduce errors, and communicate intent more clearly.

### ScriptNestedArraySearchRule

**ADVICE.**

Nested array searches (like `workers.map(worker => orgData.find(org => org.id == worker.orgId))`) create O(n²) performance problems that can cause out-of-memory issues with large datasets. For every item in the outer array, the inner array is searched completely, leading to exponential performance degradation. This pattern is especially problematic in Workday Extend where data arrays can contain thousands of records.

**Example violations:**

```javascript
// ❌ Nested search - searches entire orgData for each worker
const result = workers.map(worker => 
    orgData.find(org => org.id == worker.orgId)
);

// ❌ Nested filter - filters entire teams array for each department
departments.forEach(department => {
    const team = teams.filter(team => team.deptId == department.id);
});
```

**Fix:**

```javascript
// ✅ Use list:toMap for efficient O(1) lookups
const orgById = list:toMap(orgData, 'id');
const result = workers.map(worker => orgById[worker.orgId]);

// ✅ Or use a single filter with proper indexing
const teamByDeptId = list:toMap(teams, 'deptId');
departments.forEach(department => {
    const team = teamByDeptId[department.id];
});
```

**Recommendation:** Use `list:toMap()` to convert arrays to maps for O(1) lookups instead of nested searches. This dramatically improves performance, especially with large datasets.

### ScriptOnSendSelfDataRule

**ADVICE.**

Using `self.data` as temporary storage in onSend scripts is an anti-pattern that obscures intent and pollutes the `self` reference with unnecessary properties. When developers write patterns like `self.data = {:}` followed by building up that object and returning it, they're using the endpoint's `self` reference as a temporary variable holder instead of using proper local variables.

**This makes code harder to understand** because readers must determine whether `self.data` contains important endpoint state or is just temporary storage. It also makes testing and debugging more difficult since the `self` object is being mutated unnecessarily.

**What This Rule Does:** This rule detects when `self.data` is **assigned a new object** (empty or populated) in outbound endpoint onSend scripts. This pattern indicates the developer is using `self.data` as temporary storage. Property assignments to existing data like `self.data.foo = 'bar'` are allowed (for cases where data comes from valueOutBinding).

**Note:** This rule only applies to **outbound** endpoints. Inbound endpoints are not checked.

**Example violations:**

```javascript
// ❌ Anti-pattern - Using self.data as temporary storage
{
  "outboundEndpoints": [{
    "name": "sendData",
    "onSend": "<%
      self.data = {:};  // Pollutes self reference
      self.data.foo = 'bar';
      self.data.baz = computeValue();
      return self.data;  // Returns temporary storage
    %>"
  }]
}
```

**Fix:**

```javascript
// ✅ Good - Use local variable for clarity
{
  "outboundEndpoints": [{
    "name": "sendData",
    "onSend": "<%
      let postData = {:};  // Clear intent: local temporary variable
      postData.name = 'John';
      postData.age = 30;
      postData.computed = computeValue();
      return postData;  // Return the local variable
    %>"
  }]
}
```

**Recommendation:** Use local variables instead of `self.data` for temporary storage in onSend scripts. This makes code clearer and prevents polluting the `self` reference. Property assignments to existing `self.data` (from valueOutBinding) are allowed.

### ScriptDescriptiveParameterRule

**ADVICE.**

Single-letter parameters in array methods (`x => x.active`) hide information about what is being processed, making code harder to scan and understand at a glance. Descriptive names (`user => user.active`) self-document the code and prevent confusion in nested method chains where multiple single-letter variables could refer to different things.

**Special Cases:**
- **Sort methods:** `a`, `b` are allowed for comparison parameters
- **Reduce methods:** Suggests `acc` for accumulator, contextual names for items
- **Minimally context-aware:** Suggests `user` for `users.map()`, `team` for `teams.filter()`, etc.

**Example violations:**

```javascript
// ❌ Confusing single-letter parameters
const activeUsers = users.filter(x => x.active);
const userNames = users.map(u => u.name);
```

**Fix:**

```javascript
// ✅ Descriptive parameter names
const activeUsers = users.filter(user => user.active);
const userNames = users.map(user => user.name);

// ✅ Clear chained array methods
const result = departments
    .map(dept => dept.teams)
    .filter(team => team.active);

// ✅ Descriptive reduce parameters
const total = numbers.reduce((acc, num) => {acc + num});
```

**Recommendation:** Use descriptive parameter names in array methods instead of single letters. This makes code self-documenting and prevents confusion, especially in nested method chains.

### EmbeddedImagesRule

**ADVICE.**

Base64-encoded images bloat your PMD/Pod file sizes dramatically (often 30% larger than the image itself) and make files harder to version control since small image changes create large text diffs. External images load faster, cache better, and keep your code files focused on logic. This significantly improves page load performance and makes code reviews manageable.

**Example violations:**

```json
{
  "type": "image",
  "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." // ❌ Embedded image
}
```

**Fix:**

```json
{
  "type": "image", 
  "url": "http://example.com/images/logo.png" // ✅ External image file
}
```

**Recommendation:** Store images as external files and reference them by URL instead of embedding base64-encoded data. This reduces file size, improves page load performance, and makes version control more manageable.

## Naming and layout

Consistency is what lets a reader move between examples without re-learning each one.

### FileNameLowerCamelCaseRule

**ADVICE.**

LowerCamelCase is the Workday Extend standard, and following it ensures files are organized predictably, keeping your code looking professional.

**Example violations:**

```json
MyPage.pmd          // ❌ PascalCase
my_page.pmd         // ❌ snake_case
MY_PAGE.pmd         // ❌ UPPER_SNAKE_CASE
```

**Fix:**

```json
myPage.pmd          // ✅ lowerCamelCase
helperFunctions.script  // ✅ lowerCamelCase
```

**Recommendation:** Use lowerCamelCase for all file names to follow Workday Extend standards and maintain a professional, consistent codebase.

### EndpointNameLowerCamelCaseRule

**ADVICE.**

LowerCamelCase is the Workday Extend standard for endpoint names. Following the convention improves team collaboration and makes code more professional.

**Example violations:**

```json
{
  "endPoints": [
    {
      "name": "get_user_data"  // ❌ snake_case
    }, 
    {
      "name": "GetUserProfile" // ❌ PascalCase
    }
  ]
}
```

**Fix:**

```json
{
  "endPoints": [
    {
      "name": "getUserData"    // ✅ lowerCamelCase
    }, 
    {
      "name": "getUserProfile" // ✅ lowerCamelCase
    }
  ]
}
```

**Recommendation:** Use lowerCamelCase for all endpoint names to follow Workday Extend standards and improve code consistency.

### WidgetIdLowerCamelCaseRule

**ADVICE.**

LowerCamelCase is the Workday standard, and following it means your code will be consisten across pages AND applications. Mixing conventions (snake_case, PascalCase) forces constant reference checking and slows development.

**Example violations:**

```json
{
  "type": "richText",
  "id": "WelcomeMessage"  // ❌ Should be lowerCamelCase
}
```

**Fix:**

```json
{
  "type": "richText",
  "id": "welcomeMessage"  // ✅ Proper lowerCamelCase
}
```

**Recommendation:** Use lowerCamelCase for all widget IDs to follow Workday standards and ensure consistency across pages and applications.

### ScriptVariableNamingRule

**ADVICE.**

Consistent naming conventions make code easier to read and reduce cognitive load when switching between files or team members' code. lowerCamelCase is the standard for variables. Consistency enables faster comprehension and fewer mistakes.

**Example violations:**

```javascript
const user_name = "John";     // ❌ snake_case
const UserAge = 25;           // ❌ PascalCase
const user-email = "email";   // ❌ kebab-case
```

**Fix:**

```javascript
const userName = "John";      // ✅ lowerCamelCase
const userAge = 25;           // ✅ lowerCamelCase
const userEmail = "email";    // ✅ lowerCamelCase
```

**Recommendation:** Use lowerCamelCase for all variable names to maintain consistency and improve code readability.

### ScriptFunctionParameterNamingRule

**ADVICE.**

Parameter names are the first thing developers see when calling your functions. Inconsistent naming (like snake_case parameters when everything else uses lowerCamelCase) forces mental translation and slows comprehension. Following the same convention for parameters as variables creates a seamless reading experience and makes function signatures immediately understandable.

**Example violations:**

```javascript
// ❌ Non-lowerCamelCase parameters
const validateUser = function(user_id, user_name, is_active) {
    return user_id && user_name && is_active;
};

const processData = function(data_source) {
    return data_source.map(item => item.process());
};
```

**Fix:**

```javascript
// ✅ lowerCamelCase parameters
const validateUser = function(userId, userName, isActive) {
    return userId && userName && isActive;
};

const processData = function(dataSource) {
    return dataSource.map(item => item.process());
};
```

**Recommendation:** Use lowerCamelCase for all function parameters to match variable naming conventions and improve code readability.

### PMDSectionOrderingRule

**ADVICE.**

Consistent section ordering across PMD files makes them easier to navigate and review. When every file follows the same structure, developers can quickly find what they're looking for (endpoints, scripts, presentation) without scanning the entire file. This is especially helpful when reviewing code or onboarding new team members who need to understand unfamiliar pages.

**Default Section Order:**
1. `id`
2. `securityDomains`
3. `include`
4. `script`
5. `endPoints`
6. `onSubmit`
7. `outboundData`
8. `onLoad`
9. `presentation`

**Example violations:**

```json
{
  "presentation": { },     // ❌ presentation should come last
  "id": "myAppPage",
  "script": "<%  %>",
  "include": ["util.script"]
}
```

**Fix:**

```json
{
  "id": "myAppPage",         // ✅ Proper order
  "include": ["util.script"],
  "script": "<%  %>",
  "presentation": { }
}
```

**Recommendation:** Follow the standard PMD section ordering to improve code readability and make files easier to navigate. The order can be customized via configuration if needed.

### FooterPodRequiredRule

**ADVICE.**

Using pods for footers promotes component reuse and consistency across your application. Pods are designed to be reusable components, and structuring footers as pods makes them easier to maintain centrally and update across multiple pages. For many applications, developers include an image for the footer. Being able to change the values for this across all pages at once reduces risk when making updates, easing the maintenance for developers.

**Smart Exclusions:**
Pages with tabs, hub pages, and microConclusion pages are excluded from this requirement.

**Example violations:**

```json
{
  "presentation": {
    "footer": {
      "type": "footer",
      "children": [
        {
          "type": "richText",  // ❌ Should be pod
          "id": "footerText"
        }
      ]
    }
  }
}
```

**Fix:**

```json
{
  "presentation": {
    "footer": {
      "type": "footer",
      "children": [
        {
          "type": "pod",  // ✅ Using pod structure
          "podId": "footer"
        }
      ]
    }
  }
}
```

**Recommendation:** Use pod structure for footers to enable component reuse and centralized maintenance. This makes it easier to update footer content across all pages at once.

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

**ACTION.**

Security domains control access to orchestrations. Sync and Async orchestrations must define a security domain.

Orchestration 'myFlow' is missing required securityDomain (Sync/Async only). Business Process and Integration flows are not checked.

**Recommendation:** Add a security domain to Sync and Async orchestrations.

### OrchestrationGlobalErrorHandlerRule

**ADVICE.** Arcane rates this ACTION; this hub lowers it to ADVICE because error-handler scaffolding is not always the lesson a minimal orchestration example teaches.

A global error handler is required in case an uncaught error occurs or a local error handler propagates the error; it must contain a log step (or Add Integration Message step for Integration templates) to record the failure.

Orchestration 'myFlow' must define a global error handler with at least one Log step (or Add Integration Message for Integration templates). Suborchestrations are not checked.

**Recommendation:** Add a global error handler and include a Log step (or Add Integration Message step for Integration templates) inside it.

### OrchestrationApiStepErrorHandlerRule

**ADVICE.** Arcane rates this ACTION; this hub lowers it to ADVICE for the same reason as the global handler rule.

API steps can fail due to network or transient errors; a local error handler with a log step (or Add Integration Message for Integration templates) allows the flow to record and handle failures explicitly.

API step 'SendHTTPRequest' must have a local error handler containing a Log step (or Add Integration Message for Integration templates).

**Recommendation:** Add a local error handler to each API step and include a Log step (or Add Integration Message step for Integration templates) inside it.

### OrchestrationBranchOnConditionsNestingRule

**ADVICE.**

Deeply nested Branch on Conditions make flows hard to follow; keeping nesting to 3 levels and extracting logic to a suborchestration improves clarity.

Branch on Conditions 'MyBoC' has a branch nested at 5 levels; consider extracting logic to a suborchestration to keep nesting to 3 levels or fewer.

**Recommendation:** Extract logic to a suborchestration to keep Branch on Conditions nesting to 3 levels or fewer.

### OrchestratePreferExplicitDefaultAccessor

**ADVICE.**

Some Orchestrate accessor functions throw an exception when a value is not found. Prefer the default-capable functions so missing values are handled explicitly.

Use stringAtJsonPathWithDefault or stringAtJsonPathOrEmptyString instead of stringAtJsonPath; use numberAtXPathWithDefault instead of numberAtXPath. etc.

**Recommendation:** Replace the reported function with the suggested alternative and supply an explicit default.

### OrchestrationVerboseBooleanCheckRule

**ADVICE.**

This value is created using a Conditional wrapper that returns `true` or `false`. The condition itself already evaluates to a Boolean value, so the Conditional step is unnecessary.

Example: A value configured as a Conditional where the result is `true` if the conditions are met and `false` otherwise. The conditions themselves already evaluate to a Boolean value. This is redundant and can be removed.

**Recommendation:** Remove the Conditional wrapper and use the Boolean condition directly in the step. The condition already evaluates to `true` or `false`, so the extra Conditional step is not needed.

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
