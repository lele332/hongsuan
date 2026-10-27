/* ============================================================
 * 泓算 · 水位流量关系（率定曲线插值，Phase D）
 *
 * 数据来源：验证算例 表 3.1.3-1（内置 15 点实测率定曲线，
 *   2026-10-22 全文录入）；大(1)型水闸，闸址集雨面积 6193km²，正常蓄水位 40.6m，
 *   5% 设计洪水最大下泄 4740 m³/s（2017 年调洪成果）。
 *
 * 方法：
 *   水位→流量：log-log 插值（Q = exp(线性插值 lnZ→lnQ)），分段单调，节点处精确取表值；
 *              低于最低节点按 0 处理（曲线起涨点 Q=0 不能取对数）。
 *   流量→水位：同一插值关系的逆函数（分段反解），节点外单调解。
 *   亦提供线性插值备选（method="linear"）。
 * 外插超出曲线范围时返回结果并置 warnings（供界面高亮提示，不静默）。
 * ============================================================ */

var DONGSHAN_CURVE = {
  name: "示例水闸（内置实测率定数据 实测率定）",
  stages: [35.7, 35.9, 36.3, 36.7, 37.1, 38, 39.1, 40.1, 41.1, 42.1, 43.1, 44.1, 45.1, 46.1, 47.1],
  discharges: [0, 16.1, 80, 160, 250, 560, 1000, 1490, 2050, 2690, 3370, 4090, 4830, 5580, 6350]
};

function parseCurve(text) {
  const stages = [], discharges = [];
  for (const line of String(text || "").split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const parts = t.split(/[,，\t;；\s]+/).map(Number).filter((x) => Number.isFinite(x));
    if (parts.length >= 2) { stages.push(parts[0]); discharges.push(parts[1]); }
  }
  if (stages.length < 2) throw new Error("率定曲线至少需要 2 个（水位, 流量）数据点");
  for (let i = 1; i < stages.length; i++) {
    if (stages[i] <= stages[i - 1]) throw new Error("水位必须严格递增（第 " + (i + 1) + " 行）");
  }
  return { stages, discharges };
}

function stageToDischarge(Z, curve, method) {
  const { stages, discharges } = curve;
  if (!Number.isFinite(Z)) throw new Error("水位必须为有限数（m）");
  const warnings = [];
  if (Z <= stages[0]) {
    if (Z < stages[0]) warnings.push("水位低于曲线最低节点 " + stages[0] + " m，流量按 0 处理（曲线外插无据）");
    return { Q: discharges[0], warnings };
  }
  if (Z > stages[stages.length - 1]) warnings.push("水位高于曲线最高节点 " + stages[stages.length - 1] + " m，按最上段对数关系外插，请复核");
  // 找区间
  let i = 0;
  while (i < stages.length - 2 && Z > stages[i + 1]) i++;
  if (method === "linear") {
    if (discharges[i] === 0) {
      // 起涨段线性：Q=0 到下一点
      const t = (Z - stages[i]) / (stages[i + 1] - stages[i]);
      return { Q: Math.round(t * discharges[i + 1] * 100) / 100, warnings };
    }
    const t = (Z - stages[i]) / (stages[i + 1] - stages[i]);
    return { Q: Math.round((discharges[i] + t * (discharges[i + 1] - discharges[i])) * 100) / 100, warnings };
  }
  // log-log：跳过 Q<=0 的起涨段
  let lo = i;
  while (lo < stages.length - 2 && discharges[lo] <= 0) lo++;
  if (discharges[lo] <= 0) {
    const t = (Z - stages[lo]) / (stages[lo + 1] - stages[lo]);
    return { Q: Math.round(t * discharges[lo + 1] * 100) / 100, warnings };
  }
  const t = (Math.log(Z) - Math.log(stages[lo])) / (Math.log(stages[lo + 1]) - Math.log(stages[lo]));
  const Q = Math.exp(Math.log(discharges[lo]) + t * (Math.log(discharges[lo + 1]) - Math.log(discharges[lo])));
  return { Q: Math.round(Q * 100) / 100, warnings };
}

function dischargeToStage(Q, curve, method) {
  const { stages, discharges } = curve;
  if (!Number.isFinite(Q) || Q < 0) throw new Error("流量必须为非负数（m³/s）");
  const warnings = [];
  const Qmax = discharges[discharges.length - 1];
  if (Q > Qmax) warnings.push("流量超出曲线最大节点 " + Qmax + " m³/s，按最上段外插，请复核");
  if (Q <= discharges[0]) return { Z: stages[0], warnings };
  let i = 0;
  while (i < discharges.length - 2 && Q > discharges[i + 1]) i++;
  if (method === "linear") {
    const t = (Q - discharges[i]) / (discharges[i + 1] - discharges[i]);
    return { Z: Math.round((stages[i] + t * (stages[i + 1] - stages[i])) * 1000) / 1000, warnings };
  }
  let lo = i;
  while (lo < discharges.length - 2 && discharges[lo] <= 0) lo++;
  const t = (Math.log(Q) - Math.log(discharges[lo])) / (Math.log(discharges[lo + 1]) - Math.log(discharges[lo]));
  const Z = Math.exp(Math.log(stages[lo]) + t * (Math.log(stages[lo + 1]) - Math.log(stages[lo])));
  return { Z: Math.round(Z * 1000) / 1000, warnings };
}

var __hsRatingCurveApi = {
  DONGSHAN_CURVE: DONGSHAN_CURVE,
  parseCurve: parseCurve,
  stageToDischarge: stageToDischarge,
  dischargeToStage: dischargeToStage
};
if (typeof module !== "undefined" && module.exports) module.exports = __hsRatingCurveApi;
if (typeof window !== "undefined") window.__hsRatingCurve = __hsRatingCurveApi;
