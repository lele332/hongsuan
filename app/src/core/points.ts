// ============================================================
// 经验频率点据组装 —— UI 图表与计算书共用（原在 main.ts 内联实现，
// v0.9.0 收编为内核函数，消除"界面一份、内核一份"的同构双副本风险）
// 统一样本法：特大按流量排序 M=1..a → P=M/(N+1)；
//   实测一般项 m=l+1..n：Pm = a/(N+1) + (1−a/(N+1))·(m−l)/(n−l+1)
// 与 empirical.ts 的 empiricalMethodB 公式一致，此处直接复用其权重推导。
// ============================================================

import { empiricalContinuous } from "./empirical.ts";
import { discontinuousStats } from "./stats.ts";
import type { DiscontinuousStats } from "./stats.ts";

export interface EmpPoint {
  p: number;   // 经验频率（小数，0.01 = 1%）
  q: number;   // 流量 m³/s
  kind: "hist" | "meas";
}

// 连序系列：输入任意顺序的流量数组，内部降序排序后给出 (p, q) 点据
export function continuousPoints(series: number[]): EmpPoint[] {
  const sorted = [...series].sort((a, b) => b - a);
  const ps = empiricalContinuous(sorted.length); // 百分数
  return sorted.map((q, i) => ({ p: ps[i] / 100, q, kind: "meas" as const }));
}

export interface DiscontinuousPointsInput {
  historicalExtra: number[]; // 考证期内、不在实测系列中的特大洪水
  measuredDesc: number[];    // 实测系列（任意顺序，内部降序）
  l: number;                 // 实测系列中按特大处理的项数
  N: number;                 // 考证期年数
}

// 不连序系列（统一样本法）点据 + 统计参数，一次调用返回两者
export function discontinuousPoints(input: DiscontinuousPointsInput): {
  stats: DiscontinuousStats;
  points: EmpPoint[];
} {
  const sorted = [...input.measuredDesc].sort((a, b) => b - a);
  const stats = discontinuousStats({
    historicalExtra: input.historicalExtra,
    measuredDesc: sorted,
    l: input.l,
    N: input.N,
  });
  const { n, l, N, a } = stats;
  // 特大项合并降序 → M=1..a → P=M/(N+1)
  const all = [...input.historicalExtra, ...sorted.slice(0, l)].sort((x, y) => y - x);
  const points: EmpPoint[] = all.map((q, i) => ({
    p: (i + 1) / (N + 1), q, kind: "hist" as const,
  }));
  // 实测一般项（统一样本法）
  const pA = a / (N + 1);
  for (let m = l + 1; m <= n; m++) {
    points.push({
      p: pA + (1 - pA) * (m - l) / (n - l + 1),
      q: sorted[m - 1],
      kind: "meas" as const,
    });
  }
  return { stats, points };
}

// 适线离差平方和（图表 SSE 显示用；与 stats.ts sseOfFit 等价，
// 此处按 EmpPoint 形状提供便捷入口，避免 UI 再写第三份循环）
export function sseOfPoints(
  points: EmpPoint[],
  params: { mean: number; cv: number; cs: number },
  phiFn: (p: number, cs: number) => number,
): number {
  let sse = 0;
  for (const pt of points) {
    const qTheory = params.mean * (1 + phiFn(pt.p, params.cs) * params.cv);
    sse += (pt.q - qTheory) ** 2;
  }
  return sse;
}
