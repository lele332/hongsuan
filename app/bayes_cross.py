# -*- coding: utf-8 -*-
"""Bayesian lineage comparison cross-check: JS Nelder-Mead MLE vs scipy MLE"""
import numpy as np
from scipy import stats
from scipy.special import gammaln

APP = r"D:\植物\2026-09-22-17-48-53\桥涵水文项目\app"
OUT = r"D:\植物\2026-09-22-17-48-53\bayes_verify.txt"

lines = []

def logL_p3(a0, beta, alpha, x):
    return len(x) * (alpha * np.log(beta) - gammaln(alpha)) + np.sum((alpha - 1) * np.log(x - a0) - beta * (x - a0))

def logL_gev(mu, sigma, xi, x):
    if abs(xi) < 1e-8:
        z = (x - mu) / sigma
        return -len(x) * np.log(sigma) + np.sum(-z - np.exp(-z))
    u = 1 + xi * (x - mu) / sigma
    if np.any(u <= 0):
        return -1e100
    lnT = -np.log(u) / xi
    return -len(x) * np.log(sigma) + np.sum((1 + xi) * lnT - np.exp(lnT))

def logL_gumbel(mu, sigma, x):
    z = (x - mu) / sigma
    return -len(x) * np.log(sigma) + np.sum(-z - np.exp(-z))

for case in ["p3_200", "gev_200", "p3_80"]:
    x = np.loadtxt(f"{APP}\\verify_bayes_{case}.csv")
    n = len(x)
    lines.append(f"===== {case} (n={n}) =====")
    # scipy MLE（独立路径；gumbel_r=最大值 Gumbel；genextreme 传合理初值）
    a, loc, scale = stats.gamma.fit(x)          # 3 参数 gamma：shape a, loc a0, scale=1/β
    ll_p3 = logL_p3(loc, 1 / scale, a, x)
    c, locg, scaleg = stats.genextreme.fit(x, -0.2, loc=np.mean(x) - 0.3 * np.std(x), scale=0.7 * np.std(x))
    ll_gev = logL_gev(locg, scaleg, -c, x)
    locu, scaleu = stats.gumbel_r.fit(x)
    ll_gu = logL_gumbel(locu, scaleu, x)
    lines.append(f"scipy P3 : logL={ll_p3:.4f}  a0={loc:.3f} beta={1/scale:.6f} alpha={a:.3f}")
    lines.append(f"scipy GEV: logL={ll_gev:.4f}  mu={locg:.3f} sigma={scaleg:.3f} xi={-c:.4f}")
    lines.append(f"scipy Gumbel: logL={ll_gu:.4f}  mu={locu:.3f} sigma={scaleu:.3f}")
    # scipy 的 BIC 权重
    bics = {"P3": 3 * np.log(n) - 2 * ll_p3, "GEV": 3 * np.log(n) - 2 * ll_gev, "Gumbel": 2 * np.log(n) - 2 * ll_gu}
    mn = min(bics.values())
    ws = {k: np.exp(-(v - mn) / 2) for k, v in bics.items()}
    s = sum(ws.values())
    lines.append(f"scipy weights: " + " ".join(f"{k}={ws[k]/s:.4f}" for k in ws))
    # JS 结果
    with open(f"{APP}\\verify_bayes_js_{case}.txt", encoding="utf-8") as f:
        lines.append("JS result:\n  " + f.read().replace("\n", "\n  "))
    lines.append("")

with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print("written")
