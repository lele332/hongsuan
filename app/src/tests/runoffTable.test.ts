import { test } from "node:test";
import assert from "node:assert/strict";
import {
  RUNOFF_TABLE_SEED, RUNOFF_TABLE_SCHEMA, loadRunoffTable,
  lookupRunoffH, validateRunoffTable,
} from "../core/runoffTable.ts";

test("loadRunoffTable 拒绝错误 schema", () => {
  assert.throws(() => loadRunoffTable({ schema: "other" }), /schema/);
  assert.throws(() => loadRunoffTable(null), /JSON/);
  assert.throws(() => loadRunTableMissingSource(), /source/);
  function loadRunTableMissingSource() { return loadRunoffTable({ schema: RUNOFF_TABLE_SCHEMA, zones: {} }); }
});

test("loadRunoffTable 拒绝非法分区/土类/数值", () => {
  assert.throws(() => loadRunoffTable({ schema: RUNOFF_TABLE_SCHEMA, source: "t", zones: { "19": {} } }), /分区/);
  assert.throws(() => loadRunoffTable({ schema: RUNOFF_TABLE_SCHEMA, source: "t", zones: { "3": { badSoil: [] } } }), /土壤/);
  assert.throws(() => loadRunoffTable({
    schema: RUNOFF_TABLE_SCHEMA, source: "t",
    zones: { "3": { soilII: [{ tau: 30, h: { p1: -1, p2: 1, p3_33: 1, p5: 1, p10: 1 } }, { tau: 60, h: { p1: 2, p2: 2, p3_33: 2, p5: 2, p10: 2 } }] } },
  }), /正数/);
  assert.throws(() => loadRunoffTable({
    schema: RUNOFF_TABLE_SCHEMA, source: "t",
    zones: { "3": { soilII: [{ tau: 30, h: { p1: 1, p2: 1, p3_33: 1, p5: 1, p10: 1 } }] } },
  }), /2 行/);
});

test("lookupRunoffH 节点值精确命中", () => {
  const r = lookupRunoffH(RUNOFF_TABLE_SEED, 5, "IV", 3.33, 45);
  assert.equal(r.h, 44);
  assert.equal(r.interpolated, false);
  const r2 = lookupRunoffH(RUNOFF_TABLE_SEED, 5, "IV", 1, 60);
  assert.equal(r2.h, 57);
});

test("lookupRunoffH τ 线性插值中点", () => {
  const r = lookupRunoffH(RUNOFF_TABLE_SEED, 5, "IV", 3.33, 52.5); // 45~60 中点
  assert.ok(Math.abs(r.h - 44.5) < 0.01, `h=${r.h}`);
  assert.equal(r.interpolated, true);
});

test("lookupRunoffH 频率对数插值（1%~2% 之间）", () => {
  const r = lookupRunoffH(RUNOFF_TABLE_SEED, 5, "IV", 1.5, 30);
  // 语义：对数频率轴权重 w=ln(1.5/1)/ln(2/1)，h 线性过渡
  const w = Math.log(1.5) / Math.log(2);
  const expect = 52 + (46 - 52) * w;
  assert.ok(Math.abs(r.h - expect) < 0.01, `h=${r.h}, expect=${expect}`);
  assert.equal(r.interpolated, true);
});

test("lookupRunoffH 越界与缺数据响亮失败", () => {
  assert.throws(() => lookupRunoffH(RUNOFF_TABLE_SEED, 5, "IV", 3.33, 10), /超出表范围/);
  assert.throws(() => lookupRunoffH(RUNOFF_TABLE_SEED, 9, "IV", 3.33, 45), /没有分区/);
  assert.throws(() => lookupRunoffH(RUNOFF_TABLE_SEED, 5, "I", 3.33, 45), /没有分区/);
  assert.throws(() => lookupRunoffH(RUNOFF_TABLE_SEED, 5, "IV", 3.33, -5), /正/);
});

test("种子自检通过", () => {
  assert.deepEqual(validateRunoffTable(RUNOFF_TABLE_SEED), []);
});
