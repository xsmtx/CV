import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import {
  calendarAge,
  executeCommand,
  type ShellContext,
} from "../src/lib/terminal";

const context: ShellContext = {
  now: new Date("2026-09-15T10:00:00Z"),
  sessionStartedAt: Date.parse("2026-09-15T08:58:57Z"),
  scene: "home",
  theme: "dark",
  graphics: "WEBGL",
  fps: 60,
  paused: false,
  history: [],
};

test("age uses calendar anniversaries and Istanbul midnight", () => {
  expect(calendarAge("1992-03-06", context.now)).toMatchObject({
    years: 34,
    months: 6,
    days: 9,
  });
  expect(
    calendarAge("1992-03-06", new Date("2026-03-05T20:59:59Z")),
  ).toMatchObject({ years: 33, months: 11, days: 27 });
  expect(
    calendarAge("1992-03-06", new Date("2026-03-05T21:00:00Z")),
  ).toMatchObject({ years: 34, months: 0, days: 0 });
  expect(
    calendarAge("2000-02-29", new Date("2025-02-28T12:00:00Z")),
  ).toMatchObject({ years: 25, months: 0, days: 0 });
  expect(
    calendarAge("2024-01-31", new Date("2024-03-01T12:00:00Z")),
  ).toMatchObject({ years: 0, months: 1, days: 1, totalDays: 30 });
  expect(() => calendarAge("2023-02-29", context.now)).toThrow();
  expect(() => calendarAge("2030-01-01", context.now)).toThrow();
});

test("commands use real profile data and restrict actions to portfolio commands", () => {
  expect(executeCommand("uptime", context).text).toContain(
    "34 yıl · 6 ay · 9 gün",
  );
  expect(executeCommand("uptime --session", context).text).toContain(
    "1h 1m 3s",
  );
  expect(executeCommand("skills cloud", context).text).toContain(
    "fundamentals",
  );
  expect(executeCommand("projects scb", context).text).toContain("Docker");
  expect(executeCommand("curl -O CV", context).action?.type).toBe("download");
  expect(executeCommand("curl https://example.com", context).error).toBe(true);
  expect(executeCommand("rm -rf /", context).error).toBe(true);
  expect(executeCommand("contact", context).text).toContain(
    "info@sametkabakci.com",
  );
});

async function start(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("/?graphics=off");
  await page
    .getByRole("button", { name: "Open terminal", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Portfolio terminal" }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Command", exact: true }),
  ).toBeFocused();
}
async function run(page: Page, command: string) {
  const input = page.getByRole("textbox", { name: "Command", exact: true });
  await input.fill(command);
  await input.press("Enter");
}
const last = (page: Page) => page.locator(".terminal-entry pre").last();

test("keyboard history, completion, clear, focus restoration and scene isolation", async ({
  page,
}) => {
  await start(page);
  const input = page.getByRole("textbox", { name: "Command", exact: true });
  await input.fill("who");
  await input.press("Tab");
  await expect(input).toHaveValue("whoami");
  await input.press("Enter");
  await expect(last(page)).toContainText("Samet Kabakçı");
  await run(page, "uptime");
  await expect(last(page)).toContainText(/\d+ yıl · \d+ ay · \d+ gün/);
  await input.fill("draft");
  await input.press("ArrowUp");
  await expect(input).toHaveValue("uptime");
  await input.press("ArrowUp");
  await expect(input).toHaveValue("whoami");
  await input.press("ArrowDown");
  await input.press("ArrowDown");
  await expect(input).toHaveValue("draft");
  await run(page, "help");
  await page.locator(".terminal-output").hover();
  await page.mouse.wheel(0, 1200);
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-scene",
    "home",
  );
  await run(page, "<img src=x onerror=alert(1)>");
  await expect(page.locator(".terminal-entry").last()).toContainText(
    "<img src=x onerror=alert(1)>",
  );
  await expect(page.locator(".terminal-entry img")).toHaveCount(0);
  await run(page, "clear");
  await expect(page.locator(".terminal-entry")).toHaveCount(0);
  await run(page, "history");
  await expect(last(page)).toContainText("whoami");
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open terminal", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("t");
  await expect(page.locator("dialog")).toBeVisible();
  await expect(last(page)).toContainText("whoami");
  await input.fill("");
  await input.press("Tab");
  await expect(input).not.toBeFocused();
});

test("theme and open commands control the site, including the LAB entry", async ({
  page,
}) => {
  await start(page);
  await run(page, "theme light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await run(page, "open lab");
  await expect(page.locator("dialog")).not.toBeVisible();
  await expect(page.locator(".portfolio")).toHaveAttribute("data-scene", "lab");
  await page.locator(".lab-terminal-entry button").click();
  await expect(page.locator("dialog")).toBeVisible();
  await run(page, "exit");
  await expect(page.locator("dialog")).not.toBeVisible();
  await expect(page.locator(".lab-terminal-entry button")).toBeFocused();
});

test("curl CV downloads a valid PDF; HTTP failure can be retried", async ({
  page,
}) => {
  await start(page);
  await page.route("**/downloads/Samet-Kabakci-CV.pdf", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await run(page, "curl CV");
  await expect(last(page)).toContainText("temporarily unavailable");
  await expect(page.locator(".terminal-commandline")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await page.unroute("**/downloads/Samet-Kabakci-CV.pdf");
  const downloadPromise = page.waitForEvent("download");
  await run(page, "curl CV");
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("Samet-Kabakci-CV.pdf");
  const bytes = await readFile((await download.path())!);
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  expect(bytes.length).toBeGreaterThan(20000);
  await expect(last(page)).toContainText("Download requested");
  await expect(
    page.getByRole("link", { name: "Download PDF again" }),
  ).toBeVisible();
  await page.goto("/profile/");
  await expect(
    page.getByRole("link", { name: "Download CV (PDF)" }),
  ).toHaveAttribute("href", "/downloads/Samet-Kabakci-CV.pdf");
});

test("both themes pass accessibility checks and compact layouts keep the command visible", async ({
  page,
}) => {
  test.setTimeout(60000);
  await start(page);
  for (const theme of ["dark", "light"]) {
    await run(page, `theme ${theme}`);
    await expect(page.locator("dialog")).toHaveAttribute("data-theme", theme);
    await expect(page.locator("dialog")).toHaveCSS(
      "background-color",
      theme === "light" ? "rgb(243, 246, 248)" : "rgb(11, 19, 32)",
    );
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  }
  for (const [width, height] of [
    [1440, 900],
    [1366, 600],
    [800, 600],
    [390, 844],
    [320, 640],
    [390, 400],
  ]) {
    await page.setViewportSize({ width, height });
    await expect
      .poll(() =>
        page
          .locator("dialog")
          .evaluate((el) => Math.round(el.getBoundingClientRect().right)),
      )
      .toBeLessThanOrEqual(width);
    await expect
      .poll(() =>
        page
          .locator("dialog")
          .evaluate((el) => Math.round(el.getBoundingClientRect().bottom)),
      )
      .toBeLessThanOrEqual(height + 1);
    const dialog = await page.locator("dialog").boundingBox();
    const input = await page.locator("#terminal-command").boundingBox();
    expect(dialog!.x).toBeGreaterThanOrEqual(0);
    expect(dialog!.x + dialog!.width).toBeLessThanOrEqual(width);
    expect(dialog!.y + dialog!.height).toBeLessThanOrEqual(height + 1);
    expect(input!.y + input!.height).toBeLessThanOrEqual(height);
    expect(
      await page
        .locator(".terminal-output")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page.screenshot({
      path: `qa/terminal/${test.info().project.name}-${width}x${height}.png`,
    });
  }
  await expect(page.locator("dialog")).toHaveCSS("animation-name", "none");
});
