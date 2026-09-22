// Dump 合成样本与 JS 拟合结果（供 scipy 独立对照）
import { compareLineages, lcg, sampleGEV, sampleP3 } from "./src/core/bayes.ts";
import { writeFileSync } from "node:fs";

const rnd1 = lcg(321);
const p3Sample = Array.from({ length: 200 }, () => sampleP3(rnd1, 10, 1 / 30, 120));
const rnd2 = lcg(123);
const gevSample = Array.from({ length: 200 }, () => sampleGEV(rnd2, 100, 40, -0.15));
const rnd3 = lcg(7);
const p3Sample80 = Array.from({ length: 80 }, () => sampleP3(rnd3, 10, 1 / 30, 120));

writeFileSync("verify_bayes_p3_200.csv", p3Sample.join("\n"));
writeFileSync("verify_bayes_gev_200.csv", gevSample.join("\n"));
writeFileSync("verify_bayes_p3_80.csv", p3Sample80.join("\n"));

for (const [name, xs] of [["p3_200", p3Sample], ["gev_200", gevSample], ["p3_80", p3Sample80]] as const) {
  const r = compareLineages(xs);
  const lines = [
    `case=${name} n=${xs.length}`,
    ...r.fits.map((f) => {
      const p = f.params.map((v) => v.toPrecision(8)).join(" | ");
      return `${f.name}: logL=${f.logL.toFixed(4)} BIC=${f.bic.toFixed(2)} params=[${p}]`;
    }),
    `weights: P3=${r.weights.P3.toFixed(4)} GEV=${r.weights.GEV.toFixed(4)} Gumbel=${r.weights.Gumbel.toFixed(4)}`,
    `Q1%: P3=${r.q1p.P3?.toFixed(2)} GEV=${r.q1p.GEV?.toFixed(2)} Gumbel=${r.q1p.Gumbel?.toFixed(2)}`,
  ];
  writeFileSync(`verify_bayes_js_${name}.txt`, lines.join("\n"));
  console.log(lines.join("\n"), "\n");
}
