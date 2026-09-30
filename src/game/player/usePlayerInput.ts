import { useEffect } from "react";
import { useGameStore } from "@/game/state/gameStore";
import type { GameRuntime } from "@/game/core/GameRuntime";

const gameplayKeys = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "Space", "ShiftLeft", "ShiftRight", "KeyR", "KeyE"]);

export function usePlayerInput(runtime: GameRuntime) {
  useEffect(() => {
    let ignoreNextMove = true;
    const down = (event: KeyboardEvent) => {
      const state = useGameStore.getState();
      if (event.code === "Backquote" && process.env.NODE_ENV === "development") {
        state.configure({ debug: !state.debug });
        return;
      }
      if (state.phase !== "playing") return;
      if (gameplayKeys.has(event.code)) event.preventDefault();
      if (event.code === "Escape") { state.pause(); return; }
      if (event.code === "KeyR" && !event.repeat) { state.requestReset(); return; }
      if (event.code === "Space" && !event.repeat) runtime.jumpQueued = true;
      if (event.code === "KeyE" && !event.repeat) runtime.interactQueued = true;
      runtime.keys.add(event.code);
    };
    const up = (event: KeyboardEvent) => runtime.keys.delete(event.code);
    const move = (event: MouseEvent) => {
      const state = useGameStore.getState();
      if (state.phase !== "playing" || !document.pointerLockElement) return;
      // Desktop browsers may report the cursor-centering warp as a relative
      // movement when lock begins. Ignore it so the camera does not snap.
      if (ignoreNextMove) { ignoreNextMove = false; return; }
      runtime.yaw -= event.movementX * 0.002 * state.sensitivity;
      runtime.pitch = Math.max(-0.18, Math.min(0.9, runtime.pitch + event.movementY * 0.002 * state.sensitivity * (state.invertY ? -1 : 1)));
    };
    const loseFocus = () => { runtime.clearInput(); useGameStore.getState().pause(); };
    const visibility = () => { if (document.hidden) loseFocus(); };
    const lockChanged = () => { if (document.pointerLockElement) ignoreNextMove = true; else loseFocus(); };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (["playing", "paused", "runResetting"].includes(useGameStore.getState().phase)) event.preventDefault();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("mousemove", move);
    window.addEventListener("blur", loseFocus);
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("pointerlockchange", lockChanged);
    return () => {
      runtime.clearInput();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("blur", loseFocus);
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("pointerlockchange", lockChanged);
    };
  }, [runtime]);
}
