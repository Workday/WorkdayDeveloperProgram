#!/usr/bin/env node
// Audits example folders with Arcane Auditor plus the hub's own rules, and
// reports what to fix and how. Zero dependencies, Node 20.
//
//   node scripts/audit-examples.mjs --changed                  folders changed vs origin/main
//   node scripts/audit-examples.mjs --changed <base> <head>    folders changed in a range (CI)
//   node scripts/audit-examples.mjs --dirs examples/foo ...    specific folders
//   node scripts/audit-examples.mjs --all                      every folder (slow, noisy)
//
// Options
//   --mode enforcing|advisory   enforcing (default) exits 1 on blocking findings
//   --format console|json|markdown|ci   ci = annotations + job summary + JSON file
//   --output <file>             write the JSON report here (default audit/report.json for ci)
//   --pr <number>               record the PR number in the report and audit/pr.json
//   --merge <arcane.json>       use a report from the Arcane GitHub Action instead of running it
//   --skip-arcane               hub rules only (no binary needed)
//   --hub-only | --arcane-only  run one side
//   --rules A,B  --exclude-rules A,B   forwarded to Arcane
//   --list-changed <base> <head>       print changed folders and exit (sets dirs= in $GITHUB_OUTPUT)
//
// Exit codes: 0 clean or advisory, 1 blocking findings, 2 usage, 3 tooling failure.

import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { repoRoot, sections } from "./validate-examples.mjs";
import { changedDirs, diffLineMap, dirInfo } from "./audit/diff.mjs";
import { listRules, loadArcaneReport, runArcane } from "./audit/arcane.mjs";
import { HUB_RULES, runHubRules } from "./audit/hub-rules.mjs";
import { buildReport } from "./audit/report.mjs";
import { toAnnotations, toConsole, toMarkdown } from "./audit/render.mjs";

const CONFIG_PATH = ".arcane-auditor/config.json";

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(usage());
  process.exit(0);
}

// Which folders ---------------------------------------------------------------
let dirs = [];
let diffMap = null;
if (args["list-changed"] || args.changed) {
  const [base, head] = args["list-changed"] ?? args.changed;
  try {
    dirs = changedDirs(base, head);
    diffMap = diffLineMap(base, head);
  } catch (err) {
    fail(3, `git diff failed: ${err.message}\nFetch the base branch first (git fetch origin main) or pass --dirs.`);
  }
  if (args["list-changed"]) {
    const list = dirs.map((d) => d.path).join(" ");
    console.log(list);
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `dirs=${list}\n`);
    process.exit(0);
  }
} else if (args.dirs) {
  dirs = args.dirs.map((d) => {
    const info = dirInfo(d);
    if (!sections.some((s) => s.dir === info.section) || !existsSync(join(repoRoot, info.path))) fail(2, `Not an example folder: ${d}`);
    return info;
  });
} else if (args.all) {
  for (const s of sections) {
    const abs = join(repoRoot, s.dir);
    if (!existsSync(abs)) continue;
    for (const name of readdirSync(abs).sort()) {
      if (name.startsWith("_") || name.startsWith(".") || !statSync(join(abs, name)).isDirectory()) continue;
      dirs.push({ path: `${s.dir}/${name}`, section: s.dir, name, status: "modified" });
    }
  }
} else {
  fail(2, usage());
}

const mode = args.mode ?? "enforcing";
if (!["enforcing", "advisory"].includes(mode)) fail(2, `--mode must be enforcing or advisory (got ${mode})`);
const format = args.format ?? "console";
if (!["console", "json", "markdown", "ci"].includes(format)) fail(2, `--format must be console, json, markdown, or ci (got ${format})`);

// Arcane ----------------------------------------------------------------------
let arcaneReport = null;
if (!args["skip-arcane"] && !args["hub-only"] && dirs.length > 0) {
  if (args.merge) {
    try {
      arcaneReport = loadArcaneReport(resolve(repoRoot, args.merge));
    } catch (err) {
      fail(3, `Could not load Arcane report ${args.merge}: ${err.message}`);
    }
  } else {
    try {
      arcaneReport = runArcane(dirs.map((d) => d.path), { configPath: existsSync(join(repoRoot, CONFIG_PATH)) ? CONFIG_PATH : undefined, rules: args.rules, excludeRules: args["exclude-rules"] });
    } catch (err) {
      fail(3, err.message);
    }
  }
}

// Hub rules -------------------------------------------------------------------
let hubFindings = [];
if (!args["arcane-only"]) {
  for (const d of dirs) hubFindings.push(...runHubRules(d));
}

// Report ----------------------------------------------------------------------
const pr = args.pr ? { number: Number(args.pr), base: args.changed?.[0] ?? null, head: args.changed?.[1] ?? null } : null;
const report = buildReport({ dirs, arcaneReport, hubFindings, mode, diffMap, pr, rulesMeta: arcaneReport ? listRules() : new Map(), hubRulesMeta: HUB_RULES });

const output = args.output ?? (format === "ci" ? "audit/report.json" : null);
if (output) {
  const outPath = resolve(repoRoot, output);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  if (pr) writeFileSync(join(dirname(outPath), "pr.json"), JSON.stringify(pr) + "\n");
}

switch (format) {
  case "json":
    if (!output) console.log(JSON.stringify(report, null, 2));
    break;
  case "markdown":
    console.log(toMarkdown(report));
    break;
  case "ci":
    for (const line of toAnnotations(report)) console.log(line);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, toMarkdown(report));
    console.log(`\n${report.summary.effective_action} blocking, ${report.summary.effective_advice} advisory finding(s) in ${dirs.length} folder(s). Mode: ${mode}. Report: ${output}`);
    break;
  default:
    console.log(toConsole(report));
}

process.exit(mode === "enforcing" && report.summary.effective_action > 0 ? 1 : 0);

// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const out = {};
  const listFlags = new Set(["dirs"]);
  const rangeFlags = new Set(["changed", "list-changed"]);
  const valueFlags = new Set(["mode", "format", "output", "pr", "merge", "rules", "exclude-rules"]);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) fail(2, `Unexpected argument: ${a}\n\n${usage()}`);
    const key = a.slice(2);
    if (key === "help" || key === "h") out.help = true;
    else if (listFlags.has(key)) {
      out[key] = [];
      while (argv[i + 1] && !argv[i + 1].startsWith("--")) out[key].push(argv[++i].replace(/\/+$/, ""));
    } else if (rangeFlags.has(key)) {
      out[key] = [];
      while (argv[i + 1] && !argv[i + 1].startsWith("--") && out[key].length < 2) out[key].push(argv[++i]);
    } else if (valueFlags.has(key)) {
      if (!argv[i + 1] || argv[i + 1].startsWith("--")) fail(2, `--${key} needs a value`);
      out[key] = argv[++i];
    } else if (["all", "skip-arcane", "hub-only", "arcane-only"].includes(key)) out[key] = true;
    else fail(2, `Unknown option --${key}\n\n${usage()}`);
  }
  return out;
}

function usage() {
  return `Usage:
  node scripts/audit-examples.mjs --changed [<base> [<head>]]
  node scripts/audit-examples.mjs --dirs <folder> [<folder> ...]
  node scripts/audit-examples.mjs --all
  node scripts/audit-examples.mjs --list-changed <base> <head>

Options:
  --mode enforcing|advisory    --format console|json|markdown|ci    --output <file>
  --pr <number>   --merge <arcane.json>   --skip-arcane   --hub-only   --arcane-only
  --rules A,B     --exclude-rules A,B`;
}

function fail(code, msg) {
  console.error(msg);
  process.exit(code);
}
