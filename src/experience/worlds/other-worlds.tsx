"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { systems } from "@/data/systems";
import { seededRandom, type WorldRuntime } from "@/experience/runtime";
import { SceneAnchor } from "./scene-anchor";
import { planetVertex } from "@/experience/shaders/planet";
import { Core } from "@/experience/objects/core";
import { ConnectionLines, Orbit } from "@/experience/objects/primitives";
import { ArchitecturalMaterial } from "@/experience/objects/architectural-material";
import { MineralBody } from "@/experience/objects/mineral";
import { ReactorAssembly } from "@/experience/objects/reactor-assembly";
import { LightFlare } from "@/experience/effects/light-flare";
import { noiseGLSL } from "@/experience/shaders/noise";

interface Props {
  runtime: WorldRuntime;
  onSystem: (index: number) => void;
  onTimeline: (index: number) => void;
  onProject: (index: number) => void;
}

function Infrastructure({
  runtime,
  onSelect,
}: {
  runtime: WorldRuntime;
  onSelect: (index: number) => void;
}) {
  const towers = useRef<THREE.InstancedMesh>(null);
  const indicators = useRef<(THREE.Mesh | null)[]>([]);
  const traffic = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const active = useRef(-1);
  const phase = useRef(0);
  const selected = runtime.system;
  const activeConnections = useMemo(
    () =>
      systems.flatMap((node) => [
        ...node.position,
        ...systems[selected].position,
      ]),
    [selected],
  );
  const points = useMemo(() => {
    const result: number[] = [];
    systems.forEach((node, i) => {
      const next = systems[(i + 1) % systems.length];
      result.push(
        ...node.position,
        ...next.position,
        ...node.position,
        0,
        0,
        0,
      );
    });
    return result;
  }, []);
  useLayoutEffect(() => {
    if (!towers.current) return;
    const random = seededRandom(393);
    systems.forEach((node, i) => {
      for (let j = 0; j < 12; j++) {
        dummy.position.set(
          node.position[0] + ((j % 3) - 1) * 0.25,
          node.position[1] + Math.floor(j / 3) * 0.065,
          node.position[2] + (Math.floor(j / 3) - 1.5) * 0.23,
        );
        dummy.scale.set(0.2, 0.24 + random() * 1.02, 0.17);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        towers.current!.setMatrixAt(i * 12 + j, dummy.matrix);
        towers.current!.setColorAt(i * 12 + j, new THREE.Color("#53636e"));
      }
    });
    towers.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);
  useFrame((_, delta) => {
    if (runtime.scene !== 1) return;
    if (!runtime.reducedMotion && !runtime.paused)
      phase.current += delta * 0.22;
    if (active.current !== runtime.system && towers.current) {
      active.current = runtime.system;
      for (let i = 0; i < 84; i++) {
        color.set(
          Math.floor(i / 12) === runtime.system ? "#c9d5db" : "#637684",
        );
        towers.current.setColorAt(i, color);
      }
      if (towers.current.instanceColor)
        towers.current.instanceColor.needsUpdate = true;
    }
    indicators.current.forEach((mesh, i) => {
      if (!mesh) return;
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.color.set(i === runtime.system ? "#e0ae78" : "#687b87");
      mesh.scale.setScalar(i === runtime.system ? 1.5 : 1);
    });
    if (traffic.current) {
      systems.forEach((node, i) => {
        const target = systems[runtime.system].position;
        const p = (phase.current + i * 0.14) % 1;
        dummy.position.set(
          THREE.MathUtils.lerp(node.position[0], target[0], p),
          THREE.MathUtils.lerp(node.position[1], target[1], p),
          THREE.MathUtils.lerp(node.position[2], target[2], p),
        );
        dummy.scale.setScalar(0.025);
        dummy.updateMatrix();
        traffic.current!.setMatrixAt(i, dummy.matrix);
      });
      traffic.current.instanceMatrix.needsUpdate = true;
    }
  });
  return (
    <group rotation={[0.08, -0.25, -0.06]}>
      <instancedMesh ref={towers} args={[undefined, undefined, 84]}>
        <boxGeometry args={[1, 1, 1]} />
        <ArchitecturalMaterial />
      </instancedMesh>
      <ConnectionLines points={points} opacity={0.14} />
      <ConnectionLines
        points={activeConnections}
        color="#b8a48b"
        opacity={0.38}
      />
      {systems.map((node, i) => (
        <group
          key={node.id}
          position={[...node.position]}
          onPointerOver={(event) => {
            event.stopPropagation();
            onSelect(i);
          }}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(i);
          }}
        >
          <LightFlare
            position={[0, 0.1, 0.42]}
            size={i === runtime.system ? 1.15 : 0.5}
            strength={i === runtime.system ? 1.7 : 0.8}
          />
          <mesh
            ref={(el) => {
              indicators.current[i] = el;
            }}
          >
            <sphereGeometry args={[0.046, 12, 8]} />
            <meshBasicMaterial color="#a8b4ba" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.25, 8, 6]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.13, 0]}>
            <ringGeometry args={[0.29, 0.3, 40]} />
            <meshBasicMaterial
              color="#7c8a93"
              side={THREE.DoubleSide}
              transparent
              opacity={0.45}
            />
          </mesh>
          <mesh position={[0, -0.24, 0]}>
            <boxGeometry args={[0.92, 0.035, 0.88]} />
            <meshStandardMaterial
              color="#35414b"
              metalness={0.65}
              roughness={0.5}
            />
          </mesh>
        </group>
      ))}
      <instancedMesh ref={traffic} args={[undefined, undefined, 7]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshBasicMaterial color="#e6b782" />
      </instancedMesh>
      <Orbit radius={3} tilt={[1.3, 0, 0]} opacity={0.12} />
      <mesh position={[0, 0, -0.3]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.5, 0.9, 0.45]} />
        <ArchitecturalMaterial />
      </mesh>
    </group>
  );
}

function Chronology({
  runtime,
  onSelect,
}: {
  runtime: WorldRuntime;
  onSelect: (index: number) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const positions = useMemo(
    () =>
      [
        [-2.45, -1.35, 0.6],
        [-1.7, -1.04, 0.35],
        [-0.9, -0.63, 0.05],
        [-0.08, -0.1, -0.5],
        [0.85, 0.55, -1.45],
      ] as [number, number, number][],
    [],
  );
  const trajectory = useMemo(
    () =>
      positions.flatMap((position, index) =>
        index < positions.length - 1
          ? [...position, ...positions[index + 1]]
          : [],
      ),
    [positions],
  );
  useFrame((_, delta) => {
    if (group.current && runtime.scene === 2)
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        (runtime.timeline - 2) * 0.16,
        runtime.reducedMotion ? 1000 : 3,
        delta,
      );
  });
  return (
    <group ref={group}>
      <Orbit radius={3.05} tilt={[1.05, 0.36, 0.64]} opacity={0.38} />
      <Orbit radius={3.25} tilt={[1.05, 0.36, 0.64]} opacity={0.14} />
      <Orbit radius={2.8} tilt={[0.92, 0.2, 0.61]} opacity={0.12} />
      <ConnectionLines points={trajectory} opacity={0.45} />
      {positions.map((position, i) => (
        <group
          key={i}
          position={position}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(i);
          }}
        >
          <MineralBody
            runtime={runtime}
            radius={[0.18, 0.24, 0.33, 0.48, 1.18][i]}
            small
            seed={i * 7.3}
            warm={i < 3 ? 1 : 0}
          />
          <Orbit
            radius={[0.28, 0.35, 0.46, 0.64, 1.42][i]}
            tilt={[0, 0.65, -0.2]}
            opacity={i === runtime.timeline ? 0.62 : 0.2}
            color={i === runtime.timeline ? "#d8b48c" : "#7e9aab"}
          />
          <LightFlare
            position={
              [
                [0.13, 0.13, 0.1],
                [0.17, 0.18, 0.12],
                [0.23, 0.23, 0.15],
                [0.34, 0.34, 0.22],
                [0.84, 0.85, 0.4],
              ][i] as [number, number, number]
            }
            size={i === runtime.timeline ? 1.4 : 0.6}
            strength={i === runtime.timeline ? 2.2 : 0.8}
          />
        </group>
      ))}
    </group>
  );
}

function ProjectArtifact({
  index,
  runtime,
}: {
  index: number;
  runtime: WorldRuntime;
}) {
  if (index === 0) return <Core runtime={runtime} compact />;
  if (index === 1)
    return (
      <group>
        <MineralBody runtime={runtime} radius={1.36} small seed={17} />
        <mesh scale={1.04}>
          <icosahedronGeometry args={[1.45, 1]} />
          <meshBasicMaterial
            color="#94a8b6"
            wireframe
            transparent
            opacity={0.28}
          />
        </mesh>
        <Orbit radius={2.1} tilt={[0.3, 0.6, 0.4]} opacity={0.5} />
        <Orbit radius={2.5} tilt={[1.2, 0, -0.3]} opacity={0.2} />
        <mesh>
          <icosahedronGeometry args={[1.52, 0]} />
          <meshBasicMaterial
            wireframe
            color="#e4af74"
            transparent
            opacity={0.22}
          />
        </mesh>
      </group>
    );
  if (index === 2)
    return (
      <group rotation={[0.5, 0.3, 0.2]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[i * 0.7, i * 0.9, 0]}>
            <torusGeometry args={[1.2 + i * 0.25, 0.06, 8, 80]} />
            <meshStandardMaterial
              color={i === 2 ? "#a88662" : "#44545e"}
              metalness={0.85}
              roughness={0.35}
            />
          </mesh>
        ))}
        <MineralBody runtime={runtime} radius={0.8} small seed={9.2} warm={1} />
        <LightFlare position={[0.7, 0.2, 1]} size={1.2} color="#ffc58a" />
      </group>
    );
  return (
    <group>
      <MineralBody
        runtime={runtime}
        radius={1.1}
        small
        seed={32.1}
        warm={0.4}
      />
      {Array.from({ length: 6 }, (_, i) => (
        <group key={i} rotation={[i * 0.7, i * 0.5, 0]}>
          <Orbit radius={1.6 + i * 0.1} tilt={[0.2, 0, 0]} opacity={0.24} />
          <mesh position={[1.6 + i * 0.1, 0, 0]}>
            <sphereGeometry args={[0.14, 12, 8]} />
            <meshStandardMaterial
              color={i === 0 ? "#bd9264" : "#98a3a8"}
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ProjectWorlds({
  runtime,
  onSelect,
}: {
  runtime: WorldRuntime;
  onSelect: (index: number) => void;
}) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  useFrame((_, delta) => {
    if (runtime.scene !== 3) return;
    groups.current.forEach((group, i) => {
      if (!group) return;
      const selected = i === runtime.project;
      const targetX = selected ? 0.2 : (i - runtime.project) * 2.1;
      const targetY = selected ? 0.2 : -1.4;
      const targetZ = selected ? 0.4 : -4.5;
      const a =
        runtime.reducedMotion || runtime.paused
          ? 1
          : 1 - Math.exp(-delta * 3.5);
      group.position.x = THREE.MathUtils.lerp(group.position.x, targetX, a);
      group.position.y = THREE.MathUtils.lerp(group.position.y, targetY, a);
      group.position.z = THREE.MathUtils.lerp(group.position.z, targetZ, a);
      const scale = selected ? 0.82 : 0.24;
      group.scale.setScalar(THREE.MathUtils.lerp(group.scale.x, scale, a));
      if (!runtime.paused && !runtime.reducedMotion && i !== 0)
        group.rotation.y += delta * 0.065;
    });
  });
  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <group
          key={i}
          ref={(el) => {
            groups.current[i] = el;
          }}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(i);
          }}
        >
          <ProjectArtifact index={i} runtime={runtime} />
        </group>
      ))}
    </group>
  );
}

function Reactor({ runtime }: { runtime: WorldRuntime }) {
  const core = useRef<THREE.Group>(null);
  const nodes = useRef<THREE.InstancedMesh>(null);
  const packets = useRef<THREE.InstancedMesh>(null);
  const connections = useMemo(
    () =>
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(24 * 6), 3),
      ),
    [],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const positions = useMemo(
    () => Array.from({ length: 12 }, () => new THREE.Vector3()),
    [],
  );
  const phase = useRef(0);
  useFrame((_, delta) => {
    if (runtime.scene !== 4) return;
    const animated =
      !runtime.paused && !runtime.reducedMotion && runtime.lab.running;
    if (animated) phase.current += delta * runtime.lab.rate * 0.3;
    if (core.current) {
      core.current.rotation.y = phase.current * 0.25 + 0.3;
      core.current.rotation.x = Math.sin(phase.current * 0.2) * 0.08 + 0.2;
    }
    if (!nodes.current || !packets.current) return;
    const mesh = runtime.lab.topology === "mesh";
    const count = mesh ? 24 : 12;
    positions.forEach((p, i) => {
      const a = (i / 12) * Math.PI * 2;
      const target = mesh
        ? [Math.cos(a) * 2.05, Math.sin(a * 3) * 1.1, Math.sin(a) * 1.9]
        : [Math.cos(a) * 2.25, Math.sin(a) * 0.6, Math.sin(a) * 2.0];
      const lerp =
        runtime.paused || runtime.reducedMotion ? 1 : 1 - Math.exp(-delta * 4);
      p.x = THREE.MathUtils.lerp(p.x, target[0], lerp);
      p.y = THREE.MathUtils.lerp(p.y, target[1], lerp);
      p.z = THREE.MathUtils.lerp(p.z, target[2], lerp);
      dummy.position.copy(p);
      dummy.scale.setScalar(0.048);
      dummy.updateMatrix();
      nodes.current!.setMatrixAt(i, dummy.matrix);
    });
    const array = connections.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const source = positions[i % 12];
      const target = positions[((i % 12) + (i < 12 ? 1 : 4)) % 12];
      source.toArray(array, i * 6);
      target.toArray(array, i * 6 + 3);
      dummy.position.copy(source).lerp(target, (phase.current + i * 0.08) % 1);
      dummy.scale.setScalar(0.02);
      dummy.updateMatrix();
      packets.current.setMatrixAt(i, dummy.matrix);
    }
    connections.setDrawRange(0, count * 2);
    connections.attributes.position.needsUpdate = true;
    packets.current.count = count;
    packets.current.instanceMatrix.needsUpdate = true;
    nodes.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <group ref={core}>
        <ReactorAssembly runtime={runtime} />
      </group>
      <instancedMesh ref={nodes} args={[undefined, undefined, 12]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color="#b0bac0" />
      </instancedMesh>
      <instancedMesh ref={packets} args={[undefined, undefined, 24]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshBasicMaterial color="#e7b276" />
      </instancedMesh>
      <lineSegments geometry={connections} frustumCulled={false}>
        <lineBasicMaterial color="#7c909c" transparent opacity={0.3} />
      </lineSegments>
    </group>
  );
}

const horizonFragment = /* glsl */ `
  varying vec3 vNormal; varying vec3 vPosition; varying vec3 vLocal;
  ${noiseGLSL}
  void main() {
    vec3 n=normalize(vNormal);
    vec3 p=normalize(vLocal)*5.;
    float continent=terrainNoise(p*2.);
    float clouds=terrainNoise(p*9.+continent*2.);
    float ridges=noise3(p*110.);
    float rim=pow(1.-max(dot(n,normalize(-vPosition)),0.),9.);
    float light=smoothstep(-.2,.7,n.y);
    float dawn=pow(max(dot(n,normalize(vec3(.35,.95,.1))),0.),14.);
    vec3 surface=mix(vec3(.003,.007,.011),vec3(.04,.057,.072),smoothstep(.25,.67,continent+clouds*.3));
    vec3 color=surface*(.2+clouds*.9)*(ridges*.5+.5)*light;
    color+=mix(vec3(.16,.28,.4),vec3(1.,.61,.3),dawn)*rim*light*(.38+clouds*.6);
    float cities=smoothstep(.66,.81,clouds)*smoothstep(.8,.92,ridges)*(1.-rim);
    color+=vec3(.6,.25,.055)*cities*.45;
    gl_FragColor=vec4(color,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
function Horizon() {
  const low = useThree((state) => state.viewport.dpr < 1.2);
  const defines = useMemo(() => ({ LOW_DETAIL: low ? 1 : 0 }), [low]);
  return (
    <group position={[1, -7.7, -2]}>
      <mesh>
        <sphereGeometry args={[6.8, 96, 64]} />
        <shaderMaterial
          vertexShader={planetVertex}
          fragmentShader={horizonFragment}
          defines={defines}
        />
      </mesh>
      <LightFlare
        position={[2.32, 6.38, 1.05]}
        size={4.2}
        color="#ffd3a0"
        strength={3}
      />
      <LightFlare
        position={[2.32, 6.38, 1.05]}
        size={1.2}
        color="#fff5de"
        strength={2.5}
      />
      <Orbit radius={7.9} tilt={[1.34, 0, 0.02]} opacity={0.12} />
    </group>
  );
}

export default function OtherWorlds({
  runtime,
  onSystem,
  onTimeline,
  onProject,
}: Props) {
  return (
    <>
      <SceneAnchor index={1} runtime={runtime}>
        <group position={[1.2, 0.62, 0]} scale={0.9}>
          <Infrastructure runtime={runtime} onSelect={onSystem} />
        </group>
      </SceneAnchor>
      <SceneAnchor index={2} runtime={runtime}>
        <group position={[1.65, 0, 0]}>
          <Chronology runtime={runtime} onSelect={onTimeline} />
        </group>
      </SceneAnchor>
      <SceneAnchor index={3} runtime={runtime}>
        <group position={[1.45, 0.25, 0]}>
          <ProjectWorlds runtime={runtime} onSelect={onProject} />
        </group>
      </SceneAnchor>
      <SceneAnchor index={4} runtime={runtime}>
        <group position={[1.5, 0.65, 0]} scale={0.92}>
          <Reactor runtime={runtime} />
        </group>
      </SceneAnchor>
      <SceneAnchor index={5} runtime={runtime}>
        <Horizon />
      </SceneAnchor>
    </>
  );
}
