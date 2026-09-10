// Posts a hub-audit/1 report to a pull request as a sticky summary comment
// and inline review comments with one-click suggestions. Runs inside
// actions/github-script in .github/workflows/audit-comment.yml with a write
// token, so it treats the report strictly as data: every field is validated
// and capped, the PR is resolved from the trusted workflow_run event, and
// nothing from the report is ever executed.

import { readFileSync } from "node:fs";
import { suggestionFor } from "./report.mjs";
import { toMarkdown } from "./render.mjs";

const STICKY_MARKER = "<!-- hub-audit -->";
const MAX_FINDINGS = 500;
const MAX_INLINE = 40;
const PATH_RE = /^(examples|catalog)\/[^\0]+$/;

export function validateReport(raw) {
  if (!raw || typeof raw !== "object") throw new Error("report is not an object");
  if (raw.schema_version !== "hub-audit/1") throw new Error(`unexpected schema_version ${raw.schema_version}`);
  if (!["enforcing", "advisory"].includes(raw.mode)) throw new Error("bad mode");
  if (!Array.isArray(raw.findings) || raw.findings.length > MAX_FINDINGS) throw new Error("findings missing or too many");
  if (!Array.isArray(raw.dirs)) throw new Error("dirs missing");
  const dirs = raw.dirs.map((d) => {
    if (typeof d.path !== "string" || !PATH_RE.test(d.path) || d.path.includes("..")) throw new Error(`bad dir path ${d.path}`);
    return { path: d.path, section: d.section === "catalog" ? "catalog" : "examples", name: str(d.name, 200), status: d.status === "added" ? "added" : "modified" };
  });
  const findings = raw.findings.map((f) => {
    if (typeof f.file !== "string" || !PATH_RE.test(f.file) || f.file.includes("..")) throw new Error(`bad file path ${f.file}`);
    const line = Number.isInteger(f.line) && f.line >= 0 ? f.line : 0;
    return {
      id: str(f.id, 300),
      source: f.source === "hub" ? "hub" : "arcane",
      rule_id: str(f.rule_id, 80).replace(/[^A-Za-z0-9_]/g, ""),
      severity: f.severity === "ACTION" ? "ACTION" : "ADVICE",
      effective_severity: f.effective_severity === "ACTION" ? "ACTION" : "ADVICE",
      downgrade_reason: f.downgrade_reason ? str(f.downgrade_reason, 40) : null,
      promote_reason: f.promote_reason ? str(f.promote_reason, 40) : null,
      fix_strategy: f.fix_strategy === "actionable" ? "actionable" : "human_review",
      message: str(f.message, 1000),
      why: f.why ? str(f.why, 500) : null,
      file: f.file,
      dir: str(f.dir, 300),
      line,
      target_text: f.target_text != null ? str(f.target_text, 500) : null,
      suggested_replacement: f.suggested_replacement != null ? str(f.suggested_replacement, 2000) : null,
      replacement_context: f.replacement_context != null ? str(f.replacement_context, 30) : null,
      source_line: f.source_line != null ? str(f.source_line, 2000) : null,
      in_diff: f.in_diff === true ? true : f.in_diff === false ? false : null,
      doc_url: typeof f.doc_url === "string" && /^https:\/\/github\.com\//.test(f.doc_url) ? str(f.doc_url, 300) : null
    };
  });
  const s = raw.summary ?? {};
  return {
    schema_version: raw.schema_version,
    mode: raw.mode,
    dirs,
    findings,
    summary: { action: num(s.action), advice: num(s.advice), effective_action: num(s.effective_action), effective_advice: num(s.effective_advice) }
  };
}

// The PR comes from the workflow_run event, never from the artifact.
// workflow_run.pull_requests is empty for forks, so look it up by head.
export async function resolvePr({ github, context, headSha, headBranch, headOwner }) {
  const { data } = await github.rest.pulls.list({ ...context.repo, state: "open", head: `${headOwner}:${headBranch}`, per_page: 10 });
  const pr = data.find((p) => p.head.sha === headSha);
  return pr ?? null;
}

// Map<file, Set<line>> of right-side lines a review comment may attach to.
export async function commentableLines({ github, context, prNumber }) {
  const map = new Map();
  const files = await github.paginate(github.rest.pulls.listFiles, { ...context.repo, pull_number: prNumber, per_page: 100 });
  for (const f of files) {
    if (!f.patch) continue;
    const set = new Set();
    for (const line of f.patch.split("\n")) {
      const m = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
      if (!m) continue;
      const start = Number(m[1]);
      const count = m[2] === undefined ? 1 : Number(m[2]);
      for (let i = 0; i < count; i++) set.add(start + i);
    }
    map.set(f.filename, set);
  }
  return map;
}

export function buildReview(report, lineMap, alreadyPosted = new Set()) {
  const comments = [];
  const overflow = [];
  for (const f of report.findings) {
    if (alreadyPosted.has(f.id)) continue;
    const canInline = f.line > 0 && lineMap.get(f.file)?.has(f.line);
    if (!canInline) {
      overflow.push(f);
      continue;
    }
    if (comments.length >= MAX_INLINE) {
      overflow.push(f);
      continue;
    }
    comments.push({ path: f.file, line: f.line, side: "RIGHT", body: inlineBody(f) });
  }
  return { comments, overflow };
}

function inlineBody(f) {
  const parts = [];
  parts.push(`**${f.rule_id}** (${f.effective_severity}${f.effective_severity !== f.severity ? `, was ${f.severity}` : ""})`);
  parts.push("");
  parts.push(f.message);
  if (f.why) {
    parts.push("");
    parts.push(`Why: ${f.why}`);
  }
  const suggestion = suggestionFor(f);
  if (suggestion != null) {
    parts.push("");
    parts.push("```suggestion");
    parts.push(suggestion);
    parts.push("```");
  } else if (f.suggested_replacement) {
    parts.push("");
    parts.push("Suggested change:");
    parts.push("```");
    parts.push(f.suggested_replacement);
    parts.push("```");
  }
  if (f.doc_url) {
    parts.push("");
    parts.push(`[Read more](${f.doc_url})`);
  }
  parts.push("");
  parts.push(`<!-- finding:${f.id} -->`);
  return parts.join("\n");
}

export async function existingFindingIds({ github, context, prNumber }) {
  const ids = new Set();
  const comments = await github.paginate(github.rest.pulls.listReviewComments, { ...context.repo, pull_number: prNumber, per_page: 100 });
  for (const c of comments) {
    if (!c.user || c.user.type !== "Bot") continue;
    const m = c.body?.match(/<!-- finding:([^>]+) -->/);
    if (m) ids.add(m[1].trim());
  }
  return ids;
}

export async function upsertStickyComment({ github, context, prNumber, body }) {
  const comments = await github.paginate(github.rest.issues.listComments, { ...context.repo, issue_number: prNumber, per_page: 100 });
  const existing = comments.find((c) => c.body?.includes(STICKY_MARKER) && c.user?.type === "Bot");
  if (existing) {
    await github.rest.issues.updateComment({ ...context.repo, comment_id: existing.id, body });
  } else {
    await github.rest.issues.createComment({ ...context.repo, issue_number: prNumber, body });
  }
}

export async function postReview({ github, context, core, reportPath, headSha, headBranch, headOwner, checkConclusion }) {
  let report;
  try {
    report = validateReport(JSON.parse(readFileSync(reportPath, "utf8")));
  } catch (err) {
    core.warning(`Audit report rejected: ${err.message}`);
    return;
  }
  const pr = await resolvePr({ github, context, headSha, headBranch, headOwner });
  if (!pr) {
    core.info(`No open pull request found for ${headOwner}:${headBranch} at ${headSha}; nothing to post.`);
    return;
  }
  const prNumber = pr.number;

  const lineMap = await commentableLines({ github, context, prNumber });
  const posted = await existingFindingIds({ github, context, prNumber });
  const { comments, overflow } = buildReview(report, lineMap, posted);

  if (comments.length > 0) {
    await github.rest.pulls.createReview({
      ...context.repo,
      pull_number: prNumber,
      commit_id: headSha,
      event: "COMMENT",
      body: `Example audit: ${comments.length} inline suggestion(s). The summary comment on this PR has the full list.`,
      comments
    });
    core.info(`Posted ${comments.length} inline comment(s).`);
  }

  let body = toMarkdown(report, { forComment: true });
  if (checkConclusion === "failure" && report.mode === "enforcing") {
    body = body.replace("<!-- hub-audit -->\n", "<!-- hub-audit -->\n> The **Audit examples** check failed because of the items under *Fix before merge*. Push a fix and it re-runs automatically.\n\n");
  }
  const notInline = overflow.filter((f) => !posted.has(f.id) && f.line === 0).length;
  if (notInline > 0 && comments.length > 0) body += `\n${notInline} finding(s) are file-level and appear only in this summary.\n`;
  await upsertStickyComment({ github, context, prNumber, body });
  core.info(`Updated summary comment on #${prNumber}.`);
}

function str(v, max) {
  return String(v ?? "").slice(0, max);
}
function num(v) {
  return Number.isInteger(v) && v >= 0 ? v : 0;
}
