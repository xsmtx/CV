"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { seededRandom, type WorldRuntime } from "@/experience/runtime";

const vertex = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uScene;
  uniform float uDpr;
  varying float vAlpha;
  vec3 shape(float s, float id, vec3 p) {
    float a = id * 6.283185;
    if (s < .5) return normalize(p)*2.08;
    if (s < 1.5) return vec3(floor(p.x*2.)*.6, floor(p.y*2.)*.6, floor(p.z*2.)*.6);
    if (s < 2.5) return vec3(cos(a*3.)*2.7,sin(a*3.)*1.8,(id-.5)*4.);
    if (s < 3.5) return vec3(cos(a)*2.8,sin(a)*.8,sin(a)*2.);
    if (s < 4.5) return p/max(max(abs(p.x),abs(p.y)),abs(p.z))*1.5;
    return vec3(cos(a)*4.,sin(a)*.3-1.,p.z*2.);
  }
  void main() {
    float from = floor(uScene); float to = min(from+1.,5.);
    vec3 p = mix(shape(from,aSeed,position),shape(to,aSeed,position),smoothstep(0.,1.,fract(uScene)));
    p += normalize(position)*sin(uTime*.2+aSeed*10.)*.012;
    vec4 mv = modelViewMatrix*vec4(p,1.);
    gl_Position = projectionMatrix*mv;
    gl_PointSize = clamp((1.+aSeed)*uDpr*6./-mv.z,1.,2.5*uDpr);
    vAlpha = .13 + pow(sin(aSeed*40.+uTime*.25)*.5+.5,6.)*.65;
  }
`;
const fragment = /* glsl */ `
  uniform float uLight;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord-.5);
    if (d>.5) discard;
    gl_FragColor = vec4(mix(vec3(.7,.74,.77),vec3(.16,.23,.29),uLight),vAlpha*(1.-smoothstep(.1,.5,d)));
  }
`;

export function DataField({
  theme,
  runtime,
  low,
}: {
  theme: "dark" | "light";
  runtime: WorldRuntime;
  low: boolean;
}) {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const random = seededRandom(837);
    const count = low ? 280 : 720;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = random() * 2 - 1;
      positions[i * 3 + 1] = random() * 2 - 1;
      positions[i * 3 + 2] = random() * 2 - 1;
      seeds[i] = random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return geo;
  }, [low]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScene: { value: 0 },
      uDpr: { value: 1 },
      uLight: { value: 0 },
    }),
    [],
  );
  useFrame(({ gl }, delta) => {
    uniforms.uLight.value = theme === "light" ? 1 : 0;
    uniforms.uScene.value = runtime.travel.scene;
    uniforms.uDpr.value = gl.getPixelRatio();
    if (!runtime.paused && !runtime.reducedMotion)
      uniforms.uTime.value += delta;
    const origin = runtime.travel.origin;
    if (points.current) {
      points.current.position.set(origin[0] + 1.3, origin[1] + 0.15, origin[2]);
    }
  });
  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={
          theme === "light" ? THREE.NormalBlending : THREE.AdditiveBlending
        }
      />
    </points>
  );
}

export function DistantField() {
  const geometry = useMemo(() => {
    const random = seededRandom(923);
    const p = new Float32Array(220 * 3);
    for (let i = 0; i < 220; i++) {
      p[i * 3] = (random() - 0.5) * 160;
      p[i * 3 + 1] = (random() - 0.5) * 65;
      p[i * 3 + 2] = -random() * 140 - 10;
    }
    return new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.BufferAttribute(p, 3),
    );
  }, []);
  return (
    <points geometry={geometry}>
      <pointsMaterial
        color="#71808a"
        size={0.022}
        transparent
        opacity={0.35}
        sizeAttenuation
      />
    </points>
  );
}
