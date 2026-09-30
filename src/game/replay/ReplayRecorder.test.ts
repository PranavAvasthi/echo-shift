import { describe, expect, it } from "vitest";
import { ReplayRecorder } from "./ReplayRecorder";
import type { PlayerPose } from "./replay.types";

const pose = (x = 0): PlayerPose => ({ position: { x, y: 1, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, velocity: { x: 1, y: 0, z: 0 }, animation: "walk" });
function recordAt(hz: number, duration: number) {
  const recorder = new ReplayRecorder();
  recorder.start(1, "lab00-calibration", pose());
  for (let i = 1; i <= Math.ceil(duration * hz); i++) {
    const time = Math.min(i / hz, duration);
    recorder.observe(time, pose(time));
  }
  return recorder.finish("manual");
}

describe("timestamped recorder", () => {
  it("starts at time zero and snapshots mutable transforms", () => {
    const recorder = new ReplayRecorder();
    const input = pose(2);
    recorder.start(1, "stable-id", input);
    input.position.x = 100;
    const run = recorder.finish("manual");
    expect(run.duration).toBe(0);
    expect(run.frames[0].time).toBe(0);
    expect(run.frames[0].position.x).toBe(2);
  });
  it.each([30, 60, 90, 144])("emits the same 25 Hz data from %i Hz observations", (hz) => {
    const run = recordAt(hz, 1);
    expect(run.frames).toHaveLength(26);
    run.frames.forEach((frame, i) => {
      expect(frame.time).toBeCloseTo(i / 25, 9);
      expect(frame.position.x).toBeCloseTo(frame.time, 9);
    });
  });
  it("captures exact partial-run duration and endpoint between samples", () => {
    const run = recordAt(60, .135);
    expect(run.duration).toBe(.135);
    expect(run.frames.map((frame) => frame.time)).toEqual([0, .04, .08, .12, .135]);
    expect(run.frames.at(-1)?.position.x).toBeCloseTo(.135);
  });
  it("bounds a 60-second recording and avoids timestamp drift", () => {
    const recorder = new ReplayRecorder(25, 60);
    recorder.start(5, "lab05", pose());
    for (let i = 1; i <= 3660; i++) recorder.observe(i / 60, pose(i / 60));
    const run = recorder.finish("timeout");
    expect(run.duration).toBe(60);
    expect(run.frames).toHaveLength(1501);
    expect(run.frames.at(-1)?.time).toBe(60);
    for (let i = 1; i < run.frames.length; i++) expect(run.frames[i].time).toBeGreaterThan(run.frames[i - 1].time);
  });
  it("resamples quaternion rotation on the shortest arc", () => {
    const recorder = new ReplayRecorder();
    recorder.start(1, "lab00", pose());
    const end = pose(1);
    end.rotation = { x: 0, y: 1, z: 0, w: 0 };
    recorder.observe(.08, end);
    const middle = recorder.finish("manual").frames[1].rotation;
    expect(middle.y).toBeCloseTo(Math.SQRT1_2);
    expect(middle.w).toBeCloseTo(Math.SQRT1_2);
    expect(Math.hypot(middle.x, middle.y, middle.z, middle.w)).toBeCloseTo(1);
  });
  it("captures animation and velocity without retaining input references", () => {
    const recorder = new ReplayRecorder();
    recorder.start(1, "lab00", pose());
    const end = pose(1);
    end.animation = "jump";
    end.velocity.y = 5;
    recorder.observe(.04, end);
    end.velocity.y = 100;
    const frame = recorder.finish("manual").frames[1];
    expect(frame.animation).toBe("jump");
    expect(frame.velocity.y).toBe(5);
  });
  it("preserves interaction timing between samples and snapshots drop positions", () => {
    const recorder = new ReplayRecorder();
    recorder.start(1, "lab00", pose());
    recorder.observe(.03, pose());
    recorder.recordAction(.015, { type: "PICKUP", entityId: "lab03-cube" });
    const drop = { type: "DROP" as const, entityId: "lab03-cube", position: { x: 4, y: 0, z: 2 } };
    recorder.recordAction(.025, drop);
    drop.position.x = 99;
    const run = recorder.finish("manual");
    expect(run.actions.map((event) => event.time)).toEqual([.015, .025]);
    expect(run.actions[1].action).toMatchObject({ position: { x: 4 } });
  });
  it("finalizes once and starts the next run with no leaked frames or actions", () => {
    const recorder = new ReplayRecorder();
    recorder.start(1, "lab00", pose());
    recorder.observe(.1, pose(.1));
    recorder.recordAction(.08, { type: "ACTIVATE", entityId: "lab00-switch" });
    const first = recorder.finish("manual");
    expect(recorder.finish("timeout")).toBe(first);
    expect(() => recorder.observe(.2, pose())).toThrow();
    recorder.start(2, "lab00", pose());
    const second = recorder.finish("manual");
    expect(second.runId).toBe(2);
    expect(second.frames).toHaveLength(1);
    expect(second.actions).toHaveLength(0);
    expect(first.frames.length).toBeGreaterThan(1);
  });
  it("rejects invalid transforms, ordering, identities and action times", () => {
    expect(() => new ReplayRecorder(0)).toThrow();
    const recorder = new ReplayRecorder();
    expect(() => recorder.finish("manual")).toThrow();
    expect(() => recorder.start(0, "lab00", pose())).toThrow();
    recorder.start(1, "lab00", pose());
    recorder.observe(.2, pose());
    expect(() => recorder.observe(.1, pose())).toThrow();
    expect(() => recorder.observe(.3, pose(NaN))).toThrow();
    expect(() => recorder.recordAction(.3, { type: "ACTIVATE", entityId: "switch" })).toThrow();
    expect(() => recorder.recordAction(.1, { type: "ACTIVATE", entityId: "" })).toThrow();
    recorder.recordAction(.15, { type: "ACTIVATE", entityId: "switch" });
    expect(() => recorder.recordAction(.1, { type: "ACTIVATE", entityId: "switch" })).toThrow();
  });
});
