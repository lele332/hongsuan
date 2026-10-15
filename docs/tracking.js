/* 泓算网页版 - 功能使用统计（Umami 埋点，仅记录"点了哪个功能"，不记录任何输入数据） */
(function () {
  'use strict';
  var MAP = {
    ocrRun: 'ocr-run', demoScanBtn: 'ocr-demo', ocrApply: 'ocr-apply', ocrClear: 'ocr-clear',
    btnCalc: 'freq-calc', btnReport: 'report',
    fieReportBtn: 'fie-report', exSvg: 'export-svg', exPng: 'export-png',
    btnHist: 'hist', btnHydroSample: 'hydro-sample',
    mapLoad: 'map-load', mapGo: 'map-go', mapFill: 'map-fill',
    spGridBtn: 'sp-grid', spFsBtn: 'sp-fs', spGoBtn: 'sp-go', spBackBtn: 'sp-back',
    p3Calc: 'p3-calc', p3UseMap: 'p3-use-map', p3FillSp: 'p3-fill-sp',
    btnWsProfile: 'ws-profile', btnWsSolve: 'ws-solve',
    btnSsmDemoSi: 'ssm-demo-si', btnSsmDemoHec: 'ssm-demo-hec', btnSsmRun: 'ssm-run',
    btnExportProject: 'project-export', btnImportProject: 'project-import',
    sysExport: 'sys-export', sysKb: 'sys-kb', sysUsage: 'sys-usage',
    logExportMd: 'log-export-md', logExportJson: 'log-export-json',
    planExport: 'plan-export', planImport: 'plan-import', planAdd: 'plan-add',
    pdGo: 'pd-go', pdMd: 'pd-md', kbSearchGo: 'kb-search'
  };
  function track(name) {
    try { if (window.umami && window.umami.track) window.umami.track(name); } catch (e) {}
  }
  document.addEventListener('click', function (e) {
    var t = e.target;
    var el = t && t.closest ? t.closest('button') : null;
    if (!el || !el.id) return;
    track('feat-' + (MAP[el.id] || ('btn-' + el.id)));
  }, true);
  var of = document.getElementById('ocrFile');
  if (of) of.addEventListener('change', function () { track('feat-ocr-file'); }, true);
  var dl = document.getElementById('dlBtn');
  if (dl) dl.addEventListener('click', function () { track('download-desktop'); }, true);
})();
