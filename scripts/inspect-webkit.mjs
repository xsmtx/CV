import { webkit } from "@playwright/test";
const browser=await webkit.launch();
for(const motion of ["no-preference","reduce"]) {
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:motion});
  await page.goto("http://localhost:4173/#projects",{waitUntil:"networkidle"});
  await page.waitForTimeout(7000);
  console.log(motion,await page.locator(".coordinates").textContent(),await page.locator("canvas").evaluate(el=>({...el.dataset})));
  console.log(await page.locator("canvas").evaluate(canvas=>{const gl=canvas.getContext("webgl2");const ext=gl.getExtension("WEBGL_debug_renderer_info");return {renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):"unknown",pixel:canvas.toDataURL().slice(0,100)};}));
  await page.screenshot({path:`qa/webkit-inspect-${motion}.png`});
  if(motion==="no-preference") {await page.getByRole("button",{name:"Pause motion",exact:true}).click();await page.waitForTimeout(500);await page.screenshot({path:"qa/webkit-paused.png"});}
  await page.close();
}
await browser.close();
