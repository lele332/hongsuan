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
// 径流厚度法（公路科研所暴雨径流公式，《公路涵洞设计细则》JTG/T D65-04-2007 /
//            现 JTG/T 3365-02-2020《公路涵洞设计规范》；✅ 指数形式已经
//            三个独立公开算例交叉验证，2026-09-22 修正）：
//   Qp = ψ · (h − z)^(3/2) · F^(4/5) · β · γ · δ
//   ψ 地貌系数（地形、主河沟平均纵坡、汇水面积，查表）
//   h 径流厚度 mm（暴雨分区 × 土壤类别 × 频率 × 汇流时间，查表）
//   z 植物截留/坑洼滞留厚度 mm（查表）；F 汇水面积 km²
//   β 洪峰传播折减；γ 降雨不均匀折减；δ 湖泊水库调节折减
//   算例锚点（回归测试见 methodC.test.ts）：
//     ① k3+685 涵洞：ψ=0.07,h=50,z=25,F=5.6,β=0.925,γ=1,δ=0.91 → 29.22 m³/s
//     ② 贵州算例：ψ=0.1,h=44,z=10,F=3.94,β=γ=δ=1 → 59.34 m³/s（本式 59.38，参数舍入内）
//     （旧形式 (h−z)^(5/3)·F^(2/3) 对上述算例得 89.1 等不自洽值，已废弃）
// ============================================================

export interface RationalInput {
  Sp: number;  // 雨力 mm/h（设计频率下，查暴雨等值线图）
  n: number;  // 暴雨衰减指数
  psi: number; // 洪峰径流系数
  tau: number; // 汇流时间 h
  F: number;  // 汇水面积 km²
}

export function rationalFormula(p: RationalInput): number {
  if (![p.Sp, p.n, p.psi, p.tau, p.F].every(Number.isFinite)) throw new Error("推理公式输入必须为有限数");
  if (p.F <= 0) throw new Error("汇水面积 F 必须为正（km²）");
  if (p.tau <= 0) throw new Error("汇流时间 τ 必须为正（h）");
  if (p.Sp <= 0) throw new Error("雨力 Sp 必须为正（mm/h）");
  if (p.n < 0) throw new Error("暴雨衰减指数 n 不能为负");
  if (p.psi <= 0 || p.psi > 1) throw new Error("洪峰径流系数 ψ 应在 (0,1]");
  if (p.F >= 100) throw new Error("推理公式适用于汇水面积 <100 km²（规范 6.4.2），当前 " + p.F + " km²");
  return 0.278 * p.psi * (p.Sp / Math.pow(p.tau, p.n)) * p.F;
}

export interface RunoffDepthInput {
  psi: number;    // 地貌系数 ψ（规范细则用 ψ，公式与推理公式径流系数 ψ 符号复用）
  h: number;      // 径流厚度 mm
  z: number;      // 植被/坑洼滞留径流厚度 mm
  F: number;      // 汇水面积 km²
  beta: number;   // 洪峰传播流量折减系数
  gamma: number;  // 降雨不均匀折减系数
  delta: number;  // 湖泊/小水库调节折减系数
}

export function runoffDepthFormula(p: RunoffDepthInput): number {
  if (![p.psi, p.h, p.z, p.F, p.beta, p.gamma, p.delta].every(Number.isFinite)) throw new Error("径流厚度法输入必须为有限数");
  if (p.F <= 0) throw new Error("汇水面积 F 必须为正（km²）");
  if (p.h - p.z <= 0) throw new Error("径流厚度 h 必须大于滞留厚度 z");
  if (p.psi <= 0) throw new Error("地貌系数 ψ 必须为正");
  if (p.beta <= 0 || p.beta > 1 || p.gamma <= 0 || p.gamma > 1 || p.delta <= 0 || p.delta > 1) {
    throw new Error("折减系数 β、γ、δ 均应在 (0,1]");
  }
  return p.psi * Math.pow(p.h - p.z, 3 / 2) * Math.pow(p.F, 4 / 5) * p.beta * p.gamma * p.delta;
}
