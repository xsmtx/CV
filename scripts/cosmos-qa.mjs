import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.QA_URL || "http://localhost:4173";
await mkdir("qa/cosmos", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "dark",
});
const page = await context.newPage();
const report = {
  base,
  date: new Date().toISOString(),
  scenes: [],
  errors: [],
  accessibility: [],
};
page.on("pageerror", (error) => report.errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") report.errors.push(message.text());
});
await page.goto(base, { waitUntil: "networkidle" });
await expect(page.locator(".portfolio")).toHaveAttribute(
  "data-graphics",
  "webgl",
);
for (const scene of [
  "home",
  "systems",
  "experience",
  "projects",
  "lab",
  "contact",
]) {
  await page.locator(`.orbit-node[href="#${scene}"]`).click();
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-travelling",
    "false",
  );
  await page.mouse.move(0, 0);
  await page.waitForTimeout(2200);
  const metrics = await page
    .locator("canvas")
    .evaluate((canvas) => ({ ...canvas.dataset }));
  report.scenes.push({ scene, ...metrics });
  await page.screenshot({ path: `qa/cosmos/dark-${scene}.png` });
  console.log(`${scene}: ${metrics.fps} FPS, ${metrics.drawCalls} draw calls`);
}
await page.emulateMedia({ reducedMotion: "reduce" });
await page.setViewportSize({ width: 2560, height: 1080 });
await page.locator('.orbit-node[href="#home"]').click();
await expect(page.locator(".portfolio")).toHaveAttribute("data-travelling", "false");
await page.waitForTimeout(1000);
await page.screenshot({ path: "qa/cosmos/ultrawide.png" });
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/?graphics=off`, { waitUntil: "networkidle" });
for (const scene of [
  "home",
  "systems",
  "experience",
  "projects",
  "lab",
  "contact",
]) {
  await page.locator(`.orbit-node[href="#${scene}"]`).click();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  report.accessibility.push({ scene, violations: result.violations });
}
await page.locator('.orbit-node[href="#home"]').click();
await page.screenshot({ path: "qa/cosmos/fallback-desktop.png" });
await page.getByRole("button", { name: "Switch to light theme" }).click();
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "qa/cosmos/fallback-mobile-light.png" });
await writeFile("qa/cosmos/report.json", JSON.stringify(report, null, 2));
await browser.close();
expect(report.errors).toEqual([]);
expect(report.accessibility.flatMap((entry) => entry.violations)).toEqual([]);
console.log("Cosmos review passed.");
