import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function skyBrightness(page: Page) {
  // Hide the HTML scrims so their colors cannot conceal a stale GPU theme.
  const pixels = await page.locator("canvas").screenshot({
    style: ".portfolio > :not(.world-layer) { visibility: hidden !important; }",
  });
  return page.evaluate(
    async (url) => {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 120;
      canvas.height = 80;
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 40, 100, 120, 80, 0, 0, 120, 80);
      const data = context.getImageData(0, 0, 120, 80).data;
      let total = 0;
      for (let i = 0; i < data.length; i += 4)
        total += (data[i] + data[i + 1] + data[i + 2]) / 3;
      return total / (data.length / 4);
    },
    `data:image/png;base64,${pixels.toString("base64")}`,
  );
}

test("system theme follows the device until an explicit choice, then persists across pages", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/?graphics=off#projects");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator('meta[name="theme-color"]')).toHaveCount(1);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#edf1f3",
  );
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(
    page.getByRole("button", { name: "Switch to light theme" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-scene",
    "projects",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.goto("/profile/");
  await expect(page.locator('meta[name="theme-color"]')).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Switch to dark theme" }),
  ).toBeVisible();
  const second = await context.newPage();
  await second.goto("/?graphics=off");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(second.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("link", { name: "RETURN TO SPACE" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(errors).toEqual([]);
});

test("theme works when browser storage is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage unavailable");
      },
    });
  });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/?graphics=off");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("switching the paused WebGL scene preserves its canvas and project details", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/#projects");
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-graphics",
    "webgl",
  );
  await page
    .getByRole("button", { name: "EXPLORE PROJECT", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "CLOSE EXPLORATION" }),
  ).toHaveAttribute("aria-expanded", "true");
  await page
    .locator("canvas")
    .evaluate((canvas) => canvas.setAttribute("data-same-context", "yes"));
  await expect.poll(() => skyBrightness(page)).toBeLessThan(70);
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect.poll(() => skyBrightness(page)).toBeGreaterThan(190);
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-same-context",
    "yes",
  );
  await expect(page.locator(".portfolio")).toHaveClass(/motion-still/);
  await expect(
    page.getByRole("button", { name: "CLOSE EXPLORATION" }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-scene",
    "projects",
  );
});

test("theme and clock remain separate from the brand on compact screens", async ({
  page,
}) => {
  await page.goto("/?graphics=off");
  for (const [width, height] of [
    [320, 640],
    [390, 844],
    [800, 600],
    [900, 540],
    [1024, 600],
    [1366, 600],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    const boxes = await page
      .locator(".brand,.local-time,.theme-toggle,.contact-shortcut")
      .evaluateAll((elements) =>
        elements
          .map((element) => ({
            name: element.className,
            ...element.getBoundingClientRect().toJSON(),
          }))
          .filter((box) => box.width && box.height),
      );
    for (let a = 0; a < boxes.length; a++) {
      expect(boxes[a].x).toBeGreaterThanOrEqual(0);
      expect(boxes[a].right).toBeLessThanOrEqual(width);
      for (let b = a + 1; b < boxes.length; b++) {
        expect(
          Math.min(boxes[a].right, boxes[b].right) >
            Math.max(boxes[a].x, boxes[b].x) &&
            Math.min(boxes[a].bottom, boxes[b].bottom) >
              Math.max(boxes[a].y, boxes[b].y),
          `${width}: ${boxes[a].name} / ${boxes[b].name}`,
        ).toBe(false);
      }
    }
    await page.getByRole("button", { name: /Switch to .* theme/ }).focus();
    await page.keyboard.press("Enter");
  }
});

test("light scenes and text view pass contrast and accessibility checks", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/?graphics=off");
  for (const id of [
    "home",
    "systems",
    "experience",
    "projects",
    "lab",
    "contact",
  ]) {
    await page.locator(`.orbit-node[href="#${id}"]`).click();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations,
      `${id}: ${JSON.stringify(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })))}`,
    ).toEqual([]);
  }
  await page.goto("/profile/");
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});
