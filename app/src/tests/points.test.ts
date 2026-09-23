import { test } from "node:test";
import assert from "node:assert/strict";
import { continuousPoints, discontinuousPoints, sseOfPoints } from "../core/points.ts";
import { seriesStats } from "../core/stats.ts";
import { phiPIII } from "../core/phi.ts";

// 连序点据：与手算 m/(n+1) 逐项一致
test("continuousPoints 连序经验频率点据", () => {
  const pts = continuousPoints([300, 100, 200]);
  assert.equal(pts.length, 3);
  assert.deepEqual(pts.map(p => p.q), [300, 200, 100]); // 降序
  assert.ok(Math.abs(pts[0].p - 1 / 4) < 1e-12);
  assert.ok(Math.abs(pts[1].p - 2 / 4) < 1e-12);
  assert.ok(Math.abs(pts[2].p - 3 / 4) < 1e-12);
  assert.ok(pts.every(p => p.kind === "meas"));
});

// 输入顺序无关性
test("continuousPoints 输入乱序结果一致", () => {
  const a = continuousPoints([100, 300, 200]);
  const b = continuousPoints([200, 100, 300]);
  assert.deepEqual(a, b);
});

// 不连序：与土木在线算例 T3 锚定（N=85 考证、统一样本点）
test("discontinuousPoints 不连序点据与统计参数", () => {
  // 合成可手算案例：N=100, 实测 n=7 降序，前 l=1 项为特大，考证期独有 2 项
  const measured = [7000, 600, 500, 400, 300, 200, 100];
  const extra = [9000, 8000];
  const { stats, points } = discontinuousPoints({
    historicalExtra: extra, measuredDesc: measured, l: 1, N: 100,
  });
  assert.equal(stats.a, 3);
  assert.equal(stats.n, 7);
  // 特大按流量降序：9000(M=1), 8000(M=2), 7000(M=3) → P=M/101
  const hist = points.filter(p => p.kind === "hist");
  assert.equal(hist.length, 3);
  assert.deepEqual(hist.map(p => p.q), [9000, 8000, 7000]);
  assert.ok(Math.abs(hist[0].p - 1 / 101) < 1e-12);
  assert.ok(Math.abs(hist[2].p - 3 / 101) < 1e-12);
  // 一般项 m=2..7：Pm = a/(N+1) + (1−a/(N+1))·(m−l)/(n−l+1)
  const pA = 3 / 101;
  const meas = points.filter(p => p.kind === "meas");
  assert.equal(meas.length, 6);
  for (let i = 0; i < 6; i++) {
    const m = i + 2; // m = 2..7
    const expected = pA + (1 - pA) * (m - 1) / (7 - 1 + 1);
    assert.ok(Math.abs(meas[i].p - expected) < 1e-12, `m=${m}`);
    assert.equal(meas[i].q, measured[m - 1]);
  }
  // 统计参数与 stats.ts 直调一致
  assert.ok(Number.isFinite(stats.mean) && stats.mean > 0);
  assert.ok(Math.abs(stats.cv - 2.2951) < 1e-3);
});

// a=0/l=0 退化：与连序一致
test("discontinuousPoints 退化到连序", () => {
  const xs = [300, 100, 200];
  const { stats } = discontinuousPoints({ historicalExtra: [], measuredDesc: xs, l: 0, N: 3 });
  const st = seriesStats(xs);
  assert.ok(Math.abs(stats.mean - st.mean) < 1e-9);
  assert.ok(Math.abs(stats.cv - st.cv) < 1e-9);
});

// SSE：与手算一致
test("sseOfPoints 与手算离差平方和一致", () => {
  const pts = continuousPoints([300, 100, 200]);
  const params = { mean: 200, cv: 0.5, cs: 1 };
  const sse = sseOfPoints(pts, params, phiPIII);
  let manual = 0;
  for (const pt of pts) {
    const qt = 200 * (1 + phiPIII(pt.p, 1) * 0.5);
    manual += (pt.q - qt) ** 2;
  }
  assert.ok(Math.abs(sse - manual) < 1e-6);
});
