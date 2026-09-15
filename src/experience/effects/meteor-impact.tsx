"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { seededRandom, type WorldRuntime } from "@/experience/runtime";
import { METEOR_FLIGHT } from "@/experience/meteor";
import type { Theme } from "@/lib/theme";

const quadVertex = /* glsl */ `
  varying vec2 vUv;
  void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
`;
const trailFragment = /* glsl */ `
  varying vec2 vUv;
  void main(){
    float x=(vUv.x-.5)*2.;
    float fade=pow(clamp(1.-vUv.y,0.,1.),1.5);
    float alpha=exp(-x*x*11.)*fade;
    vec3 color=mix(vec3(1.,.27,.035),vec3(1.,.88,.5),fade);
    gl_FragColor=vec4(color,alpha*.9);
  }
`;
const flashFragment = /* glsl */ `
  varying vec2 vUv;
  uniform float uAge;
  void main(){
    vec2 p=(vUv-.5)*2.;float r=length(p);
    if(r>1.)discard;
    float core=exp(-r*r*28.);
    float halo=exp(-r*r*5.)*.45;
    float alpha=(core+halo)*exp(-uAge*7.);
    gl_FragColor=vec4(mix(vec3(1.,.32,.035),vec3(1.,.94,.7),core),alpha);
  }
`;
const debrisVertex = /* glsl */ `
  attribute vec3 aVelocity;
  attribute float aSize;
  attribute float aLife;
  uniform float uAge;
  uniform float uDpr;
  varying float vFade;
  void main(){
    float age=max(uAge,0.);
    vec3 p=aVelocity*age+vec3(0.,0.,-.85*age*age);
    vec4 mv=modelViewMatrix*vec4(p,1.);
    gl_Position=projectionMatrix*mv;
    gl_PointSize=aSize*uDpr*clamp(9./max(-mv.z,.1),.4,2.);
    vFade=(1.-smoothstep(aLife*.45,aLife,age))*step(0.,uAge);
  }
`;
const debrisFragment = /* glsl */ `
  varying float vFade;
  void main(){
    float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;
    gl_FragColor=vec4(mix(vec3(1.,.32,.045),vec3(1.,.82,.4),vFade),exp(-r*r*4.)*vFade);
  }
`;

export function MeteorImpact({
  runtime,
  target,
  low,
  theme,
}: {
  runtime: WorldRuntime;
  target: THREE.Vector3;
  low: boolean;
  theme: Theme;
}) {
  const root = useRef<THREE.Group>(null);
  const meteor = useRef<THREE.Mesh>(null);
  const trail = useRef<THREE.Mesh>(null);
  const flash = useRef<THREE.Mesh>(null);
  const debris = useRef<THREE.Points>(null);
  const flashMaterial = useRef<THREE.ShaderMaterial>(null);
  const debrisMaterial = useRef<THREE.ShaderMaterial>(null);
  const seen = useRef(0);
  const work = useMemo(
    () => ({
      inverse: new THREE.Matrix4(),
      basis: new THREE.Matrix4(),
      ray: new THREE.Ray(),
      raycaster: new THREE.Raycaster(),
      sphere: new THREE.Sphere(new THREE.Vector3(), 2.015),
      pointer: new THREE.Vector2(),
      eye: new THREE.Vector3(),
      right: new THREE.Vector3(),
      up: new THREE.Vector3(),
      normal: new THREE.Vector3(),
      start: new THREE.Vector3(),
      direction: new THREE.Vector3(),
      position: new THREE.Vector3(),
      side: new THREE.Vector3(),
      forward: new THREE.Vector3(),
      rotation: new THREE.Quaternion(),
      z: new THREE.Vector3(0, 0, 1),
    }),
    [],
  );
  const flashUniforms = useMemo(() => ({ uAge: { value: 0 } }), []);
  const debrisUniforms = useMemo(
    () => ({ uAge: { value: -1 }, uDpr: { value: 1 } }),
    [],
  );
  const geometry = useMemo(() => {
    const random = seededRandom(190);
    const count = low ? 22 : 42;
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const lives = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2;
      const speed = 0.25 + random() * 0.9;
      velocities.set(
        [
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          0.7 + random() * 1.35,
        ],
        i * 3,
      );
      sizes[i] = 1.8 + random() * 3.2;
      lives[i] = 0.85 + random() * 1.35;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(count * 3), 3),
    );
    geo.setAttribute("aVelocity", new THREE.BufferAttribute(velocities, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aLife", new THREE.BufferAttribute(lives, 1));
    return geo;
  }, [low]);
  useFrame(({ camera, gl }) => {
    const effect = root.current;
    if (
      !effect ||
      !meteor.current ||
      !trail.current ||
      !flash.current ||
      !debris.current
    )
      return;
    effect.visible = runtime.impact.active && runtime.scene === 0;
    if (!effect.visible) return;
    effect.updateWorldMatrix(true, false);
    work.inverse.copy(effect.matrixWorld).invert();
    work.eye.copy(camera.position).applyMatrix4(work.inverse);
    if (seen.current !== runtime.impact.serial) {
      seen.current = runtime.impact.serial;
      work.pointer.set(runtime.impact.pointer.x, runtime.impact.pointer.y);
      work.raycaster.setFromCamera(work.pointer, camera);
      work.ray.copy(work.raycaster.ray).applyMatrix4(work.inverse);
      work.right
        .setFromMatrixColumn(camera.matrixWorld, 0)
        .transformDirection(work.inverse);
      work.up
        .setFromMatrixColumn(camera.matrixWorld, 1)
        .transformDirection(work.inverse);
      if (!work.ray.intersectSphere(work.sphere, target))
        target
          .copy(work.eye)
          .normalize()
          .addScaledVector(work.right, 0.27)
          .addScaledVector(work.up, 0.28)
          .normalize()
          .multiplyScalar(2.015);
      work.normal.copy(target).normalize();
      work.direction
        .copy(work.right)
        .multiplyScalar(0.7)
        .addScaledVector(work.up, 0.9)
        .addScaledVector(work.normal, 1.2);
      work.direction
        .addScaledVector(
          work.normal,
          Math.max(0, 1.1 - work.direction.dot(work.normal)),
        )
        .normalize();
      // Keep the approach in view, including on narrow screens. The outward
      // component keeps the meteor above the surface until the actual hit.
      let distance = 3.8;
      for (let attempt = 0; attempt < 9; attempt++) {
        work.start.copy(target).addScaledVector(work.direction, distance);
        work.position
          .copy(work.start)
          .applyMatrix4(effect.matrixWorld)
          .project(camera);
        if (
          Math.abs(work.position.x) < 0.88 &&
          Math.abs(work.position.y) < 0.82
        )
          break;
        distance *= 0.8;
      }
      debris.current.position.copy(target);
      debris.current.quaternion.setFromUnitVectors(work.z, work.normal);
    }
    const age = runtime.impact.age;
    const after = age - METEOR_FLIGHT;
    const moving = !runtime.impact.quiet;
    meteor.current.visible = trail.current.visible = moving && after < 0;
    flash.current.visible = moving && after >= 0 && after < 0.8;
    debris.current.visible = moving && after >= 0 && after < 2.3;
    if (after < 0 && moving) {
      const t = Math.min(1, age / METEOR_FLIGHT);
      work.position.lerpVectors(work.start, target, t * (0.65 + 0.35 * t));
      meteor.current.position.copy(work.position);
      meteor.current.rotation.set(age * 7, age * 5, age * 9);
      const length = 0.75 + t * 0.7;
      work.forward.copy(work.eye).sub(work.position).normalize();
      work.side.crossVectors(work.direction, work.forward).normalize();
      work.forward.crossVectors(work.side, work.direction).normalize();
      work.basis.makeBasis(work.side, work.direction, work.forward);
      trail.current.quaternion.setFromRotationMatrix(work.basis);
      trail.current.position
        .copy(work.position)
        .addScaledVector(work.direction, length * 0.5);
      trail.current.scale.set(0.16, length, 1);
    }
    if (after >= 0 && moving) {
      effect.getWorldQuaternion(work.rotation).invert();
      flash.current.quaternion.copy(work.rotation).multiply(camera.quaternion);
      flash.current.position.copy(target).addScaledVector(work.normal, 0.05);
      flash.current.scale.setScalar(0.48 + Math.min(after, 0.45) * 1.5);
      if (flashMaterial.current)
        flashMaterial.current.uniforms.uAge.value = after;
      if (debrisMaterial.current) {
        debrisMaterial.current.uniforms.uAge.value = after;
        debrisMaterial.current.uniforms.uDpr.value = gl.getPixelRatio();
      }
    }
  }, -0.5);
  const blending =
    theme === "light" ? THREE.NormalBlending : THREE.AdditiveBlending;
  return (
    <group ref={root} visible={false}>
      <mesh ref={meteor}>
        <icosahedronGeometry args={[0.065, 1]} />
        <meshBasicMaterial color="#ffd08a" />
      </mesh>
      <mesh ref={trail}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          vertexShader={quadVertex}
          fragmentShader={trailFragment}
          transparent
          depthWrite={false}
          blending={blending}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={flash}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={flashMaterial}
          vertexShader={quadVertex}
          fragmentShader={flashFragment}
          uniforms={flashUniforms}
          transparent
          depthWrite={false}
          blending={blending}
        />
      </mesh>
      <points ref={debris} geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={debrisMaterial}
          vertexShader={debrisVertex}
          fragmentShader={debrisFragment}
          uniforms={debrisUniforms}
          transparent
          depthWrite={false}
          blending={blending}
        />
      </points>
    </group>
  );
}
