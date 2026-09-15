import { noiseGLSL } from "./noise";

export const planetVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vLocal;
  void main() {
    vUv = uv;
    vLocal = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vPosition = mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const planetFragment = /* glsl */ `
  precision highp float;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vLocal;
  uniform float uTime;
  uniform float uWire;
  uniform float uSeed;
  uniform float uWarm;
  ${noiseGLSL}
  void main() {
    vec3 p = normalize(vLocal)*3.2 + uSeed;
    float continent = terrainNoise(p*1.7);
    #if LOW_DETAIL == 1
      float strata = noise3(p*8.+continent*3.)*.75;
    #else
      float strata = terrainNoise(p*8. + continent*3.);
    #endif
    float footprint = max(length(dFdx(p)),length(dFdy(p)));
    float micro = 1.-smoothstep(.004,.025,footprint);
    #if LOW_DETAIL == 1
      float grit = .5;
    #else
      float grit = mix(.5,noise3(p*145.),micro);
    #endif
    float ridge = 1.-abs(strata*2.-1.);
    float elevation = continent*.42 + strata*.32 + grit*.018;
    // Surface relief follows the actual geometry without a UV seam.
    vec3 n = normalize(vNormal);
    vec3 dx = dFdx(vPosition), dy = dFdy(vPosition);
    vec3 rx = cross(dy,n), ry = cross(n,dx);
    float det = dot(dx,rx);
    vec3 gradient = sign(det)*(dFdx(elevation)*rx + dFdy(elevation)*ry);
    vec3 rockNormal = normalize(abs(det)*n - gradient*(.026+micro*.064));
    vec3 view = normalize(-vPosition);
    vec3 sun = normalize(vec3(.85,.72,.32));
    float diffuse = max(dot(rockNormal,sun),0.);
    float daylight = smoothstep(-.16,.65,dot(n,sun));
    float rim = pow(1.-max(dot(n,view),0.),4.8);
    vec3 mineral = mix(vec3(.018,.026,.032),vec3(.15,.18,.19),smoothstep(.28,.74,continent+strata*.3));
    mineral = mix(mineral,mineral*vec3(1.35,1.04,.73),uWarm*.55);
    vec3 color = mineral*(.035+pow(diffuse,2.)*.64)*(.42+ridge*.58);
    float specular = pow(max(dot(reflect(-sun,rockNormal),view),0.),24.);
    color += vec3(.43,.53,.6)*specular*.16*daylight;
    color += vec3(.52,.69,.8)*rim*daylight*(.24+strata*.9);
    #if LOW_DETAIL == 1
      float clusters = smoothstep(.62,.84,noise3(p*4.+17.));
    #else
      float clusters = smoothstep(.58,.76,terrainNoise(p*4.+17.));
    #endif
    float lights = smoothstep(.79,.92,noise3(p*105.))*clusters;
    color += vec3(1.,.46,.12)*lights*(1.-daylight*.75)*(.8+uWarm*1.4);
    vec2 grid = abs(fract(vUv*vec2(64.,32.))-.5)/max(fwidth(vUv*vec2(64.,32.)),vec2(.0001));
    float wire = 1.-min(min(grid.x,grid.y),1.);
    color = mix(color,vec3(.25,.38,.45)*wire,uWire*.85);
    gl_FragColor = vec4(color,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const atmosphereFragment = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 n = normalize(vNormal);
    float rim = pow(1.-abs(dot(n,normalize(-vPosition))),5.);
    float light = pow(max(dot(n,normalize(vec3(.85,.72,.22))),0.),1.4);
    gl_FragColor = vec4(vec3(.52,.7,.82),rim*light*.58);
  }
`;
