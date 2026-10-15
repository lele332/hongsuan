// P4.1 黄金数据集回归跑法：CDP 驱动真实 UI（Node >= 22，全局 fetch/WebSocket）
// 用法：node core-golden.cjs [cdpPort]（默认 9222；先启动 泓算.exe --remote-debugging-port=9222）
const fs = require("fs");
const path = require("path");
const PORT = process.argv[2] || "9222";
const CASES_FILE = path.join(__dirname, "golden-cases.json");
function getJson(url) {
  return new Promise((resolve, reject) => {
    httpGet(url, (d) => resolve(JSON.parse(d)), reject);
  });
}
function httpGet(url, onData, onErr) {
  require("http").get(url, (r) => { let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => onData(d)); }).on("error", onErr);
}
(async () => {
  const golden = JSON.parse(fs.readFileSync(CASES_FILE, "utf8"));
  const targets = await getJson(`http://127.0.0.1:${PORT}/json`);
  const page = targets.find((t) => t.type === "page");
  if (!page) { console.error("NO_PAGE_TARGET：请先启动 泓算.exe --remote-debugging-port=" + PORT); process.exit(2); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const send = (method, params) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
  await new Promise((r) => (ws.onopen = r));
  const ev = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error("EVAL_EXC: " + (r.exceptionDetails.text || ""));
    return r.result.value;
  };
  const results = [];
  for (const c of golden.cases) {
    try {
      if (c.kind === "series") {
        const seriesText = c.series.join("\\n");
        const out = JSON.parse(await ev(`(async () => {
          document.getElementById("mSeries").click(); await new Promise(r=>setTimeout(r,300));
          const ta = document.getElementById("series");
          ta.value = ${JSON.stringify(seriesText)}.replace(/\\\\n/g, "\\n");
          ta.dispatchEvent(new Event("input"));
          await new Promise(r=>setTimeout(r,300));
          document.getElementById("btnCalc").click(); await new Promise(r=>setTimeout(r,800));
          return JSON.stringify({ mean: parseFloat(document.getElementById("qrMean").textContent), cv: parseFloat(document.getElementById("qrCv").textContent) });
        })()`));
        const okMean = Math.abs(out.mean - c.expect.mean) <= c.expect.tol;
        const okCv = Math.abs(out.cv - c.expect.cv) <= c.expect.tol;
        results.push({ id: c.id, pass: okMean && okCv, detail: `mean=${out.mean} (exp ${c.expect.mean}) cv=${out.cv} (exp ${c.expect.cv})` });
      } else if (c.kind === "autofit") {
        const out = JSON.parse(await ev(`(async () => {
          document.getElementById("btnAutoFit").click(); await new Promise(r=>setTimeout(r,600));
          return JSON.stringify({ M: parseFloat(document.getElementById("ratioSlider").value), warn: document.getElementById("fitMsg").textContent.indexOf("Cs\\u22652Cv") >= 0 });
        })()`));
        const okM = Math.abs(out.M - c.expect.M) <= c.expect.tol;
        results.push({ id: c.id, pass: okM && out.warn === c.expect.warnCs2Cv, detail: `M=${out.M} (exp ${c.expect.M}) warnCs2Cv=${out.warn}` });
      } else if (c.kind === "rational") {
        const i = c.input;
        const out = JSON.parse(await ev(`(async () => {
          document.getElementById("mNoData").click(); await new Promise(r=>setTimeout(r,400));
          const set = (id, v) => { const el = document.getElementById(id); el.value = String(v); el.dispatchEvent(new Event("input")); };
          set("rcSp", ${i.Sp}); set("rcN", ${i.n}); set("rcPsi", ${i.psi}); set("rcTau", ${i.tau}); set("rcF", ${i.F});
          await new Promise(r=>setTimeout(r,500));
          const t = document.getElementById("rcOut").textContent;
          const m = t.match(/([0-9.]+)/);
          return JSON.stringify({ q: m ? parseFloat(m[1]) : null, raw: t.slice(0, 40) });
        })()`));
        const okQ = out.q != null && Math.abs(out.q - c.expect.q) <= c.expect.tol;
        results.push({ id: c.id, pass: okQ, detail: `q=${out.q} (exp ${c.expect.q}) raw=${out.raw}` });
      }
    } catch (e) {
      results.push({ id: c.id, pass: false, detail: "EXC " + e.message });
    }
  }
  const failed = results.filter((r) => !r.pass);
  for (const r of results) console.log((r.pass ? "PASS" : "FAIL") + "  " + r.id + "  " + r.detail);
  console.log(failed.length ? `GOLDEN: ${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL` : `GOLDEN: ${results.length}/${results.length} PASS`);
  ws.close();
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error("RUNNER_FAIL " + e.message); process.exit(2); });
