import type { Vec3 } from "@/game/player/player.types";

export interface LevelDefinition {
  id: string;
  name: string;
  runDuration: number;
  spawn: Vec3;
  plates: { id: string; label: string; position: Vec3 }[];
  door: { id: string; position: Vec3; requirements: string[] };
  objective: { id: string; position: Vec3 };
  expectedRuns: number;
}
