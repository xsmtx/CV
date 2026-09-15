import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.QA_URL || "http://localhost:4173";
await mkdir("qa/readability", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const report = { base, date: new Date().toISOString(), views: [], errors: [] };
const scenes = ["home", "systems", "experience", "projects", "lab", "contact"];
const defaultSizes = [
  [1920, 1080],
  [1440, 900],
  [1366, 768],
  [1024, 768],
  [820, 1180],
  [390, 844],
  [375, 667],
  [320, 640],
];
const sizes = process.env.QA_SIZES
  ? process.env.QA_SIZES.split(",").map((size) => size.split("x").map(Number))
  : defaultSizes;
for (const [width, height] of sizes) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => report.errors.push(e.message));
  await page.goto(base, { waitUntil: "networkidle" });
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-graphics",
    "webgl",
  );
  await page.evaluate(() => document.fonts.ready);
  for (const scene of scenes) {
    await page.locator(`.orbit-node[href="#${scene}"]`).click();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(100);
    const metrics = await page.evaluate(() => {
      const active = document.querySelector(".scene-panel:not([hidden])");
      const blocks = [
        ...active.querySelectorAll(
          ".home-heading,.home-introduction,.enter-world,.scene-title,.systems-selector,.domain-detail,.career-detail,.project-index,.project-content,.lab-description,.lab-controls,.contact-composition,.timeline-scrubber",
        ),
      ]
        .map((el) => ({
          name: el.className,
          box: el.getBoundingClientRect().toJSON(),
        }))
        .filter((el) => el.box.width && el.box.height);
      const collisions = [];
      for (let a = 0; a < blocks.length; a++)
        for (let b = a + 1; b < blocks.length; b++) {
          const x = blocks[a].box,
            y = blocks[b].box;
          if (
            Math.min(x.right, y.right) - Math.max(x.left, y.left) > 3 &&
            Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 3
          )
            collisions.push([blocks[a].name, blocks[b].name]);
        }
      const paragraphs = [
        ...active.querySelectorAll(
          ".home-introduction p,.scene-intro,.domain-detail > p:not(.detail-eyebrow),.career-detail > p:not(.detail-eyebrow),.project-summary,.project-architecture p,.lab-description > p:not(.lab-note),.contact-intro",
        ),
      ]
        .filter((el) => el.getBoundingClientRect().height)
        .map((el) => ({
          size: parseFloat(getComputedStyle(el).fontSize),
          font: getComputedStyle(el).fontFamily,
        }));
      return {
        collisions,
        paragraphs,
        overflow:
          document.documentElement.scrollWidth > innerWidth ||
          document.documentElement.scrollHeight > innerHeight + 1,
        scrollable:
          active.querySelector(".scene-arrival").scrollHeight >
          active.querySelector(".scene-arrival").clientHeight,
      };
    });
    await page.screenshot({
      path: `qa/readability/${width}x${height}-${scene}.png`,
    });
    report.views.push({ width, height, scene, ...metrics });
  }
  if (width < 900) {
    await page.locator('.orbit-node[href="#projects"]').click();
    await page
      .getByRole("button", { name: "EXPLORE PROJECT", exact: true })
      .click();
    const panel = page.locator("#projects .scene-arrival");
    await panel.evaluate((el) => (el.scrollTop = 0));
    if (await panel.evaluate((el) => el.scrollHeight > el.clientHeight + 2)) {
      await page.locator("#projects .scene-title").hover();
      await page.mouse.wheel(0, 200);
      await expect
        .poll(() => panel.evaluate((el) => el.scrollTop))
        .toBeGreaterThan(0);
    }
    await expect(page.locator(".portfolio")).toHaveAttribute(
      "data-scene",
      "projects",
    );
    await page
      .getByRole("heading", { name: "OUTCOME", exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `qa/readability/${width}x${height}-project-details.png`,
    });
  }
  await context.close();
  console.log(`Reviewed ${width}x${height}`);
}
await browser.close();
await writeFile("qa/readability/report.json", JSON.stringify(report, null, 2));
const failures = report.views.filter(
  (v) =>
    v.overflow ||
    v.collisions.length ||
    v.paragraphs.some((p) => p.size < 16 || !p.font.includes("Source Sans 3")),
);
console.log(
  JSON.stringify({
    views: report.views.length,
    errors: report.errors,
    failures,
  }),
);
expect(report.errors).toEqual([]);
expect(failures).toEqual([]);
