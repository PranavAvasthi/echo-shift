import { GameClock } from "./GameClock";
import { SPAWN } from "./constants";
import { PlayerController } from "@/game/player/PlayerController";
import type { PlayerAnimation } from "@/game/player/player.types";

/** Owned by a mounted game, never persisted. Frame-level data bypasses React. */
export class GameRuntime {
  readonly clock = new GameClock();
  readonly controller = new PlayerController();
  readonly position = { ...SPAWN };
  readonly keys = new Set<string>();
  yaw = 0;
  pitch = 0.32;
  jumpQueued = false;
  animation: PlayerAnimation = "idle";
  frameTime = 0;
  drawCalls = 0;
  triangles = 0;

  clearInput() { this.keys.clear(); this.jumpQueued = false; }
  reset() {
    this.clock.reset();
    this.controller.reset();
    Object.assign(this.position, SPAWN);
    this.clearInput();
    this.animation = "idle";
  }
}
