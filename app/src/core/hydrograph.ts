// ============================================================
// 设计洪水过程线 —— JTG C30-2015 第 6.6 条
// 同倍比放大法：kg = Qp / Q典峰（典型洪水洪峰流量），
//   过程线各时刻流量同乘 kg（交接文档 §5.6 已核实 ✅ 条文）。
// 同频率放大法涉及设计洪量 Wp 的时段划分规则，细节待教材复核，暂不实现。
// ============================================================

export interface HydrographPoint { t: number; q: number; } // t: h, q: m³/s

// 文本解析：每行 "t q" / "t,q" / "t，q"（也容忍多空格）；报错带行号
export function parseHydrograph(text: string): HydrographPoint[] {
  if (typeof text !== "string") throw new Error("过程线输入必须为字符串");
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("典型洪水过程线至少需要 2 行数据（每行：时间h, 流量）");
  const out: HydrographPoint[] = [];
  lines.forEach((line, i) => {
    const parts = line.split(/[\s,，;；]+/).filter(Boolean);
    if (parts.length !== 2) throw new Error(`第 ${i + 1} 行应有 2 个数值（时间, 流量），收到 ${parts.length} 个：${line}`);
    const t = Number(parts[0]), q = Number(parts[1]);
    if (!Number.isFinite(t)) throw new Error(`第 ${i + 1} 行时间不是有效数值：${parts[0]}`);
    if (!Number.isFinite(q) || q < 0) throw new Error(`第 ${i + 1} 行流量必须为非负数值：${parts[1]}`);
    out.push({ t, q });
  });
  return out;
}

export interface ScaleResult {
  kg: number;              // 放大系数
  typicalPeak: number;     // 典型洪水洪峰
  designPeak: number;      // 设计洪峰（= 输出过程线峰值）
  points: HydrographPoint[]; // 放大后过程线
}

export function scaleHydrograph(typical: HydrographPoint[], designPeak: number): ScaleResult {
  if (!Array.isArray(typical) || typical.length < 2) throw new Error("典型洪水过程线至少需要 2 个点");
  if (!typical.every(p => Number.isFinite(p.t) && Number.isFinite(p.q) && p.q >= 0)) {
    throw new Error("过程线各点必须为有限数且流量非负");
  }
  if (!(designPeak > 0)) throw new Error("设计洪峰 Qp 必须为正（m³/s）");
  const typicalPeak = Math.max(...typical.map(p => p.q));
  if (!(typicalPeak > 0)) throw new Error("典型洪水过程线峰值为 0，无法放大");
  const kg = designPeak / typicalPeak;
  const points = typical.map(p => ({
    t: p.t,
    q: Math.round(p.q * kg * 100) / 100,
  }));
  return { kg, typicalPeak, designPeak, points };
}
