/* 泓算 · P-Ⅲ 适线交互图（Apache ECharts 5.6，自托管）
 * 数据由 app.js render() 通过 window.__hsEcharts(payload) 推送；
 * 原隐藏 SVG 仍用于「导出曲线 SVG/PNG」，导出不受影响。
 */
(function () {
  "use strict";
  var chart = null;
  var box = null;
  var lastData = null;

  /* Acklam 逆正态近似（与 app.js norminv 一致性足够绘图用） */
  function norminv(p) {
    var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    var pl = 0.02425, ph = 1 - pl, q, r;
    if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p <= ph) { q = p - 0.5; r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
    q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  function normcdf(t) {
    var s = t / Math.SQRT2 < 0 ? -1 : 1;
    var x = Math.abs(t) / Math.SQRT2;
    var t2 = 1 / (1 + 0.3275911 * x);
    var y = 1 - ((((1.061405429 * t2 - 1.453152027) * t2) + 1.421413741) * t2 - 0.284496736) * t2 * t2 * Math.exp(-x * x);
    return 0.5 * (1 + s * y);
  }
  var zOfP = function (p) { return norminv(1 - p); };
  var zOfPct = function (pct) { return norminv(1 - pct / 100); };
  function fmt(v, d) { return Number(v).toLocaleString("zh-CN", { maximumFractionDigits: d == null ? 2 : d, minimumFractionDigits: 0 }); }

  function ensureChart() {
    if (typeof window.echarts === "undefined") return null;
    var svg = document.getElementById("chart");
    if (!svg) return null;
    if (!box) {
      box = document.getElementById("echartBox");
      if (!box) {
        box = document.createElement("div");
        box.id = "echartBox";
        box.style.width = "100%";
        box.style.height = (window.innerWidth <= 760 ? "300px" : "440px");
        svg.parentElement.insertBefore(box, svg);
      }
      svg.style.display = "none";
    }
    if (!chart) {
      chart = window.echarts.init(box, null, { renderer: "canvas" });
      window.addEventListener("resize", function () { box.style.height = (window.innerWidth <= 760 ? "300px" : "440px"); chart.resize(); selfCheck(); });
      addResetButton();
      bindReadout();
    }
    return chart;
  }

  /* 画布尺寸自愈：canvas 与容器尺寸不一致时强制 resize（防个别机型初始化时布局未就绪） */
  function selfCheck() {
    if (!chart || !box) return;
    var canvas = box.querySelector("canvas");
    if (!canvas) return;
    if (Math.abs(canvas.clientWidth - box.clientWidth) > 2 || Math.abs(canvas.clientHeight - box.clientHeight) > 2) {
      try { chart.resize(); } catch (e) {}
    }
  }
  /* 一键重置缩放/平移（手机双指误放大后可恢复） */
  function addResetButton() {
    var readout = document.getElementById("chartReadout");
    if (!readout || document.getElementById("chartResetBtn")) return;
    var btn = document.createElement("button");
    btn.id = "chartResetBtn";
    btn.className = "btn ghost";
    btn.textContent = "\u21BB \u91CD\u7F6E\u89C6\u56FE";
    btn.style.cssText = "margin-left:8px;padding:2px 10px;font-size:12px;vertical-align:middle";
    btn.addEventListener("click", function () {
      if (!chart) return;
      try {
        chart.dispatchAction({ type: "dataZoom", start: 0, end: 100 });
        chart.dispatchAction({ type: "dataZoom", start: 0, end: 100, yAxisIndex: 0 });
      } catch (e) {}
      try { chart.resize(); } catch (e) {}
      var readout2 = document.getElementById("chartReadout");
      if (readout2) readout2.textContent = "\u5DF2\u91CD\u7F6E\u4E3A\u5168\u5C40\u89C6\u56FE";
    });
    readout.parentElement.insertBefore(btn, readout.nextSibling);
  }

  function bindReadout() {
    var zr = chart.getZr();
    var readout = document.getElementById("chartReadout");
    zr.on("mousemove", function (e) {
      if (!lastData || !readout) return;
      var pt = chart.convertFromPixel({ seriesIndex: 0 }, [e.offsetX, e.offsetY]);
      if (!pt) return;
      var z = pt[0], q = pt[1];
      if (z < lastData.xmin || z > lastData.xmax) return;
      var p = 1 - normcdf(z);
      readout.textContent = "P = " + (p * 100).toFixed(2) + "% \uFF5C Q = " + fmt(q, 0) + " m\u00B3/s \uFF08\u6EDA\u8F6E\u7F29\u653E / \u62D6\u52A8\u5E73\u79FB\uFF09";
    });
    zr.on("globalout", function () {
      if (readout) readout.textContent = "\u60AC\u505C\u56FE\u8868\u53EF\u8BFB\u53D6\u4EFB\u610F\u4F4D\u7F6E\u9891\u7387\u4E0E\u6D41\u91CF\uFF1B\u6EDA\u8F6E\u7F29\u653E\u3001\u62D6\u52A8\u5E73\u79FB";
    });
  }

  function buildOption(d) {
    var curve = d.curvePts.map(function (c) { return [zOfP(c.p), c.q]; });
    var cmp = (d.comparisonPts || []).map(function (c) { return [zOfP(c.p), c.q]; });
    var zFreq = zOfP(d.freq);
    var emp = d.pts.map(function (pt) {
      return {
        value: [zOfP(pt.p), pt.q],
        symbol: pt.kind === "hist" ? "diamond" : "circle",
        symbolSize: pt.kind === "hist" ? 11 : 9,
        itemStyle: { color: pt.kind === "hist" ? "#ff3b30" : "#1d1d1f" },
        ep: pt
      };
    });
    var tickZ = d.xticks.map(zOfPct);
    var pctLabel = function (pct) { return String(pct); };
    var axisFormatter = function (z) {
      for (var i = 0; i < tickZ.length; i++) {
        if (Math.abs(tickZ[i] - z) < 1e-6) return pctLabel(d.xticks[i]);
      }
      return "";
    };
    var tooltipFormatter = function (params) {
      if (!params || !params.length || !lastData) return "";
      var z = typeof params[0].value[0] === "number" ? params[0].value[0] : Number(params[0].axisValue);
      var p = 1 - normcdf(z);
      var html = "P = " + (p * 100).toFixed(2) + "%";
      params.forEach(function (pa) {
        if (pa.seriesType === "line") {
          html += "<br/>\u7406\u8BBA\u66F2\u7EBF\uFF1AQ = " + fmt(pa.value[1], 0) + " m\u00B3/s";
        } else if (pa.seriesId === "design") {
          html += "<br/><b>\u8BBE\u8BA1\u9891\u7387\u70B9\uFF1AQ" + (lastData.freq * 100).toFixed(2).replace(/\.?0+$/, "") + "% = " + fmt(lastData.designQ, 0) + " m\u00B3/s</b>";
        } else if (pa.data && pa.data.ep) {
          var e2 = pa.data.ep;
          html += "<br/>" + (e2.kind === "hist" ? "\u7279\u5927\u6D2A\u6C34" : "\u5B9E\u6D4B\u70B9\u636E") + "\uFF1AQ = " + fmt(e2.q, 0) + " m\u00B3/s\uFF0CP" + (e2.kind === "hist" ? "M" : "m") + " = " + (e2.p * 100).toFixed(2) + "%";
        }
      });
      return html;
    };
    var series = [
      {
        id: "theory", name: "\u7406\u8BBA\u9891\u7387\u66F2\u7EBF", type: "line", data: curve,
        showSymbol: false, smooth: false, z: 4,
        lineStyle: { color: "#007AFF", width: 2.5 },
        emphasis: { disabled: true },
        markLine: {
          silent: true, symbol: "none", animation: false,
          lineStyle: { color: "#007AFF", type: "dashed", width: 1, opacity: 0.55 },
          label: { show: false },
          data: [{ xAxis: zFreq }]
        }
      },
      {
        id: "design", name: "\u8BBE\u8BA1\u9891\u7387\u70B9", type: "scatter", data: [[zFreq, d.designQ]],
        symbol: "circle", symbolSize: 12, z: 6,
        itemStyle: { color: "#fff", borderColor: "#007AFF", borderWidth: 2.5 }
      }
    ];
    if (cmp.length) {
      series.push({
        id: "compare", name: "\u5BF9\u7167\u8BD5\u7EBF", type: "line", data: cmp,
        showSymbol: false, smooth: false, z: 3,
        lineStyle: { color: "#8e8e93", width: 1.8, type: [7, 5] },
        emphasis: { disabled: true }
      });
    }
    series.push({
      id: "empirical", name: "\u7ECF\u9A8C\u70B9\u636E", type: "scatter", data: emp, z: 5,
      itemStyle: { borderColor: "#fff", borderWidth: 0 }
    });
    var narrow = !!d.narrow;
    return {
      animation: false,
      grid: { left: narrow ? 58 : 78, right: narrow ? 16 : 26, top: 36, bottom: 52 },
      tooltip: {
        trigger: "axis", confine: true, backgroundColor: "rgba(29,29,31,0.92)", borderWidth: 0,
        textStyle: { color: "#fff", fontSize: 12 },
        axisPointer: { type: "cross", lineStyle: { color: "#007AFF", width: 0.8, opacity: 0.5 }, label: { backgroundColor: "#1d1d1f", fontSize: 11 } },
        formatter: tooltipFormatter
      },
      xAxis: {
        type: "value", min: d.xmin, max: d.xmax, inverse: true,
        axisLine: { show: true, lineStyle: { color: "rgba(0,0,0,0.25)" } },
        axisTick: { show: false }, splitLine: { show: false },
        axisLabel: { customValues: tickZ, formatter: axisFormatter, color: "#6e6e73", fontSize: narrow ? 10 : 11, margin: 10, hideOverlap: true },
        name: narrow ? "频率 P（%）" : "频率 P（%）— 海森机率格纸",
        nameLocation: "middle", nameGap: 30, nameTextStyle: { color: "#1d1d1f", fontSize: narrow ? 11 : 12 }
      },
      yAxis: {
        type: "value", min: d.qLo, max: d.qHi,
        axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: "rgba(0,0,0,0.06)" } },
        axisLabel: { formatter: function (v) { return fmt(v, 0); }, color: "#6e6e73", fontSize: 11 },
        name: "\u6D41\u91CF Q\uFF08m\u00B3/s\uFF09",
        nameTextStyle: { color: "#1d1d1f", fontSize: 12, align: "left" }
      },
      dataZoom: [{ type: "inside", xAxisIndex: 0, filterMode: "none" }],
      series: series
    };
  }

  /* 窄屏刻度裁剪：防止海森格纸标签重叠 */
  var NARROW_TICKS = [0.1, 1, 5, 20, 50, 90, 99];
  function adaptTicks(d) {
    var w = 640;
    try { w = box.clientWidth || 640; } catch (e) {}
    d.narrow = w < 520;
    if (d.narrow) {
      d.xticks = (d.xticks || []).filter(function (pct) { return NARROW_TICKS.indexOf(pct) >= 0; });
    }
    return d;
  }

  window.__hsEcharts = function (payload) {
    lastData = adaptTicks(payload);
    /* v1.0.38-r3：无点据不渲染（避免空白画布在海森格纸下方占位成"大留白"） */
    var hasPts = payload && payload.pts && payload.pts.length;
    if (!hasPts) {
      if (chart) { try { chart.clear(); } catch (e) {} }
      if (box) box.style.display = "none";
      return;
    }
    window.hsLoad("echarts").then(function () {
      var c = ensureChart();
      if (box) box.style.display = "";
      if (!c) return;
      c.setOption(buildOption(lastData), { notMerge: true });
      try { c.resize(); } catch (e) {}
      selfCheck();
      /* 容器布局可能晚于首次渲染，延迟再自愈一次 */
      window.setTimeout(selfCheck, 350);
    }).catch(function (e) { console.error("ECharts 加载失败", e); });
  };
})();
