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

  // src/core/projectFile.ts
  var PROJECT_SCHEMA = "hongsuan-project@1";
  function emptyProject() {
    return { name: "", bridgeSite: "", engineer: "", reviewer: "", note: "" };
  }
  function buildProjectFile(project, state2, appVersion) {
    const p = { ...emptyProject(), ...project };
    for (const k of Object.keys(p)) {
      if (typeof p[k] !== "string") throw new Error(`\u9879\u76EE\u4FE1\u606F\u5B57\u6BB5 ${k} \u5FC5\u987B\u4E3A\u5B57\u7B26\u4E32`);
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
    const f = json;
    if (f.schema !== PROJECT_SCHEMA) throw new Error(`\u5DE5\u7A0B\u6587\u4EF6 schema \u4E0D\u5339\u914D\uFF1A\u671F\u671B ${PROJECT_SCHEMA}\uFF0C\u6536\u5230 ${String(f.schema)}`);
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
  $("mSeries").onclick = () => {
    state.mode = "series";
    $("mSeries").classList.add("on");
    $("mParams").classList.remove("on");
    $("mHist").classList.remove("on");
    $("mNoData").classList.remove("on");
    $("mHydro").classList.remove("on");
    $("seriesBox").style.display = "";
    $("paramsBox").style.display = "none";
    $("histBox").style.display = "none";
    $("noDataBox").style.display = "none";
    $("hydroBox").style.display = "none";
    setFitCardsVisible(true);
  };
  $("mParams").onclick = () => {
    state.mode = "params";
    $("mParams").classList.add("on");
    $("mSeries").classList.remove("on");
    $("mHist").classList.remove("on");
    $("mNoData").classList.remove("on");
    $("mHydro").classList.remove("on");
    $("seriesBox").style.display = "none";
    $("paramsBox").style.display = "";
    $("histBox").style.display = "none";
    $("noDataBox").style.display = "none";
    $("hydroBox").style.display = "none";
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
    $("mHydro").classList.remove("on");
    $("seriesBox").style.display = "none";
    $("paramsBox").style.display = "none";
    $("histBox").style.display = "";
    $("noDataBox").style.display = "none";
    $("hydroBox").style.display = "none";
    setFitCardsVisible(false);
  };
  $("mNoData").onclick = () => {
    state.mode = "noData";
    $("mNoData").classList.add("on");
    $("mSeries").classList.remove("on");
    $("mParams").classList.remove("on");
    $("mHist").classList.remove("on");
    $("mHydro").classList.remove("on");
    $("seriesBox").style.display = "none";
    $("paramsBox").style.display = "none";
    $("histBox").style.display = "none";
    $("noDataBox").style.display = "";
    $("hydroBox").style.display = "none";
    setFitCardsVisible(false);
    calcMethodC();
  };
  $("mHydro").onclick = () => {
    state.mode = "hydro";
    $("mHydro").classList.add("on");
    $("mSeries").classList.remove("on");
    $("mParams").classList.remove("on");
    $("mHist").classList.remove("on");
    $("mNoData").classList.remove("on");
    $("seriesBox").style.display = "none";
    $("paramsBox").style.display = "none";
    $("histBox").style.display = "none";
    $("noDataBox").style.display = "none";
    $("hydroBox").style.display = "";
    setFitCardsVisible(false);
  };
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
  function showMethodCError(which, msg) {
    const out = $(which === "rc" ? "rcOut" : "rdOut");
    const err = $(which === "rc" ? "rcErr" : "rdErr");
    if (msg === null) {
      err.style.display = "none";
      err.textContent = "";
    } else {
      err.style.display = "block";
      err.textContent = msg;
    }
    return out;
  }
  function calcMethodC() {
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
      showMethodCError("rc", e instanceof Error ? e.message : String(e)).textContent = "\u2014";
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
      showMethodCError("rd", e instanceof Error ? e.message : String(e)).textContent = "\u2014";
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
  function renderCalcLog() {
    const body = $("logBody");
    if (!body) return;
    const rows = calcLog.recent(30);
    body.innerHTML = "";
    for (const e of rows) {
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
    if (cnt) cnt.textContent = `\u5171 ${calcLog.size()} \u6761\uFF08\u663E\u793A\u6700\u8FD1 ${rows.length} \u6761\uFF09`;
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
              children: [new D.TextRun({ text: "\u672C\u8BA1\u7B97\u4E66\u7531\u6CD3\u7B97 v0.10.2 \u751F\u6210\uFF0C\u03A6 \u503C\u7B97\u6CD5\u7ECF\u591A\u6E90\u4EA4\u53C9\u9A8C\u8BC1\uFF08scipy \u72EC\u7ACB\u5B9E\u73B0\u4E00\u81F4\u5230 1e-6\uFF09\u3002\u8BA1\u7B97\u7ED3\u679C\u4F9B\u5B66\u4E60\u4E0E\u8BFE\u7A0B\u8BBE\u8BA1\u53C2\u8003\uFF0C\u5DE5\u7A0B\u5E94\u7528\u987B\u7ECF\u6CE8\u518C\u5DE5\u7A0B\u5E08\u590D\u6838\u3002\u751F\u6210\u65F6\u95F4\uFF1A" + now.toLocaleString("zh-CN"), size: 18, color: "6e6e73" })]
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
    return {
      name: $("pjName").value,
      bridgeSite: $("pjSite").value,
      engineer: $("pjEng").value,
      reviewer: $("pjRev").value,
      note: ""
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
      const file = buildProjectFile(currentProject(), collectInputs(), "0.10.0");
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
