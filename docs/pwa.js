/* 泓算 PWA 注册：Service Worker + 添加到主屏幕提示 */
(function () {
  "use strict";
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "127.0.0.1" && location.hostname !== "localhost") return;
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () { /* 注册失败不影响使用 */ });
  });
  /* 手机端横幅适配：Windows 安装包对手机无意义，且 GitHub 链接在部分手机网络打不开会像“没反应” */
  var mq = window.matchMedia("(max-width:760px)");
  var DESK_TXT = "网页版为功能演示 · 识别精度有限，完整离线版请下载桌面端";
  var MOBILE_TXT = "手机使用建议：浏览器菜单 →「添加到主屏幕」，即可像 App 一样离线使用";
  function adaptBanner() {
    var bar = document.getElementById("dlBar");
    if (!bar) return;
    var txt = bar.querySelector(".dlTxt");
    var btn = document.getElementById("dlBtn");
    if (mq.matches) {
      if (txt) txt.textContent = MOBILE_TXT;
      if (btn) btn.style.display = "none";
    } else {
      if (txt) txt.textContent = DESK_TXT;
      if (btn) btn.style.display = "";
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", adaptBanner);
  else adaptBanner();
  try { mq.addEventListener ? mq.addEventListener("change", adaptBanner) : mq.addListener(adaptBanner); } catch (e) {}
})();
