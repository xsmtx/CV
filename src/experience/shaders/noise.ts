// Seamless object-space noise shared by the mineral and architectural shaders.
export const noiseGLSL = /* glsl */ `
  float hash31(vec3 p) {
    p = fract(p * .1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  float noise3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f*f*(3.-2.*f);
    return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),
                   mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),
                   mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float terrainNoise(vec3 p) {
    #if defined(LOW_DETAIL) && LOW_DETAIL == 1
      return .625*noise3(p) + .3125*noise3(p*2.03+7.1);
    #else
    float n = .5*noise3(p);
    n += .25*noise3(p*2.03+7.1);
    n += .125*noise3(p*4.09+13.7);
    n += .0625*noise3(p*8.21+21.2);
    return n;
    #endif
  }
`;
