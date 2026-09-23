import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSeries } from "../core/parse.ts";

test("parseSeries 常规分隔符混合", () => {
  const r = parseSeries("1200 850,1500，900;1100；1350");
  assert.deepEqual(r.values, [1200, 850, 1500, 900, 1100, 1350]);
  assert.deepEqual(r.ignored, []);
});

test("parseSeries 无效值逐条报告（不再静默）", () => {
  const r = parseSeries("100 200 abc -50 300 1e999 0");
  assert.deepEqual(r.values, [100, 200, 300]);
  assert.deepEqual(r.ignored, ["abc", "-50", "1e999", "0"]);
});

test("parseSeries 空串与全无效", () => {
  assert.deepEqual(parseSeries("").values, []);
  const r = parseSeries("x,y");
  assert.equal(r.values.length, 0);
  assert.equal(r.ignored.length, 2);
});

test("parseSeries 保持输入顺序（排序由点据组装负责）", () => {
  const r = parseSeries("300 100 200");
  assert.deepEqual(r.values, [300, 100, 200]);
});

test("parseSeries 小数与科学计数法", () => {
  const r = parseSeries("1.5 2.5e2");
  assert.deepEqual(r.values, [1.5, 250]);
});
