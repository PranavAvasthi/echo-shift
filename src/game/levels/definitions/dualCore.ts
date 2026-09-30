import { SPAWN } from "@/game/core/constants";
import type { LevelDefinition } from "../level.types";

export const dualCore: LevelDefinition = {
  id: "lab01-dual-core", name: "DUAL CORE", runDuration: 40, spawn: SPAWN,
  plates: [
    { id: "lab01-plate-a", label: "A", position: { x: -4, y: 0, z: 2 } },
    { id: "lab01-plate-b", label: "B", position: { x: 4, y: 0, z: 2 } },
  ],
  door: { id: "lab01-main-gate", position: { x: 0, y: 0, z: -5 }, requirements: ["lab01-plate-a", "lab01-plate-b"] },
  objective: { id: "lab01-temporal-core", position: { x: 0, y: 1.3, z: -12 } },
  expectedRuns: 3,
};
