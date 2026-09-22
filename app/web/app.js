(() => {
  // src/core/phi.ts
  function gammaln(x) {
    const g = 7;
    const c = [
      0.9999999999998099,
      676.5203681218851,
      -1259.1392167224028,
      771.3234287776531,
      -176.6150291621406,
      12.507343278686905,
      -0.13857109526572012,
      9984369578019572e-21,
      15056327351493116e-23
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
  function gammaincLower(a, x) {
    if (x <= 0) return 0;
    if (x < a + 1) {
      let ap = a;
      let sum = 1 / a;
      let del = sum;
      for (let n = 1; n < 1e3; n++) {
        ap += 1;
        del *= x / ap;
        sum += del;
        if (Math.abs(del) < Math.abs(sum) * 1e-16) break;
      }
      return sum * Math.exp(-x + a * Math.log(x) - gammaln(a));
    }
    const FPMIN = 1e-300;
    let b = x + 1 - a;
    let c = 1 / FPMIN;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i < 1e3; i++) {
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
  function gammaQuantile(p, a) {
    if (!Number.isFinite(a) || a <= 0) throw new Error(`Gamma \u5206\u5E03\u5F62\u72B6\u53C2\u6570 a \u5FC5\u987B\u4E3A\u6B63\uFF0C\u6536\u5230 ${a}`);
    if (!(p > 0 && p < 1)) throw new Error(`p \u5FC5\u987B\u5728 (0,1)\uFF0C\u6536\u5230 ${p}`);
    let lo = 0;
    let hi = Math.max(a + 1, 1);
    while (gammaincLower(a, hi) < p) {
      lo = hi;
      hi *= 2;
      if (hi > 1e12) throw new Error("gammaQuantile \u4E0A\u754C\u6269\u5F20\u8D85\u9650");
    }
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (gammaincLower(a, mid) < p) lo = mid;
      else hi = mid;
      if (hi - lo < 1e-13 * Math.max(hi, 1)) break;
    }
    return (lo + hi) / 2;
  }
  function norminv(p) {
    if (!(p > 0 && p < 1)) throw new Error(`p \u5FC5\u987B\u5728 (0,1)\uFF0C\u6536\u5230 ${p}`);
    const a = [
      -39.69683028665376,
      220.9460984245205,
      -275.9285104469687,
      138.357751867269,
      -30.66479806614716,
      2.506628277459239
    ];
    const b = [
      -54.47609879822406,
      161.5858368580409,
      -155.6989798598866,
      66.80131188771972,
      -13.28068155288572
    ];
    const c = [
      -0.007784894002430293,
      -0.3223964580411365,
      -2.400758277161838,
      -2.549732539343734,
      4.374664141464968,
      2.938163982698783
    ];
    const d = [
      0.007784695709041462,
      0.3224671290700398,
      2.445134137142996,
      3.754408661907416
    ];
    const pLow = 0.02425;
    let q, r;
    let x;
    if (p < pLow) {
      q = Math.sqrt(-2 * Math.log(p));
      x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else if (p <= 1 - pLow) {
      q = p - 0.5;
      r = q * q;
      x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    return x;
  }
  function phiPIII(pExceed, Cs) {
    if (!Number.isFinite(Cs)) throw new Error(`\u504F\u6001\u7CFB\u6570 Cs \u5FC5\u987B\u4E3A\u6709\u9650\u6570\uFF0C\u6536\u5230 ${Cs}`);
    if (!(pExceed > 0 && pExceed < 1)) throw new Error(`p \u5FC5\u987B\u5728 (0,1)\uFF0C\u6536\u5230 ${pExceed}`);
    if (Math.abs(Cs) < 1e-8) return norminv(1 - pExceed);
    if (Cs > 0) {
      const a = 4 / (Cs * Cs);
      const g = gammaQuantile(1 - pExceed, a);
      return Cs / 2 * (g - a);
    }
    return -phiPIII(1 - pExceed, -Cs);
  }

  // src/core/stats.ts
  function seriesStats(xs) {
    const n = xs.length;
    if (n < 3) throw new Error("\u7CFB\u5217\u957F\u5EA6\u81F3\u5C11 3\uFF08\u77E9\u6CD5 Cs \u9700\u8981 n\u22653\uFF09");
    if (!xs.every((v) => Number.isFinite(v) && v >= 0)) {
      throw new Error("\u5B9E\u6D4B\u7CFB\u5217\u5FC5\u987B\u4E3A\u6709\u9650\u975E\u8D1F\u6570");
    }
    const mean = xs.reduce((s, v) => s + v, 0) / n;
    if (!(mean > 0)) throw new Error("\u7CFB\u5217\u5747\u503C\u5FC5\u987B\u4E3A\u6B63\uFF0C\u65E0\u6CD5\u8BA1\u7B97\u7EDF\u8BA1\u53C2\u6570");
    const d = xs.map((v) => v - mean);
    const s2 = d.reduce((s, v) => s + v * v, 0) / (n - 1);
    const sigma = Math.sqrt(s2);
    if (sigma === 0) throw new Error("\u7CFB\u5217\u6052\u5B9A\uFF0C\u65E0\u6CD5\u8BA1\u7B97\u7EDF\u8BA1\u53C2\u6570");
    const m3 = d.reduce((s, v) => s + v * v * v, 0);
    const csMoment = n * m3 / ((n - 1) * (n - 2) * Math.pow(sigma, 3));
    return { n, mean, sigma, cv: sigma / mean, csMoment, kis: xs.map((v) => v / mean) };
  }
  function discontinuousStats(input) {
    const { historicalExtra, measuredDesc, l, N } = input;
    const n = measuredDesc.length;
    if (!Number.isInteger(N) || N < 3) {
      throw new Error(`\u8003\u8BC1\u671F N \u5FC5\u987B\u4E3A\u4E0D\u5C0F\u4E8E 3 \u7684\u6574\u6570\uFF0C\u6536\u5230 ${N}`);
    }
    if (![...historicalExtra, ...measuredDesc].every((v) => Number.isFinite(v) && v >= 0)) {
      throw new Error("\u7279\u5927\u6D2A\u6C34\u4E0E\u5B9E\u6D4B\u7CFB\u5217\u5FC5\u987B\u4E3A\u6709\u9650\u975E\u8D1F\u6570");
    }
    if (!Number.isInteger(l) || l < 0 || l > n) {
      throw new Error(`l \u5FC5\u987B\u662F 0..${n} \u7684\u6574\u6570\uFF08\u5B9E\u6D4B\u7CFB\u5217\u957F\u5EA6 ${n}\uFF09\uFF0C\u6536\u5230 ${l}`);
    }
    const inSeries = measuredDesc.slice(0, l);
    const all = [...historicalExtra, ...inSeries];
    const a = all.length;
    if (N <= a) throw new Error(`\u8003\u8BC1\u671F N(${N}) \u5FC5\u987B\u5927\u4E8E\u7279\u5927\u6D2A\u6C34\u603B\u9879\u6570 a(${a})`);
    const nGen = n - l;
    if (nGen === 0) throw new Error("\u5B9E\u6D4B\u7CFB\u5217\u4E0D\u80FD\u5168\u90E8\u4E3A\u7279\u5927\u6D2A\u6C34\uFF08n\u2212l = 0\uFF09");
    const w = (N - a) / nGen;
    const general = measuredDesc.slice(l);
    const sumJ = all.reduce((s, v) => s + v, 0);
    const sumI = general.reduce((s, v) => s + v, 0);
    const mean = (sumJ + w * sumI) / N;
    if (mean <= 0) throw new Error("\u5747\u503C\u975E\u6B63\uFF0C\u65E0\u6CD5\u8BA1\u7B97\u7EDF\u8BA1\u53C2\u6570");
    const sJ2 = all.reduce((s, v) => s + (v - mean) ** 2, 0);
    const sI2 = general.reduce((s, v) => s + (v - mean) ** 2, 0);
    const sigma = Math.sqrt((sJ2 + w * sI2) / (N - 1));
    if (sigma === 0) throw new Error("\u7CFB\u5217\u6052\u5B9A\uFF0C\u65E0\u6CD5\u8BA1\u7B97\u7EDF\u8BA1\u53C2\u6570");
    const cv = sigma / mean;
    const sJ3 = all.reduce((s, v) => s + (v - mean) ** 3, 0);
    const sI3 = general.reduce((s, v) => s + (v - mean) ** 3, 0);
    const cs = N * (sJ3 + w * sI3) / ((N - 1) * (N - 2) * mean ** 3 * cv ** 3);
    return { a, n, l, N, mean, sigma, cv, cs };
  }

  // src/core/bayes.ts
  function nelderMead(f, x0, opts = {}) {
    const n = x0.length;
    const maxIter = opts.maxIter ?? 2e3;
    const tol = opts.tol ?? 1e-9;
    const step = opts.step ?? x0.map((v, i) => Math.abs(v) < 1 ? 0.15 : 0.05 * Math.abs(v));
    const pts = [];
    pts.push({ x: [...x0], fx: f(x0) });
    for (let i = 0; i < n; i++) {
      const xi = [...x0];
      xi[i] += xi[i] === 0 ? 0.15 : step[i];
      pts.push({ x: xi, fx: f(xi) });
    }
    let iter = 0;
    for (; iter < maxIter; iter++) {
      pts.sort((a, b) => a.fx - b.fx);
      if (Math.abs(pts[n].fx - pts[0].fx) < tol * (Math.abs(pts[0].fx) + 1e-30)) break;
      const xbar = new Array(n).fill(0);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) xbar[i] += pts[j].x[i];
      for (let i = 0; i < n; i++) xbar[i] /= n;
      const worst = pts[n];
      const xr = xbar.map((v, i) => v + (v - worst.x[i]));
      const fr = f(xr);
      if (fr < pts[0].fx) {
        const xe = xbar.map((v, i) => v + 2 * (v - worst.x[i]));
        const fe = f(xe);
        if (fe < fr) pts[n] = { x: xe, fx: fe };
        else pts[n] = { x: xr, fx: fr };
      } else if (fr < pts[n - 1].fx) {
        pts[n] = { x: xr, fx: fr };
      } else {
        const xc = xbar.map((v, i) => v + 0.5 * (worst.x[i] - v));
        const fc = f(xc);
        if (fc < pts[n].fx) {
          pts[n] = { x: xc, fx: fc };
        } else {
          for (let i = 1; i <= n; i++) {
            pts[i].x = pts[i].x.map((v, j) => pts[0].x[j] + 0.5 * (v - pts[0].x[j]));
            pts[i].fx = f(pts[i].x);
          }
        }
      }
    }
    pts.sort((a, b) => a.fx - b.fx);
    return { x: pts[0].x, fx: pts[0].fx, iterations: iter, converged: iter < maxIter };
  }
  var BAD = -1e100;
  function logL_P3(theta, xs) {
    const a0 = theta[0], beta = Math.exp(theta[1]), alpha = Math.exp(theta[2]);
    let s = 0;
    for (const x of xs) {
      if (x <= a0) return BAD;
      s += (alpha - 1) * Math.log(x - a0) - beta * (x - a0);
    }
    return xs.length * (alpha * Math.log(beta) - gammaln(alpha)) + s;
  }
  function logL_GEV(theta, xs) {
    const mu = theta[0], sigma = Math.exp(theta[1]), xi = theta[2];
    let s = -xs.length * Math.log(sigma);
    if (Math.abs(xi) < 1e-8) {
      for (const x of xs) {
        const z = (x - mu) / sigma;
        s += -z - Math.exp(-z);
      }
      return s;
    }
    for (const x of xs) {
      const u = 1 + xi * (x - mu) / sigma;
      if (u <= 0) return BAD;
      const lnT = -Math.log(u) / xi;
      s += (1 + xi) * lnT - Math.exp(lnT);
    }
    return s;
  }
  function logL_Gumbel(theta, xs) {
    const mu = theta[0], sigma = Math.exp(theta[1]);
    let s = -xs.length * Math.log(sigma);
    for (const x of xs) {
      const z = (x - mu) / sigma;
      s += -z - Math.exp(-z);
    }
    return s;
  }
  function fitOne(name, k, logL, starts, xs, pretty) {
    let best = null;
    for (const st of starts) {
      const r = nelderMead((t) => -logL(t, xs), st);
      if (!best || r.fx < best.fx) best = r;
    }
    const logL_val = -best.fx;
    const n = xs.length;
    return {
      name,
      k,
      logL: logL_val,
      aic: 2 * k - 2 * logL_val,
      bic: k * Math.log(n) - 2 * logL_val,
      params: best.x,
      paramsPretty: pretty(best.x)
    };
  }
  function qFromP3(t, p, gammaQ) {
    const a0 = t[0], beta = Math.exp(t[1]), alpha = Math.exp(t[2]);
    return a0 + gammaQ(1 - p, alpha) / beta;
  }
  function qFromGEV(t, p) {
    const mu = t[0], sigma = Math.exp(t[1]), xi = t[2];
    const T = -Math.log(1 - p);
    if (Math.abs(xi) < 1e-8) return mu - sigma * Math.log(T);
    return mu + sigma / xi * (Math.pow(T, -xi) - 1);
  }
  function qFromGumbel(t, p) {
    const mu = t[0], sigma = Math.exp(t[1]);
    return mu - sigma * Math.log(-Math.log(1 - p));
  }
  function compareLineages(xs) {
    const n = xs.length;
    if (n < 5) throw new Error("\u7EBF\u578B\u6BD4\u9009\u81F3\u5C11\u9700\u8981 5 \u4E2A\u6570\u636E\u70B9");
    const sorted = [...xs].sort((a, b) => a - b);
    const mean = xs.reduce((s, v) => s + v, 0) / n;
    const sd = Math.sqrt(xs.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1));
    const min = sorted[0], max = sorted[n - 1];
    const span = Math.max(max - min, 1e-9);
    const csM = (() => {
      const m3 = xs.reduce((s, v) => s + (v - mean) ** 3, 0) / n;
      return m3 / sd ** 3;
    })();
    const a0est = Math.min(mean - 2 * sd, min - 0.1 * span);
    const alphaEst = Math.min(Math.max(4 / Math.max(csM * csM, 0.04), 1.5), 5e3);
    const betaEst = alphaEst / Math.max(mean - a0est, 1e-9);
    const p3Starts = [
      [a0est, Math.log(betaEst), Math.log(alphaEst)],
      [min - 0.5 * span, Math.log(1 / sd), Math.log(4)]
    ];
    const gevStarts = [
      [mean - 0.3 * sd, Math.log(0.7 * sd), 0.1],
      [mean - 0.3 * sd, Math.log(0.7 * sd), -0.1]
    ];
    const guStarts = [[mean - 0.45 * sd, Math.log(0.78 * sd)]];
    const fits = [
      fitOne("P3", 3, logL_P3, p3Starts, xs, (t) => ({ a0: t[0], beta: Math.exp(t[1]), alpha: Math.exp(t[2]) })),
      fitOne("GEV", 3, logL_GEV, gevStarts, xs, (t) => ({ mu: t[0], sigma: Math.exp(t[1]), xi: t[2] })),
      fitOne("Gumbel", 2, logL_Gumbel, guStarts, xs, (t) => ({ mu: t[0], sigma: Math.exp(t[1]) }))
    ];
    const minBic = Math.min(...fits.map((f) => f.bic));
    const exps = fits.map((f) => Math.exp(-(f.bic - minBic) / 2));
    const sumExp = exps.reduce((s, v) => s + v, 0);
    const weights = {};
    fits.forEach((f, i) => weights[f.name] = exps[i] / sumExp);
    const q1p = {};
    for (const f of fits) {
      if (f.name === "P3") q1p.P3 = qFromP3(f.params, 0.01, gammaQuantile);
      else if (f.name === "GEV") q1p.GEV = qFromGEV(f.params, 0.01);
      else q1p.Gumbel = qFromGumbel(f.params, 0.01);
    }
    const best = fits.reduce((a, b) => weights[a.name] >= weights[b.name] ? a : b).name;
    return { fits, weights, best, q1p };
  }

  // src/core/methodB.ts
  function manningQ(s) {
    const { Ac, Bc, nc, At, Bt, nt, I } = s;
    if (![Ac, Bc, nc, At, Bt, nt, I, s.Rc ?? 0, s.Rt ?? 0].every(Number.isFinite)) {
      throw new Error("\u66FC\u5B81\u516C\u5F0F\u8F93\u5165\u5FC5\u987B\u4E3A\u6709\u9650\u6570");
    }
    if (I <= 0) throw new Error("\u6C34\u9762\u6BD4\u964D\u5FC5\u987B\u4E3A\u6B63");
    if (Ac <= 0) throw new Error("\u6CB3\u69FD\u8FC7\u6C34\u9762\u79EF\u5FC5\u987B\u4E3A\u6B63");
    if (nc <= 0) throw new Error("\u6CB3\u69FD\u7CD9\u7387\u5FC5\u987B\u4E3A\u6B63");
    if (At < 0) throw new Error("\u6CB3\u6EE9\u8FC7\u6C34\u9762\u79EF\u4E0D\u80FD\u4E3A\u8D1F");
    if (At > 0 && nt <= 0) throw new Error("\u6CB3\u6EE9\u7CD9\u7387\u5FC5\u987B\u4E3A\u6B63");
    const Rc = s.Rc ?? (Bc > 0 ? Ac / Bc : NaN);
    const Rt = At > 0 ? s.Rt ?? (Bt > 0 ? At / Bt : NaN) : 0;
    if (!Number.isFinite(Rc) || Rc <= 0) throw new Error("\u6CB3\u69FD\u6C34\u529B\u534A\u5F84\u65E0\u6548\uFF08Rc=A/B \u9700\u6C34\u9762\u5BBD Bc>0\uFF0C\u6216\u76F4\u63A5\u7ED9\u5B9A Rc\uFF09");
    if (At > 0 && (!Number.isFinite(Rt) || Rt <= 0)) throw new Error("\u6CB3\u6EE9\u6C34\u529B\u534A\u5F84\u65E0\u6548");
    const sq = Math.sqrt(I);
    const vc = Rc ** (2 / 3) * sq / nc;
    const vt = At > 0 ? Rt ** (2 / 3) * sq / nt : 0;
    const Qc = Ac * vc;
    const Qt = At * vt;
    return { Rc, Rt, vc, vt, Qc, Qt, Q: Qc + Qt };
  }
  function designFromHistory(floods, params, pExceed, phiFn) {
    if (floods.length < 2) throw new Error("\u5229\u7528\u5386\u53F2\u6D2A\u6C34\u63A8\u7B97\u8BBE\u8BA1\u6D41\u91CF\uFF0C\u5386\u53F2\u6D2A\u6C34\u6D41\u91CF\u4E0D\u5B9C\u5C11\u4E8E 2 \u6B21\uFF08\u89C4\u8303 6.3.3\uFF09");
    if (!(pExceed > 0 && pExceed < 1)) throw new Error(`\u8BBE\u8BA1\u9891\u7387\u5FC5\u987B\u5728 (0,1)\uFF0C\u6536\u5230 ${pExceed}`);
    if (!Number.isFinite(params.cv) || !Number.isFinite(params.cs)) throw new Error("\u5730\u533A\u53C2\u6570 Cv\u3001Cs \u5FC5\u987B\u4E3A\u6709\u9650\u6570");
    if (params.cv <= 0) throw new Error("\u5730\u533A\u53D8\u5DEE\u7CFB\u6570 Cv \u5FC5\u987B\u4E3A\u6B63");
    const qBars = floods.map((f) => {
      if (!Number.isFinite(f.Q) || !Number.isFinite(f.T)) throw new Error("\u5386\u53F2\u6D2A\u6C34\u6D41\u91CF\u4E0E\u91CD\u73B0\u671F\u5FC5\u987B\u4E3A\u6709\u9650\u6570");
      if (f.Q <= 0 || f.T < 1) throw new Error("\u5386\u53F2\u6D2A\u6C34\u6D41\u91CF\u4E0E\u91CD\u73B0\u671F\uFF08\u5E74\uFF09\u5FC5\u987B\u4E3A\u6B63");
      const phiT = phiFn(1 / f.T, params.cs);
      const denom = 1 + phiT * params.cv;
      if (denom <= 0) throw new Error(`\u7B2C ${f.T} \u5E74\u4E00\u9047\u6D2A\u6C34\uFF1A1+\u03A6T\xB7Cv \u2264 0\uFF0C\u53C2\u6570\u4E0D\u5408\u7406`);
      return f.Q / denom;
    });
    const mean = qBars.reduce((s, v) => s + v, 0) / qBars.length;
    const phi = phiFn(pExceed, params.cs);
    const kp = 1 + phi * params.cv;
    return { qBars, mean, phi, kp, q: mean * kp };
  }

  // src/core/methodC.ts
  function rationalFormula(p) {
    if (![p.Sp, p.n, p.psi, p.tau, p.F].every(Number.isFinite)) throw new Error("\u63A8\u7406\u516C\u5F0F\u8F93\u5165\u5FC5\u987B\u4E3A\u6709\u9650\u6570");
    if (p.F <= 0) throw new Error("\u6C47\u6C34\u9762\u79EF F \u5FC5\u987B\u4E3A\u6B63\uFF08km\xB2\uFF09");
    if (p.tau <= 0) throw new Error("\u6C47\u6D41\u65F6\u95F4 \u03C4 \u5FC5\u987B\u4E3A\u6B63\uFF08h\uFF09");
    if (p.Sp <= 0) throw new Error("\u96E8\u529B Sp \u5FC5\u987B\u4E3A\u6B63\uFF08mm/h\uFF09");
    if (p.n < 0) throw new Error("\u66B4\u96E8\u8870\u51CF\u6307\u6570 n \u4E0D\u80FD\u4E3A\u8D1F");
    if (p.psi <= 0 || p.psi > 1) throw new Error("\u6D2A\u5CF0\u5F84\u6D41\u7CFB\u6570 \u03C8 \u5E94\u5728 (0,1]");
    if (p.F >= 100) throw new Error("\u63A8\u7406\u516C\u5F0F\u9002\u7528\u4E8E\u6C47\u6C34\u9762\u79EF <100 km\xB2\uFF08\u89C4\u8303 6.4.2\uFF09\uFF0C\u5F53\u524D " + p.F + " km\xB2");
    return 0.278 * p.psi * (p.Sp / Math.pow(p.tau, p.n)) * p.F;
  }
  function runoffDepthFormula(p) {
    if (![p.psi, p.h, p.z, p.F, p.beta, p.gamma, p.delta].every(Number.isFinite)) throw new Error("\u5F84\u6D41\u539A\u5EA6\u6CD5\u8F93\u5165\u5FC5\u987B\u4E3A\u6709\u9650\u6570");
    if (p.F <= 0) throw new Error("\u6C47\u6C34\u9762\u79EF F \u5FC5\u987B\u4E3A\u6B63\uFF08km\xB2\uFF09");
    if (p.h - p.z <= 0) throw new Error("\u5F84\u6D41\u539A\u5EA6 h \u5FC5\u987B\u5927\u4E8E\u6EDE\u7559\u539A\u5EA6 z");
    if (p.psi <= 0) throw new Error("\u5730\u8C8C\u7CFB\u6570 \u03C8 \u5FC5\u987B\u4E3A\u6B63");
    if (p.beta <= 0 || p.beta > 1 || p.gamma <= 0 || p.gamma > 1 || p.delta <= 0 || p.delta > 1) {
      throw new Error("\u6298\u51CF\u7CFB\u6570 \u03B2\u3001\u03B3\u3001\u03B4 \u5747\u5E94\u5728 (0,1]");
    }
    return p.psi * Math.pow(p.h - p.z, 3 / 2) * Math.pow(p.F, 4 / 5) * p.beta * p.gamma * p.delta;
  }

  // src/web/main.ts
  var state = {
    mode: "series",
    series: [],
    stats: null,
    params: { mean: 1065, cv: 0.3, cs: 0.6 },
    freq: 0.01,
    pts: []
  };
  var $ = (id) => {
    const el = document.getElementById(id);
    if (!el) throw new Error(`\u754C\u9762\u5143\u7D20\u4E0D\u5B58\u5728\uFF1A${id}`);
    return el;
  };
  var fmt = (v, d = 2) => Number(v).toLocaleString("zh-CN", { maximumFractionDigits: d, minimumFractionDigits: d });
  var XTICKS = [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 80, 90, 95, 99, 99.9];
  var XMIN = norminv(1 - 0.999);
  var XMAX = norminv(1 - 1e-4);
  var PL = 66;
  var PR = 906;
  var PT = 26;
  var PB = 478;
  var sx = (x) => PL + (XMAX - x) / (XMAX - XMIN) * (PR - PL);
  var pToX = (p) => sx(norminv(1 - p));
  function niceTicks(lo, hi, n = 5) {
    const span = hi - lo, step0 = span / n;
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const norm = step0 / mag, step = (norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10) * mag;
    const t0 = Math.ceil(lo / step) * step, out = [];
    for (let v = t0; v <= hi + 1e-9; v += step) out.push(v);
    return out;
  }
  function render() {
    const { params, freq } = state;
    $("cvShow").textContent = params.cv.toFixed(3);
    $("csShow").textContent = params.cs.toFixed(2);
    $("ratioShow").textContent = (params.cs / params.cv).toFixed(1);
    const phi = phiPIII(freq, params.cs), kp = 1 + phi * params.cv, q = params.mean * kp;
    $("outQ").textContent = fmt(q, 0);
    $("outPhi").textContent = phi.toFixed(3);
    $("outKp").textContent = kp.toFixed(3);
    const pts = state.pts;
    if (pts.length) {
      let sse = 0;
      for (const pt of pts) sse += Math.pow(pt.q - params.mean * (1 + phiPIII(pt.p, params.cs) * params.cv), 2);
      $("stSse").textContent = fmt(sse, 0);
    } else {
      $("stSse").textContent = "\u2014";
    }
    const normCdf = (t) => {
      const P = gammaincLower(0.5, t * t / 2);
      return t >= 0 ? 0.5 * (1 + P) : 0.5 * (1 - P);
    };
    const curvePts = [];
    const NSAMP = 241;
    for (let i = 0; i < NSAMP; i++) {
      const t = XMAX - i * (XMAX - XMIN) / (NSAMP - 1);
      const p = 1 - normCdf(t);
      curvePts.push({ x: sx(t), q: params.mean * (1 + phiPIII(p, params.cs) * params.cv) });
    }
    const dataMax = Math.max(...pts.map((pt) => pt.q), ...curvePts.map((pt) => pt.q));
    const dataMin = Math.min(...pts.map((pt) => pt.q), ...curvePts.map((pt) => pt.q), 0);
    const qLo = Math.max(0, dataMin - (dataMax - dataMin) * 0.08);
    const qHi = dataMax + (dataMax - dataMin) * 0.06;
    const sy2 = (q2) => PB - (q2 - qLo) / (qHi - qLo) * (PB - PT);
    let s = "";
    s += `<rect x="${PL}" y="${PT}" width="${PR - PL}" height="${PB - PT}" fill="#fdfdfd" stroke="rgba(0,0,0,0.10)" stroke-width="1"/>`;
    for (const t of niceTicks(qLo, qHi, 5)) {
      const y = sy2(t);
      s += `<line x1="${PL}" y1="${y}" x2="${PR}" y2="${y}" stroke="rgba(0,0,0,0.06)"/>`;
      s += `<text x="${PL - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6e6e73">${fmt(t, 0)}</text>`;
    }
    for (const p of XTICKS) {
      const x = pToX(p / 100);
      s += `<line x1="${x}" y1="${PT}" x2="${x}" y2="${PB}" stroke="rgba(0,0,0,0.06)"/>`;
      s += `<text x="${x}" y="${PB + 18}" text-anchor="middle" font-size="11" fill="#6e6e73">${p < 1 ? p : p}</text>`;
    }
    s += `<text x="${(PL + PR) / 2}" y="${PB + 40}" text-anchor="middle" font-size="12" fill="#1d1d1f">\u9891\u7387 P\uFF08%\uFF09\u2014 \u6D77\u68EE\u673A\u7387\u683C\u7EB8</text>`;
    s += `<text x="20" y="${(PT + PB) / 2}" font-size="12" fill="#1d1d1f" transform="rotate(-90 20 ${(PT + PB) / 2})" text-anchor="middle">\u6D41\u91CF Q\uFF08m\xB3/s\uFF09</text>`;
    const fx = pToX(freq);
    s += `<line x1="${fx}" y1="${PT}" x2="${fx}" y2="${PB}" stroke="#007AFF" stroke-width="1" stroke-dasharray="5 4" opacity="0.55"/>`;
    let path = "";
    for (let i = 0; i < curvePts.length; i++) {
      const c = curvePts[i];
      if (c.q > qHi || c.q < qLo) continue;
      path += (path ? "L" : "M") + c.x.toFixed(1) + " " + sy2(c.q).toFixed(1);
    }
    s += `<path d="${path}" fill="none" stroke="#007AFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<circle cx="${fx}" cy="${sy2(q)}" r="6" fill="#fff" stroke="#007AFF" stroke-width="2.5"/>`;
    s += `<text x="${Math.min(fx + 10, PR - 120)}" y="${sy2(q) - 10}" font-size="12" fill="#007AFF" font-weight="600">Q${(freq * 100).toFixed(2).replace(/\.?0+$/, "")}% = ${fmt(q, 0)}</text>`;
    for (const pt of pts) {
      if (pt.kind === "hist") {
        s += `<circle cx="${pToX(pt.p)}" cy="${sy2(pt.q)}" r="5.5" fill="#ff3b30"/>`;
      } else {
        s += `<circle cx="${pToX(pt.p)}" cy="${sy2(pt.q)}" r="4" fill="#1d1d1f"/>`;
      }
    }
    $("chart").innerHTML = s;
  }
  function calcFromSeries() {
    const raw = $("series").value.split(/[\s,，;；]+/).filter(Boolean);
    const xs = raw.map(Number).filter((v) => Number.isFinite(v) && v > 0);
    const errBox = $("parseErr");
    if (xs.length < 3) {
      errBox.style.display = "block";
      errBox.textContent = "\u81F3\u5C11\u9700\u8981 3 \u4E2A\u6709\u6548\u6D41\u91CF\u503C\uFF08\u5F53\u524D " + xs.length + " \u4E2A\uFF09\u3002\u89C4\u8303\u5EFA\u8BAE\u5B9E\u6D4B\u7CFB\u5217\u4E0D\u5B9C\u5C11\u4E8E 30 \u5E74\u3002";
      return;
    }
    errBox.style.display = "none";
    state.series = xs;
    const sorted = [...xs].sort((a, b) => b - a);
    const n = sorted.length;
    let st;
    let pts;
    if ($("hasExtra").checked) {
      try {
        const N = Math.round(+$("inN").value);
        const l = Math.round(+$("inL").value);
        const extra = $("extraSeries").value.split(/[\s,，;；]+/).filter(Boolean).map(Number).filter((v) => Number.isFinite(v) && v > 0);
        st = discontinuousStats({ historicalExtra: extra, measuredDesc: sorted, l, N });
        const a = st.a;
        const all = [...extra, ...sorted.slice(0, l)].sort((x, y) => y - x);
        pts = all.map((q, i) => ({ p: (i + 1) / (N + 1), q, kind: "hist" }));
        const pA = a / (N + 1);
        for (let m = l + 1; m <= n; m++) {
          pts.push({ p: pA + (1 - pA) * (m - l) / (n - l + 1), q: sorted[m - 1], kind: "meas" });
        }
        $("stN").textContent = `n=${n}\uFF0Ca=${a}\uFF0Cl=${l}\uFF0CN=${N}`;
      } catch (e) {
        errBox.style.display = "block";
        errBox.textContent = "\u7279\u5927\u6D2A\u6C34\u8F93\u5165\u6709\u8BEF\uFF1A" + (e instanceof Error ? e.message : String(e));
        return;
      }
    } else {
      st = seriesStats(xs);
      pts = sorted.map((q, i) => ({ p: (i + 1) / (n + 1), q, kind: "meas" }));
      $("stN").textContent = st.n;
    }
    state.stats = st;
    state.pts = pts;
    $("cvSlider").value = Math.min(Math.max(st.cv, 0.05), 1.2);
    $("ratioSlider").value = 2;
    state.params = { mean: st.mean, cv: st.cv, cs: 2 * st.cv };
    syncParamInputs();
    $("stMean").textContent = fmt(st.mean, 1);
    $("stSigma").textContent = fmt(st.sigma, 1);
    $("stCv").textContent = st.cv.toFixed(3);
    $("stCs").textContent = ("csMoment" in st ? st.csMoment : st.cs).toFixed(2);
    render();
  }
  function syncParamInputs() {
    $("inMean").value = state.params.mean.toFixed(1);
    $("inCv").value = state.params.cv.toFixed(3);
    $("inCs").value = state.params.cs.toFixed(2);
    if ($("meanIn")) $("meanIn").value = state.params.mean.toFixed(1);
    if ($("cvIn")) $("cvIn").value = state.params.cv.toFixed(3);
    if ($("ratioIn")) $("ratioIn").value = (state.params.cs / state.params.cv).toFixed(2);
  }
  $("btnCalc").onclick = calcFromSeries;
  $("cvSlider").oninput = (e) => {
    const cv = +e.target.value;
    const ratio = +$("ratioSlider").value;
    state.params = { ...state.params, cv, cs: cv * ratio };
    syncParamInputs();
    render();
  };
  $("ratioSlider").oninput = (e) => {
    const ratio = +e.target.value;
    state.params = { ...state.params, cs: state.params.cv * ratio };
    syncParamInputs();
    render();
  };
  $("cvIn").oninput = (e) => {
    let cv = parseFloat(e.target.value);
    if (!Number.isFinite(cv) || cv <= 0) return;
    cv = Math.min(1.2, Math.max(0.05, cv));
    const ratio = +$("ratioSlider").value;
    state.params = { ...state.params, cv, cs: cv * ratio };
    $("cvSlider").value = cv;
    render();
  };
  $("ratioIn").oninput = (e) => {
    let ratio = parseFloat(e.target.value);
    if (!Number.isFinite(ratio) || ratio < 1) return;
    ratio = Math.min(8, Math.max(1, ratio));
    state.params = { ...state.params, cs: state.params.cv * ratio };
    $("ratioSlider").value = ratio;
    render();
  };
  $("meanIn").oninput = (e) => {
    const mean = parseFloat(e.target.value);
    if (Number.isFinite(mean) && mean > 0) {
      state.params = { ...state.params, mean };
      render();
    }
  };
  $("freqSel").onchange = (e) => {
    state.freq = +e.target.value;
    render();
  };
  ["inMean", "inCv", "inCs"].forEach((id) => {
    $(id).oninput = () => {
      const mean = +$("inMean").value, cv = +$("inCv").value, cs = +$("inCs").value;
      if (mean > 0 && cv > 0 && Number.isFinite(cs)) {
        state.params = { mean, cv, cs };
        $("cvSlider").value = Math.min(Math.max(cv, 0.05), 1.2);
        render();
      }
    };
  });
  $("mSeries").onclick = () => {
    state.mode = "series";
    $("mSeries").classList.add("on");
    $("mParams").classList.remove("on");
    $("mHist").classList.remove("on");
    $("mNoData").classList.remove("on");
    $("seriesBox").style.display = "";
    $("paramsBox").style.display = "none";
    $("histBox").style.display = "none";
    $("noDataBox").style.display = "none";
    setFitCardsVisible(true);
  };
  $("mParams").onclick = () => {
    state.mode = "params";
    $("mParams").classList.add("on");
    $("mSeries").classList.remove("on");
    $("mHist").classList.remove("on");
    $("mNoData").classList.remove("on");
    $("seriesBox").style.display = "none";
    $("paramsBox").style.display = "";
    $("histBox").style.display = "none";
    $("noDataBox").style.display = "none";
    syncParamInputs();
    setFitCardsVisible(true);
    render();
  };
  $("mHist").onclick = () => {
    state.mode = "histB";
    $("mHist").classList.add("on");
    $("mSeries").classList.remove("on");
    $("mParams").classList.remove("on");
    $("mNoData").classList.remove("on");
    $("seriesBox").style.display = "none";
    $("paramsBox").style.display = "none";
    $("histBox").style.display = "";
    $("noDataBox").style.display = "none";
    setFitCardsVisible(false);
  };
  $("mNoData").onclick = () => {
    state.mode = "noData";
    $("mNoData").classList.add("on");
    $("mSeries").classList.remove("on");
    $("mParams").classList.remove("on");
    $("mHist").classList.remove("on");
    $("seriesBox").style.display = "none";
    $("paramsBox").style.display = "none";
    $("histBox").style.display = "none";
    $("noDataBox").style.display = "";
    setFitCardsVisible(false);
    calcMethodC();
  };
  function setFitCardsVisible(v) {
    for (const sel of ["#chartCard", "#fitCard", "#bayesCard", "#statsGrid"]) {
      const el = document.querySelector(sel);
      if (el) el.style.display = v ? "" : "none";
    }
  }
  $("btnT3").onclick = () => {
    $("mParams").click();
    $("inMean").value = "5173.6";
    $("inCv").value = "0.331";
    $("inCs").value = "1.99";
    state.params = { mean: 5173.6, cv: 0.331, cs: 1.99 };
    $("cvSlider").value = 0.331;
    render();
  };
  $("hasExtra").onchange = (e) => {
    $("extraBox").style.display = e.target.checked ? "" : "none";
  };
  if (new URLSearchParams(location.search).get("extra") === "1") {
    $("hasExtra").checked = true;
    $("extraBox").style.display = "";
  }
  var BAYES_CSS = `
  .brow { display: grid; grid-template-columns: 92px 1fr 120px 90px; gap: 10px; align-items: center; margin: 8px 0; font-size: 13px; }
  .bbar-outer { height: 10px; background: rgba(120,120,128,0.12); border-radius: 5px; overflow: hidden; }
  .bbar-inner { height: 100%; background: var(--blue); border-radius: 5px; transition: width .5s ease; }
  .bw { font-variant-numeric: tabular-nums; font-weight: 500; text-align: right; }
  .bq { font-variant-numeric: tabular-nums; color: var(--text2); text-align: right; }
`;
  (function injectBayesCss() {
    const st = document.createElement("style");
    st.textContent = BAYES_CSS;
    document.head.appendChild(st);
  })();
  function runBayesCompare() {
    const xs = state.series;
    if (!xs || xs.length < 5) {
      alert("\u7EBF\u578B\u6BD4\u9009\u81F3\u5C11\u9700\u8981 5 \u4E2A\u5B9E\u6D4B\u6D41\u91CF\u503C\uFF0C\u8BF7\u5148\u8BA1\u7B97\u5E76\u9002\u7EBF\u3002");
      return;
    }
    try {
      const result = compareLineages(xs);
      const labels = {
        P3: "P-\u2162\uFF08\u89C4\u8303\u91C7\u7528\uFF09",
        GEV: "GEV",
        Gumbel: "Gumbel"
      };
      $("bayesResult").style.display = "";
      $("bayesBars").innerHTML = result.fits.map((f) => `
      <div class="brow">
        <span>${labels[f.name]}</span>
        <div class="bbar-outer"><div class="bbar-inner" style="width:${(result.weights[f.name] * 100).toFixed(1)}%"></div></div>
        <span class="bw">${(result.weights[f.name] * 100).toFixed(1)}%</span>
        <span class="bq">Q\u2081%=${fmt(result.q1p[f.name], 0)}</span>
      </div>`).join("");
      $("bqP3").textContent = fmt(result.q1p.P3, 0);
      $("bqGEV").textContent = fmt(result.q1p.GEV, 0);
      $("bqGu").textContent = fmt(result.q1p.Gumbel, 0);
    } catch (e) {
      alert("\u7EBF\u578B\u6BD4\u9009\u5931\u8D25\uFF1A" + (e instanceof Error ? e.message : String(e)));
    }
  }
  $("btnBayes").onclick = runBayesCompare;
  var HIST_FIELDS = [
    ["Ac", "\u6CB3\u69FD\u9762\u79EF A\uA700\uFF08m\xB2\uFF09"],
    ["Bc", "\u6CB3\u69FD\u6C34\u9762\u5BBD B\uA700\uFF08m\uFF09"],
    ["nc", "\u6CB3\u69FD\u7CD9\u7387 n\uA700"],
    ["At", "\u6CB3\u6EE9\u9762\u79EF A\u209C\uFF08m\xB2\uFF09"],
    ["Bt", "\u6CB3\u6EE9\u6C34\u9762\u5BBD B\u209C\uFF08m\uFF09"],
    ["nt", "\u6CB3\u6EE9\u7CD9\u7387 n\u209C"],
    ["Ipermil", "\u6BD4\u964D I\uFF08\u2030\uFF09"],
    ["T", "\u91CD\u73B0\u671F T\uFF08\u5E74\uFF09"]
  ];
  (function buildHistRows() {
    const defaults = [
      { Ac: 500, Bc: 100, nc: 0.03, At: 200, Bt: 200, nt: 0.05, Ipermil: 0.5, T: 100 },
      { Ac: 400, Bc: 95, nc: 0.03, At: 150, Bt: 180, nt: 0.05, Ipermil: 0.5, T: 50 }
    ];
    $("histRows").innerHTML = [0, 1].map((i) => `
    <div style="margin:12px 0;padding:12px 14px;background:var(--bg);border-radius:10px">
      <div style="font-size:13px;font-weight:500;margin-bottom:6px">\u7B2C ${i + 1} \u6B21\u5386\u53F2\u6D2A\u6C34</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        ${HIST_FIELDS.map(([k, label]) => `<div><label style="margin-top:0">${label}</label><input type="number" step="any" id="hf${i}${k}" value="${defaults[i][k]}"></div>`).join("")}
      </div>
    </div>`).join("");
  })();
  function calcMethodB() {
    const floods = [0, 1].map((i) => {
      const g = (k) => +$(`hf${i}${k}`).value;
      const s = { Ac: g("Ac"), Bc: g("Bc"), nc: g("nc"), At: g("At"), Bt: g("Bt"), nt: g("nt"), I: g("Ipermil") / 1e3 };
      const m = manningQ(s);
      return { Q: m.Q, T: g("T"), vc: m.vc, vt: m.vt };
    });
    const cv = +$("hbCv").value, cs = +$("hbCs").value;
    try {
      const res = designFromHistory(floods, { cv, cs }, state.freq, phiPIII);
      $("histResult").style.display = "";
      $("histResult").innerHTML = `
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr style="color:var(--text2)"><th style="text-align:left;padding:4px">\u6D2A\u6C34</th><th>Q\u1D40\uFF08m\xB3/s\uFF09</th><th>v\uA700\uFF08m/s\uFF09</th><th>Q\u0304\u1D1B\u1D62</th></tr>
        ${floods.map((f, i) => `<tr><td style="padding:4px">\u7B2C${i + 1}\u6B21\uFF08T=${f.T} \u5E74\uFF09</td>
          <td style="text-align:right">${f.Q.toFixed(1)}</td><td style="text-align:right">${f.vc.toFixed(3)}</td>
          <td style="text-align:right">${res.qBars[i].toFixed(1)}</td></tr>`).join("")}
      </table>
      <div class="metrics" style="margin-top:12px">
        <div class="metric"><div class="k">\u5E73\u5747\u6D41\u91CF Q\u0304</div><div class="v">${res.mean.toFixed(1)}</div></div>
        <div class="metric"><div class="k">\u03A6<sub>p</sub> / K<sub>p</sub></div><div class="v">${res.phi.toFixed(3)} / ${res.kp.toFixed(3)}</div></div>
        <div class="metric hl"><div class="k">\u8BBE\u8BA1\u6D41\u91CF Q<sub>p</sub>\uFF08m\xB3/s\uFF09</div><div class="v">${res.q.toFixed(1)}</div></div>
      </div>`;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      $("histResult").style.display = "";
      $("histResult").innerHTML = `<div class="err" style="display:block">${msg}</div>`;
    }
  }
  $("btnHist").onclick = calcMethodB;
  document.querySelectorAll("#nTable .fillBtn").forEach((item) => {
    const btn = item;
    btn.onclick = () => {
      $(`hf${btn.dataset.r}${btn.dataset.k}`).value = btn.dataset.n;
    };
  });
  function calcMethodC() {
    const v = (id) => +$(id).value;
    try {
      const Sp = v("rcSp"), n = v("rcN"), psi = v("rcPsi"), tau = v("rcTau"), F = v("rcF");
      const q = rationalFormula({ Sp, n, psi, tau, F });
      $("rcOut").textContent = q.toFixed(2);
      $("rcOut").removeAttribute("title");
    } catch (e) {
      $("rcOut").textContent = "\u2014";
      $("rcOut").title = e instanceof Error ? e.message : String(e);
    }
    try {
      const phi = v("rdPhi"), h = v("rdH"), z = v("rdZ"), F2 = v("rdF"), b = v("rdBeta"), g = v("rdGamma"), d = v("rdDelta");
      $("rdH").classList.remove("invalid");
      $("rdZ").classList.remove("invalid");
      const q = runoffDepthFormula({ psi: phi, h, z, F: F2, beta: b, gamma: g, delta: d });
      $("rdOut").textContent = q.toFixed(2);
      $("rdOut").removeAttribute("title");
    } catch (e) {
      $("rdOut").textContent = "\u2014";
      $("rdOut").title = e instanceof Error ? e.message : String(e);
    }
    document.querySelectorAll("#rdTables .fillBtn").forEach((item) => {
      const btn = item;
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.onclick = () => {
        const d = btn.dataset;
        if (d.psi) $("rdPhi").value = d.psi;
        if (d.h) $("rdH").value = d.h;
        if (d.z) $("rdZ").value = d.z;
        if (d.beta) $("rdBeta").value = d.beta;
        if (d.gamma) $("rdGamma").value = d.gamma;
        if (d.delta) $("rdDelta").value = d.delta;
        calcMethodC();
      };
    });
  }
  ["rcSp", "rcN", "rcPsi", "rcTau", "rcF", "rdPhi", "rdH", "rdZ", "rdF", "rdBeta", "rdGamma", "rdDelta"].forEach((id) => {
    $(id).oninput = calcMethodC;
  });
  function svgToPngDataUrl() {
    return new Promise((resolve, reject) => {
      try {
        const svg = $("chart");
        const xml = new XMLSerializer().serializeToString(svg);
        const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml" }));
        const img = new Image();
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = 940 * 2;
          c.height = 520 * 2;
          const ctx = c.getContext("2d");
          if (!ctx) {
            URL.revokeObjectURL(url);
            reject(new Error("\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301 Canvas 2D \u4E0A\u4E0B\u6587\uFF0C\u65E0\u6CD5\u5BFC\u51FA\u9002\u7EBF\u56FE"));
            return;
          }
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          resolve(c.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = url;
      } catch (e) {
        reject(e);
      }
    });
  }
  function downloadBlob(blob, fileName) {
    const legacyNavigator = window.navigator;
    if (legacyNavigator.msSaveOrOpenBlob) {
      legacyNavigator.msSaveOrOpenBlob(blob, fileName);
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 3e4);
  }
  function buildReportDocx() {
    const D = window.docx;
    if (!D) {
      alert("docx \u5E93\u672A\u52A0\u8F7D\uFF08web/libs/docx.umd.js\uFF09");
      return;
    }
    const p = state.params, freq = state.freq;
    const phi = phiPIII(freq, p.cs), kp = 1 + phi * p.cv, q = p.mean * kp;
    const st = state.stats ? {
      n: state.stats.n,
      mean: state.stats.mean,
      cv: state.stats.cv,
      cs: "cs" in state.stats ? state.stats.cs : state.stats.csMoment
    } : { n: state.series.length };
    const freqLabel = { "0.0033": "1/300\uFF08\u7279\u5927\u6865\uFF09", "0.01": "1/100\uFF08\u5927\u3001\u4E2D\u6865\uFF09", "0.02": "1/50", "0.04": "1/25" }[String(freq)] || (freq * 100).toFixed(2) + "%";
    const now = /* @__PURE__ */ new Date();
    const H1 = (t) => new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, children: [new D.TextRun({ text: t, bold: true, size: 30 })] });
    const H2 = (t) => new D.Paragraph({ heading: D.HeadingLevel.HEADING_2, children: [new D.TextRun({ text: t, bold: true, size: 26 })] });
    const P = (t, opt = {}) => new D.Paragraph({ children: [new D.TextRun({ text: t, size: 22, ...opt })], spacing: { after: 120 } });
    const PB2 = (label, val) => new D.Paragraph({ children: [new D.TextRun({ text: label + "\uFF1A", bold: true, size: 22 }), new D.TextRun({ text: val, size: 22 })], spacing: { after: 60 } });
    const mkTable = (header, rows) => new D.Table({
      width: { size: 100, type: D.WidthType.PERCENTAGE },
      rows: [
        new D.TableRow({ tableHeader: true, children: header.map((h) => new D.TableCell({ children: [new D.Paragraph({ children: [new D.TextRun({ text: h, bold: true, size: 20 })] })] })) }),
        ...rows.map((r) => new D.TableRow({ children: r.map((c) => new D.TableCell({ children: [new D.Paragraph({ children: [new D.TextRun({ text: String(c), size: 20 })] })] })) }))
      ]
    });
    const FREQS = [0.05, 0.1, 0.2, 0.5, 1, 2, 3.33, 5, 10, 20, 50, 90];
    const freqRows = FREQS.map((pp) => {
      const ph = phiPIII(pp / 100, p.cs), k = 1 + ph * p.cv;
      return [pp < 1 ? pp.toFixed(2) + " %" : pp.toFixed(2).replace(/\.?0+$/, "") + " %", ph.toFixed(3), k.toFixed(3), (p.mean * k).toFixed(1)];
    });
    const sorted = [...state.series].sort((a, b) => b - a);
    const empRows = sorted.slice(0, 15).map((qi, i) => [i + 1, qi, ((i + 1) / (sorted.length + 1) * 100).toFixed(2) + " %"]);
    svgToPngDataUrl().then((dataUrl) => {
      const doc = new D.Document({
        sections: [{
          children: [
            new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.TextRun({ text: "\u6CD3\u7B97 \xB7 \u6865\u6DB5\u8BBE\u8BA1\u6D41\u91CF\u8BA1\u7B97\u4E66", bold: true, size: 40 })] }),
            new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.TextRun({ text: "\uFF08P-\u2162 \u578B\u9891\u7387\u66F2\u7EBF\u9002\u7EBF\u6CD5\uFF09", size: 24, color: "6e6e73" })], spacing: { after: 240 } }),
            H1("\u4E00\u3001\u8BA1\u7B97\u4F9D\u636E"),
            P("1.\u300A\u516C\u8DEF\u5DE5\u7A0B\u6C34\u6587\u52D8\u6D4B\u8BBE\u8BA1\u89C4\u8303\u300BJTG C30-2015\uFF1A\u7B2C 6.2 \u8282\uFF08\u5229\u7528\u5B9E\u6D4B\u6D41\u91CF\u7CFB\u5217\u63A8\u7B97\u8BBE\u8BA1\u6D41\u91CF\uFF09\uFF0C\u5F0F 6.2.6\uFF1AQp = Q\u0304(1 + \u03A6p\xB7Cv)\uFF1B\u8868 1.0.8\uFF08\u8BBE\u8BA1\u6D2A\u6C34\u9891\u7387\uFF09\u3002"),
            P("2. \u7406\u8BBA\u9891\u7387\u66F2\u7EBF\u91C7\u7528\u76AE\u5C14\u900A\u2162\u578B\uFF08\u89C4\u8303\u7B2C 6.2.4 \u6761\uFF09\uFF1B\u03A6p \u7531 P-\u2162 \u5206\u5E03\u6570\u503C\u8BA1\u7B97\uFF08\u4E0D\u5B8C\u5168 \u0393 \u51FD\u6570\u5206\u4F4D\u6570\uFF09\uFF0C\u7ECF scipy \u72EC\u7ACB\u4EA4\u53C9\u9A8C\u8BC1\u3002"),
            H1("\u4E8C\u3001\u57FA\u672C\u8D44\u6599"),
            PB2("\u5B9E\u6D4B\u7CFB\u5217\u9879\u6570 n", String(st.n ?? sorted.length)),
            PB2("\u7CFB\u5217\u6D41\u91CF\uFF08m\xB3/s\uFF0C\u4ECE\u5927\u5230\u5C0F\uFF09", sorted.join("\uFF0C")),
            mkTable(["\u5E8F\u53F7 m", "\u6D41\u91CF Q\uFF08m\xB3/s\uFF09", "\u7ECF\u9A8C\u9891\u7387 Pm = m/(n+1)"], empRows),
            new D.Paragraph({ children: [new D.TextRun({ text: sorted.length > 15 ? "\uFF08\u4EC5\u5217\u524D 15 \u9879\uFF09" : "", size: 18, color: "aeaeb2" })], spacing: { after: 120 } }),
            H1("\u4E09\u3001\u7EDF\u8BA1\u53C2\u6570"),
            PB2("\u77E9\u6CD5\u521D\u4F30\u5747\u503C Q\u0304", st.mean ? st.mean.toFixed(1) + " m\xB3/s" : "\u2014\uFF08\u53C2\u6570\u6A21\u5F0F\uFF09"),
            PB2("\u77E9\u6CD5\u521D\u4F30 Cv", st.cv ? st.cv.toFixed(3) : "\u2014"),
            PB2("\u77E9\u6CD5\u521D\u4F30 Cs\uFF08\u4EC5\u53C2\u8003\uFF09", st.cs ? st.cs.toFixed(2) : "\u2014"),
            PB2("\u9002\u7EBF\u91C7\u7528 Q\u0304", p.mean.toFixed(1) + " m\xB3/s"),
            PB2("\u9002\u7EBF\u91C7\u7528 Cv", p.cv.toFixed(3)),
            PB2("\u9002\u7EBF\u91C7\u7528 Cs", p.cs.toFixed(2) + "\uFF08= " + (p.cs / p.cv).toFixed(1) + " Cv\uFF09"),
            P("\u6309\u89C4\u8303 6.2.5\uFF0C\u7EDF\u8BA1\u53C2\u6570\u4EE5\u9002\u7EBF\u6CD5\u786E\u5B9A\uFF1ACs \u56E0\u62BD\u6837\u8BEF\u5DEE\u5927\u6309\u7ECF\u9A8C\u500D\u6BD4\u5047\u5B9A\u540E\u76EE\u4F30\u8C03\u6574\uFF0C\u4F7F\u7406\u8BBA\u9891\u7387\u66F2\u7EBF\u4E0E\u7ECF\u9A8C\u70B9\u636E\u543B\u5408\u3002", { color: "6e6e73" }),
            H1("\u56DB\u3001\u8BBE\u8BA1\u6D41\u91CF\u8BA1\u7B97"),
            PB2("\u8BBE\u8BA1\u6D2A\u6C34\u9891\u7387", freqLabel),
            PB2("\u79BB\u5747\u7CFB\u6570 \u03A6p", phi.toFixed(4)),
            PB2("\u6A21\u6BD4\u7CFB\u6570 Kp = 1 + \u03A6p\xB7Cv", kp.toFixed(4)),
            PB2("\u8BBE\u8BA1\u6D41\u91CF Qp = Q\u0304\xB7Kp", q.toFixed(1) + " m\xB3/s"),
            H1("\u4E94\u3001\u9891\u7387\u66F2\u7EBF\u6210\u679C\u8868"),
            mkTable(["\u9891\u7387 P", "\u03A6p", "Kp", "Qp\uFF08m\xB3/s\uFF09"], freqRows),
            H1("\u516D\u3001\u9002\u7EBF\u56FE"),
            new D.Paragraph({ children: [new D.ImageRun({ type: "png", data: dataUrl.split(",")[1], transformation: { width: 600, height: 332 } })], spacing: { before: 120, after: 120 } }),
            new D.Paragraph({ children: [new D.TextRun({ text: "\u56FE\uFF1A\u6D77\u68EE\u673A\u7387\u683C\u7EB8\u4E0A\u7684\u7ECF\u9A8C\u70B9\u636E\u4E0E P-\u2162 \u7406\u8BBA\u9891\u7387\u66F2\u7EBF\uFF08\u6A2A\u8F74\u9891\u7387\u3001\u7EB5\u8F74\u6D41\u91CF m\xB3/s\uFF09", size: 18, color: "6e6e73" })], spacing: { after: 240 } }),
            new D.Paragraph({
              border: { top: { style: D.BorderStyle.SINGLE, size: 1, color: "d9d9d9" } },
              children: [new D.TextRun({ text: "\u672C\u8BA1\u7B97\u4E66\u7531\u6CD3\u7B97 v0.8.1 \u751F\u6210\uFF0C\u03A6 \u503C\u7B97\u6CD5\u7ECF\u591A\u6E90\u4EA4\u53C9\u9A8C\u8BC1\uFF08scipy \u72EC\u7ACB\u5B9E\u73B0\u4E00\u81F4\u5230 1e-6\uFF09\u3002\u8BA1\u7B97\u7ED3\u679C\u4F9B\u5B66\u4E60\u4E0E\u8BFE\u7A0B\u8BBE\u8BA1\u53C2\u8003\uFF0C\u5DE5\u7A0B\u5E94\u7528\u987B\u7ECF\u6CE8\u518C\u5DE5\u7A0B\u5E08\u590D\u6838\u3002\u751F\u6210\u65F6\u95F4\uFF1A" + now.toLocaleString("zh-CN"), size: 18, color: "6e6e73" })]
            })
          ]
        }]
      });
      return D.Packer.toBlob(doc).then((blob) => {
        console.log("DOCX_OK", blob.size);
        downloadBlob(blob, "\u8BBE\u8BA1\u6D41\u91CF\u8BA1\u7B97\u4E66_P3\u9002\u7EBF.docx");
        const b = $("btnReport"), old = b.textContent;
        b.textContent = "\u5DF2\u751F\u6210 " + Math.round(blob.size / 1024) + " KB\uFF0C\u6D4F\u89C8\u5668\u5DF2\u5F00\u59CB\u4E0B\u8F7D\uFF08\u770B\u4E0B\u8F7D\u680F\uFF09";
        b.disabled = true;
        setTimeout(() => {
          b.textContent = old;
          b.disabled = false;
        }, 5e3);
      });
    }).catch((e) => {
      console.error("DOCX_FAIL", e);
      alert("\u8BA1\u4E66\u751F\u6210\u5931\u8D25\uFF1A" + (e instanceof Error ? e.message : String(e)));
    });
  }
  $("btnReport").onclick = buildReportDocx;
  var LS_KEY = "hongsuan_v08";
  var LEGACY_LS_KEY = "hongsuan_v07";
  var HIST_IDS = ["hf0Ac", "hf0Bc", "hf0nc", "hf0At", "hf0Bt", "hf0nt", "hf0Ipermil", "hf0T", "hf1Ac", "hf1Bc", "hf1nc", "hf1At", "hf1Bt", "hf1nt", "hf1Ipermil", "hf1T", "hbCv", "hbCs"];
  var NODATA_IDS = ["rcSp", "rcN", "rcPsi", "rcTau", "rcF", "rdPhi", "rdH", "rdZ", "rdF", "rdBeta", "rdGamma", "rdDelta"];
  function collectInputs() {
    const pick = (ids) => {
      const o = {};
      ids.forEach((id) => {
        const el = $(id);
        if (el) o[id] = el.value;
      });
      return o;
    };
    return {
      mode: state.mode,
      series: $("series").value,
      hasExtra: $("hasExtra").checked,
      inN: $("inN").value,
      inL: $("inL").value,
      extraSeries: $("extraSeries").value,
      inMean: $("inMean").value,
      inCv: $("inCv").value,
      inCs: $("inCs").value,
      freq: state.freq,
      adopted: { ...state.params },
      hist: pick(HIST_IDS),
      nodata: pick(NODATA_IDS)
    };
  }
  var saveTimer = null;
  function markSaved() {
    const el = $("saveHint");
    if (!el) return;
    el.classList.add("on");
    setTimeout(() => el.classList.remove("on"), 900);
  }
  function saveAll() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(collectInputs()));
      markSaved();
    } catch (e) {
    }
  }
  function scheduleSave() {
    if (saveTimer !== null) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveAll, 400);
  }
  document.addEventListener("input", (e) => {
    if (e.target && e.target.matches && e.target.matches("input,textarea,select")) scheduleSave();
  });
  document.addEventListener("change", (e) => {
    if (e.target && e.target.matches && e.target.matches("input,textarea,select")) scheduleSave();
  });
  function checkNum(el) {
    const raw = el.value.trim();
    let bad = raw === "";
    if (!bad) {
      const v = parseFloat(raw);
      bad = !Number.isFinite(v);
      if (!bad && el.min !== "" && v < +el.min) bad = true;
      if (!bad && el.max !== "" && v > +el.max) bad = true;
    }
    el.classList.toggle("invalid", bad);
    return !bad;
  }
  document.querySelectorAll("input[type=number]").forEach((item) => {
    const el = item;
    el.addEventListener("input", () => checkNum(el));
    el.addEventListener("blur", () => {
      if (el.value.trim() === "") {
        el.classList.add("invalid");
      }
    });
  });
  function restoreAll() {
    let d = null;
    try {
      d = JSON.parse(localStorage.getItem(LS_KEY) || localStorage.getItem(LEGACY_LS_KEY) || "null");
    } catch (e) {
      d = null;
    }
    if (!d || typeof d !== "object") return null;
    if (typeof d.series === "string") $("series").value = d.series;
    if (d.hasExtra) {
      $("hasExtra").checked = true;
      $("extraBox").style.display = "";
    }
    if (d.inN != null) $("inN").value = d.inN;
    if (d.inL != null) $("inL").value = d.inL;
    if (typeof d.extraSeries === "string") $("extraSeries").value = d.extraSeries;
    if (d.inMean != null) $("inMean").value = d.inMean;
    if (d.inCv != null) $("inCv").value = d.inCv;
    if (d.inCs != null) $("inCs").value = d.inCs;
    if (d.freq != null && Number.isFinite(+d.freq)) {
      state.freq = +d.freq;
      $("freqSel").value = String(d.freq);
    }
    if (d.adopted && Number.isFinite(d.adopted.mean) && d.adopted.mean > 0 && Number.isFinite(d.adopted.cv) && d.adopted.cv > 0 && Number.isFinite(d.adopted.cs)) {
      state.adoptedOverride = { mean: d.adopted.mean, cv: d.adopted.cv, cs: d.adopted.cs };
    }
    if (d.hist) for (const k in d.hist) {
      const el = $(k);
      if (el && d.hist[k] != null) el.value = d.hist[k];
    }
    if (d.nodata) for (const k in d.nodata) {
      const el = $(k);
      if (el && d.nodata[k] != null) el.value = d.nodata[k];
    }
    console.log("RESTORE_MODE", d.mode || "series", "ADOPTED", state.adoptedOverride ? "yes" : "no", "FREQ", state.freq);
    return d.mode || null;
  }
  $("btnReset").onclick = () => {
    if (confirm("\u786E\u5B9A\u6E05\u9664\u672C\u673A\u8BB0\u5FC6\u7684\u5168\u90E8\u53C2\u6570\u5E76\u6062\u590D\u9ED8\u8BA4\u793A\u4F8B\uFF1F")) {
      localStorage.removeItem(LS_KEY);
      location.reload();
    }
  };
  var urlQ = new URLSearchParams(location.search);
  var restoredMode = restoreAll();
  var urlMethod = urlQ.get("method");
  var startMode = urlMethod === "hist" ? "histB" : urlMethod === "nodata" ? "noData" : restoredMode || "series";
  if (startMode === "params") {
    $("mParams").click();
  } else if (startMode === "histB") {
    $("mHist").click();
  } else if (startMode === "noData") {
    $("mNoData").click();
  } else {
    $("mSeries").click();
    calcFromSeries();
  }
  if (state.adoptedOverride) {
    state.params = { ...state.adoptedOverride };
    delete state.adoptedOverride;
    $("cvSlider").value = Math.min(Math.max(state.params.cv, 0.05), 1.2);
    $("ratioSlider").value = Math.min(Math.max(state.params.cs / state.params.cv, 1), 8);
    syncParamInputs();
    render();
  }
  if (new URLSearchParams(location.search).get("bayes") === "1") {
    runBayesCompare();
  }
  if (new URLSearchParams(location.search).get("report") === "1") {
    buildReportDocx();
  }
  if (new URLSearchParams(location.search).get("autosave") === "1") {
    saveAll();
  }
})();
