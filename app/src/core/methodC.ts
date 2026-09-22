// ============================================================
// 方法 C：无资料地区设计流量（JTG C30-2015 第 6.4 节）
// 6.4.2（✅）：汇水面积 <100 km² 可按推理公式计算，参数采用
//            各地区编制的暴雨径流图表值
// 6.4.1（✅）：无资料地区可按地区经验公式及水文参数求算，
//            设计流量应有历史洪水流量的验证
//
// 推理公式（水科院型，⚠️ 具体参数取值按教材/地区暴雨径流图表）：
//   Qp = 0.278 · ψ · (Sp / τⁿ) · F
//   Sp 雨力 mm/h；τ 汇流时间 h；n 暴雨衰减指数；ψ 洪峰径流系数；F km²
//   量纲自洽：1 mm/h × 1 km² = 10⁻³ m/3600 s × 10⁶ m² = 0.278 m³/s ✓
//
// 径流厚度法（公路科研所暴雨径流公式，⚠️ 指数形式待教材核实）：
//   Qp = φ · (h − z)^(5/3) · F^(2/3) · β · γ · δ
//   ⚠️ 贵州算例（bodocs）数字与此式不自洽（φ=0.1,h=44,z=10,F=3.94,β=γ=δ=1
//      → 本式 89.1，原文 59.34）——公式形式待对教材核实，暂不接公开算例锚点
// ============================================================

export interface RationalInput {
  Sp: number;  // 雨力 mm/h（设计频率下，查暴雨等值线图）
  n: number;  // 暴雨衰减指数
  psi: number; // 洪峰径流系数
  tau: number; // 汇流时间 h
  F: number;  // 汇水面积 km²
}

export function rationalFormula(p: RationalInput): number {
  if (p.F <= 0) throw new Error("汇水面积 F 必须为正（km²）");
  if (p.tau <= 0) throw new Error("汇流时间 τ 必须为正（h）");
  if (p.Sp <= 0) throw new Error("雨力 Sp 必须为正（mm/h）");
  if (p.n < 0) throw new Error("暴雨衰减指数 n 不能为负");
  if (p.psi <= 0 || p.psi > 1) throw new Error("洪峰径流系数 ψ 应在 (0,1]");
  if (p.F >= 100) throw new Error("推理公式适用于汇水面积 <100 km²（规范 6.4.2），当前 " + p.F + " km²");
  return 0.278 * p.psi * (p.Sp / Math.pow(p.tau, p.n)) * p.F;
}

export interface RunoffDepthInput {
  phi: number;    // 地貌系数
  h: number;      // 径流厚度 mm
  z: number;      // 植被/坑洼滞留径流厚度 mm
  F: number;      // 汇水面积 km²
  beta: number;   // 洪峰传播流量折减系数
  gamma: number;  // 降雨不均匀折减系数
  delta: number;  // 湖泊/小水库调节折减系数
}

export function runoffDepthFormula(p: RunoffDepthInput): number {
  if (p.F <= 0) throw new Error("汇水面积 F 必须为正（km²）");
  if (p.h - p.z <= 0) throw new Error("径流厚度 h 必须大于滞留厚度 z");
  if (p.phi <= 0) throw new Error("地貌系数 φ 必须为正");
  return p.phi * Math.pow(p.h - p.z, 5 / 3) * Math.pow(p.F, 2 / 3) * p.beta * p.gamma * p.delta;
}
