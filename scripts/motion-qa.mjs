import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.QA_URL || "http://localhost:4173";
await mkdir("qa/motion", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const reports = [];
for (const [label, viewport, destination] of [
  ["desktop", { width: 1440, height: 900 }, "systems"],
  ["mobile", { width: 390, height: 844 }, "contact"],
]) {
  const context = await browser.newContext({
    viewport,
    recordVideo: { dir: "qa/motion", size: viewport },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base, { waitUntil: "networkidle" });
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-graphics",
    "webgl",
  );
  // Warm the other scenes before recording camera motion, including their shaders.
  await page.locator(`.orbit-node[href="#${destination}"]`).click();
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-travelling",
    "false",
  );
  await page.locator('.orbit-node[href="#home"]').click();
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-travelling",
    "false",
  );
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `qa/motion/${label}-before.png` });
  await page.locator(`.orbit-node[href="#${destination}"]`).click();
  const start = Date.now();
  const samples = [];
  for (const time of [150, 650, 1200, 2100]) {
    await page.waitForTimeout(Math.max(0, start + time - Date.now()));
    const state = await page.evaluate(
      (id) => ({
        opacity: getComputedStyle(
          document.querySelector(`#${id} .scene-arrival`),
        ).opacity,
        travelling: document.querySelector(".portfolio").dataset.travelling,
        graphics: document.querySelector(".portfolio").dataset.graphics,
        fps: document.querySelector("canvas").dataset.fps,
      }),
      destination,
    );
    samples.push({ elapsed: Date.now() - start, ...state });
    await page.screenshot({ path: `qa/motion/${label}-${time}.png` });
  }
  await expect(page.locator(".scene-panel:visible")).toHaveCount(1);
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-travelling",
    "false",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  reports.push({ label, destination, base, samples, errors });
  await context.close();
}
await browser.close();
await writeFile("qa/motion/report.json", JSON.stringify(reports, null, 2));
console.log(JSON.stringify(reports));
