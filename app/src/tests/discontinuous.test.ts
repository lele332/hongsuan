// 不连序系列（特大洪水）统计参数与经验频率测试
// 公式：《水利水电工程设计洪水计算规范》附录 A.1.1-7~9（统一样法）
import { test } from "node:test";
import assert from "node:assert/strict";
import { discontinuousStats, seriesStats } from "../core/stats.ts";
import { empiricalMethodA, empiricalMethodB } from "../core/empirical.ts";

test("不连序矩法手算锚点：N=100, 实测内特大 1 项(800), 考证期独有特大(1000,900)", () => {
  // 实测系列从大到小：800 + 19 项 500；l=1（800 为特大）
  // a = 3（1000, 900, 800）
  const measuredDesc = [800, ...Array(19).fill(500)];
  const st = discontinuousStats({
    historicalExtra: [1000, 900],
    measuredDesc,
    l: 1,
    N: 100,
  });
  assert.equal(st.a, 3);
  // 均值 = (2700 + (97/19)·9500)/100 = 512（手工逐项计算）
  assert.ok(Math.abs(st.mean - 512) < 1e-9, `均值算得 ${st.mean}`);
  // σ² = [488²+388²+288² + (97/19)·19·(−12)²]/99 = [471632 + 13968]/99
  assert.ok(Math.abs(st.sigma - Math.sqrt(485600 / 99)) < 1e-9, `σ 算得 ${st.sigma}`);
  assert.ok(Math.abs(st.cv - Math.sqrt(485600 / 99) / 512) < 1e-9, `Cv 算得 ${st.cv}`);
  // Cs 手算 ≈ 5.94（特大值主导三阶矩，验量级与符号）
  assert.ok(st.cs > 5.0 && st.cs < 7.0, `Cs 算得 ${st.cs}`);
});

test("不连序退化为连序：a=0, l=0, N=n 时与 seriesStats 一致", () => {
  const xs = [1200, 850, 1500, 900, 1100, 1350, 700, 1000, 1400, 650];
  const sorted = [...xs].sort((a, b) => b - a);
  const d = discontinuousStats({ historicalExtra: [], measuredDesc: sorted, l: 0, N: xs.length });
  const s = seriesStats(xs);
  assert.ok(Math.abs(d.mean - s.mean) < 1e-9);
  assert.ok(Math.abs(d.sigma - s.sigma) < 1e-9);
  assert.ok(Math.abs(d.cv - s.cv) < 1e-9);
});

test("统一样法经验频率锚点：N=100, a=2, n=20, l=1", () => {
  const pts = empiricalMethodB({
    historical: [{ M: 1 }, { M: 2 }],
    measuredRank: Array.from({ length: 20 }, (_, i) => i + 1),
    l: 1,
    N: 100,
  });
  const hist = pts.filter((p) => p.kind === "historical");
  const meas = pts.filter((p) => p.kind === "measured");
  assert.ok(Math.abs(hist[0].p - 100 / 101) < 1e-9);
  assert.ok(Math.abs(hist[1].p - 200 / 101) < 1e-9);
  // 一般项首项 m=2：P = 2/101 + (1−2/101)·(1/20)
  const expect2 = 100 * (2 / 101 + (1 - 2 / 101) * (1 / 20));
  assert.ok(Math.abs(meas[0].p - expect2) < 1e-9, `算得 ${meas[0].p}，期望 ${expect2}`);
  // 末项 m=20：P = 2/101 + (99/101)·(19/20)
  const expect20 = 100 * (2 / 101 + (99 / 101) * (19 / 20));
  assert.ok(Math.abs(meas[meas.length - 1].p - expect20) < 1e-9);
  // 单调性
  for (let i = 1; i < meas.length; i++) assert.ok(meas[i].p > meas[i - 1].p);
});

test("独立样本法（方法一）保持不变：特大 M/(N+1)、实测 m/(n+1)", () => {
  const pts = empiricalMethodA({
    historical: [{ M: 1 }, { M: 2 }],
    measuredRank: Array.from({ length: 30 }, (_, i) => i + 1),
    l: 2,
    N: 200,
  });
  const hist = pts.filter((p) => p.kind === "historical");
  assert.ok(Math.abs(hist[0].p - 100 / 201) < 1e-9);
  assert.ok(Math.abs(hist[1].p - 200 / 201) < 1e-9);
});

test("边界守卫：l>n / N≤a / 全特大", () => {
  assert.throws(() => discontinuousStats({ historicalExtra: [], measuredDesc: [1], l: 5, N: 100 }), /l/);
  assert.throws(() => discontinuousStats({ historicalExtra: [1, 2, 3], measuredDesc: [1, 2], l: 0, N: 3 }), /N/);
  assert.throws(() => discontinuousStats({ historicalExtra: [], measuredDesc: [1, 2], l: 2, N: 100 }), /n−l|n-l/);
});

test("T3 场景结构检验：a=5, l=2, N=200, n=30 参数可算且量级合理", () => {
  // 以合成数据验证 T3 的结构（N=200, n=30, a=5, l=2）
  // 实测从大到小：9100, 8900 为特大（l=2），其余 28 项递减
  const measuredDesc = [9100, 8900, ...Array.from({ length: 28 }, (_, i) => 5400 - i * 120)];
  const st = discontinuousStats({
    historicalExtra: [14000, 12500, 11000],
    measuredDesc,
    l: 2,
    N: 200,
  });
  assert.equal(st.a, 5);
  assert.ok(st.mean > 3000 && st.mean < 8000, `均值 ${st.mean}`);
  assert.ok(st.cv > 0.1 && st.cv < 1.0, `Cv ${st.cv}`);
  assert.ok(Number.isFinite(st.cs));
});
