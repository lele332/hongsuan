#!/usr/bin/env node
const { spawn } = require("child_process");
const fs = require("fs");
const net = require("net");
const path = require("path");
const os = require("os");
const http = require("http");

const root = path.resolve(__dirname, "..");
const docsDir = path.join(root, "docs");
const buildInfo = fs.readFileSync(path.join(docsDir, "build-info.js"), "utf8");
const ver = (buildInfo.match(/"version":\s*"([^"]+)"/) || [])[1];
if (!ver) throw new Error("cannot read version from build-info.js");

const edgePath = process.env.HS_EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
if (!fs.existsSync(edgePath)) throw new Error("Edge not found: " + edgePath + " (set HS_EDGE_PATH)");

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".md": "text/markdown; charset=utf-8" };

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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "hs-smoke-"));
  const proc = spawn(edgePath, [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`
  ], { stdio: "ignore" });
  return { proc, profile };
}

function stopEdge(handle) {
  try { handle.proc.kill(); } catch (e) {}
  try { fs.rmSync(handle.profile, { recursive: true, force: true }); } catch (e) {}
}

async function fetchJson(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try { const res = await fetch(url); if (res.ok) return await res.json(); } catch (e) {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error("browser debugging endpoint not ready");
}

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.listeners = [];
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
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  onEvent(fn) { this.listeners.push(fn); }
}

async function main() {
  const dbgPort = 9223 + Math.floor(Math.random() * 2000);
  const httpPort = 18924;
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
        errors.push((msg.params.exceptionDetails?.url || "?") + ":" + (msg.params.exceptionDetails?.lineNumber ?? "?") + " " + (msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text || "runtime exception"));
      }
    });
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${httpPort}/` });
    await new Promise(r => setTimeout(r, 2500));
    const checks = [
      [`window.__HS_BUILD_INFO && window.__HS_BUILD_INFO.version`, ver],
      ["window.__hsAppBooted === true", true],
      ["!!document.getElementById('chartEmptyDemo')", true],
      // 自动载入 T1 示例后，适线图 SVG 应已绘制（有大量内容且空态遮罩隐藏）
      ["(document.getElementById('chart')||{}).innerHTML.length > 2000", true],
      ["(document.getElementById('chartEmpty')||{}).style.display === 'none'", true],
      ["document.getElementById('series').value.trim().length > 0", true],
      ["window.__hsDemo === true", true],
      ["!!document.getElementById('hsTree')", true]
    ];
    for (const [expr, expected] of checks) {
      const r = await cdp.send("Runtime.evaluate", { expression: expr, returnByValue: true });
      const actual = r.result && r.result.value;
      if (actual !== expected) {
        failed = true;
        console.error(`browser smoke failed: ${expr} => ${JSON.stringify(actual)}`);
      }
    }
    // ---- 移动端视口二次校验（390px 手机模拟）----
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await new Promise(r => setTimeout(r, 1500));
    const mChecks = [
      ["document.body.classList.contains('hs-mobile-nav')", true],
      ["!!document.querySelector('#hsMobileNav .mHandle')", true],
      ["getComputedStyle(document.getElementById('hsMobileNav')).display !== 'none'", true],
      ["getComputedStyle(document.getElementById('hsTree')).display === 'none'", true],
      ["parseFloat(getComputedStyle(document.body).fontSize) >= 15", true],
      ["parseInt(getComputedStyle(document.getElementById('hsMobileNav')).zIndex) < 60", true],
      ["!!document.getElementById('hsMobileDrawer')", true]
    ];
    for (const [expr, expected] of mChecks) {
      const r = await cdp.send("Runtime.evaluate", { expression: expr, returnByValue: true });
      const actual = r.result && r.result.value;
      if (actual !== expected) {
        failed = true;
        console.error(`mobile smoke failed: ${expr} => ${JSON.stringify(actual)}`);
      }
    }
    // 抽屉交互：点把手 → 抽屉展开且功能项 >= 5 → 点第一项 → 原树联动 + 抽屉收起
    await cdp.send("Runtime.evaluate", { expression: "document.querySelector('#hsMobileNav .mHandle').click()", returnByValue: true });
    await new Promise(r => setTimeout(r, 400));
    {
      const r = await cdp.send("Runtime.evaluate", { expression: "JSON.stringify({open: document.getElementById('hsMobileDrawer').classList.contains('open'), items: document.querySelectorAll('#hsMobileDrawer .hs-tree-item').length})", returnByValue: true });
      const st = JSON.parse(r.result.value);
      if (!st.open || st.items < 5) { failed = true; console.error("mobile smoke failed: drawer", JSON.stringify(st)); }
    }
    await cdp.send("Runtime.evaluate", { expression: "document.querySelector('#hsMobileDrawer .hs-tree-item').click()", returnByValue: true });
    await new Promise(r => setTimeout(r, 400));
    {
      const r = await cdp.send("Runtime.evaluate", { expression: "JSON.stringify({on: document.querySelectorAll('#hsTree .hs-tree-item.on').length > 0, closed: !document.getElementById('hsMobileDrawer').classList.contains('open')})", returnByValue: true });
      const st = JSON.parse(r.result.value);
      if (!st.on || !st.closed) { failed = true; console.error("mobile smoke failed: drawer click linkage", JSON.stringify(st)); }
    }
    await cdp.send("Emulation.clearDeviceMetricsOverride");
        await cdp.send("Emulation.clearDeviceMetricsOverride");
        if (errors.length) {
      failed = true;
      console.error("browser smoke failed: runtime errors", errors);
    }
    if (!failed) console.log("browser smoke passed (v" + ver + ")");
  } catch (err) {
    failed = true;
    console.error(err);
  } finally {
    stopEdge(handle);
    srv.close();
  }
  process.exit(failed ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
