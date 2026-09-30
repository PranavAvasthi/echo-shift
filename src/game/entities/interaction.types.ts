import type { Vec3 } from "@/game/player/player.types";

export interface InteractionSource {
  id: string;
  type: "player" | "echo";
  runId: number;
}
export interface InteractionActor { source: InteractionSource; position: Vec3 }
export interface PlateSnapshot { id: string; label: string; active: boolean; occupants: string[] }
export interface PuzzleSnapshot {
  plates: PlateSnapshot[];
  doorOpen: boolean;
  canActivate: boolean;
  hint: string;
  echoCount: number;
}

export const EMPTY_PUZZLE: PuzzleSnapshot = {
  plates: [], doorOpen: false, canActivate: false,
  hint: "Reach the core. Find the cyan pressure plate.", echoCount: 0,
};
