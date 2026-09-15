"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { WorldRuntime } from "@/experience/runtime";
import {
  planetVertex,
  planetFragment,
  atmosphereFragment,
} from "@/experience/shaders/planet";

export function mineralGeometry(
  radius: number,
  detail: number,
  relief = 0.016,
) {
  const geometry = new THREE.IcosahedronGeometry(radius, detail);
  const positions = geometry.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < positions.count; i++) {
    v.fromBufferAttribute(positions, i).normalize();
    const coarse =
      Math.sin(v.x * 17 + Math.sin(v.z * 11)) * Math.sin(v.y * 19 + v.z * 7);
    const fine = Math.sin(v.x * 47 + v.y * 23) * Math.cos(v.z * 39 - v.y * 31);
    v.multiplyScalar(radius * (1 + relief * (coarse * 0.7 + fine * 0.3)));
    positions.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function MineralBody({
  runtime,
  radius = 2,
  small = false,
  seed = 0,
  warm = 0,
  atmosphere = true,
}: {
  runtime: WorldRuntime;
  radius?: number;
  small?: boolean;
  seed?: number;
  warm?: number;
  atmosphere?: boolean;
}) {
  const body = useRef<THREE.Mesh>(null);
  const low = useThree((state) => state.viewport.dpr < 1.2);
  const defines = useMemo(() => ({ LOW_DETAIL: low ? 1 : 0 }), [low]);
  const geometry = useMemo(
    () => mineralGeometry(radius, small ? 12 : 32, 0.006),
    [radius, small],
  );
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWire: { value: 0 },
      uSeed: { value: seed },
      uWarm: { value: warm },
    }),
    [seed, warm],
  );
  useFrame((_, delta) => {
    uniforms.uWire.value = runtime.wireframe ? 1 : 0;
    if (!runtime.paused && !runtime.reducedMotion) {
      uniforms.uTime.value += delta;
      if (body.current) body.current.rotation.y += delta * 0.018;
    }
  });
  return (
    <group>
      <mesh ref={body} geometry={geometry}>
        <shaderMaterial
          vertexShader={planetVertex}
          fragmentShader={planetFragment}
          uniforms={uniforms}
          defines={defines}
        />
      </mesh>
      {atmosphere && (
        <mesh scale={1.025}>
          <sphereGeometry args={[radius, small ? 32 : 64, small ? 24 : 48]} />
          <shaderMaterial
            vertexShader={planetVertex}
            fragmentShader={atmosphereFragment}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
}
