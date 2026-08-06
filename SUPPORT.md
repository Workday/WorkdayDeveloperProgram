# Support

This repository is maintained by the Workday DevRel team to provide educational examples. It is not an officially supported Workday product.

That distinction matters for where you take a problem. If something is wrong with your Workday tenant or a Workday product you run in production, go through your normal Workday Support channels. Nothing in this repository can open, escalate, or resolve a Workday support case.

## Getting help

- **Questions and ideas**: open a [discussion](https://github.com/Workday/WorkdayDeveloperProgram/discussions) or start a thread on the [Workday community forum](https://forum.developer.workday.com).
- **A broken example**: open an [issue](https://github.com/Workday/WorkdayDeveloperProgram/issues) with the bug report template. Name the entry's folder and include what you ran and what happened.
- **A new example proposal**: open an issue with the proposal template before you build, if you want early feedback.

## Support policy

Every entry in the hub carries a **Workday** or **Community** badge in the gallery, driven by the `source` field in its `example.json`. That badge decides what happens when an entry breaks.

### Workday entries

Everything under `catalog/`, plus any example marked `"source": "workday"`, is maintained by Workday DevRel. If you report that one of these is broken, we will acknowledge the issue and fix the entry as quickly as we reasonably can.

### Community entries

Community examples belong to their contributors, and we keep them healthy together:

1. When a report shows a community example is broken, we open a GitHub issue (or confirm yours) and tag the contributor listed in the entry's `authors` field.
2. The contributor gets a reasonable window to land a fix, and we are happy to help along the way.
3. If no fix lands, we may remove the entry from the hub in a pull request. Git history preserves everything that was ever merged, so nothing is lost, and a fixed version is welcome back any time.

## Licensing

Everything in this repository, including all contributions to it, is licensed under the [Apache License 2.0](LICENSE).

## No warranty

Examples are educational starting points, provided as is, without warranty of any kind. See [Use at your own pace, verify everything](README.md#use-at-your-own-pace-verify-everything) and the [LICENSE](LICENSE) for details, and always test in a non-production tenant first.
