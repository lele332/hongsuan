import { gammaincLower, norminv, phiPIII } from "../core/phi.ts";
import { seriesStats, type SeriesStats, type DiscontinuousStats } from "../core/stats.ts";
import { continuousPoints, discontinuousPoints, sseOfPoints, type EmpPoint } from "../core/points.ts";
import { parseSeries } from "../core/parse.ts";
import { RUNOFF_TABLE_SEED, lookupRunoffH } from "../core/runoffTable.ts";
import { compareLineages } from "../core/bayes.ts";
import { manningQ, designFromHistory } from "../core/methodB.ts";
import { rationalFormula, runoffDepthFormula } from "../core/methodC.ts";

// ============ 应用状态与渲染 ============
type FitParams = { mean: number; cv: number; cs: number };
interface AppState {
  mode: string;
  series: number[];
  stats: SeriesStats | DiscontinuousStats | null;
  params: FitParams;
  freq: number;
  pts: EmpPoint[];
  adoptedOverride?: FitParams;
}

const state: AppState = {
  mode: "series",
  series: [],
  stats: null,
  params: { mean: 1065, cv: 0.30, cs: 0.60 },
  freq: 0.01,
  pts: [],
};

// 过渡期 DOM 辅助函数：旧界面由单文件 HTML 迁出，尚未组件化。
// 计算内核已是 strict；网页层后续拆组件时逐步移除 any。
const $ = (id: string): any => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`界面元素不存在：${id}`);
  return el;
};
const fmt = (v: number, d = 2): string =>
  Number(v).toLocaleString("zh-CN", { maximumFractionDigits: d, minimumFractionDigits: d });

declare global {
  interface Window {
    docx: any;
  }
}

// 海森格纸：横轴 X = norminv(1−P)，P 小在左
const XTICKS = [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 80, 90, 95, 99, 99.9];
const XMIN = norminv(1 - 0.999), XMAX = norminv(1 - 0.0001);
const PL = 66, PR = 906, PT = 26, PB = 478;
const sx = (x: number) => PL + (XMAX - x) / (XMAX - XMIN) * (PR - PL);
const pToX = (p: number) => sx(norminv(1 - p));

function niceTicks(lo: number, hi: number, n = 5): number[] {
  const span = hi - lo, step0 = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const norm = step0 / mag, step = (norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10) * mag;
  const t0 = Math.ceil(lo / step) * step, out = [];
  for (let v = t0; v <= hi + 1e-9; v += step) out.push(v);
  return out;
}

function render() {
  const { params, freq } = state;
  $("cvShow").textContent = params.cv.toFixed(3);
  $("csShow").textContent = params.cs.toFixed(2);
  $("ratioShow").textContent = (params.cs / params.cv).toFixed(1);

  // 结果
  const phi = phiPIII(freq, params.cs), kp = 1 + phi * params.cv, q = params.mean * kp;
  $("outQ").textContent = fmt(q, 0);
  $("outPhi").textContent = phi.toFixed(3);
  $("outKp").textContent = kp.toFixed(3);

  // 经验点（calcFromSeries 预存，含特大洪水标记）
  const pts = state.pts;
  if (pts.length) {
    $("stSse").textContent = fmt(sseOfPoints(pts, params, phiPIII), 0);
  } else { $("stSse").textContent = "—"; }

  // ---- 绘图 ----
  // 理论曲线：在正态分位空间均匀采样（格纸上等间距，密度均匀）
  // Φ(t) = 0.5(1 + P(1/2, t²/2))，t≥0；对称 Φ(−t) = 1 − Φ(t)
  const normCdf = (t: number) => {
    const P = gammaincLower(0.5, t * t / 2);
    return t >= 0 ? 0.5 * (1 + P) : 0.5 * (1 - P);
  };
  const curvePts = [];
  const NSAMP = 241;
  for (let i = 0; i < NSAMP; i++) {
    const t = XMAX - i * (XMAX - XMIN) / (NSAMP - 1);
    const p = 1 - normCdf(t);
    curvePts.push({ x: sx(t), q: params.mean * (1 + phiPIII(p, params.cs) * params.cv) });
  }
  const dataMax = Math.max(...pts.map(pt => pt.q), ...curvePts.map(pt => pt.q));
  const dataMin = Math.min(...pts.map(pt => pt.q), ...curvePts.map(pt => pt.q), 0);
  const qLo = Math.max(0, dataMin - (dataMax - dataMin) * 0.08);
  const qHi = dataMax + (dataMax - dataMin) * 0.06;
  const sy2 = (q: number) => PB - (q - qLo) / (qHi - qLo) * (PB - PT);

  let s = "";
  s += `<rect x="${PL}" y="${PT}" width="${PR - PL}" height="${PB - PT}" fill="#fdfdfd" stroke="rgba(0,0,0,0.10)" stroke-width="1"/>`;
  // 横网格 + 流量刻度
  for (const t of niceTicks(qLo, qHi, 5)) {
    const y = sy2(t);
    s += `<line x1="${PL}" y1="${y}" x2="${PR}" y2="${y}" stroke="rgba(0,0,0,0.06)"/>`;
    s += `<text x="${PL - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6e6e73">${fmt(t, 0)}</text>`;
  }
  // 纵网格 + 频率刻度（海森）
  for (const p of XTICKS) {
    const x = pToX(p / 100);
    s += `<line x1="${x}" y1="${PT}" x2="${x}" y2="${PB}" stroke="rgba(0,0,0,0.06)"/>`;
    s += `<text x="${x}" y="${PB + 18}" text-anchor="middle" font-size="11" fill="#6e6e73">${p < 1 ? p : p}</text>`;
  }
  s += `<text x="${(PL + PR) / 2}" y="${PB + 40}" text-anchor="middle" font-size="12" fill="#1d1d1f">频率 P（%）— 海森机率格纸</text>`;
  s += `<text x="20" y="${(PT + PB) / 2}" font-size="12" fill="#1d1d1f" transform="rotate(-90 20 ${(PT + PB) / 2})" text-anchor="middle">流量 Q（m³/s）</text>`;

  // 设计频率竖线
  const fx = pToX(freq);
  s += `<line x1="${fx}" y1="${PT}" x2="${fx}" y2="${PB}" stroke="#007AFF" stroke-width="1" stroke-dasharray="5 4" opacity="0.55"/>`;

  // 理论曲线
  let path = "";
  for (let i = 0; i < curvePts.length; i++) {
    const c = curvePts[i];
    if (c.q > qHi || c.q < qLo) continue;
    path += (path ? "L" : "M") + c.x.toFixed(1) + " " + sy2(c.q).toFixed(1);
  }
  s += `<path d="${path}" fill="none" stroke="#007AFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;

  // 设计点
  s += `<circle cx="${fx}" cy="${sy2(q)}" r="6" fill="#fff" stroke="#007AFF" stroke-width="2.5"/>`;
  s += `<text x="${Math.min(fx + 10, PR - 120)}" y="${sy2(q) - 10}" font-size="12" fill="#007AFF" font-weight="600">Q${(freq * 100).toFixed(2).replace(/\.?0+$/, "")}% = ${fmt(q, 0)}</text>`;

  // 经验点（特大红色大圆 / 实测黑点）
  for (const pt of pts) {
    if (pt.kind === "hist") {
      s += `<circle cx="${pToX(pt.p)}" cy="${sy2(pt.q)}" r="5.5" fill="#ff3b30"/>`;
    } else {
      s += `<circle cx="${pToX(pt.p)}" cy="${sy2(pt.q)}" r="4" fill="#1d1d1f"/>`;
    }
  }
  $("chart").innerHTML = s;
}

function calcFromSeries() {
  const errBox = $("parseErr");
  const series = parseSeries($("series").value);
  const xs = series.values;
  const notices: string[] = [];
  if (series.ignored.length) {
    // 评估报告坑1修复：静默过滤 → 明示忽略项（截断显示，防超长粘贴刷屏）
    const shown = series.ignored.slice(0, 5).join("、");
    notices.push(`已忽略 ${series.ignored.length} 个无效值（${shown}${series.ignored.length > 5 ? " 等" : ""}）`);
  }
  if (xs.length < 3) {
    errBox.style.display = "block";
    errBox.textContent = "至少需要 3 个有效流量值（当前 " + xs.length + " 个）。规范建议实测系列不宜少于 30 年。";
    return;
  }
  state.series = xs;
  let st: SeriesStats | DiscontinuousStats;
  let pts: EmpPoint[];
  if ($("hasExtra").checked) {
    try {
      const N = Math.round(+$("inN").value);
      const l = Math.round(+$("inL").value);
      const extraParsed = parseSeries($("extraSeries").value);
      if (extraParsed.ignored.length) {
        notices.push(`特大洪水输入已忽略 ${extraParsed.ignored.length} 个无效值`);
      }
      // 统计参数 + 统一样法经验频率点据：均由内核 points.ts 组装
      const r = discontinuousPoints({
        historicalExtra: extraParsed.values,
        measuredDesc: xs,
        l, N,
      });
      st = r.stats;
      pts = r.points;
      $("stN").textContent = `n=${st.n}，a=${st.a}，l=${l}，N=${N}`;
    } catch (e) {
      errBox.style.display = "block";
      errBox.textContent = "特大洪水输入有误：" + (e instanceof Error ? e.message : String(e));
      return;
    }
  } else {
    st = seriesStats(xs);
    pts = continuousPoints(xs);
    $("stN").textContent = st.n;
  }
  if (notices.length) {
    errBox.style.display = "block";
    errBox.dataset.kind = "notice";
    errBox.textContent = notices.join("；");
  } else {
    errBox.style.display = "none";
    delete errBox.dataset.kind;
  }
  state.stats = st;
  state.pts = pts;
  // 矩法初估 → 滑块与采用参数
  $("cvSlider").value = Math.min(Math.max(st.cv, 0.05), 1.2);
  $("ratioSlider").value = 2;
  state.params = { mean: st.mean, cv: st.cv, cs: 2 * st.cv };
  syncParamInputs();
  $("stMean").textContent = fmt(st.mean, 1);
  $("stSigma").textContent = fmt(st.sigma, 1);
  $("stCv").textContent = st.cv.toFixed(3);
  $("stCs").textContent = ("csMoment" in st ? st.csMoment : st.cs).toFixed(2);
  render();
}

function syncParamInputs() {
  $("inMean").value = state.params.mean.toFixed(1);
  $("inCv").value = state.params.cv.toFixed(3);
  $("inCs").value = state.params.cs.toFixed(2);
  // 适线滑块配套输入框
  if ($("meanIn")) $("meanIn").value = state.params.mean.toFixed(1);
  if ($("cvIn")) $("cvIn").value = state.params.cv.toFixed(3);
  if ($("ratioIn")) $("ratioIn").value = (state.params.cs / state.params.cv).toFixed(2);
}

// ---- 事件 ----
$("btnCalc").onclick = calcFromSeries;
$("cvSlider").oninput = (e: any) => {
  const cv = +e.target.value;
  const ratio = +$("ratioSlider").value;
  state.params = { ...state.params, cv, cs: cv * ratio };
  syncParamInputs(); render();
};
$("ratioSlider").oninput = (e: any) => {
  const ratio = +e.target.value;
  state.params = { ...state.params, cs: state.params.cv * ratio };
  syncParamInputs(); render();
};
// 键入精确值：与滑块双向绑定（键入 → 钳位 → 更新滑块与参数）
$("cvIn").oninput = (e: any) => {
  let cv = parseFloat(e.target.value);
  if (!Number.isFinite(cv) || cv <= 0) return;
  cv = Math.min(1.2, Math.max(0.05, cv));
  const ratio = +$("ratioSlider").value;
  state.params = { ...state.params, cv, cs: cv * ratio };
  $("cvSlider").value = cv;
  render();
};
$("ratioIn").oninput = (e: any) => {
  let ratio = parseFloat(e.target.value);
  if (!Number.isFinite(ratio) || ratio < 1) return;
  ratio = Math.min(8, Math.max(1, ratio));
  state.params = { ...state.params, cs: state.params.cv * ratio };
  $("ratioSlider").value = ratio;
  render();
};
$("meanIn").oninput = (e: any) => {
  const mean = parseFloat(e.target.value);
  if (Number.isFinite(mean) && mean > 0) {
    state.params = { ...state.params, mean };
    render();
  }
};
$("freqSel").onchange = (e: any) => { state.freq = +e.target.value; render(); };
["inMean", "inCv", "inCs"].forEach(id => {
  $(id).oninput = () => {
    const mean = +$("inMean").value, cv = +$("inCv").value, cs = +$("inCs").value;
    if (mean > 0 && cv > 0 && Number.isFinite(cs)) {
      state.params = { mean, cv, cs };
      $("cvSlider").value = Math.min(Math.max(cv, 0.05), 1.2);
      render();
    }
  };
});
$("mSeries").onclick = () => {
  state.mode = "series"; $("mSeries").classList.add("on"); $("mParams").classList.remove("on"); $("mHist").classList.remove("on"); $("mNoData").classList.remove("on");
  $("seriesBox").style.display = ""; $("paramsBox").style.display = "none"; $("histBox").style.display = "none"; $("noDataBox").style.display = "none";
  setFitCardsVisible(true);
};
$("mParams").onclick = () => {
  state.mode = "params"; $("mParams").classList.add("on"); $("mSeries").classList.remove("on"); $("mHist").classList.remove("on"); $("mNoData").classList.remove("on");
  $("seriesBox").style.display = "none"; $("paramsBox").style.display = ""; $("histBox").style.display = "none"; $("noDataBox").style.display = "none";
  syncParamInputs(); setFitCardsVisible(true); render();
};
$("mHist").onclick = () => {
  state.mode = "histB"; $("mHist").classList.add("on"); $("mSeries").classList.remove("on"); $("mParams").classList.remove("on"); $("mNoData").classList.remove("on");
  $("seriesBox").style.display = "none"; $("paramsBox").style.display = "none"; $("histBox").style.display = ""; $("noDataBox").style.display = "none";
  setFitCardsVisible(false);
};
$("mNoData").onclick = () => {
  state.mode = "noData"; $("mNoData").classList.add("on"); $("mSeries").classList.remove("on"); $("mParams").classList.remove("on"); $("mHist").classList.remove("on");
  $("seriesBox").style.display = "none"; $("paramsBox").style.display = "none"; $("histBox").style.display = "none"; $("noDataBox").style.display = "";
  setFitCardsVisible(false); calcMethodC();
};

function setFitCardsVisible(v: boolean) {
  // 方法 B/C 无适线曲线，隐藏图卡/适线卡/比选卡/统计卡
  for (const sel of ["#chartCard", "#fitCard", "#bayesCard", "#statsGrid"]) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el) el.style.display = v ? "" : "none";
  }
}
$("btnT3").onclick = () => {
  $("mParams").click();
  $("inMean").value = "5173.6"; $("inCv").value = "0.331"; $("inCs").value = "1.99";
  state.params = { mean: 5173.6, cv: 0.331, cs: 1.99 };
  $("cvSlider").value = 0.331;
  render();
};

$("hasExtra").onchange = (e: any) => {
  $("extraBox").style.display = e.target.checked ? "" : "none";
};
if (new URLSearchParams(location.search).get("extra") === "1") {
  $("hasExtra").checked = true; $("extraBox").style.display = "";
}

// ===== 线型比选（贝叶斯 / BIC 后验）——与 src/core/bayes.ts 同构 =====
const BAYES_CSS = `
  .brow { display: grid; grid-template-columns: 92px 1fr 120px 90px; gap: 10px; align-items: center; margin: 8px 0; font-size: 13px; }
  .bbar-outer { height: 10px; background: rgba(120,120,128,0.12); border-radius: 5px; overflow: hidden; }
  .bbar-inner { height: 100%; background: var(--blue); border-radius: 5px; transition: width .5s ease; }
  .bw { font-variant-numeric: tabular-nums; font-weight: 500; text-align: right; }
  .bq { font-variant-numeric: tabular-nums; color: var(--text2); text-align: right; }
`;
(function injectBayesCss() { const st = document.createElement("style"); st.textContent = BAYES_CSS; document.head.appendChild(st); })();

function runBayesCompare() {
  const xs = state.series;
  if (!xs || xs.length < 5) {
    alert("线型比选至少需要 5 个实测流量值，请先计算并适线。");
    return;
  }
  try {
    const result = compareLineages(xs);
    const labels: Record<string, string> = {
      P3: "P-Ⅲ（规范采用）",
      GEV: "GEV",
      Gumbel: "Gumbel",
    };
    $("bayesResult").style.display = "";
    $("bayesBars").innerHTML = result.fits.map(f => `
      <div class="brow">
        <span>${labels[f.name]}</span>
        <div class="bbar-outer"><div class="bbar-inner" style="width:${(result.weights[f.name] * 100).toFixed(1)}%"></div></div>
        <span class="bw">${(result.weights[f.name] * 100).toFixed(1)}%</span>
        <span class="bq">Q₁%=${fmt(result.q1p[f.name], 0)}</span>
      </div>`).join("");
    $("bqP3").textContent = fmt(result.q1p.P3, 0);
    $("bqGEV").textContent = fmt(result.q1p.GEV, 0);
    $("bqGu").textContent = fmt(result.q1p.Gumbel, 0);
  } catch (e) {
    alert("线型比选失败：" + (e instanceof Error ? e.message : String(e)));
  }
}
$("btnBayes").onclick = runBayesCompare;

// ===== 方法 B：历史洪水位法（与 src/core/methodB.ts 同构） =====
type HistFieldKey = "Ac" | "Bc" | "nc" | "At" | "Bt" | "nt" | "Ipermil" | "T";
const HIST_FIELDS: Array<[HistFieldKey, string]> = [
  ["Ac", "河槽面积 A꜀（m²）"], ["Bc", "河槽水面宽 B꜀（m）"], ["nc", "河槽糙率 n꜀"],
  ["At", "河滩面积 Aₜ（m²）"], ["Bt", "河滩水面宽 Bₜ（m）"], ["nt", "河滩糙率 nₜ"],
  ["Ipermil", "比降 I（‰）"], ["T", "重现期 T（年）"],
];
(function buildHistRows() {
  const defaults: Array<Record<HistFieldKey, number>> = [
    { Ac: 500, Bc: 100, nc: 0.03, At: 200, Bt: 200, nt: 0.05, Ipermil: 0.5, T: 100 },
    { Ac: 400, Bc: 95, nc: 0.03, At: 150, Bt: 180, nt: 0.05, Ipermil: 0.5, T: 50 },
  ];
  $("histRows").innerHTML = [0, 1].map(i => `
    <div style="margin:12px 0;padding:12px 14px;background:var(--bg);border-radius:10px">
      <div style="font-size:13px;font-weight:500;margin-bottom:6px">第 ${i + 1} 次历史洪水</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        ${HIST_FIELDS.map(([k, label]) => `<div><label style="margin-top:0">${label}</label><input type="number" step="any" id="hf${i}${k}" value="${defaults[i][k]}"></div>`).join("")}
      </div>
    </div>`).join("");
})();

function calcMethodB() {
  const floods = [0, 1].map(i => {
    const g = (k: HistFieldKey) => +$(`hf${i}${k}`).value;
    const s = { Ac: g("Ac"), Bc: g("Bc"), nc: g("nc"), At: g("At"), Bt: g("Bt"), nt: g("nt"), I: g("Ipermil") / 1000 };
    const m = manningQ(s);
    return { Q: m.Q, T: g("T"), vc: m.vc, vt: m.vt };
  });
  const cv = +$("hbCv").value, cs = +$("hbCs").value;
  try {
    const res = designFromHistory(floods, { cv, cs }, state.freq, phiPIII);
    $("histResult").style.display = "";
    $("histResult").innerHTML = `
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr style="color:var(--text2)"><th style="text-align:left;padding:4px">洪水</th><th>Qᵀ（m³/s）</th><th>v꜀（m/s）</th><th>Q̄ᴛᵢ</th></tr>
        ${floods.map((f, i) => `<tr><td style="padding:4px">第${i + 1}次（T=${f.T} 年）</td>
          <td style="text-align:right">${f.Q.toFixed(1)}</td><td style="text-align:right">${f.vc.toFixed(3)}</td>
          <td style="text-align:right">${res.qBars[i].toFixed(1)}</td></tr>`).join("")}
      </table>
      <div class="metrics" style="margin-top:12px">
        <div class="metric"><div class="k">平均流量 Q̄</div><div class="v">${res.mean.toFixed(1)}</div></div>
        <div class="metric"><div class="k">Φ<sub>p</sub> / K<sub>p</sub></div><div class="v">${res.phi.toFixed(3)} / ${res.kp.toFixed(3)}</div></div>
        <div class="metric hl"><div class="k">设计流量 Q<sub>p</sub>（m³/s）</div><div class="v">${res.q.toFixed(1)}</div></div>
      </div>`;
  } catch (e) { const msg = e instanceof Error ? e.message : String(e); $("histResult").style.display = ""; $("histResult").innerHTML = `<div class="err" style="display:block">${msg}</div>`; }
}
$("btnHist").onclick = calcMethodB;
// 糙率表：填入按钮
document.querySelectorAll("#nTable .fillBtn").forEach(item => {
  const btn = item as HTMLButtonElement;
  btn.onclick = () => { $(`hf${btn.dataset.r}${btn.dataset.k}`).value = btn.dataset.n; };
});

// ===== 方法 C：无资料地区（公式计算全部 import 自 core，UI 只负责取数与呈现） =====
function showMethodCError(which: "rc" | "rd", msg: string | null) {
  const out = $(which === "rc" ? "rcOut" : "rdOut");
  const err = $(which === "rc" ? "rcErr" : "rdErr");
  if (msg === null) {
    err.style.display = "none";
    err.textContent = "";
  } else {
    err.style.display = "block";
    err.textContent = msg; // 可见错误块，不再依赖 title 悬浮（评估报告 4.4）
  }
  return out;
}
function calcMethodC() {
  const v = (id: string) => +$(id).value;
  try {
    const Sp = v("rcSp"), n = v("rcN"), psi = v("rcPsi"), tau = v("rcTau"), F = v("rcF");
    const q = rationalFormula({ Sp, n, psi, tau, F });
    showMethodCError("rc", null).textContent = q.toFixed(2);
  } catch (e) {
    showMethodCError("rc", e instanceof Error ? e.message : String(e)).textContent = "—";
  }
  try {
    const phi = v("rdPhi"), h = v("rdH"), z = v("rdZ"), F2 = v("rdF"), b = v("rdBeta"), g = v("rdGamma"), d = v("rdDelta");
    $("rdH").classList.remove("invalid"); $("rdZ").classList.remove("invalid");
    const q = runoffDepthFormula({ psi: phi, h, z, F: F2, beta: b, gamma: g, delta: d });
    showMethodCError("rd", null).textContent = q.toFixed(2);
  } catch (e) {
    showMethodCError("rd", e instanceof Error ? e.message : String(e)).textContent = "—";
  }
  // 查表辅助：点行填入
  document.querySelectorAll("#rdTables .fillBtn").forEach(item => {
    const btn = item as HTMLButtonElement;
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.onclick = () => {
      const d = btn.dataset;
      if (d.psi) $("rdPhi").value = d.psi;
      if (d.h) $("rdH").value = d.h;
      if (d.z) $("rdZ").value = d.z;
      if (d.beta) $("rdBeta").value = d.beta;
      if (d.gamma) $("rdGamma").value = d.gamma;
      if (d.delta) $("rdDelta").value = d.delta;
      calcMethodC();
    };
  });
}
["rcSp", "rcN", "rcPsi", "rcTau", "rcF", "rdPhi", "rdH", "rdZ", "rdF", "rdBeta", "rdGamma", "rdDelta"].forEach(id => {
  $(id).oninput = calcMethodC;
});

// 查 h 工具：内置种子数据 + 双线性插值（内核 runoffTable.ts）
$("lkGo").onclick = () => {
  try {
    const zone = Math.round(+$("lkZone").value);
    const soil = ($("lkSoil") as HTMLSelectElement).value;
    const freq = +$("lkFreq").value;
    const tau = +$("lkTau").value;
    const r = lookupRunoffH(RUNOFF_TABLE_SEED, zone, soil, freq, tau);
    $("rdH").value = String(r.h);
    $("lkOut").textContent = `h=${r.h} mm${r.interpolated ? "（插值）" : ""}`;
    $("lkOut").style.color = "var(--text2)";
    calcMethodC();
  } catch (e) {
    $("lkOut").textContent = e instanceof Error ? e.message : String(e);
    $("lkOut").style.color = "var(--red)";
  }
};

// ===== Word 计算书导出（docx.js 9.5.1，本地 libs/docx.umd.js） =====
function svgToPngDataUrl(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    try {
      const svg = $("chart");
      const xml = new XMLSerializer().serializeToString(svg);
      const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml" }));
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = 940 * 2; c.height = 520 * 2;
        const ctx = c.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("当前浏览器不支持 Canvas 2D 上下文，无法导出适线图"));
          return;
        }
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = url;
    } catch (e) { reject(e); }
  });
}

// 稳健下载：a.click() 后立即 revokeObjectURL 在部分浏览器会中止下载（下载还没开始 blob 就被丢弃）
function downloadBlob(blob: Blob, fileName: string) {
  const legacyNavigator = window.navigator as Navigator & { msSaveOrOpenBlob?: (blob: Blob, fileName: string) => void };
  if (legacyNavigator.msSaveOrOpenBlob) { // 旧版 Edge/IE 兜底
    legacyNavigator.msSaveOrOpenBlob(blob, fileName);
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 30000);
}

function buildReportDocx() {
  const D = window.docx;
  if (!D) { alert("docx 库未加载（web/libs/docx.umd.js）"); return; }
  const p = state.params, freq = state.freq;
  const phi = phiPIII(freq, p.cs), kp = 1 + phi * p.cv, q = p.mean * kp;
  const st: { n: number; mean?: number; cv?: number; cs?: number } = state.stats
    ? {
        n: state.stats.n,
        mean: state.stats.mean,
        cv: state.stats.cv,
        cs: "cs" in state.stats ? state.stats.cs : state.stats.csMoment,
      }
    : { n: state.series.length };
  const freqLabel = { "0.0033": "1/300（特大桥）", "0.01": "1/100（大、中桥）", "0.02": "1/50", "0.04": "1/25" }[String(freq)] || (freq * 100).toFixed(2) + "%";
  const now = new Date();
  const H1 = (t: string) => new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, children: [new D.TextRun({ text: t, bold: true, size: 30 })] });
  const H2 = (t: string) => new D.Paragraph({ heading: D.HeadingLevel.HEADING_2, children: [new D.TextRun({ text: t, bold: true, size: 26 })] });
  const P = (t: string, opt: Record<string, unknown> = {}) => new D.Paragraph({ children: [new D.TextRun({ text: t, size: 22, ...opt })], spacing: { after: 120 } });
  const PB = (label: string, val: string) => new D.Paragraph({ children: [new D.TextRun({ text: label + "：", bold: true, size: 22 }), new D.TextRun({ text: val, size: 22 })], spacing: { after: 60 } });
  const mkTable = (header: string[], rows: Array<Array<string | number>>) => new D.Table({
    width: { size: 100, type: D.WidthType.PERCENTAGE },
    rows: [
      new D.TableRow({ tableHeader: true, children: header.map(h => new D.TableCell({ children: [new D.Paragraph({ children: [new D.TextRun({ text: h, bold: true, size: 20 })] })] })) }),
      ...rows.map(r => new D.TableRow({ children: r.map(c => new D.TableCell({ children: [new D.Paragraph({ children: [new D.TextRun({ text: String(c), size: 20 })] })] })) })),
    ],
  });
  // 频率成果表
  const FREQS = [0.05, 0.1, 0.2, 0.5, 1, 2, 3.33, 5, 10, 20, 50, 90];
  const freqRows = FREQS.map(pp => {
    const ph = phiPIII(pp / 100, p.cs), k = 1 + ph * p.cv;
    return [pp < 1 ? pp.toFixed(2) + " %" : pp.toFixed(2).replace(/\.?0+$/, "") + " %", ph.toFixed(3), k.toFixed(3), (p.mean * k).toFixed(1)];
  });
  // 经验频率表（前 15 项）
  const sorted = [...state.series].sort((a, b) => b - a);
  const empRows = sorted.slice(0, 15).map((qi, i) => [i + 1, qi, ((i + 1) / (sorted.length + 1) * 100).toFixed(2) + " %"]);

  svgToPngDataUrl().then(dataUrl => {
    const doc = new D.Document({
      sections: [{
        children: [
          new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.TextRun({ text: "泓算 · 桥涵设计流量计算书", bold: true, size: 40 })] }),
          new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.TextRun({ text: "（P-Ⅲ 型频率曲线适线法）", size: 24, color: "6e6e73" })], spacing: { after: 240 } }),
          H1("一、计算依据"),
          P("1.《公路工程水文勘测设计规范》JTG C30-2015：第 6.2 节（利用实测流量系列推算设计流量），式 6.2.6：Qp = Q̄(1 + Φp·Cv)；表 1.0.8（设计洪水频率）。"),
          P("2. 理论频率曲线采用皮尔逊Ⅲ型（规范第 6.2.4 条）；Φp 由 P-Ⅲ 分布数值计算（不完全 Γ 函数分位数），经 scipy 独立交叉验证。"),
          H1("二、基本资料"),
          PB("实测系列项数 n", String(st.n ?? sorted.length)),
          PB("系列流量（m³/s，从大到小）", sorted.join("，")),
          mkTable(["序号 m", "流量 Q（m³/s）", "经验频率 Pm = m/(n+1)"], empRows),
          new D.Paragraph({ children: [new D.TextRun({ text: sorted.length > 15 ? "（仅列前 15 项）" : "", size: 18, color: "aeaeb2" })], spacing: { after: 120 } }),
          H1("三、统计参数"),
          PB("矩法初估均值 Q̄", st.mean ? st.mean.toFixed(1) + " m³/s" : "—（参数模式）"),
          PB("矩法初估 Cv", st.cv ? st.cv.toFixed(3) : "—"),
          PB("矩法初估 Cs（仅参考）", st.cs ? st.cs.toFixed(2) : "—"),
          PB("适线采用 Q̄", p.mean.toFixed(1) + " m³/s"),
          PB("适线采用 Cv", p.cv.toFixed(3)),
          PB("适线采用 Cs", p.cs.toFixed(2) + "（= " + (p.cs / p.cv).toFixed(1) + " Cv）"),
          P("按规范 6.2.5，统计参数以适线法确定：Cs 因抽样误差大按经验倍比假定后目估调整，使理论频率曲线与经验点据吻合。", { color: "6e6e73" }),
          H1("四、设计流量计算"),
          PB("设计洪水频率", freqLabel),
          PB("离均系数 Φp", phi.toFixed(4)),
          PB("模比系数 Kp = 1 + Φp·Cv", kp.toFixed(4)),
          PB("设计流量 Qp = Q̄·Kp", q.toFixed(1) + " m³/s"),
          H1("五、频率曲线成果表"),
          mkTable(["频率 P", "Φp", "Kp", "Qp（m³/s）"], freqRows),
          H1("六、适线图"),
          new D.Paragraph({ children: [new D.ImageRun({ type: "png", data: dataUrl.split(",")[1], transformation: { width: 600, height: 332 } })], spacing: { before: 120, after: 120 } }),
          new D.Paragraph({ children: [new D.TextRun({ text: "图：海森机率格纸上的经验点据与 P-Ⅲ 理论频率曲线（横轴频率、纵轴流量 m³/s）", size: 18, color: "6e6e73" })], spacing: { after: 240 } }),
          new D.Paragraph({
            border: { top: { style: D.BorderStyle.SINGLE, size: 1, color: "d9d9d9" } },
            children: [new D.TextRun({ text: "本计算书由泓算 v0.9.0 生成，Φ 值算法经多源交叉验证（scipy 独立实现一致到 1e-6）。计算结果供学习与课程设计参考，工程应用须经注册工程师复核。生成时间：" + now.toLocaleString("zh-CN"), size: 18, color: "6e6e73" })],
          }),
        ],
      }],
    });
    return D.Packer.toBlob(doc).then((blob: Blob) => {
      console.log("DOCX_OK", blob.size);
      downloadBlob(blob, "设计流量计算书_P3适线.docx");
      const b = $("btnReport"), old = b.textContent;
      b.textContent = "已生成 " + Math.round(blob.size / 1024) + " KB，浏览器已开始下载（看下载栏）";
      b.disabled = true;
      setTimeout(() => { b.textContent = old; b.disabled = false; }, 5000);
    });
  }).catch(e => { console.error("DOCX_FAIL", e); alert("计书生成失败：" + (e instanceof Error ? e.message : String(e))); });
}
$("btnReport").onclick = buildReportDocx;

// ===== 参数持久化 + 输入守卫 + 重置默认（v0.8） =====
const LS_KEY = "hongsuan_v09";
const LEGACY_KEYS = ["hongsuan_v08", "hongsuan_v07"]; // 旧键：读取迁移后不再写回
const HIST_IDS = ["hf0Ac","hf0Bc","hf0nc","hf0At","hf0Bt","hf0nt","hf0Ipermil","hf0T","hf1Ac","hf1Bc","hf1nc","hf1At","hf1Bt","hf1nt","hf1Ipermil","hf1T","hbCv","hbCs"];
const NODATA_IDS = ["rcSp","rcN","rcPsi","rcTau","rcF","rdPhi","rdH","rdZ","rdF","rdBeta","rdGamma","rdDelta"];
// 持久化迁移链：v9 = {schemaVersion:9, ...}；v8/v7 = 无版本号的扁平对象（字段兼容，直接透传）
function migrateState(parsed: any): any {
  if (!parsed || typeof parsed !== "object") return null;
  if (parsed.schemaVersion === 9) return parsed;
  if (parsed.schemaVersion == null) return { ...parsed, schemaVersion: 9 }; // v7/v8 扁平格式
  console.warn("未知持久化版本，按当前版本尽力读取", parsed.schemaVersion);
  return { ...parsed, schemaVersion: 9 };
}
function collectInputs() {
  const pick = (ids: string[]): Record<string, string> => { const o: Record<string, string> = {}; ids.forEach(id => { const el = $(id); if (el) o[id] = el.value; }); return o; };
  return {
    schemaVersion: 9,
    mode: state.mode,
    series: $("series").value, hasExtra: $("hasExtra").checked,
    inN: $("inN").value, inL: $("inL").value, extraSeries: $("extraSeries").value,
    inMean: $("inMean").value, inCv: $("inCv").value, inCs: $("inCs").value,
    freq: state.freq,
    adopted: { ...state.params },
    hist: pick(HIST_IDS), nodata: pick(NODATA_IDS),
  };
}
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function markSaved() {
  const el = $("saveHint"); if (!el) return;
  el.classList.add("on"); setTimeout(() => el.classList.remove("on"), 900);
}
function saveAll() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(collectInputs())); markSaved(); } catch (e) { /* 隐私模式等场景静默 */ }
}
function scheduleSave() {
  if (saveTimer !== null) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveAll, 400);
}
// 事件委托：任何输入控件变化都触发记忆（滑块/键入/查表填入/模式页签全覆盖）
document.addEventListener("input", (e: any) => { if (e.target && e.target.matches && e.target.matches("input,textarea,select")) scheduleSave(); });
document.addEventListener("change", (e: any) => { if (e.target && e.target.matches && e.target.matches("input,textarea,select")) scheduleSave(); });
// 输入守卫：空值/非数值/越界 min~max → 红框提示（不阻断计算，由计算函数给出语义错误）
function checkNum(el: HTMLInputElement) {
  const raw = el.value.trim();
  let bad = raw === "";
  if (!bad) {
    const v = parseFloat(raw);
    bad = !Number.isFinite(v);
    if (!bad && el.min !== "" && v < +el.min) bad = true;
    if (!bad && el.max !== "" && v > +el.max) bad = true;
  }
  el.classList.toggle("invalid", bad);
  return !bad;
}
document.querySelectorAll("input[type=number]").forEach(item => {
  const el = item as HTMLInputElement;
  el.addEventListener("input", () => checkNum(el));
  el.addEventListener("blur", () => { if (el.value.trim() === "") { el.classList.add("invalid"); } });
});
function restoreAll() {
  // v0.9 起带 schemaVersion 与迁移链；旧版扁平数据经迁移函数读入
  let d: any = null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      d = migrateState(parsed);
    } else {
      for (const k of LEGACY_KEYS) {
        const legacy = localStorage.getItem(k);
        if (legacy) { d = migrateState(JSON.parse(legacy)); break; }
      }
    }
  } catch (e) { d = null; }
  if (!d || typeof d !== "object") return null;
  if (typeof d.series === "string") $("series").value = d.series;
  if (d.hasExtra) { $("hasExtra").checked = true; $("extraBox").style.display = ""; }
  if (d.inN != null) $("inN").value = d.inN;
  if (d.inL != null) $("inL").value = d.inL;
  if (typeof d.extraSeries === "string") $("extraSeries").value = d.extraSeries;
  if (d.inMean != null) $("inMean").value = d.inMean;
  if (d.inCv != null) $("inCv").value = d.inCv;
  if (d.inCs != null) $("inCs").value = d.inCs;
  if (d.freq != null && Number.isFinite(+d.freq)) { state.freq = +d.freq; $("freqSel").value = String(d.freq); }
  if (d.adopted && Number.isFinite(d.adopted.mean) && d.adopted.mean > 0 && Number.isFinite(d.adopted.cv) && d.adopted.cv > 0 && Number.isFinite(d.adopted.cs)) {
    state.adoptedOverride = { mean: d.adopted.mean, cv: d.adopted.cv, cs: d.adopted.cs };
  }
  if (d.hist) for (const k in d.hist) { const el = $(k); if (el && d.hist[k] != null) el.value = d.hist[k]; }
  if (d.nodata) for (const k in d.nodata) { const el = $(k); if (el && d.nodata[k] != null) el.value = d.nodata[k]; }
  console.log("RESTORE_MODE", d.mode || "series", "ADOPTED", state.adoptedOverride ? "yes" : "no", "FREQ", state.freq);
  return d.mode || null;
}
$("btnReset").onclick = () => {
  if (confirm("确定清除本机记忆的全部参数并恢复默认示例？")) {
    localStorage.removeItem(LS_KEY);
    for (const k of LEGACY_KEYS) localStorage.removeItem(k);
    location.reload();
  }
};

// 初始渲染：恢复上次状态（模式 + 全部输入 + 适线采用参数）
const urlQ = new URLSearchParams(location.search);
const restoredMode = restoreAll();
const urlMethod = urlQ.get("method");
const startMode = urlMethod === "hist" ? "histB" : urlMethod === "nodata" ? "noData" : (restoredMode || "series");
if (startMode === "params") { $("mParams").click(); }
else if (startMode === "histB") { $("mHist").click(); }
else if (startMode === "noData") { $("mNoData").click(); }
else { $("mSeries").click(); calcFromSeries(); }
if (state.adoptedOverride) {
  state.params = { ...state.adoptedOverride };
  delete state.adoptedOverride;
  $("cvSlider").value = Math.min(Math.max(state.params.cv, 0.05), 1.2);
  $("ratioSlider").value = Math.min(Math.max(state.params.cs / state.params.cv, 1), 8);
  syncParamInputs(); render();
}
if (new URLSearchParams(location.search).get("bayes") === "1") {
  runBayesCompare();
}
if (new URLSearchParams(location.search).get("report") === "1") {
  // 无头验证模式：跳过下载点击，只生成并报字节数
  buildReportDocx();
}
if (new URLSearchParams(location.search).get("autosave") === "1") {
  // 无头验证钩子：立即写一次持久化，供二次访问验证恢复
  saveAll();
}
