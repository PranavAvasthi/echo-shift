import { describe, expect, it, beforeEach } from "vitest";
import { GameClock } from "./GameClock";
import { PlayerController, type MovementInput } from "@/game/player/PlayerController";
import { useGameStore } from "@/game/state/gameStore";

const idle: MovementInput = { forward: 0, right: 0, yaw: 0, sprint: false, jump: false };

describe("simulation clock", () => {
  it("tracks fixed simulation time and resets without carrying elapsed time", () => {
    const clock = new GameClock();
    for (let i = 0; i < 60; i++) clock.step(1 / 60);
    expect(clock.elapsed).toBeCloseTo(1);
    clock.reset();
    expect(clock.elapsed).toBe(0);
    expect(() => clock.step(-1)).toThrow();
  });
});

describe("arcade movement", () => {
  it("normalizes diagonal movement and rotates movement with camera yaw", () => {
    const straight = new PlayerController();
    const diagonal = new PlayerController();
    straight.grounded = diagonal.grounded = true;
    const a = straight.step({ ...idle, forward: 1 }, 1 / 60);
    const b = diagonal.step({ ...idle, forward: 1, right: 1 }, 1 / 60);
    expect(Math.hypot(a.x, a.z)).toBeCloseTo(Math.hypot(b.x, b.z));
    const rotated = new PlayerController();
    rotated.grounded = true;
    const c = rotated.step({ ...idle, forward: 1, yaw: Math.PI / 2 }, 1 / 60);
    expect(c.x).toBeLessThan(0);
    expect(c.z).toBeCloseTo(0);
  });
  it("jumps only when grounded and applies gravity", () => {
    const player = new PlayerController();
    player.grounded = true;
    expect(player.step({ ...idle, jump: true }, 1 / 60).y).toBeGreaterThan(0);
    const previous = player.velocity.y;
    player.step({ ...idle, jump: true }, 1 / 60);
    expect(player.velocity.y).toBeLessThan(previous);
  });
  it("stops quickly and clears velocity on reset", () => {
    const player = new PlayerController();
    player.grounded = true;
    for (let i = 0; i < 60; i++) player.step({ ...idle, forward: 1 }, 1 / 60);
    for (let i = 0; i < 20; i++) player.step(idle, 1 / 60);
    expect(Math.abs(player.velocity.z)).toBeLessThan(.01);
    player.reset();
    expect(player.velocity).toEqual({ x: 0, y: 0, z: 0 });
  });
});

describe("phase machine", () => {
  beforeEach(() => useGameStore.setState({ phase: "loading", run: 1, resetVersion: 0, elapsed: 0, recordedFrames: 0 }));
  it("rejects impossible transitions", () => {
    useGameStore.getState().transition("playing");
    expect(useGameStore.getState().phase).toBe("loading");
    useGameStore.getState().transition("intro");
    useGameStore.getState().transition("playing");
    expect(useGameStore.getState().phase).toBe("playing");
  });
  it("completes a reset exactly once and resets run telemetry", () => {
    useGameStore.setState({ phase: "playing", elapsed: 12, recordedFrames: 300 });
    useGameStore.getState().requestReset();
    useGameStore.getState().requestReset();
    useGameStore.getState().finishReset(true);
    useGameStore.getState().finishReset(true);
    expect(useGameStore.getState()).toMatchObject({ phase: "playing", run: 2, elapsed: 0, recordedFrames: 0, resetVersion: 1 });
  });
  it("pause preserves time and restart timeline clears progress", () => {
    useGameStore.setState({ phase: "playing", run: 4, elapsed: 10 });
    useGameStore.getState().pause();
    expect(useGameStore.getState()).toMatchObject({ phase: "paused", elapsed: 10 });
    useGameStore.getState().restartTimeline();
    expect(useGameStore.getState()).toMatchObject({ phase: "intro", run: 1, elapsed: 0 });
  });
});
