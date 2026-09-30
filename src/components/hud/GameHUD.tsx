import { useEffect, useState } from "react";
import type { GameRuntime } from "@/game/core/GameRuntime";
import { levels } from "@/game/levels";
import { useGameStore } from "@/game/state/gameStore";

export function GameHUD({ runtime }: { runtime: GameRuntime }) {
  const elapsed = useGameStore((s) => s.elapsed);
  const run = useGameStore((s) => s.run);
  const frames = useGameStore((s) => s.recordedFrames);
  const archivedRuns = useGameStore((s) => s.archivedRuns);
  const phase = useGameStore((s) => s.phase);
  const debug = useGameStore((s) => s.debug);
  const puzzle = useGameStore((s) => s.puzzle);
  const levelIndex = useGameStore((s) => s.levelIndex);
  const level = levels[levelIndex];
  const remaining = Math.max(0, Math.ceil(level.runDuration - elapsed));
  return (
    <div className="hud" aria-label="Game status">
      <div className="hud-top">
        <div><div className="hud-logo">ECHO<span>{"//"}</span>SHIFT</div><div className="hud-label" data-testid="lab-name">LAB {String(levelIndex).padStart(2, "0")} / {level.name}<br />TEMPORAL RESEARCH DIVISION</div><div className={`gate-status ${puzzle.doorOpen ? "active" : ""}`} data-testid="gate-state">GATE {puzzle.doorOpen ? "OPEN" : "LOCKED"}</div>{puzzle.plates.map((plate) => <div key={plate.id} className="hud-label" data-testid={`plate-${plate.label.toLowerCase()}`}>PLATE {plate.label} / {plate.active ? plate.occupants.join(" + ") : "EMPTY"}</div>)}</div>
        <div><div className="hud-time" data-testid="timer">00:{String(remaining).padStart(2, "0")}</div><div className="hud-label">RUN TIME REMAINING</div></div>
        <div className="hud-right"><div className="hud-label accent">TEMPORAL SESSION ACTIVE</div><div className="hud-label"><span className="recording-light" />{phase === "playing" ? "RECORDING" : "STANDBY"}</div><div className="hud-label" data-testid="frame-count">{frames} FRAMES / 25 Hz</div><div className="hud-label" data-testid="archive-count">{archivedRuns} RUNS CAPTURED</div></div>
      </div>
      <div className="crosshair" aria-hidden="true" />
      {phase === "playing" && <div className="objective-strip"><span className="eyebrow">REACH THE CORE</span><p data-testid="tutorial-hint">{puzzle.hint}</p></div>}
      {phase === "playing" && puzzle.canActivate && <div className="interaction-prompt" data-testid="core-prompt">[E] STABILIZE</div>}
      <div className="hud-bottom">
        <div className="controls">W A S D / MOVE · MOUSE / LOOK<br />SPACE / JUMP · SHIFT / SPRINT<br />R / LEAVE ECHO · E / INTERACT · ESC / PAUSE</div>
        <div className="hud-run" data-testid="run-number">RUN {String(run).padStart(2, "0")}<div className="timeline" aria-hidden="true">{Array.from({ length: Math.min(run, 7) }, (_, i) => <span key={i} className={`timeline-dot ${i === Math.min(run, 7) - 1 ? "current" : "recorded"}`} />)}</div></div>
        <div className="hud-label hud-right">COOPERATE WITH YOUR PAST<br /><span data-testid="echo-count">{puzzle.echoCount} ACTIVE ECHOES</span></div>
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
      const echoes = runtime.echoes.map((echo) => `\nECHO ${echo.run.runId} ${echo.pose.position.x.toFixed(2)} ${echo.pose.position.y.toFixed(2)} ${echo.pose.position.z.toFixed(2)}`).join("");
      setReport([
        `FPS ${Math.round(1000 / Math.max(runtime.frameTime, 1))} / ${runtime.frameTime.toFixed(1)} ms`,
        `PLAYER ${x.toFixed(2)} ${y.toFixed(2)} ${z.toFixed(2)}`,
        `GROUNDED ${runtime.controller.grounded}`,
        `YAW ${runtime.yaw.toFixed(3)} / KEYS ${[...runtime.keys].join(",")}`,
        `LAB ${String(state.levelIndex).padStart(2, "0")} / RUN ${state.run}`,
        `TIME ${runtime.clock.elapsed.toFixed(3)}`,
        `FRAMES ${state.recordedFrames}`,
        `ECHOES ${runtime.echoes.length}`,
        `DRAW CALLS ${runtime.drawCalls}`,
        `TRIANGLES ${runtime.triangles}`,
        `PHASE ${state.phase}${archive}${echoes}`,
      ].join("\n"));
    };
    refresh();
    const interval = window.setInterval(refresh, 250);
    return () => window.clearInterval(interval);
  }, [runtime]);
  return <output className="debug-panel" data-testid="debug-panel">{report}</output>;
}
