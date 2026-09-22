// 方法 C（无资料地区）测试：量纲锚点 + 代数一致性 + 参数守卫
import { test } from "node:test";
import assert from "node:assert/strict";
import { rationalFormula, runoffDepthFormula } from "../core/methodC.ts";

test("推理公式量纲锚点：Sp=36 mm/h（=10 mm/10min 折算）、τ=1h、n=1、ψ=1、F=1 km² → Q=10 m³/s", () => {
  // Sp/τⁿ = 36/1 = 36 mm/h；1 mm/h × 1 km² = 0.278 m³/s
  // Q = 0.278 × 36 × 1 = 10.008（理论值：36×10⁻³/3600×10⁶ = 10 m³/s，系数 0.278 是 1/3.6 的近似）
  const q = rationalFormula({ Sp: 36, n: 1, psi: 1, tau: 1, F: 1 });
  assert.ok(Math.abs(q - 10.008) < 1e-9, `Q 算得 ${q}`);
});

test("推理公式代数一致性：ψ、F 线性缩放，τⁿ 反比", () => {
  const base = rationalFormula({ Sp: 80, n: 0.65, psi: 0.85, tau: 0.55, F: 3.94 });
  const halfPsi = rationalFormula({ Sp: 80, n: 0.65, psi: 0.85 / 2, tau: 0.55, F: 3.94 });
  const doubleF = rationalFormula({ Sp: 80, n: 0.65, psi: 0.85, tau: 0.55, F: 3.94 * 2 });
  const doubleTau = rationalFormula({ Sp: 80, n: 0.65, psi: 0.85, tau: 0.55 * 2, F: 3.94 });
  assert.ok(Math.abs(halfPsi - base / 2) < 1e-9);
  assert.ok(Math.abs(doubleF - 2 * base) < 1e-9);
  assert.ok(Math.abs(doubleTau - base / Math.pow(2, 0.65)) < 1e-9);
});

test("径流厚度法代数一致性：βγδ 乘性缩放、(h−z)^(5/3) 幂次", () => {
  const base = runoffDepthFormula({ phi: 0.1, h: 44, z: 10, F: 3.94, beta: 1, gamma: 1, delta: 1 });
  const k = runoffDepthFormula({ phi: 0.1, h: 44, z: 10, F: 3.94, beta: 0.8, gamma: 0.95, delta: 1 });
  assert.ok(Math.abs(k - base * 0.8 * 0.95) < 1e-9);
  // (h−z) 从 34→68（×2）→ Q ×2^(5/3)
  const dbl = runoffDepthFormula({ phi: 0.1, h: 78, z: 10, F: 3.94, beta: 1, gamma: 1, delta: 1 });
  assert.ok(Math.abs(dbl - base * Math.pow(2, 5 / 3)) < 1e-9);
  // ⚠️ 公开贵州算例数字与本式不自洽（见 methodC.ts 头注），形式待教材核实
});

test("方法 C 守卫：F≥100 报错（规范 6.4.2）、h≤z 报错、ψ 越界报错", () => {
  assert.throws(() => rationalFormula({ Sp: 80, n: 0.6, psi: 0.85, tau: 0.5, F: 150 }), /100 km²/);
  assert.throws(() => rationalFormula({ Sp: 80, n: 0.6, psi: 1.2, tau: 0.5, F: 50 }), /ψ/);
  assert.throws(() => runoffDepthFormula({ phi: 0.1, h: 30, z: 44, F: 3.9, beta: 1, gamma: 1, delta: 1 }), /h 必须/);
});
