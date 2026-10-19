/* 泓算 · 智能帮助：符号点选词典 + 计算路线图 + 用你的数算给你看 */
(function () {
  'use strict';

  /* ============ ① 符号词典（全部点选，无需输入） ============ */
  var SYM = [
    { g: "公式与条号", items: [
      { s: "推理公式", n: "推理公式（公路科研所 1980 版）", u: "m³/s", d: "Qp = 0.278·(Sp−μ)/τ^n·F，小流域暴雨洪峰流量。配套损失参数分区系数表、汇流时间分区和系数指数表、暴雨递减指数 n 值分区。", w: "「暴雨资料推算」标签 · 推理公式" },
      { s: "经验公式一", n: "经验公式一", u: "m³/s", d: "Qp = γ·(Sp−μ)^m·F^λ1，系数按大区分组内置（经验公式一系数表部分行）。", w: "「暴雨资料推算」标签 · 经验公式" },
      { s: "经验公式二", n: "经验公式二", u: "m³/s", d: "Qp = C·Sp^β·F^λ2，系数按大区分组内置（经验公式二系数表部分行）。", w: "「暴雨资料推算」标签 · 经验公式" },
      { s: "式 7.2.1-1", n: "河槽宽度公式（桥孔最小净长度）", u: "m", d: "Lj = Kq·(Qp/Qc)^n3·Bc，Kq、n3 按表 7.2.1 河段类型取。", w: "「大、中桥孔径计算」· 桥孔最小净长度" },
      { s: "式 8.3.1-4", n: "一般冲刷（64-1 修正式，非黏性土河槽）", u: "m", d: "hp = [ A·(Q2/(μ·Bcj))·(hmc/hcq)^(5/3) ÷ (E·d̄^(1/6)) ]^(3/5)。", w: "「大、中桥孔径计算」· 桥下一般冲刷" },
      { s: "式 8.4.1", n: "局部冲刷（65-2 式）", u: "m", d: "hb = Kξ·Kη2·B1^0.6·hp^0.15·((v−v0′)/v0)^n2（v>v0 二式；v≤v0 一式；v≤v0′ 不冲刷）。", w: "「大、中桥孔径计算」· 墩台局部冲刷" },
      { s: "式 8.6.2", n: "基础埋深安全值 Δ", u: "m", d: "总冲刷深度 = 自然演变 + 一般 + 局部；大中桥 Δ=1.5~3.5m、特大桥 2.0~4.0m（档间线性插值）。", w: "「大、中桥孔径计算」· 总冲刷深度" },
      { s: "壅水式", n: "桥前最大壅水（《公路工程水文勘测设计指南》2001）", u: "m", d: "Δz = K·KN·(vM²−v0M²)/(2g)；桥面最低高程 = Hs + Δz′ + (2/3)Δh₂ + (1/2)Δh湾 + 净空。", w: "「大、中桥孔径计算」· 桥前壅水与桥面设计高程" }
    ]},
    { g: "方法 C · 径流厚度法", items: [
      { s: "Qp", n: "设计洪峰流量", u: "m³/s", d: "Qp = ψ·(h−z)^1.5·F^0.8·β·γ·δ。", w: "适用于 F ≤ 30 km² 小流域" },
      { s: "ψ", n: "径流形成系数（地貌系数）", u: "—", d: "查表 B-5：按地形（平坦/起伏/山岭）与主河沟平均坡度、汇水面积档取值。", w: "方法 C 输入项" },
      { s: "h", n: "径流厚度", u: "mm", d: "查表 B-9：由暴雨分区 × 土的类别 Ⅰ~Ⅵ × 频率 × 汇流时间 τ（30/45/60/80min）共同决定，共 108 行已内置。", w: "方法 C 输入项" },
      { s: "z", n: "滞留厚度", u: "mm", d: "查表 B-10：按地面特征（密草 5mm、耕地 10mm 等）取值。", w: "方法 C 输入项" },
      { s: "β", n: "气候系数", u: "—", d: "查表 B-11：按汇水区重心距涵/桥位距离与地形取值。", w: "方法 C 输入项" },
      { s: "γ", n: "汇流区系数", u: "—", d: "查表 B-12：按汇流时间 τ 与汇水区尺寸 γw、气候区（东南/西北等）取值。", w: "方法 C 输入项" },
      { s: "δ", n: "湖泊水库调节系数", u: "—", d: "查表 B-13：按流域内湖泊（水库）面积率取值，无湖泊取 1。", w: "方法 C 输入项" },
      { s: "F", n: "汇水面积", u: "km²", d: "分水岭包围的地面集水区域面积，可用「地图量算」勾绘自动量出。", w: "全流程起点" }
    ]},
    { g: "推理公式符号", items: [
      { s: "Sp", n: "雨力", u: "mm/h", d: "暴雨强度要素，由暴雨等值线图按地点插值（雨力图面板）。", w: "雨力图面板 / 推理公式输入" },
      { s: "τ", n: "汇流时间", u: "h", d: "τ = K3·(L/√I)^α1，K3、α1 查汇流时间分区系数表；τ 决定暴雨递减指数 n 的档位。", w: "推理公式中间量" },
      { s: "μ", n: "损失参数（平均入渗率）", u: "mm/h", d: "北方：μ = K1·Sp^β1；南方：μ = K2·Sp^β2·F^(−λ)。μ ≥ Sp 时该区域不产流。", w: "推理公式中间量" },
      { s: "n", n: "暴雨递减指数", u: "—", d: "按 τ 档位取：τ<1 → n1；1≤τ<6 → n2；τ≥6 → n3（分区表已内置）。", w: "推理公式中间量" },
      { s: "L", n: "主河沟长度", u: "km", d: "分水岭至桥位的河沟长度，可在「地图量算」沿河沟中心线勾出。", w: "推理公式输入" },
      { s: "I", n: "主河沟平均坡度", u: "小数", d: "（上游高程−出口高程）/河长，注意不是千分数。", w: "推理公式输入" }
    ]},
    { g: "孔径与冲刷符号", items: [
      { s: "Kq / n3", n: "桥孔系数", u: "—", d: "表 7.2.1：稳定 0.84/0.90，次稳定 0.95/0.87，不稳定（滩槽可分）0.69/1.59。", w: "式 7.2.1-1" },
      { s: "Lj", n: "桥孔最小净长度", u: "m", d: "设计流量通过桥下所需的最小净宽，是最终桥长的下限（7.2.2）。", w: "桥孔计算结果" },
      { s: "hp", n: "一般冲刷后最大水深", u: "m", d: "河床在设计洪水冲刷达到平衡时的最大水深，是局部冲刷与埋深的输入。", w: "一般冲刷结果" },
      { s: "v0 / v0′", n: "起动流速 / 始冲流速", u: "m/s", d: "v0 = 0.28·(d̄+0.7)^0.5；v0′ = 0.12·(d̄+0.5)^0.55（d̄ 单位 mm）。v 与二者比较决定冲刷分支。", w: "65-2 式中间量" },
      { s: "Kξ", n: "墩形系数", u: "—", d: "按桥墩形状与水流斜交角查附录 C（单圆柱 1.00；圆端形、尖端形等另查）。", w: "65-2 式" },
      { s: "B1", n: "桥墩计算宽度", u: "m", d: "按附录 C 墩宽计算（含斜交修正）。", w: "65-2 式" },
      { s: "Kη2 / n2", n: "泥沙粒度系数 / 冲刷指数", u: "—", d: "由河床泥沙平均粒径 d̄ 决定（65-2 式内置公式）。", w: "65-2 式中间量" },
      { s: "d̄", n: "河床泥沙平均粒径", u: "mm", d: "筛分曲线按质量计的平均粒径。", w: "冲刷输入" }
    ]},
    { g: "壅水与桥面符号", items: [
      { s: "Δz", n: "桥前最大壅水高度", u: "m", d: "Δz = K·KN·(vM²−v0M²)/(2g)：桥孔压缩水流使上游水位抬高的最大值。", w: "壅水模块" },
      { s: "Δz′", n: "桥下壅水高度", u: "m", d: "表 4-3-2：一般 0.5Δz；暴涨暴落·坚实不冲取 Δz；涨落缓慢·松软易冲不计。", w: "壅水模块" },
      { s: "vM / v0M", n: "冲刷后 / 天然桥孔平均流速", u: "m/s", d: "vM = 设计流量 ÷ 冲刷后桥下过水面积；v0M = 天然状态下桥孔部分平均流速。", w: "壅水模块输入" },
      { s: "KN", n: "定床壅水系数", u: "—", d: "查定床壅水系数表（与河床质、流速比有关）。", w: "壅水模块输入" },
      { s: "Δh₂", n: "波浪高度", u: "m", d: "一般通过调查确定；计入桥面高程时取其 2/3。", w: "壅水模块输入" },
      { s: "Hmin", n: "桥面（梁底）最低设计高程", u: "m", d: "= 设计水位 + Δz′ + (2/3)Δh₂ + (1/2)Δh湾 + 净空安全值（表 4-3-6）。", w: "桥面高程结果" },
      { s: "i", n: "河床比降", u: "小数", d: "河底沿程下降率；壅水曲线全长 L ≈ 2Δz/i。", w: "壅水模块输入" }
    ]}
  ];

  /* ============ ⑤ 计算路线图 ============ */
  var ROUTE = [
    { t: "① 量算 F", sub: "需要：桥位地图/汇水区边界", nav: "mMap", open: "mapBox", anchor: "mapBox" },
    { t: "② 查雨力 Sp", sub: "需要：地点（省-市-县）+ 频率", nav: "mNoData", open: "noDataBox", anchor: "spMapPanel" },
    { t: "③ 设计流量 Qp", sub: "三选一：适线 / 推理公式 / 方法 C / 经验公式", nav: "mNoData", open: "noDataBox", anchor: "noDataBox" },
    { t: "④ 桥孔净长 Lj", sub: "需要：Qp、Qc、Bc、河段类型", nav: "mHydro", open: "hydroBox", details: "openBox", anchor: "openBox" },
    { t: "⑤ 一般冲刷 hp", sub: "需要：Q2、μ、Bcj、hmc、hcq、d̄ 或黏性土 IL", nav: "mHydro", open: "hydroBox", details: "scourBox", anchor: "scourBox" },
    { t: "⑥ 局部冲刷 hb", sub: "需要：v（可由 hp 推算）、B1、Kξ", nav: "mHydro", open: "hydroBox", details: "scourBox", anchor: "lsGo" },
    { t: "⑦ 总冲刷 + 埋深", sub: "自然演变 + 一般 + 局部，不利组合", nav: "mHydro", open: "hydroBox", details: "scourBox", anchor: "tsGo" },
    { t: "⑧ 壅水 → 桥面高程", sub: "需要：Hs、vM、v0M、KN、K、净空档", nav: "mHydro", open: "hydroBox", details: "deckBox", anchor: "deckBox" }
  ];

  /* ============ 工具 ============ */
  function el(id) { return document.getElementById(id); }
  function fmt(x, d) { return Number(x).toFixed(d === undefined ? 3 : d); }
  function goto(r) {
    if (r.nav) { var b = el(r.nav); if (b) b.click(); }
    if (r.open) { var p = el(r.open); if (p) p.style.display = ""; }
    if (r.details) { var d = el(r.details); if (d) d.open = true; }
    setTimeout(function () {
      var a = el(r.anchor || r.open);
      if (a) a.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  /* ============ ④ 用你的数算给你看 ============ */
  function stepsGsk() {
    var v = function (id) { return +el(id).value; };
    var sp = v("gskSp"), F = v("gskF"), L = v("gskL"), I = v("gskI");
    var k3 = v("gskK3"), a1 = v("gskAlpha1"), k1 = v("gskK1"), b1 = v("gskB1");
    var south = el("gskRegion").value === "south";
    var b3el = el("gskB3"), b3v = b3el ? +b3el.value : NaN;
    var tau = south
      ? k3 * Math.pow(L / Math.sqrt(I), a1) * Math.pow(sp, -b3v)
      : k3 * Math.pow(L / Math.sqrt(I), a1);
    var nKey = tau < 1 ? "n1" : (tau < 6 ? "n2" : "n3");
    var n = v("gsk" + nKey.charAt(0).toUpperCase() + nKey.slice(1));
    var mu, muLine;
    if (south) {
      mu = window.__hsLastGskMu;
      if (!Number.isFinite(mu)) throw new Error("南方分区系数为内置值：请先点一次计算，再查看过程");
      muLine = "μ = K2·Sp^β2·F^(−λ) = " + fmt(mu) + "（南方分区，系数内置）";
    } else {
      mu = k1 * Math.pow(sp, b1);
      muLine = "μ = K1·Sp^β1 = " + k1 + " × " + sp + "^" + b1 + " = " + fmt(mu) + " mm/h";
    }
    if (mu >= sp) throw new Error("μ=" + fmt(mu, 1) + " ≥ Sp=" + fmt(sp, 1) + "：该区域不产流（同主模块报错一致）");
    var q = 0.278 * ((sp - mu) / Math.pow(tau, n)) * F;
    return [
      (south
        ? "τ = K4·(L/√I)^α2·Sp^(−β3) = " + k3 + " × (" + L + "/√" + I + ")^" + a1 + " × " + sp + "^(−" + b3v + ") = <b>" + fmt(tau, 2) + " h</b>"
        : "τ = K3·(L/√I)^α1 = " + k3 + " × (" + L + "/√" + I + ")^" + a1 + " = <b>" + fmt(tau, 2) + " h</b>"),
      "τ=" + fmt(tau, 2) + " → 落在 " + (tau < 1 ? "τ<1" : tau < 6 ? "1≤τ<6" : "τ≥6") + " 档 → <b>n = " + nKey + " = " + n + "</b>",
      muLine,
      "净雨强 Sp − μ = " + sp + " − " + fmt(mu, 1) + " = " + fmt(sp - mu, 1) + " mm/h",
      "Qp = 0.278·(Sp−μ)/τ^n·F = 0.278 × " + fmt(sp - mu, 1) + " / " + fmt(tau, 2) + "^" + n + " × " + F + " = <b>" + fmt(q, 2) + " m³/s</b>",
      "与主模块结果对照：" + (el("gskOut").textContent || "—")
    ];
  }
  function stepsRd() {
    var v = function (id) { return +el(id).value; };
    var F = v("rdF"), h = v("rdH"), z = v("rdZ"), psi = v("rdPhi"), be = v("rdBeta"), ga = v("rdGamma"), de = v("rdDelta");
    var hz = h - z;
    var q = psi * Math.pow(hz, 1.5) * Math.pow(F, 0.8) * be * ga * de;
    return [
      "净径流厚度 h − z = " + h + " − " + z + " = <b>" + hz + " mm</b>",
      "(h−z)^1.5 = " + hz + "^1.5 = " + fmt(Math.pow(hz, 1.5), 2),
      "F^0.8 = " + F + "^0.8 = " + fmt(Math.pow(F, 0.8), 3),
      "Qp = ψ·(h−z)^1.5·F^0.8·β·γ·δ = " + psi + " × " + fmt(Math.pow(hz, 1.5), 2) + " × " + fmt(Math.pow(F, 0.8), 3) + " × " + be + " × " + ga + " × " + de + " = <b>" + fmt(q, 2) + " m³/s</b>",
      "与主模块结果对照：" + (el("rdOut").textContent || "—")
    ];
  }
  function stepsOp() {
    var reach = el("opReach").value;
    var tbl = { stable: [0.84, 0.90], substable: [0.95, 0.87], unstable: [0.69, 1.59] };
    var name = { stable: "稳定（开阔、顺直微弯）", substable: "次稳定（分汊、弯曲）", unstable: "不稳定（滩、槽可分）" };
    if (!tbl[reach]) throw new Error("宽滩河段与滩槽难分河段另有公式：请看主模块输出");
    var kq = tbl[reach][0], n3 = tbl[reach][1];
    var Qp = +el("opQp").value, Qc = +el("opQc").value, Bc = +el("opBc").value;
    var r = Math.pow(Qp / Qc, n3);
    var lj = kq * r * Bc;
    return [
      "河段类型「" + name[reach] + "」→ 表 7.2.1：Kq = " + kq + "，n3 = " + n3,
      "Qp/Qc = " + Qp + " / " + Qc + " = " + fmt(Qp / Qc, 4),
      "(Qp/Qc)^n3 = " + fmt(Qp / Qc, 4) + "^" + n3 + " = " + fmt(r, 4),
      "Lj = Kq·(Qp/Qc)^n3·Bc = " + kq + " × " + fmt(r, 4) + " × " + Bc + " = <b>" + fmt(lj, 2) + " m</b>",
      "与主模块结果对照：" + (el("opOut").textContent || "—")
    ];
  }
  function stepsDk() {
    var v = function (id) { return +el(id).value; };
    var g = 9.80;
    var Hs = v("dkHs"), vM = v("dkVM"), v0M = v("dkV0M"), KN = v("dkKN"), K = v("dkK");
    if (!(vM > v0M)) throw new Error("v_M 应大于 v_0M（与主模块一致）");
    var dz = K * KN * (vM * vM - v0M * v0M) / (2 * g);
    var sit = +el("dkSit").value, dzp = dz * sit;
    var wave = +el("dkWave").value, waveAdd = wave > 0 ? wave * 2 / 3 : 0;
    var wv = +el("dkWV").value, wb = +el("dkWB").value, wr = +el("dkWR").value, bendAdd = 0;
    var bendLine = "河湾超高：未填（0）";
    if (wv > 0 && wb > 0 && wr > 0) {
      bendAdd = (wv * wv * wb / (g * wr)) / 2;
      bendLine = "Δh = v²B/(gR) = " + fmt(wv * wv * wb / (g * wr), 3) + " → 计入 1/2 = " + fmt(bendAdd, 3) + " m";
    }
    var clr = +el("dkClr").value;
    var Hmin = Hs + dzp + waveAdd + bendAdd + clr;
    return [
      "Δz = K·KN·(vM²−v0M²)/(2g) = " + K + " × " + KN + " × (" + vM + "² − " + v0M + "²)/19.6 = <b>" + fmt(dz, 3) + " m</b>",
      "Δz′ = " + fmt(dz, 3) + " × " + sit + "（表 4-3-2 档位）= <b>" + fmt(dzp, 3) + " m</b>",
      "波浪计入 (2/3)Δh₂ = " + fmt(waveAdd, 3) + " m；" + bendLine,
      "净空安全值 = " + fmt(clr, 2) + " m（表 4-3-6）",
      "H_min = " + Hs + " + " + fmt(dzp, 2) + " + " + fmt(waveAdd, 2) + " + " + fmt(bendAdd, 2) + " + " + fmt(clr, 2) + " = <b>" + fmt(Hmin, 2) + " m</b>",
      "与主模块结果对照：" + (el("dkOut").textContent || "—")
    ];
  }
  function stepsLs() {
    var detail = el("lsDetail");
    var txt = detail ? detail.innerText : "";
    function grab(re) { var m = txt.match(re); return m ? parseFloat(m[1]) : NaN; }
    var v0 = grab(/= ([0-9.]+) m\/s/);
    var allNum = txt.match(/([0-9.]+) m\/s/g) || [];
    var v0p = allNum.length > 1 ? parseFloat(allNum[1]) : NaN;
    var keta = grab(/Kη2 = ([0-9.]+)/);
    var n2v = grab(/n₂ = ([0-9.]+)/);
    var hpv = grab(/hp = ([0-9.]+)/);
    if (!Number.isFinite(v0) || !Number.isFinite(keta) || !Number.isFinite(n2v)) {
      throw new Error("请先在主模块点一次「计算局部冲刷」，中间量（v0、v0′、Kη2、n2）会由主模块给出，这里再展开代入");
    }
    var v = +el("lsV").value, B1 = +el("lsB1").value, Kxi = +el("lsKxi").value;
    var steps = [
      "v0（起动流速）= " + fmt(v0, 3) + " m/s；v0′（始冲流速）= " + fmt(v0p, 3) + " m/s（由 d̄ 算出）",
      "Kη2 = " + keta + "；n2 = " + n2v,
      "行近流速 v = " + v + " m/s → 分支判断：" + (v <= v0p ? "v ≤ v0′，不冲刷" : v <= v0 ? "v0′ < v ≤ v0，用一式" : "v > v0，用二式")
    ];
    if (v <= v0p) {
      steps.push("hb = 0（与主模块一致：" + (el("lsOut").textContent || "—") + "）");
    } else {
      var base = Kxi * keta * Math.pow(B1, 0.6) * Math.pow(hpv, 0.15);
      var ratio = (v - v0p) / v0;
      var hb = v <= v0 ? base * ratio : base * Math.pow(ratio, n2v);
      steps.push("Kξ·Kη2·B1^0.6·hp^0.15 = " + Kxi + " × " + keta + " × " + B1 + "^0.6 × " + fmt(hpv, 2) + "^0.15 = " + fmt(base, 4));
      steps.push("hb = " + fmt(base, 4) + " × (" + fmt(v, 2) + " − " + fmt(v0p, 3) + ")/" + fmt(v0, 3) + (v <= v0 ? "" : "^" + n2v) + " = <b>" + fmt(hb, 3) + " m</b>");
      steps.push("与主模块结果对照：" + (el("lsOut").textContent || "—"));
    }
    return steps;
  }
  function stepsSc() {
    var d = el("scDetail");
    if (!d || !d.innerHTML || d.innerHTML.indexOf("=") < 0) {
      throw new Error("请先在主模块点「计算一般冲刷」——一般冲刷分支多（非黏性河槽/黏性土/河滩），过程由主模块按当前分支直接给出");
    }
    return ["<b>计算过程（主模块按当前分支输出）：</b>", d.innerHTML];
  }
  var STEP_TARGETS = [
    ["gskDetail", "gsk"],
    ["rdOut", "rd"],
    ["opDetail", "op"],
    ["dkDetail", "dk"],
    ["lsDetail", "ls"],
    ["scDetail", "sc"]
  ];
  var STEP_FN = { gsk: stepsGsk, rd: stepsRd, op: stepsOp, dk: stepsDk, ls: stepsLs, sc: stepsSc };

  function renderSteps(key, box) {
    try {
      var arr = STEP_FN[key]();
      box.innerHTML = arr.map(function (l) { return "<div style='margin:3px 0'>" + l + "</div>"; }).join("");
    } catch (e) {
      box.innerHTML = "<div style='color:var(--amber)'>" + (e && e.message ? e.message : String(e)) + "</div>";
    }
  }

  /* ============ 装配 ============ */
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function buildPanels() {
    var hint = document.querySelector("#helpBox .hint");
    if (!hint || el("hsSmartRoute")) return;

    var routeHtml = "<div id='hsSmartRoute' style='margin-top:10px'><details open><summary style='cursor:pointer;font-size:13px;color:var(--blue);font-weight:500'>我怎么算桥？· 点击路线图直达（推荐新手从这里开始）</summary>" +
      "<div style='display:flex;flex-wrap:wrap;gap:6px;align-items:stretch;margin-top:8px'>";
    ROUTE.forEach(function (r, i) {
      routeHtml += "<div role='button' data-hsroute='" + i + "' style='cursor:pointer;min-width:150px;flex:1 1 150px;border:1px solid var(--border);border-radius:10px;padding:7px 9px;background:var(--card,#fff)'>" +
        "<div style='font-size:12.5px;font-weight:600'>" + r.t + "</div>" +
        "<div style='font-size:11px;color:var(--text2);margin-top:2px'>" + r.sub + "</div>" +
        "<div style='font-size:11px;color:var(--blue);margin-top:3px'>点这里直达 →</div></div>";
    });
    routeHtml += "</div><div style='font-size:11.5px;color:var(--text3);margin-top:6px'>顺序即整条计算链：面积 → 雨力 → 流量 → 孔径 → 冲刷 → 壅水 → 桥面高程。点击任意节点会自动切到对应页面并定位。</div></details></div>";
    hint.insertAdjacentHTML("afterend", routeHtml);

    var symHtml = "<div id='hsSmartSym' style='margin-top:10px'><details open><summary style='cursor:pointer;font-size:13px;color:var(--blue);font-weight:500'>符号词典 · 按分类点选，不用打字</summary><div style='margin-top:8px'>";
    SYM.forEach(function (grp, gi) {
      symHtml += "<div style='font-size:12px;font-weight:600;color:var(--text2);margin:8px 0 4px'>" + esc(grp.g) + "</div><div style='display:flex;flex-wrap:wrap;gap:5px'>";
      grp.items.forEach(function (it, ii) {
        symHtml += "<button class='btn ghost' data-hssym='" + gi + ":" + ii + "' style='padding:3px 10px;font-size:12.5px'>" + esc(it.s) + "</button>";
      });
      symHtml += "</div>";
    });
    symHtml += "</div><div id='hsSymCard' style='display:none;margin-top:8px;border:1px solid var(--border);border-radius:10px;padding:10px'></div></details></div>";
    el("hsSmartRoute").insertAdjacentHTML("afterend", symHtml);

    el("hsSmartRoute").addEventListener("click", function (ev) {
      var t = ev.target.closest("[data-hsroute]");
      if (t) goto(ROUTE[+t.getAttribute("data-hsroute")]);
    });
    el("hsSmartSym").addEventListener("click", function (ev) {
      var t = ev.target.closest("[data-hssym]");
      if (!t) return;
      var p = t.getAttribute("data-hssym").split(":");
      var it = SYM[+p[0]].items[+p[1]];
      var card = el("hsSymCard");
      card.style.display = "block";
      card.innerHTML = "<div style='font-size:14px;font-weight:700'>" + esc(it.s) + " <span style='font-weight:400;color:var(--text2)'>" + esc(it.n) + "</span></div>" +
        "<div style='font-size:12px;margin-top:4px'>单位：<b>" + esc(it.u) + "</b></div>" +
        "<div style='font-size:12.5px;margin-top:4px;line-height:1.55'>" + it.d + "</div>" +
        "<div style='font-size:11.5px;color:var(--blue);margin-top:6px'>在哪里用：" + esc(it.w) + "</div>";
    });

    STEP_TARGETS.forEach(function (pair) {
      var anchor = el(pair[0]);
      if (!anchor || anchor.parentElement.querySelector("[data-hssteps-btn='" + pair[1] + "']")) return;
      var btn = document.createElement("button");
      btn.className = "btn ghost";
      btn.setAttribute("data-hssteps-btn", pair[1]);
      btn.style.cssText = "margin-top:6px;padding:3px 12px;font-size:12px";
      btn.textContent = "▶ 看计算过程（用当前输入值逐步代入）";
      var box = document.createElement("div");
      box.setAttribute("data-hssteps-box", pair[1]);
      box.style.cssText = "display:none;margin-top:6px;font-size:12.5px;border:1px dashed var(--border);border-radius:8px;padding:8px;background:var(--card,#fafafa)";
      anchor.parentElement.insertBefore(btn, anchor);
      if (anchor.nextSibling) anchor.parentElement.insertBefore(box, anchor.nextSibling);
      else anchor.parentElement.appendChild(box);
      btn.addEventListener("click", function () {
        var visible = box.style.display !== "none";
        box.style.display = visible ? "none" : "block";
        if (!visible) renderSteps(pair[1], box);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildPanels);
  } else {
    buildPanels();
  }
})();
