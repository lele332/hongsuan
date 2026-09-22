# 桥涵水文计算软件 · app（设计流量模块）

## 现状（2026-09-22 v0.5.0）

设计流量推求三大方法**全部就位**：① 方法 A P-Ⅲ 频率适线（连序 + 不连序特大洪水）；② 方法 B 历史洪水位法（规范 6.3 曼宁公式 + 6.3.3 多次洪水推算）；③ 方法 C 无资料地区（6.4.2 推理公式 + 径流厚度法）；④ 贝叶斯线型比选；⑤ Word 计算书导出。**40 项测试全过**。

```
app/
  src/
    core/
      phi.ts          Φ 离均系数数值计算（P-III / Γ 分布分位数 + 正态）
      stats.ts        矩法统计参数 + 不连序系列修正 + 适线误差函数
      empirical.ts    经验频率（连序 / 独立样本法 / 统一样本法）
      designflood.ts  设计流量汇总接口（Qp = Q̄(1+Φp·Cv)）
      bayes.ts        线型比选：Nelder-Mead MLE + BIC 后验权重 + 合成数据采样器
      methodB.ts      方法 B：曼宁公式（6.3.1）+ 多次历史洪水推算（6.3.3）
      methodC.ts      方法 C：推理公式 + 径流厚度法（6.4，⚠️ 参数形式部分待教材核实）
    tests/            40 项：phi / 算例 T1-T4 / 不连序 / 贝叶斯 / 方法 B / 方法 C
  web/
    index.html        四模式界面（?extra=1 / ?bayes=1 / ?report=1 / ?method=hist|nodata）
    libs/docx.umd.js  docx.js 9.5.1 本地库（免 CDN 依赖）
```

## 运行

- **适线界面**：双击 `web/index.html`，四个模式页签：流量系列适线 / 直接参数 / 历史洪水位法 / 无资料地区
- **单元测试**（40 项）：`node --experimental-strip-types --test src/tests/phi.test.ts src/tests/cases.test.ts src/tests/discontinuous.test.ts src/tests/bayes.test.ts src/tests/methodB.test.ts src/tests/methodC.test.ts`
- **验证脚本**（系统 Python + scipy/numpy）：`python cross_verify.py`；`node --experimental-strip-types dump_bayes.ts` + `python bayes_cross.py`

## 验证

见 `../参考资料/计算正确性验证报告.md`（Φ 网格 scipy 交叉 627 点 100% <1e-6、解析锚点、权威 Φ 表、矩法 numpy 交叉、算例端到端、贝叶斯三模型 scipy 交叉）。方法 B：曼宁手算锚点（python 复算 Q=1179.16）+ Cs=2 解析锚点全链路（Q̄Ti→Q̄→Qp=1855.6）；方法 C：量纲锚点（0.278=1/3.6 单位换算）+ 代数一致性；径流厚度法公式形式标注 ⚠️ 待教材核实（贵州公开算例数字与常见形式不自洽，未硬凑）。

## 已知限制

1. 6.3.1-4 非均匀流试算法（复杂河段水面线）未实现
2. 径流厚度法参数查表（φ/h/z/β/γ/δ）与公式形式待教材核实
3. 方法 C 的推理公式参数（ψ/τ/n）需用户从地区暴雨径流图表查取
4. P-Ⅲ 三参数 MLE 多解性（贝叶斯模块已披露，规范采用适线法的理由）

## 合规

依据 JTG C30-2015 与《水利水电工程设计洪水计算规范》；计算结果供学习参考，工程应用需注册工程师复核。
