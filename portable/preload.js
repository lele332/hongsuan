// 渲染进程与主进程的唯一桥梁：只暴露本地 OCR 调用，不暴露任何 Node 能力
const { contextBridge, ipcRenderer } = require("electron");

const localOcrArg = (process.argv || []).find((x) => String(x).startsWith("--hs-local-ocr="));
const localOcrAvailable = localOcrArg ? localOcrArg.split("=")[1] === "1" : false;

contextBridge.exposeInMainWorld("hsApi", {
  localOcrAvailable,
  ocrTable: (dataUrl, opts) => ipcRenderer.invoke("hs:ocr-table", dataUrl, opts),
  saveSnapshot: (data) => ipcRenderer.invoke("hs:snapshot-save", String(data == null ? "" : data)),
  loadSnapshot: () => ipcRenderer.invoke("hs:snapshot-load"),
  clearSnapshot: () => ipcRenderer.invoke("hs:snapshot-clear"),
});

// P3.1 启动恢复：localStorage 为空时从磁盘快照同步恢复（sendSync 必须在 preload 阶段完成，
// 早于 app.js 的 restoreAll 同步链；LS_KEY 与 app.js 的 var LS_KEY = "hongsuan_v09" 保持一致）
try {
  var HS_LS_KEY = "hongsuan_v09";
  if (!window.localStorage.getItem(HS_LS_KEY)) {
    var hsSnap = ipcRenderer.sendSync("hs:snapshot-load-sync");
    if (hsSnap && typeof hsSnap === "string" && hsSnap.charAt(0) === "{") {
      window.localStorage.setItem(HS_LS_KEY, hsSnap);
    }
  }
} catch (e) {}
