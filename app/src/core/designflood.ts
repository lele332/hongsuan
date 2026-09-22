// ============================================================
// 设计流量推求（方法 A：P-III 频率适线）汇总接口
// 用法示例（对应算例 T3）：
//   const r = designFlood({ mean: 5173.6, cv: 0.331, cs: 1.99 }, 0.01);
//   // → { phi: 3.604, kp: 2.193, q: 11345 }
// ============================================================

import { phiPIII, curveSeries } from "./phi.ts";

export interface FitParams {
  mean: number; // Q̄ (m³/s)
  cv: number;   // 变差系数
  cs: number;   // 偏态系数（适线采用值）
}

export interface DesignResult {
  phi: number;  // 离均系数 Φp
  kp: number;   // 模比系数
  q: number;    // 设计流量 Qp (m³/s)
}

// 指定设计频率（超过概率，0.01 = 1%）下的设计流量
export function designFlood(params: FitParams, pExceed: number): DesignResult {
  const phi = phiPIII(pExceed, params.cs);
  const kp = 1 + phi * params.cv;
  return { phi, kp, q: params.mean * kp };
}

// 计算书用频率表（常用频率档）
export const STANDARD_FREQS = [
  0.05, 0.1, 0.2, 0.333, 0.5, 1, 2, 3.33, 5, 10, 20, 25, 50, 75, 90, 95, 99,
];

export function designFloodTable(params: FitParams, freqs: number[] = STANDARD_FREQS) {
  return curveSeries(params, freqs);
}
