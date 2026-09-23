// ============================================================
// 三点适线法（JTG C30-2015 第 6.2.5 条参数初估方法之二）
// 原理：在经验频率曲线上取三点 (P1,x1),(P2,x2),(P3,x3)，对 P-Ⅲ 有
//   x_P = x̄ + σ·Φ(P, Cs)。令
//   S = (x1 + x3 − 2x2)/(x1 − x3) = (Φ1 + Φ3 − 2Φ2)/(Φ1 − Φ3)
//   S 随 Cs 单调增 → 二分求解 Cs；σ=(x1−x3)/(Φ1−Φ3)；x̄=x2−σΦ2；Cv=σ/x̄
// 经典取点 P=5% / 50% / 95%（教材惯例）。Φ 由 phi.ts 数值计算，
// 不需要 Φ 表。S<0 → Cs=0（正态，P-Ⅲ 在水文上 Cs≥0）。
// ============================================================
import { phiPIII } from "./phi.ts";

export interface ThreePoint { p: number; x: number; } // p 为超过概率（小数）

export interface ThreePointResult {
  mean: number; cv: number; cs: number;
  S: number; sigma: number;
  freqs: number[];
}

// S(Cs) 在三点固定时关于 Cs 单调递增（Φ 的偏度效应），用二分求根
export function threePointFit(pts: [ThreePoint, ThreePoint, ThreePoint]): ThreePointResult {
  if (pts.length !== 3) throw new Error("三点适线法需要恰好 3 个点");
  const [p1, p2, p3] = pts.map(t => t.p);
  const [x1, x2, x3] = pts.map(t => t.x);
  for (const p of [p1, p2, p3]) {
    if (!(p > 0 && p < 1)) throw new Error(`频率必须在 (0,1)，收到 ${p}`);
  }
  // 需按频率升序对应（P1<P2<P3），否则 S 定义不符
  if (!(p1 < p2 && p2 < p3)) throw new Error("三点频率必须递增（如 5%、50%、95% 超过概率写法即 0.05/0.5/0.95）");
  if (!(Number.isFinite(x1) && Number.isFinite(x2) && Number.isFinite(x3))) {
    throw new Error("三点流量必须为有限数");
  }
  if (x1 <= x3) throw new Error("要求 x1 > x3（频率越小流量越大），系列可能恒定或顺序错误");

  const sOf = (cs: number) => {
    const f1 = phiPIII(p1, cs), f2 = phiPIII(p2, cs), f3 = phiPIII(p3, cs);
    return (f1 + f3 - 2 * f2) / (f1 - f3);
  };
  const S = (x1 + x3 - 2 * x2) / (x1 - x3);

  let cs: number;
  if (S <= 0) {
    cs = 0; // 数据近似对称 → 正态（Cs=0 的 P-Ⅲ）
  } else {
    // 二分：S(0)=0（正态三点对称），上界自适应扩张
    let lo = 0, hi = 1;
    let guard = 0;
    while (sOf(hi) < S && guard++ < 100) { lo = hi; hi *= 2; }
    if (guard >= 100) throw new Error("三点法求 Cs 上界扩张超限，数据可能不适用");
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (sOf(mid) < S) lo = mid; else hi = mid;
      if (hi - lo < 1e-10) break;
    }
    cs = (lo + hi) / 2;
  }

  const f1 = phiPIII(p1, cs), f2 = phiPIII(p2, cs), f3 = phiPIII(p3, cs);
  const sigma = (x1 - x3) / (f1 - f3);
  if (!(sigma > 0)) throw new Error("三点法解出 σ 非正，数据矛盾");
  const mean = x2 - sigma * f2;
  if (!(mean > 0)) throw new Error("三点法解出均值非正，数据矛盾");
  return { mean, cv: sigma / mean, cs, S, sigma, freqs: [p1, p2, p3] };
}

// 从实测系列的经验频率曲线读三点：按韦伯排位线性插值求分位数
// series 任意顺序；freqs 为超过概率（小数），如 [0.05, 0.5, 0.95]
export function empiricalQuantiles(series: number[], freqs: number[]): number[] {
  if (series.length < 3) throw new Error("三点法至少需要 3 个数据");
  const sorted = [...series].sort((a, b) => b - a); // 降序
  const n = sorted.length;
  return freqs.map(p => {
    // 韦伯排位：第 m 项 P=m/(n+1)。找 P 所在排位区间并线性插值
    const rank = p * (n + 1); // 连续排位 m
    if (rank < 1) return sorted[0];
    if (rank >= n) return sorted[n - 1];
    const mLo = Math.floor(rank);
    const w = rank - mLo;
    return sorted[mLo - 1] + w * (sorted[mLo] - sorted[mLo - 1]);
  });
}

// 便捷入口：系列 → 三点法参数初估（默认 5%/50%/95%）
export function threePointFromSeries(series: number[], freqs: [number, number, number] = [0.05, 0.5, 0.95]): ThreePointResult {
  const xs = empiricalQuantiles(series, freqs);
  return threePointFit([
    { p: freqs[0], x: xs[0] },
    { p: freqs[1], x: xs[1] },
    { p: freqs[2], x: xs[2] },
  ]);
}
