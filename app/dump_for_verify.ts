// 验证导出：Φ 值网格 + 矩法统计参数（供 scipy 独立交叉验证）
import { phiPIII } from "./src/core/phi.ts";
import { seriesStats } from "./src/core/stats.ts";
import { writeFileSync } from "node:fs";

// —— Φ 网格：Cs × 常用频率 ——
const csList = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0,
  1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.95, 1.99, 2.0,
  2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0];
const pList = [0.0001, 0.0005, 0.001, 0.002, 0.0033, 0.005, 0.01, 0.02, 0.0333,
  0.05, 0.1, 0.2, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99, 0.999];

let csv = "cs,p_exceed,phi\n";
for (const cs of csList) {
  for (const p of pList) {
    csv += `${cs},${p},${phiPIII(p, cs).toPrecision(12)}\n`;
  }
}
writeFileSync("verify_phi_grid.csv", csv);

// —— 矩法统计：多组序列（JS 结果，供 numpy 交叉） ——
const t1 = [1200, 850, 1500, 900, 1100, 1350, 700, 1000, 1400, 650];
const t3like = [9100, 7800, 7200, 6600, 6200, 5900, 5600, 5400, 5100, 4900,
  4700, 4500, 4300, 4100, 3900, 3700, 3500, 3300, 3100, 2900,
  2700, 2500, 2300, 2100, 1900, 1700, 1500, 1300, 1100, 900];
const mixed = [3.5, 12.7, 8.2, 44.1, 0.9, 27.3, 15.6, 6.6, 91.4, 2.2, 18.9, 55.0, 7.7, 33.3, 1.4];

let csv2 = "case,mean,sigma,cv,cs_moment\n";
for (const [name, xs] of [["t1_10", t1], ["synth_30", t3like], ["mixed_15", mixed]] as const) {
  const st = seriesStats(xs);
  csv2 += `${name},${st.mean.toPrecision(12)},${st.sigma.toPrecision(12)},${st.cv.toPrecision(12)},${st.csMoment.toPrecision(12)}\n`;
}
writeFileSync("verify_stats_grid.csv", csv2);

console.log("CSV written: verify_phi_grid.csv (" + csList.length * pList.length + " phi points), verify_stats_grid.csv (3 series)");
