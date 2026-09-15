import { expect, test } from "@playwright/test";
import { advanceSkyTime } from "../src/experience/effects/sky-clock";
import { beginSceneTravel, createRuntime } from "../src/experience/runtime";

test("celestial events keep their place across scene travel and pause while motion is disabled", () => {
  const runtime = createRuntime();
  advanceSkyTime(runtime, 0.016, true);
  const elapsed = runtime.skyTime;
  beginSceneTravel(runtime, 3, 1000, true);
  expect(runtime.skyTime).toBe(elapsed);
  runtime.paused = true;
  advanceSkyTime(runtime, 1, true);
  expect(runtime.skyTime).toBe(elapsed);
  runtime.paused = false;
  runtime.reducedMotion = true;
  advanceSkyTime(runtime, 1, true);
  expect(runtime.skyTime).toBe(elapsed);
  runtime.reducedMotion = false;
  advanceSkyTime(runtime, 1, false);
  expect(runtime.skyTime).toBe(elapsed);
  advanceSkyTime(runtime, 120, true);
  expect(runtime.skyTime - elapsed).toBeCloseTo(0.05);
});

test("fallback events stop with the existing motion control and reduced motion", async ({
  page,
}) => {
  await page.goto("/?graphics=off");
  await expect(page.locator(".fallback-sky-events")).toBeVisible();
  const animation = page.locator(".meteor-one");
  await expect(animation).toHaveCSS("animation-play-state", "running");
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  await expect(page.locator(".fallback-sky-events")).toBeHidden();
  await page
    .getByRole("button", { name: "Resume motion", exact: true })
    .click();
  await expect(page.locator(".fallback-sky-events")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".fallback-sky-events")).toBeHidden();
});
