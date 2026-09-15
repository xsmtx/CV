import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("all spaces, deep links and browser history preserve the location", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  for (const id of ["systems", "experience", "projects", "lab", "contact"]) {
    await page.locator(`.orbit-node[href="#${id}"]`).click();
    await expect(page.locator(".portfolio")).toHaveAttribute("data-scene", id);
    await expect(page.locator(`#${id}`)).toBeVisible();
    await expect(page.locator(".scene-panel:visible")).toHaveCount(1);
  }
  await page.goBack();
  await expect(page.locator(".portfolio")).toHaveAttribute("data-scene", "lab");
  await page.reload();
  await expect(page.locator(".portfolio")).toHaveAttribute("data-scene", "lab");
  expect(errors).toEqual([]);
});

test("keyboard navigation, focus and timeline scrubbing", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("3");
  await expect(page.locator("#heading-experience")).toBeFocused();
  await expect(page.locator(".era-year")).toHaveText("2026");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".career-detail")).toContainText("SCB Network LTD");
  await expect(page.locator(".era-year")).toHaveText("2024");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".career-detail")).toContainText("Team Lead");
  await page.keyboard.press("End");
  await expect(page.locator("#heading-contact")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.locator("#heading-home")).toBeFocused();
});

test("systems expose source-based detail and label fundamentals", async ({
  page,
}) => {
  await page.goto("/#systems");
  await page.getByRole("button", { name: /Databases/ }).click();
  await expect(page.locator(".domain-detail")).toContainText("MariaDB");
  await expect(page.locator(".domain-detail")).toContainText("Redis");
  await page.getByRole("button", { name: /Cloud & virtualization/ }).click();
  await expect(page.locator(".domain-detail")).toContainText(
    "Cloud fundamentals",
  );
  await expect(page.locator(".domain-detail")).toContainText(
    "Terraform fundamentals",
  );
});

test("four project explorations open, switch and close without a route change", async ({
  page,
}) => {
  await page.goto("/#projects");
  for (let i = 0; i < 4; i++) {
    await page.locator(".project-index button").nth(i).click();
    await page.getByRole("button", { name: "EXPLORE PROJECT" }).click();
    await expect(page.locator("#project-architecture")).toBeVisible();
    await expect(page.locator("#project-architecture")).toContainText(
      "ARCHITECTURE",
    );
    await expect(page).toHaveURL(/#projects$/);
    await page.keyboard.press("Escape");
    await expect(page.locator("#project-architecture")).toBeHidden();
  }
});

test("lab controls change the model, signal rate and pause state", async ({
  page,
}) => {
  await page.goto("/#lab");
  await page.getByRole("button", { name: "Mesh", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Mesh", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#lab .scene-object-caption")).toContainText(
    "24 CONNECTIONS",
  );
  const slider = page.getByRole("slider", { name: "SIGNAL RATE" });
  await slider.focus();
  await slider.press("ArrowRight");
  await expect(page.locator("output")).toHaveText("0.7×");
  await expect(page.locator(".portfolio")).toHaveAttribute("data-scene", "lab");
  await page.getByRole("button", { name: "Pause signal", exact: true }).click();
  await expect(page.locator(".lab-controls-bottom")).toContainText(
    "SIGNAL PAUSED",
  );
  await page
    .getByRole("button", { name: "Resume signal", exact: true })
    .click();
});

test("contact links and copying are usable", async ({
  page,
  context,
  browserName,
}) => {
  if (browserName === "chromium")
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  else
    await page.addInitScript(() =>
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: async () => {} },
      }),
    );
  await page.goto("/#contact");
  await expect(page.locator(".email-link")).toHaveAttribute(
    "href",
    "mailto:info@sametkabakci.com",
  );
  await expect(
    page.getByRole("link", { name: "GITHUB", exact: true }),
  ).toHaveAttribute("href", "https://github.com/xsmtx");
  await page.getByRole("button", { name: "Copy email address" }).click();
  await expect(page.locator(".copy-feedback")).toHaveText(
    "Email address copied.",
  );
  if (browserName === "chromium")
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "info@sametkabakci.com",
    );
});

test("clipboard failure provides a manual way to copy", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("Permission denied");
        },
      },
    }),
  );
  await page.goto("/#contact");
  await page.getByRole("button", { name: "Copy email address" }).click();
  await expect(page.locator(".copy-feedback")).toContainText(
    "Select and copy: info@sametkabakci.com",
  );
});

test("fallback works without a WebGL context and includes every space", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (
        type === "webgl" ||
        type === "webgl2" ||
        type === "experimental-webgl"
      )
        return null;
      return Reflect.apply(getContext, this, [type, ...args]);
    } as typeof getContext;
  });
  await page.goto("/");
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-graphics",
    "fallback",
  );
  for (const id of ["systems", "experience", "projects", "lab", "contact"]) {
    await page.locator(`.orbit-node[href="#${id}"]`).click();
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("reduced motion and user pause retain complete navigation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#lab");
  await expect(page.locator(".portfolio")).toHaveClass(/motion-still/);
  await expect(page.locator(".precision-reticle")).toBeHidden();
  await expect(page.locator(".lab-controls-bottom")).toContainText(
    "STILL PREVIEW",
  );
  await page.keyboard.press("2");
  await expect(page.locator("#systems")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  await expect(page.locator(".portfolio")).toHaveClass(/motion-still/);
  await page
    .getByRole("button", { name: "Resume motion", exact: true })
    .click();
  await expect(page.locator(".portfolio")).not.toHaveClass(/motion-still/);
});

test("mobile has usable navigation and no document overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator('.orbit-node[href="#systems"]').click();
  await page.getByRole("button", { name: "Next space", exact: true }).click();
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-scene",
    "experience",
  );
  for (const id of [
    "home",
    "systems",
    "experience",
    "projects",
    "lab",
    "contact",
  ]) {
    await page.locator(`.orbit-node[href="#${id}"]`).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight + 1,
      ),
    ).toBe(true);
  }
});

test("server-rendered profile is complete with JavaScript disabled", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://localhost:4173/profile/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Samet Kabakçı",
  );
  await expect(page.locator("main")).toContainText("SCB Network LTD");
  await expect(page.locator("main")).toContainText("Needtowatch.net");
  await expect(page.locator("main")).toContainText("Celal Bayar University");
  await expect(
    page.getByRole("link", { name: "info@sametkabakci.com" }),
  ).toBeVisible();
  await context.close();
});

test("active scene and readable profile pass automated accessibility checks", async ({
  page,
}) => {
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
