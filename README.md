<div align="center">

<img src="https://avatars.githubusercontent.com/u/328102?s=200&v=4" width="96" height="96" alt="Workday" />

# Workday Examples Hub

**A single, open home for Workday Build examples.**

Browse working examples, copy them into your own projects, and contribute your own.

[![PRs welcome](https://img.shields.io/badge/PRs-welcome-2da44e.svg)](CONTRIBUTING.md)
[![Gallery](https://img.shields.io/badge/gallery-browse-0875e1.svg)](https://workday.github.io/Developer-Relations)
[![Maintained by DevRel](https://img.shields.io/badge/maintained%20by-Workday%20DevRel-0875e1.svg)](#community-and-support)

[**Browse the gallery**](https://workday.github.io/Developer-Relations) · [Use an example](#use-an-example) · [Contribute](#contributing)

</div>

---

## What is this?

Workday Build samples used to live in many places: the App Catalog, the docs, the forum. This repository brings them into one place that you can browse, copy from, and add to.

Every example:

- lives in its own folder under [`examples/`](examples) with everything it needs: Extend app source exported from App Builder, orchestration definitions, agent skills written as markdown, diagrams, whatever the artifact is.
- ships with two small files: `example.json` (metadata that drives the index below and the optional gallery) and a README that says what it is and how to use it.
- demonstrates a real Workday capability. Types, components, and products come from the approved lists in [`hub.config.json`](hub.config.json), and CI enforces them.

## Repository layout

```
examples/                Every example is a self-contained folder: open it, read its README
  _template/             Copy this (or run the scaffolder) to start a new example
scripts/
  new-example.mjs        Scaffold a new example folder in one command
  validate-examples.mjs  CI validation + README index generation
site/                    Optional Astro gallery (not required to use the examples)
hub.config.json          Repo URLs and the approved type, component, and product lists
```

## Example types

- 🧩 **[Extend App](https://workday.github.io/Developer-Relations/?type=Extend%20App)**: full app source built in App Builder, ready to import into your development tenant.
- 🔌 **[Integration App](https://workday.github.io/Developer-Relations/?type=Integration%20App)**: orchestration-driven integrations connecting Workday to other systems.
- ⚙️ **[Orchestration](https://workday.github.io/Developer-Relations/?type=Orchestration)**: focused orchestration definitions for Orchestration Builder.
- 🤖 **[Agent Skill](https://workday.github.io/Developer-Relations/?type=Agent%20Skill)**: agent skills and instructions, written as markdown.
- 📄 **[Reference](https://workday.github.io/Developer-Relations/?type=Reference)**: design patterns, diagrams, and other material worth copying.

## Use an example

```bash
git clone https://github.com/Workday/Developer-Relations
cd Developer-Relations/examples
```

Open the folder you want and follow its README. What "use it" means depends on the type:

- **Extend app source**: import the folder into App Builder against your WCP development tenant (or upload the ZIP to App Hub), then deploy, install, and launch.
- **Orchestrations and integration apps**: import into Orchestration Builder and point the credentials at your tenant.
- **Agent skills and reference material**: read, copy, adapt.

## All examples

This table is kept in sync with each example's `example.json` by `scripts/validate-examples.mjs`.

<!-- examples:start -->

| Example                                                                   | Description                                                                                                        | Type          |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------- |
| [`expense-policy-agent-skill`](examples/expense-policy-agent-skill)       | A markdown skill that teaches an agent to answer expense policy questions and escalate anything it cannot verify.  | Agent Skill   |
| [`employee-data-orchestration`](examples/employee-data-orchestration)     | An orchestration that reads worker data from one tenant and creates matching records through the Workday REST API. | Orchestration |
| [`work-from-anywhere-extend-app`](examples/work-from-anywhere-extend-app) | Enable employees to request to work from anywhere, for a manager to approve, and see requests on a calendar view.  | Extend App    |

<!-- examples:end -->

## Contributing

We want your examples, and adding one doesn't take much:

1. Scaffold a folder: `node scripts/new-example.mjs your-example-name`
2. Drop your artifact in, and fill in the generated `example.json` and README.
3. Validate: `node scripts/validate-examples.mjs`
4. Open a pull request. Workday DevRel reviews every submission before merge.

Prefer to do it by hand? No tooling is required. Copy [`examples/_template`](examples/_template) into a new folder (you can even create the files straight from the GitHub web UI), fill in the two files, and open the PR. The index table above can be edited by hand, or a reviewer will regenerate it for you during review.

The full guide is in [CONTRIBUTING.md](CONTRIBUTING.md).

## Browse visually (optional)

The [`site/`](site) folder holds a gallery that renders every example as a card with search and type filters. Nothing in the repo depends on it; the examples are fully usable without it. To run it locally:

```bash
cd site && npm install && npm run dev
```

To publish it, enable GitHub Pages in the repo settings (source: GitHub Actions) once. After that, every merge that touches `examples/`, `site/`, or `hub.config.json` rebuilds and redeploys the gallery automatically, so new examples show up on their own. The "Deploy gallery" workflow can also be run manually from the Actions tab for a one-off redeploy.

## Community and support

- **Questions and ideas**: open a [discussion](https://github.com/Workday/Developer-Relations/discussions) or start a thread on the Workday community forum.
- **Bugs in an example**: open an [issue](https://github.com/Workday/Developer-Relations/issues) using the bug report template.
- **New example proposals**: open an issue with the proposal template before you build, if you want early feedback.

## License

License terms are being finalized. Until a LICENSE file lands in this repository, treat the examples as reference material for building on Workday.
