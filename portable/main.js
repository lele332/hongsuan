// 泓算桌面版主进程 v2：窗口记忆 / 单实例 / 中文菜单 / 外链防护 / 崩溃兜底
const { app, BrowserWindow, Menu, shell, dialog, screen, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFile } = require("child_process");

// ---------- GPU / 沙箱策略（2026-09-26 十一轮实验定版，注释即诊断档案） ----------
// 症状链：GPU 进程启动即崩（exit_code=1，连发 4~6 次）→ 每崩一次连带击杀渲染进程 →
// 渲染器首帧永远无法提交（ready-to-show 永不触发、窗口纯白）→ 崩满 6 次触发 Chromium
// 硬 FATAL「GPU process isn't usable. Goodbye.」（0x80000003）整进程退出。
// 十一轮开关矩阵实测结论（_gpudiag_e1~e11）：
//   e1  无任何 GPU 代码          → 9 崩 FATAL ✗
//   e6  无状态文件+无开关        → 6 崩 FATAL ✗（排除最大化恢复因素）
//   e9  纯 ASCII 路径 C:\hstest  → 6 崩 FATAL ✗（排除中文路径因素）
//   e10 清空 Dawn/GPU 缓存       → 6 崩 FATAL ✗（排除缓存中毒因素）
//   s1~s5/e5/e8 仅关 GPU 沙箱等  → GPU 不崩了，但渲染器仍死 11 次、白屏 ✗
//   e7  极简 data: 页面          → 渲染器死 3 次后仍不绘制 ✗（排除应用内容因素）
//   e11 --no-sandbox             → 0 崩 0 杀、ready-to-show 触发、UI 完整渲染、干净退出 ✓
// 根因：本机（Intel Arc 集显）Chromium 沙箱对 GPU 进程与渲染进程的初始化均随机失败，
// 同机 Edge 不受影响（沙箱配置不同）；与星屿 pywebview/WebView2 的 GPU 死锁同源。
// 修复 = disableHardwareAcceleration()（软件合成，绕开坏驱动）+ no-sandbox（绕开失效沙箱）。
// 安全性说明：本应用只加载本地 file:// 内容、外链一律转交系统浏览器（will-navigate 防护），
// 渲染进程不接触远程内容，关闭沙箱的攻击面增量可接受；其他机器如沙箱正常，
// no-sandbox 无副作用。若用户日后更新显卡驱动使沙箱恢复，可移除 no-sandbox 再验证。
// 【2026-10-15 P0.1】不再全局禁用 GPU/沙箱（旧全局降级只应针对个别问题机器）。
// 默认启用硬件加速与沙箱；仅当 HS_SAFE_MODE=1 或 userData/gpu-safe-mode.json 存在时降级。
// gpu-safe-mode.json 由"连续 GPU 崩溃自动检测 + 用户确认"写入（见下方自动降级逻辑），删除该文件即可恢复。
function hsSafeModeOn() {
  if (process.env.HS_SAFE_MODE === "1") return true;
  try {
    return fs.existsSync(path.join(app.getPath("userData"), "gpu-safe-mode.json"));
  } catch { return false; }
}

if (process.platform === "win32") app.setAppUserModelId("com.lele332.hongsuan");

// ---------- 生命周期调试日志（排障用，超过 256KB 自动清零） ----------
const dbgFile = () => path.join(app.getPath("userData"), "main-debug.log");
function dbg(tag) {
  try {
    const f = dbgFile();
    fs.mkdirSync(path.dirname(f), { recursive: true });
    if (!fs.existsSync(f) || fs.statSync(f).size > 262144) fs.writeFileSync(f, "");
    fs.appendFileSync(f, new Date().toISOString() + " " + tag + "\n");
  } catch {
    /* 调试日志失败不影响使用 */
  }
}
if (hsSafeModeOn()) {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch("no-sandbox");
}
dbg("safe-mode=" + hsSafeModeOn() + " pid=" + process.pid + " gpu=" + app.commandLine.hasSwitch("disable-gpu"));
app.on("child-process-gone", (_e, d) => dbg("child-process-gone type=" + d.type + " reason=" + d.reason));
app.on("before-quit", () => dbg("before-quit"));
app.on("will-quit", () => dbg("will-quit"));

// ---------- GPU 连续崩溃自动降级（P0.1） ----------
let gpuCrashTimes = [];
let gpuDegradeAsked = false;
app.on("child-process-gone", (_e, d) => {
  if (!d || d.type !== "GPU") return;
  const now = Date.now();
  gpuCrashTimes.push(now);
  gpuCrashTimes = gpuCrashTimes.filter((t) => now - t <= 60000);
  dbg("gpu-crash count60s=" + gpuCrashTimes.length + " reason=" + d.reason);
  if (gpuCrashTimes.length >= 3 && !gpuDegradeAsked && !hsSafeModeOn() && app.isReady()) {
    gpuDegradeAsked = true;
    dialog.showMessageBox({
      type: "warning",
      title: "显卡兼容性",
      message: "检测到显卡渲染进程连续异常",
      detail: "是否以兼容模式重启泓算？（将禁用 GPU 加速；删除数据目录中的 gpu-safe-mode.json 可恢复默认模式）",
      buttons: ["以兼容模式重启", "暂不"],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    })
      .then(({ response }) => {
        if (response !== 0) return;
        try {
          const f = path.join(app.getPath("userData"), "gpu-safe-mode.json");
          fs.mkdirSync(path.dirname(f), { recursive: true });
          fs.writeFileSync(f, JSON.stringify({ enabled: true, at: new Date().toISOString() }));
        } catch {}
        app.relaunch();
        app.quit();
      })
      .catch(() => {});
  }
});

const APP_ONLINE = "https://lele332.github.io/hongsuan/";
const APP_REPO = "https://github.com/lele332/hongsuan";

// ---------- 本地 OCR（图片不出本机，交给本机 Python + RapidOCR 推理）----------
function ocrPythonCandidates() {
  // P0.3：只信任两类解释器——内置随包运行时与显式环境变量；不再探测 PATH（防劫持/防误配）。
  const cands = [];
  if (process.env.HS_PYTHON) cands.push(process.env.HS_PYTHON);
  try {
    const bundled = path.join(process.resourcesPath || path.dirname(__dirname), "python", "python.exe");
    cands.push(bundled);
  } catch {}
  return cands;
}

// P0.3：已移除“自动记忆解释器路径”逻辑（曾写入可写目录并被 execFile 执行，属坏模式）。

function readRememberedPython() {
  // P0.3：只读显式用户配置（ocr-settings.json）；旧 ocr-python.json 仅作一次性兼容读取，且
  // 读取时校验文件必须存在（不再盲信可写目录里的任意路径字符串）。
  const tryRead = (name) => {
    try {
      const f = path.join(app.getPath("userData"), name);
      const p = JSON.parse(fs.readFileSync(f, "utf-8")).python;
      if (typeof p === "string" && p && fs.existsSync(p)) return p;
    } catch {}
    return null;
  };
  return tryRead("ocr-settings.json") || tryRead("ocr-python.json");
}

function hasBundledPython() {
  try {
    const bundled = path.join(process.resourcesPath || path.dirname(__dirname), "python", "python.exe");
    return fs.existsSync(bundled);
  } catch {
    return false;
  }
}

function runPythonOcr(scriptPath, imgPath, extraArgs) {
  const remembered = readRememberedPython();
  const list = (remembered ? [remembered] : []).concat(ocrPythonCandidates());
  const seen = new Set();
  const uniq = list.filter((p) => (seen.has(p) ? false : (seen.add(p), true)));

  return new Promise((resolve) => {
    let i = 0;
    const tryNext = (lastErrText) => {
      if (i >= uniq.length) {
        resolve(
          JSON.stringify({
            ok: false,
            error: "内置 OCR 运行时不可用（resources\\python\\python.exe）。可在环境变量 HS_PYTHON 指定解释器后重试。" +
              lastErrText,
          })
        );
        return;
      }
      const py = uniq[i++];
      execFile(
        py,
        [scriptPath, imgPath].concat(extraArgs),
        {
          maxBuffer: 64 * 1024 * 1024,
          timeout: 180000,
          windowsHide: true,
          env: Object.assign({}, process.env, { PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" }),
        },
        (err, stdout, stderr) => {
          const text = String(stdout || "").trim();
          const looksJson = text.startsWith("{");
          if (!err && looksJson) {
            resolve(text);
            return;
          }
          tryNext(String(stderr || err || "").slice(0, 200));
        }
      );
    };
    tryNext("");
  });
}

// ---------- P3.1 项目数据落盘：localStorage 快照镜像（原子写 + 每日备份保留 7 份） ----------
function hsProjectsDir() {
  return path.join(app.getPath("userData"), "projects");
}
function hsAtomicWrite(file, data) {
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, file);
}
ipcMain.on("hs:snapshot-load-sync", (event) => {
  try {
    const cur = path.join(hsProjectsDir(), "autosave.json");
    event.returnValue = fs.existsSync(cur) ? fs.readFileSync(cur, "utf-8") : null;
  } catch {
    event.returnValue = null;
  }
});
ipcMain.handle("hs:snapshot-save", async (_e, data) => {
  try {
    if (typeof data !== "string" || !data || data.charAt(0) !== "{") return false;
    const d = hsProjectsDir();
    fs.mkdirSync(d, { recursive: true });
    hsAtomicWrite(path.join(d, "autosave.json"), data);
    const day = new Date().toISOString().slice(0, 10);
    const bak = path.join(d, "autosave-" + day + ".json");
    if (!fs.existsSync(bak)) hsAtomicWrite(bak, data);
    const files = fs.readdirSync(d).filter((f) => /^autosave-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
    while (files.length > 7) { try { fs.unlinkSync(path.join(d, files.shift())); } catch {} }
    return true;
  } catch {
    return false;
  }
});
ipcMain.handle("hs:snapshot-load", async () => {
  try {
    const cur = path.join(hsProjectsDir(), "autosave.json");
    return fs.existsSync(cur) ? fs.readFileSync(cur, "utf-8") : null;
  } catch {
    return null;
  }
});
ipcMain.handle("hs:snapshot-clear", async () => {
  try {
    const cur = path.join(hsProjectsDir(), "autosave.json");
    if (fs.existsSync(cur)) fs.unlinkSync(cur);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle("hs:ocr-table", async (_e, dataUrl, opts) => {
  const o = opts || {};
  try {
    const b64 = String(dataUrl).replace(/^data:image\/[a-zA-Z]+;base64,/, "");
    if (!b64) return JSON.stringify({ ok: false, error: "没有收到图片数据" });
    const tmp = path.join(os.tmpdir(), "hongsuan-ocr-" + Date.now() + ".png");
    fs.writeFileSync(tmp, Buffer.from(b64, "base64"));
    const unpackedScript = path.join(process.resourcesPath || path.dirname(__dirname), "app.asar.unpacked", "tools", "ocr_table.py");
    let script = unpackedScript;
    if (!fs.existsSync(unpackedScript)) {
      // P2.3：Python 无法直接读 asar；从 asar 内规范脚本解到 userData 一次性缓存（按版本目录）
      try {
        const ocrCacheDir = path.join(app.getPath("userData"), "ocr-tools", app.getVersion());
        fs.mkdirSync(ocrCacheDir, { recursive: true });
        script = path.join(ocrCacheDir, "ocr_table.py");
        if (!fs.existsSync(script)) {
          fs.writeFileSync(script, fs.readFileSync(path.join(__dirname, "tools", "ocr_table.py")));
        }
      } catch (e2) {
        script = path.join(__dirname, "tools", "ocr_table.py");
      }
    }
    const extra = [];
    if (o.deskew) extra.push("--deskew");
    if (o.yTol) extra.push("--y-tol", String(o.yTol));
    if (o.xGap) extra.push("--x-gap", String(o.xGap));
    const out = await runPythonOcr(script, tmp, extra);
    try {
      fs.unlinkSync(tmp);
    } catch {}
    return out;
  } catch (e) {
    return JSON.stringify({ ok: false, error: String((e && e.message) || e) });
  }
});

// ---------- 窗口状态记忆 ----------
const stateFile = () => path.join(app.getPath("userData"), "window-state.json");

function loadWindowState() {
  try {
    const st = JSON.parse(fs.readFileSync(stateFile(), "utf-8"));
    if (![st.x, st.y, st.width, st.height].every(Number.isFinite)) return null;
    // 位置必须落在某个可见屏幕内（防止外接屏拔掉后窗口跑到屏幕外）
    const visible = screen.getAllDisplays().some((d) => {
      const a = d.workArea;
      return (
        st.x + st.width > a.x + 80 &&
        st.x < a.x + a.width - 80 &&
        st.y + st.height > a.y + 80 &&
        st.y < a.y + a.height - 80
      );
    });
    return visible ? st : null;
  } catch {
    return null;
  }
}

function saveWindowState(win) {
  try {
    const bounds = win.isMaximized() ? win.getNormalBounds() : win.getBounds();
    fs.mkdirSync(path.dirname(stateFile()), { recursive: true });
    fs.writeFileSync(stateFile(), JSON.stringify({ ...bounds, maximized: win.isMaximized() }));
  } catch {
    /* 状态保存失败不影响使用 */
  }
}

// ---------- 中文菜单 ----------
function buildMenu(win) {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "文件",
        submenu: [
          { label: "关闭窗口", accelerator: "CmdOrCtrl+W", role: "close" },
          { type: "separator" },
          { label: "退出泓算", accelerator: "Alt+F4", role: "quit" },
        ],
      },
      {
        label: "视图",
        submenu: [
          { label: "重新加载", accelerator: "CmdOrCtrl+R", role: "reload" },
          { label: "强制重新加载", accelerator: "CmdOrCtrl+Shift+R", role: "forceReload" },
          { type: "separator" },
          { label: "全屏", accelerator: "F11", role: "togglefullscreen" },
          { label: "开发者工具", accelerator: "F12", role: "toggleDevTools" },
        ],
      },
      {
        label: "帮助",
        submenu: [
          {
            label: "关于泓算",
            click: () => {
              dialog.showMessageBox(win, {
                type: "info",
                title: "关于泓算",
                message: "泓算 · 桥涵设计流量推求",
                detail:
                  "规范表格全内置 · 公式条号可溯源 · 计算过程全留痕\n版本 v" + app.getVersion() + "\n规范 JTG C30—2015\n\n在线版：" +
                  APP_ONLINE +
                  "\n开源仓库：" +
                  APP_REPO,
                buttons: ["好"],
                noLink: true,
              });
            },
          },
          { label: "检查更新（打开发布页）", click: () => shell.openExternal(APP_REPO + "/releases") },
          { type: "separator" },
          { label: "打开在线版网页", click: () => shell.openExternal(APP_ONLINE) },
        ],
      },
    ])
  );
}

// ---------- 主窗口 ----------
let mainWindow = null;
let crashTimes = []; // P3.3：5 分钟滑动窗口

function createWindow() {
  const st = loadWindowState() || {};
  const winIconPath = (() => {
    const candidates = app.isPackaged
      ? [path.join(process.resourcesPath, "icon-matching.ico"), path.join(__dirname, "icon-matching.ico")]
      : [path.join(__dirname, "icon-matching.ico")];
    return candidates.find((p) => fs.existsSync(p)) || null;
  })();
  const win = new BrowserWindow({
    width: st.width || 1200,
    height: st.height || 880,
    x: st.x,
    y: st.y,
    minWidth: 960,
    minHeight: 640,
    show: false, // ready-to-show 后再显示，避免启动白屏闪烁
    backgroundColor: "#f5f5f7",
    title: "泓算 · 桥涵设计流量推求",
    icon: (() => {
      // 打包后 asar 内的 ico 无法被 Windows 原生读取（任务栏会显示空白），必须从 asar 外的 resources 加载
      const fs = require("fs");
      const candidates = app.isPackaged
        ? [path.join(process.resourcesPath, "icon-matching.ico"), path.join(__dirname, "icon-matching.ico")]
        : [path.join(__dirname, "icon-matching.ico")];
      for (const p of candidates) { if (fs.existsSync(p)) return p; }
      return undefined;
    })(),
    webPreferences: {
      contextIsolation: true,
      additionalArguments: [`--hs-local-ocr=${hasBundledPython() ? "1" : "0"}`],
      nodeIntegration: false,
      spellcheck: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  // Windows 任务栏显式绑定：BrowserWindow.icon 在个别系统上会被图标缓存/AUMID 关联影响
  if (winIconPath) {
    try { win.setIcon(winIconPath); } catch (e) {}
    try { win.setAppDetails({ appId: app.getAppUserModelId(), iconPath: winIconPath, iconIndex: 0 }); } catch (e) {}
  }
  if (st.maximized) win.maximize();
  mainWindow = win;

  buildMenu(win);
  win.loadFile(path.join(__dirname, "index.html"));

  // 兼容模式状态横幅（P0.1：让降级状态对用户可见）
  if (hsSafeModeOn()) {
    win.webContents.on("did-finish-load", () => {
      win.webContents.executeJavaScript(
        "(function(){var b=document.createElement('div');b.textContent='兼容渲染模式（GPU 已禁用）';b.style.cssText='position:fixed;left:12px;bottom:12px;z-index:99999;background:#fff3cd;color:#664d03;border:1px solid #ffe69c;border-radius:8px;padding:6px 12px;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,.15);pointer-events:none';(document.body||document.documentElement).appendChild(b);})()"
      ).catch(() => {});
    });
  }

  // 启动显示：ready-to-show 优先，2 秒兜底，防止极端情况下窗口不出现
  win.once("ready-to-show", () => {
    dbg("ready-to-show");
    win.show();
  });
  setTimeout(() => {
    if (!win.isDestroyed() && !win.isVisible()) win.show();
  }, 2000);

  // 关闭时保存窗口状态
  win.on("close", () => {
    dbg("close");
    saveWindowState(win);
  });
  win.on("closed", () => dbg("closed"));

  // 外链一律用系统浏览器打开：禁止在应用内开新窗口、禁止把主窗口导航走
  // P0.2：外链仅允许 http/https 转交系统浏览器；应用内仅允许落在应用目录内的 file:// 导航
  const isSafeExternalUrl = (u) => {
    try { const p = new URL(u); return p.protocol === "https:" || p.protocol === "http:"; } catch { return false; }
  };
  const isLocalAppUrl = (u) => {
    try {
      const p = new URL(u);
      if (p.protocol !== "file:") return false;
      const appDir = path.resolve(__dirname);
      const target = path.resolve(path.normalize(decodeURIComponent(p.pathname)));
      return target === appDir || target.startsWith(appDir + path.sep);
    } catch { return false; }
  };
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (isLocalAppUrl(url)) return;
    event.preventDefault();
    if (isSafeExternalUrl(url)) shell.openExternal(url);
  });

  // 下载完成：可直接打开文件或所在文件夹
  win.webContents.session.on("will-download", (event, item) => {
    // P3.2：同名文件自动追加序号，禁止静默覆盖
    const dirDl = app.getPath("downloads");
    const origName = item.getFilename();
    const ext = path.extname(origName);
    const base = origName.slice(0, origName.length - ext.length);
    let finalName = origName;
    let n = 1;
    while (fs.existsSync(path.join(dirDl, finalName))) {
      n += 1;
      finalName = base + "(" + n + ")" + ext;
    }
    item.setSavePath(path.join(dirDl, finalName));
    item.once("done", (e, state) => {
      if (state !== "completed") return;
      dialog
        .showMessageBox(win, {
          type: "info",
          message: "计算书已导出",
          detail: "已保存到下载目录：\n" + item.getSavePath(),
          buttons: ["打开文件", "打开所在文件夹", "好"],
          defaultId: 2,
          cancelId: 2,
          noLink: true,
        })
        .then(({ response }) => {
          if (response === 0) shell.openPath(item.getSavePath());
          else if (response === 1) shell.showItemInFolder(item.getSavePath());
        });
    });
  });

  // 渲染进程崩溃兜底：自动恢复。阈值取 10（GPU 风暴期每次 GPU 崩溃都可能连带
  // 击杀渲染进程，4~6 连发属正常风暴，重载即可自愈；真正的死循环远超此数）。
  win.webContents.on("render-process-gone", (_e, d) => {
    const now = Date.now();
    crashTimes.push(now);
    crashTimes = crashTimes.filter((t) => now - t <= 300000);
    dbg("render-process-gone reason=" + d.reason + " count5m=" + crashTimes.length);
    if (crashTimes.length > 10) {
      dialog
        .showMessageBox(win, {
          type: "error",
          message: "泓算界面进程反复异常",
          detail: "点击「好」后泓算将退出，请重新启动（输入数据已自动保存）。",
          buttons: ["好"],
          noLink: true,
        })
        .then(() => app.quit())
        .catch(() => app.quit());
      setTimeout(() => app.quit(), 10000); // 无人响应时兜底退出
      return;
    }
    win.webContents.reload();
  });
}

// ---------- 单实例锁：重复双击时聚焦已有窗口 ----------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    dbg("second-instance");
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    // ---------- 自动更新（P1.3.2）：启动 30 秒后检查；下载完成后询问安装；无网络/无渠道静默 ----------
    let hsUpdater = null;
    try { hsUpdater = require("electron-updater").autoUpdater; } catch {}
    if (hsUpdater) {
      hsUpdater.autoDownload = true;
      hsUpdater.logger = null;
      hsUpdater.on("update-downloaded", (info) => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        dialog.showMessageBox(mainWindow, {
          type: "info",
          title: "泓算更新",
          message: "新版本 " + (info && info.version ? info.version : "") + " 已下载完成",
          detail: "是否立即安装？（重启泓算完成更新）",
          buttons: ["立即安装", "下次启动时安装"],
          defaultId: 0,
          cancelId: 1,
          noLink: true,
        })
          .then(({ response }) => { if (response === 0) hsUpdater.quitAndInstall(); })
          .catch(() => {});
      });
      hsUpdater.on("error", () => {});
      setTimeout(() => { Promise.resolve(hsUpdater.checkForUpdates()).catch(() => {}); }, 30000);
    }
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    dbg("window-all-closed");
    if (process.platform !== "darwin") app.quit();
  });
}


