"use client";

import { useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { WorldRuntime } from "@/experience/runtime";
import type { Theme } from "@/lib/theme";
import { planetVertex } from "@/experience/shaders/planet";
import {
  earthFragment,
  earthAtmosphereFragment,
} from "@/experience/shaders/earth";
import { METEOR_FLIGHT } from "@/experience/meteor";
import { MeteorImpact } from "@/experience/effects/meteor-impact";

export function Earth({
  runtime,
  theme,
  radius = 2,
  horizon = false,
}: {
  runtime: WorldRuntime;
  theme: Theme;
  radius?: number;
  horizon?: boolean;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const land = useLoader(THREE.TextureLoader, "/assets/earth-land.svg");
  const low = useThree((state) => state.viewport.dpr < 1.2);
  const target = useMemo(() => new THREE.Vector3(0.4, 0.65, 1.85), []);
  const defines = useMemo(() => ({ LOW_DETAIL: low ? 1 : 0 }), [low]);
  const uniforms = useMemo(
    () => ({
      uLand: { value: land },
      uHorizon: { value: horizon ? 1 : 0 },
      uTime: { value: 0 },
      uWire: { value: 0 },
      uImpact: { value: 0 },
      uImpactAge: { value: -1 },
      uQuiet: { value: 0 },
      uImpactPoint: { value: new THREE.Vector3() },
    }),
    [land, horizon],
  );
  const atmosphereUniforms = useMemo(
    () => ({ uHorizon: { value: horizon ? 1 : 0 } }),
    [horizon],
  );
  useFrame(() => {
    if (!material.current) return;
    const u = material.current.uniforms;
    u.uTime.value = runtime.skyTime;
    u.uWire.value = !horizon && runtime.wireframe ? 1 : 0;
    u.uImpact.value = !horizon && runtime.impact.active ? 1 : 0;
    u.uImpactAge.value = runtime.impact.quiet
      ? 0.22
      : runtime.impact.age - METEOR_FLIGHT;
    u.uQuiet.value = runtime.impact.quiet ? 1 : 0;
    u.uImpactPoint.value.copy(target);
  });
  return (
    <group>
      <mesh name="earth-surface">
        <sphereGeometry args={[radius, low ? 64 : 96, low ? 40 : 64]} />
        <shaderMaterial
          ref={material}
          vertexShader={planetVertex}
          fragmentShader={earthFragment}
          uniforms={uniforms}
          defines={defines}
        />
      </mesh>
      <mesh scale={1.012}>
        <sphereGeometry args={[radius, 64, 40]} />
        <shaderMaterial
          vertexShader={planetVertex}
          fragmentShader={earthAtmosphereFragment}
          uniforms={atmosphereUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {!horizon && (
        <MeteorImpact
          runtime={runtime}
          target={target}
          low={low}
          theme={theme}
        />
      )}
    </group>
  );
}
