/* 泓算 PWA 注册 + 构建信息展示 + 手动检查更新 */
(function () {
  "use strict";
  var info = window.__HS_BUILD_INFO || {};
  var buildEl = document.getElementById("buildInfo");
  var updateBtn = document.getElementById("btnCheckUpdate");

  function setBuildText(status) {
    if (!buildEl) return;
    var parts = [
      "版本 " + (info.release || info.version || "unknown"),
      "commit " + (info.commit || "local"),
      "缓存 " + (info.cacheVersion || "unknown"),
      "构建 " + (info.builtAt || "unknown")
    ];
    if (status) parts.push(status);
    buildEl.textContent = parts.join(" · ");
  }

  setBuildText();

  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "127.0.0.1" && location.hostname !== "localhost") return;

  var registration = null;
  var reloading = false;

  function promptReload(text) {
    if (reloading) return;
    setBuildText(text);
    if (confirm((text || "发现新版本") + "，是否立即刷新？")) {
      reloading = true;
      location.reload();
    }
  }

  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").then(function (reg) {
      registration = reg;
      if (updateBtn) updateBtn.hidden = false;

      reg.addEventListener("updatefound", function () {
        var worker = reg.installing;
        if (!worker) return;
        worker.addEventListener("statechange", function () {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            promptReload("发现新版本");
          }
        });
      });

      navigator.serviceWorker.addEventListener("controllerchange", function () {
        if (!reloading) location.reload();
      });
    }).catch(function (err) {
      try { window.__hsReportError && window.__hsReportError("sw-register-error", { message: err && err.message || "sw register failed" }); } catch (e) {}
    });
  });

  if (updateBtn) {
    updateBtn.addEventListener("click", function () {
      if (!registration) return;
      setBuildText("正在检查更新…");
      registration.update().then(function () {
        setBuildText("已检查，当前为最新");
      }).catch(function (err) {
        setBuildText("检查失败");
        try { window.__hsReportError && window.__hsReportError("sw-update-error", { message: err && err.message || "sw update failed" }); } catch (e) {}
      });
    });
  }
})();
