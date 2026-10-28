/* 泓算网页版 - 线上轻量错误上报
 * 目标：只报告“坏了”和“哪里坏了”，不报告用户输入与计算数据。
 * 通道：优先复用 Umami；失败仅记录到 localStorage，便于诊断。
 */
(function () {
  "use strict";
  var MAX_LOCAL_ERRORS = 30;
  var serverPosts = 0;
  var reported = new Set();

  function buildInfo() {
    return window.__HS_BUILD_INFO || {};
  }

  function safeText(value, max) {
    try {
      return String(value == null ? "" : value).slice(0, max || 300);
    } catch (e) { return "unknown"; }
  }

  function fingerprint(kind, message, source) {
    return [kind, message, source].map(function (v) { return safeText(v, 120); }).join("|");
  }

  function report(kind, data) {
    var info = buildInfo();
    var payload = {
      kind: kind,
      version: info.version || "unknown",
      commit: info.commit || "unknown",
      cacheVersion: info.cacheVersion || "unknown",
      message: safeText(data && data.message, 500),
      source: safeText(data && data.source, 300),
      line: data && data.lineno || null,
      column: data && data.colno || null,
      href: location.href.slice(0, 300),
      screen: screen.width + "x" + screen.height,
      ua: navigator.userAgent.slice(0, 300)
    };
    var fp = fingerprint(kind, payload.message, payload.source);
    if (reported.has(fp)) return;
    reported.add(fp);

    try {
      var list = JSON.parse(localStorage.getItem("hs_errors") || "[]");
      list.push({ at: new Date().toISOString(), payload: payload });
      localStorage.setItem("hs_errors", JSON.stringify(list.slice(-MAX_LOCAL_ERRORS)));
    } catch (e) {}

    try {
      console.error("[泓算]", payload);
    } catch (e) {}

    try {
      if (window.umami && typeof window.umami.track === "function") {
        window.umami.track("hs-" + kind, payload);
      }
    } catch (e) {}

    try {
      /* 服务器通道：同源 /api/error，sendBeacon 优先；限频 10 条/会话，失败静默 */
      if (serverPosts < 10) {
        serverPosts++;
        var body = JSON.stringify(payload);
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/error", new Blob([body], { type: "application/json" }));
        } else {
          fetch("/api/error", { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true }).catch(function () {});
        }
      }
    } catch (e) {}
  }

  window.addEventListener("error", function (e) {
    if (e && e.target && (e.target.nodeName === "SCRIPT" || e.target.nodeName === "LINK" || e.target.nodeName === "IMG")) {
      var target = e.target;
      report("resource-error", {
        message: (target.nodeName === "SCRIPT" ? "script load failed" : "resource load failed") + ": " + (target.src || target.href || ""),
        source: target.src || target.href || ""
      });
      return;
    }
    report("js-error", {
      message: e && (e.message || e.error && e.error.message) || "unknown error",
      source: e && e.filename,
      lineno: e && e.lineno,
      colno: e && e.colno
    });
  }, true);

  window.addEventListener("unhandledrejection", function (e) {
    var reason = e && e.reason;
    report("promise-error", {
      message: reason && (reason.message || reason.toString()) || "unhandled rejection"
    });
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("error", function () {
      report("sw-error", { message: "service worker error" });
    });
  }

  window.__hsReportError = report;
})();
