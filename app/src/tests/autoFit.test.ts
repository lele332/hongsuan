import { test } from "node:test";
import assert from "node:assert/strict";
import { autoFit } from "../core/autoFit.ts";
import { continuousPoints, sseOfPoints } from "../core/points.ts";
import { lcg, sampleP3 } from "../core/bayes.ts";
import { phiPIII } from "../core/phi.ts";

// 合成 P-Ⅲ 大样本 → 优化适线应从粗略初值收敛到真值附近
test("autoFit 从粗初值收敛到真值附近", () => {
  const rnd = lcg(7);
  const alpha = 4, beta = 2 / 500; // cs=1（α=4），σ=500
  const xs: number[] = [];
  for (let i = 0; i < 2000; i++) xs.push(sampleP3(rnd, 0, beta, alpha));
  const pts = continuousPoints(xs);
  const mean = xs.reduce((s, v) => s + v, 0) / xs.length;
  // 粗初值：cv/cs 都偏离真值（0.5/1.0）
  const r = autoFit(pts, { mean, cv: 0.9, cs: 2.5 });
  assert.ok(r.improved);
  assert.ok(r.sse <= r.sseInitial + 1e-9, "SSE 不应劣化");
  assert.ok(Math.abs(r.cv - 0.5) < 0.15, `cv=${r.cv.toFixed(3)}`);
  assert.ok(Math.abs(r.cs - 1.0) < 0.5, `cs=${r.cs.toFixed(3)}`);
  // 与真值参数的 SSE 对比：寻优结果不应明显差于真值
  const sseTrue = sseOfPoints(pts, { mean, cv: 0.5, cs: 1.0 }, phiPIII);
  assert.ok(r.sse < sseTrue * 1.5 + 1e-9, `sse=${r.sse} vs true=${sseTrue}`);
});

test("autoFit 守卫", () => {
  assert.throws(() => autoFit([], { mean: 100, cv: 0.3, cs: 0.6 }), /至少需要 3 个/);
  assert.throws(() => autoFit(continuousPoints([1, 2, 3]), { mean: 0, cv: 0.3, cs: 0.6 }), /均值/);
});
