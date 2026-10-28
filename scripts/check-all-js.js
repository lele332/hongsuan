#!/usr/bin/env node
/**
 * check-all-js.js — 三道防线之①②（方法论落地，2026-10-28）
 * ① 语法门禁：动态扫描 docs 下全部 .js 并 node --check（杜绝手工清单漏项，教训：sw.js 漏了两天）
 * ② SW 清单完整性：PRECACHE 每个条目必须真实存在于 docs/；
 *    index.html 引用的本地顶层 js 必须全部出现在 PRECACHE（Workbox 思路：清单可校验而非凭记忆维护）
 * 教训来源：1d204f7 起PRECACHE 缺 6 个逗号 → 整个 SW 语法错误静默失效两天 → 微信缓存灾难。
 * 本脚本若在当日存在，git push 前即可拦截。
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DOCS = path.join(__dirname, '..', 'docs');
const errors = [];

// ---------- ① 动态语法扫描 ----------
function collectJs(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(collectJs(p));
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}
const jsFiles = collectJs(DOCS);
for (const f of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  } catch (err) {
    errors.push(`[SYNTAX] ${path.relative(DOCS, f)}\n${err.stderr}`);
  }
}
console.log(`① 语法扫描：${jsFiles.length} 个 .js 全部 node --check`);

// ---------- ② PRECACHE 完整性 ----------
const swSrc = fs.readFileSync(path.join(DOCS, 'sw.js'), 'utf8');
const m = swSrc.match(/const\s+PRECACHE\s*=\s*\[([\s\S]*?)\]/);
if (!m) {
  errors.push('[SW] sw.js 中找不到 PRECACHE 数组（可能语法已坏，先看①的报错）');
} else {
  const entries = [];
  // 逐行提取字符串字面量；任何一个未闭合引号都会被下面 check 拦住，这里宽松提取以给出更精准报错
  for (const line of m[1].split('\n')) {
    const s = line.match(/"([^"]*)"/g);
    if (s) for (const x of s) entries.push(x.slice(1, -1));
  }
  let missing = 0;
  for (const e of entries) {
    if (e === './') continue; // 目录入口即 index.html
    const clean = e.replace(/^\.\//, '');
    if (!fs.existsSync(path.join(DOCS, clean))) {
      errors.push(`[SW-PRECACHE] 条目 "${e}" 在 docs/ 中不存在（ SW install addAll 会整体失败）`);
      missing++;
    }
  }
  console.log(`② PRECACHE 完整性：${entries.length} 条，缺失 ${missing}`);
}

// ---------- ②b index.html 本地脚本必须在 PRECACHE ----------
const html = fs.readFileSync(path.join(DOCS, 'index.html'), 'utf8');
const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(x => x[1])
  .filter(s => !/^https?:/.test(s)); // 只查本地相对路径（CDN 走 runtime 缓存策略）
const precacheSet = new Set(m ? m[1].match(/"([^"]*)"/g)?.map(x => x.slice(1, -1)) || [] : []);
let missList = 0;
for (const s of srcs) {
  if (!precacheSet.has(s)) {
    errors.push(`[SW-COVERAGE] index.html 引用 "${s}" 但不在 PRECACHE 中（首次离线/弱网会 404）`);
    missList++;
  }
}
console.log(`②b HTML 脚本覆盖：${srcs.length} 个本地脚本，未入缓存 ${missList}`);

if (errors.length) {
  console.error('\n===== 检查失败 =====');
  for (const e of errors) console.error(e);
  process.exit(1);
}
console.log('\n✅ 全部通过：语法 / PRECACHE 存在性 / HTML 覆盖率');
