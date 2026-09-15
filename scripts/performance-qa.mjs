import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

await mkdir("qa", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const report = {
  date: new Date().toISOString(),
  browser: browser.version(),
  errors: [],
  samples: [],
  selectionGeometry: [],
};
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") report.errors.push(m.text());
});
await page.goto(process.env.QA_URL || "http://localhost:4173", {
  waitUntil: "networkidle",
});
const cdp = await page.context().newCDPSession(page);
await cdp.send("Performance.enable");
for (let pass = 0; pass < 4; pass++) {
  for (const scene of [
    "home",
    "systems",
    "experience",
    "projects",
    "lab",
    "contact",
  ]) {
    await page.locator(`.orbit-node[href="#${scene}"]`).click();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(1500);
    report.samples.push({
      pass,
      scene,
      ...(await page.locator("canvas").evaluate((el) => ({ ...el.dataset }))),
    });
  }
  await cdp.send("HeapProfiler.collectGarbage");
  const metrics = await cdp.send("Performance.getMetrics");
  report.samples.push({
    pass,
    heapUsed: metrics.metrics.find((m) => m.name === "JSHeapUsedSize").value,
  });
}
await page.locator('.orbit-node[href="#systems"]').click();
for (let pass = 0; pass < 3; pass++) {
  for (let i = 0; i < 7; i++) {
    await page.locator(".system-node").nth(i).click();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(160);
  }
  await page.waitForTimeout(1200);
  report.selectionGeometry.push({
    pass,
    ...(await page.locator("canvas").evaluate((el) => ({ ...el.dataset }))),
  });
}
await writeFile("qa/performance-report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
await browser.close();
