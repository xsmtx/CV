import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

await mkdir("public/assets", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
await page.goto(process.env.QA_URL || "http://localhost:3000", {
  waitUntil: "networkidle",
});
await page.waitForSelector('.portfolio[data-graphics="webgl"]');
await page.addStyleTag({
  content:
    ".global-header,.local-time,.global-footer,.orbit-navigation,.renderer-telemetry,.scene-coordinate,.edition,.enter-world,.world-annotation,.boot-message,.journey-progress{display:none!important}.home-heading{left:7%!important;top:25%!important}.identity{font-size:118px!important}.home-introduction{left:7%!important;bottom:12%!important}.home-introduction>p:first-child{font-size:14px!important}.home-introduction>p+p{font-size:11px!important}.identity-disciplines{font-size:8px!important}",
});
await page.waitForTimeout(500);
await page.screenshot({ path: "public/assets/social-preview.png" });
await browser.close();
console.log("Generated public/assets/social-preview.png (1200×630)");
