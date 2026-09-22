import { _electron } from "playwright";
import path from "node:path";
import { verifyAppPage } from "./verify-app-page.mjs";

const exe = path.resolve(process.cwd(), "..", "dist", "泓算桌面版-v0.8.0", "泓算.exe");
const electronApp = await _electron.launch({ executablePath: exe });
const page = await electronApp.firstWindow();
const { results, errors } = await verifyAppPage(page, { mode: "electron" });
console.log(results.join("\n"));
await electronApp.close();
if (errors.length) process.exitCode = 1;
