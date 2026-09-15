"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { seededRandom, type WorldRuntime } from "@/experience/runtime";
import { MineralBody, mineralGeometry } from "./mineral";
import { LightFlare } from "@/experience/effects/light-flare";
import { Orbit } from "./primitives";

export function Core({
  runtime,
  compact = false,
}: {
  runtime: WorldRuntime;
  compact?: boolean;
}) {
  const body = useRef<THREE.Group>(null);
  const orbiters = useRef<THREE.Group>(null);
  const rocks = useRef<THREE.InstancedMesh>(null);
  const rockGeometry = useMemo(() => mineralGeometry(1, 4, 0.23), []);
  const count = compact ? 22 : 58;
  const shards = useMemo(() => {
    const random = seededRandom(46);
    return Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * Math.PI * 2;
      const radius = 2.5 + random() * 1.3;
      return {
        position: [
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * 0.54 + (random() - 0.5) * 0.7,
          Math.sin(angle) * radius * 0.48 + (random() - 0.5) * 2.1,
        ] as [number, number, number],
        scale: 0.018 + Math.pow(random(), 2) * 0.12,
        stretch: 0.6 + random() * 0.8,
      };
    });
  }, [count]);
  useLayoutEffect(() => {
    if (!rocks.current) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    shards.forEach((shard, i) => {
      dummy.position.set(...shard.position);
      dummy.rotation.set(i * 0.63, i * 0.97, i * 0.28);
      dummy.scale.set(
        shard.scale,
        shard.scale * shard.stretch,
        shard.scale * 0.8,
      );
      dummy.updateMatrix();
      rocks.current!.setMatrixAt(i, dummy.matrix);
      color.set(i % 9 === 0 ? "#3c332b" : "#283139");
      rocks.current!.setColorAt(i, color);
    });
    rocks.current.instanceMatrix.needsUpdate = true;
    if (rocks.current.instanceColor)
      rocks.current.instanceColor.needsUpdate = true;
  }, [shards]);
  useFrame((_, delta) => {
    if (body.current) {
      if (!runtime.paused && !runtime.reducedMotion)
        body.current.rotation.y += delta * 0.022;
      body.current.rotation.z = -0.12 + runtime.drag * 0.07;
    }
    if (orbiters.current && !runtime.paused && !runtime.reducedMotion)
      orbiters.current.rotation.y += delta * 0.014;
  });
  return (
    <group>
      <group ref={body} rotation={[0.2, 0.5, -0.12]}>
        <MineralBody runtime={runtime} small={compact} warm={compact ? 1 : 0} />
      </group>
      <Orbit radius={2.72} tilt={[1.15, 0.3, -0.26]} opacity={0.42} />
      <Orbit radius={3.12} tilt={[1.13, 0.3, -0.26]} opacity={0.14} />
      <Orbit radius={3.45} tilt={[0.85, -0.35, 0.65]} opacity={0.16} />
      {!compact && (
        <Orbit radius={2.32} tilt={[0.4, 1.4, 0.2]} opacity={0.18} />
      )}
      <group ref={orbiters}>
        <instancedMesh ref={rocks} args={[rockGeometry, undefined, count]}>
          <meshStandardMaterial roughness={0.92} metalness={0.12} />
        </instancedMesh>
      </group>
      <LightFlare position={[1.51, 1.43, 0.6]} size={2.4} strength={1.4} />
      <LightFlare position={[-2.52, 0.35, 1.06]} size={0.6} color="#ffd6a5" />
      <mesh position={[-2.52, 0.35, 1.06]}>
        <sphereGeometry args={[0.035, 8, 6]} />
        <meshBasicMaterial color="#e4b07b" />
      </mesh>
    </group>
  );
}
