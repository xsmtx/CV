import { noiseGLSL } from "./noise";

export const earthFragment = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vLocal;
  uniform sampler2D uLand;
  uniform float uTime;
  uniform float uHorizon;
  uniform float uWire;
  uniform float uImpact;
  uniform float uImpactAge;
  uniform float uQuiet;
  uniform vec3 uImpactPoint;
  ${noiseGLSL}
  float bell(float value,float width) {
    float x=clamp(value/width,-12.,12.);
    return exp(-x*x);
  }
  void main() {
    vec3 globe=normalize(vLocal);
    vec2 uv=vec2(fract(-atan(globe.z,globe.x)/6.283185+.94),asin(clamp(globe.y,-1.,1.))/3.141593+.5);
    float land=smoothstep(.18,.82,texture2D(uLand,uv).r);
    vec3 p=globe*5.;
    float terrain=terrainNoise(p*3.8);
    float latitude=globe.y;
    float desert=bell(latitude-.39,.18)*(.55+.45*noise3(p*2.));
    desert+=bell(latitude+.42,.13)*.55;
    vec3 vegetation=mix(vec3(.018,.028,.024),vec3(.045,.070,.057),terrain);
    vec3 ground=mix(vegetation,vec3(.095,.090,.069),clamp(desert,0.,.94));
    ground+=vec3(.015,.021,.023)*terrain;
    float ice=smoothstep(.84,.96,abs(latitude)+terrain*.035);
    ground=mix(ground,vec3(.20,.27,.31),ice);
    vec3 water=mix(vec3(.004,.009,.020),vec3(.010,.032,.055),terrain*.7);
    vec3 surface=mix(water,ground,land);
    surface=mix(surface,vec3(.25,.33,.37),ice*.9);
    vec3 n=normalize(vNormal);
    vec3 view=normalize(-vPosition);
    vec3 sun=normalize(mix(vec3(.78,.50,.28),vec3(.35,.78,-.48),uHorizon));
    float diffuse=max(dot(n,sun),0.);
    float day=smoothstep(-.14,.28,dot(n,sun));
    vec3 color=surface*(mix(.10,.14,uHorizon)+diffuse*1.15)*mix(mix(.32,.58,uHorizon),1.,day);
    float glint=pow(max(dot(n,normalize(sun+view)),0.),100.);
    color+=vec3(.38,.50,.62)*glint*(1.-land)*.12;
    vec3 wind=p+vec3(uTime*.014,0.,-uTime*.009);
    float cloudBase=terrainNoise(wind*2.8+noise3(wind*1.3)*2.);
    float clouds=smoothstep(.54,.73,cloudBase);
    #if LOW_DETAIL == 0
      clouds*=.7+.3*noise3(wind*18.);
    #endif
    clouds*=1.-smoothstep(.91,.99,abs(latitude));
    color=mix(color,vec3(.18,.23,.28)*(.10+diffuse*.70),clouds*.58);
    float rim=pow(clamp(1.-dot(n,view),0.,1.),3.4);
    color+=vec3(.06,.13,.22)*rim*day*.55;
    float dawn=pow(max(dot(n,normalize(vec3(.35,.94,-.12))),0.),8.);
    color+=vec3(1.,.40,.09)*pow(rim,1.7)*dawn*uHorizon*.48;
    color+=vec3(.04,.12,.25)*rim*uHorizon*.22;
    float settlements=smoothstep(.76,.91,noise3(p*85.))*smoothstep(.57,.79,terrainNoise(p*4.));
    color+=vec3(1.,.49,.13)*settlements*land*(1.-day)*.55;
    if(uImpact>.5&&uImpactAge>=0.) {
      float age=uQuiet>.5?.22:uImpactAge;
      float distance=length(globe-normalize(uImpactPoint))*2.;
      float fade=1.-smoothstep(1.25,2.35,age);
      float heat=bell(distance,.22+age*.085)*exp(-age*.8);
      float wave=bell(distance-(.035+age*.72),.022+age*.018)*exp(-age*1.2)*(1.-uQuiet);
      color+=vec3(1.,.29,.025)*(heat*.95+wave*.58)*fade;
      color+=vec3(1.,.78,.3)*bell(distance,.075)*exp(-age*6.)*(1.-uQuiet);
    }
    vec2 grid=abs(fract(uv*vec2(64.,32.))-.5)/max(fwidth(uv*vec2(64.,32.)),vec2(.0001));
    float wire=1.-min(min(grid.x,grid.y),1.);
    color=mix(color,vec3(.16,.48,.7)*wire,uWire*.8);
    gl_FragColor=vec4(color,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const earthAtmosphereFragment = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float uHorizon;
  void main() {
    vec3 n=normalize(vNormal);
    float rim=pow(clamp(1.-abs(dot(n,normalize(-vPosition))),0.,1.),mix(3.8,5.6,uHorizon));
    float day=max(dot(n,normalize(vec3(.78,.50,.28))),0.);
    float dawn=pow(max(dot(n,normalize(vec3(.35,.94,-.12))),0.),8.);
    vec3 tint=mix(vec3(.17,.30,.43),vec3(1.,.48,.16),dawn*uHorizon);
    gl_FragColor=vec4(tint,rim*(.035+day*.25+dawn*uHorizon*.26));
  }
`;
