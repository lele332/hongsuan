// ============================================================
// 方法 B：利用历史洪水位推算设计流量（JTG C30-2015 第 6.3 节）
// 1) 历史洪水流量（6.3.1-1~3 ✅ 规范原式）：
//    Q = Ac·vc + At·vt；v = (1/n)·R^(2/3)·I^(1/2)（曼宁公式）
//    河槽/河滩分算；宽深比 >10 时 R 可用平均水深代替（R ≈ A/B）
// 2) 推算设计流量（6.3.3 ✅）：历史洪水 ≥2 次，地区参数 Cv、Cs 参照选定；
//    Q̄Ti = QTi / (1 + ΦT·Cv)（ΦT 为重现期 T 年的离均系数）→ Q̄ 取平均
//    → Qp = Q̄(1 + Φp·Cv)（式 6.2.6）
// 未实现：6.3.1-4 非均匀流试算法（复杂河段水面线）
// ============================================================

export interface SectionInput {
  Ac: number; Bc: number; nc: number;  // 河槽：过水面积 m²、水面宽 m、糙率
  At: number; Bt: number; nt: number;  // 河滩：同上（无河滩时 At=0）
  I: number;                           // 水面比降（小数，如 0.0005）
  Rc?: number; Rt?: number;            // 可选：直接给水力半径（否则按 R≈A/B 近似）
}

export interface ManningResult {
  Rc: number; Rt: number;
  vc: number; vt: number;
  Qc: number; Qt: number;
  Q: number; // 历史洪水流量 m³/s
}

export function manningQ(s: SectionInput): ManningResult {
  const { Ac, Bc, nc, At, Bt, nt, I } = s;
  if (I <= 0) throw new Error("水面比降必须为正");
  if (Ac <= 0) throw new Error("河槽过水面积必须为正");
  if (nc <= 0) throw new Error("河槽糙率必须为正");
  if (At < 0) throw new Error("河滩过水面积不能为负");
  // 水力半径：直接给定或宽深比>10 近似 R=A/B
  const Rc = s.Rc ?? (Bc > 0 ? Ac / Bc : NaN);
  const Rt = At > 0 ? (s.Rt ?? (Bt > 0 ? At / Bt : NaN)) : 0;
  if (!Number.isFinite(Rc) || Rc <= 0) throw new Error("河槽水力半径无效（Rc=A/B 需水面宽 Bc>0，或直接给定 Rc）");
  if (At > 0 && (!Number.isFinite(Rt) || Rt <= 0)) throw new Error("河滩水力半径无效");
  const sq = Math.sqrt(I);
  const vc = (Rc ** (2 / 3)) * sq / nc;
  const vt = At > 0 ? (Rt ** (2 / 3)) * sq / nt : 0;
  const Qc = Ac * vc;
  const Qt = At * vt;
  return { Rc, Rt, vc, vt, Qc, Qt, Q: Qc + Qt };
}

export interface HistoricalFlood {
  Q: number; // 本次历史洪水流量 m³/s
  T: number; // 重现期（年），由洪痕调查/文献考证确定
}

export interface DesignFromHistoryResult {
  qBars: number[];        // 各次洪水反算的 Q̄Ti
  mean: number;           // 平均流量 Q̄（采用值）
  phi: number; kp: number;
  q: number;              // 设计流量 Qp
}

// 多次历史洪水 + 地区参数 → 设计流量（6.3.3）
export function designFromHistory(
  floods: HistoricalFlood[],
  params: { cv: number; cs: number },
  pExceed: number,
  phiFn: (p: number, cs: number) => number,
): DesignFromHistoryResult {
  if (floods.length < 2) throw new Error("利用历史洪水推算设计流量，历史洪水流量不宜少于 2 次（规范 6.3.3）");
  if (params.cv <= 0) throw new Error("地区变差系数 Cv 必须为正");
  const qBars = floods.map(f => {
    if (f.Q <= 0 || f.T < 1) throw new Error("历史洪水流量与重现期（年）必须为正");
    const phiT = phiFn(1 / f.T, params.cs); // 重现期 T 年 → 超过概率 1/T
    const denom = 1 + phiT * params.cv;
    if (denom <= 0) throw new Error(`第 ${f.T} 年一遇洪水：1+ΦT·Cv ≤ 0，参数不合理`);
    return f.Q / denom;
  });
  const mean = qBars.reduce((s, v) => s + v, 0) / qBars.length;
  const phi = phiFn(pExceed, params.cs);
  const kp = 1 + phi * params.cv;
  return { qBars, mean, phi, kp, q: mean * kp };
}
