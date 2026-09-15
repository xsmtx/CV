import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

await mkdir("qa", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
await page.goto(process.env.QA_URL || "http://localhost:3000", {
  waitUntil: "networkidle",
});
await expect(page.locator(".portfolio")).toHaveAttribute(
  "data-graphics",
  "webgl",
);
const ids = ["home", "systems", "experience", "projects", "lab", "contact"];
for (const id of ids) {
  await page.locator(`.orbit-node[href="#${id}"]`).click();
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-travelling",
    "false",
  );
  await page.screenshot({ path: `qa/desktop-${id}.png` });
}
await page.setViewportSize({ width: 390, height: 844 });
for (const id of ids) {
  await page.locator(`.orbit-node[href="#${id}"]`).click();
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-travelling",
    "false",
  );
  await page.screenshot({ path: `qa/mobile-${id}.png` });
}
await writeFile("qa/review-errors.json", JSON.stringify(errors, null, 2));
console.log(JSON.stringify({ errors }));
await browser.close();
