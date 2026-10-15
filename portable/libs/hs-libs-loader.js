// P2.4 懒加载器：文档解析/导出与浏览器 OCR 引擎按需加载（首次调用时注入 script）
(function () {
  var MAP = {
    jszip: { src: "libs/jszip.min.js", global: "JSZip" },
    xlsx: { src: "libs/xlsx.full.min.js", global: "XLSX" },
    docx: { src: "libs/docx.umd.js", global: "docx" },
    pdfjs: { src: "libs/pdf.min.js", global: "pdfjsLib" },
    tesseract: { src: "libs/tesseract/tesseract.min.js", global: "Tesseract" }
  };
  window.hsEnsureLib = function (name) {
    var e = MAP[name];
    if (!e) return Promise.reject(new Error("unknown lib: " + name));
    if (window[e.global]) return Promise.resolve(window[e.global]);
    if (!e._p) {
      e._p = new Promise(function (resolve, reject) {
        var s = document.createElement("script");
        s.src = e.src;
        s.onload = function () {
          if (window[e.global]) resolve(window[e.global]);
          else { e._p = null; reject(new Error(e.global + " 加载失败")); }
        };
        s.onerror = function () { e._p = null; reject(new Error(e.src + " 加载失败")); };
        document.head.appendChild(s);
      });
    }
    return e._p;
  };
})();
