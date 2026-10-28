/* 泓算 · 组件懒加载器（2026-10-28 全面升级：首屏只加载应用外壳）
 * 重型库（Excel/PDF/Word/OCR/ECharts/地图）首次使用时才下载，
 * SW 运行时缓存策略会自动缓存已用过的组件，离线仍可用。
 */
(function () {
  "use strict";
  var loaded = {};
  function loadOne(src) {
    if (!loaded[src]) {
      loaded[src] = new Promise(function (resolve, reject) {
        var s = document.createElement("script");
        s.src = src;
        s.onload = resolve;
        s.onerror = function () { delete loaded[src]; reject(new Error("\u7EC4\u4EF6\u52A0\u8F7D\u5931\u8D25\uFF1A" + src)); };
        document.head.appendChild(s);
      });
    }
    return loaded[src];
  }
  var BUNDLES = {
    xlsx: ["libs/xlsx.full.min.js"],
    jszip: ["libs/jszip.min.js"],
    pdf: ["libs/pdf.min.js"],
    docx: ["libs/docx.umd.js"],
    echarts: ["libs/echarts.min.js"],
    tesseract: ["libs/tesseract/tesseract.min.js"],
    leaflet: ["libs/leaflet/leaflet.js", "libs/leaflet/china_provinces.js", "libs/leaflet/sp_contours.js", "libs/leaflet/atlas_h1p_60min.js", "libs/leaflet/atlas_p3_params.js"]
  };
  window.hsLoad = function (name) {
    var files = BUNDLES[name];
    if (!files) return Promise.reject(new Error("\u672A\u77E5\u7EC4\u4EF6\uFF1A" + name));
    return Promise.all(files.map(loadOne));
  };
})();
