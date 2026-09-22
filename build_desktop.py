"""组装泓算 v0.8.0 桌面版（Electron + 单一计算内核构建产物）。"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
APP = ROOT / "app"
APP_WEB = APP / "web"
DIST = ROOT / "electron_dist"
ZIP = DIST / "electron.zip"
OUT = DIST / "unpacked"
RELEASE_ROOT = ROOT / "dist"
VERSION = "0.8.0"
TARGET_NAME = f"泓算桌面版-v{VERSION}"
TARGET = RELEASE_ROOT / TARGET_NAME


def log(*args: object) -> None:
    print(*args, flush=True)


def safe_rmtree(path: Path) -> None:
    path = path.resolve()
    allowed = {OUT.resolve(), TARGET.resolve()}
    if path not in allowed:
        raise RuntimeError(f"拒绝删除非受控目录：{path}")
    if path.exists():
        shutil.rmtree(path)


def run_verify(skip: bool) -> None:
    if skip:
        log("SKIP_VERIFY=1（仅调试用，不得用于正式发布）")
        return
    npm = shutil.which("npm")
    if not npm:
        raise RuntimeError("未找到 npm 可执行文件")
    subprocess.run([npm, "run", "verify"], cwd=APP, check=True)


def copy_app_files(appdir: Path, root: Path) -> None:
    appdir.mkdir(parents=True, exist_ok=True)
    required = [
        APP_WEB / "index.html",
        APP_WEB / "app.js",
        APP_WEB / "libs" / "docx.umd.js",
        APP_WEB / "icon.png",
    ]
    for file in required:
        if not file.is_file():
            raise FileNotFoundError(f"缺少发布文件：{file}")

    shutil.copy2(APP_WEB / "index.html", appdir / "index.html")
    shutil.copy2(APP_WEB / "app.js", appdir / "app.js")
    libs = appdir / "libs"
    libs.mkdir(exist_ok=True)
    shutil.copy2(APP_WEB / "libs" / "docx.umd.js", libs / "docx.umd.js")
    shutil.copy2(APP_WEB / "icon.png", appdir / "icon.png")
    log("app files:", [p.name for p in appdir.iterdir()])


def write_package(appdir: Path) -> None:
    appdir.mkdir(parents=True, exist_ok=True)
    (appdir / "package.json").write_text(
        f'''{{
  "name": "hongsuan",
  "productName": "泓算",
  "version": "{VERSION}",
  "description": "泓算 · 桥涵设计流量推求（依据 JTG C30-2015）",
  "main": "main.js",
  "author": "lele332",
  "license": "MIT"
}}
''',
        encoding="utf-8",
    )


def write_main(appdir: Path) -> None:
    (appdir / "main.js").write_text(
        '''// 泓算桌面版主进程
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
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.session.on("will-download", (event, item) => {
    item.setSavePath(path.join(app.getPath("downloads"), item.getFilename()));
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
''',
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="组装泓算 Electron 桌面版")
    parser.add_argument("--skip-verify", action="store_true", help="跳过测试（仅调试）")
    args = parser.parse_args()

    if not ZIP.is_file():
        log(f"ERROR: Electron 压缩包不存在：{ZIP}")
        sys.exit(1)

    run_verify(args.skip_verify)

    safe_rmtree(OUT)
    OUT.mkdir(parents=True)
    with zipfile.ZipFile(ZIP) as z:
        z.extractall(OUT)
    log("zip entries:", len(z.namelist()))

    candidates = [OUT] + [p for p in OUT.iterdir() if p.is_dir()]
    root = next((c for c in candidates if (c / "electron.exe").exists()), None)
    if root is None:
        log("ERROR: electron.exe not found under", OUT)
        sys.exit(1)
    log("electron root:", root)

    appdir = root / "resources" / "app"
    write_package(appdir)
    write_main(appdir)
    copy_app_files(appdir, root)

    RELEASE_ROOT.mkdir(parents=True, exist_ok=True)
    target = TARGET
    safe_rmtree(target)
    shutil.copytree(root, target)
    exe = target / "electron.exe"
    if not exe.exists():
        raise FileNotFoundError(exe)
    exe.rename(target / "泓算.exe")

    total = sum(f.stat().st_size for f in target.rglob("*") if f.is_file())
    log("TARGET_READY", target)
    log("size_MB=%.1f" % (total / 1048576))
    log("files=%d" % sum(1 for f in target.rglob("*") if f.is_file()))


if __name__ == "__main__":
    main()
