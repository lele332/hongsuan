/* 泓算 · 新手引导（Driver.js 1.3，自托管）
 * 首次访问自动播放 3+1 步引导；localStorage 记录已完成；#tourReplay 可重看。
 */
(function () {
  "use strict";
  var KEY = "hongsuan_tour_done_v1";
  function track(name) {
    try { if (window.umami && typeof window.umami.track === "function") window.umami.track(name); } catch (e) {}
  }
  function markDone() {
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
  }
  function start() {
    if (typeof window.Driver === "function") { runTour(window.Driver); return; }
    if (window.driver && window.driver.js && typeof window.driver.js.driver === "function") { runTour(window.driver.js.driver); return; }
    return;
  }
  function forceCleanup() {
    try {
      document.querySelectorAll(".driver-overlay, .driver-popover").forEach(function (el) { el.remove(); });
      document.body.classList.remove("driver-active", "driver-fade", "driver-simple");
    } catch (e) {}
    markDone();
  }
  var activeDriver = null;
  function runTour(Driver) {
    /* 单例守卫：已有引导在跑，先销毁，避免双遮罩卡死 */
    if (document.body.classList.contains("driver-active") && activeDriver) {
      try { activeDriver.destroy(); } catch (e) {}
      forceCleanup();
    }
    var steps = [
      {
        element: "#ocrRun",
        popover: {
          title: "\u2460 \u5BFC\u5165\u6570\u636E",
          description: "\u70B9\u8FD9\u91CC\u8BC6\u522B\u56FE\u7247/\u6587\u6863\u91CC\u7684\u6D41\u91CF\u8868\u683C\uFF0C\u6216\u7528\u65C1\u8FB9\u7684\u300C\u793A\u4F8B\u626B\u63CF\u4EF6\u300D\u4E00\u952E\u4F53\u9A8C\uFF1B\u4E5F\u53EF\u4EE5\u76F4\u63A5\u5728\u4E0B\u65B9\u6587\u672C\u6846\u7C98\u8D34\u5386\u5E74\u6D41\u91CF\u7CFB\u5217\u3002",
          side: "bottom", align: "start"
        }
      },
      {
        element: "#chartCard",
        popover: {
          title: "\u2461 \u81EA\u52A8\u8BA1\u7B97\u4E0E\u9002\u7EBF",
          description: "\u7C98\u8D34\u6216\u8BC6\u522B\u540E\u7EA6 0.7 \u79D2\u81EA\u52A8\u8BA1\u7B97\u3002P-\u2162 \u9002\u7EBF\u56FE\u652F\u6301\u6EDA\u8F6E\u7F29\u653E\u3001\u62D6\u52A8\u5E73\u79FB\uFF0C\u60AC\u505C\u53EF\u67E5\u770B\u6BCF\u4E2A\u5B9E\u6D4B\u70B9\u7684\u9891\u7387\u4E0E\u6D41\u91CF\u3002",
          side: "top", align: "start"
        }
      },
      {
        element: '.hs-tree-item[data-mode="export"]',
        popover: {
          title: "\u2462 \u4E00\u952E\u51FA\u62A5\u544A",
          description: "\u70B9\u8FD9\u91CC\u6309\u300A\u6D2A\u6C34\u5F71\u54CD\u8BC4\u4EF7\u62A5\u544A\u300B\u6807\u51C6\u76EE\u5F55\u751F\u6210 Word\uFF0C\u6C34\u6587\u8BA1\u7B97\u7AE0\u8282\u81EA\u52A8\u586B\u5199\uFF1B\u65C1\u8FB9\u8FD8\u6709\u4F20\u7EDF\u8BA1\u7B97\u4E66\u5BFC\u51FA\u3002",
          side: "top", align: "start"
        }
      }
    ];
    steps = steps.filter(function (s) { return document.querySelector(s.element); });
    if (!steps.length) return;
    var driver = Driver({
      showProgress: true,
      progressText: "{{current}} / {{total}}",
      nextBtnText: "\u4E0B\u4E00\u6B65 \u2192",
      prevBtnText: "\u2190 \u4E0A\u4E00\u6B65",
      doneBtnText: "\u5F00\u59CB\u4F7F\u7528 \u{1F389}",
      allowClose: true,
      overlayOpacity: 0.55,
      stagePadding: 6,
      popoverClass: "driverjs-theme",
      onDestroyed: function () { markDone(); activeDriver = null; track("tour-end"); },
      steps: steps
    });
    activeDriver = driver;
    driver.drive();
    /* 看门狗：遮罩在但弹窗丢失/不可见 → 2 秒内强制清理，保证页面可点 */
    var watchdog = window.setInterval(function () {
      var active = false;
      try { active = document.body.classList.contains("driver-active"); } catch (e) {}
      if (!active) { window.clearInterval(watchdog); return; }
      var pop = document.querySelector(".driver-popover");
      var visible = false;
      if (pop) {
        var r = pop.getBoundingClientRect();
        visible = r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;
      }
      if (!visible) {
        try { driver.destroy(); } catch (e) {}
        forceCleanup();
        window.clearInterval(watchdog);
      }
    }, 2000);
    window.setTimeout(function () { window.clearInterval(watchdog); }, 120000); /* 引导最长 2 分钟后不再看守 */

    track("tour-start");
  }
  function boot() {
    var replay = document.getElementById("tourReplay");
    if (replay) replay.addEventListener("click", start);
    var done = false;
    try { done = localStorage.getItem(KEY) === "1"; } catch (e) {}
    if (!done) window.setTimeout(start, 900);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
