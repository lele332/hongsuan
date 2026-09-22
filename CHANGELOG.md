# CHANGELOG

## v0.8.1 — 2026-09-23 网页层 strict 类型与计算书细节修复

### Added

- `tsconfig.web.json` 启用 strict，网页 UI 源码与计算内核保持同一类型安全基线。

### Fixed

- 修复 Word 计算书在连序系列下“矩法初估 Cs”无法显示的问题：SeriesStats 使用 `csMoment`，不连序系列使用 `cs`。
- Canvas 2D 上下文为空时，Word 导出明确报错，不再触发空引用。
- 防抖保存定时器显式处理空值，符合 strictNullChecks。

### Verification

- `npm run verify`：核心 strict + 网页 strict + 47 项单元测试 + esbuild，通过。
- `npm run verify:release`：网页版、Electron 桌面版、离线单文件版三端 E2E 已通过。

## v0.8.0 — 2026-09-23 工程加固与三端发布链路

### Added

- 新增 `src/tests/guards.test.ts`：连序/不连序系列、曼宁公式、历史洪水法、方法 C、P-Ⅲ 参数边界守卫。
- 新增 `scripts/verify-app-page.mjs` 及网页/Electron/离线三套 Playwright 验证脚本。
- 新增 `npm run verify:desktop`、`npm run verify:offline`、`npm run verify:release`。
- 新增 `CHANGELOG.md`。

### Changed

- `src/web/main.ts` 从旧单文件 HTML 迁出，统一导入 `src/core/` 单一计算内核；删除网页端重复实现的贝叶斯、方法 B/C 逻辑。
- TypeScript 拆分为 `tsconfig.core.json`（strict）与 `tsconfig.web.json`（过渡期非 strict）。
- 网页版本、Electron 版本、离线版本统一为 v0.8.0。
- localStorage 键升级为 `hongsuan_v08`，保留 `hongsuan_v07` 读取兼容。
- `build_desktop.py` 改为相对路径、可重复构建，并只清理桌面版自身目标目录。
- `deploy_pages.py` 改为相对路径，纳入 `app.js`，并新增 `--dry-run` 发布前校验。
- 文档统一更新到 v0.8.0。

### Fixed

- 修复 Windows 下 `npm test` 对测试目录解析失败的问题，改为显式测试文件列表。
- 修复桌面构建可能删除整个 `dist/`、连带清除离线版产物的问题。
- 修复桌面/离线验证在 Electron 环境与离线 blob URL 上的适配问题。

### Verification

- `npm run verify:all`：strict typecheck + 47 项单元测试 + esbuild + 浏览器 E2E，通过。
- `npm run verify:release`：网页版、真实 Electron 桌面版、离线单文件版三端 E2E，通过。
- `python deploy_pages.py --dry-run`：`index.html`、`app.js`、`libs/docx.umd.js` 本地产物校验通过。

### Compatibility / Notes

- `app/web/app.js` 已提交，双击 `app/web/index.html` 无需先构建。
- 本轮刻意**不修改任何水文公式**；v0.7 的 42 项水文回归测试全部保持通过。
- 发布产物位于 `dist/`，被 `.gitignore` 排除。
