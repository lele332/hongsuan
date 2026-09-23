import { chromium } from "playwright";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { verifyAppPage } from "./verify-app-page.mjs";

const root = path.resolve(process.cwd(), "..", "dist", "泓算离线版-v0.9.0", "泓算-v0.9.0-离线版.html");
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await context.newPage();
const { results, errors } = await verifyAppPage(page, {
  mode: "offline",
  startUrl: pathToFileURL(root).href,
  screenshotPath: path.resolve(process.cwd(), "..", "work", "offline-v090-main.png"),
});
console.log(results.join("\n"));
await browser.close();
if (errors.length) process.exitCode = 1;
