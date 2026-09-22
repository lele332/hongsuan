// Φ 值数值算法的验收测试（校验点数据见 参考资料汇编 §5）
// 运行：node --experimental-strip-types --test src/tests/phi.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { phiPIII, kpPIII, gammaincLower, gammaQuantile, norminv } from "../core/phi.ts";

test("Cs=2、P=1%：指数分布解析锚点 Φ = ln(100) − 1 = 3.60517", () => {
  const exact = Math.log(100) - 1;
  assert.ok(Math.abs(phiPIII(0.01, 2) - exact) < 0.001,
    `解析值 ${exact}，算得 ${phiPIII(0.01, 2)}`);
});

test("Cs=2、P=0.1%：解析锚点 Φ = ln(1000) − 1 = 5.90776", () => {
  const exact = Math.log(1000) - 1;
  assert.ok(Math.abs(phiPIII(0.001, 2) - exact) < 0.001,
    `解析值 ${exact}，算得 ${phiPIII(0.001, 2)}`);
});

test("Cs=0：正态分布 Φ(1%) = 2.3263", () => {
  assert.ok(Math.abs(phiPIII(0.01, 0) - 2.3263) < 0.001,
    `算得 ${phiPIII(0.01, 0)}`);
});

test("Cs=1.99、P=1%：土木在线算例 T3 → Φ = 3.604", () => {
  assert.ok(Math.abs(phiPIII(0.01, 1.99) - 3.604) < 0.01,
    `算得 ${phiPIII(0.01, 1.99)}`);
});

test("Cs=1.5、P=1%：CSDN 算例 T2 → Φ ≈ 3.33", () => {
  const v = phiPIII(0.01, 1.5);
  assert.ok(Math.abs(v - 3.33) < 0.02, `算得 ${v}`);
});

test("Cs=0 其他分位点（P=10% → 1.2816；P=0.1% → 3.0902）", () => {
  assert.ok(Math.abs(phiPIII(0.1, 0) - 1.2816) < 0.001);
  assert.ok(Math.abs(phiPIII(0.001, 0) - 3.0902) < 0.001);
});

test("Cs<0 镜像：Φ(−Cs, p) = −Φ(Cs, 1−p)", () => {
  const a = phiPIII(0.01, 2);
  const b = phiPIII(0.99, -2);
  assert.ok(Math.abs(a + b) < 1e-9);
});

test("下侧频率（P>50%）为负值：Φ(99%, Cs=0) ≈ −2.3263", () => {
  assert.ok(Math.abs(phiPIII(0.99, 0) + 2.3263) < 0.001);
});

test("基础数值函数抽查：P(1,x) 不完全 Gamma 与正态分位", () => {
  // gammaincLower(1, x) = 1 − e^(−x)（指数情形）
  assert.ok(Math.abs(gammaincLower(1, 1) - (1 - Math.exp(-1))) < 1e-12);
  assert.ok(Math.abs(gammaincLower(1, 4.60517) - 0.99) < 0.001);
  assert.ok(Math.abs(norminv(0.975) - 1.959964) < 1e-6);
});

test("Kp = 1 + Φ·Cv（算例 T3：Cs=1.99、Cv=0.331 → Kp ≈ 2.193）", () => {
  const kp = kpPIII(0.01, 1.99, 0.331);
  assert.ok(Math.abs(kp - 2.193) < 0.005, `算得 ${kp}`);
});
