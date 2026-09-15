import { writeFile } from "node:fs/promises";

// Static vector counterpart of the procedural sky, used before/without WebGL.
for (const theme of ["night", "day"]) {
  let seed = 7104;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const light = theme === "day";
  const stars = Array.from({ length: 850 }, () => {
    const x = (random() * 1800).toFixed(1),
      y = (random() * 1100).toFixed(1);
    const glow = Math.pow(random(), 6),
      radius = (0.45 + glow * 1.1).toFixed(2);
    const color = light ? "#405971" : random() > 0.82 ? "#ebc298" : "#d5e6f4";
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" opacity="${((light ? 0.2 : 0.38) + glow * 0.5).toFixed(2)}"/>${glow > 0.94 ? `<circle cx="${x}" cy="${y}" r="${(glow * 4).toFixed(1)}" fill="url(#star)"/>` : ""}`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 1100">
  <defs>
    <radialGradient id="blue"><stop stop-color="${light ? "#aabdcf" : "#294f73"}" stop-opacity=".8"/><stop offset="1" stop-color="${light ? "#edf1f3" : "#070b16"}" stop-opacity="0"/></radialGradient>
    <radialGradient id="violet"><stop stop-color="${light ? "#c3bccc" : "#514064"}" stop-opacity=".65"/><stop offset="1" stop-color="${light ? "#edf1f3" : "#070b16"}" stop-opacity="0"/></radialGradient>
    <radialGradient id="star"><stop stop-color="${light ? "#71869b" : "#d9e7f2"}" stop-opacity=".55"/><stop offset="1" stop-color="${light ? "#71869b" : "#d9e7f2"}" stop-opacity="0"/></radialGradient>
    <radialGradient id="galaxy"><stop stop-color="${light ? "#abb7c6" : "#d7c2a4"}"/><stop offset=".13" stop-color="${light ? "#c1ced9" : "#648ba2"}" stop-opacity=".5"/><stop offset="1" stop-color="${light ? "#edf1f3" : "#254261"}" stop-opacity="0"/></radialGradient>
    <filter id="cloud"><feTurbulence type="fractalNoise" baseFrequency=".008 .014" numOctaves="3" seed="17"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1.4 -.25"/></filter>
    <mask id="dust"><rect width="1800" height="1100" filter="url(#cloud)"/></mask>
  </defs>
  <path fill="${light ? "#edf1f3" : "#070b16"}" d="M0 0h1800v1100H0z"/>
  <g mask="url(#dust)">
    <ellipse cx="1090" cy="440" rx="930" ry="255" transform="rotate(-26 1090 440)" fill="url(#blue)"/>
    <ellipse cx="1210" cy="170" rx="560" ry="330" fill="url(#violet)"/>
    <ellipse cx="540" cy="750" rx="610" ry="260" transform="rotate(-26 540 750)" fill="url(#blue)"/>
  </g>
  <ellipse cx="1405" cy="185" rx="62" ry="16" transform="rotate(-27 1405 185)" fill="url(#galaxy)" opacity=".8"/>
  ${stars}
  </svg>`;
  await writeFile(`public/assets/cosmos-${theme}.svg`, svg);
  console.log(`Created cosmos-${theme}.svg`);
}
