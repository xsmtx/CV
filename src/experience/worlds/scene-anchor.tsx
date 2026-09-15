"use client";
import { useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { worldOrigins, type WorldRuntime } from "@/experience/runtime";

export function SceneAnchor({
  index,
  runtime,
  children,
}: {
  index: number;
  runtime: WorldRuntime;
  children: ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const origin = useMemo(
    () => new THREE.Vector3(...worldOrigins[index]),
    [index],
  );
  useFrame(({ camera }) => {
    if (group.current)
      group.current.visible =
        runtime.scene === index ||
        camera.position.distanceToSquared(origin) < 235;
  });
  return (
    <group ref={group} position={worldOrigins[index]}>
      {children}
    </group>
  );
}
