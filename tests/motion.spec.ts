import { test, expect } from "@playwright/test";
import {
  beginSceneTravel,
  createRuntime,
  sampleSceneTravel,
  SCENE_TRAVEL_MS,
  worldOrigins,
} from "../src/experience/runtime";

test("camera travel starts gently, retargets continuously and settles after dropped frames", () => {
  const runtime = createRuntime();
  beginSceneTravel(runtime, 5, 100, true);
  sampleSceneTravel(runtime, 200);
  expect(Math.abs(runtime.travel.origin[2])).toBeLessThan(0.2);
  sampleSceneTravel(runtime, 900);
  const interrupted = [...runtime.travel.origin];
  beginSceneTravel(runtime, 1, 900, true);
  expect(runtime.travel.origin).toEqual(interrupted);
  sampleSceneTravel(runtime, 900 + SCENE_TRAVEL_MS + 800);
  expect(runtime.travel.origin).toEqual(worldOrigins[1]);
  expect(runtime.travel.progress).toBe(1);
  runtime.paused = true;
  beginSceneTravel(runtime, 4, 4000, true);
  expect(runtime.travel.origin).toEqual(worldOrigins[4]);
  runtime.paused = false;
  sampleSceneTravel(runtime, 4100);
  expect(runtime.travel.origin).toEqual(worldOrigins[4]);
});

test("scene handover fades out, prevents wheel overshoot and accepts a new destination", async ({
  page,
}) => {
  await page.goto("/?graphics=off");
  await page.waitForTimeout(1100);
  // Measure in the page from the real click. Automation can return late from
  // click() under browser contention, after the midpoint has already passed.
  await page.evaluate(() => {
    document.querySelector('.orbit-node[href="#systems"]')!.addEventListener(
      "click",
      () => {
        window.setTimeout(() => {
          document.documentElement.dataset.handoverOpacity = getComputedStyle(
            document.querySelector("#systems .scene-arrival")!,
          ).opacity;
        }, 700);
      },
      { once: true },
    );
  });
  await page.locator('.orbit-node[href="#systems"]').click();
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-travelling",
    "true",
  );
  await expect(page.locator("#home")).toHaveAttribute("inert", "");
  await expect(page.locator("#home")).toHaveAttribute("aria-hidden", "true");
  await page.mouse.move(800, 500);
  await page.mouse.wheel(0, 450);
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-scene",
    "systems",
  );
  await expect(page.locator("html")).toHaveAttribute("data-handover-opacity");
  const opacity = Number(
    await page.locator("html").getAttribute("data-handover-opacity"),
  );
  expect(opacity).toBeGreaterThan(0);
  expect(opacity).toBeLessThan(0.95);
  await expect(page.locator("#home")).toBeHidden();
  await page.locator('.orbit-node[href="#contact"]').click();
  await page.locator('.orbit-node[href="#lab"]').click();
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-travelling",
    "false",
  );
  await expect(page.locator(".scene-panel:visible")).toHaveCount(1);
  await expect(page.locator("#lab .scene-arrival")).toHaveCSS("opacity", "1");
  await expect(page).toHaveURL(/#lab$/);
});

test("pausing a flight and reduced motion reveal the destination immediately", async ({
  page,
}) => {
  await page.goto("/?graphics=off");
  await page.locator('.orbit-node[href="#contact"]').click();
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-travelling",
    "false",
  );
  await expect(page.locator("#contact .scene-arrival")).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(page.locator(".scene-panel:visible")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Resume motion", exact: true })
    .click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator('.orbit-node[href="#projects"]').click();
  await expect(page.locator(".portfolio")).toHaveAttribute(
    "data-travelling",
    "false",
  );
  await expect(page.locator("#projects .scene-arrival")).toHaveCSS(
    "opacity",
    "1",
  );
});
