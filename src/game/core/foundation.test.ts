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
  it("expires jump forgiveness rather than allowing a jump long after a ledge", () => {
    const player = new PlayerController();
    player.grounded = true;
    player.step(idle, 1 / 60);
    player.grounded = false;
    for (let i = 0; i < 12; i++) player.step(idle, 1 / 60);
    expect(player.step({ ...idle, jump: true }, 1 / 60).y).toBeLessThan(0);
  });
  it("expires a buffered airborne press before a late landing", () => {
    const player = new PlayerController();
    player.step({ ...idle, jump: true }, 1 / 60);
    for (let i = 0; i < 12; i++) player.step(idle, 1 / 60);
    player.grounded = true;
    expect(player.step(idle, 1 / 60).y).toBeLessThanOrEqual(0);
  });
  it("forgives a late ledge jump but never grants a second airborne jump", () => {
    const player = new PlayerController();
    player.grounded = true;
    player.step(idle, 1 / 60);
    player.grounded = false;
    player.step({ ...idle, jump: true }, 1 / 60);
    expect(player.velocity.y).toBeGreaterThan(7);
    const velocity = player.velocity.y;
    player.step({ ...idle, jump: true }, 1 / 60);
    expect(player.velocity.y).toBeLessThan(velocity);
  });
  it("buffers a jump shortly before landing and clears it on reset", () => {
    const player = new PlayerController();
    player.step({ ...idle, jump: true }, 1 / 60);
    player.grounded = true;
    expect(player.step(idle, 1 / 60).y).toBeGreaterThan(0);
    player.reset();
    player.grounded = true;
    expect(player.step(idle, 1 / 60).y).toBeLessThanOrEqual(0);
  });
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
  it("clears the 1.1m training platform despite discrete gravity integration", () => {
    const player = new PlayerController();
    player.grounded = true;
    let height = player.step({ ...idle, jump: true }, 1 / 60).y;
    while (player.velocity.y > 0) height += player.step(idle, 1 / 60).y;
    expect(height).toBeGreaterThan(1.1);
    expect(height).toBeLessThan(1.5);
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
  it("a newly mounted session cannot inherit the disposed runtime's progress", () => {
    useGameStore.setState({ phase: "paused", run: 4, elapsed: 10, archivedRuns: 3 });
    useGameStore.getState().openSession();
    expect(useGameStore.getState()).toMatchObject({ phase: "loading", run: 1, elapsed: 0, archivedRuns: 0, latestRecording: null });
  });
});
