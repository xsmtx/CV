// Screen-space astronomical backdrop, shared with the star occlusion mask.
export const gargantuaPositionGLSL = /* glsl */ `
  vec2 gargantuaPosition(vec2 p) {
    float wide=smoothstep(.75,1.2,uAspect);
    float horizontal=mix(.66,.83,wide);
    vec2 center=vec2((horizontal-.5)*uAspect,mix(.33,.26,wide));
    vec2 q=(p-center)/min(.045,uAspect*.075);
    return mat2(.995,-.1,.1,.995)*q;
  }
  float gargantuaShadow(vec2 q) {
    return 1.-smoothstep(.49,.545,length(q));
  }
`;

export const gargantuaGLSL = /* glsl */ `
  ${gargantuaPositionGLSL}
  vec4 gargantua(vec2 p,float time) {
    vec2 q=gargantuaPosition(p);
    if(abs(q.x)>3.2||abs(q.y)>1.4)return vec4(0.);
    float r=length(q);
    float extent=1.-smoothstep(1.6,2.9,abs(q.x));
    float disk=skyGaussian(q.y+.045,.035+.012*abs(q.x))*extent;
    float diskGlow=skyGaussian(q.y+.045,.145)*extent;
    float upper=smoothstep(-.04,.18,q.y);
    float lensed=skyGaussian(r-.71,.057)*upper;
    float outer=skyGaussian(r-.79,.065)*upper*.16;
    float lower=skyGaussian(r-.585,.022)*(1.-smoothstep(-.15,.03,q.y));
    float photon=skyGaussian(r-.545,.008);
    float grain=.78+.22*noise(vec2(q.x*8.+time*.045,q.y*34.));
    #if LOW_DETAIL == 0
      grain*=.88+.12*sin(q.x*61.+q.y*37.+time*.12);
    #endif
    float beaming=.8+.2*smoothstep(-1.2,1.2,-q.x);
    vec3 amber=vec3(1.,.53,.2);
    vec3 hot=vec3(1.,.86,.63);
    vec3 light=amber*(diskGlow*.18+outer+lower*.3);
    light+=mix(amber,hot,.68)*(disk*.63+lensed*.66)*grain*beaming;
    light+=hot*photon*.18;
    return vec4(light,gargantuaShadow(q));
  }
`;
