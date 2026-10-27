/* 泓算 H100 · 水文分析报告工作流
 * 把“单点计算器”串成：资料分流 → 设计流量 → 水位复核 → 桥孔 → 壅水阻水 → 冲刷 → 报告。
 * 该文件只负责导航、状态可视化和报告中心；不改计算内核。
 */
(function () {
  "use strict";

  var STEPS = [
    { id: "intake", num: 1, name: "资料分流", mode: "mSeries", desc: "录入实测系列，或改用推理公式 / 暴雨资料" },
    { id: "flow", num: 2, name: "设计流量", mode: "mSeries", desc: "P-Ⅲ 适线、历史洪水或无资料地区推算" },
    { id: "stage", num: 3, name: "水位复核", mode: "mHydro", desc: "水位流量关系、水面线或历史洪痕复核" },
    { id: "opening", num: 4, name: "桥孔 / 孔径", mode: "mHydro", desc: "最小净长、净空与桥型布置复核" },
    { id: "block", num: 5, name: "壅水 / 阻水", mode: "mBackwater", desc: "壅高、回水长度与阻水比判定" },
    { id: "scour", num: 6, name: "冲刷验算", mode: "mHydro", desc: "一般冲刷、局部冲刷与基础埋深" },
    { id: "river", num: 7, name: "河势稳定", mode: "mRiver", desc: "河型、阻水与冲刷对河势影响的定性/半定量评价" },
    { id: "report", num: 8, name: "报告输出", mode: "mReport", desc: "汇总计算留痕，生成完整报告" }
  ];

  function finiteNumber(v) { return typeof v === "number" && Number.isFinite(v); }

  function designFlow(data) {
    if (!data || !Array.isArray(data.freqRows)) return NaN;
    var freq = data.freq;
    for (var i = 0; i < data.freqRows.length; i++) {
      var row = data.freqRows[i];
      if (Math.abs(row[0] / 100 - freq) < 1e-9 || Math.abs(row[0] - freq * 100) < 1e-9) return row[3];
    }
    return NaN;
  }

  function hasLog(logs, words) {
    if (!Array.isArray(logs)) return false;
    return logs.some(function (e) {
      var text = ((e && (e.module || "")) + " " + JSON.stringify((e && (e.inputs || {})) || {}) + " " + JSON.stringify((e && (e.results || {})) || {}));
      return words.some(function (w) { return text.indexOf(w) >= 0; });
    });
  }

  function deriveStatus(data, currentMode, reportGenerated) {
    data = data || {};
    var logs = data.logs || [];
    var qp = designFlow(data);
    var n = (data.stats && data.stats.n) || (data.series || []).length || 0;
    var demo = !!window.__hsDemo; // 默认示例不冒充“已完成”
    var s = {
      qp: qp,
      intake: !demo && (n >= 3 || finiteNumber(qp) || hasLog(logs, ["资料", "面积", "汇水"])),
      flow: !demo && finiteNumber(qp) && qp > 0,
      stage: hasLog(logs, ["水位", "水面线", "水位流量", "洪痕"]),
      opening: hasLog(logs, ["桥孔", "净长", "净空", "孔径"]),
      block: hasLog(logs, ["壅水", "壅高", "阻水"]),
      scour: hasLog(logs, ["冲刷"]),
      river: hasLog(logs, ["河势"]),
      report: !!reportGenerated || (finiteNumber(qp) && hasLog(logs, ["桥孔", "净长"]) && hasLog(logs, ["壅水", "阻水"]) && hasLog(logs, ["冲刷"]) && hasLog(logs, ["河势"]))
    };
    s.steps = STEPS.map(function (step) { return { id: step.id, name: step.name, done: !!s[step.id] }; });
    s.done = s.steps.filter(function (x) { return x.done; }).length;
    s.percent = Math.round(s.done * 100 / STEPS.length);
    s.next = STEPS.filter(function (step) { return !s[step.id]; })[0] || STEPS[STEPS.length - 1];
    s.mode = currentMode || "series";
    return s;
  }

  function fmt(v, unit) {
    return finiteNumber(v) ? (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2)) + (unit || "") : "—";
  }

  function firstResult(logs, words) {
    if (!Array.isArray(logs)) return null;
    for (var i = 0; i < logs.length; i++) {
      if (hasLog([logs[i]], words)) return logs[i];
    }
    return null;
  }

  function resultText(entry) {
    if (!entry || !entry.results) return "—";
    var keys = Object.keys(entry.results);
    if (!keys.length) return "—";
    return keys.slice(0, 2).map(function (k) { return k + "=" + entry.results[k]; }).join("；");
  }

  var CHECK_ICON = { ok: "✓", warn: "⚠", bad: "✗" };
  var CHECK_COLOR = { ok: "#15803d", warn: "#b45309", bad: "#b91c1c" };
  var CHECK_STEP_KEY = { flow: ["series", "fit", "cv", "qp"], block: ["block", "dz"], scour: ["scour", "scourAd", "scourBcg", "scourHy", "d50"] };
  function stepBadge(id) {
    if (!window.__hsResultCheck || !window.__hsReportData) return "";
    try {
      var keys = CHECK_STEP_KEY[id];
      if (!keys) return "";
      var r = window.__hsResultCheck.check(window.__hsReportData());
      var worst = null, order = { bad: 2, warn: 1, ok: 0 };
      for (var i = 0; i < r.items.length; i++) {
        if (keys.indexOf(r.items[i].key) >= 0 && (worst === null || order[r.items[i].level] > order[worst])) worst = r.items[i].level;
      }
      if (!worst) return "";
      return '<span class="wf-badge" style="color:' + CHECK_COLOR[worst] + '" title="结果体检：' + (worst === "bad" ? "有警告项" : "有注意项") + '">' + CHECK_ICON[worst] + '</span>';
    } catch (e) { return ""; }
  }
  function renderSteps(status) {
    var host = document.getElementById("workflowSteps");
    if (!host) return;
    if (!host.children.length) {
      STEPS.forEach(function (step) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "workflow-step";
        btn.id = "wfStep-" + step.id;
        btn.addEventListener("click", function () { goToStep(step.id); });
        host.appendChild(btn);
      });
    }
    STEPS.forEach(function (step) {
      var el = document.getElementById("wfStep-" + step.id);
      if (!el) return;
      var done = status[step.id];
      var active = status.next && status.next.id === step.id;
      var demo = !!window.__hsDemo && (step.id === "intake" || step.id === "flow");
      el.className = "workflow-step " + (done ? "done" : active ? "active" : "todo");
      el.innerHTML = '<span class="num">' + (done ? "✓" : step.num) + '</span>' +
        '<span class="name">' + step.name + '</span>' +
        stepBadge(step.id) +
        '<span class="state">' + (done ? "已完成" : active ? "当前步骤" : (demo ? "示例" : "待完成")) + '</span>';
    });
  }

  function renderValues(status, data) {
    var host = document.getElementById("workflowValues");
    if (!host) return;
    var logs = (data && data.logs) || [];
    var opening = firstResult(logs, ["桥孔", "净长"]);
    var block = firstResult(logs, ["壅水", "阻水"]);
    var scour = firstResult(logs, ["冲刷"]);
    host.innerHTML =
      '<div class="workflow-value"><div class="k">Qp 设计流量</div><div class="v">' + fmt(status.qp, " m³/s") + '</div></div>' +
      '<div class="workflow-value"><div class="k">桥孔成果</div><div class="v">' + resultText(opening) + '</div></div>' +
      '<div class="workflow-value"><div class="k">壅水 / 阻水</div><div class="v">' + resultText(block) + '</div></div>' +
      '<div class="workflow-value"><div class="k">冲刷成果</div><div class="v">' + resultText(scour) + '</div></div>';
  }

  function renderReport(status) {
    var box = document.getElementById("reportChecklist");
    if (!box) return;
    box.innerHTML = "";
    STEPS.forEach(function (step) {
      var div = document.createElement("div");
      div.className = "report-check " + (status[step.id] ? "done" : status.next && status.next.id === step.id ? "active" : "");
      div.innerHTML = "<i>" + (status[step.id] ? "✓" : step.num) + "</i><div><div class='t'>" + step.name + "</div><div class='d'>" + step.desc + "</div></div>";
      div.addEventListener("click", function () { goToStep(step.id); });
      box.appendChild(div);
    });
    var qp = document.getElementById("wfQp");
    var pg = document.getElementById("wfProgress");
    var lc = document.getElementById("wfLogCount");
    var todo = document.getElementById("wfTodoCount");
    if (qp) qp.textContent = fmt(status.qp, " m³/s");
    if (pg) pg.textContent = status.percent + "%";
    if (lc) lc.textContent = (((window.__hsReportData && window.__hsReportData()) || {}).logs || []).length + " 项";
    if (todo) todo.textContent = (STEPS.length - status.done) + " 项";
  }

  function currentMode() {
    var ids = { mSeries: "series", mParams: "params", mHist: "hist", mNoData: "noData", mMap: "map", mHydro: "hydro", mBackwater: "backwater", mRiver: "river", mReport: "report", mHelp: "help" };
    for (var k in ids) {
      var b = document.getElementById(k);
      if (b && b.classList.contains("on")) return ids[k];
    }
    return "series";
  }

  function status() {
    var data = (typeof window !== "undefined" && typeof window.__hsReportData === "function") ? window.__hsReportData() : null;
    return deriveStatus(data, currentMode(), false);
  }

  function goToStep(id) {
    var step = STEPS.filter(function (x) { return x.id === id; })[0];
    if (!step || typeof document === "undefined") return;
    var btn = document.getElementById(step.mode);
    if (btn) btn.click();
    if (id === "report" && typeof window !== "undefined") window.setTimeout(update, 50);
  }

  function update() {
    if (typeof document === "undefined") return;
    var st = status();
    renderSteps(st);
    renderValues(st, (window.__hsReportData && window.__hsReportData()) || {});
    renderReport(st);
    var bar = document.getElementById("workflowProgressBar");
    var percent = document.getElementById("workflowPercent");
    var nextName = document.getElementById("workflowNextName");
    var nextBtn = document.getElementById("workflowNextBtn");
    if (bar) bar.style.width = st.percent + "%";
    if (percent) percent.textContent = st.percent + "%";
    if (nextName) nextName.textContent = st.next.name + "：" + st.next.desc;
    if (nextBtn) nextBtn.onclick = function () { goToStep(st.next.id); };
  }

  function boot() {
    if (typeof document === "undefined") return;
    update();
    var generate = document.getElementById("hsReportGenerate");
    if (generate) {
      generate.onclick = function () {
        try {
          if (window.HONGSUAN_FIE_DOWNLOAD) {
            window.HONGSUAN_FIE_DOWNLOAD();
          }
        } catch (e) {
          console.error(e);
        }
      };
    }
    var start = document.getElementById("hsWorkflowStart");
    if (start) start.onclick = function () { goToStep("intake"); };
    Object.keys({ mSeries: 1, mParams: 1, mHist: 1, mNoData: 1, mMap: 1, mHydro: 1, mBackwater: 1, mRiver: 1, mReport: 1, mHelp: 1 }).forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.addEventListener("click", function () { window.setTimeout(update, 30); });
    });
    setInterval(update, 1200);
  }

  var API = { steps: STEPS, status: status, deriveStatus: deriveStatus, update: update, goToStep: goToStep };
  if (typeof window !== "undefined") {
    window.__HS_WORKFLOW = API;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})();
