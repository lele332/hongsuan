/* 泓算 PWA 注册：Service Worker + 添加到主屏幕提示 */
(function () {
  "use strict";
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "127.0.0.1" && location.hostname !== "localhost") return;
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () { /* 注册失败不影响使用 */ });
  });
})();
