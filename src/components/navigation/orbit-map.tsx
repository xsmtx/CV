"use client";

import { scenes } from "@/data/profile";

const positions = [
  [116, 35],
  [188, 79],
  [188, 163],
  [116, 205],
  [44, 163],
  [44, 79],
];

export function OrbitMap({
  active,
  navigate,
}: {
  active: number;
  navigate: (index: number) => void;
}) {
  return (
    <nav className="orbit-navigation" aria-label="Explore the six spaces">
      <div className="orbit-caption">
        <span className="tiny-cross">+</span> EXPLORER{" "}
        <span>{String(active + 1).padStart(2, "0")} / 06</span>
      </div>
      <div className="orbit-map">
        <svg viewBox="0 0 232 240" aria-hidden="true">
          <circle className="orbit-boundary" cx="116" cy="120" r="85" />
          <circle className="orbit-inner" cx="116" cy="120" r="53" />
          <path className="orbit-axis" d="M116 19V221 M15 120H217" />
          <path
            className="orbit-path"
            d="M116 35L188 79L188 163L116 205L44 163L44 79Z"
          />
          <line
            className="orbit-vector"
            x1="116"
            y1="120"
            x2={positions[active][0]}
            y2={positions[active][1]}
          />
          <circle className="orbit-center" cx="116" cy="120" r="4" />
          <circle className="orbit-center-outline" cx="116" cy="120" r="11" />
        </svg>
        {scenes.map((scene, index) => (
          <a
            key={scene.id}
            href={`#${scene.id}`}
            className={`orbit-node node-${index} ${active === index ? "is-current" : ""}`}
            aria-current={active === index ? "location" : undefined}
            aria-label={scene.label}
            data-cursor="GO"
            onPointerEnter={() => {
              if (index > 0) void import("@/experience/worlds/other-worlds");
            }}
            onFocus={() => {
              if (index > 0) void import("@/experience/worlds/other-worlds");
            }}
            onClick={(event) => {
              event.preventDefault();
              navigate(index);
            }}
          >
            <span className="node-dot" />
            <span className="node-label">
              <span className="wide-label">{scene.label}</span>
              <span className="compact-label">
                {index === 2 ? "Career" : scene.label}
              </span>
            </span>
          </a>
        ))}
      </div>
      <p className="orbit-help">
        <span>↑ ↓</span> TO TRAVEL <span className="orbit-hint-divider">/</span>{" "}
        1—6 TO JUMP
      </p>
    </nav>
  );
}
