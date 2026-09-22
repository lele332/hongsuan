"""解压 Electron zip 并组装泓算桌面版（resources/app + 重命名 exe）。"""
import os, sys, zipfile, shutil, pathlib

DIST = pathlib.Path(r"D:\植物\2026-09-22-17-48-53\桥涵水文项目\electron_dist")
ZIP = DIST / "electron.zip"
OUT = DIST / "unpacked"
APP_WEB = pathlib.Path(r"D:\植物\2026-09-22-17-48-53\桥涵水文项目\app\web")
DESKTOP = pathlib.Path(r"C:\Users\klxq\Desktop")
TARGET_NAME = "泓算桌面版"

def log(*a):
    print(*a, flush=True)

if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir(parents=True)

with zipfile.ZipFile(ZIP) as z:
    names = z.namelist()
    z.extractall(OUT)
log("zip entries:", len(names))

# zip 可能平铺（electron.exe 在根）或带一层外层目录
candidates = [OUT] + [p for p in OUT.iterdir() if p.is_dir()]
root = next((c for c in candidates if (c / "electron.exe").exists()), None)
if root is None:
    log("ERROR: electron.exe not found under", OUT); sys.exit(1)
log("root:", root)
for p in sorted(root.iterdir()):
    log("  ", p.name)

# ---- 组装 app 目录 ----
appdir = root / "resources" / "app"
appdir.mkdir(parents=True, exist_ok=True)

# package.json
(appdir / "package.json").write_text('''{
  "name": "hongsuan",
  "productName": "泓算",
  "version": "0.7.0",
  "description": "泓算 · 桥涵设计流量推求（依据 JTG C30-2015）",
  "main": "main.js",
  "author": "lele332",
  "license": "MIT"
}
''', encoding="utf-8")

# main.js
(appdir / "main.js").write_text('''// 泓算桌面版主进程 —— Electron 33
const { app, BrowserWindow, shell, dialog } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 880,
    minWidth: 960,
    minHeight: 640,
    autoHideMenuBar: true,
    backgroundColor: "#f5f5f7",
    title: "泓算 · 桥涵设计流量推求",
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });
  win.loadFile(path.join(__dirname, "index.html"));
  // 外部链接交给系统浏览器
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  // 下载（Word 计算书导出）→ 自动保存到系统下载目录，不弹另存为
  win.webContents.session.on("will-download", (event, item) => {
    const fn = item.getFilename();
    item.setSavePath(path.join(app.getPath("downloads"), fn));
    item.once("done", (e, state) => {
      if (state === "completed") {
        dialog.showMessageBox(win, {
          type: "info",
          message: "计算书已导出",
          detail: "已保存到下载目录：\\n" + item.getSavePath(),
          buttons: ["好"],
        });
      }
    });
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
''', encoding="utf-8")

# 拷贝前端
shutil.copy2(APP_WEB / "index.html", appdir / "index.html")
libs = appdir / "libs"
libs.mkdir(exist_ok=True)
shutil.copy2(APP_WEB / "libs" / "docx.umd.js", libs / "docx.umd.js")
log("app files:", [p.name for p in appdir.iterdir()])

# ---- 整体拷贝到桌面并重命名 exe ----
target = DESKTOP / TARGET_NAME
if target.exists():
    shutil.rmtree(target)
shutil.copytree(root, target)
exe = target / "electron.exe"
if exe.exists():
    exe.rename(target / "泓算.exe")
    log("renamed exe -> 泓算.exe")
else:
    log("WARN: electron.exe not found at", exe)

total = sum(f.stat().st_size for f in target.rglob("*") if f.is_file())
log("TARGET_READY size_MB=%.1f" % (total / 1048576))
log("files:", sum(1 for f in target.rglob("*") if f.is_file()))
