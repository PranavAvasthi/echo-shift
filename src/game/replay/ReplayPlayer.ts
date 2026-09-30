import { Quaternion } from "three";
import type { PlayerPose, RecordedAction, RecordedRun } from "./replay.types";

/** Pure timestamp-based playback. No physics body, frame-rate assumptions or scripted paths. */
export class ReplayPlayer {
  readonly pose: PlayerPose = {
    position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 },
    velocity: { x: 0, y: 0, z: 0 }, animation: "idle",
  };
  private readonly a = new Quaternion();
  private readonly b = new Quaternion();
  private readonly rotation = new Quaternion();
  private eventCursor = 0;
  private lastEventTime = -1;

  constructor(readonly run: RecordedRun) {
    if (!run.frames.length) throw new Error("Cannot replay an empty recording");
    this.sample(0);
  }

  sample(time: number): PlayerPose {
    if (!Number.isFinite(time)) throw new Error("Invalid playback time");
    const frames = this.run.frames;
    const t = Math.max(0, Math.min(time, this.run.duration));
    // Binary search also handles arbitrary seeks and off-grid partial endpoints.
    let low = 0;
    let high = frames.length - 1;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (frames[middle].time <= t) low = middle;
      else high = middle - 1;
    }
    const a = frames[low];
    const b = frames[Math.min(low + 1, frames.length - 1)];
    const alpha = b.time > a.time ? Math.min(1, (t - a.time) / (b.time - a.time)) : 0;
    const lerp = (start: number, end: number) => start + (end - start) * alpha;
    this.pose.position.x = lerp(a.position.x, b.position.x);
    this.pose.position.y = lerp(a.position.y, b.position.y);
    this.pose.position.z = lerp(a.position.z, b.position.z);
    this.a.set(a.rotation.x, a.rotation.y, a.rotation.z, a.rotation.w);
    this.b.set(b.rotation.x, b.rotation.y, b.rotation.z, b.rotation.w);
    this.rotation.slerpQuaternions(this.a, this.b, alpha).normalize();
    Object.assign(this.pose.rotation, { x: this.rotation.x, y: this.rotation.y, z: this.rotation.z, w: this.rotation.w });
    this.pose.velocity.x = lerp(a.velocity.x, b.velocity.x);
    this.pose.velocity.y = lerp(a.velocity.y, b.velocity.y);
    this.pose.velocity.z = lerp(a.velocity.z, b.velocity.z);
    // A partial recording holds its exact last position. It does not invent a
    // path back to spawn or keep walking beyond what the user recorded.
    this.pose.animation = time > this.run.duration ? "idle" : a.animation;
    return this.pose;
  }

  advanceActions(time: number, emit: (event: RecordedAction) => void) {
    if (!Number.isFinite(time) || time < 0) throw new Error("Invalid event playback time");
    if (time < this.lastEventTime) this.resetActions();
    while (this.eventCursor < this.run.actions.length && this.run.actions[this.eventCursor].time <= time) {
      emit(this.run.actions[this.eventCursor++]);
    }
    this.lastEventTime = time;
  }

  resetActions() { this.eventCursor = 0; this.lastEventTime = -1; }
}
