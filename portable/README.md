# 泓算桌面版

泓算是基于 Electron 的桥涵设计流量推求工具，计算依据《公路工程水文勘测设计规范》（JTG C30—2015）。

## 版本真源

- 版本号只改 `package.json` 的 `version` 字段。
- 关于对话框和运行时使用 `app.getVersion()`，禁止在页面里硬编码版本号。
- 执行 `npm run release:check` 可检查版本一致性、Electron 版本、发布仓库和必需文件。

## 构建与发布

```powershell
npm run release:check
npm run release:notes
npm run release:build
# 追加便携包：
node scripts/release.cjs --target nsis --target portable
```

发布前必须确认 `dist/latest.yml` 和同名 `.blockmap` 已生成。上传 GitHub Release 时，三者必须一起上传，否则自动更新不会生效。资产名建议使用英文，例如：

```text
HongSuan-Setup-v1.0.14-x64.exe
HongSuan-Setup-v1.0.14-x64.exe.blockmap
latest.yml
```

`release:notes` 会从 Git 提交生成分类发布说明，并附加未签名安装包的 SmartScreen 提示。

## 自动更新

- 安装版内置 `electron-updater`，启动约 30 秒后检查 GitHub Release。
- 更新包自动下载，下载完成后弹窗询问是否安装，不静默重启。
- 断网或 GitHub 访问失败时静默处理，不影响本地计算。
- 便携版不注册系统安装信息，不是自动更新的主要载体。

## 兼容模式

正常模式启用 Electron 沙箱和 GPU。若个别旧显卡或驱动异常，可启用安全兼容模式：

1. 设置 `HS_SAFE_MODE=1` 环境变量后启动；或
2. 在 `%APPDATA%\泓算\gpu-safe-mode.json` 创建空文件。

GPU 连续崩溃时应用会弹窗询问是否切换兼容模式。恢复正常模式时删除 `gpu-safe-mode.json`。

## OCR 运行时

- OCR 优先使用 `HS_PYTHON` 指定的 Python，其次使用安装包内置运行时；不再读取 PATH 中的 Python，降低环境串扰风险。
- 表格识别脚本按版本缓存到 `%APPDATA%\泓算\ocr-tools\<版本>\`。
- RapidOCR 相关依赖已内置，本地无网也可识别截图表格。

## 数据安全

- `localStorage` 仍是项目数据主存储。
- 每次保存同步镜像到 `%APPDATA%\泓算\projects\autosave.json`。
- 系统保留最近 7 个每日备份文件。
- “清除本机记忆”会同时清空 localStorage 和磁盘快照。

## 代码签名说明

当前安装包未签名，Windows SmartScreen 可能提示未知发布者。用户可选择“更多信息”>“仍要运行”。发布页建议公开安装包 SHA-256。若后续采购 OV 代码签名证书，可移除该提示；证书费用和供应链流程需另行评估。

## 开发注意

- `package.json` 的 `build.electronVersion` 是 CI 与本地构建使用的 Electron 版本。
- 黄金回归用例在 `tests/golden-cases.json`，执行器是 `tests/core-golden.cjs`。
- 构建产物在 `dist/`，默认被 `.gitignore` 忽略。
