import { GameClock } from "./GameClock";
import { RECORDING_HZ, SPAWN } from "./constants";
import { PlayerController } from "@/game/player/PlayerController";
import type { PlayerAnimation } from "@/game/player/player.types";
import { ReplayRecorder } from "@/game/replay/ReplayRecorder";
import { RunTimeline } from "@/game/replay/RunTimeline";
import { ReplayPlayer } from "@/game/replay/ReplayPlayer";
import type { PlayerPose, RunEndReason } from "@/game/replay/replay.types";
import { PuzzleWorld } from "@/game/entities/PuzzleWorld";
import type { InteractionActor } from "@/game/entities/interaction.types";
import { levels } from "@/game/levels";

/** Owned by a mounted game, never persisted. Frame-level data bypasses React. */
export class GameRuntime {
  readonly clock = new GameClock();
  readonly controller = new PlayerController();
  recorder = new ReplayRecorder();
  readonly timeline = new RunTimeline();
  world = new PuzzleWorld(levels[0]);
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
  sessionLoops = 0;
  maxEchoes = 0;
  animation: PlayerAnimation = "idle";
  frameTime = 0;
  drawCalls = 0;
  triangles = 0;

  constructor() { this.recorder.start(1, levels[0].id, this.pose()); }

  pose(): PlayerPose {
    const halfHeading = this.controller.heading * .5;
    return {
      position: this.position,
      rotation: { x: 0, y: Math.sin(halfHeading), z: 0, w: Math.cos(halfHeading) },
      velocity: this.controller.velocity,
      animation: this.animation,
    };
  }

  capture(endReason: RunEndReason) {
    if (this.timeline.append(this.recorder.finish(endReason))) this.sessionLoops++;
  }

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
  reset(runId = 1, levelIndex = 0) {
    const level = levels[levelIndex];
    if (!level) throw new Error("Unknown chamber");
    if (level.id !== this.world.level.id) {
      this.world = new PuzzleWorld(level);
      this.recorder = new ReplayRecorder(RECORDING_HZ, level.runDuration);
    }
    this.clock.reset();
    this.controller.reset();
    Object.assign(this.position, level.spawn);
    this.yaw = 0;
    this.pitch = .32;
    this.clearInput();
    this.animation = "idle";
    if (runId === 1) {
      this.timeline.clear();
      if (levelIndex === 0) this.sessionElapsed = this.sessionLoops = this.maxEchoes = 0;
    }
    this.world.reset(runId === 1);
    this.echoes = this.timeline.recordings.map((run) => new ReplayPlayer(run));
    this.maxEchoes = Math.max(this.maxEchoes, this.echoes.length);
    this.playerActor.source = { id: `player-${runId}`, type: "player", runId };
    this.actors = [this.playerActor, ...this.echoes.map((echo) => ({ source: { id: `echo-${echo.run.runId}`, type: "echo" as const, runId: echo.run.runId }, position: echo.pose.position }))];
    this.recorder.start(runId, level.id, this.pose());
  }
}
