import { Quaternion } from "three";
import { RECORDING_HZ, RUN_DURATION } from "@/game/core/constants";
import type { PlayerPose, RecordedAction, RecordedFrame, RecordedRun, ReplayAction, RunEndReason } from "./replay.types";

function clonePose(pose: PlayerPose): PlayerPose {
  return { position: { ...pose.position }, rotation: { ...pose.rotation }, velocity: { ...pose.velocity }, animation: pose.animation };
}

function validatePose(pose: PlayerPose) {
  const values = [...Object.values(pose.position), ...Object.values(pose.rotation), ...Object.values(pose.velocity)];
  if (!values.every(Number.isFinite)) throw new Error("Replay transforms must be finite");
  if (Math.hypot(pose.rotation.x, pose.rotation.y, pose.rotation.z, pose.rotation.w) < 1e-8) throw new Error("Replay rotation must be a valid quaternion");
}

/**
 * Receives physics observations, emits a separate 25 Hz timestamp grid.
 * Bracketing observations are resampled; never label a later pose with an
 * earlier time. Sampling therefore stays independent of browser render FPS.
 */
export class ReplayRecorder {
  private frames: RecordedFrame[] = [];
  private actions: RecordedAction[] = [];
  private previous: RecordedFrame | null = null;
  private sampleIndex = 1;
  private runId = 0;
  private levelId = "";
  private completed: RecordedRun | null = null;
  private readonly a = new Quaternion();
  private readonly b = new Quaternion();
  private readonly rotation = new Quaternion();

  constructor(readonly sampleRate = RECORDING_HZ, readonly maxDuration = RUN_DURATION) {
    if (!Number.isFinite(sampleRate) || sampleRate <= 0 || !Number.isFinite(maxDuration) || maxDuration <= 0) throw new Error("Invalid recording configuration");
  }

  get frameCount() { return this.frames.length; }
  get elapsed() { return this.previous?.time ?? 0; }

  start(runId: number, levelId: string, pose: PlayerPose) {
    if (!Number.isInteger(runId) || runId < 1 || !levelId) throw new Error("Invalid recording identity");
    validatePose(pose);
    this.runId = runId;
    this.levelId = levelId;
    this.completed = null;
    this.sampleIndex = 1;
    const rotation = this.a.set(pose.rotation.x, pose.rotation.y, pose.rotation.z, pose.rotation.w).normalize();
    this.previous = { ...clonePose(pose), rotation: { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w }, time: 0 };
    this.frames = [this.previous];
    this.actions = [];
  }

  observe(time: number, pose: PlayerPose) {
    const previous = this.previous;
    if (!previous || this.completed) throw new Error("Recorder is not active");
    if (!Number.isFinite(time) || time < previous.time) throw new Error("Observation times must be ordered");
    validatePose(pose);
    if (time === previous.time || previous.time >= this.maxDuration) return;
    const current: RecordedFrame = { ...clonePose(pose), time };
    const end = Math.min(time, this.maxDuration);
    // Integer indices avoid accumulated interval drift on long recordings.
    while (this.sampleIndex / this.sampleRate <= end + 1e-9) {
      const sampleTime = Math.min(this.sampleIndex / this.sampleRate, this.maxDuration);
      this.frames.push(this.interpolate(previous, current, sampleTime));
      this.sampleIndex++;
    }
    this.previous = this.interpolate(previous, current, end);
  }

  recordAction(time: number, action: ReplayAction) {
    if (!this.previous || this.completed) throw new Error("Recorder is not active");
    const last = this.actions.at(-1)?.time ?? 0;
    if (!Number.isFinite(time) || time < last || time > this.previous.time || time < 0) throw new Error("Action must belong to the observed timeline");
    if (!action.entityId) throw new Error("Replay actions require a stable entity ID");
    if (action.type === "DROP" && !Object.values(action.position).every(Number.isFinite)) throw new Error("Drop position must be finite");
    this.actions.push({ time, action: action.type === "DROP" ? { ...action, position: { ...action.position } } : { ...action } });
  }

  finish(endReason: RunEndReason): RecordedRun {
    if (this.completed) return this.completed;
    if (!this.previous) throw new Error("Recorder has not started");
    // Preserve the precise endpoint of a partial run. Future playback can hold
    // this final pose until the level ends, which enables short plate recordings.
    if (this.previous.time > this.frames[this.frames.length - 1].time + 1e-9) this.frames.push({ ...clonePose(this.previous), time: this.previous.time });
    this.completed = Object.freeze({
      runId: this.runId, levelId: this.levelId, sampleRate: this.sampleRate,
      duration: this.previous.time, endReason,
      frames: Object.freeze(this.frames.slice()), actions: Object.freeze(this.actions.slice()),
    });
    return this.completed;
  }

  private interpolate(a: RecordedFrame, b: RecordedFrame, time: number): RecordedFrame {
    const alpha = Math.max(0, Math.min(1, (time - a.time) / (b.time - a.time)));
    const lerp = (start: number, end: number) => start + (end - start) * alpha;
    this.a.set(a.rotation.x, a.rotation.y, a.rotation.z, a.rotation.w).normalize();
    this.b.set(b.rotation.x, b.rotation.y, b.rotation.z, b.rotation.w).normalize();
    this.rotation.slerpQuaternions(this.a, this.b, alpha);
    return {
      time,
      position: { x: lerp(a.position.x, b.position.x), y: lerp(a.position.y, b.position.y), z: lerp(a.position.z, b.position.z) },
      rotation: { x: this.rotation.x, y: this.rotation.y, z: this.rotation.z, w: this.rotation.w },
      velocity: { x: lerp(a.velocity.x, b.velocity.x), y: lerp(a.velocity.y, b.velocity.y), z: lerp(a.velocity.z, b.velocity.z) },
      animation: time < b.time - 1e-9 ? a.animation : b.animation,
    };
  }
}
