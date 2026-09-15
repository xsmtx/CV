"use client";

import { useMemo } from "react";
import * as THREE from "three";

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv=uv;
    vec4 center=modelViewMatrix*vec4(0.,0.,0.,1.);
    center.xy += position.xy*vec2(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz));
    gl_Position=projectionMatrix*center;
  }
`;
const fragment = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uStrength;
  void main() {
    vec2 p=(vUv-.5)*2.;
    float r=length(p);
    float halo=exp(-r*7.)*.23;
    float core=exp(-r*65.)*1.7;
    float rays=pow(max(1.-abs(p.x*p.y)*190.,0.),9.)*pow(max(1.-r,0.),5.)*.09;
    gl_FragColor=vec4(uColor,(halo+core+rays)*uStrength*smoothstep(1.,.7,r));
  }
`;

export function LightFlare({
  position,
  size = 1,
  color = "#c6e2f5",
  strength = 1,
}: {
  position: [number, number, number];
  size?: number;
  color?: string;
  strength?: number;
}) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uStrength: { value: strength },
    }),
    [color, strength],
  );
  return (
    <mesh position={position} scale={size}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
