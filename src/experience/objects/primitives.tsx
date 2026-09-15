"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

export function Orbit({
  radius = 3,
  tilt = [0.9, 0.2, -0.3],
  opacity = 0.28,
  color = "#88949a",
  dashed = false,
}: {
  radius?: number;
  tilt?: [number, number, number];
  opacity?: number;
  color?: string;
  dashed?: boolean;
}) {
  const geometry = useMemo(() => {
    const vertices: number[] = [];
    for (let i = 0; i <= 200; i++) {
      const a = (i / 200) * Math.PI * 2;
      vertices.push(Math.cos(a) * radius, Math.sin(a) * radius, 0);
    }
    return new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
  }, [radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group rotation={tilt}>
      <lineLoop geometry={geometry}>
        {dashed ? (
          <lineBasicMaterial
            color={color}
            transparent
            opacity={opacity * 0.6}
          />
        ) : (
          <lineBasicMaterial color={color} transparent opacity={opacity} />
        )}
      </lineLoop>
    </group>
  );
}

export function ConnectionLines({
  points,
  color = "#84949d",
  opacity = 0.35,
}: {
  points: number[];
  color?: string;
  opacity?: number;
}) {
  const geometry = useMemo(
    () =>
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute(points, 3),
      ),
    [points],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </lineSegments>
  );
}
