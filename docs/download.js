/* 泓算 · 桌面版下载入口增强
 * 点击「📲 下载桌面版」弹出多通道选择：官方 GitHub（页/直链）+ 第三方加速镜像。
 * ⚠️ 发新版本时更新下面的 HS_RELEASE 与 ASSETS 文件名（与 GitHub Release 资产一致）。
 */
(function () {
  "use strict";
  if (document.getElementById("dlOverlay")) return;
  var HS_RELEASE = "v1.0.13";
  var GH = "https://github.com/lele332/hongsuan/releases/download/" + HS_RELEASE + "/";
  var ASSETS = {
    x64: "HongSuan-Setup-" + HS_RELEASE + "-x64.exe",
    win32: "HongSuan-Setup-" + HS_RELEASE + "-win32.exe"
  };
  var MIRRORS = [
    { name: "加速镜像 ① ghfast.top", url: "https://ghfast.top/" },
    { name: "加速镜像 ② gh-proxy.com", url: "https://gh-proxy.com/" }
  ];

  function track(name) {
    try { if (window.umami && typeof window.umami.track === "function") window.umami.track(name); } catch (e) {}
  }

  var css = [
    "#dlOverlay{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,0.45);display:none;align-items:center;justify-content:center;padding:16px}",
    "#dlOverlay.on{display:flex}",
    "#dlModal{background:#fff;border-radius:14px;max-width:440px;width:100%;max-height:86vh;overflow:auto;padding:18px;position:relative;box-shadow:0 12px 40px rgba(0,0,0,0.25)}",
    "#dlModal h3{margin:0 0 4px;font-size:16px}",
    "#dlModal .dlSub{font-size:12px;color:#6e6e73;margin-bottom:12px;line-height:1.6}",
    "#dlModal .dlRow{display:block;border:1px solid rgba(0,0,0,0.1);border-radius:10px;padding:10px 12px;margin-bottom:8px;text-decoration:none;color:inherit;transition:border-color .15s}",
    "#dlModal .dlRow:hover{border-color:#007AFF}",
    "#dlModal .dlRow b{font-size:13.5px;display:block}",
    "#dlModal .dlRow span{font-size:11.5px;color:#6e6e73;display:block;margin-top:2px;word-break:break-all}",
    "#dlModal .dlNote{font-size:11px;color:#6e6e73;line-height:1.7;margin-top:10px}",
    "#dlClose{position:absolute;right:10px;top:10px;border:none;background:none;font-size:20px;cursor:pointer;color:#6e6e73;padding:4px 8px}"
  ].join("");
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var overlay = document.createElement("div");
  overlay.id = "dlOverlay";
  var x64Url = GH + ASSETS.x64;
  var win32Url = GH + ASSETS.win32;
  overlay.innerHTML =
    '<div id="dlModal" role="dialog" aria-label="下载泓算桌面版">' +
      '<button type="button" id="dlClose" aria-label="关闭">×</button>' +
      "<h3>📲 下载泓算桌面版 " + HS_RELEASE + "</h3>" +
      '<div class="dlSub">Windows 安装包 · 完整离线版（OCR 识别、报告导出全功能）</div>' +
      '<a class="dlRow" href="https://github.com/lele332/hongsuan/releases/latest" target="_blank" rel="noopener" data-dl="official-page"><b>官方 · GitHub Release 页</b><span>可查看历史版本与更新说明；国内打开可能较慢</span></a>' +
      '<a class="dlRow" href="' + x64Url + '" target="_blank" rel="noopener" data-dl="official-x64"><b>官方直链 · 64 位（推荐）</b><span>约 183MB · 适合绝大多数电脑</span></a>' +
      '<a class="dlRow" href="' + win32Url + '" target="_blank" rel="noopener" data-dl="official-win32"><b>官方直链 · 32 位</b><span>约 170MB · 老旧电脑 / 32 位系统用</span></a>' +
      MIRRORS.map(function (m, i) {
        return '<a class="dlRow" href="' + m.url + x64Url + '" target="_blank" rel="noopener" data-dl="mirror-' + i + '"><b>' + m.name + "（64 位直链）</b><span>第三方加速，仅供提速；如失效请用官方通道</span></a>";
      }).join("") +
      '<div class="dlNote">⚠️ 加速镜像由第三方提供，仅供下载提速，文件内容以官方 Release 为准。安装包大小：64 位约 183MB / 32 位约 170MB，下载后大小明显不符请勿运行。手机无法安装 Windows 软件，请在电脑上下载。</div>' +
    "</div>";
  document.body.appendChild(overlay);

  function open() {
    overlay.classList.add("on");
    track("dl-modal-open");
  }
  function close() {
    overlay.classList.remove("on");
  }
  overlay.addEventListener("click", function (ev) {
    if (ev.target === overlay) close();
  });
  var closeBtn = overlay.querySelector("#dlClose");
  if (closeBtn) closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("a[data-dl]");
    if (a) {
      track("dl-" + a.getAttribute("data-dl"));
      window.setTimeout(close, 300);
    }
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") close();
  });

  function boot() {
    var btn = document.getElementById("dlBtn");
    if (!btn || btn.getAttribute("data-dl-enhanced")) return;
    btn.setAttribute("data-dl-enhanced", "1");
    btn.addEventListener("click", function (ev) {
      ev.preventDefault();
      open();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
