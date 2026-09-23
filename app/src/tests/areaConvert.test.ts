import { test } from "node:test";
import assert from "node:assert/strict";
import { areaConvert, suggestExponent } from "../core/areaConvert.ts";

test("面积相等 → Q 不变", () => {
  const r = areaConvert({ qRef: 2000, fRef: 500, fSite: 500 });
  assert.equal(r.qSite, 2000);
  assert.equal(r.preconditionOk, true);
});

test("n=1 时严格面积比", () => {
  const r = areaConvert({ qRef: 1000, fRef: 400, fSite: 440, n: 1 });
  assert.ok(Math.abs(r.qSite - 1100) < 1e-9);
});

test("建议指数规则", () => {
  assert.equal(suggestExponent(500, 510), 1);       // 差 ≤3% → n=1
  assert.ok(suggestExponent(50, 80) > 0.7);          // 小河流 >0.7
  assert.ok(suggestExponent(500, 800) >= 0.5 && suggestExponent(500, 800) <= 0.7);
});

test("超条件给出警示", () => {
  const r = areaConvert({ qRef: 1000, fRef: 500, fSite: 700 }); // 差 40% ≥20%
  assert.equal(r.preconditionOk, false);
  assert.ok(r.warnings.some(w => /20%/.test(w)));
  const r2 = areaConvert({ qRef: 1000, fRef: 900, fSite: 1200 }); // >1000km²
  assert.equal(r2.preconditionOk, false);
  assert.ok(r2.warnings.some(w => /1000/.test(w)));
});

test("守卫", () => {
  assert.throws(() => areaConvert({ qRef: 0, fRef: 100, fSite: 100 }), /为正/);
  assert.throws(() => areaConvert({ qRef: 100, fRef: -1, fSite: 100 }), /为正/);
  assert.throws(() => areaConvert({ qRef: 100, fRef: 100, fSite: 100, n: 0 }), /n 必须为正/);
});
