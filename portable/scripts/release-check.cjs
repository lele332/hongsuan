#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const pkgPath = path.join(root, "package.json");
const lockPath = path.join(root, "package-lock.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));

const semver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const errors = [];
if (!semver.test(pkg.version)) errors.push(`package.json version is not valid semver: ${pkg.version}`);
if (lock.version !== pkg.version) errors.push(`package-lock.json version (${lock.version}) != package.json version (${pkg.version})`);
if (!pkg.build || pkg.build.electronVersion !== "44.7.2") errors.push("build.electronVersion must be 44.7.2");
if (!pkg.build || !pkg.build.publish || pkg.build.publish.owner !== "lele332" || pkg.build.publish.repo !== "hongsuan") errors.push("build.publish must target lele332/hongsuan");
for (const file of ["main.js", "preload.js", "index.html", "app.js", "libs/hs-libs-loader.js"]) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`required runtime file is missing: ${file}`);
}
const main = fs.readFileSync(path.join(root, "main.js"), "utf8");
if (!main.includes("app.getVersion()")) errors.push("about dialog/runtime must use app.getVersion() as the version source");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
if (/v1\.0\.\d+/.test(html)) errors.push("index.html contains a hard-coded v1.0.x version");

if (errors.length) {
  console.error("release check FAILED:");
  for (const item of errors) console.error(`- ${item}`);
  process.exit(1);
}
console.log(`release check OK: v${pkg.version}, Electron ${pkg.build.electronVersion}, publish ${pkg.build.publish.owner}/${pkg.build.publish.repo}`);
