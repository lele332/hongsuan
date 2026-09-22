// ============================================================
// 线型比选（贝叶斯）：P-Ⅲ vs GEV vs Gumbel
// 方法：各线型极大似然拟合（Nelder-Mead）→ BIC →
//       后验模型权重 w ∝ exp(−BIC/2)（Schwarz/Burnham-Anderson，
//       即 Bayes factor 的大样本近似，Kass & Raftery 1995 解读）
// 约定：GEV 参数 (μ, σ, ξ)，t = [1+ξ(x−μ)/σ]^(−1/ξ)，
//       密度 f = (1/σ)·t^(1+ξ)·e^(−t)（scipy genextreme 的 c = −ξ）
// ============================================================

import { gammaln } from "./phi.ts";

// ---------- Nelder-Mead 单纯形优化 ----------
export interface NMResult { x: number[]; fx: number; iterations: number; converged: boolean; }

export function nelderMead(
  f: (x: number[]) => number,
  x0: number[],
  opts: { maxIter?: number; tol?: number; step?: number[] } = {},
): NMResult {
  const n = x0.length;
  const maxIter = opts.maxIter ?? 2000;
  const tol = opts.tol ?? 1e-9;
  const step = opts.step ?? x0.map((v, i) => (Math.abs(v) < 1 ? 0.15 : 0.05 * Math.abs(v)));
  // 单纯形：初始顶点 + 每维扰动
  const pts: Array<{ x: number[]; fx: number }> = [];
  pts.push({ x: [...x0], fx: f(x0) });
  for (let i = 0; i < n; i++) {
    const xi = [...x0];
    xi[i] += (xi[i] === 0 ? 0.15 : step[i]);
    pts.push({ x: xi, fx: f(xi) });
  }
  let iter = 0;
  for (; iter < maxIter; iter++) {
    pts.sort((a, b) => a.fx - b.fx);
    // 收敛：最好最差目标差
    if (Math.abs(pts[n].fx - pts[0].fx) < tol * (Math.abs(pts[0].fx) + 1e-30)) break;
    const xbar = new Array(n).fill(0);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) xbar[i] += pts[j].x[i];
    for (let i = 0; i < n; i++) xbar[i] /= n;
    const worst = pts[n];
    // 反射
    const xr = xbar.map((v, i) => v + (v - worst.x[i]));
    const fr = f(xr);
    if (fr < pts[0].fx) {
      // 扩展
      const xe = xbar.map((v, i) => v + 2 * (v - worst.x[i]));
      const fe = f(xe);
      if (fe < fr) pts[n] = { x: xe, fx: fe }; else pts[n] = { x: xr, fx: fr };
    } else if (fr < pts[n - 1].fx) {
      pts[n] = { x: xr, fx: fr };
    } else {
      // 收缩
      const xc = xbar.map((v, i) => v + 0.5 * (worst.x[i] - v));
      const fc = f(xc);
      if (fc < pts[n].fx) {
        pts[n] = { x: xc, fx: fc };
      } else {
        // 整体压缩
        for (let i = 1; i <= n; i++) {
          pts[i].x = pts[i].x.map((v, j) => pts[0].x[j] + 0.5 * (v - pts[0].x[j]));
          pts[i].fx = f(pts[i].x);
        }
      }
    }
  }
  pts.sort((a, b) => a.fx - b.fx);
  return { x: pts[0].x, fx: pts[0].fx, iterations: iter, converged: iter < maxIter };
}

// ---------- 对数似然 ----------
const BAD = -1e100;

// P-Ⅲ（三参数 Gamma）：θ = [a0, lnβ, lnα]
export function logL_P3(theta: number[], xs: number[]): number {
  const a0 = theta[0], beta = Math.exp(theta[1]), alpha = Math.exp(theta[2]);
  let s = 0;
  for (const x of xs) {
    if (x <= a0) return BAD;
    s += (alpha - 1) * Math.log(x - a0) - beta * (x - a0);
  }
  return xs.length * (alpha * Math.log(beta) - gammaln(alpha)) + s;
}

// GEV：θ = [μ, lnσ, ξ]
export function logL_GEV(theta: number[], xs: number[]): number {
  const mu = theta[0], sigma = Math.exp(theta[1]), xi = theta[2];
  let s = -xs.length * Math.log(sigma);
  if (Math.abs(xi) < 1e-8) {
    // Gumbel 极限
    for (const x of xs) {
      const z = (x - mu) / sigma;
      s += -z - Math.exp(-z);
    }
    return s;
  }
  for (const x of xs) {
    const u = 1 + (xi * (x - mu)) / sigma;
    if (u <= 0) return BAD;
    const lnT = -Math.log(u) / xi;
    s += (1 + xi) * lnT - Math.exp(lnT);
  }
  return s;
}

// Gumbel：θ = [μ, lnσ]
export function logL_Gumbel(theta: number[], xs: number[]): number {
  const mu = theta[0], sigma = Math.exp(theta[1]);
  let s = -xs.length * Math.log(sigma);
  for (const x of xs) {
    const z = (x - mu) / sigma;
    s += -z - Math.exp(-z);
  }
  return s;
}

// ---------- 拟合与比选 ----------
export interface ModelFit {
  name: "P3" | "GEV" | "Gumbel";
  k: number;            // 参数个数
  logL: number;
  aic: number;         // 2k − 2logL
  bic: number;          // k ln n − 2logL
  params: number[];    // 原始参数（见各模型注释）
  paramsPretty: Record<string, number>;
}

function fitOne(name: ModelFit["name"], k: number, logL: (t: number[], xs: number[]) => number,
  starts: number[][], xs: number[], pretty: (t: number[]) => Record<string, number>): ModelFit {
  let best: NMResult | null = null;
  for (const st of starts) {
    const r = nelderMead((t) => -logL(t, xs), st);
    if (!best || r.fx < best.fx) best = r;
  }
  const logL_val = -best!.fx;
  const n = xs.length;
  return {
    name, k, logL: logL_val,
    aic: 2 * k - 2 * logL_val,
    bic: k * Math.log(n) - 2 * logL_val,
    params: best!.x,
    paramsPretty: pretty(best!.x),
  };
}

export interface CompareResult {
  fits: ModelFit[];
  weights: Record<string, number>; // 模型名 → 后验权重（Σ=1）
  best: ModelFit["name"];
  q1p: Record<string, number>;    // 各模型设计值 Q(1%)
}

function qFromP3(t: number[], p: number, gammaQ: (p: number, a: number) => number): number {
  const a0 = t[0], beta = Math.exp(t[1]), alpha = Math.exp(t[2]);
  // p 为水文超过概率 → 下侧分位 1−p
  return a0 + gammaQ(1 - p, alpha) / beta;
}
function qFromGEV(t: number[], p: number): number {
  const mu = t[0], sigma = Math.exp(t[1]), xi = t[2];
  // CDF F = exp(−t) → P(X ≥ x)=p ⇔ F = 1−p → t = −ln(1−p)
  const T = -Math.log(1 - p);
  if (Math.abs(xi) < 1e-8) return mu - sigma * Math.log(T);
  return mu + (sigma / xi) * (Math.pow(T, -xi) - 1);
}
function qFromGumbel(t: number[], p: number): number {
  const mu = t[0], sigma = Math.exp(t[1]);
  // P(X ≥ x)=p → F=1−p → −ln(1−p) = e^{−z} → z = −ln(−ln(1−p))
  return mu - sigma * Math.log(-Math.log(1 - p));
}

import { gammaQuantile } from "./phi.ts";

export function compareLineages(xs: number[]): CompareResult {
  const n = xs.length;
  if (n < 5) throw new Error("线型比选至少需要 5 个数据点");
  const sorted = [...xs].sort((a, b) => a - b);
  const mean = xs.reduce((s, v) => s + v, 0) / n;
  const sd = Math.sqrt(xs.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1));
  const min = sorted[0], max = sorted[n - 1];
  const span = Math.max(max - min, 1e-9);

  // P-Ⅲ 初值：样本矩法（Cs 矩 → α=4/Cs²；a0=mean−2sd 兜底）
  const csM = (() => {
    const m3 = xs.reduce((s, v) => s + (v - mean) ** 3, 0) / n;
    return m3 / sd ** 3;
  })();
  const a0est = Math.min(mean - 2 * sd, min - 0.1 * span);
  const alphaEst = Math.min(Math.max(4 / Math.max(csM * csM, 0.04), 1.5), 5000);
  const betaEst = alphaEst / Math.max(mean - a0est, 1e-9);
  const p3Starts = [
    [a0est, Math.log(betaEst), Math.log(alphaEst)],
    [min - 0.5 * span, Math.log(1 / sd), Math.log(4)],
  ];
  // GEV 初值：μ≈mean−0.3σ，σ≈0.7σ，ξ∈{0.1, −0.1}
  const gevStarts = [
    [mean - 0.3 * sd, Math.log(0.7 * sd), 0.1],
    [mean - 0.3 * sd, Math.log(0.7 * sd), -0.1],
  ];
  const guStarts = [[mean - 0.45 * sd, Math.log(0.78 * sd)]];

  const fits: ModelFit[] = [
    fitOne("P3", 3, logL_P3, p3Starts, xs, (t) => ({ a0: t[0], beta: Math.exp(t[1]), alpha: Math.exp(t[2]) })),
    fitOne("GEV", 3, logL_GEV, gevStarts, xs, (t) => ({ mu: t[0], sigma: Math.exp(t[1]), xi: t[2] })),
    fitOne("Gumbel", 2, logL_Gumbel, guStarts, xs, (t) => ({ mu: t[0], sigma: Math.exp(t[1]) })),
  ];

  // BIC 后验权重（Schwarz 近似下的模型后验，均匀先验）
  const minBic = Math.min(...fits.map((f) => f.bic));
  const exps = fits.map((f) => Math.exp(-(f.bic - minBic) / 2));
  const sumExp = exps.reduce((s, v) => s + v, 0);
  const weights: Record<string, number> = {};
  fits.forEach((f, i) => (weights[f.name] = exps[i] / sumExp));

  const q1p: Record<string, number> = {};
  for (const f of fits) {
    if (f.name === "P3") q1p.P3 = qFromP3(f.params, 0.01, gammaQuantile);
    else if (f.name === "GEV") q1p.GEV = qFromGEV(f.params, 0.01);
    else q1p.Gumbel = qFromGumbel(f.params, 0.01);
  }

  const best = fits.reduce((a, b) => (weights[a.name] >= weights[b.name] ? a : b)).name;
  return { fits, weights, best, q1p };
}

// ---------- 确定性随机数（测试用 LCG + 逆变换采样） ----------
export function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Marsaglia-Tsang Γ(α, 1) 采样（α>0）
export function sampleGamma(rnd: () => number, alpha: number): number {
  if (alpha < 1) {
    // Γ(α) = Γ(α+1)·U^{1/α}
    const u = Math.max(rnd(), 1e-15);
    return sampleGamma(rnd, alpha + 1) * Math.pow(u, 1 / alpha);
  }
  const d = alpha - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number, v: number;
    do {
      // Box-Muller 标准正态
      const u1 = Math.max(rnd(), 1e-15), u2 = rnd();
      x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rnd();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

// P-Ⅲ 样本（a0, 1/β 尺度）与 GEV 样本（μ, σ, ξ）
export function sampleP3(rnd: () => number, a0: number, beta: number, alpha: number): number {
  return a0 + sampleGamma(rnd, alpha) / beta;
}
export function sampleGEV(rnd: () => number, mu: number, sigma: number, xi: number): number {
  const u = Math.max(rnd(), 1e-15);
  const t = -Math.log(u);
  if (Math.abs(xi) < 1e-12) return mu - sigma * Math.log(t);
  return mu + (sigma / xi) * (Math.pow(t, -xi) - 1);
}
