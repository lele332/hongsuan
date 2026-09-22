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
  check(results, "页面标题版本", title.includes("v0.8.0"), title);

  if (mode === "web" || mode === "electron") {
    check(results, "单一内核产物已加载", await page.evaluate(() =>
      Boolean(document.querySelector('script[src="app.js"]'))
    ));
  } else if (mode === "offline") {
    check(results, "离线版无外链脚本", await page.evaluate(() =>
      document.querySelectorAll("script[src], link[href], img[src]").length === 0
    ));
  }

  await page.click("#btnCalc");
  await page.waitForTimeout(200);
  const q1 = Number((await page.textContent("#outQ")).replace(/[^0-9.]/g, ""));
  check(results, "频率适线设计流量", Number.isFinite(q1) && q1 > 0, `Q1%=${q1}`);

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

  await page.click("#mNoData");
  await page.waitForTimeout(200);
  const rcOut = await page.textContent("#rcOut");
  const rdOut = await page.textContent("#rdOut");
  check(results, "推理公式输出", /^\d+(\.\d+)?$/.test(rcOut), rcOut);
  check(results, "径流厚度法输出", /^\d+(\.\d+)?$/.test(rdOut), rdOut);

  await page.fill("#rcF", "150");
  await page.dispatchEvent("#rcF", "input");
  await page.waitForTimeout(100);
  const invalidTitle = await page.getAttribute("#rcOut", "title");
  check(results, "方法 C 越界提示", /100 km²/.test(invalidTitle ?? ""), invalidTitle ?? "");

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

  if (mode === "offline") {
    const externalRequests = requests.filter(protocol => !["file:", "blob:", "data:"].includes(protocol));
    check(results, "离线版无网络请求", externalRequests.length === 0, externalRequests.join(", "));
  }

  check(results, `${mode.toUpperCase()} 控制台无错误`, errors.length === 0, errors.join(" | "));
  if (screenshotPath) await page.screenshot({ path: screenshotPath, fullPage: true });
  return { results, errors };
}
