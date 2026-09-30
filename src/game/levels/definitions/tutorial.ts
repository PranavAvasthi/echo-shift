import { RUN_DURATION, SPAWN } from "@/game/core/constants";
import type { LevelDefinition } from "../level.types";

export const tutorial: LevelDefinition = {
  id: "lab00-your-past-remains", name: "YOUR PAST REMAINS", runDuration: RUN_DURATION,
  spawn: SPAWN,
  plates: [{ id: "lab00-plate-a", label: "A", position: { x: -4, y: 0, z: 2 } }],
  door: { id: "lab00-door-a", position: { x: 0, y: 0, z: -5 }, requirements: ["lab00-plate-a"] },
  objective: { id: "lab00-temporal-core", position: { x: 0, y: 1.3, z: -12 } },
  expectedRuns: 2,
};
