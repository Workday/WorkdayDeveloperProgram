#!/usr/bin/env node
// Checks every folder in examples/ and keeps the "All examples" table
// in the root README up to date.
//
//   node scripts/validate-examples.mjs          validate and refresh the README table
//   node scripts/validate-examples.mjs --check  validate only, fail if the table is stale (CI)

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const examplesDir = join(repoRoot, "examples");
const readmePath = join(repoRoot, "README.md");
const checkOnly = process.argv.includes("--check");

const config = JSON.parse(readFileSync(join(repoRoot, "hub.config.json"), "utf8"));

const errors = [];
const examples = [];

for (const name of readdirSync(examplesDir).sort()) {
  // _template and dotfiles are not examples
  if (name.startsWith("_") || name.startsWith(".")) continue;
  const dir = join(examplesDir, name);
  if (!statSync(dir).isDirectory()) continue;

  if (!existsSync(join(dir, "README.md"))) {
    errors.push(`${name}: missing README.md`);
  }

  const metaPath = join(dir, "example.json");
  if (!existsSync(metaPath)) {
    errors.push(`${name}: missing example.json`);
    continue;
  }

  let meta;
  try {
    meta = JSON.parse(readFileSync(metaPath, "utf8"));
  } catch (err) {
    errors.push(`${name}/example.json is not valid JSON: ${err.message}`);
    continue;
  }

  if (!meta.title) errors.push(`${name}: example.json needs a "title"`);
  if (!meta.description) errors.push(`${name}: example.json needs a "description"`);

  if (!meta.type) {
    errors.push(`${name}: example.json needs a "type"`);
  } else if (!config.types.includes(meta.type)) {
    errors.push(`${name}: "${meta.type}" is not an approved type. Pick from: ${config.types.join(", ")}`);
  }

  for (const component of asList(meta.components)) {
    if (!config.components.includes(component)) {
      errors.push(`${name}: "${component}" is not an approved component. Pick from: ${config.components.join(", ")}`);
    }
  }

  for (const product of asList(meta.products)) {
    if (!config.products.includes(product)) {
      errors.push(`${name}: "${product}" is not an approved product. Pick from: ${config.products.join(", ")}`);
    }
  }

  if (meta.tutorial && !meta.tutorial.startsWith("https://")) {
    errors.push(`${name}: "tutorial" should be an https link, or left out`);
  }

  examples.push({
    id: name,
    title: meta.title || name,
    description: meta.description || "",
    type: meta.type || ""
  });
}

if (errors.length > 0) {
  console.error("Problems found:\n");
  for (const error of errors) console.error(`  - ${error}`);
  console.error(`\n${errors.length} problem(s). Fix them and re-run.`);
  process.exit(1);
}

examples.sort((a, b) => a.title.localeCompare(b.title));

// Compare the table by content, not formatting, so tools like Prettier
// can reflow it without the check calling it stale.
const readme = readFileSync(readmePath, "utf8");
const expectedRows = examples.map((example) => [
  `[\`${example.id}\`](examples/${example.id})`,
  example.description,
  example.type
]);
const inSync = JSON.stringify(tableRows(readme)) === JSON.stringify(expectedRows);

if (checkOnly) {
  if (!inSync) {
    console.error("README.md example table is out of date. Run: node scripts/validate-examples.mjs");
    process.exit(1);
  }
  console.log(`OK: ${examples.length} example(s) validated, README table in sync.`);
} else if (inSync) {
  console.log(`Validated ${examples.length} example(s), README table already up to date.`);
} else {
  writeFileSync(readmePath, withFreshTable(readme));
  console.log(`Validated ${examples.length} example(s) and updated README.md.`);
}

function asList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value !== "") return [value];
  return [];
}

function tableRows(text) {
  const [startAt, endAt] = markerPositions(text);
  const rows = [];
  for (const line of text.slice(startAt, endAt).split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    const cells = trimmed.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length === 0 || cells[0] === "Example") continue;
    if (/^:?-+:?$/.test(cells[0])) continue;
    rows.push(cells);
  }
  return rows;
}

function markerPositions(text) {
  const start = "<!-- examples:start -->";
  const end = "<!-- examples:end -->";
  const startAt = text.indexOf(start);
  const endAt = text.indexOf(end);
  if (startAt === -1 || endAt === -1) {
    console.error(`README.md is missing the ${start} / ${end} markers.`);
    process.exit(1);
  }
  return [startAt + start.length, endAt];
}

function withFreshTable(text) {
  const [startAt, endAt] = markerPositions(text);
  const rows = examples.map(
    (example) => `| [\`${example.id}\`](examples/${example.id}) | ${example.description} | ${example.type} |`
  );
  const table = ["| Example | Description | Type |", "| --- | --- | --- |", ...rows].join("\n");
  return text.slice(0, startAt) + "\n" + table + "\n" + text.slice(endAt);
}
