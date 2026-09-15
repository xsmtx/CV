import { test, expect } from "@playwright/test";

test("quality reconfiguration keeps the active scene and a working graphics context", async ({
  page,
}) => {
  await page.goto("/#projects");
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-graphics",
    "webgl",
  );
  await page
    .locator("canvas")
    .evaluate((canvas) => canvas.setAttribute("data-original-context", "true"));
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("canvas")).not.toHaveAttribute(
    "data-original-context",
    "true",
  );
  await page.waitForTimeout(1100);
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-graphics",
    "webgl",
  );
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-scene",
    "projects",
  );
  await page.getByRole("button", { name: "EXPLORE PROJECT" }).click();
  await expect(page.locator("#project-architecture")).toBeVisible();
});

test("wheel travels through space and preserves local project scrolling", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForTimeout(1200);
  await page.mouse.move(800, 500);
  await page.mouse.wheel(0, 250);
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-scene",
    "systems",
  );
  await page.locator('.orbit-node[href="#projects"]').click();
  await page.getByRole("button", { name: "EXPLORE PROJECT" }).click();
  await page.waitForTimeout(1300);
  const panel = page.locator(".project-content");
  await panel.hover();
  await page.mouse.wheel(0, 120);
  await expect
    .poll(() => panel.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-scene",
    "projects",
  );
});

test("loss of the active graphics context preserves content and navigation", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Uses the Chromium WebGL context-loss extension.",
  );
  await page.goto("/#systems");
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-graphics",
    "webgl",
  );
  await page
    .locator("canvas")
    .evaluate((canvas: HTMLCanvasElement) =>
      canvas
        .getContext("webgl2")
        ?.getExtension("WEBGL_lose_context")
        ?.loseContext(),
    );
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-graphics",
    "fallback",
  );
  await page.locator('.orbit-node[href="#contact"]').click();
  await expect(page.locator(".email-link")).toBeVisible();
});

test("touch swipe advances the guided world", async ({
  browser,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Uses CDP to send a real touch sequence.",
  );
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("http://localhost:4173/");
  await page.waitForTimeout(1200);
  const cdp = await context.newCDPSession(page);
  // Start in the exposed world above the reading region. Swipes on text now
  // scroll that region, keeping long copy readable at its full font size.
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 350, y: 112 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 350, y: 22 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-scene",
    "systems",
  );
  await context.close();
});

test("navigation labels remain inside narrow desktop and tablet viewports", async ({
  page,
}) => {
  for (const size of [
    { width: 1024, height: 768 },
    { width: 820, height: 1180 },
    { width: 320, height: 640 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("/?graphics=off");
    const labels = await page.locator(".node-label").evaluateAll((elements) =>
      elements.map((el) => ({
        left: el.getBoundingClientRect().left,
        right: el.getBoundingClientRect().right,
      })),
    );
    for (const label of labels) {
      expect(label.left).toBeGreaterThanOrEqual(0);
      expect(label.right).toBeLessThanOrEqual(size.width);
    }
  }
});
