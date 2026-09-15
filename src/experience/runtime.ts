export type Quality = "ULTRA" | "HIGH" | "MEDIUM" | "LOW";
export type RendererMode = "INITIALIZING" | "WEBGL" | "SPATIAL";
export const SCENE_TRAVEL_MS = 2000;

export interface WorldRuntime {
  skyTime: number;
  scene: number;
  travel: {
    from: [number, number, number];
    origin: [number, number, number];
    fromScene: number;
    scene: number;
    startedAt: number;
    duration: number;
    progress: number;
  };
  system: number;
  timeline: number;
  project: number;
  detail: boolean;
  reducedMotion: boolean;
  paused: boolean;
  wireframe: boolean;
  pointer: { x: number; y: number };
  drag: number;
  lab: { rate: number; topology: "orbit" | "mesh"; running: boolean };
  stats: {
    fps: number;
    calls: number;
    geometries: number;
    x: number;
    y: number;
    z: number;
    quality: Quality;
    mode: RendererMode;
  };
}

export function createRuntime(): WorldRuntime {
  return {
    skyTime: 0,
    scene: 0,
    travel: {
      from: [0, 0, 0],
      origin: [0, 0, 0],
      fromScene: 0,
      scene: 0,
      startedAt: 0,
      duration: 0,
      progress: 1,
    },
    system: 0,
    timeline: 4,
    project: 0,
    detail: false,
    reducedMotion: false,
    paused: false,
    wireframe: false,
    pointer: { x: 0, y: 0 },
    drag: 0,
    lab: { rate: 0.6, topology: "orbit", running: true },
    stats: {
      fps: 0,
      calls: 0,
      geometries: 0,
      x: 0,
      y: 0,
      z: 10,
      quality: "HIGH",
      mode: "INITIALIZING",
    },
  };
}

export const worldOrigins: [number, number, number][] = [
  [0, 0, 0],
  [19, 2, -14],
  [35, -2, -32],
  [17, 6, -52],
  [-7, 1, -67],
  [-26, -3, -85],
];

export function seededRandom(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// A shared wall-clock flight keeps the camera, particles and sky in step,
// including at lower frame rates. Quintic easing softens both ends.
export function sampleSceneTravel(runtime: WorldRuntime, now: number) {
  const travel = runtime.travel;
  const t =
    runtime.paused || runtime.reducedMotion || !travel.duration
      ? 1
      : Math.min(1, Math.max(0, (now - travel.startedAt) / travel.duration));
  const eased = t * t * t * (t * (t * 6 - 15) + 10);
  travel.progress = t;
  for (let axis = 0; axis < 3; axis++) {
    travel.origin[axis] =
      travel.from[axis] +
      (worldOrigins[runtime.scene][axis] - travel.from[axis]) * eased;
  }
  travel.scene = travel.fromScene + (runtime.scene - travel.fromScene) * eased;
  if (t === 1) travel.duration = 0;
}

export function beginSceneTravel(
  runtime: WorldRuntime,
  next: number,
  now: number,
  animate: boolean,
) {
  // Retarget from the current position, including navigation during a flight.
  sampleSceneTravel(runtime, now);
  const travel = runtime.travel;
  travel.from[0] = travel.origin[0];
  travel.from[1] = travel.origin[1];
  travel.from[2] = travel.origin[2];
  travel.fromScene = travel.scene;
  travel.startedAt = now;
  travel.duration = animate ? SCENE_TRAVEL_MS : 0;
  runtime.scene = next;
  sampleSceneTravel(runtime, now);
}
