/* 泓算 · 计算历史（Dexie.js + IndexedDB，仅保存在本机，不上传任何数据）
 * app.js 每次系列计算完成后调用 window.__hsHistorySave()；
 * 恢复流程：填回系列文本 → 触发计算 → window.__hsRestoreParams() 恢复人工适线参数与设计频率。
 */
(function () {
  "use strict";
  if (typeof window.Dexie !== "function") return;
  var MAX = 20;
  var db = new window.Dexie("hongsuan_history");
  db.version(1).stores({ records: "++id, ts" });

  function $(id) { return document.getElementById(id); }
  function fmt(v, d) { return Number(v).toLocaleString("zh-CN", { maximumFractionDigits: d == null ? 2 : d, minimumFractionDigits: 0 }); }
  function timeLabel(ts) {
    var d = new Date(ts);
    var p = function (n) { return n < 10 ? "0" + n : String(n); };
    return (d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }
  function freqLabel(f) {
    var v = f * 100;
    var s = v >= 1 ? (v % 1 ? v.toFixed(2).replace(/\.?0+$/, "") : String(v)) : v.toFixed(2);
    return "P=" + s + "%";
  }
  function track(name) {
    try { if (window.umami && typeof window.umami.track === "function") window.umami.track(name); } catch (e) {}
  }

  function collectSnapshot() {
    var d = null;
    try { d = window.__hsReportData && window.__hsReportData(); } catch (e) { return null; }
    if (!d || !d.stats || !d.params || !(d.params.mean > 0)) return null;
    var q = null;
    if (d.freqRows && d.freqRows.length) {
      for (var i = 0; i < d.freqRows.length; i++) {
        if (Math.abs(d.freqRows[i].p - d.freq) < 1e-9) { q = d.freqRows[i].q; break; }
      }
    }
    if (q == null && typeof window.__hsDesignQ === "function") q = window.__hsDesignQ();
    var rec = {
      ts: Date.now(),
      n: d.stats.n,
      mean: d.params.mean,
      cv: d.params.cv,
      cs: d.params.cs,
      freq: d.freq,
      q: q,
      seriesText: ($("series") && $("series").value) || "",
      hasExtra: !!($("hasExtra") && $("hasExtra").checked),
      extraText: ($("extraSeries") && $("extraSeries").value) || "",
      N: $("inN") && $("inN").value || "",
      L: $("inL") && $("inL").value || "",
      calcMode: window.localStorage ? (window.localStorage.getItem("hongsuan_calc_mode") || "exact") : "exact"
    };
    if (!rec.seriesText.trim()) return null;
    return rec;
  }

  window.__hsHistorySave = function () {
    var rec = collectSnapshot();
    if (!rec) return;
    db.records.orderBy("ts").reverse().limit(1).toArray().then(function (latest) {
      if (latest.length) {
        var p = latest[0];
        if (p.seriesText === rec.seriesText && p.mean === rec.mean && p.cv === rec.cv && p.cs === rec.cs && p.freq === rec.freq && p.hasExtra === rec.hasExtra && p.calcMode === rec.calcMode) {
          renderList(); // 与最近一条完全相同则不重复记录
          return;
        }
      }
      return db.records.add(rec).then(function () {
        return db.records.orderBy("ts").reverse().toArray();
      }).then(function (all) {
        if (all.length > MAX) {
          var olds = all.slice(MAX).map(function (r) { return r.id; });
          return db.records.bulkDelete(olds);
        }
      }).then(renderList);
    }).catch(function () {});
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  function renderList() {
    var card = $("historyCard"), list = $("historyList");
    if (!card || !list) return;
    db.records.orderBy("ts").reverse().limit(MAX).toArray().then(function (rows) {
      if (!rows.length) { card.style.display = "none"; list.innerHTML = ""; return; }
      card.style.display = "block";
      list.innerHTML = rows.map(function (r) {
        return '<div class="hist-row" data-id="' + r.id + '" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:7px 0;border-bottom:1px dashed rgba(0,0,0,0.08);font-size:12.5px">' +
          '<span style="color:var(--text3);min-width:86px">' + timeLabel(r.ts) + "</span>" +
          "<span>n=" + r.n + "</span>" +
          "<span>Q\u0304=" + fmt(r.mean, 1) + "</span>" +
          "<span>Cv=" + r.cv.toFixed(3) + "</span>" +
          "<span>Cs=" + r.cs.toFixed(2) + "</span>" +
          (r.q != null ? "<span><b>" + freqLabel(r.freq) + " Q=" + fmt(r.q, 0) + " m\u00B3/s</b></span>" : "") +
          '<span style="margin-left:auto;display:flex;gap:6px">' +
          '<button class="btn ghost hist-restore" style="padding:2px 10px;font-size:12px">\u6062\u590D</button>' +
          '<button class="btn ghost hist-del" style="padding:2px 10px;font-size:12px">\u5220\u9664</button>' +
          "</span></div>";
      }).join("");
    }).catch(function () {});
  }

  function restore(id) {
    db.records.get(id).then(function (r) {
      if (!r) return;
      if (!$("series")) return;
      var extra = $("hasExtra");
      if (extra) {
        extra.checked = !!r.hasExtra;
        if (r.hasExtra) {
          if ($("extraSeries")) $("extraSeries").value = r.extraText || "";
          if ($("inN")) $("inN").value = r.N || "";
          if ($("inL")) $("inL").value = r.L || "";
        }
      }
      if ($("series")) $("series").value = r.seriesText;
      try { window.localStorage.setItem("hongsuan_calc_mode", r.calcMode || "exact"); } catch (e) {}
      var apply = function () {
        if (typeof window.__hsRestoreParams === "function") {
          window.__hsRestoreParams({ mean: r.mean, cv: r.cv, cs: r.cs, freq: r.freq });
        }
        var qr = $("quickResult");
        if (qr && qr.style.display === "block") qr.scrollIntoView({ behavior: "smooth", block: "center" });
        else if ($("chartCard")) $("chartCard").scrollIntoView({ behavior: "smooth", block: "center" });
      };
      if ($("btnCalc")) { $("btnCalc").click(); window.setTimeout(apply, 400); }
      track("history-restore");
    }).catch(function () {});
  }

  document.addEventListener("click", function (ev) {
    var t = ev.target;
    if (!t || !t.closest) return;
    var row = t.closest(".hist-row");
    if (!row) return;
    var id = Number(row.getAttribute("data-id"));
    if (t.classList.contains("hist-restore")) { restore(id); }
    else if (t.classList.contains("hist-del")) { db.records.delete(id).then(renderList); }
  });

  function boot() {
    var clear = $("historyClear");
    if (clear) clear.addEventListener("click", function () {
      if (!window.confirm("\u786E\u5B9A\u6E05\u7A7A\u5168\u90E8\u8BA1\u7B97\u5386\u53F2\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002")) return;
      db.records.clear().then(function () { renderList(); track("history-clear"); });
    });
    renderList();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
