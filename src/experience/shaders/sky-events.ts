// These events are shaded behind the scene's depth, never over its models.
export const skyEventsGLSL = /* glsl */ `
  float skyGaussian(float distance,float width) {
    // Multiplication is defined for signed distances; pow(x, 2.) is not.
    float scaled=clamp(distance/width,-12.,12.);
    return exp(-scaled*scaled);
  }
  vec3 shootingStar(vec2 p,float time) {
    float cycle=floor(time/9.);
    float age=mod(time,9.)-2.1-hash(vec2(cycle,27.3))*1.4;
    if(age<0.||age>1.7)return vec3(0.);
    vec2 start=vec2((.67+hash(vec2(cycle,4.1))*.28-.5)*uAspect,.32+hash(vec2(cycle,8.7))*.11);
    vec2 travel=vec2(-.34*uAspect,-.18);
    vec2 direction=normalize(travel);
    vec2 head=start+travel*(age/1.7);
    vec2 q=p-head;
    float tailLength=.15*min(uAspect,1.4);
    float along=clamp(dot(q,-direction),0.,tailLength);
    float distance=length(q+direction*along);
    if(distance>.024)return vec3(0.);
    // Subtract before division and clamp to avoid a negative pow base at
    // the tail edge: a tiny rounding error otherwise blackens the sky.
    float taper=pow(clamp((tailLength-along)/tailLength,0.,1.),1.6);
    float tail=skyGaussian(distance,.0012)*taper;
    float haze=skyGaussian(distance,.004)*taper*.16;
    float nucleus=skyGaussian(length(q),.0032);
    float fade=smoothstep(0.,.2,age)*(1.-smoothstep(1.1,1.7,age));
    return (vec3(.62,.8,1.)*(tail*.7+haze)+vec3(.92,.96,1.)*nucleus*.7)*fade;
  }
  vec3 stellarBloom(vec2 p,float time) {
    float cycle=floor(time/22.);
    float age=mod(time,22.)-6.-hash(vec2(cycle,32.1))*3.;
    if(age<0.||age>3.8)return vec3(0.);
    vec2 center=vec2((.56+hash(vec2(cycle,9.4))*.32-.5)*uAspect,.29+hash(vec2(cycle,15.7))*.14);
    vec2 q=p-center;
    float d=length(q);
    if(d>.13)return vec3(0.);
    float progress=age/3.8;
    float fade=smoothstep(0.,.3,age)*(1.-smoothstep(1.8,3.8,age));
    float radius=.007+.052*progress*(2.-progress);
    float ring=skyGaussian(d-radius,.0011+progress*.0015);
    float glow=exp(-d*d/(.00012+progress*.0008))*exp(-age*1.8);
    float nucleus=exp(-d*d/.000015)*exp(-age*2.5);
    vec3 light=vec3(.47,.69,1.)*ring*.25+vec3(.82,.65,.47)*glow*.4+vec3(1.,.88,.7)*nucleus*.75;
    #if LOW_DETAIL == 1
      const int COUNT=6;
    #else
      const int COUNT=10;
    #endif
    for(int i=0;i<COUNT;i++) {
      float seed=float(i)+cycle*13.;
      float angle=hash(vec2(seed,6.3))*6.283185;
      float distance=(.018+hash(vec2(seed,2.7))*.075)*pow(progress,.65);
      vec2 particle=vec2(cos(angle),sin(angle))*distance;
      float size=.001+hash(vec2(seed,18.))* .0007;
      light+=vec3(.67,.8,1.)*skyGaussian(length(q-particle),size)*.4;
    }
    return light*fade;
  }
`;
