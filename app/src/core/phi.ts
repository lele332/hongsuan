// ============================================================
// P-III 型频率曲线 离均系数 Φ 的数值计算
// 依据：JTG C30-2015 式 6.2.6  Qp = Q̄ (1 + Φp·Cv)
// 数学关系（Cs > 0）：
//   Φ = (Cs/2)(G − α)，G ~ Gamma(α, 1)，α = 4/Cs²
//   水文频率 p 为超过概率 P(X ≥ x_p) = p，故取下侧分位 1−p
// 验证锚点：Cs=2 → α=1（指数分布），Φ(1%) = ln(100) − 1 = 3.60517（解析精确）
// ============================================================

// Lanczos 近似 log Γ(x)
export function gammaln(x: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - gammaln(1 - x);
  }
  const z = x - 1;
  let a = c[0];
  const t = z + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (z + i);
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
}

// 正则化下侧不完全 Gamma 函数 P(a, x)
export function gammaincLower(a: number, x: number): number {
  if (x <= 0) return 0;
  if (x < a + 1) {
    // 级数展开
    let ap = a;
    let sum = 1 / a;
    let del = sum;
    for (let n = 1; n < 1000; n++) {
      ap += 1;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-16) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - gammaln(a));
  }
  // 连分式（Lentz 算法）计算 Q(a,x) = 1 − P(a,x)
  const FPMIN = 1e-300;
  let b = x + 1 - a;
  let c = 1 / FPMIN;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 1000; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-16) break;
  }
  const q = Math.exp(-x + a * Math.log(x) - gammaln(a)) * h;
  return 1 - q;
}

// Gamma(α, scale=1) 下侧分位数：P(G ≤ g) = p
export function gammaQuantile(p: number, a: number): number {
  if (!(p > 0 && p < 1)) throw new Error(`p 必须在 (0,1)，收到 ${p}`);
  // 上界自适应扩张 + 二分收敛
  let lo = 0;
  let hi = Math.max(a + 1, 1);
  while (gammaincLower(a, hi) < p) {
    lo = hi;
    hi *= 2;
    if (hi > 1e12) throw new Error("gammaQuantile 上界扩张超限");
  }
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (gammaincLower(a, mid) < p) lo = mid;
    else hi = mid;
    if (hi - lo < 1e-13 * Math.max(hi, 1)) break;
  }
  return (lo + hi) / 2;
}

// 标准正态分位数（Acklam 逆正态算法，|误差| < 1.15e-9）
export function norminv(p: number): number {
  if (!(p > 0 && p < 1)) throw new Error(`p 必须在 (0,1)，收到 ${p}`);
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];
  const pLow = 0.02425;
  let q: number, r: number;
  let x: number;
  if (p < pLow) {
    // 下尾
    q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= 1 - pLow) {
    // 中心区
    q = p - 0.5;
    r = q * q;
    x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    // 上尾（对称）
    q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  // Acklam 算法本身精度 |误差| < 1.15e-9，无需二次精修
  return x;
}

// P-III 离均系数 Φ
// pExceed：水文频率（超过概率），0.01 = 1%；Cs：偏态系数
export function phiPIII(pExceed: number, Cs: number): number {
  if (!(pExceed > 0 && pExceed < 1)) throw new Error(`p 必须在 (0,1)，收到 ${pExceed}`);
  if (Math.abs(Cs) < 1e-8) return norminv(1 - pExceed);
  if (Cs > 0) {
    const a = 4 / (Cs * Cs);
    const g = gammaQuantile(1 - pExceed, a);
    return (Cs / 2) * (g - a);
  }
  // Cs < 0：镜像关系 Φ(Cs, p) = −Φ(−Cs, 1−p)
  return -phiPIII(1 - pExceed, -Cs);
}

// 模比系数 Kp = 1 + Φp·Cv（等价于查 Kp 值表）
export function kpPIII(pExceed: number, Cs: number, Cv: number): number {
  return 1 + phiPIII(pExceed, Cs) * Cv;
}

// 按频率数组输出理论频率曲线点（用于绘图与计算书）
export function curveSeries(
  params: { mean: number; cv: number; cs: number },
  freqs: number[],
): Array<{ p: number; phi: number; kp: number; q: number }> {
  return freqs.map((p) => {
    const phi = phiPIII(p, params.cs);
    const kp = 1 + phi * params.cv;
    return { p, phi, kp, q: params.mean * kp };
  });
}
