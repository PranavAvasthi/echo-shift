import { create } from "zustand";
import { RUN_DURATION } from "@/game/core/constants";

export type GamePhase = "landing" | "loading" | "intro" | "playing" | "runFailed" | "runResetting" | "levelComplete" | "gameComplete" | "paused";

export const transitions: Record<GamePhase, readonly GamePhase[]> = {
  landing: ["loading"],
  loading: ["intro"],
  intro: ["playing"],
  playing: ["paused", "runFailed", "runResetting", "levelComplete"],
  paused: ["playing", "runResetting", "loading"],
  runFailed: ["runResetting"],
  runResetting: ["playing", "paused"],
  levelComplete: ["loading", "gameComplete"],
  gameComplete: ["loading"],
};

interface GameState {
  phase: GamePhase;
  run: number;
  resetVersion: number;
  elapsed: number;
  recordedFrames: number;
  sensitivity: number;
  invertY: boolean;
  reduceMotion: boolean;
  debug: boolean;
  transition: (phase: GamePhase) => void;
  pause: () => void;
  requestReset: () => void;
  finishReset: (resume: boolean) => void;
  restartTimeline: () => void;
  telemetry: (elapsed: number, recordedFrames: number) => void;
  configure: (settings: Partial<Pick<GameState, "sensitivity" | "invertY" | "reduceMotion" | "debug">>) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: "loading", run: 1, resetVersion: 0, elapsed: 0, recordedFrames: 0,
  sensitivity: 1, invertY: false, reduceMotion: false, debug: false,
  transition: (phase) => {
    if (transitions[get().phase].includes(phase)) set({ phase });
  },
  pause: () => { if (get().phase === "playing") set({ phase: "paused" }); },
  requestReset: () => {
    if (["playing", "paused", "runFailed"].includes(get().phase)) set({ phase: "runResetting" });
  },
  finishReset: (resume) => {
    if (get().phase !== "runResetting") return;
    set((state) => ({ phase: resume ? "playing" : "paused", run: state.run + 1, resetVersion: state.resetVersion + 1, elapsed: 0, recordedFrames: 0 }));
  },
  restartTimeline: () => set((state) => ({ phase: "intro", run: 1, resetVersion: state.resetVersion + 1, elapsed: 0, recordedFrames: 0 })),
  telemetry: (elapsed, recordedFrames) => set({ elapsed: Math.min(elapsed, RUN_DURATION), recordedFrames }),
  configure: (settings) => set(settings),
}));
