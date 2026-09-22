// 测试基准算例（数据来源：参考资料\教材与例题资料.md §4）
// T1 教学题（renrendoc 题库）、T2 适线案例（CSDN）、T3 不连序算例（土木在线）、T4 工程参数（达板）
import { test } from "node:test";
import assert from "node:assert/strict";
import { seriesStats } from "../core/stats.ts";
import { designFlood } from "../core/designflood.ts";
import { empiricalContinuous, empiricalMethodB } from "../core/empirical.ts";

test("算例 T1 矩法：均值/均方差/Cv（含完整数据与标准答案）", () => {
  const xs = [1200, 850, 1500, 900, 1100, 1350, 700, 1000, 1400, 650];
  const st = seriesStats(xs);
  assert.ok(Math.abs(st.mean - 1065) < 0.01, `均值算得 ${st.mean}`);
  // ⚠️ 题库勘误：题解离差平方和写 885350（σ=313.64），实为 785250（逐项手算验证），
  // σ = √(785250/9) = 295.38。本软件以手算复核为准。
  assert.ok(Math.abs(st.sigma - 295.38) < 0.01, `σ 算得 ${st.sigma}`);
  assert.ok(Math.abs(st.cv - 0.2774) < 0.001, `Cv 算得 ${st.cv}`);
  // 题解 Kp=3.0 与 Cs=2Cv=0.58 参数不自洽（Kp 表引用疑有误），
  // 软件用 Φ 数值法自算：见下条
});

test("算例 T1 设计值（软件自算 Kp，替代题库凑数表值）", () => {
  const st = seriesStats([1200, 850, 1500, 900, 1100, 1350, 700, 1000, 1400, 650]);
  const r = designFlood({ mean: st.mean, cv: st.cv, cs: 2 * st.cv }, 0.01);
  // Cs≈0.555、P=1% 的 Φ 应在 2.6~2.8（介于正态 2.33 与 Cs=1.5 的 3.33 之间）
  assert.ok(r.phi > 2.5 && r.phi < 2.9, `Φ 算得 ${r.phi}`);
  assert.ok(r.q > 1600 && r.q < 2000, `Q1% 算得 ${r.q}`);
});

test("算例 T2：Q̄=860、Cv=0.605、Cs=1.5 → Q1% ≈ 2593", () => {
  const r = designFlood({ mean: 860, cv: 0.605, cs: 1.5 }, 0.01);
  assert.ok(Math.abs(r.q - 2593) < 10, `Q1% 算得 ${r.q}，Φ=${r.phi}`);
  // ⚠️ CSDN 原文校核洪水 Φ(0.1%, Cs=1.5)=4.58 与趋势不符（Cs=2 解析值 5.9078，
  // Cs=1.5 应略小），软件自算 Φ=5.2335 → Q0.1% ≈ 3583，以软件值为准
  const r2 = designFlood({ mean: 860, cv: 0.605, cs: 1.5 }, 0.001);
  assert.ok(Math.abs(r2.phi - 5.2335) < 0.01, `Φ(0.1%) 算得 ${r2.phi}`);
  assert.ok(Math.abs(r2.q - 3583) < 10, `Q0.1% 算得 ${r2.q}`);
});

test("算例 T3 采用值：Q̄=5173.6、Cv=0.331、Cs=1.99 → Q1% ≈ 11345", () => {
  const r = designFlood({ mean: 5173.6, cv: 0.331, cs: 1.99 }, 0.01);
  assert.ok(Math.abs(r.phi - 3.604) < 0.01, `Φ 算得 ${r.phi}`);
  assert.ok(Math.abs(r.q - 11345) < 40, `Q1% 算得 ${r.q}`);
});

test("算例 T3 结构：经验频率方法二（条件概率）边界行为", () => {
  // 构造最小化结构验证公式方向与单调性
  // N=200 考证期、n=30 实测、l=2 实测期内特大、历史特大 a=5（M 序位 1,2）
  const pts = empiricalMethodB({
    historical: [{ M: 1 }, { M: 2 }],
    measuredRank: Array.from({ length: 30 }, (_, i) => i + 1),
    l: 2,
    N: 200,
  });
  const hist = pts.filter((p) => p.kind === "historical");
  const meas = pts.filter((p) => p.kind === "measured");
  assert.ok(Math.abs(hist[0].p - (100 * 1) / 201) < 1e-9);
  assert.ok(Math.abs(hist[1].p - (100 * 2) / 201) < 1e-9);
  // 实测期一般洪水（m=3..30）频率应从 PM,l 之后开始且单调递增
  for (let i = 1; i < meas.length; i++) {
    assert.ok(meas[i].p > meas[i - 1].p, "经验频率应单调递增");
  }
  assert.ok(meas[0].p > hist[1].p, "实测期一般洪水频率应大于特大洪水频率");
});

test("连序经验频率：n=10 → 第一项 P=1/11、末项 P=10/11", () => {
  const ps = empiricalContinuous(10);
  assert.ok(Math.abs(ps[0] - 100 / 11) < 1e-9);
  assert.ok(Math.abs(ps[9] - 1000 / 11) < 1e-9);
});

test("算例 T4 量级校验（达板电站）：Cv≈0.32、Cs=2.5Cv 参数组合可算", () => {
  const r = designFlood({ mean: 135, cv: 0.32, cs: 0.8 }, 0.01);
  // 李家村站 1% 设计值（径流/洪水）应显著大于均值且有限
  assert.ok(Number.isFinite(r.q) && r.q > 135 && r.q < 1000);
});
