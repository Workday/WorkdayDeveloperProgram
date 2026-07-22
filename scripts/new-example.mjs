#!/usr/bin/env node
// Creates a new example folder with the two files every example needs.
//
//   node scripts/new-example.mjs my-example-name
//   node scripts/new-example.mjs my-example-name --type "Orchestration" --title "My Example"

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(repoRoot, "hub.config.json"), "utf8"));

const args = process.argv.slice(2);
const name = args[0];

if (!name || name.startsWith("--")) {
  bail('Usage: node scripts/new-example.mjs <folder-name> [--type "Extend App"] [--title "My Example"]');
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
  bail(`Folder names are kebab-case: lowercase letters, numbers, and hyphens. "${name}" is not.`);
}

const type = getFlag("--type") || config.types[0];
if (!config.types.includes(type)) {
  bail(`"${type}" is not an approved type. Pick from: ${config.types.join(", ")}`);
}

const title = getFlag("--title") || titleFromName(name);
const dir = join(repoRoot, "examples", name);

if (existsSync(dir)) {
  bail(`examples/${name} already exists. Pick another name.`);
}

mkdirSync(dir, { recursive: true });

const meta = {
  title,
  description: "One or two sentences about what this example shows.",
  type,
  components: [],
  products: [],
  authors: [],
  tutorial: ""
};
writeFileSync(join(dir, "example.json"), JSON.stringify(meta, null, 2) + "\n");

writeFileSync(
  join(dir, "README.md"),
  `# ${title}

## What it is

One short paragraph: what this example shows and who it is for.

## What's inside

- Bullet the contents of this folder so a reader knows what they are looking at.

## How to use it

The concrete steps to put this example to work: import into App Builder and deploy to your development tenant, import the orchestration, read and adapt the skill, or whatever fits this artifact.
`
);

console.log(`Created examples/${name} (type: ${type})`);
console.log("");
console.log("Next steps:");
console.log(`  1. Drop your artifact into examples/${name}/ (app source, orchestration, skill markdown, diagrams).`);
console.log(`  2. Edit examples/${name}/example.json and README.md.`);
console.log("  3. Run: node scripts/validate-examples.mjs");
console.log("  4. Open a pull request.");

function getFlag(flag) {
  const at = args.indexOf(flag);
  return at === -1 ? "" : args[at + 1] || "";
}

function titleFromName(slug) {
  return slug
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function bail(message) {
  console.error(message);
  process.exit(1);
}
