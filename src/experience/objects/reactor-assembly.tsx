"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { WorldRuntime } from "@/experience/runtime";
import { ArchitecturalMaterial } from "./architectural-material";
import { mineralGeometry } from "./mineral";
import { LightFlare } from "@/experience/effects/light-flare";
import { Orbit } from "./primitives";

export function ReactorAssembly({ runtime }: { runtime: WorldRuntime }) {
  const blocks = useRef<THREE.InstancedMesh>(null);
  const core = useRef<THREE.Group>(null);
  const phase = useRef(0);
  const rock = useMemo(() => mineralGeometry(1, 14, 0.22), []);
  const frame = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.64, 1.9, 1.64)),
    [],
  );
  useLayoutEffect(() => {
    if (!blocks.current) return;
    const dummy = new THREE.Object3D(),
      color = new THREE.Color();
    let i = 0;
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++) {
          if (Number(x === 0) + Number(y === 0) + Number(z === 0) > 1) continue;
          dummy.position.set(x * 0.55, y * 0.64, z * 0.55);
          dummy.scale.set(0.46, 0.51, 0.46);
          dummy.updateMatrix();
          blocks.current.setMatrixAt(i, dummy.matrix);
          blocks.current.setColorAt(
            i,
            color.set(i % 5 === 0 ? "#788591" : "#43535e"),
          );
          i++;
        }
    blocks.current.instanceMatrix.needsUpdate = true;
    if (blocks.current.instanceColor)
      blocks.current.instanceColor.needsUpdate = true;
  }, []);
  useFrame((_, delta) => {
    if (
      runtime.scene !== 4 ||
      runtime.paused ||
      runtime.reducedMotion ||
      !runtime.lab.running
    )
      return;
    phase.current += delta * runtime.lab.rate;
    if (core.current) {
      core.current.rotation.y = phase.current * 0.4;
      core.current.rotation.z = phase.current * 0.15;
    }
  });
  return (
    <group>
      <instancedMesh ref={blocks} args={[undefined, undefined, 20]}>
        <boxGeometry args={[1, 1, 1]} />
        <ArchitecturalMaterial reactor />
      </instancedMesh>
      <lineSegments geometry={frame}>
        <lineBasicMaterial color="#9bb4c4" transparent opacity={0.48} />
      </lineSegments>
      <group ref={core}>
        <mesh>
          <octahedronGeometry args={[0.35, 0]} />
          <meshStandardMaterial
            color="#241608"
            emissive="#ffad54"
            emissiveIntensity={1.8}
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
        <Orbit
          radius={0.46}
          tilt={[0.3, 0.5, 0.7]}
          color="#eabd87"
          opacity={0.85}
        />
        <Orbit
          radius={0.55}
          tilt={[1.2, 0.1, 0.3]}
          color="#eabd87"
          opacity={0.45}
        />
      </group>
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <mesh key={`${x}-${z}`} position={[x * 0.33, 0, z * 0.33]}>
            <boxGeometry args={[0.016, 1.35, 0.016]} />
            <meshBasicMaterial color="#bd8856" />
          </mesh>
        )),
      )}
      <LightFlare
        position={[0, 0, 0.21]}
        size={2.2}
        color="#ffc285"
        strength={1.7}
      />
      <pointLight
        position={[0, 0, 0]}
        color="#ffc285"
        intensity={2.5}
        distance={3}
      />
      <mesh geometry={rock} position={[0, -1.7, 0]} scale={[1.5, 0.24, 1.05]}>
        <meshStandardMaterial
          color="#13191d"
          roughness={0.88}
          metalness={0.3}
        />
      </mesh>
      <mesh position={[0, -1.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.36, 0.39, 64]} />
        <meshBasicMaterial color="#c49257" side={THREE.DoubleSide} />
      </mesh>
      <LightFlare
        position={[0, -1.32, 0.3]}
        size={2.8}
        color="#ffc285"
        strength={1.8}
      />
      <pointLight
        position={[0, -1.3, 0.4]}
        color="#ffa458"
        intensity={4}
        distance={3}
      />
    </group>
  );
}
