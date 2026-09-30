import { GameClock } from "./GameClock";
import { SPAWN } from "./constants";
import { PlayerController } from "@/game/player/PlayerController";
import type { PlayerAnimation } from "@/game/player/player.types";
import { ReplayRecorder } from "@/game/replay/ReplayRecorder";
import { RunTimeline } from "@/game/replay/RunTimeline";
import { ReplayPlayer } from "@/game/replay/ReplayPlayer";
import type { PlayerPose, RunEndReason } from "@/game/replay/replay.types";

/** Owned by a mounted game, never persisted. Frame-level data bypasses React. */
export class GameRuntime {
  readonly clock = new GameClock();
  readonly controller = new PlayerController();
  readonly recorder = new ReplayRecorder();
  readonly timeline = new RunTimeline();
  readonly position = { ...SPAWN };
  readonly keys = new Set<string>();
  echoes: ReplayPlayer[] = [];
  yaw = 0;
  pitch = 0.32;
  jumpQueued = false;
  animation: PlayerAnimation = "idle";
  frameTime = 0;
  drawCalls = 0;
  triangles = 0;

  constructor() { this.recorder.start(1, "lab00-calibration", this.pose()); }

  pose(): PlayerPose {
    const halfHeading = this.controller.heading * .5;
    return {
      position: this.position,
      rotation: { x: 0, y: Math.sin(halfHeading), z: 0, w: Math.cos(halfHeading) },
      velocity: this.controller.velocity,
      animation: this.animation,
    };
  }

  capture(endReason: RunEndReason) { this.timeline.append(this.recorder.finish(endReason)); }

  clearInput() { this.keys.clear(); this.jumpQueued = false; }
  reset(runId = 1) {
    this.clock.reset();
    this.controller.reset();
    Object.assign(this.position, SPAWN);
    this.clearInput();
    this.animation = "idle";
    if (runId === 1) this.timeline.clear();
    this.echoes = this.timeline.recordings.map((run) => new ReplayPlayer(run));
    this.recorder.start(runId, "lab00-calibration", this.pose());
  }
}
