#!/usr/bin/env node
/* mobile-smoke.js — 手机端溢出自动检测器（2026-10-29 方法论落地）
 * 模拟 390x844 视口，逐功能页切换，自动扫出真实溢出问题：
 *  - 可滚动容器内的宽表格 = 可接受（手机左右滑看表是标准模式）
 *  - svg 图表内部裁剪 = 可接受
 *  - 文档级横向溢出 / 被裁剪的交互元素(input/select/button/a) = 真问题
 * 用法：node scripts/mobile-smoke.js [--strict]  --strict 下有问题退出码非0
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const http = require("http");

const root = path.resolve(__dirname, "..");
const docsDir = path.join(root, "docs");
const edgePath = process.env.HS_EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const STRICT = process.argv.includes("--strict");
if (!fs.existsSync(edgePath)) throw new Error("Edge not found: " + edgePath);

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".jpg": "image/jpeg" };
function startServer(port) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split("?")[0]);
      let fp = path.join(docsDir, urlPath === "/" ? "index.html" : urlPath);
      if (!fp.startsWith(docsDir)) { res.writeHead(403); res.end(); return; }
      fs.readFile(fp, (err, data) => {
        if (err) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { "Content-Type": MIME[path.extname(fp).toLowerCase()] || "application/octet-stream" });
        res.end(data);
      });
    });
    srv.listen(port, "127.0.0.1", () => resolve(srv));
  });
}
function startEdge(port) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "hs-mob-"));
  const proc = spawn(edgePath, ["--headless=new", "--disable-gpu", "--no-first-run", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`], { stdio: "ignore" });
  return { proc, profile };
}
async function fetchJson(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try { const res = await fetch(url); if (res.ok) return await res.json(); } catch (e) {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error("dbg not ready");
}
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map();
    ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && this.pending.has(m.id)) { const p = this.pending.get(m.id); this.pending.delete(m.id); m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result); } }); }
  send(method, params = {}) { const id = ++this.id; return new Promise((res, rej) => { this.pending.set(id, { resolve: res, reject: rej }); this.ws.send(JSON.stringify({ id, method, params })); }); }
}

const SCAN_FN = [
'(function () {',
'  var vw = document.documentElement.clientWidth;',
'  function clipKind(el) {',
'    var p = el.parentElement;',
'    while (p && p !== document.body) {',
'      var ovx = getComputedStyle(p).overflowX;',
'      if (ovx === "auto" || ovx === "scroll") return "scrollable";',
'      if (ovx === "hidden" || ovx === "clip") {',
'        if (el.closest("svg")) return "svg";',
'        return "hidden";',
'      }',
'      p = p.parentElement;',
'    }',
'    return "doc";',
'  }',
'  var offenders = [];',
'  var all = document.querySelectorAll("body *");',
'  for (var i = 0; i < all.length; i++) {',
'    var el = all[i];',
'    if (el.offsetParent === null && getComputedStyle(el).position !== "fixed") continue;',
'    var r = el.getBoundingClientRect();',
'    if (r.width === 0 && r.height === 0) continue;',
'    var over = Math.max(r.right - vw, -r.left);',
'    if (over > 2) {',
'      var kind = clipKind(el);',
'      if (kind === "scrollable" || kind === "svg") continue;',
'      var interactive = /^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(el.tagName);',
'      var desc = el.tagName.toLowerCase();',
'      if (el.id) desc += "#" + el.id;',
'      var cls = (el.className && typeof el.className === "string") ? el.className.trim().split(/\\s+/).slice(0, 2).join(".") : "";',
'      if (cls) desc += "." + cls;',
'      offenders.push({ desc: desc, over: Math.round(over), right: Math.round(r.right), w: Math.round(r.width), kind: kind, interactive: interactive });',
'    }',
'  }',
'  offenders.sort(function (a, b) { return b.over - a.over; });',
'  var seen = {};',
'  var uniq = [];',
'  for (var j = 0; j < offenders.length && uniq.length < 8; j++) {',
'    if (!seen[offenders[j].desc]) { seen[offenders[j].desc] = 1; uniq.push(offenders[j]); }',
'  }',
'  return { vw: vw, docW: document.documentElement.scrollWidth,',
'    realCount: offenders.filter(function (o) { return o.kind === "doc" || o.interactive; }).length,',
'    top: uniq };',
'})()'
].join("\n");

async function main() {
  const dbgPort = 9223 + Math.floor(Math.random() * 2000);
  const httpPort = 18933;
  const srv = await startServer(httpPort);
  const handle = startEdge(dbgPort);
  try {
    const targets = await fetchJson(`http://127.0.0.1:${dbgPort}/json/list`);
    const page = targets.find(t => t.type === "page");
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const cdp = new CDP(ws);
    await cdp.send("Page.enable"); await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${httpPort}/` });
    await new Promise(r => setTimeout(r, 3000));
    const modes = await cdp.send("Runtime.evaluate", {
      expression: "Array.from(new Set(Array.from(document.querySelectorAll('.hs-tree-item[data-mode]')).map(function(b){return b.dataset.mode}).filter(Boolean)))",
      returnByValue: true
    });
    const modeList = modes.result?.value || [];
    console.log("390px 视口检测，模式:", modeList.join(","));
    let totalBad = 0;
    const all = ["(默认)"].concat(modeList);
    for (const m of all) {
      if (m !== "(默认)") {
        await cdp.send("Runtime.evaluate", { expression: `(function(){var b=document.querySelector('.hs-tree-item[data-mode="${m}"]');if(b)b.click();})()` });
        await new Promise(r => setTimeout(r, 700));
      }
      const r = await cdp.send("Runtime.evaluate", { expression: SCAN_FN, returnByValue: true });
      const scan = r.result?.value;
      const bad = scan.docW > scan.vw + 2 || scan.realCount > 0;
      if (bad) totalBad++;
      console.log(`\n[${m}] 文档宽${scan.docW}/${scan.vw}${scan.docW > scan.vw + 2 ? " ←横向溢出!" : ""} 真实问题${scan.realCount}个`);
      for (const o of scan.top) console.log(`   ${o.desc}  溢出${o.over}px (${o.kind}${o.interactive ? " 交互元素!" : ""})`);
    }
    console.log(`\n==== ${all.length} 个模式, ${totalBad} 个存在真实问题 ====`);
    if (STRICT && totalBad > 0) process.exit(1);
  } finally {
    try { handle.proc.kill(); } catch (e) {}
    try { fs.rmSync(handle.profile, { recursive: true, force: true }); } catch (e) {}
    srv.close();
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
