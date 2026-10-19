#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const docsDir = path.join(root, "docs");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const version = pkg.version;

function shortCommit() {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  } catch (e) {
    return "local";
  }
}

const commit = shortCommit();
const builtAt = new Date().toISOString().slice(0, 10);
const cacheVersion = `hongsuan-v${version.replace(/\./g, "-")}-${commit}`;

const info = {
  version,
  release: `v${version}`,
  commit,
  builtAt,
  cacheVersion
};

fs.writeFileSync(
  path.join(docsDir, "build-info.js"),
  `/* 泓算网页版 - 构建信息（构建脚本生成，请勿手工改） */\nwindow.__HS_BUILD_INFO = ${JSON.stringify(info, null, 2)};\n`
);

const swPath = path.join(docsDir, "sw.js");
let sw = fs.readFileSync(swPath, "utf8");
sw = sw.replace(/const CACHE\s*=\s*"([^"]+)";/, `const CACHE = "${cacheVersion}";`);
fs.writeFileSync(swPath, sw);

const downloadPath = path.join(docsDir, "download.js");
let download = fs.readFileSync(downloadPath, "utf8");
download = download.replace(/var HS_RELEASE\s*=\s*"[^"]+";/, `var HS_RELEASE = "${info.release}";`);
fs.writeFileSync(downloadPath, download);

const indexPath = path.join(docsDir, "index.html");
let indexHtml = fs.readFileSync(indexPath, "utf8");
indexHtml = indexHtml
  .replace(/(<title>泓算 · 桥涵设计流量推求 )v[\d.]+/, `$1${info.release}`.replace(`$1`, `$1`))
  .replace(/(📲 下载桌面版 )v[\d.]+/, `$1${info.release}`.replace(`$1`, `$1`));
fs.writeFileSync(indexPath, indexHtml);

console.log(`build info updated: ${info.release} ${commit} ${cacheVersion}`);
