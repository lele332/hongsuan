#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

function git(args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || "git failed").trim());
  return result.stdout.trim();
}

function lastTag() {
  const result = spawnSync("git", ["describe", "--tags", "--abbrev=0"], { cwd: root, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}

function bucketFor(subject) {
  const map = [
    ["feat", "Features"],
    ["fix", "Fixes"],
    ["perf", "Performance"],
    ["refactor", "Refactoring"],
    ["docs", "Documentation"],
    ["test", "Tests"],
    ["build", "Build"],
    ["ci", "CI"],
    ["chore", "Maintenance"],
    ["style", "Maintenance"]
  ];
  const lower = subject.toLowerCase();
  for (const [prefix, bucket] of map) if (lower.startsWith(prefix + ":") || lower.startsWith(prefix + "(")) return bucket;
  return "Other";
}

const tag = lastTag();
const range = tag ? `${tag}..HEAD` : "HEAD";
const subjects = git(["log", "--format=%s", range]).split(/\r?\n/).filter(Boolean).slice(0, 200);
const buckets = new Map();
for (const subject of subjects) {
  const bucket = bucketFor(subject);
  if (!buckets.has(bucket)) buckets.set(bucket, []);
  buckets.get(bucket).push(subject);
}

const lines = [
  `## v${pkg.version}`,
  "",
  tag ? `Changes since ${tag}.` : "Recent changes.",
  ""
];
for (const bucket of ["Features", "Fixes", "Performance", "Refactoring", "Tests", "Build", "CI", "Documentation", "Maintenance", "Other"]) {
  const items = buckets.get(bucket) || [];
  if (!items.length) continue;
  lines.push(`### ${bucket}`, "");
  for (const item of items) lines.push(`- ${item}`);
  lines.push("");
}
lines.push(
  "### Release checklist",
  "",
  "- Upload the NSIS installer, `latest.yml`, and the matching `.blockmap` together.",
  "- Use English asset names, for example `HongSuan-Setup-v" + pkg.version + "-x64.exe`.",
  "- The binary is unsigned; remind users to choose `More info` > `Run anyway` if SmartScreen appears.",
  "- Verify SHA-256 and publish it in the release notes.",
  ""
);

const outIndex = process.argv.indexOf("--out");
const out = outIndex >= 0 && process.argv[outIndex + 1] ? path.resolve(process.argv[outIndex + 1]) : path.join(root, "dist", `release-notes-v${pkg.version}.md`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, lines.join("\n"), "utf8");
console.log(`release notes written: ${out}`);
