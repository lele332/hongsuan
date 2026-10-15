#!/usr/bin/env node
const { spawn } = require("child_process");
const fs = require("fs");
const net = require("net");
const path = require("path");
const os = require("os");

const root = path.resolve(__dirname, "..");
const docsDir = path.join(root, "docs");
const port = 9223 + Math.floor(Math.random() * 2000);
const edgePath = process.env.HS_EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
if (!fs.existsSync(edgePath)) {
  throw new Error("Edge not found: " + edgePath + " (set HS_EDGE_PATH)");
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

async function fetchJson(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error("browser debugging endpoint not ready");
}

function startEdge(port) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "hs-smoke-"));
  const proc = spawn(edgePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`
  ], { stdio: "ignore" });
  return { proc, profile };
}

function stopEdge(handle) {
  try { handle.proc.kill(); } catch (e) {}
  try { fs.rmSync(handle.profile, { recursive: true, force: true }); } catch (e) {}
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.listeners = [];
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
  const port = await getFreePort();
  const handle = startEdge(port);
  let failed = false;
  try {
    const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
    const pageTarget = targets.find(t => t.type === "page");
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) throw new Error("no page target");
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });
    const cdp = new CDP(ws);
    const errors = [];
    cdp.onEvent((msg) => {
      if (msg.method === "Runtime.exceptionThrown") {
        errors.push(msg.params.exceptionDetails?.exception?.description || "runtime exception");
      }
    });
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.navigate", { url: "http://127.0.0.1:18924/" });
    await new Promise(r => setTimeout(r, 1500));
    const checks = [
      ["window.__HS_BUILD_INFO && window.__HS_BUILD_INFO.version", "1.0.13"],
      ["document.getElementById('buildInfo') && document.getElementById('buildInfo').textContent.includes('版本 v1.0.13')", true],
      ["!!document.getElementById('fbHoney')", true],
      ["!!document.getElementById('btnCheckUpdate')", true]
    ];
    for (const [expr, expected] of checks) {
      const r = await cdp.send("Runtime.evaluate", { expression: expr, returnByValue: true });
      const actual = r.result && r.result.value;
      if (actual !== expected) {
        failed = true;
        console.error(`browser smoke failed: ${expr} => ${JSON.stringify(actual)}`);
      }
    }
    if (errors.length) {
      failed = true;
      console.error("browser smoke failed: runtime errors", errors);
    }
    if (!failed) console.log("browser smoke passed");
  } catch (err) {
    failed = true;
    console.error(err);
  } finally {
    stopEdge(handle);
  }
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
