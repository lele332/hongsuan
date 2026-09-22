import { chromium } from "playwright";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { verifyAppPage } from "./verify-app-page.mjs";

const root = path.resolve(process.cwd(), "web", "index.html");
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await context.newPage();
const { results, errors } = await verifyAppPage(page, {
  mode: "web",
  startUrl: pathToFileURL(root).href,
  screenshotPath: path.resolve(process.cwd(), "..", "work", "ui-v080-main.png"),
});
console.log(results.join("\n"));
await browser.close();
if (errors.length) process.exitCode = 1;
