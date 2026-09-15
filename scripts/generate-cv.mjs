import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { profile } from "../src/data/profile.ts";
import { experience } from "../src/data/experience.ts";
import { systems } from "../src/data/systems.ts";
import { projects } from "../src/data/projects.ts";

// Node 24+. Python dependencies: reportlab. Uses public portfolio data only.
await mkdir("qa/cv", { recursive: true });
await mkdir("public/downloads", { recursive: true });
await writeFile(
  "qa/cv/content.json",
  JSON.stringify({ profile, experience, systems, projects }),
);
const result = spawnSync(
  process.env.PYTHON || "python",
  [
    "scripts/generate-cv.py",
    "qa/cv/content.json",
    "public/downloads/Samet-Kabakci-CV.pdf",
  ],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
