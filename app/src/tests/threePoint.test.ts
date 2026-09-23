import { test } from "node:test";
import assert from "node:assert/strict";
import { threePointFit, empiricalQuantiles, threePointFromSeries } from "../core/threePoint.ts";
import { lcg, sampleP3 } from "../core/bayes.ts";
import { phiPIII } from "../core/phi.ts";

// 解析恢复：用已知参数生成的精确三点，必须还原参数
test("threePointFit 精确三点还原参数", () => {
  // 真值：mean=1000, cv=0.5, cs=1.2 → sigma=500
  const mean = 1000, sigma = 500, cs = 1.2;
  const mk = (p: number) => mean + sigma * phiPIII(p, cs);
  const r = threePointFit([
    { p: 0.05, x: mk(0.05) },
    { p: 0.5, x: mk(0.5) },
    { p: 0.95, x: mk(0.95) },
  ]);
  assert.ok(Math.abs(r.mean - 1000) < 1e-6, `mean=${r.mean}`);
  assert.ok(Math.abs(r.cv - 0.5) < 1e-9, `cv=${r.cv}`);
  assert.ok(Math.abs(r.cs - 1.2) < 1e-6, `cs=${r.cs}`);
});

// Cs=0 对称情形：S=0 → 正态恢复
test("threePointFit 对称数据 → Cs=0", () => {
  const mean = 800, sigma = 200, cs = 0;
  const mk = (p: number) => mean + sigma * phiPIII(p, cs);
  const r = threePointFit([
    { p: 0.05, x: mk(0.05) },
    { p: 0.5, x: mk(0.5) },
    { p: 0.95, x: mk(0.95) },
  ]);
  assert.ok(Math.abs(r.cs) < 1e-9);
  assert.ok(Math.abs(r.mean - 800) < 1e-6);
  assert.ok(Math.abs(r.cv - 0.25) < 1e-9);
});

// 大样本噪声恢复：n=4000 合成 P-Ⅲ 样本 → 参数应在统计误差内
test("threePointFit 大样本统计恢复", () => {
  const rnd = lcg(42);
  const mean = 1000, cv = 0.5, cs = 1.0, sigma = mean * cv;
  // P-Ⅲ(a0=0, beta, alpha)：sigma²=alpha/beta², 偏度 2/sqrt(alpha)=cs
  const alpha = 4 / (cs * cs);
  const beta = Math.sqrt(alpha) / sigma;
  const xs: number[] = [];
  for (let i = 0; i < 4000; i++) xs.push(sampleP3(rnd, 0, beta, alpha));
  const r = threePointFromSeries(xs);
  assert.ok(Math.abs(r.mean - mean) / mean < 0.1, `mean=${r.mean.toFixed(0)}`);
  assert.ok(Math.abs(r.cv - cv) < 0.1, `cv=${r.cv.toFixed(3)}`);
  assert.ok(Math.abs(r.cs - cs) < 0.6, `cs=${r.cs.toFixed(3)}`);
});

// 经验分位数：与韦伯排位手算一致
test("empiricalQuantiles 韦伯排位插值", () => {
  const xs = [100, 200, 300, 400]; // n=4，降序后 400,300,200,100
  // P=0.2 → rank=1.0 → 400；P=0.4 → rank=2.0 → 300；P=0.6 → rank=3 → 200
  const q = empiricalQuantiles(xs, [0.2, 0.4, 0.6]);
  assert.deepEqual(q, [400, 300, 200]);
  // P=0.3 → rank=1.5 → 350
  assert.equal(empiricalQuantiles(xs, [0.3])[0], 350);
});

// 守卫
test("threePointFit 守卫", () => {
  assert.throws(() => threePointFit([{ p: 0.5, x: 1 }, { p: 0.05, x: 2 }, { p: 0.95, x: 0 }]), /递增/);
  assert.throws(() => threePointFit([{ p: 0.05, x: 1 }, { p: 0.5, x: 1 }, { p: 0.95, x: 1 }]), /x1 > x3/);
  assert.throws(() => threePointFromSeries([1, 2]), /至少需要 3 个数据/);
});
