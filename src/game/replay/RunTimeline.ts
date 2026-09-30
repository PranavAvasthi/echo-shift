import { MAX_RECORDINGS } from "@/game/core/constants";
import type { Vec3 } from "@/game/player/player.types";
import type { RecordedRun, RunEndReason } from "./replay.types";

export interface RecordingSummary {
  runId: number;
  duration: number;
  frameCount: number;
  endReason: RunEndReason;
  start: Vec3;
  end: Vec3;
}

/** Small bounded archive; duplicate capture is ignored during reset effects. */
export class RunTimeline {
  private runs: RecordedRun[] = [];
  totalRuns = 0;

  constructor(readonly capacity = MAX_RECORDINGS) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new Error("Invalid timeline capacity");
  }

  get recordings(): readonly RecordedRun[] { return this.runs.slice(); }
  get count() { return this.runs.length; }
  get latest() { return this.runs.at(-1); }

  append(run: RecordedRun) {
    if (this.latest && run.runId <= this.latest.runId) return false;
    this.runs.push(run);
    if (this.runs.length > this.capacity) this.runs.shift();
    this.totalRuns++;
    return true;
  }

  summary(): RecordingSummary | null {
    const run = this.latest;
    if (!run) return null;
    return {
      runId: run.runId, duration: run.duration, frameCount: run.frames.length, endReason: run.endReason,
      start: { ...run.frames[0].position }, end: { ...run.frames[run.frames.length - 1].position },
    };
  }

  clear() { this.runs = []; this.totalRuns = 0; }
}
