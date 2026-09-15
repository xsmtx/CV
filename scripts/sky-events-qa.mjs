import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

await mkdir("qa/sky-events", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "dark",
  recordVideo: { dir: "qa/sky-events", size: { width: 1440, height: 900 } },
});
const page = await context.newPage();
const report = {
  date: new Date().toISOString(),
  errors: [],
  frames: [],
  panels: [],
};
page.on("pageerror", (error) => report.errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") report.errors.push(message.text());
});
await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await expect(page.locator(".portfolio")).toHaveAttribute(
  "data-graphics",
  "webgl",
);
await page.mouse.move(0, 0);
const started = Date.now();
for (const ms of [
  1800, 2400, 3000, 3600, 6000, 6800, 7400, 8000, 8600, 9200, 10000,
]) {
  await page.waitForTimeout(Math.max(1, ms - (Date.now() - started)));
  await page.screenshot({ path: `qa/sky-events/sky-${ms}.png` });
  report.frames.push({
    ms,
    ...(await page
      .locator("canvas")
      .evaluate((canvas) => ({ ...canvas.dataset }))),
  });
}
await page.getByRole("button", { name: "Switch to light theme" }).click();
await page.waitForTimeout(1800);
await page.screenshot({ path: "qa/sky-events/light-sky.png" });
await context.close();
const review = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "dark",
  reducedMotion: "reduce",
});
const panelPage = await review.newPage();
panelPage.on("pageerror", (error) => report.errors.push(error.message));
await panelPage.goto("http://localhost:4173/#projects", {
  waitUntil: "networkidle",
});
await expect(panelPage.locator(".portfolio")).toHaveAttribute(
  "data-graphics",
  "webgl",
);
for (const [width, height] of [
  [1440, 900],
  [1366, 600],
  [1024, 600],
  [390, 844],
  [320, 640],
]) {
  await panelPage.setViewportSize({ width, height });
  for (const theme of ["dark", "light"]) {
    const current = await panelPage.locator("html").getAttribute("data-theme");
    if (current !== theme)
      await panelPage
        .getByRole("button", { name: `Switch to ${theme} theme` })
        .click();
    await panelPage.waitForTimeout(350);
    await panelPage.screenshot({
      path: `qa/sky-events/panel-${theme}-${width}.png`,
    });
    const overflow = await panelPage.evaluate(
      () =>
        document.documentElement.scrollWidth > innerWidth ||
        document.documentElement.scrollHeight > innerHeight + 1,
    );
    report.panels.push({ width, height, theme, overflow });
  }
  await panelPage
    .getByRole("button", { name: "EXPLORE PROJECT", exact: true })
    .click();
  await panelPage
    .getByRole("heading", { name: "OUTCOME", exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    panelPage.getByRole("heading", { name: "OUTCOME", exact: true }),
  ).toBeInViewport();
  await panelPage.screenshot({ path: `qa/sky-events/detail-${width}.png` });
  await panelPage
    .getByRole("button", { name: "CLOSE EXPLORATION", exact: true })
    .click();
  await panelPage
    .locator("[data-scroll-panel]")
    .evaluateAll((panels) => panels.forEach((panel) => (panel.scrollTop = 0)));
}
await browser.close();
await writeFile("qa/sky-events/report.json", JSON.stringify(report, null, 2));
expect(report.errors).toEqual([]);
expect(report.panels.filter((panel) => panel.overflow)).toEqual([]);
console.log("Celestial-event frames and 10 panel views passed.");
