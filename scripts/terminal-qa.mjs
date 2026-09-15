import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

await mkdir("qa/terminal", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  reducedMotion: "reduce",
  colorScheme: "dark",
});
const errors = [];
const layouts = [];
page.on("pageerror", (error) => errors.push(error.message));
for (const [width, height, theme] of [
  [1440, 900, "dark"],
  [1440, 900, "light"],
  [1366, 768, "dark"],
  [800, 600, "dark"],
  [390, 844, "dark"],
  [320, 640, "light"],
]) {
  await page.setViewportSize({ width, height });
  await page.goto("http://localhost:4173/");
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-graphics",
    "webgl",
  );
  if ((await page.locator("html").getAttribute("data-theme")) !== theme)
    await page.getByRole("button", { name: /Switch to .* theme/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  await page.screenshot({ path: `qa/terminal/home-${width}-${theme}.png` });
  const footer = await page
    .locator(".footer-location,.footer-controls")
    .evaluateAll((elements) =>
      elements.map((el) => el.getBoundingClientRect().toJSON()),
    );
  expect(footer[0].right, `${width}: footer collision`).toBeLessThanOrEqual(
    footer[1].left,
  );
  await page
    .getByRole("button", { name: "Open terminal", exact: true })
    .click();
  await expect(page.locator("#terminal-command")).toBeFocused();
  await page.screenshot({ path: `qa/terminal/welcome-${width}-${theme}.png` });
  await page.locator("#terminal-command").fill("uptime");
  await page.locator("#terminal-command").press("Enter");
  await expect(page.locator(".terminal-entry pre").last()).toContainText("yıl");
  await page.screenshot({ path: `qa/terminal/uptime-${width}-${theme}.png` });
  await page.locator("#terminal-command").fill("open lab");
  await page.locator("#terminal-command").press("Enter");
  await expect(page.locator(".portfolio")).toHaveAttribute("data-scene", "lab");
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-travelling",
    "false",
  );
  await page.locator(".lab-terminal-entry button").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `qa/terminal/lab-${width}-${theme}.png` });
  await page.locator(".lab-terminal-entry button").click();
  await expect(page.locator("dialog")).toBeVisible();
  layouts.push({ width, height, theme, footer });
}
await browser.close();
await writeFile(
  "qa/terminal/visual-report.json",
  JSON.stringify({ layouts, errors }, null, 2),
);
expect(errors).toEqual([]);
console.log(`Verified ${layouts.length} WebGL layouts; no browser errors.`);
