import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { GameRuntime } from "@/game/core/GameRuntime";
import { useGameStore } from "@/game/state/gameStore";

/** Evaluate cheap edges directly, not throttled React HUD snapshots. */
export function GameAudio({ runtime }: { runtime: GameRuntime }) {
  const previous = useRef({ run: -1, reset: -1, time: 0, x: 0, z: 0, distance: 0, grounded: false, door: false, plates: new Map<string, boolean>() });
  useFrame(() => {
    const state = useGameStore.getState();
    if (state.phase !== "playing") return;
    const p = previous.current;
    if (p.reset !== state.resetVersion || p.run !== state.run) {
      p.run = state.run; p.reset = state.resetVersion; p.time = runtime.clock.elapsed;
      p.x = runtime.position.x; p.z = runtime.position.z; p.distance = 0;
      p.grounded = runtime.controller.grounded; p.door = runtime.world.doorOpen;
      p.plates.clear();
      if (state.run > 1) runtime.audio.play("echo");
    }
    if (p.time === runtime.clock.elapsed) return;
    p.time = runtime.clock.elapsed;
    const grounded = runtime.controller.grounded;
    if (!p.grounded && grounded) runtime.audio.play("land");
    if (grounded) p.distance += Math.hypot(runtime.position.x - p.x, runtime.position.z - p.z);
    if (p.distance >= (runtime.animation === "run" ? 1.65 : 1.35)) { runtime.audio.play("step"); p.distance = 0; }
    p.x = runtime.position.x; p.z = runtime.position.z; p.grounded = grounded;
    for (const plate of runtime.world.level.plates) {
      const active = Boolean(runtime.world.occupants.get(plate.id)?.length);
      if (active !== (p.plates.get(plate.id) ?? false)) {
        const pan = ((plate.position.x - p.x) * Math.cos(runtime.yaw) - (plate.position.z - p.z) * Math.sin(runtime.yaw)) / 8;
        runtime.audio.play(active ? "plateOn" : "plateOff", pan);
        p.plates.set(plate.id, active);
      }
    }
    if (p.door !== runtime.world.doorOpen) runtime.audio.play("door");
    p.door = runtime.world.doorOpen;
  });
  return null;
}
