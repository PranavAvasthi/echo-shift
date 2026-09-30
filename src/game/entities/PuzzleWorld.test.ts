import { describe, expect, it } from "vitest";
import { PuzzleWorld } from "./PuzzleWorld";
import { tutorial } from "@/game/levels/definitions/tutorial";
import type { InteractionActor } from "./interaction.types";
import { GameRuntime } from "@/game/core/GameRuntime";

const player = (x = -4, z = 2, y = .8): InteractionActor => ({ source: { id: "player-2", type: "player", runId: 2 }, position: { x, y, z } });
const echo = (x = -4, z = 2): InteractionActor => ({ source: { id: "echo-1", type: "echo", runId: 1 }, position: { x, y: .8, z } });

describe("shared temporal puzzle", () => {
  it("opens only while a player or echo actually occupies the plate", () => {
    const world = new PuzzleWorld(tutorial);
    world.update([player()]);
    expect(world.doorOpen).toBe(true);
    world.update([player(0, 0)]);
    expect(world.doorOpen).toBe(false);
    world.update([player(0, -8), echo()]);
    expect(world.doorOpen).toBe(true);
  });
  it("tracks multiple occupants and ignores a body jumping above the plate", () => {
    const world = new PuzzleWorld(tutorial);
    world.update([player(), echo()]);
    expect(world.occupants.get("lab00-plate-a")).toHaveLength(2);
    world.update([player(-4, 2, 1.8)]);
    expect(world.doorOpen).toBe(false);
    world.update([echo()]);
    expect(world.doorOpen).toBe(true);
  });
  it("requires the current player near the objective while the door is powered", () => {
    const world = new PuzzleWorld(tutorial);
    const action = { type: "ACTIVATE" as const, entityId: tutorial.objective.id };
    world.update([player()]);
    expect(world.applyAction(player().source, action)).toBe(false);
    world.update([player(0, -11), echo()]);
    expect(world.canActivate).toBe(true);
    expect(world.applyAction(echo().source, action)).toBe(false);
    expect(world.applyAction(player().source, action)).toBe(true);
    expect(world.applyAction(player().source, action)).toBe(false);
  });
  it("resets all entity occupancy, completion and door state", () => {
    const world = new PuzzleWorld(tutorial);
    world.update([player(0, -11), echo()]);
    world.applyAction(player().source, { type: "ACTIVATE", entityId: tutorial.objective.id });
    world.reset();
    expect(world.doorOpen).toBe(false);
    expect(world.completed).toBe(false);
    expect(world.canActivate).toBe(false);
    expect(world.occupants.get("lab00-plate-a")).toHaveLength(0);
  });
  it("supports simultaneous requirements with identical player/echo semantics", () => {
    const world = new PuzzleWorld({ ...tutorial, plates: [...tutorial.plates, { id: "b", label: "B", position: { x: 4, y: 0, z: 2 } }], door: { ...tutorial.door, requirements: ["lab00-plate-a", "b"] } });
    world.update([echo(), player(0, 6)]);
    expect(world.doorOpen).toBe(false);
    world.update([echo(), player(4, 2)]);
    expect(world.doorOpen).toBe(true);
  });
  it("an actual partial recording can hold a plate while its creator reaches the core", () => {
    const runtime = new GameRuntime();
    runtime.position.x = -4;
    runtime.position.y = .8;
    runtime.position.z = 2;
    runtime.clock.step(2);
    runtime.recorder.observe(2, runtime.pose());
    runtime.capture("manual");
    runtime.reset(2);
    const replay = runtime.echoes[0];
    const world = new PuzzleWorld(tutorial);
    replay.sample(10);
    world.update([player(0, -11), { source: echo().source, position: replay.pose.position }]);
    expect(world.doorOpen).toBe(true);
    expect(world.canActivate).toBe(true);
  });
  it("rejects completion at the run deadline before recording an out-of-range event", () => {
    const runtime = new GameRuntime();
    runtime.position.z = -11;
    runtime.clock.step(30.016);
    runtime.recorder.observe(runtime.clock.elapsed, runtime.pose());
    runtime.world.update([player(0, -11), echo()]);
    expect(runtime.world.canActivate).toBe(true);
    expect(runtime.activateCore()).toBe(false);
    expect(runtime.recorder.finish("timeout").actions).toHaveLength(0);
  });
});
