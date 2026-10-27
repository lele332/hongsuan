/* 泓算 H100 · 河势稳定分析模块
 * 依据：SL/T 808—2021《河道管理范围内建设项目防洪评价报告编制导则》
 *   第 5.4.4 条 —— 河势稳定分析应包括河道演变趋势、工程对河势的影响及可能产生的后果；
 *   第 6.5.3 条 —— 评价等级较低时可采用定性分析结合定量计算的方法。
 * 方法：多因子半定量评分（河型基分 + 阻水比 + 冲刷深度 + 岸坡防护 + 演变趋势），
 *       输出风险评分、影响等级、结论文本与防治补救建议，供报告第 4.2/5.3 章引用。
 * 该模块为定性+半定量评价，不能替代重要河段的数学模型/物理模型专项论证（第 6.5.1/6.5.2 条）。
 */
(function () {
  "use strict";

  var RIVER_TYPES = {
    mountain: { label: "山区河流", base: 10, note: "河床组成较粗、比降大，河势总体受边界约束较强" },
    straight: { label: "平原顺直型", base: 20, note: "主流位置相对稳定，但深槽仍可能缓慢下移" },
    meander: { label: "平原蜿蜒型", base: 35, note: "弯道自然演变，凹岸冲刷、凸岸淤积持续发展" },
    braided: { label: "平原分汊型", base: 40, note: "汊道兴衰交替，主汊可能转换，滩槽冲淤变化较快" },
    wander: { label: "游荡型", base: 60, note: "主流摆动频繁、河床冲淤剧烈，属河势最不稳定河型" }
  };
  var PROTECTIONS = {
    good: { label: "防护完好", score: 0 },
    fair: { label: "防护一般（局部老化或缺失）", score: 8 },
    none: { label: "无防护工程", score: 15 }
  };
  var TRENDS = {
    stable: { label: "近期稳定", score: 0 },
    slow: { label: "缓慢演变", score: 8 },
    active: { label: "明显演变（近几十年主流摆动/弯道发展）", score: 18 }
  };
  var LEVELS = [
    { min: 0, key: "minor", text: "影响较小", color: "#15803d", conclusion: "工程建设对河势稳定影响较小，桥位河段河势总体保持稳定。", measures: ["常规养护观测：桥位上下游固定断面每年汛前、汛后各观测一次。"] },
    { min: 40, key: "general", text: "一般影响", color: "#b45309", conclusion: "工程建设对河势稳定有一定影响，需关注局部冲刷与岸坡变化。", measures: ["补充床沙取样与局部冲刷复核；汛期加强对桥位断面与上下游衔接段的观测。"] },
    { min: 70, key: "large", text: "较大影响", color: "#dc2626", conclusion: "工程建设对河势稳定影响较大，存在主流摆动或岸坡失稳风险。", measures: ["建议增设护岸、护脚等防护工程，或调整墩位/跨径布置；必要时开展数学模型专项论证。"] },
    { min: 100, key: "major", text: "显著影响", color: "#991b1b", conclusion: "工程建设对河势稳定影响显著，现有资料不足以支撑定性判断。", measures: ["建议按 SL/T 808—2021 第 6.5.1/6.5.2 条开展数学模型或物理模型试验专项论证，并研究调整桥位或工程方案。"] }
  ];

  function finiteNumber(v) { return typeof v === "number" && Number.isFinite(v); }

  function blockScore(ratio) {
    if (!finiteNumber(ratio) || ratio < 0) return null;
    if (ratio < 1) return 0;
    if (ratio < 3) return 5;
    if (ratio < 5) return 12;
    if (ratio <= 7) return 20;
    return 35;
  }

  function scourScore(depth) {
    if (!finiteNumber(depth) || depth < 0) return null;
    if (depth < 1) return 0;
    if (depth < 2) return 8;
    if (depth < 4) return 15;
    return 25;
  }

  function assess(input) {
    input = input || {};
    var rt = RIVER_TYPES[input.riverType];
    var pr = PROTECTIONS[input.protection];
    var tr = TRENDS[input.trend];
    var bs = blockScore(input.blockRatio);
    var ss = scourScore(input.scourDepth);
    if (!rt) throw new Error("请选择河型（山区/平原顺直/蜿蜒/分汊/游荡）");
    if (bs === null) throw new Error("阻水比 d 必须为非负数（可由壅水·阻水比模块得到）");
    if (ss === null) throw new Error("总冲刷深度必须为非负数（一般冲刷 + 局部冲刷，可由孔径计算冲刷模块得到）");
    if (!pr) throw new Error("请选择桥位河段现状防护情况");
    if (!tr) throw new Error("请选择河势演变趋势判断");
    var score = rt.base + bs + ss + pr.score + tr.score;
    var level = LEVELS[0];
    for (var i = LEVELS.length - 1; i >= 0; i--) { if (score >= LEVELS[i].min) { level = LEVELS[i]; break; } }
    var factors = [
      { name: "河型基分", score: rt.base, note: rt.label + "：" + rt.note },
      { name: "阻水比 d=" + input.blockRatio + "%", score: bs, note: input.blockRatio > 7 ? "阻水比超过 7% 判定线，行洪断面压缩显著" : input.blockRatio >= 5 ? "阻水比接近 7% 判定线" : "阻水比在常规允许范围内" },
      { name: "总冲刷深度=" + input.scourDepth + " m", score: ss, note: ss >= 15 ? "冲刷深度较大，需复核基础埋深与防护深度" : "冲刷深度在常见范围内" },
      { name: "岸坡防护", score: pr.score, note: pr.label },
      { name: "演变趋势", score: tr.score, note: tr.label }
    ];
    return {
      score: score,
      level: level.key,
      levelText: level.text,
      factors: factors,
      conclusion: level.conclusion,
      measures: level.measures.slice(),
      basis: "SL/T 808—2021 第 5.4.4 条（河势稳定分析内容）、第 6.5.3 条（定性分析结合定量计算）"
    };
  }

  /* ===== 计算留痕引用：从泓算计算日志自动提取河势模块输入（P0-1） =====
   * 阻水比（%）：优先「壅水 · 阻水比与壅高」留痕 results.阻水比（投影面积法 d）；
   *   缺省回退 64-2 留痕 inputs.阻水比λ（小数，×100 近似换算，来源注明）。
   * 总冲刷深度（m）：优先「冲刷 · 总冲刷深度」留痕（自然+一般+局部不利组合）；
   *   缺省回退最新一般冲刷（冲刷深度hy / 冲刷深度）+ 最新局部冲刷（hb / hs）相加。
   */
  function extractNumber(v) {
    if (finiteNumber(v)) return v;
    if (typeof v !== "string") return null;
    var m = v.match(/-?\d+(?:\.\d+)?/);
    if (!m) return null;
    var n = parseFloat(m[0]);
    return Number.isFinite(n) ? n : null;
  }

  function pickLatest(logs, pred) {
    for (var i = logs.length - 1; i >= 0; i--) { if (pred(logs[i] || {})) return logs[i]; }
    return null;
  }

  function collectRiverInputs(logs) {
    var out = { blockRatio: null, blockSource: "", scourDepth: null, scourSource: "" };
    if (!Array.isArray(logs)) return out;
    var bwLog = pickLatest(logs, function (e) {
      return (e.module || "").indexOf("壅水") >= 0 && e.results && e.results["阻水比"] != null;
    });
    if (bwLog) {
      var b = extractNumber(bwLog.results["阻水比"]);
      if (b !== null) { out.blockRatio = b; out.blockSource = bwLog.module; }
    }
    if (out.blockRatio === null) {
      var l64 = pickLatest(logs, function (e) {
        return (e.module || "").indexOf("64-2") >= 0 && e.inputs && e.inputs["阻水比λ"] != null;
      });
      if (l64) {
        var lam = extractNumber(l64.inputs["阻水比λ"]);
        if (lam !== null && lam > 0 && lam < 1) {
          out.blockRatio = Math.round(lam * 10000) / 100;
          out.blockSource = l64.module + "（λ×100，近似）";
        }
      }
    }
    var tsLog = pickLatest(logs, function (e) {
      return (e.module || "").indexOf("总冲刷") >= 0 && e.results && e.results["总冲刷深度"] != null;
    });
    if (tsLog) {
      var t = extractNumber(tsLog.results["总冲刷深度"]);
      if (t !== null) { out.scourDepth = t; out.scourSource = tsLog.module; }
    }
    if (out.scourDepth === null) {
      var gLog = pickLatest(logs, function (e) {
        return (e.module || "").indexOf("一般冲刷") >= 0 && e.results && (e.results["冲刷深度hy"] != null || e.results["冲刷深度"] != null);
      });
      if (gLog) {
        var hy = extractNumber(gLog.results["冲刷深度hy"] != null ? gLog.results["冲刷深度hy"] : gLog.results["冲刷深度"]);
        if (hy !== null) {
          var lLog = pickLatest(logs, function (e) {
            return (e.module || "").indexOf("局部冲刷") >= 0 && e.results && (e.results.hb != null || e.results.hs != null);
          });
          var hb = lLog ? extractNumber(lLog.results.hb != null ? lLog.results.hb : lLog.results.hs) : null;
          out.scourDepth = Math.round((hy + (hb !== null ? hb : 0)) * 100) / 100;
          out.scourSource = gLog.module + (hb !== null ? " + " + lLog.module : "（未见局部冲刷，按 0 计）");
        }
      }
    }
    return out;
  }

  var API = { assess: assess, extractNumber: extractNumber, collectRiverInputs: collectRiverInputs, RIVER_TYPES: RIVER_TYPES, PROTECTIONS: PROTECTIONS, TRENDS: TRENDS, LEVELS: LEVELS };
  if (typeof window !== "undefined") window.__hsRiverStability = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})();
