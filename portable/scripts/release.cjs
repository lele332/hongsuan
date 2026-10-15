#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const dist = path.join(root, "dist");

function runCheck() {
  const check = spawnSync(process.execPath, [path.join(__dirname, "release-check.cjs")], { stdio: "inherit" });
  if (check.status !== 0) process.exit(check.status || 1);
}

function makeNotes() {
  const notes = spawnSync(process.execPath, [path.join(__dirname, "generate-notes.cjs")], { cwd: root, stdio: "inherit" });
  if (notes.status !== 0) process.exit(notes.status || 1);
}

function build(targets) {
  const cli = require.resolve("electron-builder/cli.js", { paths: [root] });
  const args = [cli, "--win", ...targets, "--x64", "--publish", "never"];
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

function collect() {
  const exeFiles = fs.readdirSync(dist).filter((name) => name.toLowerCase().endsWith(".exe")).map((name) => path.join(dist, name));
  const updateFiles = ["latest.yml", "泓算安装包.exe.blockmap"].map((name) => path.join(dist, name)).filter((file) => fs.existsSync(file));
  console.log("\nRelease artifacts:");
  for (const file of [...exeFiles, ...updateFiles]) {
    const stat = fs.statSync(file);
    console.log(`- ${path.basename(file)} | ${stat.size} bytes | SHA256 ${sha256(file)}`);
  }
  if (!updateFiles.some((file) => path.basename(file) === "latest.yml")) {
    console.warn("WARNING: latest.yml not found. Auto-update will not work unless it is uploaded to the release.");
  }
}

const targets = [];
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === "--target") targets.push(process.argv[++i]);
  else if (arg === "--check-only") { runCheck(); process.exit(0); }
  else if (arg === "--notes-only") { makeNotes(); process.exit(0); }
}
if (!targets.length) targets.push("nsis");

runCheck();
makeNotes();
build(targets);
collect();
