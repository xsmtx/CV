"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sampleSceneTravel, type WorldRuntime } from "@/experience/runtime";

export function CameraRig({
  runtime,
  mobile,
}: {
  runtime: WorldRuntime;
  mobile: boolean;
}) {
  const target = useMemo(() => new THREE.Vector3(), []);
  const offset = useMemo(
    () =>
      new THREE.Vector3(
        mobile ? 1.3 : 0,
        mobile ? -1.15 : 0.25,
        mobile ? 12.8 : 10.8,
      ),
    // Keep local camera adjustments continuous across viewport changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const destination = useMemo(() => new THREE.Vector3(0, 0, 10.5), []);
  useFrame(({ camera }, delta) => {
    sampleSceneTravel(runtime, performance.now());
    const origin = runtime.travel.origin;
    const still = runtime.reducedMotion || runtime.paused;
    const px = still ? 0 : runtime.pointer.x * 0.18;
    const py = still ? 0 : runtime.pointer.y * 0.12;
    const detail = runtime.scene === 3 && runtime.detail;
    target.set(
      origin[0] + (mobile ? 1.3 : 0.25),
      origin[1] + (mobile ? -0.25 : 0.05),
      origin[2],
    );
    destination.set(
      (mobile ? 1.3 : 0) + px + (detail ? 0.65 : 0),
      (mobile ? -1.15 : 0.25) - py,
      (mobile ? 12.8 : 10.8) - (detail ? 1.2 : 0),
    );
    if (runtime.scene === 2) destination.z -= (runtime.timeline - 2) * 0.14;
    if (runtime.scene === 1) destination.x += ((runtime.system % 3) - 1) * 0.14;
    const lerp = still ? 1 : 1 - Math.exp(-Math.min(delta, 0.15) * 3.1);
    offset.lerp(destination, lerp);
    camera.position.set(
      origin[0] + offset.x,
      origin[1] + offset.y,
      origin[2] + offset.z,
    );
    camera.lookAt(target);
    runtime.stats.x = camera.position.x;
    runtime.stats.y = camera.position.y;
    runtime.stats.z = camera.position.z;
  }, -1);
  return null;
}
