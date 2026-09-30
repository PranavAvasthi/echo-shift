import { describe, expect, it } from "vitest";
import { ReplayPlayer } from "./ReplayPlayer";
import { ReplayRecorder } from "./ReplayRecorder";
import type { PlayerPose, RecordedAction } from "./replay.types";

const pose = (x = 0): PlayerPose => ({ position: { x, y: .8, z: 2 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, velocity: { x: 1, y: 0, z: 0 }, animation: "walk" });
function run() {
  const recorder = new ReplayRecorder();
  recorder.start(1, "tutorial", pose());
  recorder.observe(.135, pose(13.5));
  return recorder.finish("manual");
}

describe("recorded echo playback", () => {
  it("reuses pose storage throughout a full run with irregular render timing", () => {
    const recorder = new ReplayRecorder();
    recorder.start(1, "tutorial", pose());
    for (let step = 1; step <= 1800; step++) recorder.observe(step / 60, pose(step / 60));
    const replay = new ReplayPlayer(recorder.finish("timeout"));
    const original = replay.pose;
    const position = original.position;
    const rotation = original.rotation;
    for (const time of [0, .001, .737, 10.013, 18.9, 29.999, 30, 35, .2]) {
      expect(replay.sample(time)).toBe(original);
      expect(replay.pose.position).toBe(position);
      expect(replay.pose.rotation).toBe(rotation);
      expect(replay.pose.position.x).toBeCloseTo(Math.min(time, 30), 8);
    }
  });
  it("interpolates exact positions between timestamped frames", () => {
    const replay = new ReplayPlayer(run());
    expect(replay.sample(.02).position.x).toBeCloseTo(2);
    expect(replay.sample(.11).position.x).toBeCloseTo(11);
    expect(replay.sample(.13).position.x).toBeCloseTo(13);
  });
  it.each([30, 60, 90, 144])("stays synchronized at %i Hz rendering", (fps) => {
    const replay = new ReplayPlayer(run());
    for (let i = 0; i < fps; i++) {
      const t = i / fps;
      expect(replay.sample(t).position.x).toBeCloseTo(Math.min(t, .135) * 100);
    }
  });
  it("holds the final endpoint, including a deliberately short recording", () => {
    const replay = new ReplayPlayer(run());
    expect(replay.sample(30).position.x).toBe(13.5);
    expect(replay.pose.animation).toBe("idle");
    expect(replay.sample(-1).position.x).toBe(0);
  });
  it("supports a zero-duration recording and seeks without mutating source frames", () => {
    const recorder = new ReplayRecorder();
    recorder.start(1, "tutorial", pose(4));
    const recording = recorder.finish("manual");
    const replay = new ReplayPlayer(recording);
    replay.sample(20).position.x = 999;
    expect(replay.sample(0).position.x).toBe(4);
    expect(recording.frames[0].position.x).toBe(4);
    expect(() => replay.sample(NaN)).toThrow();
  });
  it("uses quaternion slerp on the shortest arc", () => {
    const recorder = new ReplayRecorder();
    recorder.start(1, "tutorial", pose());
    const end = pose();
    end.rotation = { x: 0, y: -1, z: 0, w: 0 };
    recorder.observe(.04, end);
    const rotation = new ReplayPlayer(recorder.finish("manual")).sample(.02).rotation;
    expect(Math.abs(rotation.y)).toBeCloseTo(Math.SQRT1_2);
    expect(rotation.w).toBeCloseTo(Math.SQRT1_2);
  });
  it("replays action crossings once, catches up, and starts again after rewind", () => {
    const recorder = new ReplayRecorder();
    recorder.start(1, "tutorial", pose());
    recorder.observe(.1, pose(1));
    recorder.recordAction(0, { type: "PICKUP", entityId: "cube" });
    recorder.recordAction(.015, { type: "PRESS_SWITCH", entityId: "switch" });
    recorder.recordAction(.08, { type: "DROP", entityId: "cube", position: { x: 1, y: 0, z: 0 } });
    const replay = new ReplayPlayer(recorder.finish("manual"));
    const events: RecordedAction[] = [];
    replay.advanceActions(0, (event) => events.push(event));
    replay.advanceActions(.04, (event) => events.push(event));
    replay.advanceActions(.04, (event) => events.push(event));
    expect(events).toHaveLength(2);
    replay.advanceActions(1, (event) => events.push(event));
    expect(events).toHaveLength(3);
    replay.advanceActions(0, (event) => events.push(event));
    expect(events).toHaveLength(4);
  });
  it("keeps multiple recordings independent", () => {
    const a = new ReplayPlayer(run());
    const b = new ReplayPlayer(run());
    a.sample(.08);
    b.sample(.02);
    expect(a.pose.position.x).toBe(8);
    expect(b.pose.position.x).toBe(2);
  });
});
