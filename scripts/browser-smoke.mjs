import { chromium, firefox, webkit } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir("qa/browsers", { recursive: true });
const report = [];
for (const [name, engine, options] of [
  ["edge", chromium, { channel: "msedge" }],
  ["firefox", firefox, {}],
  ["webkit", webkit, {}],
]) {
  if (process.env.QA_BROWSER && process.env.QA_BROWSER !== name) continue;
  const browser = await engine.launch(options);
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(process.env.QA_URL || "http://localhost:4173", {
    waitUntil: "networkidle",
  });
  if (name === "webkit") await page.waitForTimeout(6000);
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
    await page.waitForTimeout(name === "webkit" ? 3000 : 1500);
    await page.screenshot({ path: `qa/browsers/${name}-${scene}.png` });
  }
  // Inspect every material variant after the reference-driven graphics pass.
  await page.locator('.orbit-node[href="#projects"]').click();
  for (let i = 0; i < 4; i++) {
    await page.locator(".project-index button").nth(i).click();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `qa/browsers/${name}-project-${i + 1}.png` });
  }
  await page.locator('.orbit-node[href="#lab"]').click();
  await page.getByRole("button", { name: "Mesh", exact: true }).click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `qa/browsers/${name}-lab-mesh.png` });
  if (name === "edge") {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const scene of [
      "home",
      "systems",
      "experience",
      "projects",
      "lab",
      "contact",
    ]) {
      await page.locator(`.orbit-node[href="#${scene}"]`).click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `qa/browsers/edge-mobile-${scene}.png` });
    }
  }
  report.push({
    name,
    version: browser.version(),
    graphics: await page.locator(".portfolio").getAttribute("data-graphics"),
    errors,
  });
  await browser.close();
  console.log(`${name}: ${errors.length} errors`);
}
await writeFile("qa/browser-report.json", JSON.stringify(report, null, 2));
