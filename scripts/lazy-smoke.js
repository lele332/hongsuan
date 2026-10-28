#!/usr/bin/env node
/* lazy-smoke.js — 懒加载专项回归（2026-10-28 全面升级配套）
 * 验证：① 启动态导入/导出/OCR 重型库未加载
 *       ② T1 示例渲染后 echarts 自动按需加载并出现 canvas 图
 *       ③ 侧栏进入暴雨页后 leaflet 自动按需加载并出图
 *       ④ 全程无 JS 异常
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const http = require("http");

const root = path.resolve(__dirname, "..");
const docsDir = path.join(root, "docs");
const edgePath = process.env.HS_EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "hs-lazy-"));
  const proc = spawn(edgePath, [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`
  ], { stdio: "ignore" });
  return { proc, profile };
}
async function fetchJson(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try { const res = await fetch(url); if (res.ok) return await res.json(); } catch (e) {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error("browser debugging endpoint not ready");
}
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.listeners = [];
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message)); else resolve(msg.result);
        return;
      }
      for (const fn of this.listeners) fn(msg);
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })); });
  }
  onEvent(fn) { this.listeners.push(fn); }
}
async function waitFor(expr, want, cdp, timeoutMs, label) {
  const t0 = Date.now();
  for (;;) {
    const r = await cdp.send("Runtime.evaluate", { expression: expr, returnByValue: true });
    if (r.result && r.result.value === want) return;
    if (Date.now() - t0 > timeoutMs) throw new Error(`lazy-smoke failed: ${label} 等待超时 (${expr} => ${JSON.stringify(r.result && r.result.value)})`);
    await new Promise(r2 => setTimeout(r2, 300));
  }
}
async function main() {
  const dbgPort = 9223 + Math.floor(Math.random() * 2000);
  const httpPort = 18931;
  const srv = await startServer(httpPort);
  const handle = startEdge(dbgPort);
  let failed = false;
  try {
    const targets = await fetchJson(`http://127.0.0.1:${dbgPort}/json/list`);
    const pageTarget = targets.find(t => t.type === "page");
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) throw new Error("no page target");
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    const cdp = new CDP(ws);
    const errors = [];
    cdp.onEvent((msg) => {
      if (msg.method === "Runtime.exceptionThrown") {
        errors.push((msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text || "runtime exception"));
      }
    });
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${httpPort}/` });
    await new Promise(r => setTimeout(r, 2500));

    /* ① 启动态：XLSX/pdf/docx/jszip/tesseract 未加载（echarts/L 随演示/地图按需加载） */
    const bootChecks = [
      ["typeof window.XLSX === \x27undefined\x27", true],
      ["typeof window.pdfjsLib === \x27undefined\x27", true],
      ["typeof window.docx === \x27undefined\x27", true],
      ["typeof window.JSZip === \x27undefined\x27", true],
      ["typeof window.Tesseract === \x27undefined\x27", true],
      ["typeof window.hsLoad === \x27function\x27", true],
      ["window.__hsAppBooted === true", true],
      ["(document.getElementById(\x27chart\x27)||{}).innerHTML.length > 2000", true]
    ];
    for (const [expr, expected] of bootChecks) {
      const r = await cdp.send("Runtime.evaluate", { expression: expr, returnByValue: true });
      if (r.result?.value !== expected) { failed = true; console.error(`lazy-smoke failed(boot): ${expr} => ${JSON.stringify(r.result?.value)}`); }
    }
    console.log("① 启动态：导入/导出/OCR 重型库未加载，SVG 基线图正常");

    /* ② echarts 按需加载出图 */
    await waitFor("!!(window.echarts && window.echarts.init)", true, cdp, 15000, "echarts 按需加载");
    await waitFor("document.querySelector(\x27#echartBox canvas\x27) !== null", true, cdp, 10000, "echartBox canvas");
    console.log("② 适线图：echarts 自动按需加载，canvas 已渲染");

    /* ③ 侧栏导航到暴雨页 → leaflet 按需加载 */
    /* 加固：套件连跑时冷启动可能丢点击，循环点击直到地图出现 */
    {
      const t0 = Date.now();
      for (;;) {
        await cdp.send("Runtime.evaluate", { expression: "(function(){var b=document.querySelector('.hs-tree-item[data-mode=noData]')||document.getElementById('mNoData');if(b)b.click();})()" });
        await new Promise(r => setTimeout(r, 2000));
        const rr = await cdp.send("Runtime.evaluate", { expression: "!!(window.L && window.L.map)", returnByValue: true });
        if (rr.result?.value === true) break;
        if (Date.now() - t0 > 40000) throw new Error("lazy-smoke failed: leaflet 按需加载 等待超时");
      }
    }
    await waitFor("document.querySelector(\x27#spMap .leaflet-pane\x27) !== null", true, cdp, 15000, "leaflet 地图容器");
    console.log("③ 暴雨地图：leaflet 自动按需加载，地图已初始化");

    /* ④ 无 JS 异常 */
    if (errors.length) { failed = true; console.error("lazy-smoke failed: JS 异常\n" + errors.join("\n")); }
    else console.log("④ 全程无 JS 异常");

    if (failed) process.exit(1);
    console.log("\nlazy smoke passed");
  } finally {
    try { handle.proc.kill(); } catch (e) {}
    try { fs.rmSync(handle.profile, { recursive: true, force: true }); } catch (e) {}
    srv.close();
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
