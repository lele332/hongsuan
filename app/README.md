# 桥涵水文计算软件 · app（设计流量模块）

## 现状（2026-09-23 v0.8.0）

设计流量推求三大方法全部就位：① 方法 A P-Ⅲ 频率适线（连序 + 不连序特大洪水）；② 方法 B 历史洪水位法（规范 6.3 曼宁公式 + 6.3.3 多次洪水推算）；③ 方法 C 无资料地区（6.4.2 推理公式 + 径流厚度法）；④ 贝叶斯线型比选；⑤ Word 计算书导出。

v0.8.0 的重点不是新增水文公式，而是**工程加固**：

- 从旧单文件 HTML 中抽出 `src/web/main.ts`，浏览器/Electron/离线版统一引用 `src/core/` 单一计算内核。
- 核心层启用 strict TypeScript；网页层暂时保留非 strict，作为组件化前的过渡状态。
- 新增 `guards.test.ts`，覆盖核心输入边界守卫。
- 新增 Playwright 网页版、真实 Electron 桌面版、离线单文件版端到端验证。
- `web/app.js` 为提交进仓库的构建产物，保证双击网页版无需先执行构建。

## 结构

```text
app/
  src/
    core/
      phi.ts          Φ 离均系数数值计算（P-III / Γ 分布分位数 + 正态）
      stats.ts        矩法统计参数 + 不连序系列修正 + 适线误差函数
      empirical.ts    经验频率（连序 / 独立样本法 / 统一样本法）
      designflood.ts  设计流量汇总接口（Qp = Q̄(1+Φp·Cv)）
      bayes.ts        线型比选：Nelder-Mead MLE + BIC 后验权重
      methodB.ts      方法 B：曼宁公式（6.3.1）+ 多次历史洪水推算（6.3.3）
      methodC.ts      方法 C：推理公式 + 径流厚度法（6.4）
    tests/            47 项：phi / 算例 T1-T4 / 不连序 / 贝叶斯 / 方法 B/C / 边界守卫
    web/main.ts       UI 入口（过渡期 DOM 代码，后续组件化）
  scripts/
    verify-ui.mjs       浏览器端到端
    verify-desktop.mjs  Electron 桌面版端到端
    verify-offline.mjs  单文件离线版端到端
    verify-app-page.mjs 三端共用页面验证逻辑
  web/
    index.html        四模式界面
    app.js            esbuild 构建产物（已提交）
    libs/docx.umd.js  docx.js 9.5.1 本地库
```

## 命令

```powershell
npm ci
npm run typecheck       # 核心 strict + 网页层类型检查
npm test                # 47 项单元测试
npm run build           # 构建 web/app.js
npm run verify          # typecheck + test + build
npm run verify:all      # verify + 浏览器 UI
npm run verify:release  # 网页 + Electron + 离线三端（需先生成发布产物）
```

## 发布产物

```powershell
# 项目根目录
python build_desktop.py
python make_offline.py
```

- 桌面版：`dist/泓算桌面版-v0.8.0/泓算.exe`
- 离线版：`dist/泓算离线版-v0.8.0/泓算-v0.8.0-离线版.html`
- 桌面构建脚本只清理自身目标目录，不再删除整个 `dist/`

## 验证摘要

- 47 项单元测试全部通过；原有 42 项水文回归结果未改动。
- 三端 E2E 均通过：页面版本、单一内核/离线内联、适线 Q1%、贝叶斯、历史洪水位法、推理公式、径流厚度法、越界提示、Word 生成链路、控制台无错误。
- 离线版额外验证无外链脚本、无网络请求（`blob:` 属本地对象 URL，不作为网络请求）。
- 详细正确性论证见 `../参考资料/计算正确性验证报告.md`。

## 已知限制

1. 6.3.1-4 非均匀流试算法（复杂河段水面线）未实现。
2. 径流厚度法参数查表与公式来源仍需对照正式规范/教材复核。
3. 方法 C 的推理公式参数需用户从地区暴雨径流图表查取。
4. P-Ⅲ 三参数 MLE 存在多解性，贝叶斯模块已披露；规范主流程采用适线法。
5. 网页层仍是从旧单文件 HTML 迁出的过程式 DOM 代码，尚未组件化。

## 合规

依据 JTG C30-2015 与《水利水电工程设计洪水计算规范》；计算结果供学习参考，工程应用需注册工程师复核。
