# -*- coding: utf-8 -*-
"""独立交叉验证：scipy/numpy vs JS 数值内核（P-III Φ 值 + 矩法统计）"""
import csv
import numpy as np
from scipy import stats

APP = r"D:\植物\2026-09-22-17-48-53\桥涵水文项目\app"
OUT = r"D:\植物\2026-09-22-17-48-53\verify_report.txt"

lines = []

def phi_scipy(p_exceed, cs):
    """scipy 侧的 P-III 离均系数（独立实现路径）"""
    if abs(cs) < 1e-8:
        return stats.norm.ppf(1 - p_exceed)
    if cs > 0:
        a = 4.0 / (cs * cs)
        g = stats.gamma.ppf(1 - p_exceed, a)   # Gamma(shape=a, scale=1) 下侧分位
        return (cs / 2.0) * (g - a)
    return -phi_scipy(1 - p_exceed, -cs)

# ---- 1) Φ 网格交叉 ----
with open(f"{APP}\\verify_phi_grid.csv", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

max_abs = 0.0
max_row = None
diffs = []
for r in rows:
    cs = float(r["cs"]); p = float(r["p_exceed"]); js = float(r["phi"])
    py = phi_scipy(p, cs)
    d = abs(js - py)
    diffs.append(d)
    if d > max_abs:
        max_abs = d; max_row = (cs, p, js, py)

diffs = np.array(diffs)
lines.append("=== 1) Φ 值网格交叉验证（JS 内核 vs scipy.stats） ===")
lines.append(f"样本点数: {len(rows)}（Cs: 0~3.0 共 33 档 × P: 0.01%~99.9% 共 19 档）")
lines.append(f"最大绝对误差: {max_abs:.3e}  (Cs={max_row[0]}, P={max_row[1]}, JS={max_row[2]}, scipy={max_row[3]})")
lines.append(f"平均绝对误差: {diffs.mean():.3e}")
lines.append(f"误差 < 1e-9 的点占比: {(diffs < 1e-9).mean()*100:.1f}%")
lines.append(f"误差 < 1e-6 的点占比: {(diffs < 1e-6).mean()*100:.1f}%")
lines.append("")

# ---- 2) 解析恒等式（不依赖 scipy 的自我检验） ----
lines.append("=== 2) 解析恒等式自检（Cs=2 → 指数分布） ===")
from math import log
ok1 = all(abs(phi_scipy(10**-k, 2.0) - ((-log(10**-k)) - 1)) < 1e-10 for k in range(1, 5))
lines.append(f"Φ(10^-k, Cs=2) = ln(10^k) - 1 精确成立（k=1..4）: {'PASS' if ok1 else 'FAIL'}")
ok2 = all(abs(phi_scipy(p, 0.0) - stats.norm.ppf(1-p)) < 1e-12 for p in [0.01, 0.1, 0.5, 0.99])
lines.append(f"Cs=0 与正态分位一致: {'PASS' if ok2 else 'FAIL'}")
lines.append("")

# ---- 3) 矩法统计交叉 ----
series_data = {
    "t1_10": [1200, 850, 1500, 900, 1100, 1350, 700, 1000, 1400, 650],
    "synth_30": [9100, 7800, 7200, 6600, 6200, 5900, 5600, 5400, 5100, 4900,
                  4700, 4500, 4300, 4100, 3900, 3700, 3500, 3300, 3100, 2900,
                  2700, 2500, 2300, 2100, 1900, 1700, 1500, 1300, 1100, 900],
    "mixed_15": [3.5, 12.7, 8.2, 44.1, 0.9, 27.3, 15.6, 6.6, 91.4, 2.2, 18.9, 55.0, 7.7, 33.3, 1.4],
}
with open(f"{APP}\\verify_stats_grid.csv", encoding="utf-8") as f:
    stat_rows = {r["case"]: r for r in csv.DictReader(f)}

lines.append("=== 3) 矩法统计交叉验证（JS seriesStats vs numpy） ===")
for name, xs in series_data.items():
    x = np.array(xs, dtype=float)
    n = len(x)
    mean_np = x.mean()
    sigma_np = x.std(ddof=1)                    # 无偏
    cv_np = sigma_np / mean_np
    m3 = ((x - mean_np) ** 3).sum()
    cs_np = n * m3 / ((n - 1) * (n - 2) * sigma_np**3)
    r = stat_rows[name]
    # 判据：相对误差 < 1e-11（JS 侧 toPrecision(12) 有 12 位有效数字，绝对误差随量级放大）
    def rel(a, b):
        return abs(a - b) / max(abs(b), 1e-30)
    d_mean, d_sigma = rel(mean_np, float(r["mean"])), rel(sigma_np, float(r["sigma"]))
    d_cv, d_cs = rel(cv_np, float(r["cv"])), rel(cs_np, float(r["cs_moment"]))
    worst = max(d_mean, d_sigma, d_cv, d_cs)
    lines.append(f"{name}: 相对误差 mean={d_mean:.1e} sigma={d_sigma:.1e} Cv={d_cv:.1e} Cs={d_cs:.1e}"
                 + ("  PASS" if worst < 1e-11 else "  *** FAIL ***"))
lines.append("")

# ---- 4) 已知算例端到端复算（scipy 路径） ----
lines.append("=== 4) 端到端算例复算（scipy 独立路径） ===")
cases = [
    ("算例T2 Q1%", 860, 0.605, 1.5, 0.01, 2593, 10),
    ("算例T3 Q1%", 5173.6, 0.331, 1.99, 0.01, 11345, 40),
    ("算例T2 Q0.1%", 860, 0.605, 1.5, 0.001, 3583, 10),
    ("校验点 Φ(1%,Cs=1.5)", None, None, 1.5, 0.01, 3.33, 0.01),
]
for name, mean, cv, cs, p, expect, tol in cases:
    phi = phi_scipy(p, cs)
    if mean is None:
        lines.append(f"{name}: scipy Φ={phi:.4f}，期望 {expect}，Δ={abs(phi-expect):.4f}"
                     + ("  PASS" if abs(phi - expect) <= tol else "  *** FAIL ***"))
    else:
        q = mean * (1 + phi * cv)
        lines.append(f"{name}: scipy Q={q:.1f}，期望 {expect}，Δ={abs(q-expect):.1f}"
                     + ("  PASS" if abs(q - expect) <= tol else "  *** FAIL ***"))

# ---- 5) 权威 Φ 表抽验（表值 3 位小数，容差 0.006） ----
lines.append("=== 5) 权威 Φ 值表抽验（表值精度 3 位小数） ===")
# 表A：《工程水文学》第5版附表（P/% → Φ）
tblA = {
    0.0: {0.001: 4.26, 0.01: 3.72, 0.1: 3.09, 0.2: 2.88, 0.333: 2.71, 0.5: 2.58, 1: 2.33, 2: 2.05, 3: 1.88, 5: 1.64, 10: 1.28, 20: 0.84, 25: 0.67, 30: 0.52, 40: 0.25, 50: 0.00, 60: -0.25, 70: -0.52, 75: -0.67, 80: -0.84, 85: -1.04, 90: -1.28, 95: -1.64, 97: -1.88, 99: -2.33},
    0.1: {0.001: 4.56, 0.01: 3.94, 0.1: 3.23, 0.2: 3.00, 0.333: 2.82, 0.5: 2.67, 1: 2.40, 2: 2.11, 3: 1.92, 5: 1.67, 10: 1.29, 20: 0.84, 25: 0.66, 30: 0.51, 40: 0.24, 50: -0.02, 60: -0.27, 70: -0.53, 75: -0.68, 80: -0.85, 85: -1.04, 90: -1.27, 95: -1.62, 97: -1.84, 99: -2.25},
    0.3: {0.001: 5.16, 0.01: 4.38, 0.1: 3.52, 0.2: 3.24, 0.333: 3.03, 0.5: 2.86, 1: 2.54, 2: 2.21, 3: 2.00, 5: 1.73, 10: 1.31, 20: 0.82, 25: 0.64, 30: 0.48, 40: 0.20, 50: -0.05, 60: -0.30, 70: -0.56, 75: -0.70, 80: -0.85, 85: -1.03, 90: -1.24, 95: -1.55, 97: -1.75, 99: -2.10},
}
# 表B：浙江省短历时暴雨图集附表6-2（P/% → Φ，列位已逐列核对）
tblB = {
    1.95: {0.001: 10.360, 0.1: 5.842, 0.2: 5.161, 0.5: 4.261, 1: 3.579, 2: 2.897, 3: 2.497, 5: 1.993, 10: 1.307},
    2.00: {0.001: 10.510, 0.1: 5.908, 0.2: 5.215, 0.5: 4.298, 1: 3.605, 2: 2.912, 3: 2.507, 5: 1.996, 10: 1.303},
    2.20: {0.001: 11.140, 0.1: 6.168, 0.2: 5.424, 0.5: 4.444, 1: 3.705, 2: 2.970, 3: 2.542, 5: 2.006, 10: 1.284},
    2.40: {0.001: 11.770, 0.1: 6.423, 0.2: 5.628, 0.5: 4.584, 1: 3.800, 2: 3.023, 3: 2.573, 5: 2.011, 10: 1.262},
}
nA = nB = okA = okB = 0
worstA = worstB = 0.0
missA = []
for cs, row in tblA.items():
    for p_pct, tblv in row.items():
        v = phi_scipy(p_pct / 100, cs)
        if abs(v - tblv) > 0.006:
            missA.append(f"Cs={cs}, P={p_pct}%: 算得 {v:.4f} vs 表值 {tblv}")
        okA += abs(v - tblv) <= 0.006; nA += 1
        worstA = max(worstA, abs(v - tblv))
for cs, row in tblB.items():
    for p_pct, tblv in row.items():
        v = phi_scipy(p_pct / 100, cs)
        okB += abs(v - tblv) <= 0.006; nB += 1
        worstB = max(worstB, abs(v - tblv))
lines.append(f"表A《工程水文学》附表（Cs=0~0.3）：{okA}/{nA} 命中（最大偏差 {worstA:.4f}）")
for m in missA:
    lines.append(f"  未命中点：{m}")
lines.append(f"表B 浙江暴雨图集附表6-2（Cs=1.95~2.40）：{okB}/{nB} 命中（最大偏差 {worstB:.4f}）")

with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print("written", OUT)
