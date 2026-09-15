import { readFile, writeFile, mkdir } from "node:fs/promises";

const file = new URL("./data/ne_110m_land.geojson", import.meta.url);
const world = JSON.parse(await readFile(file, "utf8"));
const paths = world.features.flatMap(({ geometry }) =>
  (geometry.type === "Polygon"
    ? [geometry.coordinates]
    : geometry.coordinates
  ).map((polygon) =>
    polygon
      .map(
        (ring) =>
          ring
            .map(
              ([longitude, latitude], i) =>
                `${i ? "L" : "M"}${(((longitude + 180) * 2048) / 360).toFixed(2)},${(((90 - latitude) * 1024) / 180).toFixed(2)}`,
            )
            .join("") + "Z",
      )
      .join(""),
  ),
);
await mkdir("public/assets", { recursive: true });
for (const [name, sea, land] of [
  ["land", "#000", "#fff"],
  ["map", "#115782", "#668167"],
]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="1024" viewBox="0 0 2048 1024"><path fill="${sea}" d="M0 0h2048v1024H0z"/><g fill="${land}" fill-rule="evenodd">${paths.map((d) => `<path d="${d}"/>`).join("")}</g></svg>`;
  await writeFile(`public/assets/earth-${name}.svg`, svg);
}
