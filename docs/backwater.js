/* ============================================================
 * 泓算 · 壅水与阻水比模块（P0）
 * 公式来源：《湖南省涉河桥梁水利技术规定（暂行）》 +
 *          内置验证算例第 4 章（已数值验证） +
 *          内置验证算例§5.2/§5.4（2026-10-22 增补：
 *          示例桥梁 p=5% 阻水比 2.24%、壅水长度 Ly=2ΔZ/I0=167.88m 双源验证；
 *          壅高公式为 SL/T808-2025 附录 A 公式 A.2.3；η/V_M 原表已复核（2026-10-22，
 *          见 etaSLT808/vmSLT808/slt808Backwater 与 闭环验证））
 *
 * 壅水 B11（报告采用、验证桥位精确复算 0.096m 吻合）：
 *   ΔZ = η·(Vm² − V0²)
 *   Vm —— 建桥后断面平均流速（m/s）；V0 —— 建桥前断面平均流速（m/s）
 *   η 按 Q阻/Q设 分档：<10%→0.05；10%~30%→0.07；30%~50%→0.10；>50%→0.15
 *
 * 壅水长度：L = 2ΔZ/S（S 为水面比降，小数）
 *
 * 阻水比（T/CI 导则投影面积法）：
 *   d = A阻/A总 × 100%，逐墩 A阻 = 墩身/承台遮挡宽度 × 该墩处水深
 *   判定：d ≤ 7% 满足湖南省涉河桥梁水利技术规定
 * ============================================================ */
(function (root) {
  "use strict";
  var G = 9.81;

  function isPos(x) { return typeof x === "number" && isFinite(x) && x > 0; }

  /** η 查表（Q阻/Q设 百分数） */
  function etaB11(qRatioPercent) {
    if (!isFinite(qRatioPercent) || qRatioPercent < 0) throw new Error("Q阻/Q设 百分数无效");
    if (qRatioPercent < 10) return 0.05;
    if (qRatioPercent <= 30) return 0.07;
    if (qRatioPercent <= 50) return 0.10;
    return 0.15;
  }

  /** 壅水 B11：返回 { eta, dz, vm, v0 }（dz 为 m） */
  function backwaterB11(vm, v0, qRatioPercent) {
    if (!isPos(vm) || !isPos(v0)) throw new Error("流速 Vm / V0 必须为正数");
    if (vm <= v0) throw new Error("建桥后流速 Vm 应大于建桥前流速 V0（否则无壅水）");
    var eta = etaB11(qRatioPercent);
    var dz = eta * (vm * vm - v0 * v0);
    return { eta: eta, dz: dz, vm: vm, v0: v0 };
  }

  /**
   * 壅水 B6（公式已经老师确认：《湖南省涉河桥梁水利技术规定（暂行）》原文）
   * ΔZ = ξ·[(Q/(h·∑b))² − (Q/(h·B))²]
   * 即 Vm = Q/(∑b·h)，V0 = Q/(B·h)，ΔZ = ξ·(Vm² − V0²)（无 2g，与 B11 结构一致）
   * ξ：紊动大取 0.10，否则 0.05
   */
  function backwaterB6(q, b, h, sumB, xi) {
    if (!isPos(q) || !isPos(b) || !isPos(h) || !isPos(sumB)) throw new Error("Q / B / h / ∑b 必须为正数");
    if (sumB >= b) throw new Error("建桥后过水总宽 ∑b 应小于无桥水面宽 B");
    if (xi !== 0.05 && xi !== 0.10) xi = 0.05;
    var vm = q / (sumB * h), v0 = q / (b * h);
    var dz = xi * (vm * vm - v0 * v0);
    return { xi: xi, vm: vm, v0: v0, dz: dz };
  }

  /** 壅水长度 L = 2ΔZ/S */
  function backwaterLength(dz, s) {
    if (!isPos(dz)) throw new Error("壅水高度 ΔZ 必须为正数");
    if (!isPos(s)) throw new Error("水面比降 S 必须为正数");
    return 2 * dz / s;
  }

  /** 阻水比：{ ratio(%) , ok(≤7%) } */
  function blockageRatio(totalArea, blockedArea) {
    if (!isPos(totalArea)) throw new Error("总过水面积 A总 必须为正数");
    if (!isFinite(blockedArea) || blockedArea < 0) throw new Error("阻水面积 A阻 无效");
    var ratio = blockedArea / totalArea * 100;
    return { ratio: ratio, ok: ratio <= 7 };
  }

  /**
   * 逐墩批量：piers = [{ name, width, depth }]
   * 返回 { rows:[{name,width,depth,area}], totalBlocked, totalArea, ratio, ok }
   */
  function evalPiers(piers, totalArea) {
    if (!Array.isArray(piers) || !piers.length) throw new Error("请至少输入一排桥墩数据");
    var rows = [], totalBlocked = 0;
    for (var i = 0; i < piers.length; i++) {
      var p = piers[i] || {};
      var w = +p.width, d = +p.depth;
      if (!isPos(w) || !isPos(d)) throw new Error("第 " + (i + 1) + " 号墩：遮挡宽度与水深必须为正数");
      var a = w * d;
      rows.push({ name: p.name || String(i + 1), width: w, depth: d, area: a });
      totalBlocked += a;
    }
    var br = blockageRatio(totalArea, totalBlocked);
    return { rows: rows, totalBlocked: totalBlocked, totalArea: totalArea, ratio: br.ratio, ok: br.ok };
  }

  /** 壅水判定：ΔZ 超过 5 级堤防堤顶超高的 10%（默认 0.05m）则不满足 */
  function judgeDz(dz, limit) {
    if (!isFinite(dz) || dz < 0) throw new Error("壅水高度无效");
    if (!isFinite(limit) || limit <= 0) limit = 0.05;
    return { limit: limit, ok: dz <= limit };
  }

  /* ============================================================
   * SL/T808-2025《洪水影响评价技术导则》附录 A（2026-10-22 原文复核，
   * 来源：规范条文核实）
   * 公式 A.2.3-1：ΔZ_M = η·(V_M² − V²)
   *   η —— 表 A.2.3-1（河流特征 × 被堤(桥)阻挡流量与设计流量比值 双条件）：
   *     河滩很小的山区河流   ≤10% → 0.05
   *     河滩较小的半山区河流 11~30% → 0.07
   *     有中等河滩的平原河流 31~50% → 0.10
   *     河滩较大的低洼区河流 >50% → 0.15
   *   V —— 断面平均流速 = Q/A全(含河滩)
   *   V_M —— 桥下平均流速，表 A.2.3-2（河床土质 d̄ + 冲刷系数 P）：
   *     松软土(d̄≤1mm)   V_M = V_P
   *     中等土(1~25mm)   V_M = V_P·2P/(P+1)
   *     密实土(d̄>25mm)  V_M = V_P·P
   * 壅水长度 A.2.3-4：Ly = 2ΔZ_M/I0（复用 backwaterLength）
   * 内置示例桥梁复核：η=0.05（山区、Q阻/Q设=2.24%）、V=2.0235、V_M=2.134
   *   → ΔZ=0.023m ✓（报告未公布 P，反推 P≈1.06~1.12，落表 A.2.3-2 域内）
   */
  var SLT808_ETA_TABLE = [
    { key: "mountain",     label: "河滩很小的山区河流",   bandMin: 0,  bandMax: 10, eta: 0.05 },
    { key: "semiMountain", label: "河滩较小的半山区河流", bandMin: 10, bandMax: 30, eta: 0.07 },
    { key: "plain",        label: "有中等河滩的平原河流", bandMin: 30, bandMax: 50, eta: 0.10 },
    { key: "lowland",      label: "河滩较大的低洼区河流", bandMin: 50, bandMax: Infinity, eta: 0.15 }
  ];

  /** 表 A.2.3-1 η 查表（双条件：河流类型 + Q阻/Q设 百分数） */
  function etaSLT808(riverType, qRatioPercent) {
    var row = SLT808_ETA_TABLE.filter(function (r) { return r.key === riverType; })[0];
    if (!row) throw new Error("河流类型无效（mountain/semiMountain/plain/lowland）");
    if (!isFinite(qRatioPercent) || qRatioPercent < 0) throw new Error("Q阻/Q设 百分数无效");
    var warnings = [];
    if (qRatioPercent <= row.bandMin || qRatioPercent > row.bandMax) {
      warnings.push("Q阻/Q设=" + qRatioPercent.toFixed(2) + "% 超出「" + row.label + "」典型区间（" + row.bandMin + "~" + row.bandMax + "%），请复核河流特征选取");
    }
    return { eta: row.eta, label: row.label, warnings: warnings };
  }

  /** 表 A.2.3-2 桥下平均流速 V_M（土质 + 冲刷系数 P） */
  function vmSLT808(soil, vP, p) {
    if (!isPos(vP)) throw new Error("河槽平均流速 V_P 必须为正数");
    if (!isPos(p) || p < 1) throw new Error("冲刷系数 P 应≥1");
    var k;
    if (soil === "soft") k = 1;
    else if (soil === "medium") k = 2 * p / (p + 1);
    else if (soil === "dense") k = p;
    else throw new Error("河床土质无效（soft/medium/dense）");
    return vP * k;
  }

  /** SL/T808-2025 A.2.3-1 壅水（vm 可显式传入以覆盖表 A.2.3-2） */
  function slt808Backwater(input) {
    var qRatioPercent = input.qRatioPercent, riverType = input.riverType,
        vSection = input.vSection;
    if (!isPos(vSection)) throw new Error("断面平均流速 V 必须为正数");
    var etaRes = etaSLT808(riverType, qRatioPercent);
    var vm;
    if (isPos(input.vm)) {
      vm = input.vm;
    } else {
      vm = vmSLT808(input.soil, input.vP, input.p);
    }
    if (vm <= vSection) throw new Error("桥下平均流速 V_M 应大于断面平均流速 V（否则无壅水）");
    var dz = etaRes.eta * (vm * vm - vSection * vSection);
    var r3 = function (x) { return Math.round(x * 1e3) / 1e3; };
    return { eta: etaRes.eta, riverLabel: etaRes.label, v: r3(vSection), vm: r3(vm), dz: r3(dz), warnings: etaRes.warnings };
  }

  var api = {
    etaB11: etaB11,
    etaSLT808: etaSLT808,
    vmSLT808: vmSLT808,
    slt808Backwater: slt808Backwater,
    SLT808_ETA_TABLE: SLT808_ETA_TABLE,
    backwaterB11: backwaterB11,
    backwaterB6: backwaterB6,
    backwaterLength: backwaterLength,
    blockageRatio: blockageRatio,
    evalPiers: evalPiers,
    judgeDz: judgeDz,
    BLOCK_LIMIT: 7,
    DZ_DEFAULT_LIMIT: 0.05
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.__hsBackwater = api;
})(typeof window !== "undefined" ? window : globalThis);
