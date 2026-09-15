import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // The renderer is an imperative Three.js engine. Its shared runtime, uniforms
  // and buffers are intentionally mutated outside React's render cycle.
  {
    files: ["src/experience/**/*.tsx", "src/components/portfolio.tsx"],
    rules: { "react-hooks/immutability": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "next-env.d.ts",
    "test-results/**",
    "playwright-report/**",
  ]),
]);
