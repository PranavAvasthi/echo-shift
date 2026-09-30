import { beforeEach, describe, expect, it } from "vitest";
import { GameRuntime } from "@/game/core/GameRuntime";
import { useGameStore } from "@/game/state/gameStore";
import { levels } from ".";

describe("two-chamber progression", () => {
  beforeEach(() => useGameStore.getState().openSession());
  it("advances only after completion and clears per-level replay state", () => {
    useGameStore.getState().advanceLevel();
    expect(useGameStore.getState().levelIndex).toBe(0);
    useGameStore.setState({ phase: "levelComplete", run: 2, totalLoops: 2, archivedRuns: 2 });
    useGameStore.getState().advanceLevel();
    expect(useGameStore.getState()).toMatchObject({ phase: "intro", levelIndex: 1, run: 1, totalLoops: 2, archivedRuns: 0, recordedFrames: 0 });
  });
  it("keeps session statistics but discards echoes when changing chambers", () => {
    const runtime = new GameRuntime();
    runtime.clock.step(2);
    runtime.sessionElapsed = 2;
    runtime.recorder.observe(2, runtime.pose());
    runtime.capture("manual");
    runtime.reset(2);
    expect(runtime.echoes).toHaveLength(1);
    runtime.reset(1, 1);
    expect(runtime.world.level).toBe(levels[1]);
    expect(runtime.echoes).toHaveLength(0);
    expect(runtime.timeline.count).toBe(0);
    expect(runtime.recorder.maxDuration).toBe(40);
    expect(runtime.sessionLoops).toBe(1);
    expect(runtime.sessionElapsed).toBe(2);
  });
  it("needs two actual recorded past selves to power Dual Core while the current self exits", () => {
    const runtime = new GameRuntime();
    runtime.reset(1, 1);
    Object.assign(runtime.position, { x: -4, y: .85, z: 2 });
    runtime.clock.step(2);
    runtime.recorder.observe(2, runtime.pose());
    runtime.capture("manual");
    runtime.reset(2, 1);
    runtime.updateWorld(3);
    expect(runtime.world.doorOpen).toBe(false);
    Object.assign(runtime.position, { x: 4, y: .85, z: 2 });
    runtime.clock.step(3);
    runtime.recorder.observe(3, runtime.pose());
    runtime.capture("manual");
    runtime.reset(3, 1);
    Object.assign(runtime.position, { x: 0, y: .8, z: -11 });
    runtime.updateWorld(10);
    expect(runtime.echoes).toHaveLength(2);
    expect(runtime.world.doorOpen).toBe(true);
    expect(runtime.world.canActivate).toBe(true);
    expect(runtime.maxEchoes).toBe(2);
  });
  it("does not tell the current player to leave a plate that still needs their weight", () => {
    const runtime = new GameRuntime();
    runtime.reset(1, 1);
    Object.assign(runtime.position, { x: -4, y: .85, z: 2 });
    runtime.recorder.observe(2, runtime.pose());
    runtime.capture("manual");
    runtime.reset(2, 1);
    Object.assign(runtime.position, { x: 4, y: .85, z: 2 });
    runtime.updateWorld(3);
    expect(runtime.world.doorOpen).toBe(true);
    expect(runtime.world.snapshot(1).hint).toContain("Press R");
  });
  it("restarting the timeline resets level, session counters, and timer settings", () => {
    const runtime = new GameRuntime();
    runtime.reset(1, 1);
    runtime.capture("manual");
    runtime.reset(2, 1);
    runtime.reset(1, 0);
    expect(runtime.world.level).toBe(levels[0]);
    expect(runtime.recorder.maxDuration).toBe(30);
    expect(runtime.sessionLoops).toBe(0);
    expect(runtime.maxEchoes).toBe(0);
    useGameStore.setState({ phase: "gameComplete", levelIndex: 1, totalLoops: 5 });
    useGameStore.getState().restartTimeline();
    expect(useGameStore.getState()).toMatchObject({ phase: "intro", levelIndex: 0, totalLoops: 0 });
  });
});
