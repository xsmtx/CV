import { chromium, webkit, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.QA_URL || "http://localhost:4173";
const useWebKit = process.env.QA_ENGINE === "webkit";
const output = `qa/contact-sunrise${useWebKit ? "-webkit" : ""}`;
await mkdir(output, { recursive: true });
const browser = useWebKit
  ? await webkit.launch()
  : await chromium.launch({ channel: "chrome" });
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
await page.goto(`${base}/#contact`, { waitUntil: "networkidle" });
await expect(page.locator(".portfolio")).toHaveAttribute(
  "data-graphics",
  "webgl",
);
await page.waitForTimeout(2500);
await capture("direct-contact-dark");
report.frames.push(
  await page.locator("canvas").evaluate((canvas) => ({ ...canvas.dataset })),
);
await page.getByRole("button", { name: "Pause motion", exact: true }).click();
await capture("paused-contact");
for (const [width, height] of [
  [1440, 900],
  [1366, 768],
  [800, 600],
  [390, 844],
]) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(450);
  for (const theme of ["dark", "light"]) {
    if ((await page.locator("html").getAttribute("data-theme")) !== theme)
      await page
        .getByRole("button", { name: `Switch to ${theme} theme` })
        .click();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(350);
    await capture(`contact-${theme}-${width}`);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 1440 || width === 390) {
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      report.accessibility.push({
        width,
        theme,
        violations: result.violations,
      });
    }
  }
}
await page.setViewportSize({ width: 1440, height: 900 });
await page.getByRole("button", { name: "Resume motion", exact: true }).click();
await page.getByRole("button", { name: "Switch to dark theme" }).click();
await page.keyboard.press("Home");
await expect(page.locator(".portfolio")).toHaveAttribute(
  "data-travelling",
  "false",
);
await capture("home-regression");
await page.keyboard.press("m");
await expect(page.locator(".world-layer")).toHaveAttribute(
  "data-impact-phase",
  /impact|cooling/,
);
await capture("home-impact");
await page.keyboard.press("End");
await expect(page.locator(".portfolio")).toHaveAttribute(
  "data-travelling",
  "false",
);
await expect(page.locator(".world-layer")).toHaveAttribute(
  "data-impact-phase",
  "idle",
);
await capture("arrived-contact");
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto(`${base}/?graphics=off#contact`, { waitUntil: "networkidle" });
await capture("fallback-contact-dark");
await page.getByRole("button", { name: "Switch to light theme" }).click();
await page.waitForTimeout(350);
await capture("fallback-contact-light");
await page.setViewportSize({ width: 390, height: 844 });
await capture("fallback-contact-mobile-light");
await page.getByRole("button", { name: "Switch to dark theme" }).click();
await page.waitForTimeout(350);
await capture("fallback-contact-mobile-dark");
await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
await browser.close();
expect(report.errors).toEqual([]);
expect(report.accessibility.flatMap((entry) => entry.violations)).toEqual([]);
console.log("Contact sunrise review passed.");
