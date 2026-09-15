import { chromium, webkit } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { skyEventsGLSL } from "../src/experience/shaders/sky-events.ts";

await mkdir("qa/sky-fix", { recursive: true });
const reports = [];
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch(
    engine === chromium ? { channel: "chrome" } : {},
  );
  const page = await browser.newPage();
  const result = await page.evaluate((events) => {
    const canvas = document.createElement("canvas");
    canvas.width = 192;
    canvas.height = 128;
    const gl = canvas.getContext("webgl2");
    if (!gl || !gl.getExtension("EXT_color_buffer_float"))
      throw new Error("Float render target unavailable");
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debug
      ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
      : "unknown";
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA32F,
      192,
      128,
      0,
      gl.RGBA,
      gl.FLOAT,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    const target = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, target);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
      throw new Error("Incomplete render target");
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    };
    const vertex = compile(
      gl.VERTEX_SHADER,
      `#version 300 es
      void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.-1.,0.,1.);}`,
    );
    const cases = [];
    const pixels = new Float32Array(192 * 128 * 4);
    for (const precision of ["highp", "mediump"])
      for (const low of [0, 1]) {
        const fragment = compile(
          gl.FRAGMENT_SHADER,
          `#version 300 es
        precision ${precision} float;
        #define LOW_DETAIL ${low}
        uniform float uAspect;
        uniform float time;
        out vec4 color;
        float hash(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
        ${events}
        void main(){vec2 p=(gl_FragCoord.xy/vec2(192.,128.)-.5)*vec2(uAspect,1.);color=vec4(vec3(.07,.1,.16)+shootingStar(p,time)+stellarBloom(p,time),1.);}`,
        );
        const program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
          throw new Error(gl.getProgramInfoLog(program));
        gl.useProgram(program);
        for (const aspect of [390 / 844, 1, 1.6, 1920 / 1080, 2560 / 1080]) {
          gl.uniform1f(gl.getUniformLocation(program, "uAspect"), aspect);
          let invalid = 0,
            darkened = 0,
            activeFrames = 0,
            firstFailure = null;
          for (let time = 0; time < 48; time += 0.47) {
            gl.uniform1f(gl.getUniformLocation(program, "time"), time);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            gl.readPixels(0, 0, 192, 128, gl.RGBA, gl.FLOAT, pixels);
            let active = false;
            for (let i = 0; i < pixels.length; i += 4) {
              const rgb = [pixels[i], pixels[i + 1], pixels[i + 2]];
              if (rgb.some((v) => !Number.isFinite(v))) {
                invalid++;
                firstFailure ??= time;
              } else if (rgb[0] < 0.068 || rgb[1] < 0.098 || rgb[2] < 0.158) {
                darkened++;
                firstFailure ??= time;
              }
              if (rgb[0] > 0.09) active = true;
            }
            if (active) activeFrames++;
          }
          cases.push({
            precision,
            low,
            aspect,
            invalid,
            darkened,
            activeFrames,
            firstFailure,
          });
        }
        gl.deleteProgram(program);
        gl.deleteShader(fragment);
      }
    if (gl.getError() !== gl.NO_ERROR)
      throw new Error("WebGL error during pixel check");
    return { renderer, cases };
  }, skyEventsGLSL);
  reports.push({ engine: engine.name(), ...result });
  console.log(
    JSON.stringify({
      engine: engine.name(),
      cases: result.cases.length,
      invalidPixels: result.cases.reduce((total, c) => total + c.invalid, 0),
      darkenedPixels: result.cases.reduce((total, c) => total + c.darkened, 0),
    }),
  );
  await browser.close();
}
await writeFile("qa/sky-fix/numerics.json", JSON.stringify(reports, null, 2));
if (
  reports.some((r) =>
    r.cases.some((c) => c.invalid || c.darkened || !c.activeFrames),
  )
)
  process.exitCode = 1;
