import { test } from "node:test";
import assert from "node:assert/strict";
import { parseHydrograph, scaleHydrograph } from "../core/hydrograph.ts";

// 三角形示例过程线：t=0..12h，峰 800 m³/s 在 t=6
const TYPICAL = [
  { t: 0, q: 0 }, { t: 2, q: 267 }, { t: 4, q: 533 }, { t: 6, q: 800 },
  { t: 8, q: 533 }, { t: 10, q: 267 }, { t: 12, q: 0 },
];

test("同倍比放大：峰精确等于设计洪峰", () => {
  const r = scaleHydrograph(TYPICAL, 2000);
  assert.ok(Math.abs(r.kg - 2.5) < 1e-12);
  assert.equal(r.typicalPeak, 800);
  const peak = Math.max(...r.points.map(p => p.q));
  assert.ok(Math.abs(peak - 2000) < 0.01);
  // 峰出现时刻不变
  const tPeak = r.points.find(p => p.q === peak)!.t;
  assert.equal(tPeak, 6);
});

test("同倍比放大：所有纵标同比例", () => {
  const r = scaleHydrograph(TYPICAL, 1200);
  const kg = r.kg;
  r.points.forEach((p, i) => {
    assert.ok(Math.abs(p.q - TYPICAL[i].q * kg) < 0.01);
    assert.equal(p.t, TYPICAL[i].t);
  });
});

test("解析：多分隔符混合与行号报错", () => {
  const pts = parseHydrograph("0 0\n2,267\n4，533\n6  800");
  assert.equal(pts.length, 4);
  assert.equal(pts[2].q, 533);
  assert.throws(() => parseHydrograph("0 0\nabc 5"), /第 2 行时间/);
  assert.throws(() => parseHydrograph("0 0\n5 -3"), /第 2 行流量/);
  assert.throws(() => parseHydrograph("0 0 1\n2 3"), /第 1 行应有 2 个数值/);
  assert.throws(() => parseHydrograph("0 0"), /至少需要 2 行/);
});

test("守卫：零峰值与设计洪峰非正", () => {
  assert.throws(() => scaleHydrograph([{ t: 0, q: 0 }, { t: 1, q: 0 }], 100), /峰值为 0/);
  assert.throws(() => scaleHydrograph(TYPICAL, 0), /设计洪峰/);
  assert.throws(() => scaleHydrograph([{ t: 0, q: 1 }], 100), /至少需要 2 个点/);
  assert.throws(() => scaleHydrograph([{ t: 0, q: 1 }, { t: 1, q: -1 }], 100), /非负/);
});
