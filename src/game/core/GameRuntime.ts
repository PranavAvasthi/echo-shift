import { GameClock } from "./GameClock";
import { SPAWN } from "./constants";
import { PlayerController } from "@/game/player/PlayerController";
import type { PlayerAnimation } from "@/game/player/player.types";
import { ReplayRecorder } from "@/game/replay/ReplayRecorder";
import { RunTimeline } from "@/game/replay/RunTimeline";
import { ReplayPlayer } from "@/game/replay/ReplayPlayer";
import type { PlayerPose, RunEndReason } from "@/game/replay/replay.types";
import { PuzzleWorld } from "@/game/entities/PuzzleWorld";
import type { InteractionActor } from "@/game/entities/interaction.types";
import { tutorial } from "@/game/levels/definitions/tutorial";

/** Owned by a mounted game, never persisted. Frame-level data bypasses React. */
export class GameRuntime {
  readonly clock = new GameClock();
  readonly controller = new PlayerController();
  readonly recorder = new ReplayRecorder();
  readonly timeline = new RunTimeline();
  readonly world = new PuzzleWorld(tutorial);
  readonly position = { ...SPAWN };
  readonly keys = new Set<string>();
  private readonly playerActor: InteractionActor = { source: { id: "player-1", type: "player", runId: 1 }, position: this.position };
  private actors: InteractionActor[] = [this.playerActor];
  echoes: ReplayPlayer[] = [];
  yaw = 0;
  pitch = 0.32;
  jumpQueued = false;
  interactQueued = false;
  sessionElapsed = 0;
  animation: PlayerAnimation = "idle";
  frameTime = 0;
  drawCalls = 0;
  triangles = 0;

  constructor() { this.recorder.start(1, tutorial.id, this.pose()); }

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

  updateWorld(time: number) {
    for (let i = 0; i < this.echoes.length; i++) {
      const echo = this.echoes[i];
      echo.sample(time);
      echo.advanceActions(time, (event) => this.world.applyAction(this.actors[i + 1].source, event.action));
    }
    this.world.update(this.actors);
  }

  activateCore() {
    if (this.clock.elapsed >= this.world.level.runDuration) return false;
    const action = { type: "ACTIVATE" as const, entityId: this.world.level.objective.id };
    if (!this.world.applyAction(this.playerActor.source, action)) return false;
    this.recorder.recordAction(this.clock.elapsed, action);
    return true;
  }

  clearInput() { this.keys.clear(); this.jumpQueued = this.interactQueued = false; }
  reset(runId = 1) {
    this.clock.reset();
    this.controller.reset();
    Object.assign(this.position, SPAWN);
    this.clearInput();
    this.animation = "idle";
    if (runId === 1) { this.timeline.clear(); this.sessionElapsed = 0; }
    this.world.reset(runId === 1);
    this.echoes = this.timeline.recordings.map((run) => new ReplayPlayer(run));
    this.playerActor.source = { id: `player-${runId}`, type: "player", runId };
    this.actors = [this.playerActor, ...this.echoes.map((echo) => ({ source: { id: `echo-${echo.run.runId}`, type: "echo" as const, runId: echo.run.runId }, position: echo.pose.position }))];
    this.recorder.start(runId, tutorial.id, this.pose());
  }
}
