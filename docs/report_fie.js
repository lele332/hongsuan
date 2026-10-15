/* 泓算 · 洪水影响评价报告生成器
 * 按《XXX高速公路洪水影响评价》模板的目录结构与排版生成：
 * 章 18pt 宋体加粗 / 节 15pt 加粗 / 正文 12pt；自动填写计算成果，非计算内容留【待补充】占位。
 * 依赖：window.docx（libs/docx.umd.js）、window.__hsReportData()（app.js 数据出口）。
 */
(function () {
  'use strict';

  var FREQ_LABEL = { "0.0033": "1/300（特大桥）", "0.01": "1/100（大、中桥）", "0.02": "1/50", "0.04": "1/25" };

  function normLabel(freq) {
    return FREQ_LABEL[String(freq)] || (freq != null ? (freq * 100).toFixed(2).replace(/\.?0+$/, "") + "%" : "—");
  }
  function f1(x) { return Number.isFinite(x) ? x.toFixed(1) : "—"; }
  function f3(x) { return Number.isFinite(x) ? x.toFixed(3) : "—"; }
  function pad2(d) { return (d < 10 ? "0" : "") + d; }
  function dateStr() {
    var n = new Date();
    return n.getFullYear() + "年" + pad2(n.getMonth() + 1) + "月" + pad2(n.getDate()) + "日";
  }

  function build() {
    var D = window.docx;
    if (!D) return Promise.reject(new Error("docx 库未加载（libs/docx.umd.js）"));
    var R = (typeof window.__hsReportData === "function") ? window.__hsReportData() : null;
    if (!R) return Promise.reject(new Error("无法读取泓算计算数据（__hsReportData）"));
    var pj = R.project || {}, p = R.params || {};
    var hasFreq = Number.isFinite(p.mean) && p.mean > 0;
    var projName = pj.name || "";
    var bridgeName = pj.bridgeSite || "";
    var titlePart = projName ? (projName.replace(/洪水影响评价.*$/, "") + "洪水影响评价报告") : "洪水影响评价报告";

    // ---- 样式与工具 ----
    var F = "宋体";
    var H1 = function (t) { return new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, children: [new D.TextRun({ text: t, bold: true, size: 36, font: F, color: "000000" })], spacing: { before: 320, after: 200 } }); };
    var H2 = function (t) { return new D.Paragraph({ heading: D.HeadingLevel.HEADING_2, children: [new D.TextRun({ text: t, bold: true, size: 30, font: F, color: "000000" })], spacing: { before: 240, after: 160 } }); };
    var H3 = function (t) { return new D.Paragraph({ children: [new D.TextRun({ text: t, bold: true, size: 24, font: F, color: "000000" })], spacing: { before: 160, after: 120 } }); };
    var P = function (t, o) {
      o = o || {};
      return new D.Paragraph({
        children: [new D.TextRun({ text: t, size: 24, font: F, color: o.color || "000000", italics: !!o.italics })],
        spacing: { after: 120, line: 360 }, alignment: o.center ? D.AlignmentType.CENTER : undefined,
        indent: o.noIndent ? undefined : { firstLine: 480 }
      });
    };
    var TODO = function (t) { return P("【待补充：" + t + "】", { color: "C62828" }); };
    var KV = function (k, v) { return new D.Paragraph({ children: [new D.TextRun({ text: k + "：", bold: true, size: 24, font: F }), new D.TextRun({ text: v, size: 24, font: F })], spacing: { after: 80 } }); };
    var mkTable = function (header, rows) {
      var allRows = [new D.TableRow({ tableHeader: true, children: header.map(function (h) { return new D.TableCell({ children: [new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.TextRun({ text: h, bold: true, size: 21, font: F })] })] }); }) })].concat(rows.map(function (r) { return new D.TableRow({ children: r.map(function (c) { return new D.TableCell({ children: [new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.TextRun({ text: String(c), size: 21, font: F })] })] }); }) }); }));
      return new D.Table({ width: { size: 100, type: D.WidthType.PERCENTAGE }, rows: allRows });
    };
    var TBL_CAP = function (t) { return new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.TextRun({ text: t, bold: true, size: 21, font: F })], spacing: { before: 160, after: 80 } }); };
    var PAGEBREAK = function () { return new D.Paragraph({ children: [new D.PageBreak()] }); };

    // ---- 计算记录分类 ----
    var logs = R.logs || [];
    function pickLogs(keys) {
      return logs.filter(function (e) {
        var m = (e.module || "");
        return keys.some(function (k) { return m.indexOf(k) >= 0; });
      });
    }
    function kvOf(o) {
      if (!o) return "—";
      return Object.keys(o).map(function (k) { return k + "=" + o[k]; }).join("；");
    }
    function renderLogBlock(title, entries) {
      if (!entries.length) return [];
      return [H3(title)].concat(entries.map(function (e, i) {
        return new D.Paragraph({
          children: [
            new D.TextRun({ text: "（" + (i + 1) + "）" + (e.module || "—") + "　", bold: true, size: 24, font: F }),
            new D.TextRun({ text: "输入：" + kvOf(e.inputs) + "；成果：" + kvOf(e.results) + (e.basis ? "。依据：" + e.basis : ""), size: 24, font: F })
          ],
          spacing: { after: 120, line: 360 }
        });
      }));
    }
    var yongshui = pickLogs(["壅水", "壅高"]);
    var chongshua = pickLogs(["冲刷"]);
    var shuimianxian = pickLogs(["水面线", "水位", "壅水范围"]);
    var qiaokong = pickLogs(["桥孔", "净空"]);
    var logCount = logs.length;

    // ---- 各章内容 ----
    var ch1 = [
      H1("1 概述"),
      H2("1.1 项目背景"),
      P(projName
        ? "本项目为" + projName + (bridgeName ? "，涉及桥位/断面：" + bridgeName : "") + "。为科学评价工程建设对河道防洪安全的影响，依据国家有关法律法规和技术标准，开展洪水影响评价工作，为项目审批与建设提供技术依据。"
        : "本项目为【项目名称待补充】。为科学评价工程建设对河道防洪安全的影响，依据国家有关法律法规和技术标准，开展洪水影响评价工作，为项目审批与建设提供技术依据。"),
      TODO("项目由来、位置、建设必要性等背景描述（可结合设计资料补充）"),
      H2("1.2 评价依据"),
      P("（1）《中华人民共和国防洪法》；", { noIndent: true }),
      P("（2）《中华人民共和国河道管理条例》；", { noIndent: true }),
      P("（3）《防洪标准》（GB 50201—2014）；", { noIndent: true }),
      P("（4）《公路工程水文勘测设计规范》（JTG C30—2015）；", { noIndent: true }),
      P("（5）《堤防工程设计规范》（GB 50286—2013）；", { noIndent: true }),
      P("（6）水利部《河道管理范围内建设项目管理的有关规定》及《涉水建设项目洪水影响评价报告编制大纲（试行）》；", { noIndent: true }),
      P("（7）项目建设依据文件、设计资料及泓算 v1.0.13 水文计算成果。", { noIndent: true }),
      H2("1.3 评价范围"),
      TODO("评价河段范围、长度及控制断面位置"),
      H2("1.4 技术路线及工作内容"),
      P("本次评价以实测水文资料为基础，采用《公路工程水文勘测设计规范》（JTG C30—2015）推荐的计算方法：首先利用实测流量系列进行 P-Ⅲ型频率曲线适线，推求设计流量；在此基础上进行壅水、冲刷等洪水影响分析计算；最后对工程建设引发的防洪影响进行综合评价，并提出防治与补救措施建议。主要工作内容包括：水文分析计算、河道演变分析、洪水影响分析计算、防洪影响评价及结论建议。"),
      H2("1.5 高程系统"),
      P("本报告高程均采用 1985 国家高程基准；坐标均采用 2000 国家大地坐标系。【如与设计资料不一致请修改】")
    ];

    var ch2 = [
      H1("2 流域与河道概况"),
      H2("2.1 自然概况"),
      TODO("流域自然地理、气象水文、河流水系概况"),
      H2("2.2 资源与环境概况"),
      TODO("土地资源、生态环境等概况"),
      H2("2.3 现有水利工程及其它设施情况"),
      TODO("评价河段内堤防、涵闸、泵站、取排水口等设施情况"),
      H2("2.4 水利规划及实施安排"),
      TODO("流域/区域水利规划及与本项目的关系")
    ];

    var ch3 = [
      H1("3 建设项目基本情况"),
      H2("3.1 前期工作情况"),
      TODO("立项、可行性研究等前期工作情况"),
      H2("3.2 项目建设条件"),
      TODO("地形地质、交通运输、建材等建设条件"),
      H2("3.3 项目设计方案"),
      TBL_CAP("工程特性表"),
      mkTable(["项目", "内容"], [
        ["项目名称", projName || "【待补充】"],
        ["桥位/断面", bridgeName || "【待补充】"],
        ["设计洪水频率", hasFreq ? normLabel(R.freq) : "【待补充】"],
        ["设计流量 Qp", hasFreq ? f1(designQ()) + " m³/s" : "【待计算】"],
        ["编制人", pj.engineer || "【待补充】"],
        ["校核人", pj.reviewer || "【待补充】"],
        ["计算工具", "泓算 v1.0.13（桥涵水文计算，JTG C30—2015）"],
        ["桥型布置/跨径", "【待补充】"]
      ]),
      P("", { noIndent: true })
    ];

    var ch4;
    if (hasFreq) {
      var st = R.stats || {};
      var sorted = (R.series || []).slice().sort(function (a, b) { return b - a; });
      var empRows = sorted.slice(0, 15).map(function (qi, i) { return [i + 1, f1(qi), ((i + 1) / (sorted.length + 1) * 100).toFixed(2) + "%"]; });
      var freqRows = (R.freqRows || []).map(function (r) {
        return [r[0] < 1 ? r[0].toFixed(2) + "%" : r[0].toFixed(2).replace(/\.?0+$/, "") + "%", f3(r[1]), f3(r[2]), f1(r[3])];
      });
      ch4 = [
        H1("4 水文、河道演变及洪水影响分析计算"),
        H2("4.1 水文分析计算"),
        H3("4.1.1 洪水频率计算"),
        P("采用实测年最大流量系列进行频率分析，理论频率曲线采用 P-Ⅲ型，统计参数由适线法确定。按《公路工程水文勘测设计规范》（JTG C30—2015）式 6.2.6：Qp = Q̄(1 + Φp·Cv)，其中 Φp 为 P-Ⅲ型离均系数。"),
        TBL_CAP("实测流量系列统计参数表"),
        mkTable(["系列长度 n", "均值 Q̄（m³/s）", "Cv", "Cs/Cv"], [
          [st.n || "—", Number.isFinite(st.mean) ? f1(st.mean) + "（矩法初估）" : "—", Number.isFinite(st.cv) ? f3(st.cv) + "（矩法初估）" : "—", Number.isFinite(p.cs) && Number.isFinite(p.cv) ? (p.cs / p.cv).toFixed(1) : "—"]
        ]),
        KV("适线采用均值 Q̄", f1(p.mean) + " m³/s"),
        KV("适线采用 Cv", f3(p.cv)),
        KV("适线采用 Cs", f3(p.cs) + "（= " + (Number.isFinite(p.cs) && Number.isFinite(p.cv) ? (p.cs / p.cv).toFixed(1) : "—") + " Cv）"),
        KV("设计洪水频率", normLabel(R.freq)),
        TBL_CAP("设计流量成果表"),
        mkTable(["频率 P", "Φp", "Kp", "Qp（m³/s）"], freqRows),
        sorted.length ? TBL_CAP("实测系列经验频率表（前 15 项，Pm=m/(n+1)）") : P("（未录入实测系列）"),
        sorted.length ? mkTable(["序号 m", "流量 Q（m³/s）", "经验频率 Pm"], empRows) : null,
        sorted.length > 15 ? P("（仅列前 15 项）", { noIndent: true }) : null
      ].filter(Boolean);
      ch4.push(H2("4.2 河道演变分析"));
      ch4.push(TODO("河床演变、岸坡稳定性分析（可结合遥感影像与历史河势资料）"));
      ch4.push(H2("4.3 洪水影响分析计算"));
      ch4.push(H3("4.3.1 壅水分析计算"));
      if (yongshui.length || shuimianxian.length) {
        ch4 = ch4.concat(renderLogBlock("壅水及水位计算成果", yongshui.concat(shuimianxian)));
      } else {
        ch4.push(TODO("请在泓算中完成壅水计算后重新生成报告（计算记录将自动引用）"));
      }
      ch4.push(H3("4.3.2 冲刷分析计算"));
      if (chongshua.length) {
        ch4 = ch4.concat(renderLogBlock("冲刷计算成果", chongshua));
      } else {
        ch4.push(TODO("请在泓算中完成冲刷计算后重新生成报告（计算记录将自动引用）"));
      }
      if (qiaokong.length) ch4 = ch4.concat(renderLogBlock("桥孔与净空计算成果", qiaokong));
    } else {
      ch4 = [
        H1("4 水文、河道演变及洪水影响分析计算"),
        H2("4.1 水文分析计算"),
        P("尚未录入实测流量系列。请先在泓算「频率计算」模块录入或识别流量系列、完成 P-Ⅲ适线后，重新生成本报告，系统将自动填写本章全部计算成果。", { color: "C62828" }),
        H2("4.2 河道演变分析"),
        TODO("河床演变分析"),
        H2("4.3 洪水影响分析计算"),
        TODO("壅水、冲刷等计算（需先在泓算中完成相应计算）")
      ];
    }

    var summaryLines = [];
    if (hasFreq) summaryLines.push("采用 P-Ⅲ型频率曲线适线法，基于 " + ((R.stats && R.stats.n) || (R.series || []).length) + " 项实测系列，设计洪水频率 " + normLabel(R.freq) + " 对应设计流量 Qp = " + f1(designQ()) + " m³/s；");
    if (yongshui.length) summaryLines.push("壅水计算共 " + yongshui.length + " 项，主要成果：壅高 " + kvOf(yongshui[0].results) + "；");
    if (chongshua.length) summaryLines.push("冲刷计算共 " + chongshua.length + " 项，主要成果：" + kvOf(chongshua[0].results) + "；");
    summaryLines.push("共完成 " + logCount + " 项计算（详见附表），计算结果供学习与课程设计参考，工程应用须经注册工程师复核。");

    var ch5 = [
      H1("5 洪水影响分析评价"),
      H2("5.1 建设项目与相关规划的关系分析"),
      TODO("与流域综合规划、防洪规划、岸线规划的符合性分析"),
      H2("5.2 防洪标准符合性分析"),
      P(hasFreq ? "本项目设计洪水频率为 " + normLabel(R.freq) + "，对应设计流量 Qp = " + f1(designQ()) + " m³/s，满足《防洪标准》（GB 50201—2014）及《公路工程水文勘测设计规范》（JTG C30—2015）对相应等级建筑物的要求。【梁底高程、桥面标高等复核情况请补充】" : "【待补充：需先完成设计洪水频率计算】"),
      H2("5.3 防洪及河势影响分析"),
      TODO("结合壅水、冲刷计算成果分析对行洪安全与河势稳定的影响"),
      H2("5.4 国家基本水文站的影响分析"),
      TODO("壅水范围内有无国家基本水文站及影响分析"),
      H2("5.5 工程对现有水利工程与设施的影响分析"),
      TODO("对堤防、涵闸、取排水口等的影响分析"),
      H2("5.6 工程对防汛抢险的影响"),
      TODO("对防汛道路、抢险通道的影响分析"),
      H2("5.7 工程对第三人合法水事权益的影响"),
      TODO("对上下游、左右岸第三方权益的影响分析"),
      H2("5.8 洪水影响综合评价"),
      P(summaryLines.join(""), { noIndent: true })
    ];

    var ch6 = [
      H1("6 防治与补救措施"),
      H2("6.1 设计标准及主要补救措施的确定"),
      TODO("补救措施设计标准"),
      H2("6.2 防治补救工程措施"),
      TODO("护坡护岸、河道疏挖等工程措施及范围"),
      H2("6.3 工程量及工程投资汇总"),
      TODO("工程量与投资估算表")
    ];

    var ch7 = [
      H1("7 结论与建议"),
      H2("7.1 防洪评价的结论"),
      P("（1）" + summaryLines.join(""), { noIndent: true }),
      P("（2）本报告由泓算 v1.0.13 按标准目录自动生成，计算部分（第 4 章、附表）为软件实际计算成果；标注【待补充】的内容需由编制人员结合设计资料完善。", { noIndent: true }),
      H2("7.2 建议"),
      P("（1）工程施工部分河段需采用围堰挡水时，施工围堰等碍洪的临建设施应在汛期来到前和施工完成后进行彻底清除，以利行洪；", { noIndent: true }),
      P("（2）按规范要求的洪水标准编制施工度汛方案，并报当地水行政主管部门审批；", { noIndent: true }),
      P("（3）建议加强桥位河段河床演变观测，运行期定期复核冲刷深度与岸坡稳定；", { noIndent: true }),
      P("（4）【待补充：结合工程实际提出】", { noIndent: true })
    ];

    // ---- 附表：计算记录汇总 ----
    var appendix = [
      PAGEBREAK(),
      H1("附表　计算记录汇总表"),
      logs.length
        ? mkTable(["序号", "计算模块", "主要输入", "主要成果", "依据"], logs.map(function (e, i) {
            return [i + 1, e.module || "—", kvOf(e.inputs), kvOf(e.results), e.basis || "—"];
          }))
        : P("（无计算记录）"),
      new D.Paragraph({
        border: { top: { style: D.BorderStyle.SINGLE, size: 1, color: "d9d9d9" } },
        children: [new D.TextRun({ text: "本报告由泓算 v1.0.13 依据《XXX高速公路洪水影响评价》标准目录自动生成，生成时间：" + dateStr() + "。计算成果供学习与课程设计参考，工程应用须经注册工程师复核。", size: 18, font: F, color: "6e6e73" })],
        spacing: { before: 240 }
      })
    ];

    // ---- 封面 ----
    var cover = [
      new D.Paragraph({ spacing: { before: 2400 } }),
      new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.TextRun({ text: projName || "（项目名称）", bold: true, size: 32, font: F })], spacing: { after: 240 } }),
      new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.TextRun({ text: "洪水影响评价报告", bold: true, size: 56, font: F })], spacing: { after: 480 } }),
      new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.TextRun({ text: "（依据《公路工程水文勘测设计规范》JTG C30—2015）", size: 24, font: F, color: "6e6e73" })], spacing: { after: 2400 } }),
      new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.TextRun({ text: "桥位/断面：" + (bridgeName || "【待补充】"), size: 28, font: F })], spacing: { after: 160 } }),
      new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.TextRun({ text: "编制：" + (pj.engineer || "【待补充】") + "　　校核：" + (pj.reviewer || "【待补充】"), size: 28, font: F })], spacing: { after: 160 } }),
      new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.TextRun({ text: "泓算 HongSuan v1.0.13", size: 28, font: F })], spacing: { after: 160 } }),
      new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.TextRun({ text: dateStr(), size: 28, font: F })] }),
      PAGEBREAK()
    ];

    var toc = [
      new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.TextRun({ text: "目　　录", bold: true, size: 36, font: F })], spacing: { after: 240 } }),
      new D.TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-2" }),
      PAGEBREAK()
    ];

    var doc = new D.Document({
      features: { updateFields: true },
      styles: {
        default: {
          document: { run: { font: F, size: 24 }, paragraph: { spacing: { line: 360 } } },
          heading1: { run: { font: F, size: 36, bold: true, color: "000000" } },
          heading2: { run: { font: F, size: 30, bold: true, color: "000000" } }
        }
      },
      sections: [{
        children: [].concat(cover, toc, ch1, ch2, ch3, ch4, ch5, ch6, ch7, appendix)
      }]
    });

    return D.Packer.toBlob(doc);
  }

  function designQ() {
    var R = window.__hsReportData ? window.__hsReportData() : null;
    if (!R || !Number.isFinite(R.params.mean)) return NaN;
    if (R.freqRows) {
      var hit = R.freqRows.filter(function (r) { return Math.abs(r[0] - R.freq) < 1e-9; })[0];
      if (hit) return hit[3];
      var pp = (R.freq || 0.01) * 100;
      var row = R.freqRows.filter(function (r) { return Math.abs(r[0] - pp) < 1e-9; })[0];
      if (row) return row[3];
    }
    return NaN;
  }

  window.HONGSUAN_FIE_BUILD = build;
  window.HONGSUAN_FIE_DOWNLOAD = function () {
    build().then(function (blob) {
      var R = window.__hsReportData ? window.__hsReportData() : {};
      var name = "洪水影响评价报告_" + ((R.project && R.project.name) ? R.project.name : "泓算") + "_" + dateStr().replace(/[年月]/g, "-").replace("日", "") + ".docx";
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { a.remove(); URL.revokeObjectURL(a.href); }, 3e4);
      return blob.size;
    }).catch(function (e) {
      alert("报告生成失败：" + (e instanceof Error ? e.message : String(e)));
    });
  };
})();
