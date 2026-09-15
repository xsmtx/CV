import type { WorldRuntime } from "@/experience/runtime";

export function advanceSkyTime(
  runtime: WorldRuntime,
  delta: number,
  visible: boolean,
) {
  if (!visible || runtime.paused || runtime.reducedMotion) return;
  // Discard idle-tab time instead of replaying or skipping celestial events.
  runtime.skyTime += Math.min(Math.max(delta, 0), 0.05);
}
