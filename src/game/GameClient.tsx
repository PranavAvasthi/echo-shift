"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { GameRuntime } from "./core/GameRuntime";
import { usePlayerInput } from "./player/usePlayerInput";
import { useGameStore } from "./state/gameStore";
import { levels } from "./levels";
import { RESET_DURATION_MS } from "./core/temporalPresentation";
import { GameHUD } from "@/components/hud/GameHUD";
import { DesktopRequired, GameOverlays, LoadingScreen, RendererError } from "@/components/overlays/GameOverlays";
import { RendererBoundary } from "@/components/ui/RendererBoundary";

const GameScene = dynamic(() => import("./GameScene"), { ssr: false, loading: LoadingScreen });

export default function GameClient() {
  const [runtime] = useState(() => new GameRuntime());
  const [rendererStatus, setRendererStatus] = useState<"checking" | "ready" | "offline" | "mobile">("checking");
  const [pointerError, setPointerError] = useState("");
  const phase = useGameStore((s) => s.phase);
  const volume = useGameStore((s) => s.volume);
  usePlayerInput(runtime);
  useEffect(() => () => runtime.audio.dispose(), [runtime]);
  useEffect(() => runtime.audio.setMix(volume, ["playing", "runResetting", "levelComplete", "gameComplete"].includes(phase)), [runtime, volume, phase]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      // A newly mounted calibration owns a new runtime. Match the UI store to
      // it when navigating back from the landing route, not just on refresh.
      useGameStore.getState().openSession();
      useGameStore.getState().configure({ reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches });
      if (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 700) { setRendererStatus("mobile"); return; }
      try {
        const probe = document.createElement("canvas");
        const context = probe.getContext("webgl2");
        if (!context) { setRendererStatus("offline"); return; }
        context.getExtension("WEBGL_lose_context")?.loseContext();
        setRendererStatus("ready");
      } catch { setRendererStatus("offline"); }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (phase === "paused" || phase === "intro" || phase === "levelComplete" || phase === "gameComplete") {
      runtime.clearInput();
      if (document.pointerLockElement) document.exitPointerLock();
    }
    if (phase === "levelComplete" && useGameStore.getState().levelIndex === levels.length - 1) useGameStore.getState().transition("gameComplete");
    if (phase === "levelComplete") runtime.audio.play("complete");
    if (phase !== "runResetting") return;
    runtime.clearInput();
    runtime.audio.play("reset");
    runtime.capture(useGameStore.getState().resetReason);
    useGameStore.getState().captured(runtime.timeline.count, runtime.timeline.summary(), runtime.sessionLoops);
    const timer = window.setTimeout(() => useGameStore.getState().finishReset(Boolean(document.pointerLockElement) && !document.hidden), RESET_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [phase, runtime]);

  const resume = useCallback(() => {
    runtime.audio.unlock();
    const canvas = document.querySelector<HTMLCanvasElement>(".game-shell canvas");
    if (!canvas?.requestPointerLock) { setPointerError("Mouse capture is unavailable. Open the game directly in a desktop browser."); return; }
    const begin = () => { setPointerError(""); useGameStore.getState().transition("playing"); };
    try {
      // Keep the request in the click gesture; browsers reject deferred pointer lock.
      const request = canvas.requestPointerLock();
      if (request) request.then(begin).catch((error: unknown) => setPointerError(`Mouse capture was declined. Click the button again to continue.${process.env.NODE_ENV === "development" && error instanceof Error ? ` (${error.message})` : ""}`));
      else begin();
    } catch { setPointerError("Mouse capture was declined. Click the button again to continue."); }
  }, [runtime]);

  return (
    <main className="game-shell">
      <DesktopRequired />
      <div className="desktop-game">
        {rendererStatus === "checking" && <LoadingScreen />}
        {rendererStatus === "offline" && <RendererError />}
        {rendererStatus === "ready" && <RendererBoundary><GameScene runtime={runtime} onContextLost={() => { useGameStore.getState().pause(); setRendererStatus("offline"); }} /><GameHUD runtime={runtime} /><GameOverlays resume={resume} pointerError={pointerError} /></RendererBoundary>}
      </div>
    </main>
  );
}
