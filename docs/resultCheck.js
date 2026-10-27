/* 泓算 H100 · 计算结果体检（v1.0.19）
 * 依据：JTG C30—2015 条文（6.2.1 系列长度、8.6 冲刷）与工程惯例（Cs/Cv 倍比、单宽量级）；
 *       输出 ✓可信 / ⚠注意 / ✗警告 三态，供工作流步骤角标与报告中心「结果体检」卡引用。
 * 定位：初步复核提示，不替代注册工程师最终复核（规范 1.0.5 合理性论证仍须人工）。
 */
(function () {
  "use strict";

  function num(v) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v !== "string") return null;
    var m = v.match(/-?\d+(?:\.\d+)?/);
    if (!m) return null;
    var n = parseFloat(m[0]);
    return Number.isFinite(n) ? n : null;
  }
  function latest(logs, key, pred) {
    for (var i = logs.length - 1; i >= 0; i--) {
      var e = logs[i] || {};
      if (pred(e)) {
        var r = (e.results || {})[key];
        var v = num(r);
        if (v !== null) return v;
      }
    }
    return null;
  }
  function latestInput(logs, key, pred) {
    for (var i = logs.length - 1; i >= 0; i--) {
      var e = logs[i] || {};
      if (pred(e)) {
        var v = num((e.inputs || {})[key]);
        if (v !== null) return v;
      }
    }
    return null;
  }
  function item(key, label, level, detail) {
    return { key: key, label: label, level: level, detail: detail };
  }
  var ORDER = { bad: 2, warn: 1, ok: 0 };

  function check(data) {
    data = data || {};
    var logs = Array.isArray(data.logs) ? data.logs : [];
    var items = [];

    // 1) 系列代表性（规范 6.2.1：系列不宜少于 30 年）
    var n = data.stats && Number.isFinite(data.stats.n) ? data.stats.n : (data.series || []).length;
    if (n > 0) {
      if (n < 10) items.push(item("series", "系列代表性", "bad", "系列仅 " + n + " 年，远少于规范 6.2.1 建议的 30 年，成果仅供演练，工程采用须补充资料"));
      else if (n < 30) items.push(item("series", "系列代表性", "warn", "系列 " + n + " 年，少于规范 6.2.1 建议的 30 年，宜结合历史洪水调查成果"));
      else items.push(item("series", "系列代表性", "ok", "系列 " + n + " 年，满足规范 6.2.1 代表性要求"));
    }

    // 2) 适线参数倍比（工程惯例 Cs 取 Cv 的 2~4 倍）
    var p = data.params || {};
    if (Number.isFinite(p.cv) && p.cv > 0 && Number.isFinite(p.csEff) && p.csEff > 0) {
      var ratio = p.csEff / p.cv;
      if (ratio < 2 || ratio > 4) items.push(item("fit", "适线参数倍比", "warn", "Cs/Cv = " + ratio.toFixed(2) + "，超出工程常用 2~4 倍区间，请复核适线或检查系列特大值"));
      else items.push(item("fit", "适线参数倍比", "ok", "Cs/Cv = " + ratio.toFixed(2) + "，在工程常用 2~4 倍区间"));
      if (p.cv > 0.8 || p.cv < 0.1) items.push(item("cv", "变差系数 Cv 量级", "warn", "Cv = " + p.cv + "，超出大中桥洪峰常用量级（0.1~0.8），请核对系列"));
    }

    // 3) 设计流量量级（经验口径：Qp/F 单宽峰量，m³/s per km²）
    var qp = null;
    if (Array.isArray(data.freqRows) && data.freqRows.length && Number.isFinite(data.freq)) {
      for (var i = 0; i < data.freqRows.length; i++) {
        var row = data.freqRows[i];
        if (Math.abs(row[0] / 100 - data.freq) < 1e-9 || Math.abs(row[0] - data.freq * 100) < 1e-9) { qp = row[3]; break; }
      }
    }
    var area = data.project && Number(num(data.project.siteArea) || num(data.project.stationArea));
    if (qp !== null && qp > 0 && area && area > 0) {
      var spec = qp / area;
      if (spec > 500 || spec < 0.5) items.push(item("qp", "设计流量量级", "warn", "Qp/F = " + spec.toFixed(1) + " m³/(s·km²)，超出常见量级，请核对汇水面积单位（km²）与系列"));
      else items.push(item("qp", "设计流量量级", "ok", "Qp/F = " + spec.toFixed(1) + " m³/(s·km²)，量级正常"));
    }

    // 4) 阻水比（规范判定线 7%）
    var br = latest(logs, "阻水比", function (e) { return (e.module || "").indexOf("壅水") >= 0; });
    if (br !== null) {
      if (br > 7) items.push(item("block", "阻水比", "bad", "阻水比 " + br + "% > 7% 判定线，行洪断面压缩显著，需改移沟渠/调整跨径"));
      else if (br >= 5) items.push(item("block", "阻水比", "warn", "阻水比 " + br + "%，接近 7% 判定线"));
      else items.push(item("block", "阻水比", "ok", "阻水比 " + br + "%，在常规允许范围"));
    }

    // 5) 壅高（对比输入限值）
    var dz = latest(logs, "壅水高度ΔZ", function (e) { return (e.module || "").indexOf("壅水") >= 0; });
    var dzLimit = latestInput(logs, "壅高限值", function (e) { return (e.module || "").indexOf("壅水") >= 0; });
    if (dz !== null && dzLimit !== null && dzLimit > 0) {
      if (dz > dzLimit) items.push(item("dz", "壅水高度", "bad", "ΔZ = " + dz + " m 超过限值 " + dzLimit + " m，壅水判定不满足"));
      else if (dz > dzLimit * 0.8) items.push(item("dz", "壅水高度", "warn", "ΔZ = " + dz + " m，已接近限值 " + dzLimit + " m"));
      else items.push(item("dz", "壅水高度", "ok", "ΔZ = " + dz + " m，满足限值 " + dzLimit + " m"));
    }

    // 6) 总冲刷深度（经验口径：>10m 注意、>20m 警告）
    var ts = latest(logs, "总冲刷深度", function (e) { return (e.module || "").indexOf("总冲刷") >= 0; });
    if (ts !== null) {
      if (ts > 20) items.push(item("scour", "总冲刷深度", "bad", "总冲刷 " + ts + " m > 20 m，冲刷极深，须复核断面与流量并专项论证"));
      else if (ts > 10) items.push(item("scour", "总冲刷深度", "warn", "总冲刷 " + ts + " m，冲刷较深，注意基础埋深与防护深度"));
      else items.push(item("scour", "总冲刷深度", "ok", "总冲刷 " + ts + " m，在常见范围"));
    }

    // 7) 一般冲刷 64-2 参数域（收编 scour642.js 零散警告：Ad>1.8、Bcg>Bc、hy<0）
    var is642 = function (e) { return (e.module || "").indexOf("一般冲刷64-2") >= 0; };
    var ad642 = latestInput(logs, "集中系数Ad", is642);
    var bc642 = latestInput(logs, "河槽宽度Bc", is642);
    var bcg642 = latestInput(logs, "桥孔净宽Bcg", is642);
    var hy642 = latest(logs, "冲刷深度hy", is642);
    if (ad642 !== null) {
      if (ad642 > 1.8) items.push(item("scourAd", "冲刷集中系数 Ad", "warn", "Ad=" + ad642 + " > 1.8：规范允许山前变迁/游荡/宽滩河段采用 1.8，其余河段建议复核河段分类"));
      else if (ad642 > 1.5) items.push(item("scourAd", "冲刷集中系数 Ad", "warn", "Ad=" + ad642 + "，偏大，宜复核河段分类与单宽流量集中程度"));
      else items.push(item("scourAd", "冲刷集中系数 Ad", "ok", "Ad=" + ad642 + "，在常规范围"));
    }
    if (bcg642 !== null && bc642 !== null && bcg642 > bc642) items.push(item("scourBcg", "桥孔净宽 Bcg", "warn", "Bcg=" + bcg642 + " m > Bc=" + bc642 + " m（桥孔净宽大于河槽宽度），请核对断面数据"));
    if (hy642 !== null && hy642 < 0) items.push(item("scourHy", "一般冲刷深度", "warn", "hy=" + hy642 + " m 为负：hp 小于冲刷前水深 hcm，请核对断面与流量数据"));

    // 8) 床沙粒径 d̄（8.4.3-2 台后局部冲刷；vH1 查表覆盖 0.05~800mm）
    var isAb = function (e) { return (e.module || "").indexOf("8.4.3-2") >= 0; };
    var d0 = latestInput(logs, "粒径d0", isAb);
    if (d0 !== null) {
      if (d0 > 800) items.push(item("d50", "床沙粒径 d̄", "warn", "d̄=" + d0 + "mm > 800（漂石级）：起冲流速按上限保守取值，建议人工复核"));
      else if (d0 < 0.05) items.push(item("d50", "床沙粒径 d̄", "warn", "d̄=" + d0 + "mm < 0.05（细沙下限）：起冲流速按下限保守取值，建议人工复核"));
      else items.push(item("d50", "床沙粒径 d̄", "ok", "d̄=" + d0 + "mm，在查表范围 0.05~800mm 内"));
    }

    var worst = null;
    for (var j = 0; j < items.length; j++) {
      if (worst === null || ORDER[items[j].level] > ORDER[worst]) worst = items[j].level;
    }
    return { items: items, worst: worst };
  }

  var API = { check: check };
  if (typeof window !== "undefined") window.__hsResultCheck = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})();
