// ============================================================
// 系列转换 / 面积比拟法 —— JTG C30-2015 第 6.2.2 条
// 断面与水文站面积差 <20% 且 ≤1000 km² 时，可按面积比转换：
//   Q设 = Q参 · (F设/F参)^n
// 面积修正指数 n（论文引规范，⚠️ 具体取值待教材复核）：
//   大中河流 0.5~0.7；F<100 km² 小河流 >0.7；面积差 ≤3% 时 n=1
// ============================================================

export interface AreaConvertInput {
  qRef: number;     // 参证站/参证断面成果（如 Q̄ 或 Qp）
  fRef: number;     // 参证汇水面积 km²
  fSite: number;    // 桥位断面汇水面积 km²
  n?: number;       // 面积修正指数（不传则按建议规则自动取）
}

export interface AreaConvertResult {
  qSite: number;
  n: number;
  diffPct: number;      // 面积差百分比
  preconditionOk: boolean; // 是否满足 6.2.2 转换条件
  warnings: string[];
}

// 建议指数（⚠️ 工程惯例值，纸质规范到手后复核）
export function suggestExponent(fRef: number, fSite: number): number {
  const diffPct = Math.abs(fSite - fRef) / fRef * 100;
  if (diffPct <= 3) return 1;
  const fMin = Math.min(fRef, fSite);
  if (fMin < 100) return 0.75;      // 小河流 >0.7（取 0.75 默认）
  return 0.6;                        // 大中河流 0.5~0.7 中取
}

export function areaConvert(input: AreaConvertInput): AreaConvertResult {
  const { qRef, fRef, fSite } = input;
  if (![qRef, fRef, fSite].every(Number.isFinite)) throw new Error("面积比拟输入必须为有限数");
  if (!(qRef > 0)) throw new Error("参证成果必须为正");
  if (!(fRef > 0) || !(fSite > 0)) throw new Error("汇水面积必须为正（km²）");
  const n = input.n ?? suggestExponent(fRef, fSite);
  if (!Number.isFinite(n) || n <= 0) throw new Error("面积修正指数 n 必须为正");
  const diffPct = Math.abs(fSite - fRef) / fRef * 100;
  const warnings: string[] = [];
  const preconditionOk = diffPct < 20 && Math.max(fRef, fSite) <= 1000;
  if (diffPct >= 20) warnings.push(`面积差 ${diffPct.toFixed(1)}% ≥ 20%，超出规范 6.2.2 转换条件，结果仅供参考`);
  if (Math.max(fRef, fSite) > 1000) warnings.push("汇水面积 >1000 km²，超出规范 6.2.2 转换条件，结果仅供参考");
  const qSite = qRef * Math.pow(fSite / fRef, n);
  return { qSite, n, diffPct, preconditionOk, warnings };
}
