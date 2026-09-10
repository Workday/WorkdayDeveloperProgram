// Runs Arcane Auditor locally, or loads a report produced by the Arcane
// GitHub Action in CI. Zero dependencies.
//
// Report shape (Arcane schema 2.0 plus what the action's merge adds):
//   { schema_version, summary, runs: [{path, status, exit_code, findings}], findings: [...] }
//   findings[].location.file_path is repo-relative (prefixed with the audited dir).

import { spawnSync, execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { repoRoot } from "../validate-examples.mjs";

export const ARCANE_EXTENSIONS = [".pod", ".pmd", ".script", ".amd", ".smd", ".wqlquery", ".orchestration", ".suborchestration"];

// Returns { cmd: [..argv prefix..] } or null when no binary is available.
export function findArcane() {
  if (process.env.ARCANE_AUDITOR_CMD) return { cmd: process.env.ARCANE_AUDITOR_CMD.split(/\s+/).filter(Boolean) };
  const candidates = [
    process.env.ARCANE_AUDITOR_BIN,
    join(repoRoot, ".arcane-auditor", "bin", "ArcaneAuditorCLI"),
    join(homedir(), ".arcane-auditor", "bin", "ArcaneAuditorCLI")
  ].filter(Boolean);
  for (const c of candidates) if (existsSync(c)) return { cmd: [c] };
  try {
    const which = execFileSync(process.platform === "win32" ? "where" : "which", ["ArcaneAuditorCLI"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (which) return { cmd: [which.split("\n")[0]] };
  } catch {
    // not on PATH
  }
  return null;
}

export function hasArcaneFiles(dir) {
  const abs = join(repoRoot, dir);
  const stack = [abs];
  while (stack.length) {
    const d = stack.pop();
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) stack.push(p);
      else if (ARCANE_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext))) return true;
    }
  }
  return false;
}

// Runs review-app for each dir and merges the results, mirroring the
// GitHub Action's merge step so local and CI reports look the same.
export function runArcane(dirs, { configPath, rules, excludeRules } = {}) {
  const arcane = findArcane();
  if (!arcane) throw new Error("Arcane Auditor not found. Run ./scripts/install-arcane.sh, or set ARCANE_AUDITOR_BIN, or use --skip-arcane.");

  const runs = [];
  const findings = [];
  let totalFiles = 0;
  let totalRules = 0;

  for (const dir of dirs) {
    const run = { path: dir, status: "ok", exit_code: null };
    if (!existsSync(join(repoRoot, dir))) {
      run.status = "missing";
      runs.push(run);
      continue;
    }
    if (!hasArcaneFiles(dir)) {
      run.status = "skipped";
      runs.push(run);
      continue;
    }
    const args = [...arcane.cmd.slice(1), "review-app", dir, "--agent"];
    if (configPath) args.push("--config", configPath);
    if (rules) args.push("--rules", rules);
    if (excludeRules) args.push("--exclude-rules", excludeRules);
    const res = spawnSync(arcane.cmd[0], args, { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    run.exit_code = res.status;
    if (res.error || res.status >= 2 || res.status === null) {
      run.status = "error";
      run.stderr = tail(res.stderr || String(res.error || ""), 20);
      findings.push(errorFinding(dir, res.status ?? 3, res.stderr || String(res.error || "")));
      runs.push(run);
      continue;
    }
    let report;
    let preamble = "";
    try {
      ({ report, preamble } = parseAgentJson(res.stdout));
    } catch (err) {
      run.status = "error";
      run.stderr = `could not parse JSON output: ${err.message}`;
      findings.push(errorFinding(dir, 3, run.stderr));
      runs.push(run);
      continue;
    }
    for (const f of report.findings ?? []) {
      const loc = f.location ?? {};
      const fp = loc.file_path && !loc.file_path.startsWith(dir + "/") ? `${dir}/${loc.file_path}` : loc.file_path;
      findings.push({ ...f, location: { ...loc, file_path: fp } });
    }
    if (preamble.trim()) {
      run.warnings = tail(preamble, 12);
      findings.push(warningFinding(dir, preamble));
    }
    totalFiles += report.summary?.total_files ?? 0;
    totalRules = Math.max(totalRules, report.summary?.total_rules ?? 0);
    run.findings = (report.findings ?? []).length;
    runs.push(run);
  }

  const bySeverity = { ACTION: 0, ADVICE: 0 };
  for (const f of findings) bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1;
  return {
    schema_version: "2.0",
    generated_by: "audit-examples.mjs",
    summary: { total_files: totalFiles, total_rules: totalRules, total_findings: findings.length, findings_by_severity: bySeverity },
    runs,
    findings
  };
}

export function loadArcaneReport(path) {
  const { report } = parseAgentJson(readFileSync(path, "utf8"));
  if (!Array.isArray(report.findings)) throw new Error(`${path} is not an Arcane report (no findings array)`);
  // The GitHub Action records parser warnings on the run; surface them the
  // same way a local run does.
  for (const run of report.runs ?? []) {
    if (run.warnings && !report.findings.some((f) => f.rule_id === "ArcaneAuditorWarning" && f.location?.file_path === run.path)) {
      report.findings.push(warningFinding(run.path, run.warnings));
    }
  }
  return report;
}

// rule_id -> { description, severity, fix_strategy, category }. Empty when
// the binary is unavailable; callers must cope.
let rulesCache = null;
export function listRules() {
  if (rulesCache) return rulesCache;
  rulesCache = new Map();
  const arcane = findArcane();
  if (!arcane) return rulesCache;
  const res = spawnSync(arcane.cmd[0], [...arcane.cmd.slice(1), "list-rules", "--format", "json"], { cwd: repoRoot, encoding: "utf8" });
  if (res.status !== 0) return rulesCache;
  try {
    for (const r of JSON.parse(res.stdout)) rulesCache.set(r.rule_id, r);
  } catch {
    // ignore
  }
  return rulesCache;
}

// Agent mode prints JSON to stdout, but the CLI can still print a warning
// line first (for example about a config it had to normalize). Skip anything
// before the first line that starts the JSON document.
export function parseAgentJson(stdout) {
  const text = String(stdout);
  const idx = text.search(/^[{\[]/m);
  if (idx === -1) throw new Error(`no JSON document in output: ${text.trim().split("\n")[0] ?? ""}`);
  return { report: JSON.parse(text.slice(idx)), preamble: text.slice(0, idx) };
}

// Arcane printed a warning before the JSON, usually that its script parser
// gave up on one block. Script rules were skipped for that block, which is
// worth telling the contributor.
function warningFinding(dir, preamble) {
  const first = (preamble.trim().split("\n")[0] ?? "").replace(/^Warning:\s*/i, "").trim();
  return {
    rule_id: "ArcaneAuditorWarning",
    severity: "ADVICE",
    category: "tooling",
    fix_strategy: "human_review",
    fix_strategy_overridden: false,
    message: `Arcane Auditor could not parse part of this folder, so some script rules were skipped: ${first}`,
    location: { file_path: dir, line: 0, column: null, end_line: null, end_column: null, path: null },
    snippet: tail(preamble, 8),
    suggested_replacement: null,
    target_text: null,
    replacement_context: null,
    finding_id: `warning:${dir}`
  };
}

function errorFinding(dir, code, stderr) {
  const first = (stderr.trim().split("\n")[0] ?? "").trim();
  return {
    rule_id: "ArcaneAuditorError",
    severity: "ACTION",
    category: "tooling",
    fix_strategy: "human_review",
    fix_strategy_overridden: false,
    message: code === 2 ? `Arcane Auditor could not analyze this folder (usage error). ${first}` : `Arcane Auditor failed while analyzing this folder (exit ${code}). ${first}`,
    location: { file_path: dir, line: 0, column: null, end_line: null, end_column: null, path: null },
    snippet: tail(stderr, 10),
    suggested_replacement: null,
    target_text: null,
    replacement_context: null,
    finding_id: `error:${dir}:${code}`
  };
}

function tail(text, n) {
  return String(text).trim().split("\n").slice(-n).join("\n");
}
