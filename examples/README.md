# Examples

The community section, open to everyone. Every folder here is a self-contained example: the artifact plus an `example.json` and a README that says what it is and how to use it.

Add your own in minutes:

- `node scripts/new-example.mjs my-example-name` from the repository root
- No Node? `./scripts/new-example.sh` (macOS, Linux) or `scripts\new-example.ps1` (Windows)
- No tooling at all? Copy [_template/](_template/) by hand, even from the GitHub web UI

Fill in the two generated files, drop your artifact in, and open a pull request. The [contributing guide](../CONTRIBUTING.md) has the details, and Workday DevRel reviews every submission before merge.

Every pull request is audited automatically for the things that make an example hard to reuse: hardcoded Workday URLs and app ids, debug logging, missing error handling, a README without deploy notes. The audit comments on the PR with the fix for each finding. To run it yourself first: `./scripts/install-arcane.sh && node scripts/audit-examples.mjs --changed`. The checks are explained in [docs/EXAMPLE_BEST_PRACTICES.md](../docs/EXAMPLE_BEST_PRACTICES.md).
