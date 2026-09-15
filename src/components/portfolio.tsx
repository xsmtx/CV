"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { profile, scenes } from "@/data/profile";
import {
  beginSceneTravel,
  createRuntime,
  SCENE_TRAVEL_MS,
} from "@/experience/runtime";
import { usePageVisible, useReducedMotion } from "@/hooks/use-preferences";
import { useTheme } from "@/hooks/use-theme";
import { useMeteorImpact } from "@/hooks/use-meteor-impact";
import { ThemeToggle } from "./ui/theme-toggle";
import { OrbitMap } from "./navigation/orbit-map";
import { Telemetry } from "./hud/telemetry";
import { Cursor } from "./ui/cursor";
import { PauseIcon } from "./ui/icons";
import { FallbackWorld } from "./ui/fallback-world";
import { Home } from "./scenes/home";
import { Systems } from "./scenes/systems";
import { ExperienceScene } from "./scenes/experience";
import { Projects } from "./scenes/projects";
import { Lab, type LabState } from "./scenes/lab";
import { Contact } from "./scenes/contact";

const SceneCanvas = dynamic(() => import("@/experience/scene-canvas"), {
  ssr: false,
  loading: () => null,
});
const Terminal = dynamic(() => import("./terminal/terminal"), { ssr: false });

export function Portfolio() {
  const runtime = useMemo(() => createRuntime(), []);
  const [scene, setScene] = useState(0);
  const [departure, setDeparture] = useState<number | null>(null);
  const [travelling, setTravelling] = useState(false);
  const [animatedEntry, setAnimatedEntry] = useState(false);
  const [worldsEnabled, setWorldsEnabled] = useState(false);
  const [system, setSystem] = useState(0);
  const [timeline, setTimeline] = useState(4);
  const [project, setProject] = useState(0);
  const [projectOpen, setProjectOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [graphics, setGraphics] = useState<
    "checking" | "loading" | "webgl" | "fallback"
  >("checking");
  const [ready, setReady] = useState(false);
  const [lab, setLab] = useState<LabState>({
    rate: 0.6,
    topology: "orbit",
    running: true,
  });
  const [helpOpen, setHelpOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalLoaded, setTerminalLoaded] = useState(false);
  const showTerminal = useCallback(() => {
    setHelpOpen(false);
    setTerminalLoaded(true);
    setTerminalOpen(true);
  }, []);
  const reducedMotion = useReducedMotion();
  const pageVisible = usePageVisible();
  const theme = useTheme();
  const impact = useMeteorImpact(runtime);
  const sendMeteor = impact.request;
  const root = useRef<HTMLDivElement>(null);
  const transitionEnd = useRef(0);
  const transitionTimers = useRef({ departure: 0, arrival: 0 });
  const drag = useRef<{
    x: number;
    y: number;
    lastX: number;
    distance: number;
    active: boolean;
  }>({ x: 0, y: 0, lastX: 0, distance: 0, active: false });

  const selectSystem = useCallback(
    (index: number) => {
      runtime.system = index;
      setSystem(index);
    },
    [runtime],
  );
  const selectTimeline = useCallback(
    (index: number) => {
      const value = Math.max(0, Math.min(4, index));
      runtime.timeline = value;
      setTimeline(value);
    },
    [runtime],
  );
  const selectProject = useCallback(
    (index: number) => {
      runtime.project = index;
      runtime.detail = false;
      setProject(index);
      setProjectOpen(false);
    },
    [runtime],
  );
  const openProject = useCallback(
    (open: boolean) => {
      runtime.detail = open;
      setProjectOpen(open);
    },
    [runtime],
  );
  const finishTransition = useCallback(() => {
    window.clearTimeout(transitionTimers.current.departure);
    window.clearTimeout(transitionTimers.current.arrival);
    setDeparture(null);
    setTravelling(false);
    transitionEnd.current = 0;
  }, []);
  useEffect(() => {
    const timers = transitionTimers.current;
    return () => {
      window.clearTimeout(timers.departure);
      window.clearTimeout(timers.arrival);
    };
  }, []);
  const navigate = useCallback(
    (index: number, history = true, animate = true) => {
      const next = Math.max(0, Math.min(5, index));
      if (next === runtime.scene) return;
      const now = performance.now();
      const moving = animate && !runtime.reducedMotion && !runtime.paused;
      const outgoing = root.current?.querySelector<HTMLElement>(
        `#${scenes[runtime.scene].id} .scene-arrival`,
      );
      const appearance = outgoing ? getComputedStyle(outgoing) : null;
      root.current?.style.setProperty(
        "--departure-opacity",
        appearance?.opacity ?? "1",
      );
      root.current?.style.setProperty(
        "--departure-transform",
        appearance?.transform ?? "none",
      );
      window.clearTimeout(transitionTimers.current.departure);
      window.clearTimeout(transitionTimers.current.arrival);
      setDeparture(
        moving && Number(appearance?.opacity ?? 1) > 0.01
          ? runtime.scene
          : null,
      );
      setTravelling(moving);
      setAnimatedEntry(moving);
      root.current?.style.setProperty(
        "--travel-direction",
        next > runtime.scene ? "1" : "-1",
      );
      beginSceneTravel(runtime, next, now, moving);
      runtime.detail = false;
      setScene(next);
      setProjectOpen(false);
      setHelpOpen(false);
      if (next > 0) setWorldsEnabled(true);
      transitionEnd.current = moving ? now + SCENE_TRAVEL_MS : 0;
      if (moving) {
        transitionTimers.current.departure = window.setTimeout(
          () => setDeparture(null),
          360,
        );
        transitionTimers.current.arrival = window.setTimeout(
          finishTransition,
          SCENE_TRAVEL_MS,
        );
      }
      if (history) window.history.pushState(null, "", `#${scenes[next].id}`);
      root.current?.querySelectorAll("[data-scroll-panel]").forEach((panel) => {
        panel.scrollTop = 0;
      });
    },
    [runtime, finishTransition],
  );
  const fallback = useCallback(() => {
    runtime.stats.mode = "SPATIAL";
    setGraphics("fallback");
    setReady(true);
  }, [runtime]);
  const rendererReady = useCallback(() => {
    setGraphics("webgl");
    setReady(true);
  }, []);

  useEffect(() => {
    runtime.reducedMotion = reducedMotion;
    runtime.paused = paused;
    if (reducedMotion || paused) queueMicrotask(finishTransition);
  }, [runtime, reducedMotion, paused, finishTransition]);

  useEffect(() => {
    const syncHash = (animate = true) => {
      const id = window.location.hash.slice(1);
      const index = scenes.findIndex((item) => item.id === id);
      navigate(index < 0 ? 0 : index, false, animate);
    };
    syncHash(false);
    const popstate = () => syncHash();
    window.addEventListener("popstate", popstate);
    try {
      if (sessionStorage.getItem("spatial-visited"))
        queueMicrotask(() => setReady(true));
      sessionStorage.setItem("spatial-visited", "1");
    } catch {
      /* The experience also works with browser storage disabled. */
    }
    const requestedFallback =
      new URLSearchParams(location.search).get("graphics") === "off";
    if (requestedFallback) queueMicrotask(fallback);
    else {
      const test = document.createElement("canvas");
      const context = test.getContext("webgl2");
      if (!context) queueMicrotask(fallback);
      else {
        context.getExtension("WEBGL_lose_context")?.loseContext();
        queueMicrotask(() => setGraphics("loading"));
      }
    }
    // A short upper bound keeps the entry usable even on a slow GPU or chunk request.
    const bootDeadline = window.setTimeout(() => setReady(true), 850);
    return () => {
      window.removeEventListener("popstate", popstate);
      window.clearTimeout(bootDeadline);
    };
  }, [navigate, fallback]);

  useEffect(() => {
    let accumulated = 0;
    let lastWheel = 0;
    const wheel = (event: WheelEvent) => {
      if (terminalOpen) return;
      if (event.ctrlKey || event.metaKey) return;
      let panel = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-scroll-panel]",
      );
      while (panel) {
        if (panel.scrollHeight > panel.clientHeight + 2) {
          const down = event.deltaY > 0;
          if (
            (down &&
              panel.scrollTop + panel.clientHeight < panel.scrollHeight - 2) ||
            (!down && panel.scrollTop > 2)
          )
            return;
        }
        panel =
          panel.parentElement?.closest<HTMLElement>("[data-scroll-panel]") ??
          null;
      }
      event.preventDefault();
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
      const now = performance.now();
      if (now < transitionEnd.current) return;
      if (now - lastWheel > 220) accumulated = 0;
      lastWheel = now;
      accumulated += event.deltaY * (event.deltaMode === 1 ? 16 : 1);
      if (Math.abs(accumulated) < 90) return;
      const direction = accumulated > 0 ? 1 : -1;
      accumulated = 0;
      if (
        runtime.scene === 2 &&
        ((direction > 0 && runtime.timeline < 4) ||
          (direction < 0 && runtime.timeline > 0))
      ) {
        selectTimeline(runtime.timeline + direction);
        transitionEnd.current = now + 550;
      } else navigate(runtime.scene + direction);
    };
    const keydown = (event: KeyboardEvent) => {
      if (terminalOpen) return;
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        (event.target as HTMLElement).matches(
          "input,textarea,select,[contenteditable=true]",
        )
      )
        return;
      if (event.key.toLowerCase() === "t" && !event.repeat) {
        event.preventDefault();
        showTerminal();
        return;
      }
      if (
        (event.target as HTMLElement).matches("[data-scroll-panel]") &&
        [
          "ArrowUp",
          "ArrowDown",
          "PageUp",
          "PageDown",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      )
        return;
      if (event.key.toLowerCase() === "g") {
        runtime.wireframe = true;
        return;
      }
      if (event.key.toLowerCase() === "m" && !event.repeat) {
        sendMeteor();
        return;
      }
      if (event.key === "Escape") {
        openProject(false);
        setHelpOpen(false);
        return;
      }
      if (event.key === "?" || event.key === "h") {
        setHelpOpen((value) => !value);
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const direction = event.key === "ArrowRight" ? 1 : -1;
        if (runtime.scene === 2) {
          event.preventDefault();
          selectTimeline(runtime.timeline + direction);
          return;
        }
        if (runtime.scene === 3) {
          event.preventDefault();
          selectProject((runtime.project + direction + 4) % 4);
          return;
        }
      }
      let next: number | undefined;
      if (event.key === "ArrowDown" || event.key === "PageDown")
        next = runtime.scene + 1;
      if (event.key === "ArrowUp" || event.key === "PageUp")
        next = runtime.scene - 1;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = 5;
      if (/^[1-6]$/.test(event.key)) next = Number(event.key) - 1;
      if (next !== undefined) {
        event.preventDefault();
        if (event.repeat && performance.now() < transitionEnd.current) return;
        navigate(next);
        requestAnimationFrame(() =>
          document
            .getElementById(`heading-${scenes[runtime.scene].id}`)
            ?.focus({ preventScroll: true }),
        );
      }
    };
    const keyup = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "g") runtime.wireframe = false;
    };
    const blur = () => {
      runtime.wireframe = false;
    };
    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
    };
  }, [
    runtime,
    navigate,
    selectTimeline,
    selectProject,
    openProject,
    sendMeteor,
    terminalOpen,
    showTerminal,
  ]);

  const updateLab = (value: LabState) => {
    runtime.lab = value;
    setLab(value);
  };
  const still = paused || reducedMotion;
  const revision = `${scene}-${system}-${timeline}-${project}-${projectOpen}-${lab.rate}-${lab.topology}-${lab.running}-${still}-${theme}-${impact.serial}-${impact.phase}`;

  return (
    <div
      ref={root}
      className={`portfolio scene-${scenes[scene].id} ${ready ? "is-ready" : "is-booting"} ${still ? "motion-still" : ""}`}
      data-scene={scenes[scene].id}
      data-graphics={graphics}
      data-travelling={travelling && !still}
      style={{ "--scene-duration": `${SCENE_TRAVEL_MS}ms` } as CSSProperties}
    >
      <a
        className="skip-link"
        href="#scene-content"
        onClick={() =>
          requestAnimationFrame(() =>
            document.getElementById(`heading-${scenes[scene].id}`)?.focus(),
          )
        }
      >
        Skip to content
      </a>
      <div
        className="world-layer"
        data-cursor={scene === 0 ? "CLICK / DRAG" : "DRAG"}
        data-impact-phase={impact.phase}
        data-impact-count={impact.serial}
        onPointerMove={(event) => {
          runtime.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
          runtime.pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
          if (drag.current.active) {
            drag.current.distance = Math.max(
              drag.current.distance,
              Math.hypot(
                event.clientX - drag.current.x,
                event.clientY - drag.current.y,
              ),
            );
            runtime.drag += (event.clientX - drag.current.lastX) * 0.012;
            drag.current.lastX = event.clientX;
          }
        }}
        onPointerDown={(event) => {
          if (event.button !== 0 || !event.isPrimary) return;
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            lastX: event.clientX,
            distance: 0,
            active: true,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerUp={(event) => {
          if (!drag.current.active || event.button !== 0) return;
          const dx = event.clientX - drag.current.x;
          const dy = event.clientY - drag.current.y;
          if (
            event.pointerType === "touch" &&
            Math.abs(dy) > 65 &&
            Math.abs(dy) > Math.abs(dx)
          )
            navigate(scene + (dy < 0 ? 1 : -1));
          else if (Math.max(drag.current.distance, Math.hypot(dx, dy)) <= 6) {
            const bounds = event.currentTarget.getBoundingClientRect();
            impact.request(
              ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
              1 - ((event.clientY - bounds.top) / bounds.height) * 2,
            );
          }
          drag.current.active = false;
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          drag.current.active = false;
        }}
      >
        {[scene, ...(departure !== null && !still ? [departure] : [])].map(
          (index) => (
            <FallbackWorld
              key={index}
              scene={index}
              system={system}
              project={project}
              lab={lab}
              still={still || !pageVisible}
              impactSerial={impact.serial}
              impactPhase={impact.phase}
              motion={
                index === departure
                  ? "departing"
                  : animatedEntry
                    ? "arriving"
                    : undefined
              }
            />
          ),
        )}
        {(graphics === "loading" || graphics === "webgl") && (
          <div
            className={`canvas-layer ${graphics === "webgl" ? "is-loaded" : ""}`}
          >
            <SceneCanvas
              theme={theme}
              runtime={runtime}
              scene={scene}
              worldsEnabled={worldsEnabled}
              revision={revision}
              still={still}
              onReady={rendererReady}
              onFallback={fallback}
              onSystem={selectSystem}
              onTimeline={selectTimeline}
              onProject={selectProject}
            />
          </div>
        )}
      </div>
      <div className="space-grain" aria-hidden="true" />
      <div className="space-vignette" aria-hidden="true" />
      <header className="global-header">
        <a
          className="brand"
          href="#home"
          title="Return to origin"
          onClick={(event) => {
            event.preventDefault();
            navigate(0);
          }}
          data-cursor="GO"
        >
          <span className="brand-mark">
            S.K<span>®</span>
          </span>
          <span className="brand-label">
            SAMET KABAKCI
            <br />
            <span>SYSTEM ENGINEER</span>
          </span>
        </a>
        <div className="header-actions">
          <div className="header-right">
            <a href={`mailto:${profile.email}`} className="contact-shortcut">
              <span className="status-dot" />
              LET’S CONNECT<span>↗</span>
            </a>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <Telemetry runtime={runtime} />
      <div className="scene-coordinate" aria-hidden="true">
        <span>SPACE</span>
        <strong>{String(scene + 1).padStart(2, "0")}</strong>
        <span>/ 06</span>
        <i />
      </div>
      <main id="scene-content" className="scene-content">
        {scenes.map((item, index) => (
          <section
            key={item.id}
            id={item.id}
            className={`scene-panel ${departure === index && !still ? "is-departing" : scene === index && animatedEntry ? "is-arriving" : ""}`}
            hidden={scene !== index && (departure !== index || still)}
            aria-hidden={scene !== index}
            inert={scene !== index}
            aria-label={`${item.label}: ${item.subtitle}`}
          >
            <div className="scene-arrival" data-scroll-panel tabIndex={0}>
              {index === 0 && <Home enter={() => navigate(1)} />}
              {index === 1 && (
                <Systems selected={system} select={selectSystem} />
              )}
              {index === 2 && (
                <ExperienceScene selected={timeline} select={selectTimeline} />
              )}
              {index === 3 && (
                <Projects
                  selected={project}
                  select={selectProject}
                  open={projectOpen}
                  setOpen={openProject}
                />
              )}
              {index === 4 && (
                <Lab
                  state={lab}
                  update={updateLab}
                  reducedMotion={still}
                  openTerminal={showTerminal}
                />
              )}
              {index === 5 && <Contact />}
            </div>
          </section>
        ))}
      </main>
      <OrbitMap active={scene} navigate={navigate} />
      <div className="mobile-travel">
        <button
          onClick={() => navigate(scene - 1)}
          disabled={scene === 0}
          aria-label="Previous space"
        >
          ↑
        </button>
        <span>
          {scenes[scene].label}
          <small>{String(scene + 1).padStart(2, "0")} / 06</small>
        </span>
        <button
          onClick={() => navigate(scene + 1)}
          disabled={scene === 5}
          aria-label="Next space"
        >
          ↓
        </button>
      </div>
      <footer className="global-footer">
        <div className="footer-location">
          <span className="location-cross">⊕</span> IZMIR, TURKEY
          <span className="location-subtitle">38.4237° N / 27.1428° E</span>
        </div>
        <div className="footer-controls">
          <button
            className="terminal-trigger"
            onClick={(event) => {
              event.currentTarget.focus({ preventScroll: true });
              showTerminal();
            }}
            aria-label="Open terminal"
            aria-haspopup="dialog"
            aria-expanded={terminalOpen}
          >
            <span className="terminal-trigger-icon" aria-hidden="true">
              &gt;_
            </span>
            <span className="terminal-trigger-label">TERMINAL</span>
          </button>
          <a href="/profile/" data-cursor="OPEN">
            TEXT VIEW
          </a>
          <span className="control-divider" />
          <button
            onClick={() => setHelpOpen(!helpOpen)}
            aria-expanded={helpOpen}
            aria-controls="controls-help"
            aria-label="Navigation help"
          >
            ?
          </button>
          <button
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? "Resume motion" : "Pause motion"}
            aria-pressed={paused}
          >
            <PauseIcon paused={paused} />
          </button>
        </div>
      </footer>
      {helpOpen && (
        <aside
          className="controls-help"
          id="controls-help"
          aria-label="Navigation help"
        >
          <button
            className="help-close"
            onClick={() => setHelpOpen(false)}
            aria-label="Close help"
          >
            ×
          </button>
          <h2>YOUR WAY THROUGH</h2>
          <dl>
            <dt>Scroll / ↑ ↓</dt>
            <dd>Travel between spaces</dd>
            <dt>1–6</dt>
            <dd>Jump to a space</dd>
            <dt>← →</dt>
            <dd>Explore years or projects</dd>
            <dt>Drag the world</dt>
            <dd>Change your perspective</dd>
            <dt>Click the world / M</dt>
            <dd>Send a meteor to Earth on Home</dd>
            <dt>T / Terminal</dt>
            <dd>Explore the engineer’s command line</dd>
            <dt>Hold G</dt>
            <dd>Reveal the core’s structure</dd>
            <dt>Escape</dt>
            <dd>Close project details</dd>
          </dl>
          <p>Use Text view for a full, readable profile.</p>
        </aside>
      )}
      <div className="journey-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${(scene + 1) / 6})` }} />
      </div>
      <div className="boot-message" aria-hidden="true">
        <span className="status-dot" />
        INITIALIZING SPACE
        <span className="boot-line" />
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {scenes[scene].label}. Space {scene + 1} of 6.
      </p>
      <noscript>
        <div className="no-script">
          Explore Samet’s experience, projects and contact details in the{" "}
          <a href="/profile/">complete text profile</a>.
        </div>
      </noscript>
      {terminalLoaded && (
        <Terminal
          open={terminalOpen}
          onClose={() => setTerminalOpen(false)}
          navigate={(id) =>
            navigate(scenes.findIndex((item) => item.id === id))
          }
          runtime={runtime}
        />
      )}
      <Cursor disabled={still || terminalOpen} />
    </div>
  );
}
