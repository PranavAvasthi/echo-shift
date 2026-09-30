import { describe, expect, it } from "vitest";
import { RunTimeline } from "./RunTimeline";
import { GameRuntime } from "@/game/core/GameRuntime";
import type { RecordedRun } from "./replay.types";

function makeRun(runId: number): RecordedRun {
  const runtime = new GameRuntime();
  runtime.reset(runId);
  runtime.position.x = runId;
  runtime.clock.step(.135);
  runtime.recorder.observe(runtime.clock.elapsed, runtime.pose());
  return runtime.recorder.finish("manual");
}

describe("in-memory run timeline", () => {
  it("archives actual pose data with exact partial endpoints", () => {
    const runtime = new GameRuntime();
    runtime.position.x = 4;
    runtime.position.z = 2;
    runtime.animation = "jump";
    runtime.clock.step(.135);
    runtime.recorder.observe(runtime.clock.elapsed, runtime.pose());
    runtime.capture("manual");
    expect(runtime.timeline.summary()).toMatchObject({ duration: .135, frameCount: 5, endReason: "manual", end: { x: 4, z: 2 } });
    expect(runtime.timeline.latest?.frames.at(-1)?.animation).toBe("jump");
  });
  it("does not archive duplicate captures", () => {
    const runtime = new GameRuntime();
    runtime.capture("manual");
    runtime.capture("manual");
    expect(runtime.timeline.count).toBe(1);
    expect(runtime.timeline.totalRuns).toBe(1);
  });
  it("bounds memory while preserving run identity", () => {
    const timeline = new RunTimeline(6);
    for (let i = 1; i <= 20; i++) timeline.append(makeRun(i));
    expect(timeline.count).toBe(6);
    expect(timeline.totalRuns).toBe(20);
    expect(timeline.recordings.map((run) => run.runId)).toEqual([15, 16, 17, 18, 19, 20]);
    expect(timeline.append(makeRun(19))).toBe(false);
  });
  it("starts fresh run data while keeping earlier recordings intact", () => {
    const runtime = new GameRuntime();
    runtime.position.x = 4;
    runtime.clock.step(.1);
    runtime.recorder.observe(runtime.clock.elapsed, runtime.pose());
    runtime.capture("manual");
    const saved = runtime.timeline.latest;
    runtime.reset(2);
    expect(runtime.clock.elapsed).toBe(0);
    expect(runtime.position).toEqual({ x: 0, y: .95, z: 6 });
    expect(runtime.recorder.frameCount).toBe(1);
    expect(runtime.timeline.count).toBe(1);
    expect(saved?.frames.at(-1)?.position.x).toBe(4);
  });
  it("records automatic timeout as exactly 30 seconds", () => {
    const runtime = new GameRuntime();
    for (let i = 0; i < 1801; i++) {
      runtime.clock.step(1 / 60);
      runtime.recorder.observe(runtime.clock.elapsed, runtime.pose());
    }
    runtime.capture("timeout");
    expect(runtime.timeline.summary()).toMatchObject({ duration: 30, frameCount: 751, endReason: "timeout" });
  });
  it("clears recordings and velocities on timeline restart", () => {
    const runtime = new GameRuntime();
    runtime.capture("manual");
    runtime.reset(2);
    runtime.controller.velocity.x = 4;
    runtime.keys.add("KeyW");
    runtime.reset(1);
    expect(runtime.timeline.count).toBe(0);
    expect(runtime.timeline.totalRuns).toBe(0);
    expect(runtime.controller.velocity).toEqual({ x: 0, y: 0, z: 0 });
    expect(runtime.keys.size).toBe(0);
  });
});
