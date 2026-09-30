import type { PlayerAnimation, QuaternionValue, Vec3 } from "@/game/player/player.types";

export interface PlayerPose {
  position: Vec3;
  rotation: QuaternionValue;
  velocity: Vec3;
  animation: PlayerAnimation;
}

export interface RecordedFrame extends PlayerPose { time: number }

/** Puzzle-critical events are independent of sampling, so no short action is lost. */
export type ReplayAction =
  | { type: "PRESS_SWITCH"; entityId: string }
  | { type: "PICKUP"; entityId: string }
  | { type: "DROP"; entityId: string; position: Vec3 }
  | { type: "ACTIVATE"; entityId: string };

export interface RecordedAction { time: number; action: ReplayAction }
export type RunEndReason = "manual" | "timeout" | "levelComplete";

export interface RecordedRun {
  readonly runId: number;
  readonly levelId: string;
  readonly sampleRate: number;
  readonly duration: number;
  readonly endReason: RunEndReason;
  readonly frames: readonly RecordedFrame[];
  readonly actions: readonly RecordedAction[];
}
