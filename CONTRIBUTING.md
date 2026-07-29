# Contributing to the Workday Examples Hub

Thanks for helping build the open home for Workday Build examples. Adding an example is deliberately low effort: a folder, two small files, one validation command.

## Ways to contribute

- **Add a new example.** The main event. See below.
- **Improve an existing example.** Clearer READMEs, fixes, and better sample data are all welcome.
- **Report a problem.** Open an issue with the bug report template.
- **Propose an idea.** Open an issue with the proposal template if you want feedback before building.

## Add an example

1. **Fork** this repository and create a branch.
2. **Scaffold the folder.** From the repository root:

   ```bash
   node scripts/new-example.mjs your-example-name --type "Extend App"
   ```

   This creates `examples/your-example-name/` with a prefilled `example.json` and README skeleton. (You can also copy `examples/_template/` by hand.)

3. **Drop your artifact in.** Whatever it is: Extend app source (exported with Local Disk Sync, the WDCLI, or the ZIP download), orchestration definitions, an agent skill as markdown, diagrams. The folder must be self-contained.
4. **Fill in the two files.** `example.json` needs a title, a description, and a type; everything else is optional. The README needs three short sections: What it is, What's inside, How to use it.
5. **Validate.** From the repository root:

   ```bash
   node scripts/validate-examples.mjs
   ```

   This checks your metadata and updates the README index table. Commit the README change with your example; CI runs the same script with `--check`. If you cannot run Node locally, skip this step and see Submitting by hand below.

6. **Open a pull request** and complete the short checklist in the PR template.

## Submitting by hand (no tooling required)

The scaffolder and validator are conveniences, not requirements. The actual contract is just a folder under `examples/` containing your artifact plus `example.json` and `README.md`. To submit without running anything:

1. Copy `examples/_template/` into a new kebab-case folder, or create the files directly in the GitHub web UI in your fork.
2. Fill in `example.json` (the template's README documents every field) and write the three README sections.
3. Add your artifact files to the folder.
4. For the index table in the repository README, either add your row between the `<!-- examples:start -->` and `<!-- examples:end -->` markers by copying the format of an existing row, or leave the table alone and say so in your PR. CI will flag the stale table, and a reviewer will regenerate it for you during review. That is normal and fine.

## Example requirements

- The example lives entirely in its own folder under `examples/`.
- The README says what the artifact is and how to use it (deploy, import, read, or run).
- `example.json` is valid: `type` comes from the `types` list in `hub.config.json`, and any `components` or `products` come from their lists too.
- No credentials, tenant names, or real personal data anywhere in the folder. Sample data must be clearly fictional.

## Examples must be real Workday use cases

This hub only accepts examples that show something Workday can actually do. The approved type, component, and product lists live in `hub.config.json`; if a real Workday capability is missing from them, open an issue and we will add it.

Useful references for what an example artifact looks like:

- [Extend app components](https://developer.workday.com/doc/kwv1612374098305.md): what makes up an Extend app (amd, smd, pmd, business objects, and the rest).
- [Local Disk Sync](https://developer.workday.com/doc/GUID-cbfd55e9-04f9-4480-879a-b63c42729a04-enHYPHENus.md): how to get your app source onto disk for submission.
- [App Builder](https://developer.workday.com/doc/zxh1651687589440.md): one of the ways Extend apps get built. Your own IDE and the WDCLI work too; the hub does not care which tooling produced the artifact.
- Official orchestration walkthroughs, for example [Create Workday Home Card Orchestration](https://developer.workday.com/doc/mwd1629844754304.md) and [Get and Create Workday Employee Data](https://developer.workday.com/doc/mxj1630014392721.md).

## Preview the gallery locally (optional)

The gallery in `site/` is optional; your example is complete without it. To see how your card will look:

```bash
cd site
npm install
npm run dev
```

Then open the local URL Astro prints. The gallery reads every `example.json` directly, so your example appears as soon as the folder exists.

## Review process

Workday DevRel reviews every pull request before merge. We look for:

- **It works.** We follow your README and end up with the example doing what it says.
- **It teaches.** The README explains the why, not just the how.
- **It is safe.** No secrets, no real data, nothing tenant-specific.

We aim to respond within a few business days. Discussions on the PR are part of the process, so expect questions and suggestions rather than a silent merge or close.

Merged examples are labeled in the gallery: **Workday** for examples authored by Workday teams, **Community** for everything else. Community examples are held to works, safe, and honest; Workday-authored ones get a stricter pass because people copy them as reference.
