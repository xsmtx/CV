"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Earth } from "./earth";
import { Orbit } from "./primitives";
import type { WorldRuntime } from "@/experience/runtime";
import type { Theme } from "@/lib/theme";

const sunVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv=uv;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
  }
`;
const sunFragment = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vec2 p=(vUv-.5)*2.;
    float r=length(p);
    float disk=1.-smoothstep(.115,.132,r);
    float corona=exp(-r*6.5)*.72+exp(-r*16.)*.55;
    float ray=exp(-abs(p.y)*110.)*exp(-abs(p.x)*5.)*.12;
    float edge=1.-smoothstep(.72,1.,r);
    vec3 color=mix(vec3(1.,.48,.14),vec3(1.,.94,.76),disk);
    gl_FragColor=vec4(color,clamp(disk+corona+ray,0.,1.)*edge);
  }
`;

const radius = 6.8;

export function EarthHorizon({
  runtime,
  theme,
}: {
  runtime: WorldRuntime;
  theme: Theme;
}) {
  const root = useRef<THREE.Group>(null);
  const globe = useRef<THREE.Group>(null);
  const sun = useRef<THREE.Mesh>(null);
  const work = useMemo(
    () => ({
      center: new THREE.Vector3(),
      eye: new THREE.Vector3(),
      view: new THREE.Vector3(),
      radial: new THREE.Vector3(),
      up: new THREE.Vector3(),
      tangent: new THREE.Vector3(),
    }),
    [],
  );
  useFrame(({ camera }) => {
    if (!root.current || !globe.current || !sun.current) return;
    globe.current.rotation.y = 0.5 + runtime.skyTime * 0.008;
    root.current.getWorldPosition(work.center);
    work.eye.copy(camera.position).sub(work.center);
    const distance = work.eye.length();
    if (distance <= radius) return;
    work.view.copy(work.eye).divideScalar(distance);
    work.up.setFromMatrixColumn(camera.matrixWorld, 1);
    work.radial
      .setFromMatrixColumn(camera.matrixWorld, 0)
      .multiplyScalar(0.34)
      .addScaledVector(work.up, 0.94);
    work.radial
      .addScaledVector(work.view, -work.radial.dot(work.view))
      .normalize();
    // Find the visible sphere's tangent and place the sun farther down that
    // viewing ray. The Earth then occludes the lower part of the solar disk.
    const facing = radius / distance;
    work.tangent
      .copy(work.radial)
      .multiplyScalar(Math.sqrt(1 - facing * facing))
      .addScaledVector(work.view, facing)
      .multiplyScalar(radius);
    sun.current.position
      .copy(work.eye)
      .lerp(work.tangent, 1.22)
      .addScaledVector(work.radial, 0.08);
    sun.current.quaternion.copy(camera.quaternion);
  });
  return (
    <group ref={root} position={[1, -7.7, -2]}>
      <group ref={globe} rotation={[-0.55, 0.5, -0.12]}>
        <Earth runtime={runtime} theme={theme} radius={radius} horizon />
      </group>
      <mesh ref={sun} name="contact-sun" scale={7}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          vertexShader={sunVertex}
          fragmentShader={sunFragment}
          transparent
          depthWrite={false}
          blending={
            theme === "light" ? THREE.NormalBlending : THREE.AdditiveBlending
          }
        />
      </mesh>
      <Orbit radius={7.9} tilt={[1.34, 0, 0.02]} opacity={0.12} />
    </group>
  );
}
