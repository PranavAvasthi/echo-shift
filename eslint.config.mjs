import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ["src/game/player/Player.tsx", "src/game/player/PlayerCamera.tsx"],
    // R3F/Rapier callbacks intentionally mutate externally owned Three.js and
    // simulation objects. They are not React render state or immutable props.
    rules: { "react-hooks/immutability": "off" },
  },
  globalIgnores([".next/**", "out/**", "next-env.d.ts", "test-results/**", "playwright-report/**"]),
]);
