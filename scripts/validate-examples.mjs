#!/usr/bin/env node
// Checks every entry in catalog/ and examples/ and keeps the two tables
// in the root README up to date. Zero dependencies.
//
//   node scripts/validate-examples.mjs          validate and refresh the README tables
//   node scripts/validate-examples.mjs --check  validate only, fail if a table is stale (CI)

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const readmePath = join(repoRoot, "README.md");

export const config = JSON.parse(readFileSync(join(repoRoot, "hub.config.json"), "utf8"));

// catalog/ holds Workday-built apps, examples/ holds community examples.
export const sections = [
  { dir: "catalog", markers: "catalog", defaultSource: "workday" },
  { dir: "examples", markers: "examples", defaultSource: "community" }
];

// Validates one entry folder (catalog/<name> or examples/<name>). Returns
// { errors, entry }: entry is null when the folder has no usable metadata.
// Also used by scripts/audit/hub-rules.mjs, so keep it free of side effects.
export function validateEntry(sectionDir, name) {
  const section = sections.find((s) => s.dir === sectionDir);
  const dir = join(repoRoot, sectionDir, name);
  const errors = [];

  if (!existsSync(join(dir, "README.md"))) {
    errors.push(`${sectionDir}/${name}: missing README.md`);
  }

  const metaPath = join(dir, "example.json");
  if (!existsSync(metaPath)) {
    errors.push(`${sectionDir}/${name}: missing example.json`);
    return { errors, entry: null };
  }

  let meta;
  try {
    meta = JSON.parse(readFileSync(metaPath, "utf8"));
  } catch (err) {
    errors.push(`${sectionDir}/${name}/example.json is not valid JSON: ${err.message}`);
    return { errors, entry: null };
  }

  if (!meta.title) errors.push(`${sectionDir}/${name}: example.json needs a "title"`);
  if (!meta.description) errors.push(`${sectionDir}/${name}: example.json needs a "description"`);

  if (!meta.type) {
    errors.push(`${sectionDir}/${name}: example.json needs a "type"`);
  } else if (!config.types.includes(meta.type)) {
    errors.push(`${sectionDir}/${name}: "${meta.type}" is not an approved type. Pick from: ${config.types.join(", ")}`);
  }

  for (const component of asList(meta.components)) {
    if (!config.components.includes(component)) {
      errors.push(`${sectionDir}/${name}: "${component}" is not an approved component. Pick from: ${config.components.join(", ")}`);
    }
  }

  for (const product of asList(meta.products)) {
    if (!config.products.includes(product)) {
      errors.push(`${sectionDir}/${name}: "${product}" is not an approved product. Pick from: ${config.products.join(", ")}`);
    }
  }

  if (meta.tutorial && !meta.tutorial.startsWith("https://")) {
    errors.push(`${sectionDir}/${name}: "tutorial" should be an https link, or left out`);
  }

  if (meta.source && !["workday", "community"].includes(meta.source)) {
    errors.push(`${sectionDir}/${name}: "source" must be "workday" or "community", or left out`);
  }
  if (sectionDir === "catalog" && meta.source === "community") {
    errors.push(`catalog/${name}: catalog apps are Workday-maintained, so "source" cannot be "community". Community submissions live in examples/.`);
  }

  return {
    errors,
    entry: {
      id: name,
      sectionMarkers: section.markers,
      path: `${sectionDir}/${name}`,
      title: meta.title || name,
      description: meta.description || "",
      type: meta.type || ""
    }
  };
}

// Validates every entry in both sections. Returns { errors, entries }.
export function validateAll() {
  const errors = [];
  const entries = [];
  for (const section of sections) {
    const sectionDir = join(repoRoot, section.dir);
    if (!existsSync(sectionDir)) continue;

    for (const name of readdirSync(sectionDir).sort()) {
      // _template and dotfiles are not entries
      if (name.startsWith("_") || name.startsWith(".")) continue;
      if (!statSync(join(sectionDir, name)).isDirectory()) continue;

      const result = validateEntry(section.dir, name);
      errors.push(...result.errors);
      if (result.entry) entries.push(result.entry);
    }
  }
  return { errors, entries };
}

// Compares the README index tables against the entries. Returns true when
// every table is in sync.
export function tablesInSync(entries, readme = readFileSync(readmePath, "utf8")) {
  for (const section of sections) {
    const expected = rowsFor(entries, section.markers);
    const current = tableRows(readme, section.markers);
    if (JSON.stringify(current) !== JSON.stringify(expected)) return false;
  }
  return true;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) main();

function main() {
  const checkOnly = process.argv.includes("--check");
  const { errors, entries } = validateAll();

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
  const allInSync = tablesInSync(entries, readme);

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
      updated = withFreshTable(updated, entries, section.markers);
    }
    writeFileSync(readmePath, updated);
    console.log(`Validated ${entries.length} entr${entries.length === 1 ? "y" : "ies"} and updated README.md.`);
  }
}

function asList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value !== "") return [value];
  return [];
}

function rowsFor(entries, markers) {
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

function withFreshTable(text, entries, markers) {
  const [startAt, endAt] = markerPositions(text, markers);
  const rows = rowsFor(entries, markers).map((cells) => `| ${cells.join(" | ")} |`);
  const table = ["| Example | Description | Type |", "| --- | --- | --- |", ...rows].join("\n");
  return text.slice(0, startAt) + "\n" + table + "\n" + text.slice(endAt);
}
