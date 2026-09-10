// Hub-specific rules that Arcane Auditor does not cover: folder naming, the
// example.json contract, README sections, leftover template text, stray
// .gitkeep files, hardcoded period literals, and tenant-specific app ids.
// Zero dependencies.
//
// Every rule returns findings shaped like:
//   { rule_id, severity, fix_strategy, message, file, line,
//     target_text?, suggested_replacement?, replacement_context? }
// file is repo-relative; line is 0 for file-level findings.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { repoRoot, validateEntry } from "../validate-examples.mjs";

export const HUB_RULES = new Map([
  ["HubFolderKebabCaseRule", { severity: "ACTION", description: "Example folders are kebab-case so URLs, gallery cards, and the scaffolder agree." }],
  ["HubExampleJsonRule", { severity: "ACTION", description: "Every example has a valid example.json and README.md, the contract the gallery and index are built from." }],
  ["HubReadmeSectionsRule", { severity: "ACTION", description: "The README has the sections readers rely on: What it is, What's inside, How to use it, and Before you deploy." }],
  ["HubTemplateBoilerplateRule", { severity: "ACTION", description: "Placeholder text from the template was left in the submission." }],
  ["HubGitkeepRule", { severity: "ADVICE", description: ".gitkeep files only exist to keep empty folders; delete them once the folder has content." }],
  ["HubHardcodedPeriodLiteralRule", { severity: "ADVICE", description: "A date or period literal (like 2026-Q1) is hardcoded, so the example silently goes stale." }],
  ["HubAppReferenceIdRule", { severity: "ADVICE", description: "A tenant-generated app reference id (the _xxxxxx suffix) is baked into the example without telling readers to replace it." }]
]);

const KEBAB = /^[a-z0-9][a-z0-9-]*$/; // same rule as scripts/new-example.mjs
const REQUIRED_SECTIONS = [
  { key: "what it is", label: "What it is", severity: "ACTION" },
  { key: "what's inside", label: "What's inside", severity: "ACTION", alt: /what.?s inside|what is inside|contents/ },
  { key: "how to use it", label: "How to use it", severity: "ACTION", alt: /how to use|usage|getting started|setup|how to run|deploy/ },
  { key: "before you deploy", label: "Before you deploy", severity: "ADVICE", alt: /before you deploy|before deploying|what to change|what you need to change|customi[sz]e for your tenant/ }
];
const TEMPLATE_STRINGS = [
  "Fill in example.json (delete this section before submitting)",
  "One short paragraph: what this example shows and who it is for",
  "Bullet the contents of this folder so a reader knows",
  "The concrete steps to put this example to work, whatever that means",
  "One or two sentences about what this example shows."
];
const PERIOD_LITERAL = /^(?:\d{4}-(?:Q[1-4]|H[12]|\d{2})(?:-\d{2})?|FY\d{2,4}|\d{4})$/;
const APP_REF_ID = /^[A-Za-z0-9]+_[a-z]{6}$/;

// dir: { path, section, name }
export function runHubRules(dir) {
  const ctx = context(dir);
  return [
    ...folderKebabCase(ctx),
    ...exampleJson(ctx),
    ...readmeSections(ctx),
    ...templateBoilerplate(ctx),
    ...gitkeep(ctx),
    ...hardcodedPeriodLiteral(ctx),
    ...appReferenceId(ctx)
  ];
}

function context(dir) {
  const abs = join(repoRoot, dir.path);
  const readmePath = join(abs, "README.md");
  const readme = existsSync(readmePath) ? readFileSync(readmePath, "utf8") : null;
  const headings = readme ? [...readme.matchAll(/^#{1,3}\s+(.+?)\s*#*\s*$/gm)].map((m) => m[1].trim()) : [];
  const files = existsSync(abs) ? walk(abs).map((p) => relative(repoRoot, p).replace(/\\/g, "/")) : [];
  const hasBeforeDeploy = headings.some((h) => REQUIRED_SECTIONS[3].alt.test(h.toLowerCase()));
  return { ...dir, abs, readme, headings, files, hasBeforeDeploy };
}

function folderKebabCase(ctx) {
  if (KEBAB.test(ctx.name)) return [];
  const suggested = ctx.name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()
    .replace(/^-+|-+$/g, "");
  return [finding("HubFolderKebabCaseRule", ctx.path, 0, `Folder name "${ctx.name}" is not kebab-case (lowercase letters, digits, and hyphens). Rename it to "${suggested}".`, { suggested_replacement: suggested, target_text: ctx.name, replacement_context: "rename" })];
}

function exampleJson(ctx) {
  const out = [];
  const { errors } = validateEntry(ctx.section, ctx.name);
  const rootJson = ctx.files.filter((f) => f.split("/").length === 3 && f.endsWith(".json"));
  for (const err of errors) {
    const msg = err.replace(`${ctx.path}: `, "").replace(`${ctx.path}/`, "");
    if (msg === "missing README.md") {
      out.push(finding("HubExampleJsonRule", `${ctx.path}/README.md`, 0, "README.md is missing. Copy examples/_template/README.md and fill in its sections."));
      continue;
    }
    if (msg === "missing example.json") {
      const candidate = rootJson.find((f) => looksLikeMeta(f));
      const hint = candidate
        ? ` "${candidate.split("/").pop()}" looks like the metadata file; rename it to example.json.`
        : " Copy examples/_template/example.json and fill in title, description, and type.";
      out.push(finding("HubExampleJsonRule", `${ctx.path}/example.json`, 0, `example.json is missing.${hint}`, candidate ? { target_text: candidate.split("/").pop(), suggested_replacement: "example.json", replacement_context: "rename" } : {}));
      continue;
    }
    out.push(finding("HubExampleJsonRule", `${ctx.path}/example.json`, 0, msg.startsWith("example.json") ? msg : `example.json: ${msg}`));
  }
  // A JSON file whose first line is not JSON (a pasted code-fence label, say).
  for (const f of rootJson) {
    const text = read(f);
    const first = text.split(/\r?\n/)[0] ?? "";
    if (first.trim() && !/^[\s{\[]/.test(first)) {
      out.push(finding("HubExampleJsonRule", f, 1, `${f.split("/").pop()} starts with "${first.trim()}" before the JSON begins. Delete that line so the file parses.`, { target_text: first, suggested_replacement: "", replacement_context: "full_line" }));
    }
  }
  return out;
}

function looksLikeMeta(f) {
  try {
    const text = read(f).replace(/^[^{\[]*/, "");
    const j = JSON.parse(text);
    return typeof j.title === "string" && typeof j.description === "string";
  } catch {
    return /"title"\s*:/.test(read(f)) && /"description"\s*:/.test(read(f));
  }
}

function readmeSections(ctx) {
  if (ctx.readme == null) return []; // reported by exampleJson
  const lower = ctx.headings.map((h) => h.toLowerCase());
  const missing = REQUIRED_SECTIONS.filter((s) => !lower.some((h) => h.includes(s.key) || (s.alt && s.alt.test(h))));
  if (missing.length === 0) return [];
  const rawHtml = ctx.headings.length === 0 && /<h[1-3][\s>]/i.test(ctx.readme);
  const out = [];
  if (rawHtml) {
    out.push(finding("HubReadmeSectionsRule", `${ctx.path}/README.md`, 0, `README.md uses HTML headings instead of markdown. Rewrite it with the four markdown sections from examples/_template/README.md: ${REQUIRED_SECTIONS.map((s) => `"## ${s.label}"`).join(", ")}.`));
    return out;
  }
  const blocking = missing.filter((s) => s.severity === "ACTION");
  const advice = missing.filter((s) => s.severity === "ADVICE");
  if (blocking.length) {
    out.push(finding("HubReadmeSectionsRule", `${ctx.path}/README.md`, 0, `README.md is missing ${blocking.length === 1 ? "the section" : "the sections"} ${blocking.map((s) => `"## ${s.label}"`).join(", ")}. Readers need to know what the example is, what is in the folder, and how to use it.`));
  }
  for (const s of advice) {
    out.push({ ...finding("HubReadmeSectionsRule", `${ctx.path}/README.md`, 0, `README.md has no "## ${s.label}" section. List everything a reader must change before this works in their tenant: app reference ids, base URLs, WIDs, security domains, dates or periods.`), severity: "ADVICE" });
  }
  return out;
}

function templateBoilerplate(ctx) {
  const out = [];
  for (const f of ctx.files.filter((p) => p.endsWith("README.md") || p.endsWith("example.json"))) {
    const text = read(f);
    for (const needle of TEMPLATE_STRINGS) {
      const idx = text.indexOf(needle);
      if (idx === -1) continue;
      out.push(finding("HubTemplateBoilerplateRule", f, lineAt(text, idx), `Template placeholder text is still here: "${needle.slice(0, 60)}...". Replace it with your own content.`));
    }
    if (f.endsWith("example.json") && /"title"\s*:\s*"My Example"/.test(text)) {
      out.push(finding("HubTemplateBoilerplateRule", f, lineAt(text, text.indexOf('"My Example"')), 'example.json still has the template title "My Example". Give the example a real title.'));
    }
  }
  return out;
}

function gitkeep(ctx) {
  const out = [];
  for (const f of ctx.files.filter((p) => p.endsWith("/.gitkeep"))) {
    const folder = join(repoRoot, f, "..");
    const others = readdirSync(folder).filter((n) => n !== ".gitkeep");
    if (others.length === 0) continue;
    out.push({ ...finding("HubGitkeepRule", f, 0, `.gitkeep is no longer needed because "${relative(repoRoot, folder).replace(/\\/g, "/")}" has ${others.length} other file(s). Delete it.`, { replacement_context: "file_remove" }), severity: "ADVICE", fix_strategy: "actionable" });
  }
  return out;
}

function hardcodedPeriodLiteral(ctx) {
  const out = [];
  for (const f of ctx.files.filter((p) => /\.(pmd|pod)$/i.test(p))) {
    const text = read(f);
    for (const m of text.matchAll(/"value"\s*:\s*"([^"<]{4,12})"/g)) {
      const literal = m[1];
      if (!PERIOD_LITERAL.test(literal)) continue;
      const mentioned = ctx.hasBeforeDeploy && ctx.readme.includes(literal);
      if (mentioned) continue;
      const line = lineAt(text, m.index);
      out.push({
        ...finding("HubHardcodedPeriodLiteralRule", f, line, `"${literal}" is a hardcoded period or date. Every cycle someone has to edit and redeploy the app. Compute it from today's date (for example \`<% date:today %>\` and a small script), read it from an app attribute, or document it under "## Before you deploy" so readers know to change it.`),
        severity: "ADVICE"
      });
    }
  }
  return out;
}

function appReferenceId(ctx) {
  if (ctx.hasBeforeDeploy) return [];
  const out = [];
  const seen = new Set();
  for (const f of ctx.files.filter((p) => /\.(amd|smd)$/i.test(p))) {
    const base = f.split("/").pop().replace(/\.(amd|smd)$/i, "");
    const text = read(f);
    const ids = new Set();
    if (APP_REF_ID.test(base)) ids.add(base);
    for (const m of text.matchAll(/"(?:applicationId|siteId|id)"\s*:\s*"([A-Za-z0-9]+_[a-z]{6})"/g)) ids.add(m[1]);
    for (const id of ids) {
      const key = `${f}:${id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const idx = text.indexOf(`"${id}"`);
      out.push({
        ...finding("HubAppReferenceIdRule", f, idx >= 0 ? lineAt(text, idx) : 0, `"${id}" is the app reference id Workday generated for the original tenant (the _${id.split("_").pop()} suffix). Anyone who imports this example gets a different suffix. Add a "## Before you deploy" section to the README that tells readers to replace it, or reference it dynamically with site.applicationId in scripts.`),
        severity: "ADVICE"
      });
    }
  }
  return out;
}

// helpers -------------------------------------------------------------------

function finding(rule_id, file, line, message, extra = {}) {
  const meta = HUB_RULES.get(rule_id);
  return { rule_id, severity: meta.severity, fix_strategy: extra.suggested_replacement != null ? "actionable" : "human_review", message, file, line, ...extra };
}

const cache = new Map();
function read(f) {
  if (!cache.has(f)) cache.set(f, readFileSync(join(repoRoot, f), "utf8"));
  return cache.get(f);
}

function lineAt(text, idx) {
  let n = 1;
  for (let i = 0; i < idx && i < text.length; i++) if (text.charCodeAt(i) === 10) n++;
  return n;
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}
