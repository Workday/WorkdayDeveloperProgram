#!/usr/bin/env node
// Creates a new example folder from examples/_template.
//
//   node scripts/new-example.mjs my-example-name
//   node scripts/new-example.mjs my-example-name --type "Orchestration" --title "My Example"
//
// No Node on your machine? scripts/new-example.sh (macOS, Linux) and
// scripts/new-example.ps1 (Windows) do the same thing.

import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
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

cpSync(join(repoRoot, "examples", "_template"), dir, { recursive: true });

const metaPath = join(dir, "example.json");
const meta = JSON.parse(readFileSync(metaPath, "utf8"));
meta.title = title;
meta.type = type;
writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");

const readmePath = join(dir, "README.md");
const readmeLines = readFileSync(readmePath, "utf8").split("\n");
readmeLines[0] = `# ${title}`;
writeFileSync(readmePath, readmeLines.join("\n"));

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
