import { test } from "node:test";
import assert from "node:assert/strict";
import { seriesStats, discontinuousStats } from "../core/stats.ts";
import { manningQ, designFromHistory } from "../core/methodB.ts";
import { rationalFormula, runoffDepthFormula } from "../core/methodC.ts";
import { phiPIII } from "../core/phi.ts";

test("边界守卫：连序系列至少 3 项且必须是有限非负数", () => {
  assert.throws(() => seriesStats([100, 200]), /至少 3/);
  assert.throws(() => seriesStats([100, 200, Number.POSITIVE_INFINITY]), /有限/);
  assert.throws(() => seriesStats([100, 200, -1]), /非负/);
});

test("边界守卫：不连序系列 N 必须为不小于 3 的整数", () => {
  assert.throws(() => discontinuousStats({ historicalExtra: [], measuredDesc: [1, 2, 3], l: 0, N: 2 }), /N.*3/);
  assert.throws(() => discontinuousStats({ historicalExtra: [], measuredDesc: [1, 2, 3], l: 0, N: 2.5 }), /整数/);
  assert.throws(() => discontinuousStats({ historicalExtra: [Number.NaN], measuredDesc: [1, 2, 3], l: 0, N: 10 }), /有限/);
});

test("边界守卫：曼宁公式河滩过水时河滩糙率必须为正", () => {
  assert.throws(() => manningQ({ Ac: 100, Bc: 10, nc: 0.03, At: 20, Bt: 10, nt: 0, I: 0.001 }), /河滩糙率/);
  assert.throws(() => manningQ({ Ac: Number.NaN, Bc: 10, nc: 0.03, At: 0, Bt: 0, nt: 0, I: 0.001 }), /有限/);
});

test("边界守卫：历史洪水法输入必须为有限值且设计频率合法", () => {
  assert.throws(() => designFromHistory([{ Q: 1000, T: 100 }, { Q: Number.NaN, T: 50 }], { cv: 0.5, cs: 2 }, 0.01, phiPIII), /有限/);
  assert.throws(() => designFromHistory([{ Q: 1000, T: 100 }, { Q: 900, T: 50 }], { cv: 0.5, cs: Number.NaN }, 0.01, phiPIII), /有限/);
});

test("边界守卫：方法 C 全部输入必须有限，折减系数应在 (0,1]", () => {
  assert.throws(() => rationalFormula({ Sp: Number.NaN, n: 0.6, psi: 0.8, tau: 1, F: 10 }), /有限/);
  assert.throws(() => runoffDepthFormula({ psi: 0.1, h: 44, z: 10, F: 3.94, beta: 1.2, gamma: 1, delta: 1 }), /折减/);
  assert.throws(() => runoffDepthFormula({ psi: 0.1, h: 44, z: 10, F: 3.94, beta: 0, gamma: 1, delta: 1 }), /折减/);
});
