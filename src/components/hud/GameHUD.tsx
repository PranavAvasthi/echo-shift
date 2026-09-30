import { useEffect, useState } from "react";
import type { GameRuntime } from "@/game/core/GameRuntime";
import { RUN_DURATION } from "@/game/core/constants";
import { useGameStore } from "@/game/state/gameStore";

export function GameHUD({ runtime }: { runtime: GameRuntime }) {
  const elapsed = useGameStore((s) => s.elapsed);
  const run = useGameStore((s) => s.run);
  const frames = useGameStore((s) => s.recordedFrames);
  const archivedRuns = useGameStore((s) => s.archivedRuns);
  const phase = useGameStore((s) => s.phase);
  const debug = useGameStore((s) => s.debug);
  const remaining = Math.max(0, Math.ceil(RUN_DURATION - elapsed));
  return (
    <div className="hud" aria-label="Game status">
      <div className="hud-top">
        <div><div className="hud-logo">ECHO<span>{"//"}</span>SHIFT</div><div className="hud-label">LAB 00 / CONTROLLER CALIBRATION<br />TEMPORAL RESEARCH DIVISION</div></div>
        <div><div className="hud-time" data-testid="timer">00:{String(remaining).padStart(2, "0")}</div><div className="hud-label">RUN TIME REMAINING</div></div>
        <div className="hud-right"><div className="hud-label accent">TEMPORAL SESSION ACTIVE</div><div className="hud-label"><span className="recording-light" />{phase === "playing" ? "RECORDING" : "STANDBY"}</div><div className="hud-label" data-testid="frame-count">{frames} FRAMES / 25 Hz</div><div className="hud-label" data-testid="archive-count">{archivedRuns} RUNS CAPTURED</div></div>
      </div>
      <div className="crosshair" aria-hidden="true" />
      <div className="hud-bottom">
        <div className="controls">W A S D / MOVE · MOUSE / LOOK<br />SPACE / JUMP · SHIFT / SPRINT<br />R / END RUN · ESC / PAUSE</div>
        <div className="hud-run" data-testid="run-number">RUN {String(run).padStart(2, "0")}<div className="timeline" aria-hidden="true">{Array.from({ length: Math.min(run, 7) }, (_, i) => <span key={i} className={`timeline-dot ${i === Math.min(run, 7) - 1 ? "current" : "recorded"}`} />)}</div></div>
        <div className="hud-label hud-right">FOUNDATION BUILD 0.1<br />MOVEMENT + RECORDING TEST<br />ECHO PLAYBACK COMING NEXT</div>
      </div>
      {process.env.NODE_ENV === "development" && debug && <DebugPanel runtime={runtime} />}
    </div>
  );
}

function DebugPanel({ runtime }: { runtime: GameRuntime }) {
  const [report, setReport] = useState("");
  useEffect(() => {
    const refresh = () => {
      const { x, y, z } = runtime.position;
      const state = useGameStore.getState();
      const last = runtime.timeline.summary();
      const archive = last ? `\nARCHIVED ${runtime.timeline.count} / TOTAL ${runtime.timeline.totalRuns}\nLAST ${last.endReason} / ${last.duration.toFixed(3)} s / ${last.frameCount} frames\nEND ${last.end.x.toFixed(2)} ${last.end.y.toFixed(2)} ${last.end.z.toFixed(2)}` : "\nARCHIVED 0";
      setReport(`FPS ${Math.round(1000 / Math.max(runtime.frameTime, 1))} / ${runtime.frameTime.toFixed(1)} ms\nPLAYER ${x.toFixed(2)} ${y.toFixed(2)} ${z.toFixed(2)}\nGROUNDED ${runtime.controller.grounded}\nYAW ${runtime.yaw.toFixed(3)} / KEYS ${[...runtime.keys].join(",")}\nLAB 00 / RUN ${state.run}\nTIME ${runtime.clock.elapsed.toFixed(3)}\nFRAMES ${state.recordedFrames}\nECHOES 0\nDRAW CALLS ${runtime.drawCalls}\nTRIANGLES ${runtime.triangles}\nPHASE ${state.phase}${archive}`);
    };
    refresh();
    const interval = window.setInterval(refresh, 250);
    return () => window.clearInterval(interval);
  }, [runtime]);
  return <output className="debug-panel" data-testid="debug-panel">{report}</output>;
}
