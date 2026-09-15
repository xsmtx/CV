import { chromium } from "@playwright/test";
import { mkdir, writeFile, readFile } from "node:fs/promises";

await mkdir("qa/matrix", { recursive: true });
const base = process.env.QA_URL || "http://localhost:4173";
const sizes = [
  [1920, 1080],
  [2560, 1440],
  [1440, 900],
  [1366, 768],
  [1024, 768],
  [820, 1180],
  [390, 844],
  [375, 667],
  [320, 640],
];
const scenes = ["home", "systems", "experience", "projects", "lab", "contact"];
const browser = await chromium.launch({ channel: "chrome" });
const report = {
  date: new Date().toISOString(),
  browser: browser.version(),
  checks: [],
  errors: [],
  performance: [],
};
for (const [width, height] of sizes) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    hasTouch: width < 900,
    isMobile: width < 760,
  });
  const page = await context.newPage();
  page.on("pageerror", (error) =>
    report.errors.push(`${width}×${height}: ${error.message}`),
  );
  page.on("console", (message) => {
    if (message.type() === "error")
      report.errors.push(`${width}×${height}: ${message.text()}`);
  });
  await page.goto(base, { waitUntil: "networkidle" });
  for (const scene of scenes) {
    await page.locator(`.orbit-node[href="#${scene}"]`).click();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(1300);
    const filename = `qa/matrix/${width}x${height}-${scene}.png`;
    await page.screenshot({ path: filename });
    const metrics = await page.evaluate(() => ({
      overflowX: document.documentElement.scrollWidth > innerWidth,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      mode: document.querySelector(".portfolio").getAttribute("data-graphics"),
      canvas: { ...document.querySelector("canvas")?.dataset },
      panels: [
        ...document.querySelectorAll(
          "section:not([hidden]) [data-scroll-panel]",
        ),
      ].map((el) => ({
        name: el.className,
        height: el.clientHeight,
        content: el.scrollHeight,
      })),
      navTargets: [...document.querySelectorAll(".orbit-node")].map((el) => ({
        name: el.textContent,
        width: el.getBoundingClientRect().width,
        height: el.getBoundingClientRect().height,
      })),
    }));
    report.checks.push({ width, height, scene, filename, ...metrics });
  }
  await context.close();
  console.log(`Reviewed ${width}×${height}: six scenes`);
}
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base, { waitUntil: "networkidle" });
const cdp = await page.context().newCDPSession(page);
await cdp.send("Performance.enable");
for (let pass = 0; pass < 3; pass++) {
  for (const scene of scenes) {
    await page.locator(`.orbit-node[href="#${scene}"]`).click();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(1500);
    report.performance.push({
      pass,
      scene,
      ...(await page.locator("canvas").evaluate((el) => ({ ...el.dataset }))),
    });
  }
  await cdp.send("HeapProfiler.collectGarbage");
  const metrics = await cdp.send("Performance.getMetrics");
  report.performance.push({
    pass,
    heapUsed: metrics.metrics.find((m) => m.name === "JSHeapUsedSize")?.value,
  });
}
await writeFile("qa/visual-report.json", JSON.stringify(report, null, 2));
// Produce contact sheets by laying the screenshots out in a browser.
for (const [width, height] of sizes) {
  const images = await Promise.all(
    scenes.map(async (scene) => ({
      scene,
      data: (
        await readFile(`qa/matrix/${width}x${height}-${scene}.png`)
      ).toString("base64"),
    })),
  );
  const sheet = await browser.newPage({
    viewport: { width: 1440, height: width < 760 ? 2160 : 1060 },
  });
  await sheet.setContent(
    `<html><body style="margin:0;background:#141a1e;color:#eee;font:12px monospace;display:grid;grid-template-columns:repeat(3,1fr);gap:10px">${images.map((item) => `<figure style="margin:0"><figcaption style="padding:8px">${width}×${height} / ${item.scene}</figcaption><img style="width:100%;display:block" src="data:image/png;base64,${item.data}"/></figure>`).join("")}</body></html>`,
  );
  await sheet.screenshot({
    path: `qa/matrix/sheet-${width}x${height}.png`,
    fullPage: true,
  });
  await sheet.close();
}
console.log(
  JSON.stringify({
    checks: report.checks.length,
    errors: report.errors,
    overflows: report.checks
      .filter((check) => check.overflowX || check.overflowY)
      .map((check) => `${check.width}x${check.height}-${check.scene}`),
  }),
);
await browser.close();
