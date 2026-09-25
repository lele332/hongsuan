(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

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

  // src/core/empirical.ts
  function empiricalContinuous(n) {
    const out = [];
    for (let m = 1; m <= n; m++) out.push(100 * m / (n + 1));
    return out;
  }

  // src/core/points.ts
  function continuousPoints(series) {
    const sorted = [...series].sort((a, b) => b - a);
    const ps = empiricalContinuous(sorted.length);
    return sorted.map((q, i) => ({ p: ps[i] / 100, q, kind: "meas" }));
  }
  function discontinuousPoints(input) {
    const sorted = [...input.measuredDesc].sort((a2, b) => b - a2);
    const stats = discontinuousStats({
      historicalExtra: input.historicalExtra,
      measuredDesc: sorted,
      l: input.l,
      N: input.N
    });
    const { n, l, N, a } = stats;
    const all = [...input.historicalExtra, ...sorted.slice(0, l)].sort((x, y) => y - x);
    const points = all.map((q, i) => ({
      p: (i + 1) / (N + 1),
      q,
      kind: "hist"
    }));
    const pA = a / (N + 1);
    for (let m = l + 1; m <= n; m++) {
      points.push({
        p: pA + (1 - pA) * (m - l) / (n - l + 1),
        q: sorted[m - 1],
        kind: "meas"
      });
    }
    return { stats, points };
  }
  function sseOfPoints(points, params, phiFn) {
    let sse = 0;
    for (const pt of points) {
      const qTheory = params.mean * (1 + phiFn(pt.p, params.cs) * params.cv);
      sse += (pt.q - qTheory) ** 2;
    }
    return sse;
  }

  // src/core/parse.ts
  function parseSeries(text) {
    if (typeof text !== "string") throw new Error("\u7CFB\u5217\u8F93\u5165\u5FC5\u987B\u4E3A\u5B57\u7B26\u4E32");
    const tokens = text.split(/[\s,，;；]+/).filter(Boolean);
    const values = [];
    const ignored = [];
    for (const tok of tokens) {
      const v = Number(tok);
      if (Number.isFinite(v) && v > 0) values.push(v);
      else ignored.push(tok);
    }
    return { values, ignored };
  }

  // src/core/hTable.generated.ts
  var H_TABLE_ZONES = {
    1: {
      soilI: [[30, 41, 45, 48], [45, 50, 56, 59], [60, 56, 62, 67], [80, 65, 73, 78]],
      soilII: [[30, 32, 36, 39], [45, 38, 44, 48], [60, 42, 49, 53], [80, 47, 55, 61]],
      soilIII: [[30, 27, 31, 35], [45, 32, 38, 42], [60, 36, 42, 48], [80, 41, 49, 55]],
      soilIV: [[30, 20, 25, 28], [45, 26, 30, 33], [60, 28, 34, 39], [80, 32, 39, 46]],
      soilV: [[30, 13, 18, 19], [45, 15, 20, 24], [60, 16, 23, 28], [80, 18, 25, 32]],
      soilVI: [[30, 3, 7, 9], [45, 5, 9, 12], [60, 6, 11, 15], [80, 7, 13, 20]]
    },
    2: {
      soilI: [[30, 48, 51, 57], [45, 58, 63, 68], [60, 64, 71, 77], [80, 70, 79, 86]],
      soilII: [[30, 38, 43, 48], [45, 45, 51, 57], [60, 50, 57, 63], [80, 54, 62, 69]],
      soilIII: [[30, 32, 37, 43], [45, 38, 45, 51], [60, 42, 50, 56], [80, 42, 55, 61]],
      soilIV: [[30, 27, 30, 36], [45, 31, 38, 43], [60, 35, 42, 47], [80, 37, 45, 51]],
      soilV: [[30, 18, 22, 28], [45, 21, 26, 32], [60, 21, 28, 34], [80, 20, 28, 35]]
    },
    3: {
      soilI: [[30, 52, 56, 60], [45, 66, 70, 75], [60, 75, 81, 85], [80, 86, 93, 100]],
      soilII: [[30, 43, 48, 52], [45, 54, 59, 63], [60, 62, 67, 72], [80, 70, 77, 84]],
      soilIII: [[30, 37, 41, 46], [45, 48, 52, 57], [60, 56, 61, 64], [80, 64, 70, 75]],
      soilIV: [[30, 32, 37, 41], [45, 41, 46, 50], [60, 47, 52, 57], [80, 54, 60, 67]],
      soilV: [[30, 24, 28, 31], [45, 31, 34, 39], [60, 36, 39, 45], [80, 40, 44, 52]],
      soilVI: [[30, 13, 15, 19], [45, 17, 20, 26], [60, 20, 24, 32], [80, 24, 30, 40]]
    },
    4: {
      soilI: [[30, 52, 56, 60], [45, 64, 70, 78], [60, 73, 83, 94], [80, 84, 97, 109]],
      soilII: [[30, 44, 48, 52], [45, 54, 62, 68], [60, 61, 72, 82], [80, 72, 82, 95]],
      soilIII: [[30, 39, 43, 46], [45, 50, 55, 63], [60, 55, 64, 77], [80, 64, 75, 90]],
      soilIV: [[30, 32, 35, 41], [45, 40, 45, 54], [60, 45, 53, 66], [80, 53, 64, 77]],
      soilV: [[30, 20, 23, 31], [45, 25, 32, 40], [60, 31, 40, 49], [80, 37, 53, 60]],
      soilVI: [[30, 12, 16, 21], [45, 14, 21, 28], [60, 16, 25, 33], [80, 18, 30, 41]]
    },
    5: {
      soilI: [[30, 43, 48, 56], [45, 55, 60, 69], [60, 63, 69, 78], [80, 72, 78, 89]],
      soilII: [[30, 35, 40, 48], [45, 44, 50, 59], [60, 52, 57, 68], [80, 60, 65, 77]],
      soilIII: [[30, 30, 35, 43], [45, 39, 43, 52], [60, 45, 50, 60], [80, 52, 57, 68]],
      soilIV: [[30, 24, 27, 35], [45, 31, 34, 44], [60, 36, 41, 51], [80, 42, 47, 59]],
      soilV: [[30, 14, 17, 24], [45, 19, 23, 31], [60, 23, 27, 37], [80, 26, 32, 42]],
      soilVI: [[30, 5, 7, 12], [45, 6, 9, 15], [60, 7, 12, 18], [80, 9, 15, 22]]
    },
    6: {
      soilI: [[30, 48, 52, 57], [45, 57, 61, 69], [60, 64, 70, 78], [80, 71, 79, 86]],
      soilII: [[30, 40, 44, 49], [45, 47, 51, 60], [60, 52, 59, 67], [80, 57, 65, 72]],
      soilIII: [[30, 35, 39, 43], [45, 41, 46, 52], [60, 46, 51, 58], [80, 50, 56, 64]],
      soilIV: [[30, 27, 31, 36], [45, 32, 36, 44], [60, 35, 40, 50], [80, 37, 44, 54]],
      soilV: [[30, 16, 22, 27], [45, 19, 23, 30], [60, 20, 24, 33], [80, 21, 27, 35]],
      soilVI: [[30, 2, 5, 11], [45, 3, 6, 11], [60, 4, 7, 12], [80, 5, 9, 14]]
    },
    7: {
      soilI: [[30, 54, 60, 66], [45, 68, 75, 83], [60, 76, 86, 95], [80, 85, 96, 105]],
      soilII: [[30, 46, 52, 59], [45, 57, 66, 74], [60, 64, 74, 84], [80, 71, 82, 94]],
      soilIII: [[30, 41, 47, 53], [45, 51, 59, 66], [60, 57, 68, 76], [80, 63, 74, 84]],
      soilIV: [[30, 34, 39, 46], [45, 41, 50, 58], [60, 45, 56, 65], [80, 51, 61, 72]],
      soilV: [[30, 21, 29, 33], [45, 26, 35, 40], [60, 30, 41, 46], [80, 35, 46, 52]],
      soilVI: [[30, 9, 17, 19], [45, 10, 19, 24], [60, 12, 20, 26], [80, 13, 23, 30]]
    },
    8: {
      soilI: [[30, 59, 65, 70], [45, 77, 85, 92], [60, 90, 100, 110], [80, 105, 116, 131]],
      soilII: [[30, 52, 58, 63], [45, 67, 76, 82], [60, 79, 89, 99], [80, 92, 103, 118]],
      soilIII: [[30, 47, 53, 58], [45, 61, 69, 76], [60, 72, 82, 92], [80, 83, 95, 110]],
      soilIV: [[30, 39, 45, 49], [45, 51, 59, 66], [60, 61, 70, 80], [80, 72, 82, 96]],
      soilV: [[30, 27, 34, 39], [45, 36, 45, 53], [60, 45, 53, 65], [80, 56, 63, 79]],
      soilVI: [[30, 18, 24, 30], [45, 25, 33, 42], [60, 31, 40, 51], [80, 38, 49, 63]]
    },
    9: {
      soilI: [[30, 58, 63, 70], [45, 69, 74, 80], [60, 75, 80, 87], [80, 81, 86, 94]],
      soilII: [[30, 50, 56, 63], [45, 59, 64, 71], [60, 62, 68, 77], [80, 67, 72, 82]],
      soilIII: [[30, 46, 51, 57], [45, 53, 58, 64], [60, 56, 62, 69], [80, 59, 66, 73]],
      soilIV: [[30, 38, 43, 48], [45, 42, 48, 55], [60, 45, 50, 56], [80, 47, 53, 59]],
      soilV: [[30, 26, 30, 37], [45, 28, 32, 40], [60, 28, 33, 40], [80, 28, 34, 41]],
      soilVI: [[30, 6, 10, 18], [45, 6, 10, 19], [60, 7, 11, 21], [80, 9, 15, 22]]
    },
    10: {
      soilI: [[30, 43, 46, 52], [45, 54, 57, 64], [60, 60, 64, 72], [80, 67, 71, 79]],
      soilII: [[30, 35, 38, 44], [45, 43, 46, 54], [60, 48, 51, 60], [80, 53, 57, 65]],
      soilIII: [[30, 30, 34, 39], [45, 38, 41, 48], [60, 42, 46, 53], [80, 46, 50, 57]],
      soilIV: [[30, 24, 27, 34], [45, 29, 32, 40], [60, 31, 35, 43], [80, 33, 38, 45]],
      soilV: [[30, 13, 15, 21], [45, 16, 19, 25], [60, 16, 20, 26], [80, 16, 21, 27]]
    },
    11: {
      soilI: [[30, 40, 43, 45], [45, 50, 56, 55], [60, 57, 61, 64], [80, 64, 68, 73]],
      soilII: [[30, 31, 34, 38], [45, 39, 43, 48], [60, 45, 49, 55], [80, 50, 55, 62]],
      soilIII: [[30, 27, 28, 32], [45, 34, 36, 40], [60, 38, 41, 45], [80, 42, 46, 51]],
      soilIV: [[30, 16, 20, 25], [45, 24, 26, 31], [60, 28, 31, 35], [80, 30, 35, 41]],
      soilV: [[30, 9, 12, 15], [45, 15, 15, 20], [60, 13, 17, 23], [80, 11, 19, 25]]
    },
    12: {
      soilI: [[30, 48, 53, 59], [45, 58, 62, 71], [60, 65, 70, 78], [80, 72, 78, 84]],
      soilII: [[30, 41, 45, 51], [45, 48, 52, 61], [60, 53, 58, 67], [80, 58, 64, 73]],
      soilIII: [[30, 35, 41, 46], [45, 41, 48, 53], [60, 46, 53, 58], [80, 50, 57, 64]],
      soilIV: [[30, 27, 33, 38], [45, 32, 38, 45], [60, 36, 41, 49], [80, 39, 44, 53]],
      soilV: [[30, 15, 21, 26], [45, 19, 23, 30], [60, 20, 25, 32], [80, 21, 26, 35]],
      soilVI: [[30, 2, 5, 10], [45, 2, 5, 10], [60, 3, 6, 11], [80, 4, 7, 12]]
    },
    13: {
      soilI: [[30, 35, 40, 46], [45, 41, 47, 52], [60, 44, 50, 56], [80, 48, 54, 61]],
      soilII: [[30, 26, 31, 37], [45, 29, 35, 41], [60, 30, 36, 42], [80, 32, 37, 44]],
      soilIII: [[30, 21, 26, 31], [45, 24, 30, 35], [60, 24, 30, 36], [80, 24, 30, 37]],
      soilIV: [[30, 14, 20, 25], [45, 15, 21, 26], [60, 15, 20, 26], [80, 14, 20, 27]]
    },
    14: {
      soilI: [[30, 30, 34, 38], [45, 36, 41, 46], [60, 41, 46, 52], [80, 45, 50, 57]],
      soilII: [[30, 21, 25, 30], [45, 25, 29, 35], [60, 27, 35, 38], [80, 27, 34, 39]],
      soilIII: [[30, 16, 20, 24], [45, 19, 23, 29], [60, 20, 25, 31], [80, 20, 25, 32]],
      soilIV: [[30, 3, 14, 17], [45, 6, 16, 21], [60, 8, 17, 22], [80, 9, 15, 22]]
    },
    15: {
      soilI: [[30, 37, 39, 44], [45, 46, 49, 54], [60, 51, 57, 62], [80, 56, 63, 69]],
      soilII: [[30, 29, 31, 36], [45, 35, 39, 43], [60, 37, 44, 48], [80, 39, 48, 52]],
      soilIII: [[30, 23, 25, 30], [45, 29, 32, 36], [60, 31, 36, 41], [80, 33, 39, 44]],
      soilIV: [[30, 17, 19, 23], [45, 20, 24, 29], [60, 22, 27, 33], [80, 22, 29, 35]],
      soilV: [[30, 10, 13, 15], [45, 9, 16, 19]]
    },
    16: {
      soilI: [[30, 36, 41, 45], [45, 45, 50, 56], [60, 51, 57, 64], [80, 56, 63, 71]],
      soilII: [[30, 28, 32, 36], [45, 34, 38, 44], [60, 38, 43, 50], [80, 41, 47, 54]],
      soilIII: [[30, 23, 27, 31], [45, 28, 33, 38], [60, 31, 37, 43], [80, 33, 40, 47]],
      soilIV: [[30, 16, 21, 25], [45, 20, 26, 30], [60, 22, 28, 34], [80, 24, 31, 37]],
      soilV: [[30, 9, 13, 18], [45, 10, 15, 21], [60, 3, 15, 21]]
    },
    17: {
      soilI: [[30, 52, 58, 66], [45, 64, 70, 79], [60, 70, 78, 86], [80, 76, 85, 93]],
      soilII: [[30, 44, 50, 58], [45, 52, 59, 67], [60, 56, 64, 72], [80, 61, 68, 76]],
      soilIII: [[30, 39, 44, 52], [45, 45, 53, 61], [60, 50, 57, 66], [80, 53, 60, 69]],
      soilIV: [[30, 32, 32, 45], [45, 37, 45, 53], [60, 39, 48, 56], [80, 42, 50, 59]],
      soilV: [[30, 24, 29, 38], [45, 28, 34, 43], [60, 28, 35, 44], [80, 26, 32, 42]],
      soilVI: [[30, 6, 12, 19], [45, 2, 9, 19], [60, 2, 6, 18], [80, 2, 5, 13]]
    },
    18: {
      soilI: [[30, 46, 52, 57], [45, 57, 64, 69], [60, 66, 72, 78], [80, 75, 81, 87]],
      soilII: [[30, 37, 43, 49], [45, 46, 53, 58], [60, 52, 58, 64], [80, 58, 64, 70]],
      soilIII: [[30, 32, 37, 43], [45, 40, 46, 52], [60, 46, 52, 57], [80, 51, 57, 64]],
      soilIV: [[30, 28, 33, 37], [45, 33, 39, 45], [60, 37, 43, 50], [80, 41, 47, 55]],
      soilV: [[30, 20, 24, 28], [45, 22, 28, 33], [60, 23, 30, 36], [80, 25, 31, 39]],
      soilVI: [[30, 7, 10, 16], [45, 8, 12, 18], [60, 8, 12, 20], [80, 6, 11, 21]]
    }
  };

  // src/core/runoffTable.ts
  var RUNOFF_TABLE_SCHEMA = "hongrunoff-h-table@2";
  var FREQ_KEYS = ["p1", "p2", "p4"];
  var FREQ_PCTS = {
    p1: 1,
    p2: 2,
    p4: 4
  };
  function loadRunoffTable(json) {
    if (typeof json !== "object" || json === null) throw new Error("\u5F84\u6D41\u539A\u5EA6\u8868\u5FC5\u987B\u4E3A JSON \u5BF9\u8C61");
    const t = json;
    if (t.schema !== RUNOFF_TABLE_SCHEMA) {
      throw new Error(`\u5F84\u6D41\u539A\u5EA6\u8868 schema \u4E0D\u5339\u914D\uFF1A\u671F\u671B ${RUNOFF_TABLE_SCHEMA}\uFF0C\u6536\u5230 ${String(t.schema)}`);
    }
    if (typeof t.source !== "string" || !t.source) throw new Error("\u5F84\u6D41\u539A\u5EA6\u8868\u7F3A\u5C11 source \u51FA\u5904\u6807\u6CE8");
    if (typeof t.zones !== "object" || t.zones === null) throw new Error("\u5F84\u6D41\u539A\u5EA6\u8868\u7F3A\u5C11 zones");
    for (const [zone, soils] of Object.entries(t.zones)) {
      const zn = Number(zone);
      if (!Number.isInteger(zn) || zn < 1 || zn > 18) throw new Error(`\u66B4\u96E8\u5206\u533A\u53F7\u5FC5\u987B\u662F 1..18 \u7684\u6574\u6570\uFF0C\u6536\u5230 ${zone}`);
      for (const [soil, rows] of Object.entries(soils)) {
        if (!/^soil[I-V]{1,3}$/.test(soil)) throw new Error(`\u571F\u58E4\u7C7B\u522B\u952E\u5FC5\u987B\u662F soilI..soilVI \u5F62\u5F0F\uFF0C\u6536\u5230 ${soil}`);
        if (!Array.isArray(rows) || rows.length < 2) {
          throw new Error(`\u5206\u533A ${zone} ${soil} \u81F3\u5C11\u9700\u8981 2 \u884C\uFF08\u03C4 \u6863\uFF09\u624D\u80FD\u63D2\u503C`);
        }
        for (const r of rows) {
          if (!Number.isFinite(r.tau) || r.tau <= 0) throw new Error("\u6C47\u6D41\u65F6\u95F4 \u03C4 \u5FC5\u987B\u4E3A\u6B63\u6570\uFF08min\uFF09");
          for (const k of FREQ_KEYS) {
            if (!Number.isFinite(r.h?.[k]) || r.h[k] <= 0) {
              throw new Error(`\u5206\u533A ${zone} ${soil} \u03C4=${r.tau} \u7684 ${k} \u5F84\u6D41\u539A\u5EA6\u5FC5\u987B\u4E3A\u6B63\u6570`);
            }
          }
        }
        const taus = rows.map((r) => r.tau);
        if (new Set(taus).size !== taus.length) throw new Error(`\u5206\u533A ${zone} ${soil} \u5B58\u5728\u91CD\u590D \u03C4 \u6863`);
      }
    }
    return t;
  }
  function lerp(a, b, w) {
    return a + (b - a) * w;
  }
  function hAtFreq(row, pct) {
    const pcts = FREQ_KEYS.map((k) => FREQ_PCTS[k]);
    for (let i = 0; i < pcts.length; i++) {
      if (Math.abs(pct - pcts[i]) < 1e-9) return row[FREQ_KEYS[i]];
    }
    let iLo = 0, iHi = 1;
    if (pct >= pcts[pcts.length - 1]) {
      iLo = pcts.length - 2;
      iHi = pcts.length - 1;
    } else {
      for (let i = 0; i < pcts.length - 1; i++) {
        if (pct > pcts[i] && pct < pcts[i + 1]) {
          iLo = i;
          iHi = i + 1;
          break;
        }
      }
    }
    const w = Math.log(pct / pcts[iLo]) / Math.log(pcts[iHi] / pcts[iLo]);
    return lerp(row[FREQ_KEYS[iLo]], row[FREQ_KEYS[iHi]], w);
  }
  function lookupRunoffH(table, zone, soil, freqPct, tauMin) {
    const soilKey = "soil" + soil.toUpperCase().replace(/[^IV]/g, "");
    const rows = table.zones[String(zone)]?.[soilKey];
    if (!rows) throw new Error(`\u5F84\u6D41\u539A\u5EA6\u8868\u4E2D\u6CA1\u6709\u5206\u533A ${zone} / \u571F\u58E4 ${soil} \u7684\u6570\u636E`);
    if (!Number.isFinite(freqPct) || freqPct <= 0 || freqPct >= 100) {
      throw new Error(`\u8BBE\u8BA1\u9891\u7387\u5FC5\u987B\u5728 (0,100)% \u4E4B\u95F4\uFF0C\u6536\u5230 ${freqPct}`);
    }
    if (!Number.isFinite(tauMin) || tauMin <= 0) throw new Error("\u6C47\u6D41\u65F6\u95F4\u5FC5\u987B\u4E3A\u6B63\uFF08min\uFF09");
    const sorted = [...rows].sort((a, b) => a.tau - b.tau);
    if (tauMin < sorted[0].tau || tauMin > sorted[sorted.length - 1].tau) {
      throw new Error(
        `\u6C47\u6D41\u65F6\u95F4 ${tauMin} min \u8D85\u51FA\u8868\u8303\u56F4\uFF08${sorted[0].tau}~${sorted[sorted.length - 1].tau} min\uFF09\uFF0C\u8BF7\u76F4\u63A5\u67E5\u8868`
      );
    }
    const exact = sorted.find((r) => Math.abs(r.tau - tauMin) < 1e-9);
    if (exact) {
      const h0 = hAtFreq(exact.h, freqPct);
      const onFreqNode = FREQ_KEYS.some((k) => Math.abs(FREQ_PCTS[k] - freqPct) < 1e-9);
      return { h: Math.round(h0 * 100) / 100, interpolated: !onFreqNode };
    }
    let rLo = sorted[0], rHi = sorted[sorted.length - 1];
    for (let i = 0; i < sorted.length - 1; i++) {
      if (tauMin >= sorted[i].tau && tauMin <= sorted[i + 1].tau) {
        rLo = sorted[i];
        rHi = sorted[i + 1];
        break;
      }
    }
    const wTau = (tauMin - rLo.tau) / (rHi.tau - rLo.tau);
    const h = lerp(hAtFreq(rLo.h, freqPct), hAtFreq(rHi.h, freqPct), wTau);
    return { h: Math.round(h * 100) / 100, interpolated: true };
  }
  function buildFullTable() {
    const zones = {};
    for (const [zone, soils] of Object.entries(H_TABLE_ZONES)) {
      const out = {};
      for (const [soil, rows] of Object.entries(soils)) {
        out[soil] = rows.map(([tau, p4, p2, p1]) => ({
          tau,
          h: { p1, p2, p4 }
        }));
      }
      zones[zone] = out;
    }
    return loadRunoffTable({
      schema: RUNOFF_TABLE_SCHEMA,
      source: "JTG/T 3365-02-2020\u300A\u516C\u8DEF\u6DB5\u6D1E\u8BBE\u8BA1\u89C4\u8303\u300B\u9644\u5F55B \u8868B-9\uFF08\u4EA4\u901A\u8FD0\u8F93\u90E8\u516C\u544A2020\u5E74\u7B2C88\u53F7\uFF0C\u653F\u5E9C\u516C\u5F00\u5168\u6587PDF\uFF09",
      zones
    });
  }
  var RUNOFF_TABLE_FULL = buildFullTable();

  // src/core/auxTables.generated.ts
  var AUX_PSI_F_BANDS = ["F<10", "10<F<=20", "20<F<=30"];
  var AUX_PSI_ROWS = [{ "terrain": "\u5E73\u5730", "slope": "1.2", "psi": ["0.05", "0.05", "0.05"] }, { "terrain": "\u5E73\u539F", "slope": "3\uFF0C4\uFF0C6", "psi": ["0.07", "0.06", "0.06"] }, { "terrain": "\u4E18\u9675", "slope": "10\uFF0C14\uFF0C20", "psi": ["0.09", "0.07", "0.06"] }, { "terrain": "\u5C71\u5730", "slope": "27\uFF0C35\uFF0C45", "psi": ["0.10", "0.09", "0.07"] }, { "terrain": "\u5C71\u5CAD", "slope": "60\uFF5E100", "psi": ["0.13", "0.11", "0.08"] }, { "terrain": "", "slope": "100\uFF5E200", "psi": ["0.14", "", ""] }, { "terrain": "", "slope": "200\uFF5E400", "psi": ["0.15", "", ""] }, { "terrain": "", "slope": "400\uFF5E800", "psi": ["0.16", "", ""] }, { "terrain": "", "slope": "800\uFF5E1200", "psi": ["0.17", "", ""] }];
  var AUX_ZONES = { "1": { "east": "\u7531\u9EC4\u6CB3\u53E3\u8D77 \u81F3\u592A\u884C\u5C71\u4E1C \u9E93", "south": "\u9EC4\u6CB3", "west": "\u4E94\u53F0\u5C71\u3001\u592A\u884C \u5C71", "north": "\u71D5\u5C71\u5C71\u8109", "range": "\u4E3B\u8981\u662F\u592A\u884C\u5C71\u4E1C\u9762\u5C71\u533A\uFF0C \u5305\u62EC\uFF1A\u6CB3\u5317\u897F\u5317\u90E8\uFF0C\u6CB3\u5357 \u897F\u5317\u89D2\uFF0C\u5C71\u897F\u4E1C\u90E8\u4E00\u90E8 \u5206\u3002" }, "2": { "east": "\u9EC4\u6CB3", "south": "\u9EC4\u6CB3", "west": "\u592A\u884C\u5C71\u9E93", "north": "\u6D77\u6CB3", "range": "\u534E\u5317\u5E73\u539F\uFF0C\u5305\u62EC\uFF1A\u6CB3\u5317\u5927 \u90E8\u5206\u3001\u5C71\u4E1C\u9EC4\u6CB3\u4EE5\u5317\u3001\u6CB3 \u5357\u9EC4\u6CB3\u4EE5\u5317\u7684\u5317\u89D2\u4E00\u5C0F \u90E8\u5206\u3002" }, "3": { "east": "\u9EC4\u6D77", "south": "\u6C82\u6CB3", "west": "\u8FD0\u6CB3", "north": "\u9EC4\u6CB3\u3001\u6E24 \u6D77", "range": "\u5C71\u4E1C\u534A\u5C9B\uFF0C\u5305\u62EC\uFF1A\u5C71\u4E1C\u5927 \u90E8\u3001\u6C5F\u82CF\u5317\u90E8\u4E00\u5C0F\u90E8\u5206\uFF0C \u5C71\u4E1C\u897F\u5357\u89D2\u3002" }, "4": { "east": "\u9EC4\u6D77", "south": "\u5929\u76EE\u5C71\u3001 \u9EC4\u5C71\u3001\u5927 \u522B\u5C71\u3001\u5927 \u6D2A\u5C71\u3001\u8346 \u5C71", "west": "\u6B66\u5F53\u5C71\u3001\u5DEB\u5C71", "north": "\u6C82\u6CB3\u3001\u8FD0 \u6CB3\u3001\u9EC4\u6CB3\u3001 \u5D69\u6CB3", "range": "\u6DEE\u6CB3\u6D41\u57DF\u548C\u957F\u6C5F\u4E0B\u6E38\u5E73 \u539F\uFF0C\u5305\u62EC\uFF1A\u6C5F\u82CF\u5168\u90E8\uFF0C\u5B89 \u5FBD\u3001\u6CB3\u5357\u7684\u7EDD\u5927\u90E8\u5206\uFF0C\u6E56 \u5317\u5317\u90E8\u7684\u4E00\u5C0F\u90E8\u5206\u3001\u5C71\u4E1C \u897F\u5357\u89D2\u3002" }, "5": { "east": "\u6B66\u5937\u5C71", "south": "\u5927\u5EBE\u5CAD\u548C \u6CBF\u5E7F\u897F\u5317 \u90E8\u7701\u754C\u5C71 \u8109", "west": "\u6B66\u9675\u5C71\u8109", "north": "\u9EC4\u5C71\u3001\u5927 \u522B\u5C71\u3001\u5927 \u6D2A\u5C71\u3001\u8346 \u5C71", "range": "\u957F\u6C5F\u6D41\u57DF\u4E2D\u6E38\u5E73\u539F\uFF0C\u5305 \u62EC\uFF1A\u6E56\u5357\u5168\u90E8\uFF0C\u6C5F\u897F\u3001\u6E56 \u5317\u4E00\u90E8\u5206\uFF0C\u5B89\u5FBD\u897F\u5357\u89D2\uFF0C \u6D59\u6C5F\u3001\u5E7F\u897F\u4E00\u5C0F\u90E8\u5206\u3002" }, "6": { "east": "\u62EC\u82CD\u5C71\u3001\u6234\u4E91 \u5C71", "south": "\u7F57\u6D6E\u5C71\u3001 \u4E5D\u8FDE\u5C71", "west": "\u6B66\u5937\u5C71\u3001\u5927\u5EBE \u5CAD\u3001\u5317\u6C5F\u897F\u6C5F \u5206\u6C34\u5CAD", "north": "\u5929\u76EE\u5C71", "range": "\u4E1C\u5357\u4E18\u9675\u533A\uFF0C\u5305\u62EC\uFF1A\u6D59\u6C5F\u3001 \u798F\u5EFA\u3001\u5E7F\u4E1C\u5927\u90E8\u5206\uFF0C\u6C5F\u897F \u4E1C\u5357\u89D2" }, "7": { "east": "\u4E1C\u6D77\u3001\u53F0\u6E7E\u6D77 \u5CE1", "south": "\u97E9\u6C5F\u3001\u4E5D \u9F99\u6C5F\u5206\u6C34 \u5CAD", "west": "\u62EC\u82CD\u5C71\u3001\u6234\u4E91 \u5C71", "north": "\u676D\u5DDE\u6E7E", "range": "\u4E1C\u5357\u4E18\u9675\u533A\uFF0C\u5305\u62EC\uFF1A\u6D59\u6C5F\u3001 \u798F\u5EFA\u4E00\u90E8\u5206" }, "8": { "east": "\u97E9\u6C5F\u3001\u4E5D\u9F99\u6C5F \u5206\u6C34\u5CAD", "south": "\u5357\u6D77", "west": "\u56FD\u754C", "north": "\u7F57\u6D6E\u5C71\u3001 \u4E5D\u8FDE\u5C71\u3001 \u4E91\u5F00\u5C71\u3001 \u5341\u4E07\u5927\u5C71", "range": "\u4E1C\u5357\u4E18\u9675\u533A\uFF0C\u5305\u62EC\uFF1A\u5E7F\u4E1C \u7701\u5927\u90E8\u5206\uFF0C\u5E7F\u897F\u5357\u90E8\u4E00\u5C0F \u90E8\u5206" }, "9": { "east": "\u5317\u6C5F\u3001\u897F\u6C5F\u5206", "south": "\u4E91 \u5F00 \u5927", "west": "\u6CBF\u7ECF\u5EA6 106", "north": "\u6CBF\u7701\u754C\u5C71", "range": "\u4E1C\u5357\u4E18\u9675\u533A\uFF0C\u5305\u62EC\uFF1A\u5E7F\u897F" }, "10": { "east": "\u6B66\u9675\u5C71\u8109", "south": "\u82D7\u5CAD\u3001\u56FD \u754C", "west": "\u6CBF\u7ECF\u5EA6 107 \u5C71\u8109\uFF0C\u5927\u5A04 \u5C71\uFF0C\u6CBF\u7ECF\u5EA6\u2218 104 \u5C71\u8109", "north": "\u5927\u5DF4\u5C71", "range": "\u4E91\u8D35\u9AD8\u539F\u533A\uFF0C\u5305\u62EC\uFF1A\u8D35\u5DDE \u5168\u90E8\u3001\u9655\u897F\u3001\u6E56\u5317\u3001\u56DB\u5DDD\u3001 \u4E91\u5357\u7684\u4E00\u90E8\u5206\u548C\u5E7F\u897F\u5317 \u89D2" }, "11": { "east": "\u6CBF\u7ECF\u5EA6 104 \u5C71\u8109", "south": "\u56FD\u754C", "west": "\u6A2A\u65AD\u5C71 \u2218", "north": "\u7EAC\u5EA628", "range": "\u4E91\u8D35\u9AD8\u539F\u533A\uFF0C\u5305\u62EC\uFF1A\u4E91\u5357 \u5927\u90E8\u5206\uFF0C\u56DB\u5DDD\u4E00\u5C0F\u90E8\u5206" }, "12": { "east": "\u2218 \u6CBF\u7ECF\u5EA6 107 \u5C71\u8109 \u2218", "south": "\u5927\u5A04\u5C71", "west": "\u8336\u576A\u5C71\u3001\u909B\u83B1 \u5C71\u3001\u5939\u91D1\u5C71\u3001 \u5927\u76F8\u5CAD", "north": "\u2218 \u7C73\u4ED3\u5C71\u3001 \u6469\u5929\u5CAD", "range": "\u56DB\u5DDD\u76C6\u5730\u533A\uFF0C\u5305\u62EC\uFF1A\u56DB\u5DDD \u5927\u90E8\u5206" }, "13": { "east": "\u5927\u5174\u5B89\u5CAD\u3001\u592A \u884C\u5C71\u3001\u4E94\u53F0 \u5C71\u3001\u6B66\u5F53\u5C71\u3001 \u5DEB\u5C71", "south": "\u5927\u5DF4\u5C71", "west": "\u6D1B\u6CB3\u3001\u6CFE\u6CB3\u53D1 \u6E90\u5C71\u8109\u5206\u6C34 \u5CAD", "north": "\u957F\u57CE", "range": "\u9EC4\u571F\u9AD8\u539F\u533A\uFF0C\u5305\u62EC\uFF1A\u5C71\u897F \u5927\u90E8\u5206\uFF0C\u6CB3\u5317\u3001\u9655\u897F\u3001\u7518 \u8083\u7684\u4E00\u90E8\u5206" }, "14": { "east": "\u5927\u5174\u5B89\u5CAD", "south": "\u592A\u884C\u5C71\u3001 \u4E94\u53F0\u5C71", "west": "\u8D3A\u5170\u5C71\u3001\u516D\u76D8 \u6C34", "north": "\u9634\u5C71\u3001\u9521 \u6797\u6D69\u7279\u3001 \u56FD\u754C", "range": "\u5317\u90E8\u9AD8\u539F\u548C\u9EC4\u6CB3\u5CB8\u9AD8\u539F\uFF0C \u5305\u62EC\uFF1A\u5185\u8499\u53E4\u81EA\u6CBB\u533A\u7684\u5927 \u90E8\u5206\uFF0C\u6CB3\u5317\u3001\u5C71\u897F\u3001\u7518\u8083 \u7684\u4E00\u5C0F\u90E8\u5206" }, "15": { "east": "\u5C0F\u5174\u5B89\u5CAD", "south": "\u5927\u3001\u5C0F\u5174 \u5B89\u5CAD\u5357\u9E93", "west": "\u5927\u5174\u5B89\u5CAD", "north": "\u56FD\u754C", "range": "\u9ED1\u9F99\u6C5F\u548C\u5185\u8499\u7684\u4E00\u90E8\u5206" }, "16": { "east": "\u56FD\u754C", "south": "\u56FD\u754C\u3001\u9F99 \u6C5F\u5C71\u3001\u516C \u4E3B\u5CAD\u3001\u53CC \u5C71\u3001\u71D5\u5C71 \u5C71\u8109", "west": "\u5927\u5174\u5B89\u5CAD", "north": "\u56FD\u754C\u3001\u5C0F \u5174\u5B89\u5CAD\u5357 \u9E93", "range": "\u677E\u82B1\u6C5F\u5E73\u539F\uFF0C\u5305\u62EC\uFF1A\u9ED1\u9F99 \u6C5F\u3001\u5409\u6797\u3001\u8FBD\u5B81\u3001\u5185\u8499\u7684 \u4E00\u90E8\u5206" }, "17": { "east": "\u9F99\u6C5F\u5C71\u3001\u516C\u4E3B \u5CAD", "south": "\u5343\u5C71\u3001\u8FBD \u4E1C\u6E7E", "west": "\u5927\u5174\u5B89\u5CAD\u4E1C \u9E93", "north": "\u53CC\u5C71", "range": "\u8FBD\u6CB3\u5E73\u539F\u533A\uFF0C\u5305\u62EC\uFF1A\u8FBD\u5B81 \u7684\u5927\u90E8\u5206\uFF0C\u5409\u6797\u3001\u5185\u8499\u3001 \u6CB3\u5317\u7684\u4E00\u90E8\u5206" }, "18": { "east": "\u9E2D\u7EFF\u6C5F", "south": "\u897F\u671D\u9C9C\u6E7E", "west": "\u65C5\u5927\u3001\u672C\u6EAA\u7684 \u8FDE\u7EBF", "north": "\u9F99\u6C5F\u5C71\u3001 \u5343\u5C71", "range": "\u8FBD\u4E1C\u534A\u5C9B\u533A\uFF0C\u5305\u62EC\uFF1A\u8FBD\u5B81 \u7684\u4E00\u90E8\u5206" } };
  var AUX_Z = [{ "feature": "\u9AD81m\u4EE5\u4E0B\u5BC6\u8349\uFF0C1.5m\u4EE5\u4E0B\u5E7C\u6797\uFF0C\u7A00\u704C\u6728\u4E1B\uFF0C\u6839\u6D45\u830E\u7EC6\u7684\u65F1\u7530 \u519C\u4F5C\u7269\uFF08\u5982\u9EA6\u7C7B\uFF09", "z": "5" }, { "feature": "\u9AD81m\u4EE5\u4E0A\u5BC6\u8349\uFF0C1.5m\u4EE5\u4E0A\u5E7C\u6797\uFF0C\u704C\u6728\u4E1B\uFF0C\u6839\u6DF1\u830E\u7C97\u7684\u65F1\u7530\u519C \u4F5C\u7269\uFF08\u5982\u9AD8\u7CB1\uFF09\uFF1B\u5C71\u5730\u6C34\u7A3B\u7530\uFF0C\u7ED3\u5408\u6CBB\u7406\uFF0C\u5761\u9762\u5DF2\u521D\u6B65\u63A7\u5236\u8005", "z": "10" }, { "feature": "\u987A\u5761\u5E26\u57C2\u7684\u68AF\u7530\uFF0C \u6BCF\u4E2A0.1\uFF5E0.2m3\uFF0C\uFF1E10\u4E07\u4E2A\uFF0Fkm2\u7684\u9C7C\u9CDE\u5751\uFF0C 0.3m3/m\u5DE6\u53F3\uFF0C\uFF1E5\u4E07\u4E2A\uFF0Fkm2\u7684\u6C34\u5E73\u6C9F \uFF08\u540E\u4E24\u9879\u5728\u9EC4\u571F\u9AD8\u539F\u6C34\u571F\u6D41\u5931\u4E25\u91CD\u5730\u533A\u4E0D\u8003\u8651\uFF09", "z": "10\uFF5E15" }, { "feature": "\u7A00\u6797\uFF0C\u6811\u51A0\u6240\u906E\u76D6\u7684\u9762\u79EF\u5360\u5168\u9762\u79EF\u7684\u767E\u5206\u6BD4\uFF08\u5373\u90C1\u95ED\u5EA6\uFF09\u4E3A40\uFF05 \u4EE5\u4E0B\uFF0C\u7ED3\u5408\u6CBB\u7406\uFF0C\u5761\u9762\u5DF2\u57FA\u672C\u63A7\u5236\u8005", "z": "15" }, { "feature": "\u5E73\u539F\u6C34\u7A3B\u7530", "z": "20" }, { "feature": "\u4E2D\u7B49\u7A20\u5EA6\u6797\uFF08\u90C1\u95ED\u5EA660\uFF05\u5DE6\u53F3\uFF09", "z": "25" }, { "feature": "\u6C34\u5E73\u5E26\u6897\u6216\u5012\u5761\u7684\u68AF\u7530", "z": "20\uFF5E30" }, { "feature": "\u5BC6\u6797\uFF08\u90C1\u95ED\u5EA680\uFF05\u4EE5\u4E0A\uFF09", "z": "35" }, { "feature": "\u963B\u585E\u5730\u3001\u9752\u82D4\u6CE5\u82D4\u5730\u3001\u6D2A\u6C34\u65F6\u671F\u957F\u6709\u519C\u4F5C\u7269\u7684\u8015\u5730", "z": "20\uFF5E40" }];
  var AUX_BETA = { "distancesKm": ["1", "2", "3", "4", "5", "6", "7", "10"], "plainHilly": ["1", "0.95", "0.90", "0.85", "0.80", "0.75", "0.70", "0.60"], "mountain": ["1", "1", "1", "0.95", "0.90", "0.85", "0.80", "0.70"] };
  var AUX_GAMMA = { "monsoon": { "25": { "30": "1.0" }, "35": { "30": "0.9", "45": "1.0" }, "50": { "30": "0.8", "45": "0.9", "60": "1.0" }, "100": { "30": "0.8", "45": "0.9", "60": "0.9", "80": "1.0" } }, "northwest": { "5": { "30": "0.9", "45": "1.0" }, "10": { "30": "0.8", "45": "0.9", "60": "0.9", "80": "1.0" }, "20": { "30": "0.7", "45": "0.8", "60": "0.8", "80": "0.9", "100": "0.9", "150": "1.0" }, "35": { "30": "0.6", "45": "0.7", "60": "0.7", "80": "0.8", "100": "0.8", "150": "0.9", "200": "1.0" } } };
  var AUX_DELTA = { "lakeRatePct": ["5", "10", "15", "20", "25", "30", "35", "40", "45", "50", "60", "70", "80", "90", "100"], "delta": ["0.99", "0.97", "0.96", "0.94", "0.93", "0.91", "0.90", "0.88", "0.87", "0.85", "0.82", "0.79", "0.76", "0.73", "0.70"] };

  // src/core/auxTable.ts
  function num(s) {
    if (s == null) return null;
    const m = /^\d+(?:\.\d+)?$/.exec(s.trim());
    return m ? Number(s) : null;
  }
  function lookupPsi(terrain, fKm2) {
    if (!Number.isFinite(fKm2) || fKm2 <= 0) throw new Error("\u6C47\u6C34\u9762\u79EF F \u5FC5\u987B\u4E3A\u6B63\uFF08km\xB2\uFF09");
    const rows = AUX_PSI_ROWS.filter((r) => r.terrain === terrain);
    if (!rows.length) {
      throw new Error(`\u5730\u8C8C\u7CFB\u6570\u8868\u4E2D\u6CA1\u6709\u5730\u5F62\u300C${terrain}\u300D\uFF0C\u53EF\u9009\uFF1A${[...new Set(AUX_PSI_ROWS.map((r) => r.terrain))].join("/")}`);
    }
    const bandIdx = fKm2 < 10 ? 0 : fKm2 <= 20 ? 1 : fKm2 <= 30 ? 2 : -1;
    if (bandIdx < 0) throw new Error("\u6C47\u6C34\u9762\u79EF 30 km\xB2 \u4EE5\u4E0A\u4E0D\u9002\u7528\u8868 B-5\uFF08\u5F84\u6D41\u5F62\u6210\u6CD5\u9650 F\u226430 km\xB2\uFF09");
    const row = rows[0];
    const v = num(row.psi[bandIdx]);
    if (v == null) throw new Error(`\u8BE5\u5730\u5F62\u5728 ${AUX_PSI_F_BANDS[bandIdx]} \u6863\u65E0\u8868\u503C`);
    return {
      value: v,
      exact: true,
      note: `${terrain}\uFF08\u4E3B\u6CB3\u6C9F\u5761\u5EA6 ${row.slope}\u2030\uFF09\uFF0C${AUX_PSI_F_BANDS[bandIdx]} km\xB2 \u2192 \u03C8=${v}` + (rows.length > 1 ? `\uFF1B\u8BE5\u5730\u5F62\u5171 ${rows.length} \u6863\u5761\u5EA6\u53EF\u9009` : "")
    };
  }
  function lookupTau(fKm2) {
    if (!Number.isFinite(fKm2) || fKm2 <= 0) throw new Error("\u6C47\u6C34\u9762\u79EF F \u5FC5\u987B\u4E3A\u6B63\uFF08km\xB2\uFF09");
    const bands = [[10, 30], [20, 45], [30, 80]];
    for (const [fMax, tau] of bands) {
      if (fKm2 <= fMax) return { value: tau, exact: true, note: `F=${fKm2} km\xB2 \u2192 \u03C4=${tau} min\uFF08\u8868B-8\uFF09` };
    }
    throw new Error("\u6C47\u6C34\u9762\u79EF\u8D85\u8FC7 30 km\xB2\uFF0C\u8868 B-8 \u4E0D\u9002\u7528\uFF08\u5F84\u6D41\u5F62\u6210\u6CD5\u9650 F\u226430 km\xB2\uFF09");
  }
  function lookupZone(zone) {
    const z = AUX_ZONES[String(zone)];
    if (!z) throw new Error(`\u66B4\u96E8\u5206\u533A\u8868\u4EC5\u6709 1~18 \u533A\uFF0C\u6536\u5230 ${zone}`);
    return z;
  }
  function allZones() {
    return AUX_ZONES;
  }
  function listZ() {
    return AUX_Z.map((r) => ({ feature: r.feature, z: r.z }));
  }
  function lookupBeta(distanceKm, mountainous) {
    if (!Number.isFinite(distanceKm) || distanceKm <= 0) throw new Error("\u8DDD\u79BB\u5FC5\u987B\u4E3A\u6B63\uFF08km\uFF09");
    const dists = AUX_BETA.distancesKm.map(Number);
    const series = mountainous ? AUX_BETA.mountain : AUX_BETA.plainHilly;
    let idx = 0;
    for (let i = 0; i < dists.length; i++) if (distanceKm >= dists[i]) idx = i;
    const v = num(series[idx]);
    if (v == null) throw new Error("\u6298\u51CF\u7CFB\u6570\u8868\u503C\u7F3A\u5931");
    const exact = Math.abs(distanceKm - dists[idx]) < 1e-9;
    return {
      value: v,
      exact,
      note: `${mountainous ? "\u5C71\u5730\u53CA\u5C71\u5CAD" : "\u5E73\u539F\u53CA\u4E18\u9675"}\uFF1A\u6C47\u6C34\u9762\u79EF\u91CD\u5FC3\u8DDD\u6DB5\u4F4D ${distanceKm} km \u2192 \u03B2=${v}` + (exact ? "" : `\uFF08\u6309\u4E0D\u5927\u4E8E\u5B9E\u9645\u8DDD\u79BB\u7684 ${dists[idx]} km \u6863\u53D6\u503C\uFF09`)
    };
  }
  function lookupGamma(tauMin, widthKm, northwest) {
    if (!Number.isFinite(tauMin) || tauMin <= 0) throw new Error("\u6C47\u6D41\u65F6\u95F4\u5FC5\u987B\u4E3A\u6B63\uFF08min\uFF09");
    if (!Number.isFinite(widthKm) || widthKm <= 0) throw new Error("\u6C47\u6C34\u533A\u957F\u5EA6\u6216\u5BBD\u5EA6\u5FC5\u987B\u4E3A\u6B63\uFF08km\uFF09");
    const group = northwest ? AUX_GAMMA.northwest : AUX_GAMMA.monsoon;
    const widths = Object.keys(group).map(Number).sort((a, b) => a - b);
    let wSel = widths[0];
    for (const w of widths) if (widthKm >= w) wSel = w;
    const col = group[String(wSel)] ?? {};
    const taus = Object.keys(col).map(Number).sort((a, b) => a - b);
    if (!taus.length) throw new Error("\u8BE5\u5BBD\u5EA6\u6863\u65E0\u8868\u503C");
    let tSel = taus[taus.length - 1];
    for (const t of taus) if (t >= tauMin) {
      tSel = t;
      break;
    }
    const v = num(col[String(tSel)]);
    if (v == null) throw new Error("\u6298\u51CF\u7CFB\u6570\u8868\u503C\u7F3A\u5931");
    return {
      value: v,
      exact: Math.abs(tauMin - tSel) < 1e-9 && Math.abs(widthKm - wSel) < 1e-9,
      note: `${northwest ? "\u897F\u5317\u548C\u5185\u8499" : "\u5B63\u5019\u98CE\u6C14\u5019"}\u5730\u533A\uFF1A\u5BBD\u5EA6 ${widthKm} km\u3001\u03C4=${tauMin} min \u2192 \u53D6 ${wSel} km / ${tSel} min \u6863 \u03B3=${v}`
    };
  }
  function lookupDelta(lakeRatePct) {
    if (!Number.isFinite(lakeRatePct) || lakeRatePct < 0) throw new Error("\u6E56\u6CCA\u7387 f \u5FC5\u987B\u4E3A\u975E\u8D1F\u767E\u5206\u6570");
    const fs = AUX_DELTA.lakeRatePct.map(Number);
    if (lakeRatePct < fs[0]) {
      return { value: 1, exact: true, note: `\u6E56\u6CCA\u7387 ${lakeRatePct}% < ${fs[0]}%\uFF0C\u89C4\u8303\u672A\u5217\u8868\uFF0C\u6309\u4E0D\u6298\u51CF\u53D6 \u03B4=1` };
    }
    let idx = fs.length - 1;
    for (let i = 0; i < fs.length; i++) if (lakeRatePct <= fs[i]) {
      idx = i;
      break;
    }
    const v = num(AUX_DELTA.delta[idx]);
    if (v == null) throw new Error("\u6298\u51CF\u7CFB\u6570\u8868\u503C\u7F3A\u5931");
    const exact = Math.abs(lakeRatePct - fs[idx]) < 1e-9;
    return {
      value: v,
      exact,
      note: `\u6E56\u6CCA\u7387 ${lakeRatePct}% \u2192 \u53D6 ${fs[idx]}% \u6863 \u03B4=${v}` + (exact ? "" : "\uFF08\u5411\u504F\u5B89\u5168\u65B9\u5411\u53D6\u6863\uFF09")
    };
  }

  // src/core/calcLog.ts
  var LOG_MAX = 200;
  var CalcLog = class {
    constructor() {
      __publicField(this, "entries", []);
    }
    add(e) {
      if (!e.module || !e.module.trim()) throw new Error("\u8BA1\u7B97\u65E5\u5FD7\u7F3A\u5C11\u6A21\u5757\u540D");
      if (!e.results || Object.keys(e.results).length === 0) throw new Error("\u8BA1\u7B97\u65E5\u5FD7\u7F3A\u5C11\u7ED3\u679C");
      if (!e.basis || !e.basis.trim()) throw new Error("\u8BA1\u7B97\u65E5\u5FD7\u7F3A\u5C11\u89C4\u8303\u4F9D\u636E");
      const entry = {
        t: e.t ?? (/* @__PURE__ */ new Date()).toISOString(),
        module: e.module,
        inputs: e.inputs ?? {},
        params: e.params,
        results: e.results,
        basis: e.basis
      };
      this.entries.push(entry);
      if (this.entries.length > LOG_MAX) this.entries.splice(0, this.entries.length - LOG_MAX);
      return entry;
    }
    list() {
      return this.entries;
    }
    size() {
      return this.entries.length;
    }
    clear() {
      this.entries = [];
    }
    // 最近 n 条（倒序：新的在前）
    recent(n) {
      return this.entries.slice(-n).reverse();
    }
    toJSON(indent = 2) {
      return JSON.stringify({ schema: "hongsuan-calc-log@1", entries: this.entries }, null, indent);
    }
    toMarkdown(title = "\u8BA1\u7B97\u65E5\u5FD7") {
      const lines = [
        `# ${title}`,
        "",
        `> \u751F\u6210\u65F6\u95F4\uFF1A${(/* @__PURE__ */ new Date()).toLocaleString("zh-CN")} \uFF5C \u5171 ${this.entries.length} \u6761`,
        "",
        "| \u65F6\u95F4 | \u6A21\u5757 | \u4E3B\u8981\u8F93\u5165 | \u91C7\u7528/\u4E2D\u95F4\u503C | \u7ED3\u679C | \u89C4\u8303\u4F9D\u636E |",
        "| --- | --- | --- | --- | --- | --- |"
      ];
      const fmt2 = (o) => !o ? "\u2014" : Object.entries(o).map(([k, v]) => `${k}=${v}`).join("\uFF1B");
      for (const e of this.entries) {
        const time = new Date(e.t).toLocaleTimeString("zh-CN", { hour12: false });
        lines.push(`| ${time} | ${e.module} | ${fmt2(e.inputs)} | ${fmt2(e.params)} | ${fmt2(e.results)} | ${e.basis} |`);
      }
      return lines.join("\n");
    }
  };
  var calcLog = new CalcLog();

  // src/core/errors.ts
  var HsError = class extends Error {
    constructor(d) {
      super(d.message);
      __publicField(this, "code");
      __publicField(this, "field");
      __publicField(this, "value");
      __publicField(this, "suggestion");
      __publicField(this, "normRef");
      this.name = "HsError";
      this.code = d.code;
      this.field = d.field;
      this.value = d.value;
      this.suggestion = d.suggestion;
      this.normRef = d.normRef;
    }
    toJSON() {
      const d = { code: this.code, message: this.message };
      if (this.field !== void 0) d.field = this.field;
      if (this.value !== void 0) d.value = this.value;
      if (this.suggestion !== void 0) d.suggestion = this.suggestion;
      if (this.normRef !== void 0) d.normRef = this.normRef;
      return d;
    }
  };

  // src/core/plans.ts
  var MULTI_SCHEMA = "hongsuan-multiproject@1";
  function set(obj, path, value) {
    const keys = path.split(".");
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (typeof cur[k] !== "object" || cur[k] === null) cur[k] = {};
      cur = cur[k];
    }
    cur[keys[keys.length - 1]] = value;
  }
  function flatten(obj, prefix = "", out = {}) {
    if (obj === null || obj === void 0) {
      out[prefix] = obj;
      return out;
    }
    if (Array.isArray(obj)) {
      obj.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
      return out;
    }
    if (typeof obj === "object") {
      for (const [k, v] of Object.entries(obj)) {
        flatten(v, prefix ? `${prefix}.${k}` : k, out);
      }
      return out;
    }
    out[prefix] = obj;
    return out;
  }
  function createPlan(name, base, current, note) {
    if (!name.trim()) throw new Error("\u65B9\u6848\u540D\u4E0D\u80FD\u4E3A\u7A7A");
    const fb = flatten(base), fc = flatten(current);
    const deltas = {};
    for (const [k, v] of Object.entries(fc)) {
      if (fb[k] !== v) deltas[k] = v;
    }
    return {
      id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      note,
      deltas
    };
  }
  function applyPlan(base, plan) {
    const out = JSON.parse(JSON.stringify(base));
    for (const [path, v] of Object.entries(plan.deltas)) set(out, path, v);
    return out;
  }
  function diffPlans(base, a, b) {
    const sa = flatten(applyPlan(base, a));
    const sb = flatten(applyPlan(base, b));
    const keys = /* @__PURE__ */ new Set([...Object.keys(sa), ...Object.keys(sb)]);
    const rows = [];
    for (const k of [...keys].sort()) {
      if (sa[k] !== sb[k]) rows.push({ path: k, a: sa[k], b: sb[k] });
    }
    return rows;
  }
  function parseMultiProject(raw) {
    if (typeof raw !== "object" || raw === null) throw new Error("\u591A\u65B9\u6848\u5DE5\u7A0B\u6587\u4EF6\u5185\u5BB9\u975E\u6CD5");
    const o = raw;
    if (o.schema !== MULTI_SCHEMA) {
      throw new Error(`\u4E0D\u652F\u6301\u7684\u5DE5\u7A0B\u683C\u5F0F\uFF1A${String(o.schema)}\uFF08\u5E94\u4E3A ${MULTI_SCHEMA}\uFF09`);
    }
    if (typeof o.data !== "object" || o.data === null) throw new Error("\u7F3A\u5C11\u5171\u4EAB\u6570\u636E data");
    if (!Array.isArray(o.plans)) throw new Error("plans \u5FC5\u987B\u4E3A\u6570\u7EC4");
    return o;
  }

  // src/core/catchment.ts
  function polygonAreaPx(pts) {
    if (!Array.isArray(pts) || pts.length < 3) return 0;
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if (!Number.isFinite(a.x) || !Number.isFinite(a.y) || !Number.isFinite(b.x) || !Number.isFinite(b.y)) {
        throw new Error("\u5750\u6807\u5FC5\u987B\u4E3A\u6709\u9650\u6570\u503C");
      }
      s += a.x * b.y - b.x * a.y;
    }
    return Math.abs(s) / 2;
  }
  function polylineLengthPx(pts) {
    if (!Array.isArray(pts) || pts.length < 2) return 0;
    let d = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = pts[i + 1].x - pts[i].x, dy = pts[i + 1].y - pts[i].y;
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) throw new Error("\u5750\u6807\u5FC5\u987B\u4E3A\u6709\u9650\u6570\u503C");
      d += Math.hypot(dx, dy);
    }
    return d;
  }
  function lonLatToWorldPx(p, z) {
    if (!Number.isFinite(p.lon) || !Number.isFinite(p.lat)) throw new Error("\u7ECF\u7EAC\u5EA6\u5FC5\u987B\u4E3A\u6709\u9650\u6570\u503C");
    if (!Number.isFinite(z) || z < 1 || z > 18) throw new Error("\u7F29\u653E\u7EA7\u522B z \u5E94\u5728 1~18");
    const n = Math.pow(2, z) * 256;
    const lat = Math.max(-85.05112878, Math.min(85.05112878, p.lat));
    const x = (p.lon + 180) / 360 * n;
    const s = Math.sin(lat * Math.PI / 180);
    const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n;
    return { x, y };
  }
  function worldPxToLonLat(x, y, z) {
    if (![x, y, z].every(Number.isFinite)) throw new Error("\u50CF\u7D20\u5750\u6807\u4E0E\u7F29\u653E\u7EA7\u522B\u5FC5\u987B\u4E3A\u6709\u9650\u6570\u503C");
    const n = Math.pow(2, z) * 256;
    const lon = x / n * 360 - 180;
    const e = Math.exp((0.5 - y / n) * 4 * Math.PI);
    const lat = Math.asin((e - 1) / (e + 1)) * 180 / Math.PI;
    return { lon, lat };
  }
  function haversineKm(a, b) {
    const R = 6371.0088;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLon = (b.lon - a.lon) * Math.PI / 180;
    const la1 = a.lat * Math.PI / 180, la2 = b.lat * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function polylineLengthKm(pts) {
    if (!Array.isArray(pts) || pts.length < 2) return 0;
    let d = 0;
    for (let i = 0; i < pts.length - 1; i++) d += haversineKm(pts[i], pts[i + 1]);
    return d;
  }
  function geoPolygonAreaKm2(pts) {
    if (!Array.isArray(pts) || pts.length < 3) return 0;
    const lat0 = pts.reduce((s2, p) => s2 + p.lat, 0) / pts.length;
    const kx = 111.32 * Math.cos(lat0 * Math.PI / 180);
    const ky = 110.57;
    const xy = pts.map((p) => ({ x: p.lon * kx, y: p.lat * ky }));
    let s = 0;
    for (let i = 0; i < xy.length; i++) {
      const a = xy[i], b = xy[(i + 1) % xy.length];
      s += a.x * b.y - b.x * a.y;
    }
    return Math.abs(s) / 2;
  }
  function measureFromLonLat(input) {
    const { poly, river, hTop, hBottom } = input;
    const warnings = [];
    if (!Array.isArray(poly) || poly.length < 3) throw new Error("\u6C47\u6C34\u533A\u81F3\u5C11\u9700\u8981 3 \u4E2A\u9876\u70B9\uFF08\u7ECF\u7EAC\u5EA6\uFF09");
    const F = geoPolygonAreaKm2(poly);
    let L = null;
    if (river && river.length >= 2) {
      const l = polylineLengthKm(river);
      L = l > 0 ? l : null;
      if (L === null) warnings.push("\u4E3B\u6CB3\u6C9F\u957F\u5EA6\u91CF\u7B97\u4E3A 0\uFF0C\u8BF7\u68C0\u67E5\u70B9\u4F4D\u662F\u5426\u91CD\u590D");
    }
    let I = null, Ipermille = null;
    if (L !== null && Number.isFinite(hTop) && Number.isFinite(hBottom)) {
      const dh = hTop - hBottom;
      if (dh < 0) warnings.push("\u4E0A\u6E38\u9AD8\u7A0B\u4F4E\u4E8E\u51FA\u53E3\u9AD8\u7A0B\uFF0C\u6BD4\u964D\u4E3A\u8D1F\uFF0C\u8BF7\u6838\u5BF9\u9AD8\u7A0B\u70B9\u6B21\u5E8F");
      I = dh / (L * 1e3);
      Ipermille = I * 1e3;
    }
    if (F > 30) warnings.push("\u6C47\u6C34\u9762\u79EF >30 km\xB2\uFF1A\u89C4\u8303\u5F84\u6D41\u5F62\u6210\u6CD5\u9650 F\u226430 km\xB2\uFF0C\u65B9\u6CD5 C \u4F1A\u62A5\u9519");
    if (!(F > 0)) warnings.push("\u6C47\u6C34\u9762\u79EF\u91CF\u7B97\u4E3A 0\uFF1A\u8BF7\u68C0\u67E5\u591A\u8FB9\u5F62\u9876\u70B9\u987A\u5E8F\u4E0E\u662F\u5426\u95ED\u5408");
    return {
      F: Math.round(F * 1e4) / 1e4,
      L: L === null ? null : Math.round(L * 1e4) / 1e4,
      I: I === null ? null : Math.round(I * 1e8) / 1e8,
      Ipermille: Ipermille === null ? null : Math.round(Ipermille * 1e4) / 1e4,
      warnings
    };
  }
  function measureCatchment(input) {
    const { poly, river, scale, hTop, hBottom } = input;
    const warnings = [];
    if (!scale || !Number.isFinite(scale.pixelDistance) || scale.pixelDistance <= 0) {
      throw new Error("\u6BD4\u4F8B\u5C3A\u6807\u5B9A\u65E0\u6548\uFF1A\u56FE\u4E0A\u8DDD\u79BB\u5FC5\u987B\u4E3A\u6B63\uFF08\u50CF\u7D20\uFF09");
    }
    if (!Number.isFinite(scale.realDistanceM) || scale.realDistanceM <= 0) {
      throw new Error("\u6BD4\u4F8B\u5C3A\u6807\u5B9A\u65E0\u6548\uFF1A\u5BF9\u5E94\u7684\u5B9E\u9645\u8DDD\u79BB\u5FC5\u987B\u4E3A\u6B63\uFF08m\uFF09");
    }
    if (!Array.isArray(poly) || poly.length < 3) {
      throw new Error("\u6C47\u6C34\u533A\u81F3\u5C11\u9700\u8981 3 \u4E2A\u9876\u70B9\u624D\u80FD\u6784\u6210\u591A\u8FB9\u5F62");
    }
    const mpp = scale.realDistanceM / scale.pixelDistance;
    const areaPx = polygonAreaPx(poly);
    const areaM2 = areaPx * mpp * mpp;
    const F = areaM2 / 1e6;
    let L = null;
    if (river && river.length >= 2) {
      L = polylineLengthPx(river) * mpp / 1e3;
      if (!(L > 0)) {
        L = null;
        warnings.push("\u4E3B\u6CB3\u6C9F\u957F\u5EA6\u91CF\u7B97\u4E3A 0\uFF0C\u8BF7\u68C0\u67E5\u662F\u5426\u91CD\u590D\u70B9\u6216\u70B9\u8DDD\u8FC7\u5C0F");
      }
    }
    let I = null, Ipermille = null;
    if (L !== null && Number.isFinite(hTop) && Number.isFinite(hBottom)) {
      const dh = hTop - hBottom;
      if (dh < 0) warnings.push("\u4E0A\u6E38\u9AD8\u7A0B\u4F4E\u4E8E\u51FA\u53E3\u9AD8\u7A0B\uFF0C\u6BD4\u964D\u4E3A\u8D1F\uFF0C\u8BF7\u6838\u5BF9\u9AD8\u7A0B\u70B9\u6B21\u5E8F");
      I = dh / (L * 1e3);
      Ipermille = I * 1e3;
    }
    if (F > 30) {
      warnings.push("\u6C47\u6C34\u9762\u79EF >30 km\xB2\uFF1A\u89C4\u8303\u5F84\u6D41\u5F62\u6210\u6CD5\u9650 F\u226430 km\xB2\uFF0C\u65B9\u6CD5 C \u4F1A\u62A5\u9519\uFF0C\u8BF7\u6539\u7528\u5176\u4ED6\u65B9\u6CD5");
    }
    if (F <= 0) warnings.push("\u6C47\u6C34\u9762\u79EF\u91CF\u7B97\u4E3A 0\uFF1A\u8BF7\u68C0\u67E5\u591A\u8FB9\u5F62\u662F\u5426\u95ED\u5408\u3001\u6BD4\u4F8B\u5C3A\u662F\u5426\u6B63\u786E");
    return {
      F: Math.round(F * 1e4) / 1e4,
      L: L === null ? null : Math.round(L * 1e4) / 1e4,
      I: I === null ? null : Math.round(I * 1e8) / 1e8,
      Ipermille: Ipermille === null ? null : Math.round(Ipermille * 1e4) / 1e4,
      metersPerPixel: Math.round(mpp * 1e6) / 1e6,
      areaPx: Math.round(areaPx * 100) / 100,
      warnings
    };
  }

  // src/core/helpContent.ts
  var HELP_SECTIONS = [
    {
      id: "flow",
      title: "\u4E00\u3001\u8BBE\u8BA1\u6D41\u91CF\u63A8\u6C42\uFF08\u7B2C 6 \u7AE0\uFF09",
      spec: "JTG C30\u20142015",
      items: [
        { no: "6.2", title: "\u5229\u7528\u5B9E\u6D4B\u6D41\u91CF\u7CFB\u5217\u63A8\u7B97\u8BBE\u8BA1\u6D41\u91CF", summary: "\u6709\u5B9E\u6D4B\u7CFB\u5217\u65F6\uFF0C\u7528\u77E9\u6CD5\u521D\u4F30\u7EDF\u8BA1\u53C2\u6570\uFF0C\u518D\u6309\u9002\u7EBF\u6CD5\u8C03\u6574 Cv\u3001Cs\uFF08Cs \u5E38\u53D6 m\xB7Cv\uFF0Cm \u4E00\u822C 2~4\uFF09\uFF0C\u4F7F\u7406\u8BBA\u9891\u7387\u66F2\u7EBF\u4E0E\u7ECF\u9A8C\u70B9\u636E\u62DF\u5408\u6700\u4F73\u3002", page: "P19" },
        { no: "6.2.5", title: "\u53C2\u6570\u521D\u4F30\u65B9\u6CD5", summary: "\u77E9\u6CD5\uFF08\u8F6F\u4EF6\u9ED8\u8BA4\uFF09\u4E0E\u4E09\u70B9\u6CD5\uFF08\u53D6 P=5%\u300150%\u300195% \u4E09\u70B9\uFF0C\u7531 S \u503C\u53CD\u89E3 Cs\uFF09\u5E76\u7528\uFF1B\u8F6F\u4EF6\u53E6\u63D0\u4F9B\u6700\u5C0F\u4E8C\u4E58\u81EA\u52A8\u5BFB\u4F18\u4F5C\u5BF9\u7167\u3002", page: "P19~20" },
        { no: "6.3", title: "\u5229\u7528\u5386\u53F2\u6D2A\u6C34\u4F4D\u63A8\u7B97\u8BBE\u8BA1\u6D41\u91CF", summary: "\u65E0\u5B9E\u6D4B\u7CFB\u5217\u4F46\u6709\u53EF\u9760\u6D2A\u75D5\u65F6\uFF0C\u7528\u66FC\u5B81\u516C\u5F0F\u7531\u6D2A\u6C34\u4F4D\u3001\u6BD4\u964D\u3001\u7CD9\u7387\u53CD\u63A8\u6D41\u91CF\uFF1B\u6709\u4E24\u6B21\u4EE5\u4E0A\u6D2A\u6C34\u65F6\u6309\u89C4\u8303\u7EFC\u5408\u63A8\u7B97\u3002", page: "P21" },
        { no: "6.3.1-4", title: "\u6C34\u9762\u7EBF\u8BD5\u7B97\uFF08\u8F6F\u4EF6\u65B0\u589E\uFF09", summary: "\u5047\u5B9A\u6D41\u91CF\u7531\u4E0B\u6E38\u6D2A\u75D5\u5411\u4E0A\u6E38\u63A8\u7B97\u6C34\u9762\u7EBF\uFF0C\u4E0E\u4E0A\u6E38\u6D2A\u75D5\u5BF9\u7167\u8FED\u4EE3\uFF1B\u8F6F\u4EF6\u63D0\u4F9B\u76F4\u63A5\u6B65\u8FDB\u6CD5\u5256\u9762\u8BA1\u7B97\u4E0E\u4E24\u6D2A\u75D5\u53CD\u89E3 Q\u3002", page: "P21~23" },
        { no: "6.4", title: "\u8BBE\u8BA1\u6D41\u91CF\u8BA1\u7B97\u7684\u5176\u4ED6\u65B9\u6CD5", summary: "\u65E0\u8D44\u6599\u5730\u533A\u91C7\u7528\u5730\u533A\u7ECF\u9A8C\u516C\u5F0F\u3001\u66B4\u96E8\u63A8\u7406\u6CD5\u3001\u5F84\u6D41\u5F62\u6210\u6CD5\u7B49\uFF08\u8BE6\u89C1\u300A\u516C\u8DEF\u6DB5\u6D1E\u8BBE\u8BA1\u89C4\u8303\u300B\u7B2C 6 \u7AE0\uFF09\u3002", page: "P23" },
        { no: "6.6", title: "\u8BBE\u8BA1\u6D2A\u6C34\u8FC7\u7A0B\u7EBF", summary: "\u8F6F\u4EF6\u5B9E\u73B0\u540C\u500D\u6BD4\u653E\u5927\u6CD5 kg=Qp/Q\u5178\u578B\u5CF0\uFF1B\u540C\u9891\u7387\u653E\u5927\u6CD5\u6D89\u53CA\u65F6\u6BB5\u6D2A\u91CF\u5212\u5206\u89C4\u5219\uFF0C\u89C4\u8303\u539F\u6587\u5F85\u6838\uFF0C\u672C\u7248\u672A\u63D0\u4F9B\u3002", page: "P24" }
      ]
    },
    {
      id: "opening",
      title: "\u4E8C\u3001\u6865\u5B54\u8BBE\u8BA1\uFF08\u7B2C 7 \u7AE0\uFF09",
      spec: "JTG C30\u20142015",
      items: [
        { no: "7.2.1-1", title: "\u6CB3\u69FD\u5BBD\u5EA6\u516C\u5F0F\uFF08\u8F6F\u4EF6\u5DF2\u5B9E\u73B0\uFF09", summary: "Lj = Kq\xB7(Qp/Qc)^n\u2083\xB7Bc\uFF0C\u9002\u7528\u4E8E\u5F00\u9614\u3001\u987A\u76F4\u5FAE\u5F2F\u3001\u5206\u6C4A\u3001\u5F2F\u66F2\u6CB3\u6BB5\u53CA\u6EE9\u69FD\u53EF\u5206\u7684\u4E0D\u7A33\u5B9A\u6CB3\u6BB5\u3002", page: "P25" },
        { no: "\u8868 7.2.1", title: "Kq\u3001n\u2083 \u53D6\u503C", summary: "\u7A33\u5B9A\uFF08\u5F00\u9614\u3001\u987A\u76F4\u5FAE\u5F2F\uFF090.84 / 0.90\uFF1B\u6B21\u7A33\u5B9A\uFF08\u5206\u6C4A\u3001\u5F2F\u66F2\uFF090.95 / 0.87\uFF1B\u4E0D\u7A33\u5B9A\uFF08\u6EE9\u69FD\u53EF\u5206\uFF090.69 / 1.59\u3002", page: "P26" },
        { no: "7.2.1-2~3", title: "\u5BBD\u6EE9\u6CB3\u6BB5\uFF08\u5F85\u5B9E\u73B0\uFF09", summary: "\u53E6\u6709\u5355\u5BBD\u6D41\u91CF\u516C\u5F0F\uFF0C\u9700 \u03B2 \u6C34\u6D41\u538B\u7F29\u7CFB\u6570\u7B49\u53C2\u6570\uFF1B\u89C4\u8303\u539F\u6587\u4E3A\u56FE\u7247\uFF0C\u5F85\u5F55\u5165\u540E\u8865\u9F50\u3002", page: "P26" },
        { no: "7.2.1-4~6", title: "\u6EE9\u69FD\u96BE\u5206\u4E0D\u7A33\u5B9A\u6CB3\u6BB5\uFF08\u5F85\u5B9E\u73B0\uFF09", summary: "\u53E6\u6709\u57FA\u672C\u6CB3\u69FD\u5BBD\u5EA6 B0 \u516C\u5F0F\uFF0C\u6D89\u53CA\u6D2A\u5CF0\u6D41\u91CF\u5747\u503C\u3001\u6CE5\u6C99\u5E73\u5747\u7C92\u5F84\u3001\u9891\u7387\u6362\u7B97\u7CFB\u6570\uFF1B\u5F85\u89C4\u8303\u539F\u6587\u5F55\u5165\u3002", page: "P26" },
        { no: "7.2.2", title: "\u6865\u957F\u7EFC\u5408\u8BBA\u8BC1", summary: "\u6700\u5C0F\u51C0\u957F\u5EA6\u53EA\u662F\u4E0B\u9650\uFF0C\u6700\u7EC8\u6865\u957F\u5E94\u7ED3\u5408\u5730\u5F62\u3001\u5730\u8D28\u3001\u58C5\u6C34\u3001\u51B2\u5237\u3001\u5F15\u9053\u7EB5\u5761\u4E0E\u53F0\u540E\u586B\u571F\u9AD8\u5EA6\u6280\u672F\u7ECF\u6D4E\u6BD4\u8F83\u786E\u5B9A\u3002", page: "P26" }
      ]
    },
    {
      id: "scour",
      title: "\u4E09\u3001\u58A9\u53F0\u51B2\u5237\u4E0E\u57CB\u6DF1\uFF08\u7B2C 8 \u7AE0\uFF09",
      spec: "JTG C30\u20142015",
      items: [
        { no: "8.3.1-4", title: "64-1 \u4FEE\u6B63\u5F0F\uFF08\u4E00\u822C\u51B2\u5237\uFF0C\u5DF2\u5B9E\u73B0\uFF09", summary: "hp = [A\xB7(Q2/(\u03BC\xB7Bcj))\xB7(hmc/hcq)^(5/3) / (E\xB7d\u0304^(1/6))]^(3/5)\uFF1B\u975E\u9ECF\u6027\u571F\u6CB3\u69FD\u90E8\u5206\u3002", page: "P30" },
        { no: "\u8868 8.3.1-2", title: "\u542B\u6C99\u91CF\u7CFB\u6570 E\uFF08\u5DF2\u5185\u7F6E\uFF09", summary: "\u6C5B\u671F\u542B\u6C99\u91CF \u03C1<1.0\u21920.46\uFF1B1~10\u21920.66\uFF1B>10\u21920.86\uFF08kg/m\xB3\uFF09\u3002", page: "P31" },
        { no: "8.3.3-2", title: "\u884C\u8FD1\u6D41\u901F\uFF08\u5DF2\u5B9E\u73B0\uFF09", summary: "\u91C7\u7528 64-1 \u65F6 v = E\xB7d\u0304^(1/6)\xB7hp^(2/3)\uFF0C\u53EF\u7531 64-1 \u516C\u5F0F\u63A8\u5BFC\u81EA\u6D3D\uFF08\u8F6F\u4EF6\u5DF2\u505A\u95ED\u5408\u6821\u9A8C\uFF09\u3002", page: "P32" },
        { no: "8.4.1", title: "65-2 \u5F0F\uFF08\u5C40\u90E8\u51B2\u5237\uFF0C\u5DF2\u5B9E\u73B0\uFF09", summary: "hb = K\u03BE\xB7K\u03B72\xB7B1^0.6\xB7hp^0.15\xB7[(v\u2212v0\u2032)/v0]^n2\uFF1Bv\u2264v0\u2032 \u65F6\u4E0D\u51B2\u5237\u3002K\u03BE \u6309\u9644\u5F55 C \u58A9\u5F62\u67E5\u8868\u624B\u586B\u3002", page: "P33" },
        { no: "8.6.1~8.6.2", title: "\u57FA\u5E95\u6700\u5C0F\u57CB\u7F6E\u6DF1\u5EA6", summary: "\u57CB\u6DF1\u5E94\u53D6\u81EA\u7136\u6F14\u53D8\u3001\u4E00\u822C\u3001\u5C40\u90E8\u51B2\u5237\u7684\u4E0D\u5229\u7EC4\u5408\uFF1B\u975E\u5CA9\u77F3\u6CB3\u5E8A\u8FD8\u5E94\u6309\u8868 8.6.2 \u52A0\u57CB\u6DF1\u5B89\u5168\u503C\uFF08\u8BE5\u8868\u672C\u7248\u672A\u5185\u7F6E\uFF0C\u9700\u67E5\u89C4\u8303\u539F\u8868\uFF09\u3002", page: "P35~36" },
        { no: "8.4.3 / \u9644\u5F55D", title: "\u6865\u53F0\u51B2\u5237\u4E0E\u5CA9\u77F3\u51B2\u5237\uFF08\u5F85\u5B9E\u73B0\uFF09", summary: "\u6865\u53F0\u5C40\u90E8\u51B2\u5237\u6309 8.4.3\uFF08\u53F0\u5F62\u7CFB\u6570\u8868 8.4.3\uFF09\uFF1B\u5CA9\u77F3\u51B2\u5237\u6309\u9644\u5F55 D \u5206\u6790\u3002", page: "P33 / P77" }
      ]
    },
    {
      id: "culvert",
      title: "\u56DB\u3001\u65E0\u8D44\u6599\u5730\u533A\u4E0E\u6DB5\u6D1E\u6C34\u6587\uFF08\u6DB5\u6D1E\u89C4\u8303\uFF09",
      spec: "JTG/T 3365-02\u20142020",
      items: [
        { no: "6.3", title: "\u5F84\u6D41\u5F62\u6210\u6CD5\uFF08\u65B9\u6CD5 C \u4E4B\u4E00\uFF09", summary: "Qp = \u03C8\xB7(h\u2212z)^1.5\xB7F^0.8\xB7\u03B2\xB7\u03B3\xB7\u03B4\uFF1B\u9002\u7528\u6C47\u6C34\u9762\u79EF\u4E0D\u5927\u4E8E 30 km\xB2 \u7684\u5C0F\u6D41\u57DF\u3002", page: "P37" },
        { no: "\u8868 B-9", title: "\u5F84\u6D41\u539A\u5EA6 h\uFF08\u5DF2\u5185\u7F6E\u5168\u8868\uFF09", summary: "18 \u66B4\u96E8\u5206\u533A \xD7 \u571F\u7684\u7C7B\u5C5E \u2160~\u2165 \xD7 \u9891\u7387 1%/2%/4% \xD7 \u6C47\u6D41\u65F6\u95F4 30/45/60/80 min\uFF0C\u5171 108 \u884C\uFF0C\u652F\u6301 \u03C4 \u7EBF\u6027\u4E0E\u9891\u7387\u5BF9\u6570\u63D2\u503C\u3002", page: "P104~107" },
        { no: "\u8868 B-5 / B-8", title: "\u03C8 \u4E0E\u6C47\u6D41\u65F6\u95F4 \u03C4\uFF08\u5DF2\u5185\u7F6E\uFF09", summary: "\u03C8 \u6309\u5730\u5F62\u4E0E\u4E3B\u6CB3\u6C9F\u5761\u5EA6\u3001\u6C47\u6C34\u9762\u79EF\u6863\u53D6\uFF1B\u03C4 \u6309 F \u5206\u6863\uFF1AF\u226410\u219230\u300110<F\u226420\u219245\u300120<F\u226430\u219280 min\u3002", page: "P100 / P104" },
        { no: "\u8868 B-10~B-13", title: "z\u3001\u03B2\u3001\u03B3\u3001\u03B4\uFF08\u5DF2\u5185\u7F6E\uFF09", summary: "\u6EDE\u7559\u539A\u5EA6 z \u6309\u5730\u9762\u7279\u5F81\uFF1B\u03B2 \u6309\u91CD\u5FC3\u8DDD\u6DB5\u4F4D\u8DDD\u79BB\u4E0E\u5730\u5F62\uFF1B\u03B3 \u6309\u6C47\u6D41\u65F6\u95F4\u4E0E\u6C47\u6C34\u533A\u5C3A\u5BF8\u53CA\u6C14\u5019\u533A\uFF1B\u03B4 \u6309\u6E56\u6CCA\u7387\u3002", page: "P108~109" },
        { no: "\u8868 B-6 / B-14", title: "\u66B4\u96E8\u5206\u533A\u4E0E Cv \u5E73\u5747\u503C\uFF08\u5DF2\u5185\u7F6E\uFF09", summary: "18 \u4E2A\u66B4\u96E8\u5206\u533A\u7684\u754C\u7EBF\u4E0E\u8986\u76D6\u8303\u56F4\u53EF\u5173\u952E\u8BCD\u68C0\u7D22\uFF08\u7701\u4EFD/\u5C71\u5DDD\uFF09\uFF1B\u5C0F\u6D41\u57DF Cv \u5E73\u5747\u503C\u6309\u571F\u7684\u5438\u6C34\u7C7B\u5C5E\u53D6\u3002", page: "P100~101 / P109" }
      ]
    }
  ];
  var HELP_SOURCES = [
    {
      name: "JTG C30\u20142015\u300A\u516C\u8DEF\u5DE5\u7A0B\u6C34\u6587\u52D8\u6D4B\u8BBE\u8BA1\u89C4\u8303\u300B",
      detail: "\u4EA4\u901A\u8FD0\u8F93\u90E8\u653F\u5E9C\u4FE1\u606F\u516C\u5F00\u7F51\u5168\u6587 PDF\uFF08126 \u9875\uFF0C\u626B\u63CF\u7248\uFF09\u3002\u7B2C 6/7/8 \u7AE0\u6761\u6587\u4E0E\u7CFB\u6570\u8868\u7ECF\u6E32\u67D3 OCR \u5B9A\u4F4D\u540E\u6838\u5BF9\u3002",
      url: "https://xxgk.mot.gov.cn/2020/jigou/glj/202006/P020240607596475014848.pdf"
    },
    {
      name: "JTG/T 3365-02\u20142020\u300A\u516C\u8DEF\u6DB5\u6D1E\u8BBE\u8BA1\u89C4\u8303\u300B",
      detail: "\u4EA4\u901A\u8FD0\u8F93\u90E8\u516C\u544A 2020 \u5E74\u7B2C 88 \u53F7\u9644\u4EF6\uFF08\u4E2D\u56FD\u653F\u5E9C\u7F51\u516C\u5F00\u5168\u6587 PDF\uFF0C118 \u9875\u6587\u5B57\u7248\uFF09\u3002\u9644\u5F55 B \u5168\u90E8\u6C34\u6587\u67E5\u8868\u7531\u6B64\u63D0\u53D6\u3002",
      url: "https://www.gov.cn/zhengce/zhengceku/2020-11/20/content_5562849.htm"
    },
    {
      name: "\u63D0\u53D6\u4E0E\u6821\u9A8C\u811A\u672C",
      detail: "extract_appendix_b.py\uFF08\u8868 B-9\uFF09\xB7 extract_aux_tables.py\uFF08B-5/B-6/B-8/B-10~B-14\uFF09\xB7 ocr_spec_pages.py\uFF08\u626B\u63CF\u7248\u7AE0\u8282 OCR\uFF09\xB7 gen_*_ts.py\uFF08\u751F\u6210\u5185\u7F6E\u6570\u636E\u6A21\u5757\uFF09\u3002"
    },
    {
      name: "\u5916\u90E8\u7B97\u4F8B\u4E92\u8BC1",
      detail: "\u516C\u5F0F\u7ED3\u6784\u4E0E\u7CFB\u6570\u7ECF\u516C\u5F00\u5DE5\u7A0B\u7B97\u4F8B\u4E0E\u671F\u520A\u8BBA\u6587\u6240\u5F15\u89C4\u8303\u516C\u5F0F\u4EA4\u53C9\u9A8C\u8BC1\uFF08\u6865\u5B54 154.16 m / 23.52 m \u4E24\u4F8B\uFF1B\u51B2\u5237\u51B2\u6B62\u6D41\u901F\u95ED\u5408\u6821\u9A8C\uFF09\u3002"
    }
  ];
  var HELP_FAQ = [
    { q: "\u63D0\u793A\u300C\u5F84\u6D41\u539A\u5EA6\u8868\u4E2D\u6CA1\u6709\u5206\u533A X / \u571F\u58E4 Y\u300D\uFF1F", a: "\u8BE5\u5206\u533A\u8BE5\u571F\u7C7B\u5728\u89C4\u8303\u539F\u8868\u4E2D\u4E3A\u300C-\u300D\uFF08\u65E0\u8868\u503C\uFF09\uFF0C\u8F6F\u4EF6\u6309\u7F3A\u503C\u5254\u9664\uFF0C\u4E0D\u7ED9\u4F30\u7B97\u6570\u2014\u2014\u8BF7\u6539\u7528\u76F8\u90BB\u571F\u7C7B\u6216\u67E5\u89C4\u8303\u539F\u8868\u786E\u8BA4\u3002" },
    { q: "\u67E5\u51FA\u7684 h \u540E\u9762\u6807\u6CE8\u300C\u5916\u63A8\u300D\u662F\u4EC0\u4E48\u610F\u601D\uFF1F", a: "\u8868\u5217\u9891\u7387\u53EA\u6709 1%/2%/4%\uFF08\u91CD\u73B0\u671F 100/50/25 \u5E74\uFF09\u3002\u4F60\u8F93\u5165\u7684\u9891\u7387\u5728\u8868\u5916\u65F6\uFF0C\u8F6F\u4EF6\u6309\u5BF9\u6570\u9891\u7387\u8F74\u5916\u63A8\u7ED9\u51FA\u53C2\u8003\u503C\uFF0C\u5E76\u660E\u786E\u6807\u6CE8\uFF0C\u4E0D\u80FD\u5F53\u8868\u503C\u7528\u3002" },
    { q: "\u6865\u5B54\u957F\u5EA6\u7B97\u51FA\u6765\u5C31\u662F\u6700\u7EC8\u6865\u957F\u5417\uFF1F", a: "\u4E0D\u662F\u3002\u89C4\u8303 7.2.2 \u660E\u786E\u6700\u5C0F\u51C0\u957F\u5EA6\u53EA\u662F\u4E0B\u9650\uFF0C\u8FD8\u9700\u7ED3\u5408\u5730\u5F62\u3001\u5730\u8D28\u3001\u58C5\u6C34\u3001\u51B2\u5237\u3001\u7EB5\u5761\u7EFC\u5408\u8BBA\u8BC1\u3002" },
    { q: "\u51B2\u5237\u8BA1\u7B97\u91CC K\u03BE \u600E\u4E48\u53D6\uFF1F", a: "\u6309\u89C4\u8303\u9644\u5F55 C \u4F9D\u58A9\u5F62\uFF08\u5706\u7AEF\u5F62\u3001\u5C16\u7AEF\u5F62\u3001\u77E9\u5F62\u7B49\uFF09\u67E5\u8868\u3002\u8F6F\u4EF6\u4E0D\u5185\u7F6E\u8BE5\u8868\uFF0C\u9ED8\u8BA4 1.0 \u5E76\u63D0\u793A\u590D\u6838\u3002" },
    { q: "\u4E3A\u4EC0\u4E48\u67D0\u4E9B\u7CFB\u6570\u8868\u6CA1\u5185\u7F6E\uFF1F", a: "\u51E1\u662F\u626B\u63CF\u7248\u4E2D\u516C\u5F0F\u672C\u4F53\u4E3A\u56FE\u7247\u3001\u6216\u8868\u683C\u6863\u4F4D\u8FB9\u754C OCR \u4E0D\u5B8C\u6574\u7684\uFF0C\u4E00\u5F8B\u4E0D\u5185\u7F6E\u53EF\u7591\u6570\u636E\uFF0C\u754C\u9762\u4F1A\u7EA2\u5B57\u8BF4\u660E\u5F85\u5F55\u3002" }
  ];
  var HELP_VALIDATION = [
    "\u6559\u6750\u300A\u6865\u6DB5\u6C34\u6587\u300B\u7B2C\u4E94\u7248\u4F8B 3-1-1 \u5BF9\u6807\u300A\u6865\u4F4D\u8BBE\u8BA1\u8BA1\u7B97\u7CFB\u7EDF\u300BQW2.0\uFF1AQ\u2081% 4824 / 4840\uFF0CQ\u2082% 4301 / 4311\uFF0CQ\u2080.\u2083\u2083% 5647 / 5666\uFF0C\u504F\u5DEE\u5747 \u22640.35%",
    "\u6C34\u6587\u7B97\u4F8B T1~T4 \u4E0E\u516C\u5F00\u8D44\u6599\u4EA4\u53C9\u6838\u5BF9\uFF0C\u5E76\u7EA0\u6B63\u4E24\u5904\u516C\u5F00\u8D44\u6599\u52D8\u8BEF\uFF08\u03A3d\xB2\u3001\u03A6 \u6821\u6838\u503C\uFF09",
    "\u5355\u5143\u6D4B\u8BD5\u8986\u76D6\u7EDF\u8BA1\u3001\u9002\u7EBF\u3001\u4E09\u70B9\u6CD5\u3001\u81EA\u52A8\u5BFB\u4F18\u3001\u8D1D\u53F6\u65AF\u3001\u65B9\u6CD5 B/C\u3001\u6C34\u9762\u7EBF\u3001\u8FC7\u7A0B\u7EBF\u3001\u67E5\u8868\u3001\u6865\u5B54\u3001\u51B2\u5237\u3001\u65E5\u5FD7",
    "\u4E09\u7AEF E2E\uFF1A\u7F51\u9875\u7248\u3001Electron \u684C\u9762\u7248\u3001\u79BB\u7EBF\u5355\u6587\u4EF6\u7248\u5168\u6D41\u7A0B\u9A8C\u8BC1"
  ];

  // src/core/projectDiff.ts
  function flatten2(obj, prefix = "", out = {}, maxArray = 40) {
    if (obj === null || obj === void 0) {
      out[prefix] = String(obj);
      return out;
    }
    if (Array.isArray(obj)) {
      const n = Math.min(obj.length, maxArray);
      for (let i = 0; i < n; i++) flatten2(obj[i], `${prefix}[${i}]`, out, maxArray);
      if (obj.length > maxArray) out[`${prefix}.length`] = String(obj.length);
      return out;
    }
    if (typeof obj === "object") {
      for (const [k, v] of Object.entries(obj)) {
        flatten2(v, prefix ? `${prefix}.${k}` : k, out, maxArray);
      }
      return out;
    }
    out[prefix] = String(obj);
    return out;
  }
  var IGNORE = [/^savedAt$/, /^schema$/, /^appVersion$/];
  function diffProjectFiles(a, b) {
    const fa = flatten2(a);
    const fb = flatten2(b);
    const keys = /* @__PURE__ */ new Set([...Object.keys(fa), ...Object.keys(fb)]);
    const rows = [];
    const added = [];
    const removed = [];
    for (const k of [...keys].sort()) {
      if (IGNORE.some((re) => re.test(k))) continue;
      const va = fa[k], vb = fb[k];
      if (va === void 0) {
        added.push(k);
        continue;
      }
      if (vb === void 0) {
        removed.push(k);
        continue;
      }
      if (va === vb) continue;
      const na = Number(va), nb = Number(vb);
      const numeric = va.trim() !== "" && vb.trim() !== "" && Number.isFinite(na) && Number.isFinite(nb);
      rows.push({
        path: k,
        a: va,
        b: vb,
        delta: numeric ? (nb - na >= 0 ? "+" : "") + String(Math.round((nb - na) * 1e6) / 1e6) : void 0
      });
    }
    const label = (o) => {
      const r = flatten2(o);
      const name = r["project.name"] ?? "";
      const t = o?.savedAt;
      return `${name}${t ? `\uFF08${String(t).slice(0, 10)}\uFF09` : ""}`;
    };
    return { rows, added, removed, aLabel: label(a), bLabel: label(b) };
  }
  function diffToMarkdown(d) {
    const lines = [
      "# \u5DE5\u7A0B\u6587\u4EF6\u7248\u672C\u5BF9\u6BD4",
      "",
      `> \u65E7\u7248\uFF1A${d.aLabel || "\u2014"} \uFF5C \u65B0\u7248\uFF1A${d.bLabel || "\u2014"}`,
      "",
      `\u53D8\u5316\u9879 ${d.rows.length} \u4E2A\uFF1B\u65B0\u589E\u5B57\u6BB5 ${d.added.length} \u4E2A\uFF1B\u5220\u9664\u5B57\u6BB5 ${d.removed.length} \u4E2A`,
      "",
      "| \u5B57\u6BB5 | \u65E7\u503C | \u65B0\u503C | \u53D8\u5316 |",
      "| --- | --- | --- | --- |"
    ];
    for (const r of d.rows) {
      lines.push(`| ${r.path} | ${r.a} | ${r.b} | ${r.delta ?? "\u2014"} |`);
    }
    if (d.added.length) lines.push("", "\u65B0\u589E\uFF1A" + d.added.join("\u3001"));
    if (d.removed.length) lines.push("\u5220\u9664\uFF1A" + d.removed.join("\u3001"));
    return lines.join("\n");
  }

  // src/core/bridgeOpening.ts
  var REACH_TABLE = {
    stable: {
      label: "\u7A33\u5B9A\u6CB3\u6BB5\uFF08\u5F00\u9614\u3001\u987A\u76F4\u5FAE\u5F2F\uFF09",
      Kq: 0.84,
      n3: 0.9,
      applies: "\u5F00\u9614\u3001\u987A\u76F4\u5FAE\u5F2F\u6CB3\u6BB5"
    },
    substable: {
      label: "\u6B21\u7A33\u5B9A\u6CB3\u6BB5\uFF08\u5206\u6C4A\u3001\u5F2F\u66F2\uFF09",
      Kq: 0.95,
      n3: 0.87,
      applies: "\u5206\u6C4A\u3001\u5F2F\u66F2\u6CB3\u6BB5"
    },
    unstable: {
      label: "\u4E0D\u7A33\u5B9A\u6CB3\u6BB5\uFF08\u6EE9\u3001\u69FD\u53EF\u5206\uFF09",
      Kq: 0.69,
      n3: 1.59,
      applies: "\u6EE9\u3001\u69FD\u53EF\u5206\u7684\u4E0D\u7A33\u5B9A\u6CB3\u6BB5"
    }
  };
  function minBridgeOpening(input) {
    const { Qp, Qc, Bc, reach } = input;
    const warnings = [];
    if (!Number.isFinite(Qp) || Qp <= 0) throw new HsError({ code: "E_INPUT_RANGE", field: "state.open.opQp", value: Qp, message: "\u8BBE\u8BA1\u6D41\u91CF Qp \u5FC5\u987B\u4E3A\u6B63\uFF08m\xB3/s\uFF09", suggestion: "\u70B9\u300C\u7528\u5F53\u524D\u8BBE\u8BA1\u6D41\u91CF\u300D\u76F4\u63A5\u5F15\u7528\u9002\u7EBF\u7ED3\u679C", normRef: "JTG C30\u20142015 \u7B2C7.2.1\u6761" });
    if (!Number.isFinite(Qc) || Qc <= 0) throw new HsError({ code: "E_INPUT_RANGE", field: "state.open.opQc", value: Qc, message: "\u6CB3\u69FD\u6D41\u91CF Qc \u5FC5\u987B\u4E3A\u6B63\uFF08m\xB3/s\uFF09", suggestion: "\u7531\u65AD\u9762\u6D41\u91CF\u5206\u914D\u6C42\u5F97\u6CB3\u69FD\u90E8\u5206\u6D41\u91CF", normRef: "JTG C30\u20142015 \u7B2C7.2.1\u6761" });
    if (!Number.isFinite(Bc) || Bc <= 0) throw new HsError({ code: "E_INPUT_RANGE", field: "state.open.opBc", value: Bc, message: "\u6CB3\u69FD\u5BBD\u5EA6 Bc \u5FC5\u987B\u4E3A\u6B63\uFF08m\uFF09", suggestion: "\u53D6\u8BBE\u8BA1\u6C34\u4F4D\u4E0B\u7684\u6CB3\u69FD\u5BBD\u5EA6", normRef: "JTG C30\u20142015 \u7B2C7.2.1\u6761" });
    const coef = REACH_TABLE[reach];
    if (!coef) throw new Error(`\u6CB3\u6BB5\u7C7B\u578B\u5FC5\u987B\u662F stable / substable / unstable\uFF0C\u6536\u5230 ${String(reach)}`);
    const ratio = Qp / Qc;
    const Qt = Qp - Qc;
    if (Qt < 0) {
      warnings.push("\u6CB3\u6EE9\u6D41\u91CF Qp\u2212Qc \u4E3A\u8D1F\uFF1A\u8BF7\u6838\u5BF9\u8BBE\u8BA1\u6D41\u91CF\u4E0E\u6CB3\u69FD\u6D41\u91CF\uFF08\u901A\u5E38 Qp \u5E94\u5927\u4E8E Qc\uFF09");
    }
    if (ratio > 3) {
      warnings.push(`Qp/Qc=${ratio.toFixed(2)} \u504F\u5927\uFF0C\u6865\u5B54\u5C06\u663E\u8457\u538B\u7F29\u6CB3\u6EE9\uFF0C\u5E94\u590D\u6838\u6CB3\u6BB5\u5206\u7C7B\u4E0E\u51B2\u5237\u5F71\u54CD`);
    }
    if (reach === "unstable" && ratio > 2) {
      warnings.push("\u6EE9\u69FD\u53EF\u5206\u7684\u4E0D\u7A33\u5B9A\u6CB3\u6BB5\u5BF9\u6D41\u91CF\u6BD4\u654F\u611F\uFF08n3=1.59\uFF09\uFF0C\u5EFA\u8BAE\u7ED3\u5408\u6CB3\u5E8A\u6F14\u53D8\u5206\u6790\u7EFC\u5408\u786E\u5B9A\u6865\u957F");
    }
    const Lj = coef.Kq * Math.pow(ratio, coef.n3) * Bc;
    return {
      Lj: Math.round(Lj * 100) / 100,
      Kq: coef.Kq,
      n3: coef.n3,
      Qt: Math.round(Qt * 100) / 100,
      ratio: Math.round(ratio * 1e4) / 1e4,
      warnings
    };
  }

  // src/core/generalScour.ts
  function concentrationFactorA(Bd, Hz) {
    if (!Number.isFinite(Bd) || Bd <= 0) throw new Error("\u9020\u5E8A\u6D41\u91CF\u4E0B\u7684\u6CB3\u69FD\u5BBD\u5EA6 Bd \u5FC5\u987B\u4E3A\u6B63\uFF08m\uFF09");
    if (!Number.isFinite(Hz) || Hz <= 0) throw new Error("\u9020\u5E8A\u6D41\u91CF\u4E0B\u7684\u6CB3\u69FD\u5E73\u5747\u6C34\u6DF1 Hz \u5FC5\u987B\u4E3A\u6B63\uFF08m\uFF09");
    const raw = Math.pow(Math.sqrt(Bd) / Hz, 0.15);
    const capped = raw > 1.8;
    return { A: capped ? 1.8 : Math.round(raw * 1e3) / 1e3, capped };
  }
  function sandCoefE(rhoKgM3) {
    if (!Number.isFinite(rhoKgM3) || rhoKgM3 < 0) throw new Error("\u542B\u6C99\u91CF\u5FC5\u987B\u4E3A\u975E\u8D1F\uFF08kg/m\xB3\uFF09");
    if (rhoKgM3 < 1) return { E: 0.46, band: "\u03C1<1.0" };
    if (rhoKgM3 <= 10) return { E: 0.66, band: "1\u2264\u03C1\u226410" };
    return { E: 0.86, band: "\u03C1>10" };
  }
  function generalScour641(input) {
    const { Q2, mu, Bcj, hmc, hcq, E, d50, A } = input;
    const warnings = [];
    if (!Number.isFinite(Q2) || Q2 <= 0) throw new HsError({ code: "E_INPUT_RANGE", field: "state.scour.scQ2", value: Q2, message: "\u8BBE\u8BA1\u6D41\u91CF Q2 \u5FC5\u987B\u4E3A\u6B63\uFF08m\xB3/s\uFF09", suggestion: "\u70B9\u300C\u7528\u5F53\u524D\u8BBE\u8BA1\u6D41\u91CF\u300D\u5F15\u7528\u4E0A\u6E38\u6210\u679C", normRef: "JTG C30\u20142015 \u7B2C8.3.1\u6761" });
    if (!Number.isFinite(mu) || mu <= 0 || mu > 1) throw new HsError({ code: "E_INPUT_RANGE", field: "state.scour.scMu", value: mu, message: "\u4FA7\u5411\u538B\u7F29\u7CFB\u6570 \u03BC \u5E94\u5728 (0,1]", suggestion: "\u6309\u8BBE\u8BA1\u6D41\u901F\u4E0E\u5355\u5B54\u51C0\u8DE8\u5F84\u67E5\u8868 8.3.1-1", normRef: "JTG C30\u20142015 \u88688.3.1-1" });
    if (!Number.isFinite(Bcj) || Bcj <= 0) throw new Error("\u6865\u5B54\u8FC7\u6C34\u51C0\u5BBD Bcj \u5FC5\u987B\u4E3A\u6B63\uFF08m\uFF09");
    if (!Number.isFinite(hmc) || hmc <= 0) throw new Error("\u6CB3\u69FD\u6700\u5927\u6C34\u6DF1 hmc \u5FC5\u987B\u4E3A\u6B63\uFF08m\uFF09");
    if (!Number.isFinite(hcq) || hcq <= 0) throw new Error("\u6865\u4E0B\u6CB3\u69FD\u5E73\u5747\u6C34\u6DF1 hcq \u5FC5\u987B\u4E3A\u6B63\uFF08m\uFF09");
    if (!Number.isFinite(E) || E <= 0) throw new HsError({ code: "E_INPUT_RANGE", field: "state.scour.scRho", value: E, message: "\u542B\u6C99\u91CF\u7CFB\u6570 E \u5FC5\u987B\u4E3A\u6B63", suggestion: "\u6309\u6C5B\u671F\u542B\u6C99\u91CF\u53D6 0.46 / 0.66 / 0.86\uFF08\u8868 8.3.1-2\uFF09", normRef: "JTG C30\u20142015 \u88688.3.1-2" });
    if (!Number.isFinite(d50) || d50 <= 0) throw new HsError({ code: "E_INPUT_RANGE", field: "state.scour.scD50", value: d50, message: "\u6CB3\u69FD\u6CE5\u6C99\u5E73\u5747\u7C92\u5F84 d\u0304 \u5FC5\u987B\u4E3A\u6B63\uFF08mm\uFF09", suggestion: "\u7531\u5E8A\u6C99\u9897\u7C92\u5206\u6790\u6C42\u5F97\u5E73\u5747\u7C92\u5F84", normRef: "JTG C30\u20142015 \u7B2C8.3.1\u6761" });
    if (!Number.isFinite(A) || A <= 0) throw new Error("\u5355\u5BBD\u6D41\u91CF\u96C6\u4E2D\u7CFB\u6570 A \u5FC5\u987B\u4E3A\u6B63");
    if (hmc < hcq) warnings.push("\u6CB3\u69FD\u6700\u5927\u6C34\u6DF1\u5C0F\u4E8E\u5E73\u5747\u6C34\u6DF1\uFF0C\u8BF7\u6838\u5BF9\u65AD\u9762\u6570\u636E\uFF08\u901A\u5E38 hmc \u2265 hcq\uFF09");
    if (A > 1.8) warnings.push("A>1.8 \u65F6\u89C4\u8303\u5141\u8BB8\u91C7\u7528 1.8\uFF08\u5C71\u524D\u53D8\u8FC1\u3001\u6E38\u8361\u3001\u5BBD\u6EE9\u6CB3\u6BB5\uFF09");
    if (mu < 0.85) warnings.push("\u03BC<0.85 \u5DF2\u4F4E\u4E8E\u88688.3.1-1 \u5E38\u89C1\u8303\u56F4\uFF0C\u8BF7\u6838\u5BF9\u8BBE\u8BA1\u6D41\u901F\u4E0E\u5355\u5B54\u51C0\u8DE8\u5F84");
    const q = Q2 / (mu * Bcj);
    const ratio = hmc / hcq;
    const inner = A * q * Math.pow(ratio, 5 / 3) / (E * Math.pow(d50, 1 / 6));
    const hp = Math.pow(inner, 3 / 5);
    const hy = hp - hmc;
    const vz = A * q * Math.pow(ratio, 5 / 3) / Math.pow(hp, 5 / 3);
    const vzTheory = E * Math.pow(d50, 1 / 6);
    if (hy < 0) warnings.push("\u8BA1\u7B97\u51B2\u5237\u6DF1\u5EA6\u4E3A\u8D1F\uFF1Ahp \u5C0F\u4E8E\u51B2\u5237\u524D\u6C34\u6DF1\uFF0C\u8BF7\u6838\u5BF9\u65AD\u9762\u4E0E\u6D41\u91CF\u6570\u636E");
    return {
      hp: Math.round(hp * 1e3) / 1e3,
      hy: Math.round(hy * 1e3) / 1e3,
      q: Math.round(q * 1e3) / 1e3,
      vz: Math.round(vz * 1e3) / 1e3,
      vzTheory: Math.round(vzTheory * 1e3) / 1e3,
      warnings
    };
  }

  // src/core/localScour.ts
  function incipientVelocity(d50) {
    return 0.28 * Math.pow(d50 + 0.7, 0.5);
  }
  function startScourVelocity(d50) {
    return 0.12 * Math.pow(d50 + 0.5, 0.55);
  }
  function grainFactor(d50) {
    return 23e-4 * Math.pow(d50, 2.2) + 0.375 * Math.pow(d50, 0.24);
  }
  function scourExponent(v, v0, d50) {
    return Math.pow(v0 / v, 0.23 + 0.19 * Math.log10(d50));
  }
  function approachVelocity641(E, d50, hp) {
    if (!Number.isFinite(E) || E <= 0) throw new Error("\u542B\u6C99\u91CF\u7CFB\u6570 E \u5FC5\u987B\u4E3A\u6B63");
    if (!Number.isFinite(d50) || d50 <= 0) throw new Error("\u5E73\u5747\u7C92\u5F84 d\u0304 \u5FC5\u987B\u4E3A\u6B63\uFF08mm\uFF09");
    if (!Number.isFinite(hp) || hp <= 0) throw new Error("\u4E00\u822C\u51B2\u5237\u540E\u6C34\u6DF1 hp \u5FC5\u987B\u4E3A\u6B63\uFF08m\uFF09");
    return E * Math.pow(d50, 1 / 6) * Math.pow(hp, 2 / 3);
  }
  function localScour652(input) {
    const { v, d50, B1, hp, Kxi } = input;
    const warnings = [];
    if (!Number.isFinite(v) || v <= 0) throw new HsError({ code: "E_INPUT_RANGE", field: "state.local.lsV", value: v, message: "\u884C\u8FD1\u6D41\u901F v \u5FC5\u987B\u4E3A\u6B63\uFF08m/s\uFF09", suggestion: "\u70B9\u300C\u7528\u4E00\u822C\u51B2\u5237\u7ED3\u679C\u63A8\u7B97 v\u300D\u81EA\u52A8\u7B97\u51FA\uFF088.3.3-2\uFF09", normRef: "JTG C30\u20142015 \u7B2C8.3.3\u6761" });
    if (!Number.isFinite(d50) || d50 <= 0) throw new Error("\u6CB3\u5E8A\u6CE5\u6C99\u5E73\u5747\u7C92\u5F84 d\u0304 \u5FC5\u987B\u4E3A\u6B63\uFF08mm\uFF09");
    if (!Number.isFinite(B1) || B1 <= 0) throw new HsError({ code: "E_INPUT_RANGE", field: "state.local.lsB1", value: B1, message: "\u6865\u58A9\u8BA1\u7B97\u5BBD\u5EA6 B1 \u5FC5\u987B\u4E3A\u6B63\uFF08m\uFF09", suggestion: "\u6309\u9644\u5F55 C \u58A9\u5BBD\u8BA1\u7B97\u53D6\u7528", normRef: "JTG C30\u20142015 \u9644\u5F55C" });
    if (!Number.isFinite(hp) || hp <= 0) throw new Error("\u4E00\u822C\u51B2\u5237\u540E\u6C34\u6DF1 hp \u5FC5\u987B\u4E3A\u6B63\uFF08m\uFF09");
    if (!Number.isFinite(Kxi) || Kxi <= 0) throw new HsError({ code: "E_INPUT_RANGE", field: "state.local.lsKxi", value: Kxi, message: "\u58A9\u5F62\u7CFB\u6570 K\u03BE \u5FC5\u987B\u4E3A\u6B63", suggestion: "\u6309\u9644\u5F55 C \u4F9D\u58A9\u5F62\u67E5\u8868\u53D6\u7528\uFF08\u672C\u8F6F\u4EF6\u4E0D\u5185\u7F6E\u8BE5\u8868\uFF09", normRef: "JTG C30\u20142015 \u9644\u5F55C" });
    const v0 = incipientVelocity(d50);
    const v0p = startScourVelocity(d50);
    const Keta2 = grainFactor(d50);
    const n2 = scourExponent(v, v0, d50);
    const base = Kxi * Keta2 * Math.pow(B1, 0.6) * Math.pow(hp, 0.15);
    let hb;
    let branch;
    if (v <= v0p) {
      hb = 0;
      branch = "no-scour";
      warnings.push("\u884C\u8FD1\u6D41\u901F\u5C0F\u4E8E\u59CB\u51B2\u6D41\u901F v0\u2032\uFF0C\u6865\u58A9\u5C40\u90E8\u51B2\u5237\u53D6 0");
    } else if (v <= v0) {
      hb = base * ((v - v0p) / v0);
      branch = "v<=v0";
    } else {
      hb = base * Math.pow((v - v0p) / v0, n2);
      branch = "v>v0";
    }
    if (Kxi === 1) {
      warnings.push("K\u03BE \u53D6\u7528 1.0\uFF1A\u8BF7\u6309\u9644\u5F55C\u6309\u58A9\u5F62\u590D\u6838\uFF08\u5706\u7AEF\u5F62/\u5C16\u7AEF\u5F62/\u77E9\u5F62\u7B49\u53D6\u503C\u4E0D\u540C\uFF09");
    }
    if (d50 > 200) {
      warnings.push("d\u0304>200 mm\uFF08\u5375\u77F3/\u6F02\u77F3\uFF09\u65F6 65-2 \u5F0F\u9002\u7528\u6027\u9700\u590D\u6838");
    }
    return {
      hb: Math.round(hb * 1e3) / 1e3,
      v0: Math.round(v0 * 1e3) / 1e3,
      v0p: Math.round(v0p * 1e3) / 1e3,
      n2: Math.round(n2 * 1e3) / 1e3,
      Keta2: Math.round(Keta2 * 1e4) / 1e4,
      branch,
      warnings
    };
  }
  function totalScour(input) {
    const { natural, general, local } = input;
    for (const [k, v] of Object.entries({ natural, general, local })) {
      if (!Number.isFinite(v) || v < 0) throw new Error(`${k} \u5FC5\u987B\u4E3A\u975E\u8D1F\u6570\uFF08m\uFF09`);
    }
    const notes = [
      "\u89C4\u8303 8.6.1\uFF1A\u57FA\u5E95\u57CB\u6DF1\u5E94\u53D6\u81EA\u7136\u6F14\u53D8\u51B2\u5237\u3001\u4E00\u822C\u51B2\u5237\u548C\u5C40\u90E8\u51B2\u5237\u7684\u4E0D\u5229\u7EC4\u5408\uFF0C\u5E76\u7B26\u5408 JTG D63",
      "\u89C4\u8303 8.6.2\uFF1A\u975E\u5CA9\u77F3\u6CB3\u5E8A\u58A9\u53F0\u57FA\u5E95\u5E94\u57CB\u5165\u603B\u51B2\u5237\u7EBF\u4EE5\u4E0B\uFF0C\u5B89\u5168\u503C\u6309\u8868 8.6.2 \u53D6\uFF08\u672C\u7248\u672A\u5185\u7F6E\u8BE5\u8868\uFF0C\u9700\u67E5\u89C4\u8303\u539F\u8868\uFF09"
    ];
    if (natural === 0) notes.push("\u81EA\u7136\u6F14\u53D8\u51B2\u5237\u6309 0 \u8BA1\u5165\uFF1A\u82E5\u6709\u6CB3\u9053\u6F14\u53D8\u8D44\u6599\u5E94\u8865\u5145");
    return { total: Math.round((natural + general + local) * 1e3) / 1e3, notes };
  }

  // src/core/threePoint.ts
  function threePointFit(pts) {
    if (pts.length !== 3) throw new Error("\u4E09\u70B9\u9002\u7EBF\u6CD5\u9700\u8981\u6070\u597D 3 \u4E2A\u70B9");
    const [p1, p2, p3] = pts.map((t) => t.p);
    const [x1, x2, x3] = pts.map((t) => t.x);
    for (const p of [p1, p2, p3]) {
      if (!(p > 0 && p < 1)) throw new Error(`\u9891\u7387\u5FC5\u987B\u5728 (0,1)\uFF0C\u6536\u5230 ${p}`);
    }
    if (!(p1 < p2 && p2 < p3)) throw new Error("\u4E09\u70B9\u9891\u7387\u5FC5\u987B\u9012\u589E\uFF08\u5982 5%\u300150%\u300195% \u8D85\u8FC7\u6982\u7387\u5199\u6CD5\u5373 0.05/0.5/0.95\uFF09");
    if (!(Number.isFinite(x1) && Number.isFinite(x2) && Number.isFinite(x3))) {
      throw new Error("\u4E09\u70B9\u6D41\u91CF\u5FC5\u987B\u4E3A\u6709\u9650\u6570");
    }
    if (x1 <= x3) throw new Error("\u8981\u6C42 x1 > x3\uFF08\u9891\u7387\u8D8A\u5C0F\u6D41\u91CF\u8D8A\u5927\uFF09\uFF0C\u7CFB\u5217\u53EF\u80FD\u6052\u5B9A\u6216\u987A\u5E8F\u9519\u8BEF");
    const sOf = (cs2) => {
      const f12 = phiPIII(p1, cs2), f22 = phiPIII(p2, cs2), f32 = phiPIII(p3, cs2);
      return (f12 + f32 - 2 * f22) / (f12 - f32);
    };
    const S = (x1 + x3 - 2 * x2) / (x1 - x3);
    let cs;
    if (S <= 0) {
      cs = 0;
    } else {
      let lo = 0, hi = 1;
      let guard = 0;
      while (sOf(hi) < S && guard++ < 100) {
        lo = hi;
        hi *= 2;
      }
      if (guard >= 100) throw new Error("\u4E09\u70B9\u6CD5\u6C42 Cs \u4E0A\u754C\u6269\u5F20\u8D85\u9650\uFF0C\u6570\u636E\u53EF\u80FD\u4E0D\u9002\u7528");
      for (let i = 0; i < 100; i++) {
        const mid = (lo + hi) / 2;
        if (sOf(mid) < S) lo = mid;
        else hi = mid;
        if (hi - lo < 1e-10) break;
      }
      cs = (lo + hi) / 2;
    }
    const f1 = phiPIII(p1, cs), f2 = phiPIII(p2, cs), f3 = phiPIII(p3, cs);
    const sigma = (x1 - x3) / (f1 - f3);
    if (!(sigma > 0)) throw new Error("\u4E09\u70B9\u6CD5\u89E3\u51FA \u03C3 \u975E\u6B63\uFF0C\u6570\u636E\u77DB\u76FE");
    const mean = x2 - sigma * f2;
    if (!(mean > 0)) throw new Error("\u4E09\u70B9\u6CD5\u89E3\u51FA\u5747\u503C\u975E\u6B63\uFF0C\u6570\u636E\u77DB\u76FE");
    return { mean, cv: sigma / mean, cs, S, sigma, freqs: [p1, p2, p3] };
  }
  function empiricalQuantiles(series, freqs) {
    if (series.length < 3) throw new Error("\u4E09\u70B9\u6CD5\u81F3\u5C11\u9700\u8981 3 \u4E2A\u6570\u636E");
    const sorted = [...series].sort((a, b) => b - a);
    const n = sorted.length;
    return freqs.map((p) => {
      const rank = p * (n + 1);
      if (rank < 1) return sorted[0];
      if (rank >= n) return sorted[n - 1];
      const mLo = Math.floor(rank);
      const w = rank - mLo;
      return sorted[mLo - 1] + w * (sorted[mLo] - sorted[mLo - 1]);
    });
  }
  function threePointFromSeries(series, freqs = [0.05, 0.5, 0.95]) {
    const xs = empiricalQuantiles(series, freqs);
    return threePointFit([
      { p: freqs[0], x: xs[0] },
      { p: freqs[1], x: xs[1] },
      { p: freqs[2], x: xs[2] }
    ]);
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

  // src/core/autoFit.ts
  function autoFit(points, initial, phiFn = phiPIII) {
    if (points.length < 3) throw new Error("\u4F18\u5316\u9002\u7EBF\u81F3\u5C11\u9700\u8981 3 \u4E2A\u7ECF\u9A8C\u70B9\u636E");
    const { mean } = initial;
    if (!(mean > 0)) throw new Error("\u5747\u503C\u5FC5\u987B\u4E3A\u6B63\uFF08\u4F18\u5316\u9002\u7EBF\u56FA\u5B9A\u77E9\u6CD5\u5747\u503C\uFF09");
    const sseInitial = sseOfPoints(points, initial, phiFn);
    const objective = (theta) => {
      const cv2 = theta[0], cs2 = theta[1];
      let penalty = 0;
      if (cv2 <= 0.01) penalty += (0.01 - cv2) ** 2 * 1e12;
      if (cs2 < 0) penalty += cs2 * cs2 * 1e12;
      if (penalty > 0) return penalty + sseInitial;
      return sseOfPoints(points, { mean, cv: cv2, cs: cs2 }, phiFn);
    };
    const starts = [
      [initial.cv, initial.cs],
      [Math.max(initial.cv * 0.8, 0.05), Math.max(initial.cs * 1.5, 0.1)],
      [Math.min(initial.cv * 1.2, 1.5), Math.max(initial.cs * 0.5, 0.05)]
    ];
    let best = null;
    for (const st of starts) {
      const r = nelderMead(objective, st, { maxIter: 800, tol: 1e-10 });
      if (!best || r.fx < best.fx) best = r;
    }
    const cv = best.x[0], cs = best.x[1];
    const sse = sseOfPoints(points, { mean, cv, cs }, phiFn);
    return {
      mean,
      cv,
      cs,
      sse,
      sseInitial,
      improved: sse <= sseInitial + 1e-9,
      iterations: best.iterations
    };
  }

  // src/core/migrate.ts
  var SCHEMA_V1 = "hongsuan-project@1";
  var SCHEMA_V2 = "hongsuan-project@2";
  var v1tov2 = {
    from: SCHEMA_V1,
    to: SCHEMA_V2,
    note: "state \u8865\u9F50\u6865\u5B54/\u4E00\u822C\u51B2\u5237/\u5C40\u90E8\u51B2\u5237/\u603B\u51B2\u5237\u56DB\u7EC4\u6301\u4E45\u5316\u5B57\u6BB5\uFF08v0.11.0 \u65B0\u589E\uFF0C\u7F3A\u7701\u7A7A\uFF09",
    migrate: (f) => ({
      ...f,
      schema: SCHEMA_V2,
      state: {
        open: {},
        scour: {},
        local: {},
        total: {},
        ...f.state
      }
    })
  };
  var MIGRATIONS = [v1tov2];
  var LATEST_SCHEMA = MIGRATIONS.length ? MIGRATIONS[MIGRATIONS.length - 1].to : SCHEMA_V1;
  function migrateProjectFile(json) {
    if (typeof json !== "object" || json === null) {
      throw new HsError({ code: "E_SCHEMA", message: "\u5DE5\u7A0B\u6587\u4EF6\u5FC5\u987B\u4E3A JSON \u5BF9\u8C61" });
    }
    let f = json;
    const migratedFrom = [];
    for (; ; ) {
      if (f.schema === LATEST_SCHEMA) return { file: f, migratedFrom };
      const step = MIGRATIONS.find((m) => m.from === f.schema);
      if (!step) {
        const known = [SCHEMA_V1, ...MIGRATIONS.map((m) => m.to)].join(" \u2192 ");
        throw new HsError({
          code: "E_SCHEMA",
          field: "schema",
          value: f.schema,
          message: `\u65E0\u6CD5\u8BC6\u522B\u7684\u5DE5\u7A0B\u6587\u4EF6 schema\uFF1A${String(f.schema)}\uFF08\u5DF2\u77E5\u8FC1\u79FB\u94FE\uFF1A${known}\uFF09`,
          suggestion: "\u8BF7\u786E\u8BA4\u6587\u4EF6\u672A\u88AB\u5176\u4ED6\u8F6F\u4EF6\u7BE1\u6539\uFF1B\u82E5\u6765\u81EA\u66F4\u65E7\u7248\u672C\uFF0C\u8BF7\u5148\u7ECF\u4E2D\u95F4\u7248\u672C\u6253\u5F00\u4E00\u6B21"
        });
      }
      f = step.migrate(f);
      migratedFrom.push(`${step.from}\u2192${step.to}`);
    }
  }

  // src/core/projectFile.ts
  var PROJECT_SCHEMA = "hongsuan-project@2";
  function emptyProject() {
    return { name: "", bridgeSite: "", engineer: "", reviewer: "", note: "" };
  }
  function buildProjectFile(project, state2, appVersion) {
    const p = { ...emptyProject(), ...project };
    for (const k of Object.keys(p)) {
      const v = p[k];
      if (v === void 0) continue;
      if (typeof v !== "string") throw new Error(`\u9879\u76EE\u4FE1\u606F\u5B57\u6BB5 ${k} \u5FC5\u987B\u4E3A\u5B57\u7B26\u4E32`);
    }
    return {
      schema: PROJECT_SCHEMA,
      savedAt: (/* @__PURE__ */ new Date()).toISOString(),
      appVersion,
      project: p,
      state: state2
    };
  }
  function parseProjectFile(json) {
    if (typeof json !== "object" || json === null) throw new Error("\u5DE5\u7A0B\u6587\u4EF6\u5FC5\u987B\u4E3A JSON \u5BF9\u8C61");
    const m = migrateProjectFile(json);
    const f = m.file;
    if (f.schema !== PROJECT_SCHEMA) throw new Error(`\u5DE5\u7A0B\u6587\u4EF6 schema \u4E0D\u5339\u914D\uFF1A\u671F\u671B ${PROJECT_SCHEMA}\uFF0C\u6536\u5230 ${String(f.schema)}`);
    if (m.migratedFrom.length) f.migratedFrom = m.migratedFrom;
    if (typeof f.savedAt !== "string" || !f.savedAt) throw new Error("\u5DE5\u7A0B\u6587\u4EF6\u7F3A\u5C11 savedAt");
    if (typeof f.appVersion !== "string" || !f.appVersion) throw new Error("\u5DE5\u7A0B\u6587\u4EF6\u7F3A\u5C11 appVersion");
    if (typeof f.project !== "object" || f.project === null) throw new Error("\u5DE5\u7A0B\u6587\u4EF6\u7F3A\u5C11 project \u4FE1\u606F");
    for (const k of ["name", "bridgeSite", "engineer", "reviewer", "note"]) {
      if (typeof f.project[k] !== "string") throw new Error(`\u5DE5\u7A0B\u6587\u4EF6 project.${k} \u5FC5\u987B\u4E3A\u5B57\u7B26\u4E32`);
    }
    if (typeof f.state !== "object" || f.state === null) throw new Error("\u5DE5\u7A0B\u6587\u4EF6\u7F3A\u5C11 state");
    return f;
  }
  function serializeProject(file) {
    return JSON.stringify(file, null, 2);
  }

  // src/core/hydrograph.ts
  function parseHydrograph(text) {
    if (typeof text !== "string") throw new Error("\u8FC7\u7A0B\u7EBF\u8F93\u5165\u5FC5\u987B\u4E3A\u5B57\u7B26\u4E32");
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) throw new Error("\u5178\u578B\u6D2A\u6C34\u8FC7\u7A0B\u7EBF\u81F3\u5C11\u9700\u8981 2 \u884C\u6570\u636E\uFF08\u6BCF\u884C\uFF1A\u65F6\u95F4h, \u6D41\u91CF\uFF09");
    const out = [];
    lines.forEach((line, i) => {
      const parts = line.split(/[\s,，;；]+/).filter(Boolean);
      if (parts.length !== 2) throw new Error(`\u7B2C ${i + 1} \u884C\u5E94\u6709 2 \u4E2A\u6570\u503C\uFF08\u65F6\u95F4, \u6D41\u91CF\uFF09\uFF0C\u6536\u5230 ${parts.length} \u4E2A\uFF1A${line}`);
      const t = Number(parts[0]), q = Number(parts[1]);
      if (!Number.isFinite(t)) throw new Error(`\u7B2C ${i + 1} \u884C\u65F6\u95F4\u4E0D\u662F\u6709\u6548\u6570\u503C\uFF1A${parts[0]}`);
      if (!Number.isFinite(q) || q < 0) throw new Error(`\u7B2C ${i + 1} \u884C\u6D41\u91CF\u5FC5\u987B\u4E3A\u975E\u8D1F\u6570\u503C\uFF1A${parts[1]}`);
      out.push({ t, q });
    });
    return out;
  }
  function scaleHydrograph(typical, designPeak) {
    if (!Array.isArray(typical) || typical.length < 2) throw new Error("\u5178\u578B\u6D2A\u6C34\u8FC7\u7A0B\u7EBF\u81F3\u5C11\u9700\u8981 2 \u4E2A\u70B9");
    if (!typical.every((p) => Number.isFinite(p.t) && Number.isFinite(p.q) && p.q >= 0)) {
      throw new Error("\u8FC7\u7A0B\u7EBF\u5404\u70B9\u5FC5\u987B\u4E3A\u6709\u9650\u6570\u4E14\u6D41\u91CF\u975E\u8D1F");
    }
    if (!(designPeak > 0)) throw new Error("\u8BBE\u8BA1\u6D2A\u5CF0 Qp \u5FC5\u987B\u4E3A\u6B63\uFF08m\xB3/s\uFF09");
    const typicalPeak = Math.max(...typical.map((p) => p.q));
    if (!(typicalPeak > 0)) throw new Error("\u5178\u578B\u6D2A\u6C34\u8FC7\u7A0B\u7EBF\u5CF0\u503C\u4E3A 0\uFF0C\u65E0\u6CD5\u653E\u5927");
    const kg = designPeak / typicalPeak;
    const points = typical.map((p) => ({
      t: p.t,
      q: Math.round(p.q * kg * 100) / 100
    }));
    return { kg, typicalPeak, designPeak, points };
  }

  // src/core/areaConvert.ts
  function suggestExponent(fRef, fSite) {
    const diffPct = Math.abs(fSite - fRef) / fRef * 100;
    if (diffPct <= 3) return 1;
    const fMin = Math.min(fRef, fSite);
    if (fMin < 100) return 0.75;
    return 0.6;
  }
  function areaConvert(input) {
    const { qRef, fRef, fSite } = input;
    if (![qRef, fRef, fSite].every(Number.isFinite)) throw new Error("\u9762\u79EF\u6BD4\u62DF\u8F93\u5165\u5FC5\u987B\u4E3A\u6709\u9650\u6570");
    if (!(qRef > 0)) throw new Error("\u53C2\u8BC1\u6210\u679C\u5FC5\u987B\u4E3A\u6B63");
    if (!(fRef > 0) || !(fSite > 0)) throw new Error("\u6C47\u6C34\u9762\u79EF\u5FC5\u987B\u4E3A\u6B63\uFF08km\xB2\uFF09");
    const n = input.n ?? suggestExponent(fRef, fSite);
    if (!Number.isFinite(n) || n <= 0) throw new Error("\u9762\u79EF\u4FEE\u6B63\u6307\u6570 n \u5FC5\u987B\u4E3A\u6B63");
    const diffPct = Math.abs(fSite - fRef) / fRef * 100;
    const warnings = [];
    const preconditionOk = diffPct < 20 && Math.max(fRef, fSite) <= 1e3;
    if (diffPct >= 20) warnings.push(`\u9762\u79EF\u5DEE ${diffPct.toFixed(1)}% \u2265 20%\uFF0C\u8D85\u51FA\u89C4\u8303 6.2.2 \u8F6C\u6362\u6761\u4EF6\uFF0C\u7ED3\u679C\u4EC5\u4F9B\u53C2\u8003`);
    if (Math.max(fRef, fSite) > 1e3) warnings.push("\u6C47\u6C34\u9762\u79EF >1000 km\xB2\uFF0C\u8D85\u51FA\u89C4\u8303 6.2.2 \u8F6C\u6362\u6761\u4EF6\uFF0C\u7ED3\u679C\u4EC5\u4F9B\u53C2\u8003");
    const qSite = qRef * Math.pow(fSite / fRef, n);
    return { qSite, n, diffPct, preconditionOk, warnings };
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
    if (p.F <= 0) throw new HsError({ code: "E_INPUT_RANGE", field: "state.nodata.rcF", value: p.F, message: "\u6C47\u6C34\u9762\u79EF F \u5FC5\u987B\u4E3A\u6B63\uFF08km\xB2\uFF09", suggestion: "\u586B\u5199\u6865\u4F4D\u4EE5\u4E0A\u7684\u6C47\u6C34\u9762\u79EF\uFF0C\u53EF\u7528\u5730\u56FE\u91CF\u7B97\u52FE\u51FA", normRef: "JTG C30\u20142015 \u7B2C6.4\u6761" });
    if (p.tau <= 0) throw new HsError({ code: "E_INPUT_RANGE", field: "state.nodata.rcTau", value: p.tau, message: "\u6C47\u6D41\u65F6\u95F4 \u03C4 \u5FC5\u987B\u4E3A\u6B63\uFF08h\uFF09", suggestion: "\u6309\u89C4\u8303\u8868 B-8 \u4F9D\u6C47\u6C34\u9762\u79EF\u53D6\u503C\uFF08\u4E00\u822C 30~80 min\uFF09", normRef: "\u6DB5\u6D1E\u89C4\u8303 \u9644\u5F55B \u8868B-8" });
    if (p.Sp <= 0) throw new Error("\u96E8\u529B Sp \u5FC5\u987B\u4E3A\u6B63\uFF08mm/h\uFF09");
    if (p.n < 0) throw new Error("\u66B4\u96E8\u8870\u51CF\u6307\u6570 n \u4E0D\u80FD\u4E3A\u8D1F");
    if (p.psi <= 0 || p.psi > 1) throw new HsError({ code: "E_INPUT_RANGE", field: "state.nodata.rcPsi", value: p.psi, message: "\u6D2A\u5CF0\u5F84\u6D41\u7CFB\u6570 \u03C8 \u5E94\u5728 (0,1]", suggestion: "\u6309\u89C4\u8303\u8868 B-5 \u4F9D\u5730\u5F62\u4E0E\u4E3B\u6CB3\u6C9F\u5761\u5EA6\u53D6\u503C", normRef: "\u6DB5\u6D1E\u89C4\u8303 \u9644\u5F55B \u8868B-5" });
    if (p.F >= 100) throw new HsError({ code: "E_INPUT_RANGE", field: "state.nodata.rcF", value: p.F, message: "\u63A8\u7406\u516C\u5F0F\u9002\u7528\u4E8E\u6C47\u6C34\u9762\u79EF <100 km\xB2\uFF08\u89C4\u8303 6.4.2\uFF09\uFF0C\u5F53\u524D " + p.F + " km\xB2", suggestion: "\u6539\u7528\u5730\u533A\u7ECF\u9A8C\u516C\u5F0F\u6216\u7531\u5B9E\u6D4B\u8D44\u6599\u63A8\u6C42", normRef: "JTG C30\u20142015 \u7B2C6.4\u6761" });
    return 0.278 * p.psi * (p.Sp / Math.pow(p.tau, p.n)) * p.F;
  }
  function runoffDepthFormula(p) {
    if (![p.psi, p.h, p.z, p.F, p.beta, p.gamma, p.delta].every(Number.isFinite)) throw new Error("\u5F84\u6D41\u539A\u5EA6\u6CD5\u8F93\u5165\u5FC5\u987B\u4E3A\u6709\u9650\u6570");
    if (p.F <= 0) throw new Error("\u6C47\u6C34\u9762\u79EF F \u5FC5\u987B\u4E3A\u6B63\uFF08km\xB2\uFF09");
    if (p.h - p.z <= 0) throw new HsError({ code: "E_INPUT_RANGE", field: "state.nodata.rdH", value: p.h, message: "\u5F84\u6D41\u539A\u5EA6 h=" + p.h + "mm \u5FC5\u987B\u5927\u4E8E\u6EDE\u7559\u539A\u5EA6 z=" + p.z + "mm\uFF08\u5426\u5219\u4E0D\u4EA7\u751F\u5F84\u6D41\uFF09", suggestion: "\u67E5\u8868 B-9 \u6838\u5BF9\u66B4\u96E8\u5206\u533A\u4E0E\u571F\u7684\u7C7B\u5C5E\uFF1B\u6216\u6309\u8868 B-10 \u6838\u5BF9\u6EDE\u7559\u539A\u5EA6 z", normRef: "\u6DB5\u6D1E\u89C4\u8303 \u9644\u5F55B \u8868B-9 / \u8868B-10" });
    if (p.psi <= 0) throw new HsError({ code: "E_INPUT_RANGE", field: "state.nodata.rdPsi", value: p.psi, message: "\u5730\u8C8C\u7CFB\u6570 \u03C8 \u5FC5\u987B\u4E3A\u6B63", suggestion: "\u6309\u89C4\u8303\u8868 B-5 \u53D6\u503C", normRef: "\u6DB5\u6D1E\u89C4\u8303 \u9644\u5F55B \u8868B-5" });
    if (p.beta <= 0 || p.beta > 1 || p.gamma <= 0 || p.gamma > 1 || p.delta <= 0 || p.delta > 1) {
      throw new Error("\u6298\u51CF\u7CFB\u6570 \u03B2\u3001\u03B3\u3001\u03B4 \u5747\u5E94\u5728 (0,1]");
    }
    return p.psi * Math.pow(p.h - p.z, 3 / 2) * Math.pow(p.F, 4 / 5) * p.beta * p.gamma * p.delta;
  }

  // src/core/waterSurface.ts
  var G = 9.8;
  function trapA(g, y) {
    return (g.b + g.m * y) * y;
  }
  function trapBs(g, y) {
    return g.b + 2 * g.m * y;
  }
  function trapP(g, y) {
    return g.b + 2 * y * Math.sqrt(1 + g.m * g.m);
  }
  function trapR(g, y) {
    return trapA(g, y) / trapP(g, y);
  }
  function flowState(g, Q, y) {
    const A = trapA(g, y), R = trapR(g, y);
    const v = Q / A;
    const fr = Math.sqrt(Q * Q * trapBs(g, y) / (G * A * A * A));
    const sf = g.n * g.n * v * v / Math.pow(R, 4 / 3);
    const E = y + v * v / (2 * G);
    return { v, fr, sf, E };
  }
  function normalDepth(g, S0, Q) {
    if (!(S0 > 0) || !(Q > 0)) throw new Error("\u6BD4\u964D\u4E0E\u6D41\u91CF\u5FC5\u987B\u4E3A\u6B63");
    const f = (y) => trapA(g, y) * Math.pow(trapR(g, y), 2 / 3) * Math.sqrt(S0) / g.n - Q;
    let lo = 1e-5, hi = 1;
    let guard = 0;
    while (f(hi) < 0 && guard++ < 200) {
      lo = hi;
      hi *= 2;
      if (hi > 1e5) throw new Error("\u6B63\u5E38\u6C34\u6DF1\u4E0A\u754C\u6269\u5F20\u8D85\u9650");
    }
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (f(mid) < 0) lo = mid;
      else hi = mid;
      if (hi - lo < 1e-6) break;
    }
    return (lo + hi) / 2;
  }
  function criticalDepth(g, Q) {
    if (!(Q > 0)) throw new Error("\u6D41\u91CF\u5FC5\u987B\u4E3A\u6B63");
    const f = (y) => Q * Q * trapBs(g, y) / (G * Math.pow(trapA(g, y), 3)) - 1;
    let lo = 1e-5, hi = 1;
    let guard = 0;
    while (f(hi) > 0 && guard++ < 200) {
      lo = hi;
      hi *= 2;
      if (hi > 1e5) throw new Error("\u4E34\u754C\u6C34\u6DF1\u4E0A\u754C\u6269\u5F20\u8D85\u9650");
    }
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (f(mid) > 0) lo = mid;
      else hi = mid;
      if (hi - lo < 1e-6) break;
    }
    return (lo + hi) / 2;
  }
  function waterSurfaceProfile(opts) {
    const { geom, S0, Q, yControl, length } = opts;
    const N = opts.steps ?? 40;
    if (![geom.b, geom.m, geom.n, S0, Q, yControl, length].every(Number.isFinite)) throw new Error("\u6C34\u9762\u7EBF\u8F93\u5165\u5FC5\u987B\u4E3A\u6709\u9650\u6570");
    if (!(geom.b > 0) || !(geom.n > 0)) throw new Error("\u5E95\u5BBD\u4E0E\u7CD9\u7387\u5FC5\u987B\u4E3A\u6B63");
    if (geom.m < 0) throw new Error("\u8FB9\u5761\u7CFB\u6570\u4E0D\u80FD\u4E3A\u8D1F");
    if (!(S0 > 0)) throw new Error("\u6BD4\u964D\u5FC5\u987B\u4E3A\u6B63");
    if (!(Q > 0)) throw new Error("\u5047\u5B9A\u6D41\u91CF\u5FC5\u987B\u4E3A\u6B63");
    if (!(yControl > 0)) throw new Error("\u63A7\u5236\u65AD\u9762\u6C34\u6DF1\u5FC5\u987B\u4E3A\u6B63");
    if (!(length > 0)) throw new Error("\u63A8\u7B97\u6CB3\u957F\u5FC5\u987B\u4E3A\u6B63");
    const yn = normalDepth(geom, S0, Q);
    const yc = criticalDepth(geom, Q);
    const stCtrl = flowState(geom, Q, yControl);
    const regime = stCtrl.fr < 1 ? "subcritical" : "supercritical";
    const points = [{ x: 0, y: yControl, v: stCtrl.v, E: stCtrl.E, sf: stCtrl.sf }];
    let reached = 0;
    if (Math.abs(yControl - yn) / yn < 1e-4) {
      const st = flowState(geom, Q, yn);
      return { points: [{ x: -length, y: yn, v: st.v, E: st.E, sf: st.sf }, points[0]], yn, yc, regime, reachedLength: length };
    }
    if (yControl < yc * 1.0001) throw new Error("\u63A7\u5236\u65AD\u9762\u6C34\u6DF1\u63A5\u8FD1/\u4F4E\u4E8E\u4E34\u754C\u6C34\u6DF1\uFF0C\u6C34\u9762\u7EBF\u63A8\u7B97\u4E0D\u7A33\u5B9A\uFF08\u6025\u6D41\u63A7\u5236\u4F4D\u7F6E\u9700\u5728\u4E0A\u6E38\uFF09");
    const yEnd = yn;
    const dy = (yEnd - yControl) / N;
    let x = 0;
    for (let i = 0; i < N; i++) {
      const y1 = yControl + dy * i;
      const y2 = yControl + dy * (i + 1);
      const s1 = flowState(geom, Q, y1);
      const s2 = flowState(geom, Q, y2);
      const sfBar = (s1.sf + s2.sf) / 2;
      const denom = S0 - sfBar;
      if (Math.abs(denom) < 1e-8) break;
      const dx = (s2.E - s1.E) / denom;
      const stepLen = Math.abs(dx);
      if (reached + stepLen >= length) {
        const frac = (length - reached) / stepLen;
        const yL = y1 + (y2 - y1) * frac;
        const stL = flowState(geom, Q, yL);
        x = (regime === "subcritical" ? -1 : 1) * length;
        points.push({ x, y: yL, v: stL.v, E: stL.E, sf: stL.sf });
        reached = length;
        break;
      }
      x += dx;
      reached += stepLen;
      points.push({ x, y: y2, v: s2.v, E: s2.E, sf: s2.sf });
    }
    return { points, yn, yc, regime, reachedLength: reached };
  }
  function depthAt(result, dist) {
    const pts = result.points;
    const d = Math.abs(dist);
    if (d <= 0) return pts[0].y;
    for (let i = 0; i < pts.length - 1; i++) {
      const d1 = Math.abs(pts[i].x), d2 = Math.abs(pts[i + 1].x);
      if (d >= d1 && d <= d2) {
        const w = d2 === d1 ? 0 : (d - d1) / (d2 - d1);
        return pts[i].y + w * (pts[i + 1].y - pts[i].y);
      }
    }
    return pts[pts.length - 1].y;
  }
  function solveDischargeFromMarks(geom, S0, yDown, yUp, length) {
    if (!(yUp > yDown)) throw new Error("\u672C\u7B97\u6CD5\u8981\u6C42\u4E0A\u6E38\u6D2A\u75D5\u6C34\u6DF1\u5927\u4E8E\u4E0B\u6E38\uFF08\u7F13\u6D41 M2 \u578B\uFF1B\u5176\u4ED6\u5F62\u6001\u8BF7\u4EBA\u5DE5\u8BD5\u7B97\uFF09");
    const A = trapA(geom, yDown), R = trapR(geom, yDown);
    const q0 = A * Math.pow(R, 2 / 3) * Math.sqrt(S0) / geom.n;
    const residualOf = (Q) => {
      const prof2 = waterSurfaceProfile({ geom, S0, Q, yControl: yDown, length });
      return { r: depthAt(prof2, length) - yUp, prof: prof2 };
    };
    let lo = q0 * 0.3, hi = q0 * 3;
    let rLo = residualOf(lo).r, rHi = residualOf(hi).r;
    let guard = 0;
    while (rLo * rHi > 0 && guard++ < 24) {
      lo *= 0.5;
      hi *= 2;
      rLo = residualOf(lo).r;
      rHi = residualOf(hi).r;
      if (lo < q0 * 2e-3 || hi > q0 * 500) {
        throw new Error("\u81EA\u52A8\u8BD5\u7B97\u672A\u627E\u5230\u6709\u6548\u6D41\u91CF\u533A\u95F4\uFF0C\u8BF7\u4EBA\u5DE5\u8C03\u6574\u65AD\u9762\u53C2\u6570\u6216\u6539\u7528\u5747\u5300\u6D41\u516C\u5F0F");
      }
    }
    let mid = q0, rMid = residualOf(mid).r;
    for (let i = 0; i < 60; i++) {
      mid = (lo + hi) / 2;
      rMid = residualOf(mid).r;
      if (rLo * rMid <= 0) {
        hi = mid;
        rHi = rMid;
      } else {
        lo = mid;
        rLo = rMid;
      }
      if (hi - lo < q0 * 1e-4) break;
    }
    const prof = residualOf(mid).prof;
    return { Q: mid, residual: rMid, iterations: guard, profile: prof };
  }

  // src/web/main.ts
  var stateCompare = {};
  function freqLabelOf(p) {
    const m = { "0.0033": "1/300", "0.01": "1/100", "0.02": "1/50", "0.04": "1/25" };
    return m[String(p)] || (p * 100).toFixed(2) + "%";
  }
  function renderCompare() {
    const el = $("compareTable");
    const rows = Object.values(stateCompare);
    el.innerHTML = rows.length ? rows.map((r) => `<tr><td style="padding:4px 6px">${r.label}</td><td class="v">${fmt(r.q, 1)}</td><td>${r.freqLabel}</td><td style="color:var(--text3)">${r.note}</td></tr>`).join("") : `<tr><td colspan="4" style="color:var(--text3)">\u5728\u5404\u6A21\u5F0F\u8BA1\u7B97\u540E\u81EA\u52A8\u6C47\u603B\u5230\u6B64\u8868</td></tr>`;
  }
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
    logRenderOnce();
    stateCompare.A = {
      label: "\u65B9\u6CD5A \xB7 P-\u2162 \u9891\u7387\u9002\u7EBF",
      q,
      freqLabel: freqLabelOf(freq),
      note: `Q\u0304=${fmt(params.mean, 1)}, Cv=${params.cv.toFixed(3)}, Cs=${params.cs.toFixed(2)}`
    };
    renderCompare();
    const pts = state.pts;
    if (pts.length) {
      $("stSse").textContent = fmt(sseOfPoints(pts, params, phiPIII), 0);
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
      const px = pToX(pt.p), py = sy2(pt.q);
      if (pt.kind === "hist") {
        s += `<rect x="${px - 5}" y="${py - 5}" width="10" height="10" fill="#ff3b30" transform="rotate(45 ${px} ${py})"/>`;
      } else {
        s += `<circle cx="${px}" cy="${py}" r="4" fill="#1d1d1f"/>`;
      }
    }
    s += `<line id="chx" x1="0" y1="0" x2="0" y2="0" stroke="#007AFF" stroke-width="0.8" stroke-dasharray="3 3" opacity="0"/>`;
    s += `<line id="chy" x1="0" y1="0" x2="0" y2="0" stroke="#007AFF" stroke-width="0.8" stroke-dasharray="3 3" opacity="0"/>`;
    $("chart").innerHTML = s;
    chartQLo = qLo;
    chartQHi = qHi;
    bindChartHover();
  }
  var chartQLo = 0;
  var chartQHi = 1;
  var chartHoverBound = false;
  function bindChartHover() {
    if (chartHoverBound) return;
    chartHoverBound = true;
    const svg = $("chart");
    const normCdfT = (t) => {
      const P = gammaincLower(0.5, t * t / 2);
      return t >= 0 ? 0.5 * (1 + P) : 0.5 * (1 - P);
    };
    const hide = () => {
      for (const id of ["chx", "chy"]) {
        const el = document.getElementById(id);
        if (el) el.setAttribute("opacity", "0");
      }
    };
    svg.addEventListener("mousemove", (ev) => {
      const rect = svg.getBoundingClientRect();
      const mx = (ev.clientX - rect.left) / rect.width * 940;
      const my = (ev.clientY - rect.top) / rect.height * 520;
      if (mx < PL || mx > PR || my < PT || my > PB) {
        hide();
        return;
      }
      const t = XMAX - (mx - PL) / (PR - PL) * (XMAX - XMIN);
      const p = 1 - normCdfT(t);
      const q = chartQLo + (PB - my) / (PB - PT) * (chartQHi - chartQLo);
      const chx = document.getElementById("chx"), chy = document.getElementById("chy");
      if (chx && chy) {
        chx.setAttribute("x1", String(mx));
        chx.setAttribute("x2", String(mx));
        chx.setAttribute("y1", String(PT));
        chx.setAttribute("y2", String(PB));
        chy.setAttribute("y1", String(my));
        chy.setAttribute("y2", String(my));
        chy.setAttribute("x1", String(PL));
        chy.setAttribute("x2", String(PR));
        chx.setAttribute("opacity", "0.4");
        chy.setAttribute("opacity", "0.4");
      }
      $("chartReadout").textContent = `P = ${(p * 100).toFixed(2)}% \uFF5C Q = ${fmt(q, 0)} m\xB3/s`;
    });
    svg.addEventListener("mouseleave", hide);
  }
  function calcFromSeries() {
    const errBox = $("parseErr");
    const series = parseSeries($("series").value);
    let xs = series.values;
    const notices = [];
    if (series.ignored.length) {
      const shown = series.ignored.slice(0, 5).join("\u3001");
      notices.push(`\u5DF2\u5FFD\u7565 ${series.ignored.length} \u4E2A\u65E0\u6548\u503C\uFF08${shown}${series.ignored.length > 5 ? " \u7B49" : ""}\uFF09`);
    }
    if (xs.length < 3) {
      errBox.style.display = "block";
      errBox.textContent = "\u81F3\u5C11\u9700\u8981 3 \u4E2A\u6709\u6548\u6D41\u91CF\u503C\uFF08\u5F53\u524D " + xs.length + " \u4E2A\uFF09\u3002\u89C4\u8303\u5EFA\u8BAE\u5B9E\u6D4B\u7CFB\u5217\u4E0D\u5B9C\u5C11\u4E8E 30 \u5E74\u3002";
      return;
    }
    if ($("convEnable").checked) {
      try {
        const fRef = +$("convFRef").value, fSite = +$("convFSite").value;
        const nRaw = $("convN").value.trim();
        const conv = areaConvert({ qRef: 1, fRef, fSite, n: nRaw ? +nRaw : void 0 });
        notices.push(...conv.warnings);
        notices.push(`\u5DF2\u6309\u9762\u79EF\u6BD4\u62DF\u8F6C\u6362\u5230\u6865\u4F4D\u65AD\u9762\uFF08\xD7${conv.qSite.toFixed(4)}\uFF0Cn=${conv.n}\uFF09`);
        xs = xs.map((v) => v * conv.qSite);
      } catch (e) {
        errBox.style.display = "block";
        delete errBox.dataset.kind;
        errBox.textContent = "\u9762\u79EF\u8F6C\u6362\u6709\u8BEF\uFF1A" + (e instanceof Error ? e.message : String(e));
        return;
      }
    }
    state.series = xs;
    let st;
    let pts;
    if ($("hasExtra").checked) {
      try {
        const N = Math.round(+$("inN").value);
        const l = Math.round(+$("inL").value);
        const extraParsed = parseSeries($("extraSeries").value);
        if (extraParsed.ignored.length) {
          notices.push(`\u7279\u5927\u6D2A\u6C34\u8F93\u5165\u5DF2\u5FFD\u7565 ${extraParsed.ignored.length} \u4E2A\u65E0\u6548\u503C`);
        }
        const r = discontinuousPoints({
          historicalExtra: extraParsed.values,
          measuredDesc: xs,
          l,
          N
        });
        st = r.stats;
        pts = r.points;
        $("stN").textContent = `n=${st.n}\uFF0Ca=${st.a}\uFF0Cl=${l}\uFF0CN=${N}`;
      } catch (e) {
        errBox.style.display = "block";
        errBox.textContent = "\u7279\u5927\u6D2A\u6C34\u8F93\u5165\u6709\u8BEF\uFF1A" + (e instanceof Error ? e.message : String(e));
        return;
      }
    } else {
      st = seriesStats(xs);
      pts = continuousPoints(xs);
      $("stN").textContent = st.n;
    }
    if (notices.length) {
      errBox.style.display = "block";
      errBox.dataset.kind = "notice";
      errBox.textContent = notices.join("\uFF1B");
    } else {
      errBox.style.display = "none";
      delete errBox.dataset.kind;
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
  var MODE_BTN = {
    series: "mSeries",
    params: "mParams",
    hist: "mHist",
    noData: "mNoData",
    hydro: "mHydro",
    help: "mHelp",
    map: "mMap"
  };
  var MODE_BOX = {
    series: "seriesBox",
    params: "paramsBox",
    hist: "histBox",
    noData: "noDataBox",
    hydro: "hydroBox",
    help: "helpBox",
    map: "mapBox"
  };
  function switchMode(mode) {
    state.mode = mode === "hist" ? "histB" : mode;
    for (const key of Object.keys(MODE_BTN)) {
      $(MODE_BTN[key]).classList.toggle("on", key === mode);
      $(MODE_BOX[key]).style.display = key === mode ? "" : "none";
    }
    setFitCardsVisible(mode === "series" || mode === "params");
    if (mode === "params") {
      syncParamInputs();
      render();
    }
    if (mode === "noData") calcMethodC();
    if (mode === "help") renderHelp();
    if (mode === "map") renderMap();
  }
  for (const key of Object.keys(MODE_BTN)) {
    $(MODE_BTN[key]).onclick = () => switchMode(key);
  }
  function setFitCardsVisible(v) {
    for (const sel of ["#chartCard", "#fitCard", "#bayesCard", "#statsGrid"]) {
      const el = document.querySelector(sel);
      if (el) el.style.display = v ? "" : "none";
    }
  }
  $("btnThreePoint").onclick = () => {
    try {
      if (!state.series.length) {
        alert("\u8BF7\u5148\u8BA1\u7B97\u7CFB\u5217\uFF08\u6D41\u91CF\u7CFB\u5217\u6A21\u5F0F\uFF09\u3002");
        return;
      }
      const r = threePointFromSeries(state.series);
      state.params = {
        mean: r.mean,
        cv: Math.min(1.2, Math.max(0.05, r.cv)),
        cs: Math.max(0, r.cs)
      };
      syncParamInputs();
      render();
      $("fitMsg").textContent = `\u4E09\u70B9\u6CD5\u521D\u4F30\uFF085%/50%/95% \u97E6\u4F2F\u6392\u4F4D\uFF09\uFF1AQ\u0304=${fmt(r.mean, 1)}\uFF0CCv=${r.cv.toFixed(3)}\uFF0CCs=${r.cs.toFixed(2)}`;
    } catch (e) {
      alert("\u4E09\u70B9\u6CD5\u5931\u8D25\uFF1A" + (e instanceof Error ? e.message : String(e)));
    }
  };
  $("btnAutoFit").onclick = () => {
    try {
      if (state.pts.length < 3) {
        alert("\u8BF7\u5148\u8BA1\u7B97\u7CFB\u5217\uFF08\u6D41\u91CF\u7CFB\u5217\u6A21\u5F0F\uFF09\u3002");
        return;
      }
      const r = autoFit(state.pts, state.params);
      state.params = {
        mean: r.mean,
        cv: Math.min(1.2, Math.max(0.05, r.cv)),
        cs: Math.max(0, r.cs)
      };
      syncParamInputs();
      render();
      $("fitMsg").textContent = `\u4F18\u5316\u9002\u7EBF\uFF08\u5747\u503C\u56FA\u5B9A\uFF09\uFF1ACv=${r.cv.toFixed(3)}\uFF0CCs=${r.cs.toFixed(2)}\uFF0CSSE ${fmt(r.sseInitial, 0)} \u2192 ${fmt(r.sse, 0)}`;
    } catch (e) {
      alert("\u4F18\u5316\u9002\u7EBF\u5931\u8D25\uFF1A" + (e instanceof Error ? e.message : String(e)));
    }
  };
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
  .brow { display: grid; grid-template-columns: 92px 1fr 120px 90px; gap: 8px; align-items: center; margin: 4px 0; font-size: 12.5px; }
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
    <div style="margin:8px 0;padding:8px 10px;background:var(--bg);border-radius:10px">
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
      stateCompare.B = {
        label: "\u65B9\u6CD5B \xB7 \u5386\u53F2\u6D2A\u6C34\u4F4D\u6CD5",
        q: res.q,
        freqLabel: freqLabelOf(state.freq),
        note: `${floods.length} \u6B21\u5386\u53F2\u6D2A\u6C34\uFF08\u66FC\u5B81\u516C\u5F0F\uFF09`
      };
      renderCompare();
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
  function wsGeom() {
    return { b: +$("wsB").value, m: +$("wsM").value, n: +$("wsN").value };
  }
  function wsShow(html) {
    $("wsErr").textContent = "";
    $("wsResult").style.display = "";
    $("wsResult").innerHTML = html;
  }
  function wsFail(e) {
    $("wsResult").style.display = "none";
    const msg = e instanceof Error ? e.message : String(e);
    $("wsErr").textContent = msg;
    $("wsErr").style.display = "block";
  }
  function calcWsProfile() {
    try {
      const geom = wsGeom();
      const S0 = +$("wsS0").value / 1e3, L = +$("wsL").value, yDown = +$("wsYc").value, Q = +$("wsQ").value;
      const r = waterSurfaceProfile({ geom, S0, Q, yControl: yDown, length: L });
      const yEnd = depthAt(r, L);
      const upText = r.regime === "subcritical" ? "\u4E0A\u6E38\u7AEF" : "\u4E0B\u6E38\u7AEF";
      const rows = r.points.filter((_, i) => i % Math.ceil(r.points.length / 12) === 0 || i === r.points.length - 1);
      wsShow(`
      <div class="metrics">
        <div class="metric"><div class="k">\u6B63\u5E38\u6C34\u6DF1 y<sub>n</sub>\uFF08m\uFF09</div><div class="v">${r.yn.toFixed(3)}</div></div>
        <div class="metric"><div class="k">\u4E34\u754C\u6C34\u6DF1 y<sub>c</sub>\uFF08m\uFF09</div><div class="v">${r.yc.toFixed(3)}</div></div>
        <div class="metric"><div class="k">\u6D41\u6001</div><div class="v">${r.regime === "subcritical" ? "\u7F13\u6D41" : "\u6025\u6D41"}</div></div>
        <div class="metric hl"><div class="k">${upText}\u6C34\u6DF1\uFF08m\uFF09</div><div class="v">${yEnd.toFixed(3)}</div></div>
      </div>
      <table class="ltab" style="margin-top:10px">
        <tr><th>\u8DDD\u63A7\u5236\u65AD\u9762\uFF08m\uFF09</th><th class="v">\u6C34\u6DF1 y\uFF08m\uFF09</th><th class="v">\u6D41\u901F v\uFF08m/s\uFF09</th><th class="v">\u6BD4\u80FD E\uFF08m\uFF09</th><th class="v">Sf</th></tr>
        ${rows.map((p) => `<tr><td>${p.x.toFixed(0)}</td><td class="v">${p.y.toFixed(3)}</td><td class="v">${p.v.toFixed(3)}</td><td class="v">${p.E.toFixed(3)}</td><td class="v">${p.sf.toExponential(3)}</td></tr>`).join("")}
      </table>
      <div class="hint" style="margin-top:8px">\u5171 ${r.points.length} \u4E2A\u8BA1\u7B97\u70B9\uFF08\u9694\u884C\u663E\u793A\uFF09\uFF1Bx \u4E3A\u8D1F\u8868\u793A\u5728\u63A7\u5236\u65AD\u9762${r.regime === "subcritical" ? "\u4E0A\u6E38" : "\u4E0B\u6E38"}\u3002\u4E0E ${upText.replace("\u7AEF", "")}\u6D2A\u75D5\u5BF9\u7167\u8C03\u6574\u5047\u5B9A Q \u5373\u53EF\u8BD5\u7B97\u3002</div>`);
    } catch (e) {
      wsFail(e);
    }
  }
  function calcWsSolve() {
    try {
      const geom = wsGeom();
      const S0 = +$("wsS0").value / 1e3, L = +$("wsL").value, yDown = +$("wsYc").value, yUp = +$("wsYup").value;
      const s = solveDischargeFromMarks(geom, S0, yDown, yUp, L);
      stateCompare.B2 = {
        label: "\u65B9\u6CD5B \xB7 \u4E24\u6D2A\u75D5\u53CD\u89E3 Q",
        q: s.Q,
        freqLabel: freqLabelOf(state.freq),
        note: `y\u4E0B=${yDown}m \u2192 y\u4E0A=${yUp}m\uFF0CL=${L}m`
      };
      renderCompare();
      const yn = normalDepth(geom, S0, s.Q), yc = criticalDepth(geom, s.Q);
      wsShow(`
      <div class="metrics">
        <div class="metric hl"><div class="k">\u53CD\u89E3\u6D41\u91CF Q\uFF08m\xB3/s\uFF09</div><div class="v">${s.Q.toFixed(1)}</div></div>
        <div class="metric"><div class="k">\u5BF9\u5E94 y<sub>n</sub>\uFF08m\uFF09</div><div class="v">${yn.toFixed(3)}</div></div>
        <div class="metric"><div class="k">\u5BF9\u5E94 y<sub>c</sub>\uFF08m\uFF09</div><div class="v">${yc.toFixed(3)}</div></div>
        <div class="metric"><div class="k">\u6B8B\u5DEE\uFF08m\uFF09</div><div class="v">${s.residual.toExponential(2)}</div></div>
      </div>
      <div class="hint" style="margin-top:8px">\u7531\u4E0B\u6E38\u6D2A\u75D5 ${yDown}m \u6309\u5047\u5B9A Q \u5411\u4E0A\u6E38\u63A8\u7B97\uFF0C\u4E0E\u4E0A\u6E38\u6D2A\u75D5 ${yUp}m \u5BF9\u7167\u8FED\u4EE3\uFF1B\u6210\u679C\u5DF2\u5199\u5165\u591A\u65B9\u6CD5\u5BF9\u6BD4\u8868\u3002</div>`);
    } catch (e) {
      wsFail(e);
    }
  }
  $("btnWsProfile").onclick = calcWsProfile;
  $("btnWsSolve").onclick = calcWsSolve;
  document.querySelectorAll("#nTable .fillBtn").forEach((item) => {
    const btn = item;
    btn.onclick = () => {
      $(`hf${btn.dataset.r}${btn.dataset.k}`).value = btn.dataset.n;
    };
  });
  function showMethodCError(which, msg, e) {
    const out = $(which === "rc" ? "rcOut" : "rdOut");
    const err = $(which === "rc" ? "rcErr" : "rdErr");
    if (msg === null) {
      err.style.display = "none";
      err.textContent = "";
    } else {
      err.style.display = "block";
      const lines = [msg];
      if (e instanceof HsError) {
        if (e.suggestion) lines.push("\u5EFA\u8BAE\uFF1A" + e.suggestion);
        if (e.normRef) lines.push("\u4F9D\u636E\uFF1A" + e.normRef);
        const el = elementForField(e.field);
        if (el) el.classList.add("field-error");
      }
      err.textContent = lines.join(" \uFF5C ");
    }
    return out;
  }
  function calcMethodC() {
    clearFieldErrors();
    const v = (id) => +$(id).value;
    try {
      const Sp = v("rcSp"), n = v("rcN"), psi = v("rcPsi"), tau = v("rcTau"), F = v("rcF");
      const q = rationalFormula({ Sp, n, psi, tau, F });
      stateCompare.C1 = {
        label: "\u65B9\u6CD5C \xB7 \u63A8\u7406\u516C\u5F0F",
        q,
        freqLabel: freqLabelOf(state.freq),
        note: `F=${F} km\xB2, \u03C4=${tau} h`
      };
      renderCompare();
      showMethodCError("rc", null).textContent = q.toFixed(2);
      logCalc(
        "\u65B9\u6CD5C \xB7 \u63A8\u7406\u516C\u5F0F",
        { \u96E8\u529BSp: Sp + " mm/h", \u8870\u51CF\u6307\u6570n: n, \u5F84\u6D41\u7CFB\u6570\u03C8: psi, \u6C47\u6D41\u65F6\u95F4\u03C4: tau + " h", \u6C47\u6C34\u9762\u79EFF: F + " km\xB2" },
        { Qp: q.toFixed(2) + " m\xB3/s" },
        "JTG/T 3365-02-2020 \u7B2C6.2\u6761\uFF08\u66B4\u96E8\u63A8\u7406\u6CD5\uFF09"
      );
    } catch (e) {
      showMethodCError("rc", e instanceof Error ? e.message : String(e), e).textContent = "\u2014";
    }
    try {
      const phi = v("rdPhi"), h = v("rdH"), z = v("rdZ"), F2 = v("rdF"), b = v("rdBeta"), g = v("rdGamma"), d = v("rdDelta");
      $("rdH").classList.remove("invalid");
      $("rdZ").classList.remove("invalid");
      const q = runoffDepthFormula({ psi: phi, h, z, F: F2, beta: b, gamma: g, delta: d });
      stateCompare.C2 = {
        label: "\u65B9\u6CD5C \xB7 \u5F84\u6D41\u539A\u5EA6\u6CD5",
        q,
        freqLabel: freqLabelOf(state.freq),
        note: `F=${F2} km\xB2, h=${h} mm`
      };
      renderCompare();
      showMethodCError("rd", null).textContent = q.toFixed(2);
      logCalc(
        "\u65B9\u6CD5C \xB7 \u5F84\u6D41\u539A\u5EA6\u6CD5",
        {
          \u5730\u8C8C\u7CFB\u6570\u03C8: phi,
          \u5F84\u6D41\u539A\u5EA6h: h + " mm",
          \u6EDE\u7559\u539A\u5EA6z: z + " mm",
          \u6C47\u6C34\u9762\u79EFF: F2 + " km\xB2",
          \u6298\u51CF\u03B2: b,
          \u6298\u51CF\u03B3: g,
          \u6298\u51CF\u03B4: d
        },
        { Qp: q.toFixed(2) + " m\xB3/s" },
        "JTG/T 3365-02-2020 \u7B2C6.3\u6761\uFF08\u5F84\u6D41\u5F62\u6210\u6CD5\uFF0C\u9644\u5F55B \u8868B-9/B-5/B-10~13\uFF09"
      );
    } catch (e) {
      showMethodCError("rd", e instanceof Error ? e.message : String(e), e).textContent = "\u2014";
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
  $("btnHydroSample").onclick = () => {
    $("hydroTypical").value = "0 0\n2 267\n4 533\n6 800\n8 533\n10 267\n12 0";
    scheduleSave();
  };
  $("btnHydroUseQp").onclick = () => {
    const q = state.params.mean * (1 + phiPIII(state.freq, state.params.cs) * state.params.cv);
    $("hydroQp").value = q.toFixed(0);
    scheduleSave();
  };
  $("btnHydroScale").onclick = () => {
    const errEl = $("hydroErr");
    try {
      const typical = parseHydrograph($("hydroTypical").value);
      const r = scaleHydrograph(typical, +$("hydroQp").value);
      errEl.style.display = "none";
      $("hydroKg").textContent = r.kg.toFixed(4);
      $("hydroOut").style.display = "";
      $("hydroTable").innerHTML = r.points.map((p) => `<tr><td>${p.t}</td><td class="v">${fmt(p.q, 1)}</td></tr>`).join("");
      state.hydro = r;
    } catch (e) {
      errEl.style.display = "block";
      errEl.textContent = e instanceof Error ? e.message : String(e);
      $("hydroKg").textContent = "\u2014";
      $("hydroOut").style.display = "none";
      state.hydro = null;
    }
  };
  $("lkGo").onclick = () => {
    try {
      const zone = Math.round(+$("lkZone").value);
      const soil = $("lkSoil").value;
      const freq = +$("lkFreq").value;
      const tau = +$("lkTau").value;
      const r = lookupRunoffH(RUNOFF_TABLE_FULL, zone, soil, freq, tau);
      const onFreqNode = [1, 2, 4].some((p) => Math.abs(freq - p) < 1e-9);
      const onTauNode = [30, 45, 60, 80].some((t) => Math.abs(tau - t) < 1e-9);
      let note = "";
      if (!onFreqNode && !onTauNode) note = "\uFF08\u9891\u7387\u4E0E\u6C47\u6D41\u65F6\u95F4\u5747\u4E3A\u63D2\u503C/\u5916\u63A8\uFF09";
      else if (!onFreqNode) note = "\uFF08\u9891\u7387\u4E3A\u5BF9\u6570\u5916\u63A8\uFF0C\u8D85\u51FA\u8868\u5217 1/2/4%\uFF0C\u4EC5\u4F9B\u53C2\u8003\uFF09";
      else if (!onTauNode) note = "\uFF08\u6C47\u6D41\u65F6\u95F4\u63D2\u503C\uFF09";
      $("rdH").value = String(r.h);
      $("lkOut").textContent = `h=${r.h} mm${note}`;
      $("lkOut").style.color = "var(--text2)";
      logCalc(
        "\u67E5\u8868 \xB7 \u5F84\u6D41\u539A\u5EA6h",
        { \u66B4\u96E8\u5206\u533A: zone, \u571F\u58E4\u7C7B\u5C5E: soil, \u9891\u7387: freq + "%", \u6C47\u6D41\u65F6\u95F4: tau + " min" },
        { h: r.h + " mm" + (r.interpolated ? "\uFF08\u63D2\u503C/\u5916\u63A8\uFF09" : "\uFF08\u8868\u503C\uFF09") },
        "\u9644\u5F55B \u8868B-9"
      );
      calcMethodC();
    } catch (e) {
      $("lkOut").textContent = e instanceof Error ? e.message : String(e);
      $("lkOut").style.color = "var(--red)";
    }
  };
  function cbMsg(text, isErr = false) {
    const el = $("cbOut");
    el.textContent = text;
    el.style.color = isErr ? "var(--red)" : "var(--text2)";
  }
  function cbErr(e) {
    cbMsg(e instanceof Error ? e.message : String(e), true);
  }
  function cbFill(id, value, note, meta) {
    $(id).value = String(value);
    cbMsg(note);
    if (meta) logCalc(meta.module, meta.inputs, { [meta.key]: value }, meta.basis);
    calcMethodC();
  }
  for (const item of listZ()) {
    const opt = document.createElement("option");
    opt.value = item.z;
    opt.textContent = `${item.feature}\uFF08${item.z} mm\uFF09`;
    $("cbZFeature").appendChild(opt);
  }
  $("cbPsi").onclick = () => {
    try {
      const terrain = $("cbPsiTerrain").value;
      const f = +$("rdF").value;
      const r = lookupPsi(terrain, f);
      cbFill("rdPhi", r.value, r.note, { module: "\u67E5\u8868 \xB7 \u5730\u8C8C\u7CFB\u6570\u03C8", basis: "\u9644\u5F55B \u8868B-5", inputs: { \u5730\u5F62: terrain, \u6C47\u6C34\u9762\u79EFF: f + " km\xB2" }, key: "\u03C8" });
    } catch (e) {
      cbErr(e);
    }
  };
  $("cbTau").onclick = () => {
    try {
      const r = lookupTau(+$("cbTauF").value);
      cbFill("rcTau", r.value, r.note, { module: "\u67E5\u8868 \xB7 \u6C47\u6D41\u65F6\u95F4\u03C4", basis: "\u9644\u5F55B \u8868B-8", inputs: { \u6C47\u6C34\u9762\u79EFF: $("cbTauF").value + " km\xB2" }, key: "\u03C4(min)" });
    } catch (e) {
      cbErr(e);
    }
  };
  $("cbZ").onclick = () => {
    try {
      const sel = $("cbZFeature");
      const opt = sel.options[sel.selectedIndex];
      cbFill(
        "rdZ",
        sel.value,
        `\u5730\u9762\u7279\u5F81\uFF1A${opt.textContent ?? ""} \u2192 z=${sel.value} mm\uFF08\u8868B-10\uFF09`,
        { module: "\u67E5\u8868 \xB7 \u6EDE\u7559\u539A\u5EA6z", basis: "\u9644\u5F55B \u8868B-10", inputs: { \u5730\u9762\u7279\u5F81: opt.textContent ?? "" }, key: "z(mm)" }
      );
    } catch (e) {
      cbErr(e);
    }
  };
  $("cbBeta").onclick = () => {
    try {
      const d = +$("cbBetaD").value;
      const mtn = $("cbBetaMtn").value === "1";
      const r = lookupBeta(d, mtn);
      cbFill("rdBeta", r.value, r.note, { module: "\u67E5\u8868 \xB7 \u6D2A\u5CF0\u4F20\u64AD\u6298\u51CF\u03B2", basis: "\u9644\u5F55B \u8868B-11", inputs: { \u91CD\u5FC3\u8DDD\u6DB5\u4F4D: d + " km", \u5730\u5F62: mtn ? "\u5C71\u5730\u53CA\u5C71\u5CAD" : "\u5E73\u539F\u53CA\u4E18\u9675" }, key: "\u03B2" });
    } catch (e) {
      cbErr(e);
    }
  };
  $("cbGamma").onclick = () => {
    try {
      const w = +$("cbGammaW").value;
      const nw = $("cbGammaNw").value === "1";
      const tau = +$("rcTau").value;
      const r = lookupGamma(tau, w, nw);
      cbFill("rdGamma", r.value, r.note, { module: "\u67E5\u8868 \xB7 \u964D\u96E8\u4E0D\u5747\u5300\u6298\u51CF\u03B3", basis: "\u9644\u5F55B \u8868B-12", inputs: { \u6C47\u6C34\u533A\u5C3A\u5BF8: w + " km", \u6C47\u6D41\u65F6\u95F4: tau + " min", \u6C14\u5019\u533A: nw ? "\u897F\u5317\u548C\u5185\u8499" : "\u5B63\u5019\u98CE\u5730\u533A" }, key: "\u03B3" });
    } catch (e) {
      cbErr(e);
    }
  };
  $("cbDelta").onclick = () => {
    try {
      const r = lookupDelta(+$("cbDeltaF").value);
      cbFill("rdDelta", r.value, r.note, { module: "\u67E5\u8868 \xB7 \u6E56\u5E93\u8C03\u8282\u6298\u51CF\u03B4", basis: "\u9644\u5F55B \u8868B-13", inputs: { \u6E56\u6CCA\u7387: $("cbDeltaF").value + "%" }, key: "\u03B4" });
    } catch (e) {
      cbErr(e);
    }
  };
  $("cbZoneGo").onclick = () => {
    const q = $("cbZoneQ").value.trim();
    const out = $("cbZoneOut");
    if (!q) {
      out.textContent = "\u8BF7\u8F93\u5165\u7701\u4EFD\u6216\u5C71\u5DDD\u540D";
      out.style.color = "var(--red)";
      return;
    }
    const zones = allZones();
    const hits = [];
    for (const [no, z2] of Object.entries(zones)) {
      const hay = `${z2.range} ${z2.east} ${z2.south} ${z2.west} ${z2.north}`;
      if (hay.includes(q)) hits.push(no);
    }
    if (!hits.length) {
      out.textContent = `\u672A\u627E\u5230\u5305\u542B\u300C${q}\u300D\u7684\u5206\u533A\uFF0C\u53EF\u6362\u7701\u4EFD\u6216\u5C71\u8109\u540D\u518D\u8BD5`;
      out.style.color = "var(--red)";
      return;
    }
    $("lkZone").value = hits[0];
    const z = lookupZone(Number(hits[0]));
    out.textContent = `\u547D\u4E2D\u7B2C ${hits.join("\u3001")} \u533A \u2192 \u5DF2\u586B\u5165 ${hits[0]} \u533A\uFF1B${z.range}`;
    out.style.color = "var(--text2)";
  };
  function calcBridgeOpening() {
    const err = $("opErr");
    const out = $("opOut");
    const detail = $("opDetail");
    try {
      const Qp = +$("opQp").value, Qc = +$("opQc").value, Bc = +$("opBc").value;
      const reach = $("opReach").value;
      const r = minBridgeOpening({ Qp, Qc, Bc, reach });
      out.textContent = r.Lj.toFixed(2);
      const coef = REACH_TABLE[reach];
      detail.innerHTML = "";
      const lines = [
        `Lj = ${r.Kq} \xD7 (${Qp}/${Qc})<sup>${r.n3}</sup> \xD7 ${Bc} = <b>${r.Lj.toFixed(2)} m</b>`,
        `\u6CB3\u6BB5\uFF1A${coef.label}\uFF08Kq=${r.Kq}\uFF0Cn\u2083=${r.n3}\uFF09`,
        `\u6D41\u91CF\u6BD4 Qp/Qc = ${r.ratio.toFixed(3)}\uFF0C\u6CB3\u6EE9\u6D41\u91CF Qt = Qp\u2212Qc = ${r.Qt.toFixed(2)} m\xB3/s`
      ];
      for (const l of lines) {
        const d = document.createElement("div");
        d.innerHTML = l;
        detail.appendChild(d);
      }
      err.style.display = "none";
      err.textContent = "";
      logCalc(
        "\u6865\u5B54\u8BBE\u8BA1 \xB7 \u6700\u5C0F\u51C0\u957F\u5EA6",
        { \u8BBE\u8BA1\u6D41\u91CFQp: Qp + " m\xB3/s", \u6CB3\u69FD\u6D41\u91CFQc: Qc + " m\xB3/s", \u6CB3\u69FD\u5BBD\u5EA6Bc: Bc + " m", \u6CB3\u6BB5: coef.label },
        { Lj: r.Lj.toFixed(2) + " m" },
        "JTG C30\u20142015 \u7B2C7.2.1\u6761\uFF08\u516C\u5F0F7.2.1-1\uFF0C\u88687.2.1\uFF09",
        { Kq: r.Kq, n3: r.n3, "Qp/Qc": r.ratio.toFixed(3) }
      );
    } catch (e) {
      out.textContent = "\u2014";
      detail.innerHTML = "";
      err.style.display = "block";
      showErr(err, e);
    }
  }
  if ($("opGo")) {
    $("opGo").onclick = calcBridgeOpening;
    $("opUseQ").onclick = () => {
      const raw = ($("outQ").textContent ?? "").replace(/[^0-9.]/g, "");
      const q = Number(raw);
      if (Number.isFinite(q) && q > 0) {
        $("opQp").value = String(q);
        calcBridgeOpening();
      } else {
        const err = $("opErr");
        err.style.display = "block";
        err.textContent = "\u5F53\u524D\u8FD8\u6CA1\u6709\u6709\u6548\u7684\u8BBE\u8BA1\u6D41\u91CF\uFF0C\u8BF7\u5148\u8BA1\u7B97\u5E76\u9002\u7EBF";
      }
    };
    const reachBtns = [["reach0", "stable"], ["reach1", "substable"], ["reach2", "unstable"]];
    for (const [btnId, val] of reachBtns) {
      $(btnId).onclick = () => {
        $("opReach").value = val;
        calcBridgeOpening();
      };
    }
  }
  function calcScour() {
    const err = $("scErr"), out = $("scOut"), detail = $("scDetail");
    try {
      const Q2 = +$("scQ2").value, mu = +$("scMu").value, Bcj = +$("scBcj").value;
      const hmc = +$("scHmc").value, hcq = +$("scHcq").value, d50 = +$("scD50").value;
      const rho = +$("scRho").value;
      const { E, band } = sandCoefE(rho);
      const A = +$("scA").value;
      const r = generalScour641({ Q2, mu, Bcj, hmc, hcq, E, d50, A });
      lastGeneralHp = r.hp;
      lastGeneralHy = r.hy;
      lastScourE = E;
      lastD50 = d50;
      out.textContent = r.hp.toFixed(2);
      detail.innerHTML = "";
      const lines = [
        `hp = [ ${A} \xD7 (${Q2}/(${mu}\xD7${Bcj})) \xD7 (${hmc}/${hcq})<sup>5/3</sup> \xF7 (${E}\xD7${d50}<sup>1/6</sup>) ]<sup>3/5</sup> = <b>${r.hp.toFixed(2)} m</b>`,
        `\u5355\u5BBD\u6D41\u91CF q = ${r.q} m\xB3/(s\xB7m)\uFF1B\u51B2\u5237\u6DF1\u5EA6 hy = hp \u2212 hmc = <b>${r.hy.toFixed(2)} m</b>`,
        `\u51B2\u6B62\u6D41\u901F\u6821\u6838 vz = ${r.vz} m/s\uFF08\u7406\u8BBA E\xB7d\u0304<sup>1/6</sup> = ${r.vzTheory} m/s\uFF0C\u4E00\u81F4\u5373\u516C\u5F0F\u95ED\u5408\uFF09`,
        `\u542B\u6C99\u91CF\u7CFB\u6570 E = ${E}\uFF08${band} kg/m\xB3\uFF0C\u88688.3.1-2\uFF09`
      ];
      for (const l of lines) {
        const d = document.createElement("div");
        d.innerHTML = l;
        detail.appendChild(d);
      }
      for (const w of r.warnings) {
        const d = document.createElement("div");
        d.textContent = "\u63D0\u793A\uFF1A" + w;
        d.style.color = "var(--amber)";
        detail.appendChild(d);
      }
      err.style.display = "none";
      err.textContent = "";
      logCalc(
        "\u51B2\u5237 \xB7 \u4E00\u822C\u51B2\u523764-1",
        {
          \u8BBE\u8BA1\u6D41\u91CFQ2: Q2 + " m\xB3/s",
          \u538B\u7F29\u7CFB\u6570\u03BC: mu,
          \u8FC7\u6C34\u51C0\u5BBDBcj: Bcj + " m",
          \u6CB3\u69FD\u6700\u5927\u6C34\u6DF1: hmc + " m",
          \u6CB3\u69FD\u5E73\u5747\u6C34\u6DF1: hcq + " m",
          \u5E73\u5747\u7C92\u5F84: d50 + " mm",
          \u542B\u6C99\u91CF: rho + " kg/m\xB3",
          \u96C6\u4E2D\u7CFB\u6570A: A
        },
        { hp: r.hp.toFixed(2) + " m", \u51B2\u5237\u6DF1\u5EA6hy: r.hy.toFixed(2) + " m" },
        "JTG C30\u20142015 \u7B2C8.3.1\u6761\uFF0864-1\u4FEE\u6B63\u5F0F\uFF0C\u88688.3.1-2\uFF09",
        { E, q: r.q, \u51B2\u6B62\u6D41\u901Fvz: r.vz }
      );
    } catch (e) {
      out.textContent = "\u2014";
      detail.innerHTML = "";
      err.style.display = "block";
      showErr(err, e);
    }
  }
  if ($("scGo")) {
    $("scGo").onclick = calcScour;
    $("scUseQ").onclick = () => {
      const raw = ($("outQ").textContent ?? "").replace(/[^0-9.]/g, "");
      const q = Number(raw);
      if (Number.isFinite(q) && q > 0) {
        $("scQ2").value = String(q);
        calcScour();
      } else {
        const err = $("scErr");
        err.style.display = "block";
        err.textContent = "\u5F53\u524D\u8FD8\u6CA1\u6709\u6709\u6548\u7684\u8BBE\u8BA1\u6D41\u91CF\uFF0C\u8BF7\u5148\u8BA1\u7B97\u5E76\u9002\u7EBF";
      }
    };
    $("scCalcA").onclick = () => {
      try {
        const r = concentrationFactorA(+$("scBd").value, +$("scHz").value);
        $("scA").value = String(r.A);
        const tip = $("scATip");
        tip.textContent = r.capped ? `A=${r.A}\uFF08\u539F\u59CB\u503C>1.8\uFF0C\u5DF2\u6309\u89C4\u8303\u53D6 1.8\uFF09` : `A = (\u221A${$("scBd").value} / ${$("scHz").value})^0.15 = ${r.A}`;
        calcScour();
      } catch (e) {
        const err = $("scErr");
        err.style.display = "block";
        showErr(err, e);
      }
    };
  }
  var lastGeneralHp = 0;
  var lastGeneralHy = 0;
  var lastScourE = 0.66;
  var lastD50 = 0.14;
  function calcLocalScour() {
    const err = $("lsErr"), out = $("lsOut"), detail = $("lsDetail");
    try {
      const v = +$("lsV").value, B1 = +$("lsB1").value, Kxi = +$("lsKxi").value;
      const d50 = lastD50;
      const hp = lastGeneralHp > 0 ? lastGeneralHp : +$("scHmc").value;
      const r = localScour652({ v, d50, B1, hp, Kxi });
      out.textContent = r.hb.toFixed(2);
      detail.innerHTML = "";
      const lines = [
        `v\u2080 = 0.28\xB7(${d50}+0.7)^0.5 = ${r.v0} m/s\uFF1Bv\u2080\u2032 = 0.12\xB7(${d50}+0.5)^0.55 = ${r.v0p} m/s`,
        `K<sub>\u03B72</sub> = ${r.Keta2}\uFF1Bn\u2082 = ${r.n2}\uFF1B\u91C7\u7528\u5206\u652F\uFF1A${r.branch === "no-scour" ? "\u4E0D\u51B2\u5237" : r.branch === "v<=v0" ? "v\u2264v\u2080\uFF08\u4E00\u5F0F\uFF09" : "v>v\u2080\uFF08\u4E8C\u5F0F\uFF09"}`,
        `h<sub>p</sub> = ${hp.toFixed(2)} m\uFF08\u4E00\u822C\u51B2\u5237\u540E\u6C34\u6DF1\uFF09`
      ];
      for (const l of lines) {
        const d = document.createElement("div");
        d.innerHTML = l;
        detail.appendChild(d);
      }
      for (const w of r.warnings) {
        const d = document.createElement("div");
        d.textContent = "\u63D0\u793A\uFF1A" + w;
        d.style.color = "var(--amber)";
        detail.appendChild(d);
      }
      err.style.display = "none";
      err.textContent = "";
      logCalc(
        "\u51B2\u5237 \xB7 \u5C40\u90E8\u51B2\u523765-2",
        { \u884C\u8FD1\u6D41\u901Fv: v + " m/s", \u6865\u58A9\u8BA1\u7B97\u5BBD\u5EA6B1: B1 + " m", \u58A9\u5F62\u7CFB\u6570K\u03BE: Kxi, \u5E73\u5747\u7C92\u5F84: d50 + " mm", \u4E00\u822C\u51B2\u5237\u540E\u6C34\u6DF1hp: hp.toFixed(2) + " m" },
        { hb: r.hb.toFixed(2) + " m" },
        "JTG C30\u20142015 \u7B2C8.4.1\u6761\uFF0865-2\u5F0F\uFF09",
        { v0: r.v0, "v0\u2032": r.v0p, Keta2: r.Keta2, n2: r.n2, \u5206\u652F: r.branch }
      );
      return r.hb;
    } catch (e) {
      out.textContent = "\u2014";
      detail.innerHTML = "";
      err.style.display = "block";
      showErr(err, e);
      return 0;
    }
  }
  if ($("lsGo")) {
    $("lsGo").onclick = () => {
      calcLocalScour();
    };
    $("lsUseV").onclick = () => {
      try {
        if (lastGeneralHp <= 0) throw new Error("\u8BF7\u5148\u5B8C\u6210\u4E00\u822C\u51B2\u5237\u8BA1\u7B97");
        const v = approachVelocity641(lastScourE, lastD50, lastGeneralHp);
        $("lsV").value = v.toFixed(3);
        const err = $("lsErr");
        err.style.display = "none";
        calcLocalScour();
      } catch (e) {
        const err = $("lsErr");
        err.style.display = "block";
        showErr(err, e);
      }
    };
    $("tsGo").onclick = () => {
      const hbRaw = ($("lsOut").textContent ?? "").replace(/[^0-9.]/g, "");
      const hb = Number(hbRaw);
      const r = totalScour({
        natural: +$("tsNat").value,
        general: lastGeneralHy,
        local: Number.isFinite(hb) ? hb : 0
      });
      $("tsOut").textContent = r.total.toFixed(2);
      const note = $("tsNote");
      note.innerHTML = "";
      for (const n of r.notes) {
        const d = document.createElement("div");
        d.textContent = "\xB7 " + n;
        note.appendChild(d);
      }
    };
  }
  var helpRendered = false;
  function renderHelp() {
    if (helpRendered) return;
    const secBox = $("helpSections");
    for (const sec of HELP_SECTIONS) {
      const d = document.createElement("details");
      d.open = true;
      d.style.marginTop = "10px";
      const s = document.createElement("summary");
      s.style.cursor = "pointer";
      s.style.fontSize = "13px";
      s.style.fontWeight = "500";
      s.style.color = "var(--blue)";
      s.textContent = `${sec.title}\uFF08${sec.spec}\uFF09`;
      d.appendChild(s);
      const table = document.createElement("table");
      table.className = "ltab";
      table.style.fontSize = "12px";
      for (const it of sec.items) {
        const tr = document.createElement("tr");
        const td1 = document.createElement("td");
        td1.style.whiteSpace = "nowrap";
        td1.innerHTML = `<b>${it.no}</b>` + (it.page ? `<br><span style="color:var(--text2)">${it.page}</span>` : "");
        const td2 = document.createElement("td");
        td2.innerHTML = `<b>${it.title}</b><br><span style="color:var(--text2)">${it.summary}</span>`;
        tr.appendChild(td1);
        tr.appendChild(td2);
        table.appendChild(tr);
      }
      d.appendChild(table);
      secBox.appendChild(d);
    }
    const srcBox = $("helpSources");
    for (const s of HELP_SOURCES) {
      const d = document.createElement("div");
      d.style.marginBottom = "8px";
      const link = s.url ? `<br><a href="${s.url}" target="_blank" rel="noopener" style="color:var(--blue);font-size:12px">${s.url}</a>` : "";
      d.innerHTML = `<b>${s.name}</b><br><span style="color:var(--text2);font-size:12px">${s.detail}</span>${link}`;
      srcBox.appendChild(d);
    }
    const faqBox = $("helpFaq");
    for (const f of HELP_FAQ) {
      const d = document.createElement("div");
      d.style.marginBottom = "8px";
      d.innerHTML = `<b>\u95EE\uFF1A${f.q}</b><br><span style="color:var(--text2);font-size:12px">\u7B54\uFF1A${f.a}</span>`;
      faqBox.appendChild(d);
    }
    const valBox = $("helpValidation");
    for (const v of HELP_VALIDATION) {
      const d = document.createElement("div");
      d.style.fontSize = "12px";
      d.style.color = "var(--text2)";
      d.textContent = "\xB7 " + v;
      valBox.appendChild(d);
    }
    helpRendered = true;
  }
  function svgMarkup() {
    const svg = $("chart");
    let s = svg.outerHTML;
    if (!/xmlns=/.test(s)) s = s.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    return s;
  }
  if ($("exSvg")) {
    $("exSvg").onclick = () => {
      downloadBlob(new Blob([svgMarkup()], { type: "image/svg+xml;charset=utf-8" }), "\u9891\u7387\u66F2\u7EBF.svg");
    };
    $("exPng").onclick = async () => {
      try {
        const url = await svgToPngDataUrl();
        const a = document.createElement("a");
        a.href = url;
        a.download = "\u9891\u7387\u66F2\u7EBF.png";
        a.click();
        $("exMsg").textContent = "\u5DF2\u5BFC\u51FA PNG\uFF082 \u500D\u50CF\u7D20\u5BC6\u5EA6\uFF09";
      } catch {
        $("exMsg").textContent = "PNG \u5BFC\u51FA\u5931\u8D25\uFF0C\u8BF7\u6539\u7528 SVG";
      }
    };
  }
  function readFileText(inputId) {
    return new Promise((resolve, reject) => {
      const el = $(inputId);
      const f = el.files && el.files[0];
      if (!f) {
        reject(new Error("\u8BF7\u5148\u9009\u62E9\u6587\u4EF6"));
        return;
      }
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("\u6587\u4EF6\u8BFB\u53D6\u5931\u8D25"));
      r.readAsText(f, "utf-8");
    });
  }
  if ($("pdGo")) {
    $("pdGo").onclick = async () => {
      const box = $("pdOut");
      const msg = $("pdMsg");
      try {
        const [ta, tb] = await Promise.all([readFileText("pdA"), readFileText("pdB")]);
        const A = parseProjectFile(JSON.parse(ta));
        const B = parseProjectFile(JSON.parse(tb));
        const d = diffProjectFiles(A, B);
        box.innerHTML = "";
        const head = document.createElement("div");
        head.style.fontSize = "12px";
        head.innerHTML = `\u65E7\u7248\uFF1A<b>${d.aLabel || "\u2014"}</b> \uFF5C \u65B0\u7248\uFF1A<b>${d.bLabel || "\u2014"}</b> \uFF5C \u53D8\u5316 <b>${d.rows.length}</b> \u9879`;
        box.appendChild(head);
        if (d.rows.length === 0) {
          const none = document.createElement("div");
          none.style.fontSize = "12px";
          none.textContent = "\u4E24\u4EFD\u5DE5\u7A0B\u6587\u4EF6\u5728\u8BBE\u8BA1\u8F93\u5165\u4E0A\u5B8C\u5168\u4E00\u81F4\uFF08\u65F6\u95F4\u6233\u4E0E\u7248\u672C\u53F7\u7684\u5DEE\u5F02\u5DF2\u5FFD\u7565\uFF09";
          box.appendChild(none);
          return;
        }
        const table = document.createElement("table");
        table.className = "ltab";
        table.style.fontSize = "12px";
        const trh = document.createElement("tr");
        for (const h of ["\u5B57\u6BB5", "\u65E7\u503C", "\u65B0\u503C", "\u53D8\u5316"]) {
          const th = document.createElement("th");
          th.textContent = h;
          trh.appendChild(th);
        }
        table.appendChild(trh);
        for (const r of d.rows) {
          const tr = document.createElement("tr");
          for (const v of [r.path, r.a, r.b, r.delta ?? "\u2014"]) {
            const td = document.createElement("td");
            td.textContent = v;
            tr.appendChild(td);
          }
          table.appendChild(tr);
        }
        box.appendChild(table);
        msg.textContent = "";
      } catch (e) {
        msg.textContent = e instanceof Error ? e.message : String(e);
      }
    };
    $("pdMd").onclick = async () => {
      const msg = $("pdMsg");
      try {
        const [ta, tb] = await Promise.all([readFileText("pdA"), readFileText("pdB")]);
        const d = diffProjectFiles(parseProjectFile(JSON.parse(ta)), parseProjectFile(JSON.parse(tb)));
        downloadText(diffToMarkdown(d), "\u5DE5\u7A0B\u6587\u4EF6\u5BF9\u6BD4.md", "text/markdown;charset=utf-8");
        msg.textContent = "\u5DF2\u5BFC\u51FA\u5BF9\u6BD4\u6458\u8981";
      } catch (e) {
        msg.textContent = e instanceof Error ? e.message : String(e);
      }
    };
  }
  var mapState = { bg: null, calib: [], poly: [], river: [], scale: null, last: null };
  var geo = {
    tk: localStorage.getItem("hongsuan_tdt_tk") ?? "",
    layer: "img_w",
    lon: 112.9388,
    lat: 28.2282,
    z: 12,
    poly: [],
    river: [],
    loaded: false
  };
  var CANVAS_W = 900;
  var CANVAS_H = 560;
  function isOnline() {
    return $("mapSrc").value === "online";
  }
  function tdtUrl(tx, ty, z) {
    const s = Math.floor(Math.abs(tx + ty)) % 4;
    return `https://t${s}.tianditu.gov.cn/DataServer?T=${geo.layer}&x=${tx}&y=${ty}&l=${z}&tk=${encodeURIComponent(geo.tk)}`;
  }
  function canvasToLonLat(cx, cy) {
    const c = lonLatToWorldPx({ lon: geo.lon, lat: geo.lat }, geo.z);
    const ox = c.x - CANVAS_W / 2, oy = c.y - CANVAS_H / 2;
    return worldPxToLonLat(ox + cx, oy + cy, geo.z);
  }
  function lonLatToCanvas(p) {
    const c = lonLatToWorldPx({ lon: geo.lon, lat: geo.lat }, geo.z);
    const ox = c.x - CANVAS_W / 2, oy = c.y - CANVAS_H / 2;
    const w = lonLatToWorldPx(p, geo.z);
    return { x: w.x - ox, y: w.y - oy };
  }
  function renderOnlineMap() {
    const parts = [];
    if (geo.loaded && geo.tk) {
      const c = lonLatToWorldPx({ lon: geo.lon, lat: geo.lat }, geo.z);
      const ox = c.x - CANVAS_W / 2, oy = c.y - CANVAS_H / 2;
      const tx0 = Math.floor(ox / 256), tx1 = Math.floor((ox + CANVAS_W) / 256);
      const ty0 = Math.floor(oy / 256), ty1 = Math.floor((oy + CANVAS_H) / 256);
      for (let tx = tx0; tx <= tx1; tx++) {
        for (let ty = ty0; ty <= ty1; ty++) {
          const px = tx * 256 - ox, py = ty * 256 - oy;
          parts.push(
            `<image href="${tdtUrl(tx, ty, geo.z)}" x="${px}" y="${py}" width="256" height="256"/>`
          );
        }
      }
    } else {
      parts.push(
        `<rect x="0" y="0" width="${CANVAS_W}" height="${CANVAS_H}" fill="#f5f5f7"/><text x="20" y="46" font-size="16" font-weight="600" fill="#2c2c2a">\u8FD9\u91CC\u662F\u5730\u56FE\u91CF\u7B97\u753B\u5E03</text><text x="20" y="78" font-size="14" fill="#5f5e5a">\u65B9\u5F0F\u4E00\uFF1A\u4E0A\u65B9\u586B\u5165\u5929\u5730\u56FE tk\uFF08\u5B98\u7F51\u514D\u8D39\u7533\u8BF7\uFF09\u2192 \u70B9\u300C\u52A0\u8F7D\u5E95\u56FE\u300D\uFF0C\u5373\u53EF\u770B\u5230\u771F\u5B9E\u5F71\u50CF / \u5730\u5F62 / \u77E2\u91CF</text><text x="20" y="104" font-size="14" fill="#5f5e5a">\u65B9\u5F0F\u4E8C\uFF1A\u5E95\u56FE\u65B9\u5F0F\u5207\u5230\u300C\u672C\u5730\u56FE\u7247\u300D\uFF0C\u5BFC\u5165\u4F60\u81EA\u5DF1\u7684\u5730\u5F62\u56FE\u6216\u5F71\u50CF\u622A\u56FE\uFF08\u65AD\u7F51\u4E5F\u80FD\u7528\uFF09</text><text x="20" y="138" font-size="13" fill="#8a8a84">\u65E0\u8BBA\u54EA\u79CD\u65B9\u5F0F\uFF0C\u90FD\u53EF\u4EE5\u76F4\u63A5\u6CBF\u5206\u6C34\u5CAD\u70B9\u51FB\u52FE\u51FA\u6C47\u6C34\u533A\uFF1B\u5728\u7EBF\u6A21\u5F0F\u4E0B F \u7531\u7ECF\u7EAC\u5EA6\u81EA\u52A8\u7B97\u51FA\uFF0C\u4E0D\u7528\u6807\u6BD4\u4F8B\u5C3A</text>`
      );
    }
    if (geo.poly.length >= 2) {
      const d = geo.poly.map((p) => {
        const q = lonLatToCanvas(p);
        return `${q.x},${q.y}`;
      }).join(" ");
      parts.push(`<polygon points="${d}" fill="#378add" fill-opacity="0.18" stroke="#185fa5" stroke-width="2"/>`);
    }
    if (geo.river.length >= 2) {
      const d = geo.river.map((p) => {
        const q = lonLatToCanvas(p);
        return `${q.x},${q.y}`;
      }).join(" ");
      parts.push(`<polyline points="${d}" fill="none" stroke="#1d9e75" stroke-width="2.5"/>`);
    }
    for (const arr of [geo.poly, geo.river]) {
      for (const p of arr) {
        const q = lonLatToCanvas(p);
        parts.push(`<circle cx="${q.x}" cy="${q.y}" r="3.5" fill="#fff" stroke="#333" stroke-width="1.2"/>`);
      }
    }
    const mode = $("mapMode").value;
    const tip = mode === "poly" ? "\u6CBF\u5206\u6C34\u5CAD\u4F9D\u6B21\u70B9\u51FB\uFF08\u6309\u7ECF\u7EAC\u5EA6\u8BB0\u5F55\uFF0C\u65E0\u9700\u6807\u6BD4\u4F8B\u5C3A\uFF09" : mode === "river" ? "\u4ECE\u4E0A\u6E38\u5230\u51FA\u53E3\u4F9D\u6B21\u70B9\u51FB\u4E3B\u6CB3\u6C9F\u4E2D\u5FC3\u7EBF" : "\u5728\u7EBF\u5E95\u56FE\u65E0\u9700\u6807\u5B9A\uFF1B\u5207\u5230\u672C\u5730\u56FE\u7247\u624D\u9700\u8981\u6807\u5B9A\u6BD4\u4F8B\u5C3A";
    parts.push(`<text x="12" y="24" font-size="13" fill="#5f5e5a">${tip}</text>`);
    $("mapCanvas").innerHTML = parts.join("");
  }
  function mapPtsOfCurrentMode() {
    const mode = $("mapMode").value;
    if (mode === "calib") return mapState.calib;
    if (mode === "poly") return mapState.poly;
    return mapState.river;
  }
  function toSvgPoint(evt) {
    const svg = $("mapCanvas");
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = pt.matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function renderMap() {
    if (isOnline()) {
      renderOnlineMap();
      return;
    }
    const pts = mapPtsOfCurrentMode();
    const parts = [];
    if (mapState.bg) {
      parts.push(`<image href="${mapState.bg}" x="0" y="0" width="900" height="560" preserveAspectRatio="xMidYMid meet" opacity="0.9"/>`);
    }
    if (mapState.calib.length >= 2) {
      const [a, b] = mapState.calib;
      parts.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#d85a30" stroke-width="2"/>`);
    }
    if (mapState.poly.length >= 2) {
      const d = mapState.poly.map((p) => `${p.x},${p.y}`).join(" ");
      parts.push(`<polygon points="${d}" fill="#378add" fill-opacity="0.15" stroke="#185fa5" stroke-width="2"/>`);
    }
    if (mapState.river.length >= 2) {
      const d = mapState.river.map((p) => `${p.x},${p.y}`).join(" ");
      parts.push(`<polyline points="${d}" fill="none" stroke="#1d9e75" stroke-width="2.5"/>`);
    }
    for (const arr of [mapState.calib, mapState.poly, mapState.river]) {
      for (const p of arr) {
        parts.push(`<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#fff" stroke="#333" stroke-width="1.2"/>`);
      }
    }
    const mode = $("mapMode").value;
    const tip = mode === "calib" ? "\u5728\u56FE\u4E0A\u70B9\u4E24\u70B9\uFF0C\u6807\u51FA\u4E00\u6BB5\u5DF2\u77E5\u5B9E\u9645\u8DDD\u79BB" : mode === "poly" ? "\u6CBF\u5206\u6C34\u5CAD\u4F9D\u6B21\u70B9\u51FB\uFF0C\u56F4\u51FA\u6C47\u6C34\u533A" : "\u4ECE\u4E0A\u6E38\u5230\u51FA\u53E3\u4F9D\u6B21\u70B9\u51FB\u4E3B\u6CB3\u6C9F\u4E2D\u5FC3\u7EBF";
    parts.push(`<text x="12" y="24" font-size="13" fill="#5f5e5a">${esc(tip)}</text>`);
    $("mapCanvas").innerHTML = parts.join("");
  }
  if ($("mapCanvas")) {
    $("mapCanvas").addEventListener("click", (e) => {
      const p = toSvgPoint(e);
      if (isOnline()) {
        const ll = canvasToLonLat(p.x, p.y);
        const mode = $("mapMode").value;
        if (mode === "river") geo.river.push(ll);
        else geo.poly.push(ll);
        renderMap();
        return;
      }
      const arr = mapPtsOfCurrentMode();
      arr.push(p);
      if ($("mapMode").value === "calib" && arr.length > 2) arr.splice(0, arr.length - 2);
      renderMap();
    });
    $("mapImg").onchange = () => {
      const el = $("mapImg");
      const f = el.files && el.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        mapState.bg = String(r.result);
        renderMap();
      };
      r.readAsDataURL(f);
    };
    $("mapMode").onchange = renderMap;
    $("mapClear").onclick = () => {
      mapState.calib = [];
      mapState.poly = [];
      mapState.river = [];
      mapState.scale = null;
      mapState.last = null;
      geo.poly = [];
      geo.river = [];
      $("mapOut").innerHTML = "";
      $("mapErr").textContent = "";
      $("mapScaleTip").textContent = "";
      renderMap();
    };
    $("mapGo").onclick = () => {
      const out = $("mapOut"), err = $("mapErr");
      try {
        if (isOnline()) {
          const h12 = +$("mapH1").value, h22 = +$("mapH2").value;
          const r2 = measureFromLonLat({
            poly: geo.poly,
            river: geo.river.length >= 2 ? geo.river : void 0,
            hTop: Number.isFinite(h12) ? h12 : void 0,
            hBottom: Number.isFinite(h22) ? h22 : void 0
          });
          mapState.last = { F: r2.F, L: r2.L, I: r2.I };
          const lines2 = [
            `\u6C47\u6C34\u9762\u79EF <b>F = ${r2.F} km\xB2</b>\uFF08\u7531 ${geo.poly.length} \u4E2A\u7ECF\u7EAC\u5EA6\u9876\u70B9\u76F4\u63A5\u91CF\u7B97\uFF0C\u65E0\u9700\u6807\u6BD4\u4F8B\u5C3A\uFF09`,
            r2.L === null ? "\u4E3B\u6CB3\u6C9F\u957F\u5EA6 L\uFF1A\u672A\u52FE\uFF08\u53EF\u9009\uFF09" : `\u4E3B\u6CB3\u6C9F\u957F\u5EA6 <b>L = ${r2.L} km</b>\uFF08Haversine\uFF09`,
            r2.I === null ? "\u5E73\u5747\u6BD4\u964D I\uFF1A\u9700\u540C\u65F6\u7ED9\u51FA\u4E0A\u4E0B\u6E38\u9AD8\u7A0B" : `\u5E73\u5747\u6BD4\u964D <b>I = ${r2.I}</b>\uFF08${r2.Ipermille}\u2030\uFF09`
          ];
          out.innerHTML = lines2.map((l) => `<div>${l}</div>`).join("") + r2.warnings.map((w) => `<div style="color:var(--amber)">\u63D0\u793A\uFF1A${w}</div>`).join("");
          err.style.display = "none";
          logCalc(
            "\u5730\u56FE\u91CF\u7B97 \xB7 \u6C47\u6C34\u533A\uFF08\u5728\u7EBF\u5E95\u56FE\uFF09",
            { \u5E95\u56FE: "\u5929\u5730\u56FE " + geo.layer, \u7EA7\u522B: geo.z, \u6C47\u6C34\u533A\u9876\u70B9: geo.poly.length, \u4E3B\u6CB3\u6C9F\u70B9: geo.river.length },
            { F: r2.F + " km\xB2", L: r2.L === null ? "\u672A\u52FE" : r2.L + " km", I: r2.I === null ? "\u7F3A\u9AD8\u7A0B" : String(r2.I) },
            "\u7ECF\u7EAC\u5EA6\u591A\u8FB9\u5F62\u9762\u79EF\uFF08\u7B49\u8DDD\u5706\u67F1\u6295\u5F71\uFF09+ Haversine \u6CB3\u957F"
          );
          return;
        }
        if (mapState.calib.length < 2) throw new Error("\u8BF7\u5148\u5728\u56FE\u4E0A\u6807\u5B9A\u6BD4\u4F8B\u5C3A\uFF08\u70B9\u4E24\u70B9 + \u586B\u5B9E\u9645\u8DDD\u79BB\uFF09");
        const a = mapState.calib[0], b = mapState.calib[1];
        const pixelDistance = Math.hypot(b.x - a.x, b.y - a.y);
        if (!(pixelDistance > 0)) throw new Error("\u6807\u5B9A\u70B9\u91CD\u5408\uFF0C\u8BF7\u91CD\u65B0\u70B9\u4E24\u70B9");
        const realDistanceM = +$("mapRealD").value;
        mapState.scale = { pixelDistance, realDistanceM };
        const h1 = +$("mapH1").value, h2 = +$("mapH2").value;
        const r = measureCatchment({
          poly: mapState.poly,
          river: mapState.river.length >= 2 ? mapState.river : void 0,
          scale: mapState.scale,
          hTop: Number.isFinite(h1) ? h1 : void 0,
          hBottom: Number.isFinite(h2) ? h2 : void 0
        });
        mapState.last = { F: r.F, L: r.L, I: r.I };
        const lines = [
          `\u6BD4\u4F8B\u5C3A\uFF1A${pixelDistance.toFixed(1)} \u50CF\u7D20 = ${realDistanceM} m\uFF081 \u50CF\u7D20 = ${r.metersPerPixel} m\uFF09`,
          `\u6C47\u6C34\u9762\u79EF <b>F = ${r.F} km\xB2</b>\uFF08\u56FE\u4E0A ${r.areaPx} \u50CF\u7D20\xB2\uFF09`,
          r.L === null ? "\u4E3B\u6CB3\u6C9F\u957F\u5EA6 L\uFF1A\u672A\u52FE\uFF08\u53EF\u9009\uFF09" : `\u4E3B\u6CB3\u6C9F\u957F\u5EA6 <b>L = ${r.L} km</b>`,
          r.I === null ? "\u5E73\u5747\u6BD4\u964D I\uFF1A\u9700\u540C\u65F6\u7ED9\u51FA\u4E0A\u4E0B\u6E38\u9AD8\u7A0B" : `\u5E73\u5747\u6BD4\u964D <b>I = ${r.I}</b>\uFF08${r.Ipermille}\u2030\uFF09`
        ];
        out.innerHTML = lines.map((l) => `<div>${l}</div>`).join("") + r.warnings.map((w) => `<div style="color:var(--amber)">\u63D0\u793A\uFF1A${esc(w)}</div>`).join("");
        $("mapScaleTip").textContent = `\u5DF2\u6807\u5B9A\uFF1A1 \u50CF\u7D20 = ${r.metersPerPixel} m`;
        err.style.display = "none";
        logCalc(
          "\u5730\u56FE\u91CF\u7B97 \xB7 \u6C47\u6C34\u533A",
          {
            \u6807\u5B9A\u70B9: `${pixelDistance.toFixed(1)} \u50CF\u7D20 = ${realDistanceM} m`,
            \u6C47\u6C34\u533A\u9876\u70B9: mapState.poly.length,
            \u4E3B\u6CB3\u6C9F\u70B9: mapState.river.length
          },
          { F: r.F + " km\xB2", L: r.L === null ? "\u672A\u52FE" : r.L + " km", I: r.I === null ? "\u7F3A\u9AD8\u7A0B" : String(r.I) },
          "\u56FE\u5F62\u91CF\u7B97\uFF08\u978B\u5E26\u516C\u5F0F \xD7 \u7528\u6237\u6807\u5B9A\u6BD4\u4F8B\u5C3A\uFF09"
        );
      } catch (e) {
        out.innerHTML = "";
        err.style.display = "block";
        showErr(err, e);
      }
    };
    const syncSrc = () => {
      const on = isOnline();
      $("mapOnlineCtl").style.display = on ? "inline-flex" : "none";
      $("mapLocalCtl").style.display = on ? "none" : "inline";
      renderMap();
    };
    $("mapSrc").onchange = syncSrc;
    $("mapTk").value = geo.tk;
    $("mapLoad").onclick = () => {
      geo.tk = $("mapTk").value.trim();
      geo.layer = $("mapLayer").value;
      geo.lon = +$("mapLon").value;
      geo.lat = +$("mapLat").value;
      geo.z = Math.round(+$("mapZ").value);
      if (!geo.tk) {
        const err = $("mapErr");
        err.style.display = "block";
        err.textContent = "\u8BF7\u5148\u586B\u5165\u5929\u5730\u56FE tk\uFF08\u5B98\u7F51\u514D\u8D39\u7533\u8BF7\uFF1B\u4EC5\u4FDD\u5B58\u5728\u672C\u673A localStorage\uFF09";
        return;
      }
      localStorage.setItem("hongsuan_tdt_tk", geo.tk);
      geo.loaded = true;
      $("mapErr").style.display = "none";
      renderMap();
    };
    const reZoom = (dz) => {
      geo.z = Math.max(1, Math.min(18, geo.z + dz));
      $("mapZ").value = String(geo.z);
      renderMap();
    };
    $("mapZoomIn").onclick = () => reZoom(1);
    $("mapZoomOut").onclick = () => reZoom(-1);
    syncSrc();
    $("mapFill").onclick = () => {
      const err = $("mapErr");
      if (!mapState.last) {
        err.style.display = "block";
        err.textContent = "\u8BF7\u5148\u5B8C\u6210\u91CF\u7B97\uFF0C\u518D\u628A F \u586B\u5165\u65B9\u6CD5 C";
        return;
      }
      $("rdF").value = String(mapState.last.F);
      calcMethodC();
      err.style.display = "none";
      $("mapOut").innerHTML += `<div style="color:var(--blue)">\u5DF2\u628A F=${mapState.last.F} km\xB2 \u586B\u5165\u65B9\u6CD5 C\uFF08\u5F84\u6D41\u539A\u5EA6\u6CD5\uFF09\u5E76\u91CD\u7B97</div>`;
    };
  }
  var SYS_KEY = "hongsuan_sys_settings";
  function applySysDefaults() {
    try {
      const raw = localStorage.getItem(SYS_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.freq) {
        state.freq = s.freq;
        $("freqSel").value = String(s.freq);
      }
      if (s.reach) $("opReach").value = s.reach;
    } catch {
    }
  }
  if ($("sysCard")) {
    applySysDefaults();
    $("sysSave").onclick = () => {
      const s = {
        freq: Number($("sysFreq").value),
        reach: $("sysReach").value
      };
      localStorage.setItem(SYS_KEY, JSON.stringify(s));
      state.freq = s.freq;
      $("opReach").value = s.reach;
      $("sysOut").textContent = `\u5DF2\u4FDD\u5B58\uFF1A\u9ED8\u8BA4\u9891\u7387 ${(s.freq * 100).toFixed(2)}%\uFF0C\u9ED8\u8BA4\u6CB3\u6BB5 ${s.reach}`;
      render();
    };
    $("sysUsage").onclick = () => {
      let bytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        bytes += (localStorage.getItem(k) ?? "").length + k.length;
      }
      $("sysOut").textContent = `\u672C\u673A\u6570\u636E\u7EA6 ${(bytes / 1024).toFixed(1)} KB\uFF08\u542B\u53C2\u6570\u8BB0\u5FC6\u3001\u5DE5\u7A0B\u4FE1\u606F\u3001\u9ED8\u8BA4\u8BBE\u7F6E\u3001\u5929\u5730\u56FE tk\uFF09\uFF1B\u8BA1\u7B97\u65E5\u5FD7 ${calcLog.size()} \u6761`;
    };
    $("sysExport").onclick = () => {
      const dump = { schema: "hongsuan-local-dump@1", savedAt: (/* @__PURE__ */ new Date()).toISOString() };
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        const raw = localStorage.getItem(k) ?? "";
        try {
          dump[k] = JSON.parse(raw);
        } catch {
          dump[k] = raw;
        }
      }
      downloadText(JSON.stringify(dump, null, 2), "\u6CD3\u7B97\u672C\u673A\u6570\u636E.json", "application/json;charset=utf-8");
      $("sysOut").textContent = "\u5DF2\u5BFC\u51FA\u672C\u673A\u5168\u90E8\u6570\u636E\uFF08JSON\uFF09";
    };
    $("sysReset").onclick = () => {
      if (!confirm("\u5C06\u6E05\u7A7A\u672C\u673A\u4FDD\u5B58\u7684\u53C2\u6570\u8BB0\u5FC6\u3001\u5DE5\u7A0B\u4FE1\u606F\u4E0E\u9ED8\u8BA4\u8BBE\u7F6E\uFF08\u4E0D\u5F71\u54CD\u5DF2\u5BFC\u51FA\u7684\u6587\u4EF6\uFF09\uFF0C\u786E\u5B9A\uFF1F")) return;
      localStorage.clear();
      $("sysOut").textContent = "\u5DF2\u6E05\u7A7A\u672C\u673A\u6570\u636E\uFF0C\u5237\u65B0\u9875\u9762\u540E\u56DE\u5230\u9ED8\u8BA4\u72B6\u6001";
    };
    $("sysKb").onclick = () => {
      downloadText(helpToMarkdown(), "\u6CD3\u7B97\u77E5\u8BC6\u5E93.md", "text/markdown;charset=utf-8");
      $("sysOut").textContent = "\u5DF2\u5BFC\u51FA\u77E5\u8BC6\u5E93 Markdown";
    };
  }
  function helpToMarkdown() {
    const lines = ["# \u6CD3\u7B97\u77E5\u8BC6\u5E93", "", `> \u5BFC\u51FA\u65F6\u95F4\uFF1A${(/* @__PURE__ */ new Date()).toLocaleString("zh-CN")}`, ""];
    for (const sec of HELP_SECTIONS) {
      lines.push(`## ${sec.title}\uFF08${sec.spec}\uFF09`, "");
      for (const it of sec.items) {
        lines.push(`- **${it.no}** ${it.title}${it.page ? `\uFF08${it.page}\uFF09` : ""}`, `  ${it.summary}`);
      }
      lines.push("");
    }
    lines.push("## \u6570\u636E\u6765\u6E90\u4E0E\u51FA\u5904", "");
    for (const s of HELP_SOURCES) lines.push(`- **${s.name}**\uFF1A${s.detail}${s.url ? ` \u2014 ${s.url}` : ""}`);
    lines.push("", "## \u5E38\u89C1\u95EE\u9898", "");
    for (const f of HELP_FAQ) lines.push(`- **\u95EE**\uFF1A${f.q}`, `  **\u7B54**\uFF1A${f.a}`);
    lines.push("", "## \u8BA1\u7B97\u6B63\u786E\u6027\u9A8C\u8BC1", "");
    for (const v of HELP_VALIDATION) lines.push(`- ${v}`);
    return lines.join("\n");
  }
  function kbSearch(q) {
    const kw = q.trim();
    if (!kw) return [];
    const hits = [];
    for (const sec of HELP_SECTIONS) {
      for (const it of sec.items) {
        const hay = `${it.no} ${it.title} ${it.summary} ${sec.title} ${sec.spec}`;
        if (hay.includes(kw)) hits.push(`[${it.no}] ${it.title} \u2014 ${it.summary}`);
      }
    }
    for (const f of HELP_FAQ) {
      if (`${f.q} ${f.a}`.includes(kw)) hits.push(`[FAQ] ${f.q} \u2014 ${f.a}`);
    }
    for (const s of HELP_SOURCES) {
      if (`${s.name} ${s.detail}`.includes(kw)) hits.push(`[\u6765\u6E90] ${s.name} \u2014 ${s.detail}`);
    }
    for (const v of HELP_VALIDATION) {
      if (v.includes(kw)) hits.push(`[\u9A8C\u8BC1] ${v}`);
    }
    return hits;
  }
  if ($("kbSearchGo")) {
    $("kbSearchGo").onclick = () => {
      const q = $("kbSearch").value;
      const hits = kbSearch(q);
      const box = $("kbResult");
      box.innerHTML = "";
      if (!q.trim()) {
        box.textContent = "\u8BF7\u8F93\u5165\u5173\u952E\u8BCD";
        return;
      }
      if (hits.length === 0) {
        box.textContent = `\u672A\u547D\u4E2D\u300C${q}\u300D\uFF1A\u53EF\u6362\u4E2A\u8BF4\u6CD5\uFF08\u5982\u300C\u51B2\u5237\u300D\u300C\u6865\u5B54\u300D\u300CB-9\u300D\u300C\u03C8\u300D\uFF09`;
        return;
      }
      const head = document.createElement("div");
      head.innerHTML = `\u547D\u4E2D <b>${hits.length}</b> \u6761\uFF1A`;
      box.appendChild(head);
      for (const h of hits) {
        const d = document.createElement("div");
        d.style.marginTop = "4px";
        d.textContent = "\xB7 " + h;
        box.appendChild(d);
      }
    };
    $("kbSearchClear").onclick = () => {
      $("kbSearch").value = "";
      $("kbResult").innerHTML = "";
    };
  }
  function clearFieldErrors() {
    for (const el of document.querySelectorAll(".field-error")) el.classList.remove("field-error");
  }
  function elementForField(field) {
    if (!field) return null;
    const id = field.split(".").pop() ?? "";
    const el = document.getElementById(id);
    return el ? el : null;
  }
  function showErr(box, e) {
    clearFieldErrors();
    box.style.display = "block";
    if (e instanceof HsError) {
      const lines = [e.message];
      if (e.suggestion) lines.push("\u5EFA\u8BAE\uFF1A" + e.suggestion);
      if (e.normRef) lines.push("\u4F9D\u636E\uFF1A" + e.normRef);
      box.textContent = lines.join(" \uFF5C ");
      const el = elementForField(e.field);
      if (el) {
        el.classList.add("field-error");
        const scroller = el.closest("details");
        if (scroller instanceof HTMLDetailsElement) scroller.open = true;
        try {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
        } catch {
        }
        el.focus();
      }
      return;
    }
    box.textContent = e instanceof Error ? e.message : String(e);
  }
  function buildCommands() {
    const go = (m) => () => switchMode(m);
    const click = (id) => () => $(id).click();
    return [
      { title: "\u5207\u5230 \xB7 \u6709\u8D44\u6599\u7CFB\u5217\uFF08\u9002\u7EBF\uFF09", hint: "\u6A21\u5F0F", run: go("series") },
      { title: "\u5207\u5230 \xB7 \u76F4\u63A5\u53C2\u6570\u6A21\u5F0F", hint: "\u6A21\u5F0F", run: go("params") },
      { title: "\u5207\u5230 \xB7 \u5386\u53F2\u6D2A\u6C34\u4F4D\u6CD5", hint: "\u6A21\u5F0F", run: go("hist") },
      { title: "\u5207\u5230 \xB7 \u65E0\u8D44\u6599\u5730\u533A", hint: "\u6A21\u5F0F", run: go("noData") },
      { title: "\u5207\u5230 \xB7 \u5730\u56FE\u91CF\u7B97", hint: "\u6A21\u5F0F", run: go("map") },
      { title: "\u5207\u5230 \xB7 \u8BBE\u8BA1\u6D2A\u6C34\u8FC7\u7A0B\u7EBF", hint: "\u6A21\u5F0F", run: go("hydro") },
      { title: "\u5207\u5230 \xB7 \u5E2E\u52A9\u4E0E\u77E5\u8BC6\u5E93", hint: "\u6A21\u5F0F", run: go("help") },
      { title: "\u8BA1\u7B97\u5E76\u9002\u7EBF\uFF08\u65B9\u6CD5 A\uFF09", hint: "\u8BA1\u7B97", run: click("btnCalc") },
      { title: "\u4E09\u70B9\u6CD5\u521D\u4F30\u53C2\u6570", hint: "\u8BA1\u7B97", run: click("btnThreePoint") },
      { title: "\u81EA\u52A8\u4F18\u5316\u9002\u7EBF", hint: "\u8BA1\u7B97", run: click("btnAutoFit") },
      { title: "\u7EBF\u578B\u6BD4\u9009\uFF08\u8D1D\u53F6\u65AF\uFF09", hint: "\u8BA1\u7B97", run: click("btnBayes") },
      { title: "\u8BA1\u7B97\u5386\u53F2\u6D2A\u6C34\u6CD5\u8BBE\u8BA1\u6D41\u91CF", hint: "\u8BA1\u7B97", run: click("btnHist") },
      { title: "\u63A8\u7B97\u6C34\u9762\u7EBF", hint: "\u8BA1\u7B97", run: click("btnWsProfile") },
      { title: "\u4E24\u6D2A\u75D5\u53CD\u89E3 Q", hint: "\u8BA1\u7B97", run: click("btnWsSolve") },
      { title: "\u8BA1\u7B97\u6865\u5B54\u6700\u5C0F\u51C0\u957F\u5EA6", hint: "\u8BA1\u7B97", run: click("opGo") },
      { title: "\u8BA1\u7B97\u4E00\u822C\u51B2\u5237\uFF0864-1\uFF09", hint: "\u8BA1\u7B97", run: click("scGo") },
      { title: "\u8BA1\u7B97\u5C40\u90E8\u51B2\u5237\uFF0865-2\uFF09", hint: "\u8BA1\u7B97", run: click("lsGo") },
      { title: "\u6C47\u603B\u603B\u51B2\u5237\u6DF1\u5EA6", hint: "\u8BA1\u7B97", run: click("tsGo") },
      { title: "\u5730\u56FE\uFF1A\u8BA1\u7B97\u6C47\u6C34\u533A F / L / I", hint: "\u8BA1\u7B97", run: click("mapGo") },
      { title: "\u5730\u56FE\uFF1A\u628A F \u586B\u5165\u65B9\u6CD5 C", hint: "\u8BA1\u7B97", run: click("mapFill") },
      { title: "\u67E5\u5F84\u6D41\u539A\u5EA6 h \u5E76\u586B\u5165", hint: "\u67E5\u8868", run: click("lkGo") },
      { title: "\u67E5 \u03C8 / \u03C4 / z / \u03B2 / \u03B3 / \u03B4", hint: "\u67E5\u8868", run: click("cbPsi") },
      { title: "\u5BFC\u51FA Word \u8BA1\u7B97\u4E66", hint: "\u5BFC\u51FA", run: click("btnReport") },
      { title: "\u5BFC\u51FA\u5DE5\u7A0B\u6587\u4EF6\uFF08JSON\uFF09", hint: "\u5BFC\u51FA", run: click("btnExportProject") },
      { title: "\u5BFC\u51FA\u8BA1\u7B97\u65E5\u5FD7 Markdown", hint: "\u5BFC\u51FA", run: click("logExportMd") },
      { title: "\u5BFC\u51FA\u8BA1\u7B97\u65E5\u5FD7 JSON", hint: "\u5BFC\u51FA", run: click("logExportJson") },
      { title: "\u5BFC\u51FA\u9891\u7387\u66F2\u7EBF SVG / PNG", hint: "\u5BFC\u51FA", run: click("exSvg") },
      { title: "\u5BFC\u51FA\u77E5\u8BC6\u5E93 Markdown", hint: "\u5BFC\u51FA", run: click("sysKb") },
      { title: "\u5DE5\u7A0B\u6587\u4EF6\u7248\u672C\u5BF9\u6BD4", hint: "\u5DE5\u7A0B", run: () => {
        const d = $("projDiffCard");
        if (d) {
          d.open = true;
          d.scrollIntoView({ block: "center" });
        }
      } },
      { title: "\u6E05\u7A7A\u8BA1\u7B97\u65E5\u5FD7", hint: "\u7BA1\u7406", run: click("logClear") },
      { title: "\u67E5\u770B\u672C\u673A\u6570\u636E\u5360\u7528", hint: "\u7BA1\u7406", run: click("sysUsage") },
      { title: "\u6E05\u7A7A\u672C\u673A\u8BB0\u5FC6\uFF0C\u6062\u590D\u9ED8\u8BA4", hint: "\u7BA1\u7406", run: click("btnReset") }
    ];
  }
  var CMDS = buildCommands();
  var cmdIndex = 0;
  var cmdHits = [];
  function renderCmd(q) {
    const kw = q.trim();
    cmdHits = kw ? CMDS.filter((c) => `${c.title} ${c.hint}`.includes(kw)) : CMDS.slice(0, 12);
    if (cmdIndex >= cmdHits.length) cmdIndex = 0;
    const list = $("cmdList");
    list.innerHTML = "";
    if (cmdHits.length === 0) {
      const d = document.createElement("div");
      d.style.cssText = "padding:14px;font-size:13px;color:var(--text3)";
      d.textContent = "\u6CA1\u6709\u5339\u914D\u7684\u547D\u4EE4";
      list.appendChild(d);
    }
    cmdHits.forEach((c, i) => {
      const row = document.createElement("div");
      row.style.cssText = `padding:9px 15px;cursor:pointer;font-size:13px;display:flex;gap:10px;align-items:center;${i === cmdIndex ? "background:#eef4ff" : ""}`;
      const ttl = document.createElement("span");
      ttl.textContent = c.title;
      ttl.style.flex = "1";
      const tag = document.createElement("span");
      tag.textContent = c.hint;
      tag.style.cssText = "font-size:11px;color:var(--text3);flex:none";
      row.append(ttl, tag);
      row.onmouseenter = () => {
        cmdIndex = i;
        renderCmd($("cmdInput").value);
      };
      row.onclick = () => {
        execCmd(i);
      };
      list.appendChild(row);
    });
    $("cmdCount").textContent = `${cmdHits.length} \u4E2A\u547D\u4EE4`;
  }
  function execCmd(i) {
    const c = cmdHits[i];
    closeCmd();
    if (c) {
      try {
        c.run();
      } catch (e) {
        console.warn("\u547D\u4EE4\u6267\u884C\u5931\u8D25", c.title, e);
      }
    }
  }
  function openCmd() {
    $("cmdPanel").style.display = "flex";
    $("cmdInput").value = "";
    cmdIndex = 0;
    renderCmd("");
    $("cmdInput").focus();
  }
  function closeCmd() {
    $("cmdPanel").style.display = "none";
  }
  if ($("cmdPanel")) {
    $("cmdInput").oninput = (e) => {
      cmdIndex = 0;
      renderCmd(e.target.value);
    };
    $("cmdInput").onkeydown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        cmdIndex = (cmdIndex + 1) % Math.max(1, cmdHits.length);
        renderCmd($("cmdInput").value);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        cmdIndex = (cmdIndex - 1 + cmdHits.length) % Math.max(1, cmdHits.length);
        renderCmd($("cmdInput").value);
      } else if (e.key === "Enter") {
        e.preventDefault();
        execCmd(cmdIndex);
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeCmd();
      }
    };
    $("cmdPanel").onclick = (e) => {
      if (e.target === $("cmdPanel")) closeCmd();
    };
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if ($("cmdPanel").style.display === "flex") closeCmd();
        else openCmd();
      }
      if (e.key === "Escape" && $("cmdPanel").style.display === "flex") closeCmd();
    });
  }
  var multi = { data: null, plans: [], pick: null };
  function planMsg(text, isErr = false) {
    const el = $("planMsg");
    el.textContent = text;
    el.style.display = text ? "block" : "none";
    el.style.color = isErr ? "var(--red)" : "";
  }
  function renderPlans() {
    const box = $("planList");
    box.innerHTML = "";
    if (multi.plans.length === 0) {
      const d = document.createElement("div");
      d.style.cssText = "font-size:12px;color:var(--text3)";
      d.textContent = "\u8FD8\u6CA1\u6709\u65B9\u6848\u3002\u8C03\u597D\u4E00\u7EC4\u53C2\u6570\u540E\u70B9\u300C\u4FDD\u5B58\u5F53\u524D\u4E3A\u65B0\u65B9\u6848\u300D\uFF0C\u4E4B\u540E\u6BCF\u6B21\u6539\u52A8\u518D\u5B58\u4E00\u4E2A\uFF0C\u5C31\u80FD\u76F4\u63A5\u5BF9\u6BD4\u5DEE\u5F02\u3002";
      box.appendChild(d);
      return;
    }
    const table = document.createElement("table");
    table.className = "ltab";
    table.style.fontSize = "12px";
    const trh = document.createElement("tr");
    for (const x of ["\u65B9\u6848", "\u5DEE\u5F02\u9879", "\u4FDD\u5B58\u65F6\u95F4", "\u64CD\u4F5C"]) {
      const th = document.createElement("th");
      th.textContent = x;
      trh.appendChild(th);
    }
    table.appendChild(trh);
    multi.plans.forEach((pl, i) => {
      const tr = document.createElement("tr");
      const td1 = document.createElement("td");
      td1.innerHTML = `<b>${pl.name}</b>${pl.note ? `<br><span style="color:var(--text3)">${pl.note}</span>` : ""}`;
      const td2 = document.createElement("td");
      td2.textContent = String(Object.keys(pl.deltas).length);
      const td3 = document.createElement("td");
      td3.style.whiteSpace = "nowrap";
      td3.textContent = new Date(pl.createdAt).toLocaleString("zh-CN", { hour12: false }).slice(5);
      const td4 = document.createElement("td");
      td4.style.whiteSpace = "nowrap";
      for (const [label, fn] of [
        ["\u5207\u6362", () => {
          if (!multi.data) return;
          applySaved(applyPlan(multi.data, pl));
          planMsg(`\u5DF2\u5207\u6362\u5230\u65B9\u6848\u300C${pl.name}\u300D`);
        }],
        [multi.pick && multi.pick.includes(i) ? "\u53D6\u6D88\u5BF9\u6BD4" : "\u5BF9\u6BD4", () => {
          if (!multi.pick) {
            multi.pick = [i, -1];
          } else if (multi.pick[1] === -1 && multi.pick[0] !== i) {
            multi.pick[1] = i;
          } else if (multi.pick[0] === i || multi.pick[1] === i) {
            multi.pick = null;
          } else {
            multi.pick = [i, -1];
          }
          renderPlans();
          renderPlanDiff();
        }],
        ["\u5220\u9664", () => {
          multi.plans.splice(i, 1);
          multi.pick = null;
          renderPlans();
          renderPlanDiff();
        }]
      ]) {
        const b = document.createElement("button");
        b.className = "btn ghost";
        b.style.cssText = "padding:2px 8px;font-size:11.5px;margin-right:4px";
        b.textContent = label;
        b.onclick = fn;
        td4.appendChild(b);
      }
      tr.append(td1, td2, td3, td4);
      table.appendChild(tr);
    });
    box.appendChild(table);
  }
  function renderPlanDiff() {
    const box = $("planDiff");
    box.innerHTML = "";
    if (!multi.data || !multi.pick || multi.pick[1] < 0) return;
    const [i, j] = multi.pick;
    const a = multi.plans[i], b = multi.plans[j];
    if (!a || !b) return;
    const rows = diffPlans(multi.data, a, b);
    const head = document.createElement("div");
    head.style.cssText = "font-size:12px;margin-bottom:4px";
    head.innerHTML = `\u300C<b>${a.name}</b>\u300D\u4E0E\u300C<b>${b.name}</b>\u300D\u5171 <b>${rows.length}</b> \u5904\u4E0D\u540C`;
    box.appendChild(head);
    if (rows.length === 0) return;
    const table = document.createElement("table");
    table.className = "ltab";
    table.style.fontSize = "12px";
    const trh = document.createElement("tr");
    for (const x of ["\u5B57\u6BB5", a.name, b.name]) {
      const th = document.createElement("th");
      th.textContent = x;
      trh.appendChild(th);
    }
    table.appendChild(trh);
    for (const r of rows) {
      const tr = document.createElement("tr");
      for (const v of [r.path, String(r.a ?? "\u2014"), String(r.b ?? "\u2014")]) {
        const td = document.createElement("td");
        td.textContent = v;
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    box.appendChild(table);
  }
  if ($("planCard")) {
    renderPlans();
    $("planAdd").onclick = () => {
      try {
        const name = $("planName").value.trim();
        if (!name) throw new Error("\u8BF7\u5148\u586B\u5199\u65B9\u6848\u540D");
        const cur = collectInputs();
        if (!multi.data) {
          multi.data = cur;
          multi.plans.push(createPlan(name, cur, cur, "\u57FA\u51C6\u65B9\u6848\uFF08\u5171\u4EAB\u6570\u636E\uFF09"));
          planMsg(`\u5DF2\u5EFA\u7ACB\u57FA\u51C6\u6570\u636E\uFF0C\u5E76\u4FDD\u5B58\u65B9\u6848\u300C${name}\u300D`);
        } else {
          multi.plans.push(createPlan(name, multi.data, cur));
          planMsg(`\u5DF2\u4FDD\u5B58\u65B9\u6848\u300C${name}\u300D\uFF08\u4EC5\u5B58\u5DEE\u5F02\uFF09`);
        }
        $("planName").value = "";
        renderPlans();
      } catch (e) {
        planMsg(e instanceof Error ? e.message : String(e), true);
      }
    };
    $("planClear").onclick = () => {
      multi.data = null;
      multi.plans = [];
      multi.pick = null;
      renderPlans();
      renderPlanDiff();
      planMsg("\u5DF2\u6E05\u7A7A\u5168\u90E8\u65B9\u6848");
    };
    $("planExport").onclick = () => {
      if (multi.plans.length === 0) {
        planMsg("\u8FD8\u6CA1\u6709\u65B9\u6848\u53EF\u5BFC\u51FA", true);
        return;
      }
      const payload = {
        schema: "hongsuan-multiproject@1",
        appVersion: "0.11.1",
        data: multi.data,
        plans: multi.plans
      };
      downloadText(JSON.stringify(payload, null, 2), "\u6CD3\u7B97\u591A\u65B9\u6848\u5DE5\u7A0B.json", "application/json;charset=utf-8");
      planMsg("\u5DF2\u5BFC\u51FA\u591A\u65B9\u6848\u5DE5\u7A0B\uFF08\u542B\u5171\u4EAB\u6570\u636E + \u5404\u65B9\u6848\u5DEE\u5F02\uFF09");
    };
    $("planImport").onclick = () => {
      $("planFile").click();
    };
    $("planFile").onchange = () => {
      const inp = $("planFile");
      const f = inp.files && inp.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const mp = parseMultiProject(JSON.parse(String(r.result)));
          multi.data = mp.data;
          multi.plans = mp.plans;
          multi.pick = null;
          renderPlans();
          renderPlanDiff();
          planMsg(`\u5DF2\u5BFC\u5165 ${mp.plans.length} \u4E2A\u65B9\u6848`);
        } catch (e) {
          planMsg(e instanceof Error ? e.message : String(e), true);
        }
      };
      r.readAsText(f, "utf-8");
    };
  }
  function logCalc(module, inputs, results, basis, params) {
    try {
      calcLog.add({ module, inputs, results, basis, params });
      renderCalcLog();
    } catch {
    }
  }
  function kvText(o) {
    return !o ? "\u2014" : Object.entries(o).map(([k, v]) => `${k}=${v}`).join("\uFF1B");
  }
  var logExpandedAll = false;
  function logSummary(e) {
    const r = e.results ?? {};
    const keys = Object.keys(r).slice(0, 3);
    return keys.length ? keys.map((k) => `${k}=${r[k]}`).join("\uFF1B") : "\u2014";
  }
  function refreshModuleFilter() {
    const sel = $("logModule");
    if (!sel) return;
    const cur = sel.value;
    const mods = [...new Set(calcLog.recent(0).map((e) => e.module))].sort();
    sel.innerHTML = '<option value="">\u5168\u90E8\u6A21\u5757</option>' + mods.map((m) => `<option value="${m}">${m}</option>`).join("");
    sel.value = cur;
  }
  function renderCalcLog() {
    const list = $("logList");
    const body = $("logBody");
    if (!list || !body) return;
    const kw = ($("logSearch").value || "").trim();
    const mod = $("logModule").value;
    const limit = Number($("logLimit").value || 10);
    refreshModuleFilter();
    let rows = calcLog.recent(0).slice().reverse();
    if (mod) rows = rows.filter((e) => e.module === mod);
    if (kw) {
      const hay = (e) => `${e.module} ${kvText(e.inputs)} ${kvText(e.params)} ${kvText(e.results)} ${e.basis}`;
      rows = rows.filter((e) => hay(e).includes(kw));
    }
    const shown = limit > 0 ? rows.slice(0, limit) : rows;
    list.innerHTML = "";
    if (shown.length === 0) {
      const empty = document.createElement("div");
      empty.style.fontSize = "12px";
      empty.style.color = "var(--text3)";
      empty.textContent = kw || mod ? "\u6CA1\u6709\u5339\u914D\u7684\u65E5\u5FD7\u6761\u76EE" : "\u8FD8\u6CA1\u6709\u8BA1\u7B97\u8BB0\u5F55\uFF0C\u505A\u4EFB\u4F55\u4E00\u6B21\u8BA1\u7B97\u540E\u8FD9\u91CC\u4F1A\u81EA\u52A8\u7559\u75D5";
      list.appendChild(empty);
    }
    for (const e of shown) {
      const wrap = document.createElement("div");
      wrap.style.cssText = "border:1px solid var(--border);border-radius:8px;margin-bottom:6px;overflow:hidden";
      const head = document.createElement("div");
      head.style.cssText = "display:flex;gap:10px;align-items:center;padding:7px 10px;cursor:pointer;background:#fafafa;font-size:12.5px";
      const tm = document.createElement("span");
      tm.style.cssText = "color:var(--text3);font-variant-numeric:tabular-nums;flex:none";
      tm.textContent = new Date(e.t).toLocaleTimeString("zh-CN", { hour12: false });
      const md = document.createElement("span");
      md.style.cssText = "font-weight:600;flex:none;min-width:120px";
      md.textContent = e.module;
      const sm = document.createElement("span");
      sm.style.cssText = "color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
      sm.textContent = logSummary(e);
      const caret = document.createElement("span");
      caret.style.cssText = "margin-left:auto;color:var(--text3);flex:none";
      caret.textContent = "\u25B8";
      head.append(tm, md, sm, caret);
      wrap.appendChild(head);
      const detail = document.createElement("div");
      detail.style.cssText = "padding:8px 10px;font-size:12px;color:var(--text2);border-top:1px solid var(--border);display:none";
      for (const [label, obj] of [
        ["\u4E3B\u8981\u8F93\u5165", e.inputs],
        ["\u91C7\u7528/\u4E2D\u95F4\u503C", e.params],
        ["\u7ED3\u679C", e.results]
      ]) {
        if (!obj || Object.keys(obj).length === 0) continue;
        const d = document.createElement("div");
        d.style.marginBottom = "4px";
        d.textContent = `${label}\uFF1A${kvText(obj)}`;
        detail.appendChild(d);
      }
      const b = document.createElement("div");
      b.style.color = "var(--text3)";
      b.textContent = `\u4F9D\u636E\uFF1A${e.basis}`;
      detail.appendChild(b);
      wrap.appendChild(detail);
      let open = logExpandedAll;
      const apply = () => {
        detail.style.display = open ? "" : "none";
        caret.textContent = open ? "\u25BE" : "\u25B8";
      };
      head.onclick = () => {
        open = !open;
        apply();
      };
      apply();
      list.appendChild(wrap);
    }
    body.innerHTML = "";
    for (const e of shown) {
      const tr = document.createElement("tr");
      for (const text of [
        new Date(e.t).toLocaleTimeString("zh-CN", { hour12: false }),
        e.module,
        kvText(e.inputs),
        kvText(e.params),
        kvText(e.results),
        e.basis
      ]) {
        const td = document.createElement("td");
        td.textContent = text;
        tr.appendChild(td);
      }
      body.appendChild(tr);
    }
    const cnt = $("logCount");
    if (cnt) {
      cnt.textContent = `\u5171 ${calcLog.size()} \u6761\uFF0C\u5F53\u524D\u663E\u793A ${shown.length} \u6761` + (kw || mod ? "\uFF08\u5DF2\u8FC7\u6EE4\uFF09" : "");
    }
  }
  if ($("logSearch")) {
    $("logSearch").oninput = renderCalcLog;
    $("logModule").onchange = renderCalcLog;
    $("logLimit").onchange = renderCalcLog;
    $("logExpandAll").onclick = () => {
      logExpandedAll = true;
      renderCalcLog();
    };
    $("logCollapseAll").onclick = () => {
      logExpandedAll = false;
      renderCalcLog();
    };
  }
  var logTimer;
  var lastSig = "";
  function logRenderOnce() {
    const sig = `${state.params.mean}|${state.params.cv}|${state.params.cs}|${state.freq}|${state.series.length}`;
    if (logTimer) clearTimeout(logTimer);
    logTimer = setTimeout(() => {
      if (sig === lastSig) return;
      lastSig = sig;
      const phi = phiPIII(state.freq, state.params.cs);
      const kp = 1 + phi * state.params.cv;
      const q = state.params.mean * kp;
      logCalc(
        "\u65B9\u6CD5A \xB7 P-\u2162\u9002\u7EBF",
        { \u7CFB\u5217\u957F\u5EA6: state.series.length, \u8BBE\u8BA1\u9891\u7387: (state.freq * 100).toFixed(2) + "%", \u4E0D\u8FDE\u5E8F: $("hasExtra").checked ? "\u662F" : "\u5426" },
        { \u03A6: phi.toFixed(3), Kp: kp.toFixed(3), Qp: fmt(q, 0) + " m\xB3/s" },
        "JTG C30-2015 \u7B2C6.2\u6761\uFF08\u76AE\u5C14\u900A\u2162\u578B\uFF09",
        {
          Q\u0304: fmt(state.params.mean, 1),
          Cv: state.params.cv.toFixed(3),
          Cs: state.params.cs.toFixed(3),
          CsCv: (state.params.cs / state.params.cv).toFixed(2)
        }
      );
    }, 800);
  }
  function downloadText(text, fileName, mime) {
    downloadBlob(new Blob([text], { type: mime }), fileName);
  }
  if ($("logExportMd")) {
    $("logExportMd").onclick = () => {
      downloadText(calcLog.toMarkdown("\u6CD3\u7B97\u8BA1\u7B97\u65E5\u5FD7"), "\u6CD3\u7B97\u8BA1\u7B97\u65E5\u5FD7.md", "text/markdown;charset=utf-8");
    };
    $("logExportJson").onclick = () => {
      downloadText(calcLog.toJSON(), "\u6CD3\u7B97\u8BA1\u7B97\u65E5\u5FD7.json", "application/json;charset=utf-8");
    };
    $("logClear").onclick = () => {
      calcLog.clear();
      renderCalcLog();
    };
  }
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
    const pj = currentProject();
    const pjAny = pj.name || pj.bridgeSite || pj.engineer || pj.reviewer;
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
            ...pjAny ? [
              H1("\u3007\u3001\u5DE5\u7A0B\u4FE1\u606F"),
              PB2("\u9879\u76EE\u540D", pj.name || "\u2014"),
              PB2("\u6865\u4F4D / \u65AD\u9762", pj.bridgeSite || "\u2014"),
              PB2("\u8BA1\u7B97\u4EBA / \u590D\u6838\u4EBA", `${pj.engineer || "\u2014"} / ${pj.reviewer || "\u2014"}`)
            ] : [],
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
            ...state.hydro ? [
              H1("\u4E03\u3001\u8BBE\u8BA1\u6D2A\u6C34\u8FC7\u7A0B\u7EBF"),
              P(`\u6309\u89C4\u8303 6.6 \u540C\u500D\u6BD4\u653E\u5927\u6CD5\uFF1Akg = Qp / Q\u5178\u5CF0 = ${state.hydro.designPeak.toFixed(0)} / ${state.hydro.typicalPeak.toFixed(0)} = ${state.hydro.kg.toFixed(4)}\u3002`),
              mkTable(["\u65F6\u95F4 t\uFF08h\uFF09", "\u8BBE\u8BA1\u6D41\u91CF Q\uFF08m\xB3/s\uFF09"], state.hydro.points.map((p2) => [p2.t, p2.q.toFixed(1)]))
            ] : [],
            new D.Paragraph({
              border: { top: { style: D.BorderStyle.SINGLE, size: 1, color: "d9d9d9" } },
              children: [new D.TextRun({ text: "\u672C\u8BA1\u7B97\u4E66\u7531\u6CD3\u7B97 v0.11.1 \u751F\u6210\uFF0C\u03A6 \u503C\u7B97\u6CD5\u7ECF\u591A\u6E90\u4EA4\u53C9\u9A8C\u8BC1\uFF08scipy \u72EC\u7ACB\u5B9E\u73B0\u4E00\u81F4\u5230 1e-6\uFF09\u3002\u8BA1\u7B97\u7ED3\u679C\u4F9B\u5B66\u4E60\u4E0E\u8BFE\u7A0B\u8BBE\u8BA1\u53C2\u8003\uFF0C\u5DE5\u7A0B\u5E94\u7528\u987B\u7ECF\u6CE8\u518C\u5DE5\u7A0B\u5E08\u590D\u6838\u3002\u751F\u6210\u65F6\u95F4\uFF1A" + now.toLocaleString("zh-CN"), size: 18, color: "6e6e73" })]
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
  var LS_KEY = "hongsuan_v09";
  var LEGACY_KEYS = ["hongsuan_v08", "hongsuan_v07"];
  var HIST_IDS = ["hf0Ac", "hf0Bc", "hf0nc", "hf0At", "hf0Bt", "hf0nt", "hf0Ipermil", "hf0T", "hf1Ac", "hf1Bc", "hf1nc", "hf1At", "hf1Bt", "hf1nt", "hf1Ipermil", "hf1T", "hbCv", "hbCs"];
  var NODATA_IDS = ["rcSp", "rcN", "rcPsi", "rcTau", "rcF", "rdPhi", "rdH", "rdZ", "rdF", "rdBeta", "rdGamma", "rdDelta"];
  var WS_IDS = ["wsB", "wsM", "wsN", "wsS0", "wsL", "wsYc", "wsQ", "wsYup"];
  var OPEN_IDS = ["opQp", "opQc", "opBc", "opReach"];
  var SCOUR_IDS = ["scQ2", "scMu", "scBcj", "scHmc", "scHcq", "scD50", "scRho", "scA", "scBd", "scHz"];
  var LOCAL_IDS = ["lsV", "lsB1", "lsKxi"];
  var TOTAL_IDS = ["tsNat"];
  function migrateState(parsed) {
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.schemaVersion === 9) return parsed;
    if (parsed.schemaVersion == null) return { ...parsed, schemaVersion: 9 };
    console.warn("\u672A\u77E5\u6301\u4E45\u5316\u7248\u672C\uFF0C\u6309\u5F53\u524D\u7248\u672C\u5C3D\u529B\u8BFB\u53D6", parsed.schemaVersion);
    return { ...parsed, schemaVersion: 9 };
  }
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
      schemaVersion: 9,
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
      nodata: pick(NODATA_IDS),
      wsurf: pick(WS_IDS),
      open: pick(OPEN_IDS),
      scour: pick(SCOUR_IDS),
      local: pick(LOCAL_IDS),
      total: pick(TOTAL_IDS),
      project: currentProject(),
      conv: {
        enable: $("convEnable").checked,
        fRef: $("convFRef").value,
        fSite: $("convFSite").value,
        n: $("convN").value
      },
      hydro: { typical: $("hydroTypical").value, qp: $("hydroQp").value }
    };
  }
  function currentProject() {
    const v = (id) => $(id).value;
    return {
      name: v("pjName"),
      bridgeSite: v("pjSite"),
      engineer: v("pjEng"),
      reviewer: v("pjRev"),
      note: "",
      river: v("pjRiver"),
      reach: v("pjReach"),
      station: v("pjStation"),
      stationArea: v("pjStationArea"),
      siteArea: v("pjSiteArea"),
      designFreq: v("pjDesignFreq"),
      spec: v("pjSpec"),
      zone: v("pjZone")
    };
  }
  function fillProjectForm(p) {
    const set2 = (id, val) => {
      $(id).value = val ?? "";
    };
    set2("pjName", p.name ?? "");
    set2("pjSite", p.bridgeSite ?? "");
    set2("pjEng", p.engineer ?? "");
    set2("pjRev", p.reviewer ?? "");
    set2("pjRiver", p.river ?? "");
    set2("pjReach", p.reach ?? "");
    set2("pjStation", p.station ?? "");
    set2("pjStationArea", p.stationArea ?? "");
    set2("pjSiteArea", p.siteArea ?? "");
    set2("pjDesignFreq", p.designFreq ?? "");
    set2("pjSpec", p.spec ?? "JTG C30\u20142015");
    set2("pjZone", p.zone ?? "");
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
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        d = migrateState(parsed);
      } else {
        for (const k of LEGACY_KEYS) {
          const legacy = localStorage.getItem(k);
          if (legacy) {
            d = migrateState(JSON.parse(legacy));
            break;
          }
        }
      }
    } catch (e) {
      d = null;
    }
    if (!d || typeof d !== "object") return null;
    return applySaved(d);
  }
  function applySaved(d) {
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
    if (d.wsurf) for (const k in d.wsurf) {
      const el = $(k);
      if (el && d.wsurf[k] != null) el.value = d.wsurf[k];
    }
    if (d.open) for (const k in d.open) {
      const el = $(k);
      if (el && d.open[k] != null) el.value = d.open[k];
    }
    if (d.scour) for (const k in d.scour) {
      const el = $(k);
      if (el && d.scour[k] != null) el.value = d.scour[k];
    }
    if (d.local) for (const k in d.local) {
      const el = $(k);
      if (el && d.local[k] != null) el.value = d.local[k];
    }
    if (d.total) for (const k in d.total) {
      const el = $(k);
      if (el && d.total[k] != null) el.value = d.total[k];
    }
    if (d.conv) {
      $("convEnable").checked = Boolean(d.conv.enable);
      if (d.conv.fRef != null) $("convFRef").value = d.conv.fRef;
      if (d.conv.fSite != null) $("convFSite").value = d.conv.fSite;
      if (d.conv.n != null) $("convN").value = d.conv.n;
    }
    if (d.hydro) {
      if (typeof d.hydro.typical === "string") $("hydroTypical").value = d.hydro.typical;
      if (d.hydro.qp != null) $("hydroQp").value = d.hydro.qp;
    }
    if (d.project) {
      $("pjName").value = d.project.name ?? "";
      $("pjSite").value = d.project.bridgeSite ?? "";
      $("pjEng").value = d.project.engineer ?? "";
      $("pjRev").value = d.project.reviewer ?? "";
    }
    console.log("RESTORE_MODE", d.mode || "series", "ADOPTED", state.adoptedOverride ? "yes" : "no", "FREQ", state.freq);
    return d.mode || null;
  }
  $("btnExportProject").onclick = () => {
    try {
      const file = buildProjectFile(currentProject(), collectInputs(), "0.11.1");
      const blob = new Blob([serializeProject(file)], { type: "application/json" });
      downloadBlob(blob, `\u6CD3\u7B97\u5DE5\u7A0B-${file.project.name || "\u672A\u547D\u540D"}.json`);
      $("pjMsg").textContent = "\u5DF2\u5BFC\u51FA\u5DE5\u7A0B\u6587\u4EF6";
    } catch (e) {
      alert("\u5BFC\u51FA\u5931\u8D25\uFF1A" + (e instanceof Error ? e.message : String(e)));
    }
  };
  $("btnImportProject").onclick = () => {
    $("pjFile").click();
  };
  $("pjFile").onchange = () => {
    const inp = $("pjFile");
    const f = inp.files && inp.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseProjectFile(JSON.parse(String(reader.result)));
        fillProjectForm(parsed.project);
        applySaved({ ...parsed.state, project: parsed.project });
        saveAll();
        const dt = parsed.savedAt.slice(0, 10);
        $("pjMsg").textContent = `\u5DF2\u5BFC\u5165\uFF1A${parsed.project.name || "\u672A\u547D\u540D"}\uFF08${dt}\uFF0C\u6CD3\u7B97 v${parsed.appVersion}\uFF09`;
        location.reload();
      } catch (e) {
        alert("\u5BFC\u5165\u5931\u8D25\uFF1A" + (e instanceof Error ? e.message : String(e)));
      }
    };
    reader.readAsText(f);
    inp.value = "";
  };
  $("btnReset").onclick = () => {
    if (confirm("\u786E\u5B9A\u6E05\u9664\u672C\u673A\u8BB0\u5FC6\u7684\u5168\u90E8\u53C2\u6570\u5E76\u6062\u590D\u9ED8\u8BA4\u793A\u4F8B\uFF1F")) {
      localStorage.removeItem(LS_KEY);
      for (const k of LEGACY_KEYS) localStorage.removeItem(k);
      location.reload();
    }
  };
  var urlQ = new URLSearchParams(location.search);
  var restoredMode = restoreAll();
  var urlMethod = urlQ.get("method");
  var startMode = urlMethod === "hist" ? "histB" : urlMethod === "nodata" ? "noData" : urlMethod === "hydro" ? "hydro" : restoredMode || "series";
  if (startMode === "params") {
    $("mParams").click();
  } else if (startMode === "histB") {
    $("mHist").click();
  } else if (startMode === "noData") {
    $("mNoData").click();
  } else if (startMode === "hydro") {
    $("mHydro").click();
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
