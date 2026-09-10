// Builds the unified audit report (schema hub-audit/1) from Arcane findings
// and hub-rule findings, and applies the severity policy. Zero dependencies.
//
// Policy, in order:
//   1. catalog/ folders are held to a stricter bar: ADVICE counts as ACTION.
//   2. In a folder that already existed, ACTION findings on lines the PR did
//      not touch are downgraded to ADVICE so contributors are only blocked on
//      what they wrote.
//   3. In advisory mode nothing blocks: everything becomes ADVICE.
//
// effective_severity is what CI acts on; severity is what the rule said.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config as hubConfig, repoRoot } from "../validate-examples.mjs";

export const SCHEMA = "hub-audit/1";
export const DOC_PATH = "docs/EXAMPLE_BEST_PRACTICES.md";

export function docUrl(ruleId) {
  return `${hubConfig.repoUrl}/blob/${hubConfig.defaultBranch}/${DOC_PATH}#${ruleId.toLowerCase()}`;
}

// dirs:          [{ path, section, name, status: added|modified }]
// arcaneReport:  merged Arcane report or null
// hubFindings:   findings from hub-rules.mjs (already repo-relative)
// mode:          enforcing | advisory
// diffMap:       Map<file, Set<line>> or null when no diff context exists
// rulesMeta:     Map<rule_id, { description }> from Arcane list-rules (may be empty)
export function buildReport({ dirs, arcaneReport, hubFindings, mode, diffMap, pr, rulesMeta, hubRulesMeta }) {
  const dirByPath = new Map(dirs.map((d) => [d.path, d]));
  const findings = [];

  for (const f of arcaneReport?.findings ?? []) {
    const loc = f.location ?? {};
    findings.push(
      normalize({
        source: "arcane",
        rule_id: f.rule_id,
        severity: f.severity,
        fix_strategy: f.fix_strategy ?? "human_review",
        message: f.message ?? "",
        why: rulesMeta?.get(f.rule_id)?.description ?? null,
        file: loc.file_path ?? "",
        line: loc.line ?? 0,
        end_line: loc.end_line ?? null,
        json_path: loc.path ?? null,
        snippet: clip(f.snippet, 400),
        target_text: f.target_text ?? null,
        suggested_replacement: f.suggested_replacement ?? null,
        replacement_context: f.replacement_context ?? null
      }, dirByPath, diffMap)
    );
  }

  for (const f of hubFindings ?? []) {
    findings.push(
      normalize({
        source: "hub",
        why: hubRulesMeta?.get(f.rule_id)?.description ?? null,
        end_line: null,
        json_path: null,
        snippet: null,
        target_text: null,
        suggested_replacement: null,
        replacement_context: null,
        ...f
      }, dirByPath, diffMap)
    );
  }

  for (const f of findings) applyPolicy(f, dirByPath.get(f.dir), mode, diffMap);

  findings.sort((a, b) => rank(a) - rank(b) || cmp(a.file, b.file) || cmp(a.line, b.line) || cmp(a.rule_id, b.rule_id) || cmp(a.message, b.message));

  const summary = { action: 0, advice: 0, effective_action: 0, effective_advice: 0, by_rule: {}, by_dir: {} };
  for (const f of findings) {
    summary[f.severity === "ACTION" ? "action" : "advice"]++;
    summary[f.effective_severity === "ACTION" ? "effective_action" : "effective_advice"]++;
    summary.by_rule[f.rule_id] = (summary.by_rule[f.rule_id] ?? 0) + 1;
    summary.by_dir[f.dir] = (summary.by_dir[f.dir] ?? 0) + 1;
  }

  return {
    schema_version: SCHEMA,
    mode,
    generated_at: new Date().toISOString(),
    pr: pr ?? null,
    dirs: dirs.map((d) => ({
      ...d,
      arcane: (arcaneReport?.runs ?? []).find((r) => r.path === d.path) ?? { status: arcaneReport ? "skipped" : "not-run" }
    })),
    summary,
    findings
  };
}

function normalize(f, dirByPath, diffMap) {
  const file = f.file.replace(/\\/g, "/");
  const dir = [...dirByPath.keys()].find((p) => file === p || file.startsWith(p + "/")) ?? file.split("/").slice(0, 2).join("/");
  const line = Number(f.line) || 0;
  const inDiff = diffMap ? (line > 0 ? diffMap.get(file)?.has(line) ?? false : null) : null;
  const sourceLine = line > 0 ? readLine(file, line) : null;
  return {
    id: `${f.source}:${f.rule_id}:${file}:${f.json_path ?? line}`,
    source: f.source,
    rule_id: f.rule_id,
    severity: f.severity,
    effective_severity: f.severity,
    downgrade_reason: null,
    promote_reason: null,
    fix_strategy: f.fix_strategy,
    message: f.message,
    why: f.why ?? null,
    file,
    dir,
    line,
    end_line: f.end_line ?? null,
    json_path: f.json_path ?? null,
    snippet: f.snippet ?? null,
    target_text: f.target_text ?? null,
    suggested_replacement: f.suggested_replacement ?? null,
    replacement_context: f.replacement_context ?? null,
    source_line: sourceLine,
    in_diff: inDiff,
    doc_url: docUrl(f.rule_id)
  };
}

function applyPolicy(f, dirInfo, mode, diffMap) {
  if (dirInfo?.section === "catalog" && f.severity === "ADVICE") {
    f.effective_severity = "ACTION";
    f.promote_reason = "catalog-strict";
  }
  if (dirInfo?.status === "modified" && diffMap && f.effective_severity === "ACTION" && f.in_diff === false && f.rule_id !== "ArcaneAuditorError") {
    f.effective_severity = "ADVICE";
    f.promote_reason = null;
    f.downgrade_reason = "pre-existing-line";
  }
  if (mode === "advisory" && f.effective_severity === "ACTION") {
    f.effective_severity = "ADVICE";
    f.promote_reason = null;
    f.downgrade_reason = f.downgrade_reason ?? "advisory-mode";
  }
}

// Whether a finding can become a one-click GitHub suggestion.
export function suggestionFor(f) {
  if (f.fix_strategy !== "actionable" || f.suggested_replacement == null || f.source_line == null) return null;
  if (f.replacement_context === "full_line") return f.suggested_replacement;
  if (!f.target_text || !["substring", "full_field"].includes(f.replacement_context)) return null;
  if (!f.source_line.includes(f.target_text)) return null;
  if (/\r|\n/.test(f.suggested_replacement)) return null;

  let target = f.target_text;
  let replacement = f.suggested_replacement;
  // Arcane suggests "<% apiGatewayEndpoint + '/path' %>" for a hardcoded
  // URL. When the URL already sits inside a script expression, nesting a
  // second <% %> is wrong: swap the quoted literal for the inner expression.
  const inner = replacement.match(/^<%\s*(.*?)\s*%>$/);
  if (inner && f.source_line.includes("<%")) {
    const quoted = [`'${target}'`, `"${target}"`].find((q) => f.source_line.includes(q));
    if (!quoted) return null;
    target = quoted;
    replacement = inner[1];
  }
  // A bare expression (site.applicationId) offered for text that sits inside
  // a quoted script literal must be spliced in as concatenation, otherwise
  // the "fix" is still a string.
  if (/^[A-Za-z_][\w.]*$/.test(replacement) && f.source_line.includes("<%")) {
    const m = f.source_line.match(new RegExp(`(['"])([^'"]*)${escapeRe(target)}([^'"]*)\\1`));
    if (m) {
      const [whole, q, pre, post] = m;
      const parts = [];
      if (pre) parts.push(`${q}${pre}${q}`);
      parts.push(replacement);
      if (post) parts.push(`${q}${post}${q}`);
      return f.source_line.replace(whole, parts.join(" + "));
    }
  }
  return f.source_line.replace(target, replacement);
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readLine(file, line) {
  const abs = join(repoRoot, file);
  if (!existsSync(abs)) return null;
  try {
    const lines = readFileSync(abs, "utf8").split(/\r?\n/);
    return lines[line - 1] ?? null;
  } catch {
    return null;
  }
}

function rank(f) {
  return f.effective_severity === "ACTION" ? 0 : 1;
}
function cmp(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}
function clip(s, n) {
  if (s == null) return null;
  s = String(s);
  return s.length > n ? s.slice(0, n) + "…" : s;
}
