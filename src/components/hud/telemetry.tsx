"use client";

import { useEffect, useRef } from "react";
import type { WorldRuntime } from "@/experience/runtime";

export function Telemetry({ runtime }: { runtime: WorldRuntime }) {
  const time = useRef<HTMLSpanElement>(null);
  const fps = useRef<HTMLSpanElement>(null);
  const quality = useRef<HTMLSpanElement>(null);
  const mode = useRef<HTMLSpanElement>(null);
  const coords = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Istanbul",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const update = () => {
      if (time.current) time.current.textContent = format.format(new Date());
      if (fps.current)
        fps.current.textContent =
          runtime.stats.mode === "WEBGL" &&
          !runtime.paused &&
          !runtime.reducedMotion
            ? `${runtime.stats.fps} FPS`
            : "STILL";
      if (quality.current)
        quality.current.textContent =
          runtime.stats.mode === "WEBGL" ? runtime.stats.quality : "2.5D";
      if (mode.current)
        mode.current.textContent =
          runtime.stats.mode === "WEBGL" ? "WEBGL ACTIVE" : "SPATIAL VIEW";
      if (coords.current)
        coords.current.textContent = `X ${runtime.stats.x.toFixed(1)}  Y ${runtime.stats.y.toFixed(1)}  Z ${runtime.stats.z.toFixed(1)}`;
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [runtime]);

  return (
    <>
      <div className="local-time">
        <span>LOCAL TIME / TR</span>
        <span ref={time} suppressHydrationWarning>
          UTC +03:00
        </span>
      </div>
      <div className="coordinates" aria-hidden="true">
        <span ref={coords}>X 0.0 Y 0.0 Z 10.0</span>
      </div>
      <div className="renderer-telemetry" aria-hidden="true">
        <span className="status-dot" />
        <span ref={mode}>SPATIAL VIEW</span>
        <span className="telemetry-divider">/</span>
        <span ref={quality}>AUTO</span>
        <span ref={fps}>STILL</span>
      </div>
    </>
  );
}
