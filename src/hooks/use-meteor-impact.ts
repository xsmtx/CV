"use client";

import { useCallback, useEffect, useState } from "react";
import type { WorldRuntime } from "@/experience/runtime";
import {
  advanceMeteor,
  impactPhase,
  requestMeteor,
  type ImpactPhase,
} from "@/experience/meteor";

export function useMeteorImpact(runtime: WorldRuntime) {
  const [serial, setSerial] = useState(0);
  const [phase, setPhase] = useState<ImpactPhase>("idle");
  const request = useCallback(
    (x?: number, y?: number) => {
      if (!requestMeteor(runtime, x, y)) return;
      setSerial(runtime.impact.serial);
      setPhase(impactPhase(runtime));
    },
    [runtime],
  );
  useEffect(() => {
    if (!serial || !runtime.impact.active) return;
    let last = performance.now();
    let previous = impactPhase(runtime);
    let frame = 0;
    const tick = (now: number) => {
      advanceMeteor(runtime, (now - last) / 1000, !document.hidden);
      last = now;
      const next = impactPhase(runtime);
      if (next !== previous) {
        previous = next;
        setPhase(next);
      }
      if (runtime.impact.active) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [runtime, serial]);
  return { request, serial, phase };
}
