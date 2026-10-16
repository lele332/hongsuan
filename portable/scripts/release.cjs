#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const dist = path.join(root, "dist");
const artifactNames = {
  nsis: `HongSuan-Setup-v${pkg.version}-x64.exe`,
  portable: `HongSuan-Portable-v${pkg.version}-x64.exe`
};

function runCheck() {
  const check = spawnSync(process.execPath, [path.join(__dirname, "release-check.cjs")], { stdio: "inherit" });
  if (check.status !== 0) process.exit(check.status || 1);
}

function makeNotes() {
  const notes = spawnSync(process.execPath, [path.join(__dirname, "generate-notes.cjs")], { cwd: root, stdio: "inherit" });
  if (notes.status !== 0) process.exit(notes.status || 1);
}

function build(target) {
  const artifactName = artifactNames[target];
  if (!artifactName) throw new Error(`unsupported Windows target: ${target}`);
  const cli = require.resolve("electron-builder/cli.js", { paths: [root] });
  const args = [
    cli,
    "--win", target,
    "--x64",
    "--publish", "never",
    `--config.win.artifactName=${artifactName}`
  ];
  const env = {
    ...process.env,
    ELECTRON_MIRROR: "https://npmmirror.com/mirrors/electron/",
    ELECTRON_BUILDER_BINARIES_MIRROR: "https://npmmirror.com/mirrors/electron-builder-binaries/"
  };
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit", env });
  if (result.status !== 0) process.exit(result.status || 1);
}

function sha256(file) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(file));
  return hash.digest("hex").toUpperCase();
}

function sha512(file) {
  return crypto.createHash("sha512").update(fs.readFileSync(file)).digest("base64");
}

function verifyLatestYml() {
  const latestPath = path.join(dist, "latest.yml");
  const setupName = artifactNames.nsis;
  if (!fs.existsSync(latestPath)) return;
  const yml = fs.readFileSync(latestPath, "utf8");
  const url = (yml.match(/^  - url: (.+)$/m) || [])[1];
  const size = Number((yml.match(/^    size: (\d+)$/m) || [])[1]);
  const hash = (yml.match(/^    sha512: (.+)$/m) || [])[1];
  const setupPath = path.join(dist, setupName);
  if (url !== setupName) throw new Error(`latest.yml url mismatch: expected ${setupName}, got ${url}`);
  if (!fs.existsSync(setupPath)) throw new Error(`latest.yml points to missing file: ${setupName}`);
  const stat = fs.statSync(setupPath);
  if (size !== stat.size) throw new Error(`latest.yml size mismatch: expected ${stat.size}, got ${size}`);
  const actual = sha512(setupPath);
  if (hash !== actual) throw new Error("latest.yml sha512 mismatch");
  console.log(`latest.yml verified against ${setupName}`);
}

function collect(targets) {
  const expected = targets.map((target) => artifactNames[target]).filter(Boolean);
  const files = [...expected];
  if (targets.includes("nsis")) {
    files.push(`HongSuan-Setup-v${pkg.version}-x64.exe.blockmap`, "latest.yml");
  }
  console.log("\nRelease artifacts:");
  for (const name of files) {
    const file = path.join(dist, name);
    if (!fs.existsSync(file)) {
      console.error(`- MISSING: ${name}`);
      continue;
    }
    const stat = fs.statSync(file);
    console.log(`- ${name} | ${stat.size} bytes | SHA256 ${sha256(file)}`);
  }
  if (targets.includes("nsis") && !fs.existsSync(path.join(dist, "latest.yml"))) {
    console.warn("WARNING: latest.yml not found. Auto-update will not work unless it is uploaded to the release.");
  } else if (targets.includes("nsis")) {
    verifyLatestYml();
  }
}

const targets = [];
let notesOnly = false;
let checkOnly = false;
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === "--target") targets.push(process.argv[++i]);
  else if (arg === "--check-only") checkOnly = true;
  else if (arg === "--notes-only") notesOnly = true;
}
if (!targets.length && !notesOnly && !checkOnly) targets.push("nsis");
const unknown = targets.filter((target) => !artifactNames[target]);
if (unknown.length) {
  console.error(`Unsupported target(s): ${unknown.join(", ")}. Supported: ${Object.keys(artifactNames).join(", ")}`);
  process.exit(1);
}

runCheck();
if (checkOnly) process.exit(0);
makeNotes();
if (notesOnly) process.exit(0);
for (const target of targets) build(target);
collect(targets);
