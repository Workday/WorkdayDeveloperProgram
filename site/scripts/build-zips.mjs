// Zips every example folder into public/downloads/<section>/<id>.zip so the
// gallery can offer per-example downloads without anyone cloning the repo.
// Runs before `astro dev` and `astro build` (see package.json). Output is
// gitignored. Each zip gets a SOURCE.md that points back to the repository
// and the commit it was built from.

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";
import { sourceMarkdown } from "../src/lib/gitTrace.js";

const siteDir = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = join(siteDir, "..");
const outRoot = join(siteDir, "public", "downloads");
const hub = JSON.parse(readFileSync(join(repoRoot, "hub.config.json"), "utf8"));

// Hub metadata and OS noise stay out of the zip; everything else ships.
const SKIP = new Set([".DS_Store", ".gitkeep", "example.json", "node_modules", ".git"]);
// Fixed timestamp so building the same commit twice yields identical bytes.
const MTIME = new Date("2000-01-01T00:00:00Z");

const sha = process.env.GITHUB_SHA || git("rev-parse HEAD") || "unknown";
// Commit date rather than wall clock, so the same commit always builds the same bytes.
const date = (git("log -1 --format=%cI") || new Date().toISOString()).slice(0, 10);

function git(args) {
  try {
    return execSync(`git ${args}`, { cwd: repoRoot, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    if (SKIP.has(name)) continue;
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) out.push(...walk(abs));
    else out.push(abs);
  }
  return out;
}

// Same folder rules as src/lib/examples.js: skip _template, need example.json.
function exampleDirs(section) {
  const base = join(repoRoot, section);
  if (!existsSync(base)) return [];
  return readdirSync(base)
    .sort()
    .filter((id) => !id.startsWith("_") && !id.startsWith("."))
    .filter((id) => statSync(join(base, id)).isDirectory())
    .filter((id) => existsSync(join(base, id, "example.json")))
    .map((id) => ({ id, path: `${section}/${id}`, abs: join(base, id), section }));
}

rmSync(outRoot, { recursive: true, force: true });

let count = 0;
for (const section of ["catalog", "examples"]) {
  for (const example of exampleDirs(section)) {
    const files = {};
    for (const abs of walk(example.abs)) {
      const rel = relative(example.abs, abs).split(sep).join("/");
      files[`${example.id}/${rel}`] = [readFileSync(abs), { mtime: MTIME }];
    }
    files[`${example.id}/SOURCE.md`] = [Buffer.from(sourceMarkdown(example, hub, { sha, date })), { mtime: MTIME }];
    mkdirSync(join(outRoot, section), { recursive: true });
    writeFileSync(join(outRoot, section, `${example.id}.zip`), zipSync(files, { level: 6 }));
    count++;
  }
}

console.log(`build-zips: wrote ${count} zip(s) to ${relative(repoRoot, outRoot)} (commit ${sha.slice(0, 7)})`);
