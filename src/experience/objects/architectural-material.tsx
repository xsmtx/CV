"use client";

import { useCallback } from "react";
import * as THREE from "three";

// Detail is evaluated in each box face: repeated racks remain one instanced draw.
export function ArchitecturalMaterial({
  reactor = false,
}: {
  reactor?: boolean;
}) {
  const finish = useCallback(
    (shader: Parameters<THREE.MeshStandardMaterial["onBeforeCompile"]>[0]) => {
      shader.vertexShader = `varying vec2 vPanelUv; varying vec3 vPanelPosition;\n${shader.vertexShader}`;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
      vPanelUv=uv; vPanelPosition=position;
    `,
      );
      shader.fragmentShader = `varying vec2 vPanelUv; varying vec3 vPanelPosition;
      float panelHash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      ${shader.fragmentShader}`;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
      vec2 panel=vPanelUv*vec2(${reactor ? "3.,5." : "3.,16."});
      vec2 cell=fract(panel), id=floor(panel);
      float row=step(.09,cell.y)*step(cell.y,.88);
      float edge=min(min(vPanelUv.x,1.-vPanelUv.x),min(vPanelUv.y,1.-vPanelUv.y));
      float frame=1.-smoothstep(.012,.026,edge);
      float seed=panelHash(id+floor(vPanelPosition.xy*3.));
      float metal=.28+row*.45+seed*.2;
      diffuseColor.rgb*=metal;
      diffuseColor.rgb+=vec3(.16,.2,.23)*frame;
      float slot=step(.15,cell.x)*step(cell.x,.74)*step(.42,cell.y)*step(cell.y,.5);
      diffuseColor.rgb*=1.-slot*.85;
    `,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
      float signal=step(.68,seed)*step(.78,cell.x)*step(cell.x,.91)*step(.28,cell.y)*step(cell.y,.46);
      float circuit=step(.94,seed)*step(.2,cell.x)*step(cell.x,.7)*step(.79,cell.y)*step(cell.y,.85);
      totalEmissiveRadiance+=vec3(.76,.34,.09)*(signal+circuit)*${reactor ? "1.2" : ".75"};
    `,
      );
    },
    [reactor],
  );
  return (
    <meshStandardMaterial
      color="#71808b"
      metalness={0.62}
      roughness={0.48}
      onBeforeCompile={finish}
      customProgramCacheKey={() =>
        reactor ? "reactor-panels-v1" : "server-panels-v1"
      }
    />
  );
}
