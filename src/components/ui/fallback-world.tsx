import type { LabState } from "@/components/scenes/lab";
import { FallbackSkyEvents } from "./fallback-sky-events";

export function FallbackWorld({
  scene,
  system,
  project,
  lab,
  still,
  motion,
}: {
  scene: number;
  system: number;
  project: number;
  lab: LabState;
  still: boolean;
  motion?: "arriving" | "departing";
}) {
  const isLab = scene === 4;
  return (
    <div
      className={`fallback-world fallback-scene-${scene} ${motion ? `is-${motion}` : ""} ${still || (isLab && !lab.running) ? "is-still" : ""}`}
      aria-hidden="true"
      style={
        { "--signal-duration": `${12 / lab.rate}s` } as React.CSSProperties
      }
    >
      <div className="fallback-distant-field" />
      <div className="fallback-gargantua" />
      <FallbackSkyEvents />
      <div className="fallback-object">
        <div className="fallback-ring ring-one" />
        <div className="fallback-ring ring-two" />
        <div className="fallback-ring ring-three" />
        {scene === 1 ? (
          <svg className="fallback-topology" viewBox="0 0 500 500">
            {Array.from({ length: 7 }, (_, i) => {
              const a = (i / 7) * Math.PI * 2;
              const x = 250 + Math.cos(a) * 175;
              const y = 250 + Math.sin(a) * 155;
              return (
                <g key={i} opacity={system === i ? 1 : 0.35}>
                  <path
                    d={`M250 250L${x} ${y}`}
                    stroke={system === i ? "#dca875" : "#6f899b"}
                  />
                  <path
                    d={`M${x - 18} ${y + 15}v-55l20-12 20 12v55l-20 12Z M${x - 18} ${y - 40}l20 12 20-12 M${x + 2} ${y - 28}v55`}
                    fill="#1d2c36"
                    stroke="#8799a4"
                  />
                  <circle cx={x + 2} cy={y} r="3" fill="#dfb27e" />
                </g>
              );
            })}
            <circle cx="250" cy="250" r="34" fill="#1c2d37" stroke="#d0a574" />
          </svg>
        ) : isLab ? (
          <div className={`fallback-reactor ${lab.topology}`}>
            <div />
            <div />
            <div />
            <span className="reactor-signal" />
          </div>
        ) : scene === 3 && project !== 0 ? (
          <div className={`fallback-artifact artifact-${project}`}>
            <span />
            <span />
            <span />
          </div>
        ) : (
          <div className="fallback-planet">
            <div className="planet-etched" />
          </div>
        )}
        <span className="fallback-satellite satellite-one" />
        <span className="fallback-satellite satellite-two" />
      </div>
    </div>
  );
}
