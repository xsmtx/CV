import { PauseIcon } from "@/components/ui/icons";

export interface LabState {
  rate: number;
  topology: "orbit" | "mesh";
  running: boolean;
}

export function Lab({
  state,
  update,
  reducedMotion,
  openTerminal,
}: {
  state: LabState;
  update: (state: LabState) => void;
  reducedMotion: boolean;
  openTerminal: () => void;
}) {
  return (
    <div className="scene-composition lab-composition">
      <div className="scene-title">
        <p className="scene-kicker">05 / ROOM FOR THE UNEXPECTED</p>
        <h2 id="heading-lab" tabIndex={-1}>
          THE LAB<span className="heading-dot">.</span>
        </h2>
        <p className="scene-intro">A space to ask: what if?</p>
      </div>
      <div className="lab-description">
        <span className="detail-eyebrow">INTERACTIVE EXPERIMENT / 001</span>
        <h3>Signal / structure</h3>
        <p>
          A small network with a visible pulse. Change its connections. Adjust
          its rhythm. Watch the same nodes become a different system.
        </p>
        <p className="lab-note">
          An infrastructure visualization built for this space.
        </p>
        <div className="lab-terminal-entry">
          <p>Prefer the command line? Explore my skills, projects and CV.</p>
          <button
            onClick={(event) => {
              event.currentTarget.focus({ preventScroll: true });
              openTerminal();
            }}
          >
            <span aria-hidden="true">&gt;_</span> Open terminal{" "}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
      <div className="lab-controls" data-scroll-panel>
        <fieldset>
          <legend>CONNECTION MODEL</legend>
          <div className="segmented-control">
            <button
              aria-pressed={state.topology === "orbit"}
              onClick={() => update({ ...state, topology: "orbit" })}
            >
              Orbital
            </button>
            <button
              aria-pressed={state.topology === "mesh"}
              onClick={() => update({ ...state, topology: "mesh" })}
            >
              Mesh
            </button>
          </div>
        </fieldset>
        <label className="range-label" htmlFor="signal-rate">
          <span>SIGNAL RATE</span>
          <output htmlFor="signal-rate">{state.rate.toFixed(1)}×</output>
        </label>
        <input
          id="signal-rate"
          type="range"
          min="0.2"
          max="2"
          step="0.1"
          value={state.rate}
          onChange={(event) =>
            update({ ...state, rate: Number(event.target.value) })
          }
        />
        <div className="lab-controls-bottom">
          <span>
            <i className={`status-dot ${state.running ? "" : "paused"}`} />
            {reducedMotion
              ? "STILL PREVIEW"
              : state.running
                ? "SIGNAL ACTIVE"
                : "SIGNAL PAUSED"}
          </span>
          <button
            onClick={() => update({ ...state, running: !state.running })}
            aria-label={state.running ? "Pause signal" : "Resume signal"}
          >
            <PauseIcon paused={!state.running} />
          </button>
        </div>
      </div>
      <div className="scene-object-caption" aria-hidden="true">
        12 NODES <span>/</span> {state.topology === "mesh" ? "24" : "12"}{" "}
        CONNECTIONS <span>/</span> {state.topology.toUpperCase()}
      </div>
    </div>
  );
}
