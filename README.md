# 泓算 HongSuan v0.8.0

**面向学生与青年工程师的公路桥涵水文计算工具** —— 合规范、白盒化、现代化。

依据《公路工程水文勘测设计规范》JTG C30-2015，覆盖桥涵水文计算链的第一环「设计流量推求」：

| 方法 | 内容 | 规范依据 |
|---|---|---|
| **A · 频率适线** | P-Ⅲ 型曲线交互式适线（海森机率格纸 + Cv/Cs 滑块实时重绘）；连序系列与不连序系列（特大洪水） | 6.2（式 6.2.6） |
| **B · 历史洪水位法** | 曼宁公式（河槽/河滩分算）+ 多次历史洪水推算 | 6.3 |
| **C · 无资料地区** | 推理公式 + 径流厚度法（参数查地区暴雨径流图表） | 6.4 |
| **线型比选（贝叶斯）** | P-Ⅲ vs GEV vs Gumbel，MLE → BIC → 后验权重 | 多方法论证（6.1.3） |
| **Word 计算书** | 依据、资料表、参数、设计值过程、频率成果表、适线图一键导出 | — |

## v0.8.0 特点

- **单一计算内核**：`app/src/core/` 为 strict TypeScript 计算内核；浏览器、Electron 桌面版、离线单文件版共用同一内核与 UI 入口，消除“测试一套、运行一套”的漂移风险。
- **工程化验证**：47 项单元测试全过；Playwright 覆盖网页版、真实 Electron 桌面版、离线单文件版三端关键流程。
- **输入边界加固**：连序/不连序系列、曼宁公式、历史洪水法、方法 C 均增加有限值、非负、频率与折减系数范围守卫。
- **多形态发布**：普通网页版、Electron 桌面版、断网单文件离线版、GitHub Pages 网页版共用同源产物。
- **参数持久化**：本机输入自动保存到 `hongsuan_v08`，兼容读取 v0.7 数据。
- **白盒化**：每个参数带含义与合理范围提示，每步显示公式出处——不是黑盒。

## 使用

```powershell
# 浏览器版
app\web\index.html

# 桌面版/离线版（构建后）
dist\泓算桌面版-v0.8.0\泓算.exe
dist\泓算离线版-v0.8.0\泓算-v0.8.0-离线版.html
```

## 开发与验证

```powershell
cd app
npm ci
npm run verify         # strict typecheck + 47 项测试 + esbuild 构建
npm run verify:all     # verify + 浏览器 UI 端到端
npm run verify:release # 网页版 + Electron 桌面版 + 离线版端到端
```

发布脚本位于项目根目录：

```powershell
python build_desktop.py          # 生成 Electron 桌面版；只清理自身目标目录
python make_offline.py           # 生成单文件离线版
python deploy_pages.py --dry-run # 校验 GitHub Pages 发布产物
python deploy_pages.py           # 正式发布到 GitHub Pages（需 gh 登录）
```

## 目录

```text
app/src/core/       数值内核（Φ 值 / 矩法 / 经验频率 / 贝叶斯比选 / 方法 B/C）
app/src/tests/      47 项单元测试
app/src/web/        UI 入口 TypeScript 源码
app/scripts/        Playwright 网页/桌面/离线验证脚本
app/web/            发布用网页入口、构建产物 app.js、本地 docx 库
参考资料/           交接文档、正确性验证报告、教材与例题资料
```

## 合规声明

计算结果供学习与课程设计参考，工程应用须经注册工程师复核。规范公式为技术规则可依规范采用；本项目不复制规范原文。径流厚度法与部分方法 C 参数表仍需对照正式教材/地区手册复核，软件内已明确标注。

## License

MIT
