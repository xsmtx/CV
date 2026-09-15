import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.QA_URL || "http://localhost:4173";
const output = "qa/earth-impact";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "dark",
});
const page = await context.newPage();
const report = {
  base,
  date: new Date().toISOString(),
  errors: [],
  frames: [],
  accessibility: [],
};
page.on("pageerror", (error) => report.errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") report.errors.push(message.text());
});
const capture = async (name) =>
  page.screenshot({ path: `${output}/${name}.png` });
await page.goto(base, { waitUntil: "networkidle" });
await expect(page.locator(".portfolio")).toHaveAttribute(
  "data-graphics",
  "webgl",
);
await page.waitForTimeout(3000);
await capture("home-dark");
await page.mouse.click(980, 340);
await page.mouse.move(10, 850);
const start = Date.now();
for (const at of [150, 350, 650, 950, 1450, 2100, 3400]) {
  await page.waitForTimeout(Math.max(1, at - (Date.now() - start)));
  report.frames.push({
    at,
    phase: await page.locator(".world-layer").getAttribute("data-impact-phase"),
    metrics: await page
      .locator("canvas")
      .evaluate((canvas) => ({ ...canvas.dataset })),
  });
  await capture(`impact-${at}`);
}
await expect(page.locator(".world-layer")).toHaveAttribute(
  "data-impact-phase",
  "idle",
);
for (const theme of ["dark", "light"]) {
  if (theme === "light")
    await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.waitForTimeout(250);
  await capture(`home-${theme}`);
  await page.keyboard.press("m");
  await page.waitForTimeout(1100);
  await capture(`impact-${theme}`);
  await expect(page.locator(".world-layer")).toHaveAttribute(
    "data-impact-phase",
    "idle",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  report.accessibility.push({ theme, violations: result.violations });
  await page.emulateMedia({ reducedMotion: "no-preference" });
}
for (const [width, height] of [
  [1366, 768],
  [800, 600],
  [390, 844],
]) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(600);
  for (const theme of ["light", "dark"]) {
    if ((await page.locator("html").getAttribute("data-theme")) !== theme)
      await page
        .getByRole("button", { name: `Switch to ${theme} theme` })
        .click();
    await capture(`home-${theme}-${width}`);
  }
}
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/?graphics=off`, { waitUntil: "networkidle" });
await capture("fallback-dark");
await page.keyboard.press("m");
await page.waitForTimeout(1200);
await capture("fallback-impact");
await page.getByRole("button", { name: "Switch to light theme" }).click();
await page.setViewportSize({ width: 390, height: 844 });
await capture("fallback-mobile-light");
await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
await browser.close();
expect(report.errors).toEqual([]);
expect(report.accessibility.flatMap((entry) => entry.violations)).toEqual([]);
console.log("Earth / impact review passed.");
