// Renders a hub-audit/1 report for the console, GitHub annotations, the job
// summary, and the sticky PR comment. Zero dependencies.

import { suggestionFor } from "./report.mjs";

const LOCAL_HELP = "Run it yourself: `./scripts/install-arcane.sh` once, then `node scripts/audit-examples.mjs --changed`. Rule explanations and fixes: [docs/EXAMPLE_BEST_PRACTICES.md](" + docRoot() + ").";

function docRoot() {
  return "docs/EXAMPLE_BEST_PRACTICES.md";
}

export function toConsole(report) {
  const out = [];
  const s = report.summary;
  if (report.findings.length === 0) {
    out.push(`Audit: no findings in ${report.dirs.map((d) => d.path).join(", ") || "no folders"}.`);
    return out.join("\n");
  }
  let lastFile = null;
  for (const f of report.findings) {
    if (f.file !== lastFile) {
      out.push("");
      out.push(f.file);
      lastFile = f.file;
    }
    const tag = f.effective_severity === f.severity ? f.effective_severity : `${f.effective_severity} (was ${f.severity}: ${f.downgrade_reason ?? f.promote_reason})`;
    out.push(`  ${f.line > 0 ? `line ${f.line}` : "file"}  ${tag}  ${f.rule_id}`);
    out.push(`    ${f.message}`);
    const sug = suggestionFor(f);
    if (sug != null) {
      out.push(`    fix: ${f.target_text ? `replace "${f.target_text}" with "${f.suggested_replacement}"` : sug}`);
    } else if (f.suggested_replacement) {
      out.push(`    suggested: ${f.suggested_replacement}`);
    }
    out.push(`    docs: ${f.doc_url}`);
  }
  out.push("");
  out.push(`${s.effective_action} blocking, ${s.effective_advice} advisory (${s.action} ACTION / ${s.advice} ADVICE before policy). Mode: ${report.mode}.`);
  return out.join("\n");
}

// GitHub workflow commands. At most 10 errors and 10 warnings render per step.
export function toAnnotations(report, maxPerLevel = 10) {
  const lines = [];
  const count = { error: 0, warning: 0 };
  for (const f of report.findings) {
    const level = f.effective_severity === "ACTION" ? "error" : "warning";
    if (count[level] >= maxPerLevel) continue;
    count[level]++;
    const props = [`file=${escProp(f.file)}`];
    if (f.line > 0) props.push(`line=${f.line}`);
    props.push(`title=${escProp(`${f.rule_id} (${f.effective_severity})`)}`);
    let msg = f.message;
    if (f.target_text && f.suggested_replacement) msg += ` Suggested fix: replace "${f.target_text}" with "${f.suggested_replacement}".`;
    msg += ` See ${f.doc_url}`;
    lines.push(`::${level} ${props.join(",")}::${escData(msg)}`);
  }
  const hidden = report.findings.length - count.error - count.warning;
  if (hidden > 0) lines.push(`::notice title=Example audit::${hidden} more finding(s) are listed in the job summary.`);
  return lines;
}

// Markdown for the job summary and the sticky PR comment.
export function toMarkdown(report, { title = "Example audit", forComment = false } = {}) {
  const s = report.summary;
  const out = [];
  if (forComment) out.push("<!-- hub-audit -->");
  out.push(`## ${title}`);
  out.push("");
  const folders = report.dirs.map((d) => `\`${d.path}\``).join(", ");
  if (report.dirs.length === 0) {
    out.push("No example folders changed, nothing to audit.");
    return out.join("\n") + "\n";
  }
  if (report.findings.length === 0) {
    out.push(`Audited ${folders}. No findings. Thank you for a clean submission.`);
    out.push("");
    out.push(LOCAL_HELP);
    return out.join("\n") + "\n";
  }

  const passed = [];
  if (!report.findings.some((f) => f.rule_id.startsWith("Hub"))) passed.push("hub packaging checks (folder name, example.json, README sections)");
  if (!report.findings.some((f) => f.rule_id === "HardcodedWorkdayAPIRule" || f.rule_id === "HardcodedApplicationIdRule")) passed.push("no hardcoded Workday URLs or app ids");
  if (!report.findings.some((f) => f.rule_id === "ScriptConsoleLogRule")) passed.push("no debug logging");
  if (passed.length) out.push(`Audited ${folders}. Passed: ${passed.join("; ")}.`);
  else out.push(`Audited ${folders}.`);
  out.push("");

  if (report.mode === "advisory") {
    out.push("> Advisory mode: nothing here blocks the merge, but the ACTION items would in enforcing mode.");
    out.push("");
  }
  out.push(`**${s.effective_action} to fix** and **${s.effective_advice} suggestion(s)**.`);
  out.push("");

  const blocking = report.findings.filter((f) => f.effective_severity === "ACTION");
  const advisory = report.findings.filter((f) => f.effective_severity === "ADVICE");
  if (blocking.length) {
    out.push("### Fix before merge");
    out.push("");
    out.push(...table(blocking));
    out.push("");
  }
  if (advisory.length) {
    out.push(`<details${blocking.length ? "" : " open"}><summary>Suggestions (${advisory.length}, never block)</summary>`);
    out.push("");
    out.push(...table(advisory));
    out.push("");
    out.push("</details>");
    out.push("");
  }
  out.push(LOCAL_HELP);
  if (forComment) {
    out.push("");
    out.push("ACTION items fail the **Audit examples** check. ADVICE never blocks. Maintainers can add the `audit-override` label to merge with open ACTION items.");
  }
  return out.join("\n") + "\n";
}

function table(findings) {
  const rows = ["| Where | Rule | What to change |", "| --- | --- | --- |"];
  for (const f of findings.slice(0, 150)) {
    const where = f.line > 0 ? `\`${f.file}\` line ${f.line}` : `\`${f.file}\``;
    const rule = `[${f.rule_id}](${f.doc_url})`;
    let what = f.message;
    if (f.target_text && f.suggested_replacement) what += ` Replace \`${f.target_text}\` with \`${f.suggested_replacement}\`.`;
    else if (f.suggested_replacement && !f.target_text) what += ` Suggested: \`${f.suggested_replacement}\`.`;
    if (f.downgrade_reason === "pre-existing-line") what += " (pre-existing code, not blocking)";
    if (f.promote_reason === "catalog-strict") what += " (catalog apps are held to the stricter bar)";
    rows.push(`| ${where} | ${rule} | ${cell(what)} |`);
  }
  if (findings.length > 150) rows.push(`| | | ... and ${findings.length - 150} more |`);
  return rows;
}

function cell(s) {
  return String(s).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}
function escData(s) {
  return String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}
function escProp(s) {
  return escData(s).replace(/:/g, "%3A").replace(/,/g, "%2C");
}
