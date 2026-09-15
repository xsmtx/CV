"use client";

import { useEffect, useRef } from "react";

export function Cursor({ disabled }: { disabled: boolean }) {
  const cursor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (disabled || !matchMedia("(pointer: fine)").matches) return;
    const element = cursor.current;
    if (!element) return;
    document.documentElement.classList.add("precision-cursor");
    const move = (event: PointerEvent) => {
      element.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0)`;
      element.style.opacity = "1";
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-cursor],button,a,input",
      );
      element.dataset.active = target ? "true" : "false";
      const label = target?.dataset.cursor || (target ? "OPEN" : "");
      if (element.lastElementChild?.textContent !== label)
        element.lastElementChild!.textContent = label;
    };
    const hide = () => {
      element.style.opacity = "0";
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    return () => {
      document.documentElement.classList.remove("precision-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
    };
  }, [disabled]);
  return (
    <div
      ref={cursor}
      className="precision-reticle"
      aria-hidden="true"
      hidden={disabled}
    >
      <span className="reticle-ring" />
      <span className="reticle-label" />
    </div>
  );
}
