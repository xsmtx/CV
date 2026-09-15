"use client";

import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { worldOrigins, type Quality, type WorldRuntime } from "./runtime";
import { CameraRig } from "./camera/camera-rig";
import { Core } from "./objects/core";
import { DataField, DistantField } from "./effects/data-field";
import { SceneAnchor } from "./worlds/scene-anchor";
import { CosmicBackdrop } from "./effects/cosmic-backdrop";
import { THEME_COLORS, type Theme } from "@/lib/theme";

const OtherWorlds = lazy(() => import("./worlds/other-worlds"));
export const preloadWorlds = () => import("./worlds/other-worlds");

interface Props {
  theme: Theme;
  runtime: WorldRuntime;
  scene: number;
  worldsEnabled: boolean;
  revision: string;
  still: boolean;
  onReady: () => void;
  onFallback: () => void;
  onSystem: (index: number) => void;
  onTimeline: (index: number) => void;
  onProject: (index: number) => void;
}

class GraphicsBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function FrameMonitor({
  runtime,
  onTier,
}: {
  runtime: WorldRuntime;
  onTier: (quality: Quality) => void;
}) {
  const frame = useRef({ elapsed: 0, count: 0, slow: 0, fast: 0, warmup: 0 });
  useFrame(({ gl }, delta) => {
    const sample = frame.current;
    if (runtime.paused || runtime.reducedMotion || delta > 0.3) return;
    sample.elapsed += delta;
    sample.count++;
    sample.warmup += delta;
    if (sample.elapsed < 1) return;
    const fps = Math.round(sample.count / sample.elapsed);
    runtime.stats.fps = fps;
    runtime.stats.calls = gl.info.render.calls;
    runtime.stats.geometries = gl.info.memory.geometries;
    gl.domElement.dataset.fps = String(fps);
    gl.domElement.dataset.drawCalls = String(gl.info.render.calls);
    gl.domElement.dataset.geometries = String(gl.info.memory.geometries);
    gl.domElement.dataset.textures = String(gl.info.memory.textures);
    sample.elapsed = 0;
    sample.count = 0;
    if (sample.warmup < 4) return;
    sample.slow = fps < 42 ? sample.slow + 1 : 0;
    sample.fast = fps > 57 ? sample.fast + 1 : 0;
    const tiers: Quality[] = ["LOW", "MEDIUM", "HIGH", "ULTRA"];
    const index = tiers.indexOf(runtime.stats.quality);
    if (sample.slow >= 3 && index > 0) {
      onTier(tiers[index - 1]);
      sample.slow = 0;
      sample.fast = 0;
    }
    if (sample.fast >= 18 && index < 2 && window.innerWidth > 900) {
      onTier(tiers[index + 1]);
      sample.fast = 0;
    }
  });
  return null;
}

function Invalidate({ revision, still }: { revision: string; still: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [revision, still, invalidate]);
  return null;
}

function ContextLifecycle({ onFallback }: { onFallback: () => void }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const lost = () => {
      if (gl.domElement.isConnected) onFallback();
    };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onFallback]);
  return null;
}

function Scene({
  theme,
  runtime,
  worldsEnabled,
  revision,
  still,
  onSystem,
  onTimeline,
  onProject,
  mobile,
  quality,
  setQuality,
}: Props & {
  mobile: boolean;
  quality: Quality;
  setQuality: (quality: Quality) => void;
}) {
  return (
    <>
      <color attach="background" args={[THEME_COLORS[theme]]} />
      <fog attach="fog" args={[THEME_COLORS[theme], 18, 58]} />
      <ambientLight intensity={theme === "light" ? 0.85 : 0.32} />
      <directionalLight
        position={[-8, 8, 10]}
        intensity={2.8}
        color="#c1d3df"
      />
      <directionalLight
        position={[5, -2, -4]}
        intensity={0.55}
        color="#cbab86"
      />
      <directionalLight position={[8, 6, -2]} intensity={4.2} color="#c7e2f5" />
      <CameraRig runtime={runtime} mobile={mobile} />
      <SceneAnchor index={0} runtime={runtime}>
        <group position={[1.4, 0.15, 0]}>
          <Core runtime={runtime} />
        </group>
      </SceneAnchor>
      <DistantField />
      <CosmicBackdrop
        theme={theme}
        runtime={runtime}
        low={quality === "LOW" || quality === "MEDIUM"}
      />
      <DataField
        theme={theme}
        runtime={runtime}
        low={quality === "LOW" || quality === "MEDIUM"}
      />
      {worldsEnabled && (
        <Suspense fallback={null}>
          <OtherWorlds
            runtime={runtime}
            onSystem={onSystem}
            onTimeline={onTimeline}
            onProject={onProject}
          />
        </Suspense>
      )}
      <FrameMonitor runtime={runtime} onTier={setQuality} />
      <Invalidate revision={revision} still={still} />
    </>
  );
}

export default function SceneCanvas(props: Props) {
  const [quality, setQualityState] = useState<Quality>(() =>
    window.innerWidth < 600
      ? "LOW"
      : window.innerWidth < 1100
        ? "MEDIUM"
        : navigator.hardwareConcurrency >= 12
          ? "ULTRA"
          : "HIGH",
  );
  const [mobile, setMobile] = useState(() => window.innerWidth < 900);
  const [visible, setVisible] = useState(true);
  const initialCamera = useMemo(() => {
    const origin = worldOrigins[props.runtime.scene];
    return {
      position: [origin[0], origin[1] + 0.25, origin[2] + 10.8] as [
        number,
        number,
        number,
      ],
      fov: 40,
      near: 0.1,
      far: 190,
    };
    // A tier change creates a fresh context at the current location. Between
    // tier changes, CameraRig alone owns the camera (including scene flights).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality, props.runtime]);
  const tier = (value: Quality) => {
    props.runtime.stats.quality = value;
    setQualityState(value);
  };
  useEffect(() => {
    const resize = () => {
      setMobile(window.innerWidth < 900);
      if (window.innerWidth < 760) {
        props.runtime.stats.quality = "LOW";
        setQualityState("LOW");
      } else if (window.innerWidth < 1100) {
        props.runtime.stats.quality = "MEDIUM";
        setQualityState("MEDIUM");
      }
    };
    const visibility = () => setVisible(!document.hidden);
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [props.runtime]);
  const dpr =
    quality === "ULTRA"
      ? 1.7
      : quality === "HIGH"
        ? 1.4
        : quality === "MEDIUM"
          ? 1.1
          : 1;
  return (
    <GraphicsBoundary onError={props.onFallback}>
      <Canvas
        // A fresh context on tier changes avoids disappearing geometry after
        // drawing-buffer resize in WebKit; the old resources are disposed.
        key={quality}
        camera={initialCamera}
        dpr={dpr}
        frameloop={props.still || !visible ? "demand" : "always"}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        onCreated={({ gl }) => {
          props.runtime.stats.mode = "WEBGL";
          props.runtime.stats.quality = quality;
          gl.domElement.setAttribute("aria-hidden", "true");
          props.onReady();
        }}
        fallback={null}
      >
        <Scene {...props} mobile={mobile} quality={quality} setQuality={tier} />
        <ContextLifecycle onFallback={props.onFallback} />
      </Canvas>
    </GraphicsBoundary>
  );
}
