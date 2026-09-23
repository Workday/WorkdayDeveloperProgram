# Arcane Auditor configuration

This folder configures the example audit that runs on every pull request
(`.github/workflows/audit-examples.yml`) and locally through
`node scripts/audit-examples.mjs`.

| File | Purpose |
| --- | --- |
| `config.json` | Rule configuration for [Arcane Auditor](https://github.com/Developers-and-Dragons/ArcaneAuditor). Generated with `ArcaneAuditorCLI generate-config`, then adjusted (see below). |
| `action-ref` | The Arcane GitHub Action revision the CI workflow uses, as `owner/repo@ref`. `scripts/install-arcane.sh` reads it so local installs match CI. |
| `bin/` | Local CLI install, gitignored. Created by `scripts/install-arcane.sh`. |

The hub's own rules (folder naming, `example.json`, README sections, period
literals, app reference ids) live in `scripts/audit/hub-rules.mjs`, not here.

## Rule policy

Arcane ships 48 rules in two tiers. ACTION findings fail the audit check,
ADVICE findings are shown as suggestions. `config.json` keeps every rule
enabled and changes three things for a public examples hub:

| Rule | Change | Why |
| --- | --- | --- |
| `HardcodedApplicationIdRule` | ADVICE to ACTION | Examples exist to be copied. A hardcoded app id guarantees the copy breaks, and the fix is mechanical (`site.applicationId`). |
| `OrchestrationGlobalErrorHandlerRule` | ACTION to ADVICE | Error-handler scaffolding is not always the lesson an orchestration example teaches. Worth suggesting, not worth blocking. |
| `OrchestrationApiStepErrorHandlerRule` | ACTION to ADVICE | Same reasoning. |
| `PMDSectionOrderingRule` | fix strategy to `human_review` | Arcane v2.0.0 has no automatic fix payload for this rule; marking it actionable produced empty suggestions. |

Everything else runs at Arcane's default severity. Prefer downgrading a rule
over disabling it, so the best-practices doc can still explain it.

Policy applied on top by `scripts/audit/report.mjs`:

- `catalog/` folders are held to the stricter bar: ADVICE counts as ACTION.
- In a folder that already existed, ACTION findings on lines the PR did not
  touch are downgraded so contributors are only blocked on what they wrote.
- The `audit-override` label, or the repository variable `AUDIT_MODE=advisory`,
  turns the whole check advisory.

## Bumping Arcane

1. Pick the release on the Arcane releases page and note its Linux and macOS
   CLI asset hashes (`sha256sum` the downloads yourself).
2. In the Arcane action repository, add the hashes to
   `.github/action/install.sh` and bump the default `version` in `action.yml`.
   Push, note the commit sha.
3. Update `action-ref` here and the `uses:` line in
   `.github/workflows/audit-examples.yml` to that sha.
4. Regenerate `config.json` if the rule set changed:
   `ArcaneAuditorCLI generate-config -o /tmp/new.json`, diff against the
   current file, and re-apply the overrides above.
5. Re-run the regression check below.

## Regression check

Pull request [#7](https://github.com/Workday/WorkdayDeveloperProgram/pull/7)
(`examples/Promotion_Nomination`) is the reference case: it contains most of
the mistakes the audit exists to catch. To re-run it:

```bash
git fetch origin pull/7/head:pr-7
git worktree add /tmp/pr-7 pr-7
cp -R scripts .arcane-auditor/config.json /tmp/pr-7/   # bring the current audit scripts along
cd /tmp/pr-7 && node scripts/audit-examples.mjs --changed main HEAD
```

Expected with Arcane v2.0.0 and the current hub rules (62 findings, 32
blocking):

Hub rules

- `HubFolderKebabCaseRule`: `Promotion_Nomination`
- `HubExampleJsonRule`: `example.json` missing (hint: rename `app-info.json`), and `app-info.json` line 1 is the literal word `JSON`
- `HubReadmeSectionsRule`: README is raw HTML, none of the four sections
- `HubGitkeepRule`: `model/.gitkeep`, `presentation/.gitkeep`
- `HubHardcodedPeriodLiteralRule`: `"2026-Q1"` in `managerNomination.pmd`
- `HubAppReferenceIdRule`: `promotionNomination_rvylxm` in the `.amd` and `.smd`

Arcane, ACTION

- `HardcodedWorkdayAPIRule`: 3 endpoints across the two PMDs, 5 data providers in the `.amd`
- `HardcodedApplicationIdRule`: the `.amd` data provider and the `submitPromotion` URL
- `EndpointFailOnStatusCodesRule`: 8 endpoints
- `WidgetIdRequiredRule`: 7 widgets
- `ScriptConsoleLogRule`: 2 live `console.info` calls (the commented-out ones do not fire)

Arcane, ADVICE

- `ScriptVarUsageRule` (6), `ScriptStringConcatRule` (8), `EndpointBaseUrlTypeRule` (4), `StringBooleanRule` (2), `PMDSectionOrderingRule` (2), `ScriptComplexityRule` (1), `EndpointNameLowerCamelCaseRule` (1)
- `ArcaneAuditorWarning`: Arcane's script parser gives up on one block in `managerNomination.pmd` (`var responseEmpData =getEmployeeData.invoke(`), so script rules are skipped for that block. That is an upstream grammar gap worth reporting.

Of the actionable findings, the hardcoded URL, console, `var`, and string
boolean ones render as one-click suggestions on the PR. `failOnStatusCodes`
insertions and multi-line string concatenations render as code blocks.
