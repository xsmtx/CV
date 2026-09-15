import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.QA_URL || "http://localhost:4173";
await mkdir("qa/themes", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const report = { base, date: new Date().toISOString(), views: [], errors: [] };
for (const [width, height] of [
  [1440, 900],
  [1366, 600],
  [800, 600],
  [390, 844],
  [320, 640],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "reduce",
    colorScheme: "dark",
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  await page.goto(base, { waitUntil: "networkidle" });
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-graphics",
    "webgl",
  );
  await page.evaluate(() => document.fonts.ready);
  for (const theme of ["dark", "light"]) {
    if (theme === "light")
      await page.getByRole("button", { name: "Switch to light theme" }).click();
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
      await page.waitForTimeout(250);
      await page.screenshot({
        path: `qa/themes/${theme}-${width}x${height}-${scene}.png`,
      });
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth > innerWidth ||
          document.documentElement.scrollHeight > innerHeight + 1,
      );
      report.views.push({ theme, width, height, scene, overflow });
    }
  }
  await page.goto(`${base}/profile/`);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.screenshot({
    path: `qa/themes/light-${width}x${height}-profile.png`,
  });
  await context.close();
  console.log(`Reviewed both themes at ${width}x${height}`);
}
await browser.close();
await writeFile("qa/themes/report.json", JSON.stringify(report, null, 2));
expect(report.errors).toEqual([]);
expect(report.views.filter((view) => view.overflow)).toEqual([]);
console.log(`${report.views.length} theme views passed.`);
