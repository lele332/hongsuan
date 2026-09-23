# CHANGELOG

## v0.9.0 — 2026-09-23 评审意见落地：双副本消除、h 大表接入、错误呈现统一、发布断言升级

### Added

- **内核新增 `src/core/points.ts`**：经验频率点据组装（连序 + 不连序统一样本法）与适线 SSE 收编为内核函数，UI 不再内联第二份公式实现（消除评估报告 D1 同构双副本风险），新增 5 项测试。
- **内核新增 `src/core/parse.ts`**：系列文本解析统一入口，无效 token 逐条报告（修复评估报告坑1"静默过滤"），新增 5 项测试。
- **内核新增 `src/core/runoffTable.ts`**：径流厚度 h 大表 JSON Schema（`hongrunoff-h-table@1`）+ 双线性插值引擎（τ 线性 × 频率对数轴）+ 公开算例锚点种子数据 + 数据自检，新增 8 项测试。方法 C 面板新增"查 h 并填入"交互（5 区 IV 土种子数据可插值，完整 18 分区表待录入）。
- **持久化版本化**：`hongsuan_v09` 带 `schemaVersion: 9`，附 v7/v8 扁平格式迁移函数；清除记忆同时清理全部旧键（评估报告 D3）。
- **CI 工作流**：`.github/workflows/ci.yml` 推送/PR 自动跑 typecheck + 单元测试 + 内核构建。
- **E2E 新增 9 项断言**：无效值忽略明示、错误恢复后隐藏、查 h 节点命中/越界报错、DOCX 解 ZIP 校验正文（计算书标题/规范引用/频率成果表）。

### Changed

- 方法 C 错误呈现从 title 悬浮改为可见红色 err 块（评估报告 4.4，三模式统一）。
- 忽略值提示用琥珀色 notice 样式与错误红色区分。
- 版本号统一提升至 v0.9.0（网页标题/页脚/计算书落款/三端发布脚本/验证断言）。

### Verification

- `npm run verify`：双 strict typecheck + **64 项单元测试**（47 旧 + 17 新）+ esbuild 构建，全部通过。
- `npm run verify:release`：网页 / Electron 桌面 / 离线单文件三端 E2E 各 21~25 项断言全部通过（含 DOCX 真实解包校验）。
- 未修改任何水文公式与数值算法；v0.8.1 的 47 项回归全部保持通过。

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
