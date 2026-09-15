import { expect, test } from "@playwright/test";
import { createRuntime } from "../src/experience/runtime";
import { advanceMeteor, requestMeteor } from "../src/experience/meteor";

test("impacts stay bounded, freeze in hidden tabs and cancel when leaving Home", () => {
  const runtime = createRuntime();
  expect(requestMeteor(runtime)).toBe(true);
  expect(requestMeteor(runtime)).toBe(false);
  advanceMeteor(runtime, 120, false);
  expect(runtime.impact.age).toBe(0);
  advanceMeteor(runtime, 120, true);
  expect(runtime.impact.age).toBe(0.05);
  runtime.scene = 1;
  advanceMeteor(runtime, 0.016, true);
  expect(runtime.impact.active).toBe(false);
  expect(requestMeteor(runtime)).toBe(false);
  runtime.scene = 0;
  runtime.travel.progress = 0.5;
  expect(requestMeteor(runtime)).toBe(false);
});

test("a left click reaches impact and cools down, with one meteor at a time", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-graphics",
    "webgl",
  );
  const world = page.locator(".world-layer");
  await page.mouse.click(980, 340);
  await expect(world).toHaveAttribute("data-impact-phase", "approach");
  await page.mouse.click(950, 380);
  await expect(world).toHaveAttribute("data-impact-count", "1");
  await expect(world).toHaveAttribute("data-impact-phase", /impact|cooling/);
  await expect(world).toHaveAttribute("data-impact-phase", "idle", {
    timeout: 7000,
  });
  await page.keyboard.press("m");
  await expect(world).toHaveAttribute("data-impact-count", "2");
  await page.keyboard.press("2");
  await expect(world).toHaveAttribute("data-impact-phase", "idle");
  await page.keyboard.press("m");
  await expect(world).toHaveAttribute("data-impact-count", "2");
  expect(errors).toEqual([]);
});

test("dragging, right clicks, modified shortcuts and interface buttons do not launch meteors", async ({
  page,
}) => {
  await page.goto("/?graphics=off");
  const world = page.locator(".world-layer");
  await page.mouse.move(980, 340);
  await page.mouse.down();
  await page.mouse.move(1030, 360, { steps: 6 });
  await page.mouse.move(980, 340, { steps: 6 });
  await page.mouse.up();
  await page.mouse.click(980, 340, { button: "right" });
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+m");
  await page.keyboard.press("Alt+m");
  await page.getByRole("button", { name: /Switch to .* theme/ }).click();
  await expect(world).toHaveAttribute("data-impact-count", "0");
  await page.keyboard.press("m");
  await expect(world).toHaveAttribute("data-impact-count", "1");
});

test("fallback renders the hit and removes it after cooling", async ({
  page,
}) => {
  await page.goto("/?graphics=off");
  await page.keyboard.press("m");
  await expect(page.locator(".fallback-impact")).toBeVisible();
  await expect(page.locator(".impact-meteor")).toHaveCSS(
    "animation-play-state",
    "running",
  );
  await expect(page.locator(".world-layer")).toHaveAttribute(
    "data-impact-phase",
    /impact|cooling/,
  );
  await expect(page.locator(".fallback-impact")).toHaveCount(0, {
    timeout: 7000,
  });
});

test("paused and reduced motion use a brief static surface glow", async ({
  page,
}) => {
  await page.goto("/?graphics=off");
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  await page.keyboard.press("m");
  await expect(page.locator(".world-layer")).toHaveAttribute(
    "data-impact-phase",
    "quiet",
  );
  await expect(page.locator(".impact-meteor")).toBeHidden();
  await expect(page.locator(".impact-wave")).toBeHidden();
  await expect(page.locator(".impact-heat")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".fallback-impact")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Resume motion", exact: true })
    .click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.keyboard.press("m");
  await expect(page.locator(".world-layer")).toHaveAttribute(
    "data-impact-phase",
    "quiet",
  );
  await expect(page.locator(".impact-meteor")).toBeHidden();
  await expect(page.locator(".fallback-impact")).toHaveCount(0);
});

test("tapping the exposed mobile world launches a meteor", async ({
  browser,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Mobile Chromium touch input.");
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("http://localhost:4173/");
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-graphics",
    "webgl",
  );
  await page.touchscreen.tap(350, 112);
  await expect(page.locator(".world-layer")).toHaveAttribute(
    "data-impact-count",
    "1",
  );
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-scene",
    "home",
  );
  await context.close();
});
