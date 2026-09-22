// 方法 B（历史洪水位法）测试：曼宁手算锚点 + Cs=2 解析锚点
import { test } from "node:test";
import assert from "node:assert/strict";
import { manningQ, designFromHistory } from "../core/methodB.ts";
import { phiPIII } from "../core/phi.ts";

test("曼宁公式手算锚点：Ac=500,Bc=100,nc=0.03 / At=200,Bt=200,nt=0.05 / I=0.0005", () => {
  const r = manningQ({ Ac: 500, Bc: 100, nc: 0.03, At: 200, Bt: 200, nt: 0.05, I: 0.0005 });
  // Rc = 500/100 = 5；Rt = 200/200 = 1
  assert.ok(Math.abs(r.Rc - 5) < 1e-12);
  assert.ok(Math.abs(r.Rt - 1) < 1e-12);
  // python 独立复算：vc = 5^(2/3)·√0.0005/0.03 = 2.17943414
  assert.ok(Math.abs(r.vc - 2.17943414) < 1e-6, `vc 算得 ${r.vc}`);
  // vt = √0.0005/0.05 = 0.44721360
  assert.ok(Math.abs(r.vt - 0.44721360) < 1e-6, `vt 算得 ${r.vt}`);
  // Q = 500×2.17943414 + 200×0.44721360 = 1179.15979
  assert.ok(Math.abs(r.Q - 1179.15979) < 1e-3, `Q 算得 ${r.Q}`);
});

test("曼宁：无河滩时 Q = Ac·vc，直接给 R 分支可用", () => {
  const r = manningQ({ Ac: 300, Bc: 0, nc: 0.025, At: 0, Bt: 0, nt: 0, I: 0.001, Rc: 3 });
  const vcExpect = 3 ** (2 / 3) * Math.sqrt(0.001) / 0.025;
  assert.ok(Math.abs(r.vc - vcExpect) < 1e-12);
  assert.ok(Math.abs(r.Q - 300 * vcExpect) < 1e-9);
  assert.equal(r.vt, 0);
});

test("历史洪水推算设计流量（Cs=2 解析锚点全链路）", () => {
  // 两次历史洪水：Q1=2000（T=100）、Q2=1500（T=50）；地区参数 Cv=0.5、Cs=2.0
  // Cs=2 时 Φ(p) = −ln(p) − 1（指数分布解析）：
  //   Φ(1%) = 3.60517；Φ(2%) = 2.91202
  const r = designFromHistory(
    [{ Q: 2000, T: 100 }, { Q: 1500, T: 50 }],
    { cv: 0.5, cs: 2.0 },
    0.01,
    phiPIII,
  );
  // Q̄T1 = 2000/(1+3.60517×0.5) = 2000/2.80259 = 713.617
  assert.ok(Math.abs(r.qBars[0] - 2000 / 2.8025875) < 1e-3, `Q̄T1 算得 ${r.qBars[0]}`);
  // Q̄T2 = 1500/(1+2.91202×0.5) = 1500/2.45601 = 610.751
  assert.ok(Math.abs(r.qBars[1] - 1500 / 2.4560129) < 1e-3, `Q̄T2 算得 ${r.qBars[1]}`);
  // Q̄ = (713.617+610.751)/2 = 662.184
  assert.ok(Math.abs(r.mean - 662.184) < 0.01, `Q̄ 算得 ${r.mean}`);
  // Qp(1%) = Q̄×(1+3.60517×0.5) = 662.184×2.80259 = 1855.6
  assert.ok(Math.abs(r.q - 1855.6) < 0.5, `Qp 算得 ${r.q}`);
  assert.ok(Math.abs(r.phi - (Math.log(100) - 1)) < 1e-9); // Φ 锚点
});

test("历史洪水守卫：少于 2 次报错（规范 6.3.3）", () => {
  assert.throws(() => designFromHistory([{ Q: 1000, T: 100 }], { cv: 0.5, cs: 2 }, 0.01, phiPIII), /不宜少于 2 次/);
  assert.throws(() => designFromHistory([], { cv: 0.5, cs: 2 }, 0.01, phiPIII), /不宜少于 2 次/);
});

test("曼宁守卫：比降/面积/糙率非法输入", () => {
  assert.throws(() => manningQ({ Ac: 100, Bc: 10, nc: 0.03, At: 0, Bt: 0, nt: 0, I: 0 }), /比降/);
  assert.throws(() => manningQ({ Ac: -1, Bc: 10, nc: 0.03, At: 0, Bt: 0, nt: 0, I: 0.001 }), /面积/);
  assert.throws(() => manningQ({ Ac: 100, Bc: 0, nc: 0.03, At: 0, Bt: 0, nt: 0, I: 0.001 }), /水力半径/);
});
