#!/usr/bin/env node
// Checks every entry in catalog/ and examples/ and keeps the two tables
// in the root README up to date. Zero dependencies.
//
//   node scripts/validate-examples.mjs          validate and refresh the README tables
//   node scripts/validate-examples.mjs --check  validate only, fail if a table is stale (CI)

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const readmePath = join(repoRoot, "README.md");
const checkOnly = process.argv.includes("--check");

const config = JSON.parse(readFileSync(join(repoRoot, "hub.config.json"), "utf8"));

// catalog/ holds Workday-built apps, examples/ holds community examples.
const sections = [
  { dir: "catalog", markers: "catalog", defaultSource: "workday" },
  { dir: "examples", markers: "examples", defaultSource: "community" }
];

const errors = [];
const entries = [];

for (const section of sections) {
  const sectionDir = join(repoRoot, section.dir);
  if (!existsSync(sectionDir)) continue;

  for (const name of readdirSync(sectionDir).sort()) {
    // _template and dotfiles are not entries
    if (name.startsWith("_") || name.startsWith(".")) continue;
    const dir = join(sectionDir, name);
    if (!statSync(dir).isDirectory()) continue;

    if (!existsSync(join(dir, "README.md"))) {
      errors.push(`${section.dir}/${name}: missing README.md`);
    }

    const metaPath = join(dir, "example.json");
    if (!existsSync(metaPath)) {
      errors.push(`${section.dir}/${name}: missing example.json`);
      continue;
    }

    let meta;
    try {
      meta = JSON.parse(readFileSync(metaPath, "utf8"));
    } catch (err) {
      errors.push(`${section.dir}/${name}/example.json is not valid JSON: ${err.message}`);
      continue;
    }

    if (!meta.title) errors.push(`${section.dir}/${name}: example.json needs a "title"`);
    if (!meta.description) errors.push(`${section.dir}/${name}: example.json needs a "description"`);

    if (!meta.type) {
      errors.push(`${section.dir}/${name}: example.json needs a "type"`);
    } else if (!config.types.includes(meta.type)) {
      errors.push(`${section.dir}/${name}: "${meta.type}" is not an approved type. Pick from: ${config.types.join(", ")}`);
    }

    for (const component of asList(meta.components)) {
      if (!config.components.includes(component)) {
        errors.push(`${section.dir}/${name}: "${component}" is not an approved component. Pick from: ${config.components.join(", ")}`);
      }
    }

    for (const product of asList(meta.products)) {
      if (!config.products.includes(product)) {
        errors.push(`${section.dir}/${name}: "${product}" is not an approved product. Pick from: ${config.products.join(", ")}`);
      }
    }

    if (meta.tutorial && !meta.tutorial.startsWith("https://")) {
      errors.push(`${section.dir}/${name}: "tutorial" should be an https link, or left out`);
    }

    if (meta.source && !["workday", "community"].includes(meta.source)) {
      errors.push(`${section.dir}/${name}: "source" must be "workday" or "community", or left out`);
    }
    if (section.dir === "catalog" && meta.source === "community") {
      errors.push(`catalog/${name}: catalog apps are Workday-maintained, so "source" cannot be "community". Community submissions live in examples/.`);
    }

    entries.push({
      id: name,
      sectionMarkers: section.markers,
      path: `${section.dir}/${name}`,
      title: meta.title || name,
      description: meta.description || "",
      type: meta.type || ""
    });
  }
}

if (errors.length > 0) {
  console.error("Problems found:\n");
  for (const error of errors) console.error(`  - ${error}`);
  console.error(`\n${errors.length} problem(s). Fix them and re-run.`);
  process.exit(1);
}

entries.sort((a, b) => a.title.localeCompare(b.title));

const readme = readFileSync(readmePath, "utf8");

// Compare each table by content, not formatting, so tools like Prettier
// can reflow them without the check calling them stale.
let allInSync = true;
for (const section of sections) {
  const expected = rowsFor(section.markers);
  const current = tableRows(readme, section.markers);
  if (JSON.stringify(current) !== JSON.stringify(expected)) allInSync = false;
}

if (checkOnly) {
  if (!allInSync) {
    console.error("A README table is out of date. Run: node scripts/validate-examples.mjs");
    process.exit(1);
  }
  console.log(`OK: ${entries.length} entr${entries.length === 1 ? "y" : "ies"} validated, README tables in sync.`);
} else if (allInSync) {
  console.log(`Validated ${entries.length} entr${entries.length === 1 ? "y" : "ies"}, README tables already up to date.`);
} else {
  let updated = readme;
  for (const section of sections) {
    updated = withFreshTable(updated, section.markers);
  }
  writeFileSync(readmePath, updated);
  console.log(`Validated ${entries.length} entr${entries.length === 1 ? "y" : "ies"} and updated README.md.`);
}

function asList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value !== "") return [value];
  return [];
}

function rowsFor(markers) {
  return entries
    .filter((entry) => entry.sectionMarkers === markers)
    .map((entry) => [`[\`${entry.id}\`](${entry.path})`, entry.description, entry.type]);
}

function markerPositions(text, markers) {
  const start = `<!-- ${markers}:start -->`;
  const end = `<!-- ${markers}:end -->`;
  const startAt = text.indexOf(start);
  const endAt = text.indexOf(end);
  if (startAt === -1 || endAt === -1) {
    console.error(`README.md is missing the ${start} / ${end} markers.`);
    process.exit(1);
  }
  return [startAt + start.length, endAt];
}

function tableRows(text, markers) {
  const [startAt, endAt] = markerPositions(text, markers);
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

function withFreshTable(text, markers) {
  const [startAt, endAt] = markerPositions(text, markers);
  const rows = rowsFor(markers).map((cells) => `| ${cells.join(" | ")} |`);
  const table = ["| Example | Description | Type |", "| --- | --- | --- |", ...rows].join("\n");
  return text.slice(0, startAt) + "\n" + table + "\n" + text.slice(endAt);
}
