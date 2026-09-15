import { noiseGLSL } from "./noise";

export const earthFragment = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vLocal;
  uniform sampler2D uLand;
  uniform float uTime;
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
    vec3 vegetation=mix(vec3(.025,.075,.026),vec3(.11,.19,.065),terrain);
    vec3 ground=mix(vegetation,vec3(.36,.265,.13),clamp(desert,0.,.94));
    ground+=vec3(.055,.045,.027)*terrain;
    float ice=smoothstep(.84,.96,abs(latitude)+terrain*.035);
    ground=mix(ground,vec3(.64,.74,.76),ice);
    vec3 water=mix(vec3(.006,.034,.10),vec3(.015,.13,.26),terrain*.7);
    vec3 surface=mix(water,ground,land);
    surface=mix(surface,vec3(.72,.82,.86),ice*.9);
    vec3 n=normalize(vNormal);
    vec3 view=normalize(-vPosition);
    vec3 sun=normalize(vec3(.48,.58,.78));
    float diffuse=max(dot(n,sun),0.);
    float day=smoothstep(-.14,.28,dot(n,sun));
    vec3 color=surface*(.09+diffuse*1.8)*mix(.32,1.,day);
    float glint=pow(max(dot(n,normalize(sun+view)),0.),100.);
    color+=vec3(.8,.9,1.)*glint*(1.-land)*.42;
    vec3 wind=p+vec3(uTime*.014,0.,-uTime*.009);
    float cloudBase=terrainNoise(wind*2.8+noise3(wind*1.3)*2.);
    float clouds=smoothstep(.54,.73,cloudBase);
    #if LOW_DETAIL == 0
      clouds*=.7+.3*noise3(wind*18.);
    #endif
    clouds*=1.-smoothstep(.91,.99,abs(latitude));
    color=mix(color,vec3(.8,.87,.91)*(.14+diffuse*1.3),clouds*.88);
    float rim=pow(clamp(1.-dot(n,view),0.,1.),3.4);
    color+=vec3(.07,.29,.65)*rim*day*.8;
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
  void main() {
    vec3 n=normalize(vNormal);
    float rim=pow(clamp(1.-abs(dot(n,normalize(-vPosition))),0.,1.),3.8);
    float day=max(dot(n,normalize(vec3(.48,.58,.78))),0.);
    gl_FragColor=vec4(vec3(.2,.53,1.),rim*(.12+day*.62));
  }
`;
