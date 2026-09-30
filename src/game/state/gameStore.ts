import { create } from "zustand";
import { RUN_DURATION } from "@/game/core/constants";
import type { RecordingSummary } from "@/game/replay/RunTimeline";
import type { RunEndReason } from "@/game/replay/replay.types";
import { EMPTY_PUZZLE, type PuzzleSnapshot } from "@/game/entities/interaction.types";
import { levels } from "@/game/levels";

export type GamePhase = "landing" | "loading" | "intro" | "playing" | "runFailed" | "runResetting" | "levelComplete" | "gameComplete" | "paused";

export const transitions: Record<GamePhase, readonly GamePhase[]> = {
  landing: ["loading"],
  loading: ["intro"],
  intro: ["playing"],
  playing: ["paused", "runFailed", "runResetting", "levelComplete"],
  paused: ["playing", "runResetting", "loading"],
  runFailed: ["runResetting"],
  runResetting: ["playing", "paused"],
  levelComplete: ["intro", "loading", "gameComplete"],
  gameComplete: ["loading"],
};

interface GameState {
  phase: GamePhase;
  run: number;
  levelIndex: number;
  totalLoops: number;
  resetVersion: number;
  elapsed: number;
  recordedFrames: number;
  archivedRuns: number;
  latestRecording: RecordingSummary | null;
  resetReason: RunEndReason;
  puzzle: PuzzleSnapshot;
  sessionElapsed: number;
  sensitivity: number;
  invertY: boolean;
  reduceMotion: boolean;
  debug: boolean;
  transition: (phase: GamePhase) => void;
  openSession: () => void;
  pause: () => void;
  requestReset: (reason?: RunEndReason) => void;
  finishReset: (resume: boolean) => void;
  restartTimeline: () => void;
  advanceLevel: () => void;
  telemetry: (elapsed: number, recordedFrames: number, puzzle?: PuzzleSnapshot, sessionElapsed?: number) => void;
  captured: (archivedRuns: number, latestRecording: RecordingSummary | null, totalLoops?: number) => void;
  configure: (settings: Partial<Pick<GameState, "sensitivity" | "invertY" | "reduceMotion" | "debug">>) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: "loading", run: 1, levelIndex: 0, totalLoops: 0, resetVersion: 0, elapsed: 0, recordedFrames: 0,
  archivedRuns: 0, latestRecording: null, resetReason: "manual",
  puzzle: EMPTY_PUZZLE, sessionElapsed: 0,
  sensitivity: 1, invertY: false, reduceMotion: false, debug: false,
  transition: (phase) => {
    if (transitions[get().phase].includes(phase)) set({ phase });
  },
  openSession: () => set({ phase: "loading", run: 1, levelIndex: 0, totalLoops: 0, resetVersion: 0, elapsed: 0, recordedFrames: 0, archivedRuns: 0, latestRecording: null, resetReason: "manual", puzzle: EMPTY_PUZZLE, sessionElapsed: 0 }),
  pause: () => { if (get().phase === "playing") set({ phase: "paused" }); },
  requestReset: (resetReason = "manual") => {
    if (["playing", "paused", "runFailed"].includes(get().phase)) set({ phase: "runResetting", resetReason });
  },
  finishReset: (resume) => {
    if (get().phase !== "runResetting") return;
    set((state) => ({ phase: resume ? "playing" : "paused", run: state.run + 1, resetVersion: state.resetVersion + 1, elapsed: 0, recordedFrames: 0, puzzle: EMPTY_PUZZLE }));
  },
  restartTimeline: () => set((state) => ({ phase: "intro", run: 1, levelIndex: 0, totalLoops: 0, resetVersion: state.resetVersion + 1, elapsed: 0, recordedFrames: 0, archivedRuns: 0, latestRecording: null, resetReason: "manual", puzzle: EMPTY_PUZZLE, sessionElapsed: 0 })),
  advanceLevel: () => {
    if (get().phase !== "levelComplete" || get().levelIndex + 1 >= levels.length) return;
    set((state) => ({ phase: "intro", levelIndex: state.levelIndex + 1, run: 1, resetVersion: state.resetVersion + 1, elapsed: 0, recordedFrames: 0, archivedRuns: 0, latestRecording: null, puzzle: EMPTY_PUZZLE }));
  },
  telemetry: (elapsed, recordedFrames, puzzle = get().puzzle, sessionElapsed = get().sessionElapsed) => set({ elapsed: Math.min(elapsed, levels[get().levelIndex]?.runDuration ?? RUN_DURATION), recordedFrames, puzzle, sessionElapsed }),
  captured: (archivedRuns, latestRecording, totalLoops = get().totalLoops) => set({ archivedRuns, latestRecording, totalLoops }),
  configure: (settings) => set(settings),
}));
