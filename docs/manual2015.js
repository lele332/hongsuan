(function () {
/* ============================================================
 * 泓算 · 湖南省暴雨洪水查算手册（2015）推理公式体系（Phase C）
 *
 * 数据来源：验证算例 §5.1.2（p63-67，2026-10-22 全文录入）
 *   + 知识库 knowledge/docs/real-cases.md
 *
 * 计算链（手册流程）：
 *   1) 24h 点雨量  H24点 = H̄24 · Kp(P, Cv, Cs/Cv)          —— Kp 手填（表二，报告预置可一键）
 *   2) 24h 面雨量  H24面 = α · H24点                        —— α 点面折算（查图二十二）
 *   3) 短历时指数  n2 / n3（查图三十六/三十七，随频率）
 *   4) 时程分配（各历时最大雨量）：
 *        H1  = H24面 · 24^(n3−1) · 6^(n2−n3)
 *        H3  = H1  · 3^(1−n2)
 *        H6  = H24面 · 24^(n3−1) · 6^(1−n3)
 *        H12 = H24面 · 24^(n3−1) · 12^(1−n3)
 *        H24 = H24面
 *      ★ 黄金锚点（验证锚点，百年一遇）：
 *        H24面=243.09, n2=0.638, n3=0.702
 *        → H1=84.1（报告正文 84.7 系笔误，表 5.1-6 为 84.1，公式复算 84.07）
 *        → H3=125.13 / H6=160.82 / H12=197.72 / H24=243.09
 *   5) 逐时段概化雨型（本模块内置 7 区雨型，来源 内置概化雨型）：
 *        H1: [100]
 *        H3−H1: [59.8, 40.2]
 *        H6−H3: [28.0, 42.2, 29.8]
 *        H12−H6: [4.6, 20.3, 30.6, 18.5, 17.6, 8.4]
 *        H24−H12: [4.5, 4.5, 4.6, 4.6, 4.6, 4.6, 13.6, 22.7, 13.6, 13.6, 9.1]
 *      （合计 100%；24 时段中 1 个时段为 0，与报告 Ht 行逐时段合计 243.1 一致）
 *   6) 净雨：初损 I0 前损后溢（报告 R总 行：前若干时段全扣，累计 243.1−32=211.1）
 *   7) 推理公式洪峰：Q = 0.278 · φ · S / τ^n · F
 *        S 雨力 = H1（mm/h）；τ 汇流历时(h) 手填（试算）；n 按 τ 取 n2 或 n3
 *      ★ 报告验证点：撇洪沟涵闸 F=1.6km² → 同频 Q=6.74 m³/s（p61，τ/φ 未见文本，参考锚点）
 *
 * 待录：4 区概化雨型（部分地区使用）、φ 表十一完整数字化、Kp 表二完整数字化。
 * ============================================================ */

// —— 7 区概化雨型（内置概化雨型，各块百分比合计 100）——
var ZONE7_PATTERN = {
  zone: 7,
  source: "湖南省暴雨洪水查算手册 7 区概化雨型",
  H1: [100],
  H3: [59.8, 40.2],
  H6: [28.0, 42.2, 29.8],
  H12: [4.6, 20.3, 30.6, 18.5, 17.6, 8.4],
  H24: [4.5, 4.5, 4.6, 4.6, 4.6, 4.6, 13.6, 22.7, 13.6, 13.6, 9.1]
};

/** 24h 点雨量 H24点 = H̄24 · Kp */
function pointRainfall(Hbar, Kp) {
  if (!Number.isFinite(Hbar) || Hbar <= 0) throw new Error("24h 点雨量均值 H̄24 必须为正（mm）");
  if (!Number.isFinite(Kp) || Kp <= 0) throw new Error("模比系数 Kp 必须为正（P-Ⅲ 表二查得）");
  return Hbar * Kp;
}

/** 24h 面雨量 H24面 = α · H24点 */
function areaRainfall(Hpoint, alpha) {
  if (!Number.isFinite(Hpoint) || Hpoint <= 0) throw new Error("24h 点雨量必须为正（mm）");
  if (!Number.isFinite(alpha) || alpha <= 0 || alpha > 1) throw new Error("点面折算系数 α 应在 (0,1]");
  return alpha * Hpoint;
}

/** 各历时最大雨量（时程分配公式链，黄金锚点已验证） */
function durationRainfalls(H24area, n2, n3) {
  if (!Number.isFinite(H24area) || H24area <= 0) throw new Error("24h 面雨量必须为正（mm）");
  if (!Number.isFinite(n2) || n2 <= 0 || n2 >= 1) throw new Error("短历时指数 n2 应在 (0,1)（查图三十六）");
  if (!Number.isFinite(n3) || n3 <= 0 || n3 >= 1) throw new Error("短历时指数 n3 应在 (0,1)（查图三十七）");
  if (n3 < n2) throw new Error("手册中 n3 通常大于 n2（n2 为 1~6h 段、n3 为 6~24h 段），请核对查图");
  const base = H24area * Math.pow(24, n3 - 1);
  const H1 = base * Math.pow(6, n2 - n3);
  const H3 = H1 * Math.pow(3, 1 - n2);
  const H6 = base * Math.pow(6, 1 - n3);
  const H12 = base * Math.pow(12, 1 - n3);
  const r2 = (x) => Math.round(x * 100) / 100;
  return { H1: r2(H1), H3: r2(H3), H6: r2(H6), H12: r2(H12), H24: r2(H24area) };
}

/** 逐时段设计暴雨过程（7 区概化雨型，峰在第 13 时段，排布与报告表 5.1-6 Ht 行逐时段一致） */
function hourlyDistribution(dur, pattern) {
  const p = pattern || ZONE7_PATTERN;
  const seg = (percents, amount) => percents.map((pc) => (amount * pc) / 100);
  const a24 = seg(p.H24, dur.H24 - dur.H12);
  const a12 = seg(p.H12, dur.H12 - dur.H6);
  const a6 = seg(p.H6, dur.H6 - dur.H3);
  const a3 = seg(p.H3, dur.H3 - dur.H1);
  const hours = new Array(24).fill(0);
  const put = (start, vals) => vals.forEach((v, i) => (hours[start - 1 + i] = v));
  put(1, a24.slice(0, 8));   // H24−H12 前 8 时段（时段 1~8）
  put(9, a12.slice(0, 2));   // H12−H6 前 2 时段（时段 9~10）
  put(11, a6.slice(0, 1));   // H6−H3 前 1 时段（时段 11）
  put(12, a3.slice(0, 1));   // H3−H1 前 1 时段（时段 12）
  put(13, seg(p.H1, dur.H1)); // 峰：时段 13 = H1
  put(14, a3.slice(1));      // H3−H1 后 1 时段（时段 14）
  put(15, a6.slice(1));      // H6−H3 后 2 时段（时段 15~16）
  put(17, a12.slice(2));     // H12−H6 后 4 时段（时段 17~20）
  put(21, a24.slice(8));     // H24−H12 后 3 时段（时段 21~23）
  // 时段 24 = 0（雨型合计 23 个非零时段）
  const r1 = hours.map((x) => Math.round(x * 10) / 10);
  return { hours: r1, total: Math.round(r1.reduce((a, b) => a + b, 0) * 10) / 10, pattern: p.zone };
}

/** 净雨过程：初损 I0 前损后溢（与报告 R总 行一致） */
function netRainSeries(hours, I0) {
  if (!Number.isFinite(I0) || I0 < 0) throw new Error("初损 I0 不能为负（mm）");
  let remain = I0;
  const out = hours.map((x) => {
    if (remain > 0) {
      const cut = Math.min(remain, x);
      remain -= cut;
      return Math.round((x - cut) * 10) / 10;
    }
    return Math.round(x * 10) / 10;
  });
  return { hours: out, total: Math.round(out.reduce((a, b) => a + b, 0) * 10) / 10, I0 };
}

/** 推理公式洪峰 Q = 0.278·φ·S/τ^n·F（S=雨力 H1 mm/h；τ=h；F=km²；n 按 τ 段取值） */
function rationalQ(S, phi, tau, n, F) {
  if (!Number.isFinite(S) || S <= 0) throw new Error("雨力 S（=H1）必须为正（mm/h）");
  if (!Number.isFinite(phi) || phi <= 0 || phi > 1) throw new Error("地表径流系数 φ 应在 (0,1]（表十一）");
  if (!Number.isFinite(tau) || tau <= 0) throw new Error("汇流历时 τ 必须为正（h）");
  if (!Number.isFinite(n) || n <= 0 || n >= 1) throw new Error("短历时指数 n 应在 (0,1)");
  if (!Number.isFinite(F) || F <= 0) throw new Error("集雨面积 F 必须为正（km²）");
  return Math.round(((0.278 * phi * S) / Math.pow(tau, n)) * F * 100) / 100;
}

/** 公式3-1：地理参数 θ = L/(F^(1/4)·J^(1/3))（J 输入 ‰，内部转小数）
 * 黄金锚点：蒿吉坪桥梁 F=40.2/L=9.6/J=16.1‰ → θ=15.11（省水利厅官网论文表1=15.10） */
function theta(F, L, Jpermille) {
  if (!Number.isFinite(F) || F <= 0) throw new Error("集雨面积 F 必须为正（km²）");
  if (!Number.isFinite(L) || L <= 0) throw new Error("干流长度 L 必须为正（km）");
  if (!Number.isFinite(Jpermille) || Jpermille <= 0) throw new Error("坡降 J 必须为正（‰）");
  const Jd = Jpermille / 1000;
  return Math.round((L / (Math.pow(F, 0.25) * Math.pow(Jd, 1 / 3))) * 100) / 100;
}

/** 公式3-2：汇流参数 m = 0.0228·θ^1.067
 * 注意：蒿吉坪论文 θ=15.10 → 公式值 0.413，但表1 给 m=0.547（疑按手册图三十九查取）。
 * 界面允许手填 m 覆盖公式值。 */
function mFromTheta(thetaVal) {
  if (!Number.isFinite(thetaVal) || thetaVal <= 0) throw new Error("地理参数 θ 必须为正");
  return Math.round((0.0228 * Math.pow(thetaVal, 1.067)) * 1000) / 1000;
}

/** 公式3-4：汇流历时 τ = 0.278·L/(m·J^(1/3)·Q^(1/4))（J 输入 ‰）
 * 黄金锚点：L=9.6/m=0.547/J=16.1‰/Q=325 → τ=4.551h */
function tauHuit(L, m, Jpermille, Q) {
  if (!Number.isFinite(L) || L <= 0) throw new Error("干流长度 L 必须为正（km）");
  if (!Number.isFinite(m) || m <= 0) throw new Error("汇流参数 m 必须为正");
  if (!Number.isFinite(Jpermille) || Jpermille <= 0) throw new Error("坡降 J 必须为正（‰）");
  if (!Number.isFinite(Q) || Q <= 0) throw new Error("流量 Q 必须为正（m³/s）");
  return (0.278 * L) / (m * Math.pow(Jpermille / 1000, 1 / 3) * Math.pow(Q, 0.25));
}

/** 推理公式试算引擎（手册法，公式3-3/3-4 联立）：
 *  Q = 0.278·F·R_τ/τ；τ = 0.278·L/(m·J^(1/3)·Q^(1/4))
 *  netRainCum：逐小时累计净雨 [R1..R24]（mm），由 netRainSeries 自行累加；
 *  迭代：Q₀=R1 平均强度起算 → τ=tauHuit → Q₁=0.278·F·R(τ)/τ（线性插值）→ 直至收敛。
 *  黄金锚点：蒿吉坪 Q₁%=325 ↔ τ=4.551h（R(4.551)=132.4mm） */
function rationalTrial(netRainCum, F, L, Jpermille, m) {
  if (!Array.isArray(netRainCum) || netRainCum.length < 2) throw new Error("净雨累计过程无效");
  if (!Number.isFinite(F) || F <= 0) throw new Error("集雨面积 F 必须为正（km²）");
  if (!Number.isFinite(m) || m <= 0) throw new Error("汇流参数 m 必须为正");
  const n = netRainCum.length;
  for (let i = 1; i < n; i++) {
    if (!Number.isFinite(netRainCum[i]) || netRainCum[i] < netRainCum[i - 1]) throw new Error("累计净雨应逐时递增");
  }
  const avgIntensity = (t) => {
    if (t <= 0) return Infinity;
    const ti = Math.min(t, n);
    const i0 = Math.min(Math.floor(ti) - 1, n - 2);
    const frac = ti - (i0 + 1);
    const R = netRainCum[i0] + (netRainCum[i0 + 1] - netRainCum[i0]) * frac;
    return R / ti;
  };
  let Q = 0.278 * F * avgIntensity(1);
  let tau = 0;
  for (let iter = 0; iter < 200; iter++) {
    tau = tauHuit(L, m, Jpermille, Q);
    if (tau > n) return { Q: 0, tau, converged: false, warnings: ["τ 超出净雨历时，全面汇流不成立"] };
    const Qn = 0.278 * F * avgIntensity(tau);
    if (Math.abs(Qn - Q) < 0.05) { Q = Qn; break; }
    Q = Qn;
  }
  return { Q: Math.round(Q * 100) / 100, tau: Math.round(tau * 1000) / 1000, converged: true, warnings: [] };
}

var __hsManual2015Api = {
  ZONE7_PATTERN: ZONE7_PATTERN,
  pointRainfall: pointRainfall,
  areaRainfall: areaRainfall,
  durationRainfalls: durationRainfalls,
  hourlyDistribution: hourlyDistribution,
  netRainSeries: netRainSeries,
  rationalQ: rationalQ,
  theta: theta,
  mFromTheta: mFromTheta,
  tauHuit: tauHuit,
  rationalTrial: rationalTrial
};
if (typeof module !== "undefined" && module.exports) module.exports = __hsManual2015Api;
if (typeof window !== "undefined") window.__hsManual2015 = __hsManual2015Api;
})();
