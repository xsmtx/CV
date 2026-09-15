"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { seededRandom, type WorldRuntime } from "@/experience/runtime";
import type { Theme } from "@/lib/theme";
import { skyEventsGLSL } from "@/experience/shaders/sky-events";
import {
  gargantuaGLSL,
  gargantuaPositionGLSL,
} from "@/experience/shaders/gargantua";
import { advanceSkyTime } from "./sky-clock";

const skyVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv=uv;
    gl_Position=vec4(position.xy,1.,1.);
  }
`;
const skyFragment = /* glsl */ `
  uniform float uLight;
  uniform float uAspect;
  uniform vec2 uOffset;
  uniform float uSkyTime;
  uniform float uEvents;
  varying vec2 vUv;

  float hash(vec2 p) {
    vec3 p3=fract(vec3(p.xyx)*.1031);
    p3+=dot(p3,p3.yzx+33.33);
    return fract((p3.x+p3.y)*p3.z);
  }
  float noise(vec2 p) {
    vec2 i=floor(p),f=fract(p);
    f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);
  }
  float cloud(vec2 p) {
    float n=.55*noise(p);
    p=mat2(.8,.6,-.6,.8)*p*2.07+11.3;
    n+=.27*noise(p);
    p=p*2.03+7.8;
    n+=.13*noise(p);
    #if LOW_DETAIL == 0
      n+=.065*noise(p*2.09+21.2);
    #endif
    return n;
  }
  vec3 galaxy(vec2 p,float tilt,float scale) {
    p=mat2(cos(tilt),-sin(tilt),sin(tilt),cos(tilt))*p*scale;
    p.y*=2.9;
    float r=length(p);
    float a=atan(p.y,p.x);
    float spiral=pow(.5+.5*cos(a*2.-log(r+.045)*5.2),3.);
    float arms=spiral*exp(-r*3.8)*smoothstep(0.,.22,r);
    float nucleus=exp(-r*r*95.);
    float halo=exp(-r*5.)*.15;
    return vec3(.28,.43,.56)*arms*.45+vec3(.78,.73,.61)*(nucleus*.65+halo);
  }
  ${skyEventsGLSL}
  ${gargantuaGLSL}
  void main() {
    vec2 p=(vUv-.5)*vec2(uAspect,1.)+uOffset;
    vec2 warp=vec2(cloud(p*2.4+3.7),cloud(p*2.8-8.2));
    float slope=p.y-p.x*.46;
    float band=skyGaussian(slope+(warp.x-.5)*.3,1./3.2);
    float body=cloud(p*5.5+warp*1.8);
    float detail=cloud(p*18.+warp*3.);
    float lane=smoothstep(.35,.7,cloud(p*8.+vec2(18.,5.)));
    float dust=band*(.18+body*.85)*(.4+detail*.8);
    float rift=skyGaussian(slope+(warp.y-.52)*.23,1./14.)*lane;
    vec3 blue=vec3(.12,.26,.4);
    vec3 violet=vec3(.22,.12,.29);
    vec3 gas=mix(blue,violet,smoothstep(.1,.85,warp.y));
    vec3 night=vec3(.023,.037,.067)+gas*dust*.9;
    night+=vec3(.14,.25,.32)*pow(detail,3.)*band*.7;
    night*=1.-rift*.65;
    vec3 islands=vec3(0.);
    #if LOW_DETAIL == 0
      islands+=galaxy(p-vec2(-uAspect*.31,-.22),.55,22.)*.45;
    #endif
    night+=islands;
    vec3 daylight=vec3(.929,.945,.953)-gas*dust*.34-vec3(.1,.13,.16)*rift*.12;
    daylight-=islands*.11;
    vec4 hole=gargantua(p,uSkyTime);
    night=mix(night,vec3(.006,.009,.015),hole.a)+hole.rgb;
    daylight=mix(daylight,vec3(.12,.16,.19),hole.a*.92);
    daylight=mix(daylight,vec3(.43,.27,.13),min(1.,max(hole.r,max(hole.g,hole.b))*.85));
    vec3 events=(shootingStar(p,uSkyTime)+stellarBloom(p,uSkyTime))*uEvents;
    night+=events;
    daylight=mix(daylight,vec3(.26,.4,.55),min(1.,max(events.r,max(events.g,events.b))*.7));
    gl_FragColor=vec4(mix(night,daylight,uLight),1.);
  }
`;
const starVertex = /* glsl */ `
  attribute float aSize;
  attribute float aGlow;
  attribute vec3 aColor;
  uniform float uDpr;
  uniform float uAspect;
  uniform vec2 uOffset;
  varying vec3 vColor;
  varying float vGlow;
  varying float vVisibility;
  ${gargantuaPositionGLSL}
  void main() {
    vColor=aColor;
    vGlow=aGlow;
    vec2 p=position.xy-uOffset*(.3+position.z*.18);
    vec2 skyPosition=p*.5*vec2(uAspect,1.)+uOffset;
    vVisibility=1.-gargantuaShadow(gargantuaPosition(skyPosition));
    gl_Position=vec4(p,.9999,1.);
    gl_PointSize=aSize*uDpr;
  }
`;
const starFragment = /* glsl */ `
  uniform float uLight;
  varying vec3 vColor;
  varying float vGlow;
  varying float vVisibility;
  void main() {
    vec2 p=gl_PointCoord-.5;
    float r=length(p);
    if(r>.5)discard;
    float core=exp(-r*r*32.);
    float halo=exp(-r*9.)*vGlow*.55;
    float rays=exp(-abs(p.x*p.y)*550.)*exp(-r*9.)*vGlow*.12;
    float alpha=(core+halo+rays)*(.5+vGlow*.5);
    gl_FragColor=vec4(mix(vColor,vec3(.22,.32,.41),uLight),alpha*mix(1.,.38,uLight)*vVisibility);
  }
`;

export function CosmicBackdrop({
  theme,
  runtime,
  low,
}: {
  theme: Theme;
  runtime: WorldRuntime;
  low: boolean;
}) {
  const sky = useRef<THREE.ShaderMaterial>(null);
  const stars = useRef<THREE.ShaderMaterial>(null);
  const defines = useMemo(() => ({ LOW_DETAIL: low ? 1 : 0 }), [low]);
  const uniforms = useMemo(
    () => ({
      uLight: { value: 0 },
      uAspect: { value: 1 },
      uOffset: { value: new THREE.Vector2() },
      uDpr: { value: 1 },
      uSkyTime: { value: 0 },
      uEvents: { value: 0 },
    }),
    [],
  );
  const geometry = useMemo(() => {
    const random = seededRandom(7104);
    const count = low ? 1000 : 2800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const glows = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions.set(
        [(random() - 0.5) * 2.4, (random() - 0.5) * 2.4, random()],
        i * 3,
      );
      const glow = Math.pow(random(), 5);
      const warm = random() > 0.82;
      colors.set(
        warm
          ? [1, 0.81, 0.6]
          : [0.65 + random() * 0.3, 0.79 + random() * 0.2, 1],
        i * 3,
      );
      sizes[i] = 1 + glow * 2.3 + (glow > 0.96 ? 3 : 0);
      glows[i] = glow;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aGlow", new THREE.BufferAttribute(glows, 1));
    return geo;
  }, [low]);
  useFrame(({ camera, size, gl }, delta) => {
    advanceSkyTime(runtime, delta, !document.hidden);
    const origin = runtime.travel.origin;
    // The sky is distant: only a fraction of the camera's movement reaches it.
    for (const material of [sky.current, stars.current]) {
      if (!material) continue;
      // Update the mounted material: the renderer may copy the uniform map.
      material.uniforms.uLight.value = theme === "light" ? 1 : 0;
      material.uniforms.uAspect.value = size.width / size.height;
      material.uniforms.uDpr.value = gl.getPixelRatio();
      material.uniforms.uSkyTime.value = runtime.skyTime;
      material.uniforms.uEvents.value = runtime.reducedMotion ? 0 : 1;
      material.uniforms.uOffset.value.set(
        origin[0] * 0.0015 + (camera.position.x - origin[0]) * 0.018,
        origin[1] * 0.0015 + (camera.position.y - origin[1]) * 0.018,
      );
    }
  });
  return (
    <>
      <mesh frustumCulled={false} renderOrder={-100}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={sky}
          vertexShader={skyVertex}
          fragmentShader={skyFragment}
          defines={defines}
          uniforms={uniforms}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      <points geometry={geometry} frustumCulled={false} renderOrder={-90}>
        <shaderMaterial
          ref={stars}
          vertexShader={starVertex}
          fragmentShader={starFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
        />
      </points>
    </>
  );
}
