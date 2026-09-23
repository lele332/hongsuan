// 最小 ZIP 条目读取器：定位中央目录 → 找目标条目 → inflateRaw 解压
import { inflateRawSync } from "node:zlib";

function readZipEntry(buf, entryName) {
  // 从尾部找 EOCD 签名 0x06054b50
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65558); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) return null;
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) return null;
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const cmtLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.subarray(off + 46, off + 46 + nameLen).toString("utf-8");
    if (name === entryName) {
      // 本地文件头：30 字节定长 + 变长 name/extra
      const lNameLen = buf.readUInt16LE(localOff + 26);
      const lExtraLen = buf.readUInt16LE(localOff + 28);
      const dataOff = localOff + 30 + lNameLen + lExtraLen;
      const raw = buf.subarray(dataOff, dataOff + compSize);
      if (method === 0) return Buffer.from(raw);
      if (method === 8) return inflateRawSync(raw);
      return null;
    }
    off += 46 + nameLen + extraLen + cmtLen;
  }
  return null;
}

export function check(results, name, condition, detail = "") {
  if (!condition) throw new Error(`${name} failed${detail ? `: ${detail}` : ""}`);
  results.push(`${name} PASS${detail ? ` — ${detail}` : ""}`);
}

export async function verifyAppPage(page, options) {
  const { mode, startUrl, screenshotPath } = options;
  const results = [];
  const errors = [];
  const requests = [];

  page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", err => errors.push(String(err)));
  page.on("request", request => requests.push(new URL(request.url()).protocol));

  if (startUrl) {
    await page.goto(startUrl, { waitUntil: "domcontentloaded" });
  }
  await page.waitForSelector("#outQ", { state: "visible" });

  const title = await page.title();
  check(results, "页面标题版本", title.includes("v0.10.1"), title);

  if (mode === "web" || mode === "electron") {
    check(results, "单一内核产物已加载", await page.evaluate(() =>
      Boolean(document.querySelector('script[src="app.js"]'))
    ));
  } else if (mode === "offline") {
    check(results, "离线版无外链脚本", await page.evaluate(() =>
      document.querySelectorAll("script[src], link[href], img[src]").length === 0
    ));
  }

  // 坑1回归：混入无效值时界面必须明示，且只用有效值计算
  await page.fill("#series", "1200 850 abc -50 1500 900 1100 1350 700 1000");
  await page.click("#btnCalc");
  await page.waitForTimeout(200);
  const notice = await page.textContent("#parseErr");
  check(results, "无效值忽略明示", /已忽略 2 个无效值/.test(notice ?? ""), notice ?? "");
  await page.fill("#series", "1200 850 1500 900 1100 1350 700 1000 1400 650");
  await page.click("#btnCalc");
  await page.waitForTimeout(200);
  const cleanNotice = await page.textContent("#parseErr");
  const cleanHidden = !(await page.isVisible("#parseErr"));
  check(results, "干净输入无提示", cleanHidden || !/已忽略/.test(cleanNotice ?? ""), cleanNotice ?? "");

  // 面积转换（规范 6.2.2）：启用后 Q1% 按 (F设/F参)^n 缩放并明示
  await page.click("#seriesBox details summary");
  await page.waitForTimeout(150);
  const qBase = Number((await page.textContent("#outQ")).replace(/[^0-9.]/g, ""));
  await page.check("#convEnable");
  await page.fill("#convFRef", "100");
  await page.fill("#convFSite", "110");
  await page.fill("#convN", "");
  await page.click("#btnCalc");
  await page.waitForTimeout(200);
  const convNotice = await page.textContent("#parseErr");
  const qConv = Number((await page.textContent("#outQ")).replace(/[^0-9.]/g, ""));
  check(results, "面积转换明示", /面积比拟转换/.test(convNotice ?? ""), convNotice ?? "");
  check(results, "面积转换缩放", Math.abs(qConv - qBase * Math.pow(1.1, 0.75)) < qBase * 0.02, `Q=${qConv} vs base=${qBase}`);
  await page.uncheck("#convEnable");
  await page.click("#btnCalc");
  await page.waitForTimeout(200);

  await page.click("#btnCalc");
  await page.waitForTimeout(200);
  const q1 = Number((await page.textContent("#outQ")).replace(/[^0-9.]/g, ""));
  check(results, "频率适线设计流量", Number.isFinite(q1) && q1 > 0, `Q1%=${q1}`);

  // 图例菱形（色盲形状区分 R6）
  check(results, "图例含特大洪水菱形标记", await page.evaluate(() =>
    Boolean(document.querySelector(".legend .dia"))));

  // 悬停读数：十字线 + P/Q 读数条
  const box = await (await page.$("#chart")).boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.waitForTimeout(150);
  const readout = await page.textContent("#chartReadout");
  check(results, "图表悬停读数", /P = [\d.]+% .*Q = [\d.,]+/.test(readout ?? ""), readout ?? "");
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
  await page.waitForTimeout(100);

  // 对比表已自动记录方法A
  const cmpA = await page.textContent("#compareTable");
  check(results, "对比表记录方法A", /P-Ⅲ 频率适线/.test(cmpA ?? ""), cmpA ?? "");

  // 三点法初估
  await page.click("#btnThreePoint");
  await page.waitForTimeout(200);
  const tpMsg = await page.textContent("#fitMsg");
  check(results, "三点法初估", /三点法初估/.test(tpMsg ?? ""), tpMsg ?? "");

  // 优化适线：SSE 不劣化
  const sseBefore = Number((await page.textContent("#stSse")).replace(/[^0-9.]/g, ""));
  await page.click("#btnAutoFit");
  await page.waitForTimeout(600);
  const afMsg = await page.textContent("#fitMsg");
  const sseAfter = Number((await page.textContent("#stSse")).replace(/[^0-9.]/g, ""));
  check(results, "优化适线执行", /优化适线/.test(afMsg ?? ""), afMsg ?? "");
  check(results, "优化适线 SSE 不劣化", Number.isFinite(sseAfter) && sseAfter <= sseBefore * 1.001 + 1, `${sseBefore} -> ${sseAfter}`);

  await page.click("#btnBayes");
  await page.waitForSelector("#bayesResult", { state: "visible" });
  await page.waitForTimeout(500);
  const bayesText = await page.textContent("#bayesBars");
  check(results, "贝叶斯线型比选", /P-Ⅲ/.test(bayesText) && /Gumbel/.test(bayesText));

  await page.click("#mHist");
  await page.click("#btnHist");
  await page.waitForSelector("#histResult", { state: "visible" });
  const histText = await page.textContent("#histResult");
  check(results, "历史洪水位法", /设计流量/.test(histText) && /Q/.test(histText));
  const cmpB = await page.textContent("#compareTable");
  check(results, "对比表记录方法B", /历史洪水位法/.test(cmpB ?? ""), "");

  await page.click("#mNoData");
  await page.waitForTimeout(200);
  const rcOut = await page.textContent("#rcOut");
  const rdOut = await page.textContent("#rdOut");
  check(results, "推理公式输出", /^\d+(\.\d+)?$/.test(rcOut), rcOut);
  check(results, "径流厚度法输出", /^\d+(\.\d+)?$/.test(rdOut), rdOut);
  const cmpC = await page.textContent("#compareTable");
  check(results, "对比表记录方法C", /推理公式/.test(cmpC ?? "") && /径流厚度法/.test(cmpC ?? ""), "");

  await page.fill("#rcF", "150");
  await page.dispatchEvent("#rcF", "input");
  await page.waitForTimeout(100);
  const rcErrText = await page.textContent("#rcErr");
  const rcErrVisible = await page.isVisible("#rcErr");
  check(results, "方法 C 越界提示（可见 err 块）", rcErrVisible && /100 km²/.test(rcErrText ?? ""), rcErrText ?? "");
  await page.fill("#rcF", "3.94");
  await page.dispatchEvent("#rcF", "input");
  await page.waitForTimeout(100);
  check(results, "方法 C 错误恢复后隐藏", !(await page.isVisible("#rcErr")));

  // 查 h 工具：内置种子数据插值（5 区 IV 土 3.33% 45min = 44mm 节点值）
  await page.fill("#lkFreq", "3.33");
  await page.fill("#lkTau", "45");
  await page.click("#lkGo");
  await page.waitForTimeout(100);
  const lkOut = await page.textContent("#lkOut");
  check(results, "查 h 工具节点命中", /h=44/.test(lkOut ?? ""), lkOut ?? "");
  await page.fill("#lkTau", "10");
  await page.click("#lkGo");
  await page.waitForTimeout(100);
  const lkBad = await page.textContent("#lkOut");
  check(results, "查 h 工具越界报错", /超出表范围/.test(lkBad ?? ""), lkBad ?? "");

  // Word 计算书：拦截动态 <a>.click()，验证 DOCX 生成链路但不落盘。
  // Electron 的 BrowserContext 不支持 newPage()，因此统一复用当前页面并重置到默认适线模式。
  await page.evaluate(() => localStorage.clear());
  await page.goto((startUrl ?? page.url()).split("?")[0], { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#btnReport", { state: "visible" });
  await page.evaluate(() => {
    HTMLAnchorElement.prototype.click = function () {
      window.__reportDownloadName = this.download;
    };
  });
  // 真实内容断言：捕获 docx Blob，解 ZIP 校验 word/document.xml 正文关键词
  await page.evaluate(() => {
    window.__docxBlob = null;
    const orig = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (b) => { if (b.size > 10000) window.__docxBlob = b; return orig(b); };
  });
  const reportConsole = [];
  const consoleListener = msg => reportConsole.push(msg.text());
  page.on("console", consoleListener);
  await page.click("#btnReport");
  await page.waitForFunction(() => {
    return Boolean(document.querySelector("#btnReport")?.textContent?.includes("已生成"));
  }, null, { timeout: 15000 });
  page.off("console", consoleListener);
  const docxOk = reportConsole.filter(x => x.startsWith("DOCX_OK"));
  const reportName = await page.evaluate(() => window.__reportDownloadName);
  check(results, "Word 计算书导出", docxOk.length === 1 && reportName === "设计流量计算书_P3适线.docx", `${docxOk.join(", ")} / ${reportName}`);
  // 解包校验（最小 ZIP 读取器：中央目录 → 本地头 → inflateRaw）
  const docxB64 = await page.evaluate(async () => {
    const buf = new Uint8Array(await window.__docxBlob.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return btoa(bin);
  });
  const docxBuf = Buffer.from(docxB64, "base64");
  const zipRead = readZipEntry(docxBuf, "word/document.xml");
  const xml = zipRead ? zipRead.toString("utf-8") : "";
  check(results, "DOCX 为合法 ZIP 包", docxBuf.length > 10000 && docxBuf[0] === 0x50 && docxBuf[1] === 0x4b, `bytes=${docxBuf.length}`);
  check(results, "DOCX 含 word/document.xml", zipRead !== null);
  check(results, "DOCX 正文含计算书标题", xml.includes("桥涵设计流量计算书"));
  check(results, "DOCX 正文含规范引用", xml.includes("JTG C30-2015"));
  check(results, "DOCX 正文含频率成果表", xml.includes("频率曲线成果表"));

  // 设计洪水过程线：同倍比放大
  await page.click("#mHydro");
  await page.click("#btnHydroSample");
  await page.click("#btnHydroUseQp");
  await page.click("#btnHydroScale");
  await page.waitForTimeout(200);
  const kg = await page.textContent("#hydroKg");
  const hydroRows = await page.locator("#hydroTable tr").count();
  const hydroVisible = await page.isVisible("#hydroOut");
  check(results, "过程线放大执行", /^\d/.test(kg ?? "") && hydroVisible && hydroRows >= 7, `kg=${kg}, rows=${hydroRows}`);
  // 过程线错误路径：坏数据 → 可见 err 块
  await page.fill("#hydroTypical", "0 0\nabc 5");
  await page.click("#btnHydroScale");
  await page.waitForTimeout(100);
  const hydroErr = await page.textContent("#hydroErr");
  check(results, "过程线错误提示", await page.isVisible("#hydroErr") && /第 2 行/.test(hydroErr ?? ""), hydroErr ?? "");
  // 回到系列模式，保证后续计算书流程在默认态
  await page.click("#mSeries");
  await page.waitForTimeout(150);

  // 工程文件导出：捕获 JSON Blob 并校验 schema
  if (mode !== "offline") {
    await page.evaluate(() => {
      window.__projBlob = null;
      const orig = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (b) => { if (b.type === "application/json") window.__projBlob = b; return orig(b); };
    });
    await page.click("#projectCard summary");
    await page.waitForTimeout(150);
    await page.fill("#pjName", "E2E 测试项目");
    await page.click("#btnExportProject");
    await page.waitForTimeout(300);
    const projJson = await page.evaluate(async () => window.__projBlob ? await window.__projBlob.text() : null);
    let projOk = false, projName = "";
    try {
      const parsed = JSON.parse(projJson);
      projOk = parsed.schema === "hongsuan-project@1" && parsed.project && parsed.state;
      projName = parsed.project?.name ?? "";
    } catch { /* leave false */ }
    check(results, "工程文件导出", projOk && projName === "E2E 测试项目", projName);
    const pjMsg = await page.textContent("#pjMsg");
    check(results, "工程导出反馈", /已导出/.test(pjMsg ?? ""), pjMsg ?? "");
  }

  if (mode === "offline") {
    const externalRequests = requests.filter(protocol => !["file:", "blob:", "data:"].includes(protocol));
    check(results, "离线版无网络请求", externalRequests.length === 0, externalRequests.join(", "));
  }

  check(results, `${mode.toUpperCase()} 控制台无错误`, errors.length === 0, errors.join(" | "));
  if (screenshotPath) await page.screenshot({ path: screenshotPath, fullPage: true });
  return { results, errors };
}
