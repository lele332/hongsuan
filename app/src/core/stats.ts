// ============================================================
// 统计参数计算（矩法）—— JTG C30-2015 式 6.2.5 参数初估
// Q̄ = ΣQi/n；σ = √[Σ(Qi−Q̄)²/(n−1)]（无偏）；Cv = σ/Q̄
// Cs 矩法（无偏，仅作初估，适线时按经验倍比调整）：
//   Cs = n·Σ(Qi−Q̄)³ / [(n−1)(n−2)·σ³]
// ============================================================

export interface SeriesStats {
  n: number;
  mean: number;      // 均值 Q̄
  sigma: number;     // 均方差 σ（无偏，n−1）
  cv: number;        // 变差系数
  csMoment: number;  // 矩法偏态系数（初估用）
  kis: number[];     // 模比系数序列 Ki = Qi/Q̄（按输入顺序）
}

export function seriesStats(xs: number[]): SeriesStats {
  const n = xs.length;
  if (n < 2) throw new Error("系列长度至少 2");
  const mean = xs.reduce((s, v) => s + v, 0) / n;
  const d = xs.map((v) => v - mean);
  const s2 = d.reduce((s, v) => s + v * v, 0) / (n - 1);
  const sigma = Math.sqrt(s2);
  if (sigma === 0) throw new Error("系列恒定，无法计算统计参数");
  const m3 = d.reduce((s, v) => s + v * v * v, 0);
  const csMoment = (n * m3) / ((n - 1) * (n - 2) * Math.pow(sigma, 3));
  return { n, mean, sigma, cv: sigma / mean, csMoment, kis: xs.map((v) => v / mean) };
}

// 适线误差函数：经验点据 {(p, q)} 与理论曲线的离差平方和
// （优化适线/对比多条 Cs 曲线时使用；目估适线交给人）
export function sseOfFit(
  points: Array<{ p: number; q: number }>,
  params: { mean: number; cv: number; cs: number },
  phiFn: (p: number, cs: number) => number,
): number {
  let sse = 0;
  for (const pt of points) {
    const qTheory = params.mean * (1 + phiFn(pt.p, params.cs) * params.cv);
    sse += (pt.q - qTheory) * (pt.q - qTheory);
  }
  return sse;
}

// ============================================================
// 不连序系列统计参数（含特大洪水的矩法修正）
// 公式来源：《水利水电工程设计洪水计算规范》附录 A.1.1-7~9
//（干旱区地理 2004(2) 与 SL 规范 PDF 原文交叉一致）
// 设 N 年考证期内 a 项特大洪水（其中 l 项发生在 n 年实测系列内），
// 实测系列从大到小排序、前 l 项为特大：
//   Q̄ = (1/N)[ ΣQj + (N−a)/(n−l)·ΣQi ]            （Qi 为实测一般项）
//   Cv = (1/Q̄)√{ (1/(N−1))[ Σ(Qj−Q̄)² + (N−a)/(n−l)·Σ(Qi−Q̄)² ] }
//   Cs = N[ Σ(Qj−Q̄)³ + (N−a)/(n−l)·Σ(Qi−Q̄)³ ] / [(N−1)(N−2)Q̄³Cv³]
// ============================================================

export interface DiscontinuousInput {
  historicalExtra: number[]; // 仅考证期内、不在实测系列中的特大洪水（a−l 项）
  measuredDesc: number[];   // 实测系列从大到小（前 l 项为特大）
  l: number;                // 实测系列中按特大处理的项数
  N: number;                // 考证期年数
}

export interface DiscontinuousStats {
  a: number; n: number; l: number; N: number;
  mean: number; sigma: number; cv: number; cs: number;
}

export function discontinuousStats(input: DiscontinuousInput): DiscontinuousStats {
  const { historicalExtra, measuredDesc, l, N } = input;
  const n = measuredDesc.length;
  if (!Number.isInteger(l) || l < 0 || l > n) {
    throw new Error(`l 必须是 0..${n} 的整数（实测系列长度 ${n}），收到 ${l}`);
  }
  // a 项特大 = 实测期内 l 项 + 考证期独有 (a−l) 项（自动合并，杜绝调用方漏传）
  const inSeries = measuredDesc.slice(0, l);
  const all = [...historicalExtra, ...inSeries];
  const a = all.length;
  if (N <= a) throw new Error(`考证期 N(${N}) 必须大于特大洪水总项数 a(${a})`);
  const nGen = n - l;
  if (nGen === 0) throw new Error("实测系列不能全部为特大洪水（n−l = 0）");

  const w = (N - a) / nGen; // 缺测年份权重（(N−a) 年由实测一般项代表）
  const general = measuredDesc.slice(l);

  const sumJ = all.reduce((s, v) => s + v, 0);
  const sumI = general.reduce((s, v) => s + v, 0);
  const mean = (sumJ + w * sumI) / N;
  if (mean <= 0) throw new Error("均值非正，无法计算统计参数");

  const sJ2 = all.reduce((s, v) => s + (v - mean) ** 2, 0);
  const sI2 = general.reduce((s, v) => s + (v - mean) ** 2, 0);
  const sigma = Math.sqrt((sJ2 + w * sI2) / (N - 1));
  if (sigma === 0) throw new Error("系列恒定，无法计算统计参数");
  const cv = sigma / mean;

  const sJ3 = all.reduce((s, v) => s + (v - mean) ** 3, 0);
  const sI3 = general.reduce((s, v) => s + (v - mean) ** 3, 0);
  const cs = (N * (sJ3 + w * sI3)) / ((N - 1) * (N - 2) * mean ** 3 * cv ** 3);

  return { a, n, l, N, mean, sigma, cv, cs };
}
