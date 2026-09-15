import type { WorldRuntime } from "./runtime";

export const METEOR_FLIGHT = 0.85;
export const METEOR_DURATION = 3.2;
export type ImpactPhase = "idle" | "approach" | "impact" | "cooling" | "quiet";

export function requestMeteor(runtime: WorldRuntime, x = 0.32, y = 0.18) {
  if (
    runtime.scene !== 0 ||
    runtime.travel.progress < 1 ||
    runtime.impact.active
  )
    return false;
  const impact = runtime.impact;
  impact.serial++;
  impact.active = true;
  impact.quiet = runtime.paused || runtime.reducedMotion;
  impact.age = 0;
  impact.pointer.x = Math.max(-1, Math.min(1, x));
  impact.pointer.y = Math.max(-1, Math.min(1, y));
  return true;
}

export function impactPhase(runtime: WorldRuntime): ImpactPhase {
  const impact = runtime.impact;
  if (!impact.active) return "idle";
  if (impact.quiet) return "quiet";
  if (impact.age < METEOR_FLIGHT) return "approach";
  return impact.age < METEOR_FLIGHT + 0.42 ? "impact" : "cooling";
}

export function advanceMeteor(
  runtime: WorldRuntime,
  delta: number,
  visible: boolean,
) {
  const impact = runtime.impact;
  if (!impact.active) return;
  if (runtime.scene !== 0) {
    impact.active = false;
    return;
  }
  if (!visible) return;
  if (!impact.quiet && (runtime.paused || runtime.reducedMotion)) {
    impact.quiet = true;
    impact.age = 0;
  }
  impact.age += Math.min(0.05, Math.max(0, delta));
  if (impact.age >= (impact.quiet ? 1.05 : METEOR_DURATION))
    impact.active = false;
}
