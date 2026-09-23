// Text that ties a downloaded example back to the repository. Used by the
// detail page (sparse checkout snippet) and by scripts/build-zips.mjs
// (SOURCE.md inside every zip). Plain JavaScript on purpose: no Vite or
// Astro imports, so the build script can load it under Node directly.

// example: { id, path } where path is "catalog/<id>" or "examples/<id>"
// hub: hub.config.json (repo, repoUrl, defaultBranch, pagesUrl)
export function sparseCheckout(example, hub) {
  return [
    `git clone --filter=blob:none --sparse ${hub.repoUrl}.git`,
    `cd ${hub.repo}`,
    `git sparse-checkout set ${example.path}`
  ].join("\n");
}

export function sourceMarkdown(example, hub, { sha, date }) {
  const known = sha && sha !== "unknown";
  const ref = known ? sha : hub.defaultBranch;
  const folderUrl = `${hub.repoUrl}/tree/${ref}/${example.path}`;
  const hubUrl = `${hub.pagesUrl.replace(/\/$/, "")}/${example.path}/`;
  const contributeUrl = `${hub.repoUrl}/blob/${hub.defaultBranch}/CONTRIBUTING.md`;

  return `# Source

This folder was downloaded from the Workday Examples Hub. It is a snapshot of
one folder in a git repository, so you can always find the latest version and
send changes back.

| | |
| --- | --- |
| Repository | ${hub.repoUrl} |
| Folder | \`${example.path}\` |
| Commit | ${known ? `\`${sha}\`` : "unknown (local build)"} |
| Built | ${date} |
| Browse this snapshot | ${folderUrl} |
| Hub page | ${hubUrl} |

## Get the latest version

Download the zip again from the hub page above, or check out only this folder
with git:

\`\`\`bash
${sparseCheckout(example, hub)}
\`\`\`

## Contribute a change back

1. Fork ${hub.repoUrl} on GitHub and run the sparse checkout above against
   your fork.
2. Copy your edited files over \`${example.path}/\` in that checkout.
3. Commit, push to your fork, and open a pull request. The contribution guide
   is at ${contributeUrl}.
`;
}
