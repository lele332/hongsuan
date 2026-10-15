/* 泓算 · 结果分享卡片（原生 Canvas 绘制，无依赖）
 * 一键把「参数 + 设计流量」生成为图片：手机优先调起系统分享（可保存/转发），
 * 否则直接下载 PNG。卡片含泓算品牌元素（黑底白"泓"标识）与扫码入口。
 * 说明：原计划用 html-to-image（DOM 截图），实测部分环境 foreignObject 渲染输出异常，
 * 改为 Canvas 2D 直接绘制，输出更可控清晰。
 */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function track(name) {
    try { if (window.umami && typeof window.umami.track === "function") window.umami.track(name); } catch (e) {}
  }
  function collectData() {
    var d = null;
    try { d = window.__hsReportData && window.__hsReportData(); } catch (e) { return null; }
    if (!d || !d.params || !(d.params.mean > 0)) return null;
    var q = null;
    if (d.freqRows && d.freqRows.length) {
      for (var i = 0; i < d.freqRows.length; i++) {
        if (Math.abs(d.freqRows[i].p - d.freq) < 1e-9) { q = d.freqRows[i].q; break; }
      }
    }
    if (q == null && typeof window.__hsDesignQ === "function") q = window.__hsDesignQ();
    return {
      n: d.stats && d.stats.n,
      mean: d.params.mean,
      cv: d.params.cv,
      cs: d.params.cs,
      freq: d.freq,
      q: q
    };
  }
  function fmt(v, d) { return Number(v).toLocaleString("zh-CN", { maximumFractionDigits: d == null ? 2 : d, minimumFractionDigits: 0 }); }
  function freqText(f) {
    var v = f * 100;
    return v >= 1 ? (v % 1 ? v.toFixed(2).replace(/\.?0+$/, "") : String(v)) : v.toFixed(2);
  }
  function dateText() {
    var d = new Date();
    var p = function (n) { return n < 10 ? "0" + n : String(n); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  function stampName() {
    var d = new Date();
    var p = function (n) { return n < 10 ? "0" + n : String(n); };
    return "\u6CD3\u7B97\u5206\u4EAB\u5361-" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()) + ".png";
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function topOnlyRR(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
  }
  function loadQR() {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = "assets/hongsuan-qr.png";
    });
  }

  async function generate() {
    var s = collectData();
    if (!s) return null;
    var qr = await loadQR();
    var W = 720, H = 860, R = 32;
    var canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext("2d");
    var INK = "#111113", SUB = "#6e6e73", BG = "#f5f5f7";
    var FONT = "'PingFang SC','Microsoft YaHei','Noto Sans SC',sans-serif";

    /* 卡片白底圆角 */
    ctx.fillStyle = "#ffffff";
    rr(ctx, 0, 0, W, H, R);
    ctx.fill();

    /* 头部黑底 */
    var hh = 150;
    ctx.fillStyle = INK;
    topOnlyRR(ctx, 0, 0, W, hh, R);
    ctx.fill();
    /* 白底泓字标识 */
    ctx.fillStyle = "#ffffff";
    rr(ctx, 40, 37, 76, 76, 18);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = "700 46px " + FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("\u6CD3", 78, 78);
    /* 标题 */
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 31px " + FONT;
    ctx.fillText("\u6CD3\u7B97 \xB7 \u8BBE\u8BA1\u6D41\u91CF\u8BA1\u7B97\u7ED3\u679C", 138, 66);
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.font = "400 22px " + FONT;
    ctx.fillText(dateText() + " \xB7 JTG C30-2015", 138, 102);

    /* 大号设计流量 */
    var freq = freqText(s.freq);
    ctx.textAlign = "center";
    ctx.fillStyle = SUB;
    ctx.font = "400 25px " + FONT;
    ctx.fillText("P = " + freq + "% \u8BBE\u8BA1\u6D41\u91CF Q", W / 2, 228);
    ctx.fillStyle = INK;
    ctx.font = "800 86px " + FONT;
    var qText = s.q != null ? fmt(s.q, 0) : "\u2014";
    var qW = ctx.measureText(qText).width;
    ctx.fillText(qText, W / 2 - 20, 306);
    ctx.font = "500 30px " + FONT;
    ctx.fillStyle = SUB;
    ctx.fillText("m\u00B3/s", W / 2 + qW / 2 - 14, 320);

    /* 参数四宫格 */
    var items = [
      ["n", s.n != null ? String(s.n) : "\u2014"],
      ["Q\u0304\uFF08m\u00B3/s\uFF09", fmt(s.mean, 1)],
      ["Cv", s.cv.toFixed(3)],
      ["Cs", s.cs.toFixed(2)]
    ];
    var bx = 40, bw = (W - 80 - 3 * 16) / 4, by = 372, bh = 104;
    items.forEach(function (kv, i) {
      var x = bx + i * (bw + 16);
      ctx.fillStyle = BG;
      rr(ctx, x, by, bw, bh, 20);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.font = "700 29px " + FONT;
      ctx.textAlign = "center";
      ctx.fillText(kv[1], x + bw / 2, by + 42);
      ctx.fillStyle = SUB;
      ctx.font = "400 21px " + FONT;
      ctx.fillText(kv[0], x + bw / 2, by + 78);
    });

    /* 分隔虚线 */
    ctx.strokeStyle = "rgba(0,0,0,0.14)";
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(40, 528);
    ctx.lineTo(W - 40, 528);
    ctx.stroke();
    ctx.setLineDash([]);

    /* 底部扫码区 */
    if (qr) ctx.drawImage(qr, 40, 572, 148, 148);
    ctx.textAlign = "left";
    ctx.fillStyle = INK;
    ctx.font = "700 26px " + FONT;
    ctx.fillText("\u626B\u7801\u5728\u7EBF\u4F7F\u7528\u6CD3\u7B97", 212, 606);
    ctx.fillStyle = SUB;
    ctx.font = "400 20px " + FONT;
    ctx.fillText("\u7F51\u9875\u6F14\u793A\u7248 \xB7 \u5B8C\u6574\u79BB\u7EBF\u7248\u8BF7\u4E0B\u8F7D\u684C\u9762\u7AEF", 212, 646);
    ctx.fillText("\u6240\u6709\u6570\u636E\u4EC5\u4FDD\u5B58\u5728\u672C\u673A\uFF0C\u4E0D\u4E0A\u4F20\u4EFB\u4F55\u670D\u52A1\u5668", 212, 680);
    ctx.fillText("lele332.github.io/hongsuan", 212, 714);

    /* 底部品牌条 */
    ctx.fillStyle = INK;
    rr(ctx, 40, 780, W - 80, 10, 5);
    ctx.fill();
    ctx.font = "400 19px " + FONT;
    ctx.fillStyle = SUB;
    ctx.textAlign = "center";
    ctx.fillText("\u6CD3\u7B97 HongSuan \xB7 \u6865\u6DB5\u8BBE\u8BA1\u6D41\u91CF\u63A8\u6C42", W / 2, 830);

    return canvas.toDataURL("image/png");
  }

  window.__hsShareGenerate = generate; /* 测试钩子 */

  function feedback(btn, text) {
    if (!btn) return;
    var old = btn.textContent;
    btn.textContent = text;
    window.setTimeout(function () { btn.textContent = old; }, 2400);
  }
  async function onShare() {
    var btn = $("shareCardBtn");
    var dataUrl;
    try {
      dataUrl = await generate();
    } catch (e) {
      dataUrl = null;
    }
    if (!dataUrl) {
      feedback(btn, "⚠️ 生成失败，请重试");
      return;
    }
    var shared = false;
    try {
      if (navigator.canShare && typeof navigator.share === "function") {
        var blob = await (await fetch(dataUrl)).blob();
        var file = new File([blob], stampName(), { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "泓算 · 设计流量计算结果" });
          shared = true;
          track("share-sheet");
          feedback(btn, "✅ 已调起分享");
        }
      }
    } catch (e) {
      if (e && e.name === "AbortError") { feedback(btn, "已取消分享"); return; }
      /* 分享失败 → 走下载 */
    }
    if (!shared) {
      download(dataUrl);
      feedback(btn, "✅ 已保存到下载");
    }
  }

  function download(dataUrl) {
    var a = document.createElement("a");
    a.href = dataUrl;
    a.download = stampName();
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    window.setTimeout(function () { a.remove(); }, 500);
    track("share-download");
  }

  function boot() {
    var btn = $("shareCardBtn");
    if (btn) btn.addEventListener("click", onShare);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
