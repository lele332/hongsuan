// ============================================================
// 径流厚度 h 查表数据接入与插值（JTG/T D65-04-2007 附录 B 体系）
//
// 背景：径流厚度 h 需查"暴雨分区（全国 1~18 区）× 土壤类别（Ⅰ~Ⅵ 类）
//       × 洪水频率 × 汇流时间"成套表。完整大表涉版权未内置（交接文档 §10-6），
//       本模块提供：
//       ① 规范的 JSON 数据 Schema（loadRunoffTable 校验，坏数据响亮失败）
//       ② 双线性插值引擎（汇流时间 τ 线性 × 频率对数轴线性——
//          频率对 h 的影响近似对数线性，工程查表惯例）
//       ③ 公开算例锚点种子数据（validateRunoffTable 自检验收）
//       完整表到手后只需替换 RUNOFF_TABLE_SEED 或调用 loadRunoffTable。
//
// 数据 Schema：
// {
//   "schema": "hongrunoff-h-table@1",
//   "source": "JTG/T D65-04-2007 附录B",
//   "zones": {
//     "5": {                     // 暴雨分区号 1..18
//       "soilIII": {             // 土壤类别 soilI..soilVI
//         "rows": [ { "tau": 30, "p1": 55, "p2": 42, ... } ]
//         // tau: 汇流时间 min；p1/p2/p3_33/p5/p10: 各频率径流厚度 h (mm)
//       }
//     }
//   }
// }
// ============================================================

export const RUNOFF_TABLE_SCHEMA = "hongrunoff-h-table@1";

export const FREQ_KEYS = ["p1", "p2", "p3_33", "p5", "p10"] as const;
export type FreqKey = (typeof FREQ_KEYS)[number];
export const FREQ_PCTS: Record<FreqKey, number> = {
  p1: 1, p2: 2, p3_33: 3.33, p5: 5, p10: 10,
};

export interface RunoffRow { tau: number; h: Record<FreqKey, number>; }
export interface RunoffTableData {
  schema: string;
  source: string;
  zones: Record<string, Record<string, RunoffRow[]>>;
}

// ---------- 校验 ----------
export function loadRunoffTable(json: unknown): RunoffTableData {
  if (typeof json !== "object" || json === null) throw new Error("径流厚度表必须为 JSON 对象");
  const t = json as RunoffTableData;
  if (t.schema !== RUNOFF_TABLE_SCHEMA) {
    throw new Error(`径流厚度表 schema 不匹配：期望 ${RUNOFF_TABLE_SCHEMA}，收到 ${String(t.schema)}`);
  }
  if (typeof t.source !== "string" || !t.source) throw new Error("径流厚度表缺少 source 出处标注");
  if (typeof t.zones !== "object" || t.zones === null) throw new Error("径流厚度表缺少 zones");
  for (const [zone, soils] of Object.entries(t.zones)) {
    const zn = Number(zone);
    if (!Number.isInteger(zn) || zn < 1 || zn > 18) throw new Error(`暴雨分区号必须是 1..18 的整数，收到 ${zone}`);
    for (const [soil, rows] of Object.entries(soils)) {
      if (!/^soil[I-V]{1,3}$/.test(soil)) throw new Error(`土壤类别键必须是 soilI..soilVI 形式，收到 ${soil}`);
      if (!Array.isArray(rows) || rows.length < 2) {
        throw new Error(`分区 ${zone} ${soil} 至少需要 2 行（τ 档）才能插值`);
      }
      for (const r of rows) {
        if (!Number.isFinite(r.tau) || r.tau <= 0) throw new Error("汇流时间 τ 必须为正数（min）");
        for (const k of FREQ_KEYS) {
          if (!Number.isFinite(r.h?.[k]) || r.h[k] <= 0) {
            throw new Error(`分区 ${zone} ${soil} τ=${r.tau} 的 ${k} 径流厚度必须为正数`);
          }
        }
      }
      const taus = rows.map(r => r.tau);
      if (new Set(taus).size !== taus.length) throw new Error(`分区 ${zone} ${soil} 存在重复 τ 档`);
    }
  }
  return t;
}

// ---------- 插值 ----------
function lerp(a: number, b: number, w: number): number { return a + (b - a) * w; }

// 频率轴：对数频率轴上的线性插值（权重 w = ln(p/pLo)/ln(pHi/pLo)，h 线性过渡），
// 表端之外按端点区间斜率外推。freqPct ≤ 0 由调用方守卫。
function hAtFreq(row: Record<FreqKey, number>, pct: number): number {
  const pcts = FREQ_KEYS.map(k => FREQ_PCTS[k]);
  // 精确命中频率节点
  for (let i = 0; i < pcts.length; i++) {
    if (Math.abs(pct - pcts[i]) < 1e-9) return row[FREQ_KEYS[i]];
  }
  let iLo = 0, iHi = 1; // 默认低端外推
  if (pct >= pcts[pcts.length - 1]) {
    iLo = pcts.length - 2; iHi = pcts.length - 1; // 高端外推
  } else {
    for (let i = 0; i < pcts.length - 1; i++) {
      if (pct > pcts[i] && pct < pcts[i + 1]) { iLo = i; iHi = i + 1; break; }
    }
  }
  const w = Math.log(pct / pcts[iLo]) / Math.log(pcts[iHi] / pcts[iLo]);
  return lerp(row[FREQ_KEYS[iLo]], row[FREQ_KEYS[iHi]], w);
}

// 公开 API：查 h（zone 1..18，soil "III" 式，freqPct 1..10 之外外推，tau 超范围报错）
export function lookupRunoffH(
  table: RunoffTableData,
  zone: number,
  soil: string,
  freqPct: number,
  tauMin: number,
): { h: number; interpolated: boolean } {
  const soilKey = "soil" + soil.toUpperCase().replace(/[^IV]/g, "");
  const rows = table.zones[String(zone)]?.[soilKey];
  if (!rows) throw new Error(`径流厚度表中没有分区 ${zone} / 土壤 ${soil} 的数据`);
  if (!Number.isFinite(tauMin) || tauMin <= 0) throw new Error("汇流时间必须为正（min）");
  const sorted = [...rows].sort((a, b) => a.tau - b.tau);
  if (tauMin < sorted[0].tau || tauMin > sorted[sorted.length - 1].tau) {
    throw new Error(
      `汇流时间 ${tauMin} min 超出表范围（${sorted[0].tau}~${sorted[sorted.length - 1].tau} min），请直接查表`,
    );
  }
  // τ 精确命中节点：单行插值，不算插值
  const exact = sorted.find(r => Math.abs(r.tau - tauMin) < 1e-9);
  if (exact) {
    const h0 = hAtFreq(exact.h, freqPct);
    const onFreqNode = FREQ_KEYS.some(k => Math.abs(FREQ_PCTS[k] - freqPct) < 1e-9);
    return { h: Math.round(h0 * 100) / 100, interpolated: !onFreqNode };
  }
  // τ 线性 × 频率对数 双线性
  let rLo = sorted[0], rHi = sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (tauMin >= sorted[i].tau && tauMin <= sorted[i + 1].tau) { rLo = sorted[i]; rHi = sorted[i + 1]; break; }
  }
  const wTau = (tauMin - rLo.tau) / (rHi.tau - rLo.tau);
  const h = lerp(hAtFreq(rLo.h, freqPct), hAtFreq(rHi.h, freqPct), wTau);
  return { h: Math.round(h * 100) / 100, interpolated: true };
}

// ---------- 种子数据（公开算例锚点；完整 18 分区表待数据到位后替换） ----------
export const RUNOFF_TABLE_SEED: RunoffTableData = loadRunoffTable({
  schema: RUNOFF_TABLE_SCHEMA,
  source: "公开算例锚点（k3+685 涵洞 / 贵州大桥），完整表待 JTG/T D65-04-2007 纸质版录入",
  zones: {
    "5": {
      soilIV: [
        { tau: 30, h: { p1: 52, p2: 46, p3_33: 42, p5: 38, p10: 33 } },
        { tau: 45, h: { p1: 55, p2: 48, p3_33: 44, p5: 40, p10: 35 } },
        { tau: 60, h: { p1: 57, p2: 50, p3_33: 45, p5: 41, p10: 36 } },
        { tau: 80, h: { p1: 58, p2: 51, p3_33: 46, p5: 42, p10: 37 } },
      ],
    },
  },
});

// 种子自检：锚点必须能被查回（防数据录入漂移）
export function validateRunoffTable(table: RunoffTableData): string[] {
  const problems: string[] = [];
  try {
    const r = lookupRunoffH(table, 5, "IV", 3.33, 45);
    if (Math.abs(r.h - 44) > 0.01) problems.push(`锚点 h(5区,IV土,3.33%,45min) 应为 44，实际 ${r.h}`);
  } catch (e) { problems.push(String(e instanceof Error ? e.message : e)); }
  return problems;
}
