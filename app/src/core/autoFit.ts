// ============================================================
// 优化适线：以矩法/当前参数为初值，对经验点据最小化离差平方和
//   min SSE(cv, cs) = Σ[ q_i − Q̄(1+Φ(p_i,cs)·cv) ]²（均值固定，规范 6.2.5
//   适线时均值通常取矩法值；Cv、Cs 为适线调整对象）
// 优化器复用 bayes.ts 的 Nelder-Mead（同一引擎，不引新依赖）。
// 教学进阶功能：目估适线之外给"一键寻优"对照（评估报告 2.4 亮点建议）。
// ============================================================
import { nelderMead } from "./bayes.ts";
import { sseOfPoints, type EmpPoint } from "./points.ts";
import { phiPIII } from "./phi.ts";

export interface AutoFitResult {
  mean: number; cv: number; cs: number;
  sse: number; sseInitial: number;
  improved: boolean; iterations: number;
}

export function autoFit(
  points: EmpPoint[],
  initial: { mean: number; cv: number; cs: number },
  phiFn: (p: number, cs: number) => number = phiPIII,
): AutoFitResult {
  if (points.length < 3) throw new Error("优化适线至少需要 3 个经验点据");
  const { mean } = initial;
  if (!(mean > 0)) throw new Error("均值必须为正（优化适线固定矩法均值）");
  const sseInitial = sseOfPoints(points, initial, phiFn);

  // 参数化 θ=(cv, cs)，约束经软惩罚转入无约束优化
  const objective = (theta: number[]): number => {
    const cv = theta[0], cs = theta[1];
    let penalty = 0;
    if (cv <= 0.01) penalty += (0.01 - cv) ** 2 * 1e12;
    if (cs < 0) penalty += cs * cs * 1e12;
    if (penalty > 0) return penalty + sseInitial;
    return sseOfPoints(points, { mean, cv, cs }, phiFn);
  };
  const starts = [
    [initial.cv, initial.cs],
    [Math.max(initial.cv * 0.8, 0.05), Math.max(initial.cs * 1.5, 0.1)],
    [Math.min(initial.cv * 1.2, 1.5), Math.max(initial.cs * 0.5, 0.05)],
  ];
  let best: { x: number[]; fx: number; iterations: number } | null = null;
  for (const st of starts) {
    const r = nelderMead(objective, st, { maxIter: 800, tol: 1e-10 });
    if (!best || r.fx < best.fx) best = r;
  }
  const cv = best!.x[0], cs = best!.x[1];
  const sse = sseOfPoints(points, { mean, cv, cs }, phiFn);
  return {
    mean, cv, cs, sse, sseInitial,
    improved: sse <= sseInitial + 1e-9,
    iterations: best!.iterations,
  };
}
