#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const docsDir = path.join(root, "docs");

function read(rel) { return fs.readFileSync(path.join(docsDir, rel), "utf8"); }

const required = [
  "index.html",
  "app.js",
  "sw.js",
  "build-info.js",
  "error_report.js",
  "feedback.js",
  "pwa.js",
  "download.js"
];

for (const file of required) {
  if (!fs.existsSync(path.join(docsDir, file))) throw new Error(`missing file: ${file}`);
}

const html = read("index.html");
for (const file of ["build-info.js", "error_report.js", "feedback.js", "pwa.js"]) {
  if (!html.includes(`<script defer src="${file}"></script>`)) throw new Error(`index.html missing deferred script: ${file}`);
}

const sw = read("sw.js");
if (!/(^const CACHE\s*=\s*"hongsuan-)/m.test(sw)) throw new Error("sw.js cache version missing");
if (!sw.includes("build-info.js") || !sw.includes("error_report.js")) throw new Error("sw.js precache missing build files");

const info = read("build-info.js");
if (!info.includes("version") || !info.includes("cacheVersion")) throw new Error("build-info.js invalid");

console.log("static smoke passed");

