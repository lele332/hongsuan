import { chromium } from "playwright";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(process.cwd(), "web", "index.html");
const outDir = process.argv[2];
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, deviceScaleFactor: 1.5 });
const page = await context.newPage();
await page.goto(pathToFileURL(root).href, { waitUntil: "domcontentloaded" });
await page.waitForSelector("#outQ", { state: "visible" });
const shot = (name) => page.screenshot({ path: path.join(outDir, name), fullPage: true });

// 1. 模式一：流量系列适线（默认状态，含适线图与统计卡）
await page.waitForTimeout(300);
await shot("01-流量系列适线-主界面.png");

// 2. 模式一 + 特大洪水展开
await page.check("#hasExtra");
await page.fill("#inN", "100");
await page.fill("#inL", "1");
await page.fill("#extraSeries", "9000 8000");
await page.click("#btnCalc");
await page.waitForTimeout(300);
await shot("02-流量系列适线-不连序特大洪水.png");

// 3. 线型比选展开
await page.click("#btnBayes");
await page.waitForTimeout(600);
await shot("03-线型比选-贝叶斯.png");

// 4. 模式二：直接参数
await page.click("#mParams");
await page.waitForTimeout(300);
await shot("04-直接参数模式.png");

// 5. 模式三：历史洪水位法（展开糙率表）
await page.click("#mHist");
await page.click("#histBox details summary");
await page.waitForTimeout(300);
await shot("05-历史洪水位法.png");

// 6. 模式四：无资料地区（含查 h 工具）
await page.click("#mNoData");
await page.waitForTimeout(300);
await shot("06-无资料地区.png");

// 7. 查 h 工具插值演示
await page.fill("#lkTau", "52.5");
await page.click("#lkGo");
await page.waitForTimeout(200);
await page.evaluate(() => document.querySelector("#lkOut").scrollIntoView({ block: "center" }));
await page.waitForTimeout(200);
await shot("07-查h工具-插值演示.png");

await browser.close();
console.log("shots done ->", outDir);
