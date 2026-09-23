// Git helpers for the example audit. Zero dependencies.
//
// changedDirs(base, head)  -> entry folders under catalog/ or examples/ touched
//                             between base and head, with added|modified status
// diffLineMap(base, head)  -> Map<file, Set<line>> of right-side lines in the diff,
//                             used to tell new code from pre-existing code

import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { repoRoot, sections } from "../validate-examples.mjs";

const sectionDirs = sections.map((s) => s.dir);

export function git(args, opts = {}) {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });
}

export function resolveRange(base, head) {
  base = base || "origin/main";
  head = head || "HEAD";
  // Three-dot range: changes on head since it diverged from base.
  return `${base}...${head}`;
}

export function changedDirs(base, head) {
  const range = resolveRange(base, head);
  const names = git(["diff", "--name-only", "--diff-filter=ACMRD", range, "--", ...sectionDirs])
    .split("\n")
    .filter(Boolean);

  const seen = new Map();
  for (const file of names) {
    const parts = file.split("/");
    // Only files inside an entry folder count: examples/<name>/... . A file
    // sitting directly under examples/ (its README) is not an entry.
    if (parts.length < 3) continue;
    const [section, name] = parts;
    if (!section || !name || !sectionDirs.includes(section)) continue;
    if (name.startsWith("_") || name.startsWith(".")) continue;
    const path = `${section}/${name}`;
    if (seen.has(path)) continue;
    // Skip folders deleted in this range. Check the working tree first (CI
    // checks out the PR head) and fall back to the head commit for local runs.
    const abs = join(repoRoot, path);
    const inTree = existsSync(abs) && statSync(abs).isDirectory();
    if (!inTree && !existsAt(head || "HEAD", path)) continue;
    seen.set(path, { path, section, name, status: existedAt(base || "origin/main", head || "HEAD", path) ? "modified" : "added" });
  }
  return [...seen.values()];
}

function existsAt(ref, path) {
  try {
    return git(["ls-tree", "-d", "--name-only", ref, "--", path]).trim() !== "";
  } catch {
    return false;
  }
}

function existedAt(base, head, path) {
  // The merge base is what the PR started from.
  let ref = base;
  try {
    ref = git(["merge-base", base, head]).trim();
  } catch {
    // fall back to base as given
  }
  try {
    return git(["ls-tree", "-d", "--name-only", ref, "--", path]).trim() !== "";
  } catch {
    return false;
  }
}

export function diffLineMap(base, head) {
  const range = resolveRange(base, head);
  const out = git(["diff", "-U0", "--no-color", range, "--", ...sectionDirs]);
  const map = new Map();
  let file = null;
  for (const line of out.split("\n")) {
    if (line.startsWith("+++ ")) {
      file = line.startsWith("+++ b/") ? line.slice(6) : null;
      continue;
    }
    const m = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (m && file) {
      const start = Number(m[1]);
      const count = m[2] === undefined ? 1 : Number(m[2]);
      if (!map.has(file)) map.set(file, new Set());
      const set = map.get(file);
      for (let i = 0; i < count; i++) set.add(start + i);
    }
  }
  return map;
}

export function dirInfo(path) {
  const [section, name] = path.replace(/\/+$/, "").split("/");
  return { path: `${section}/${name}`, section, name, status: "modified" };
}
