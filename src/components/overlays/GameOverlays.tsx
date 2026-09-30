import { useState } from "react";
import Link from "next/link";
import { useGameStore } from "@/game/state/gameStore";
import { levels } from "@/game/levels";

export function LoadingScreen() {
  return <div className="screen" role="status"><div className="screen-panel"><p className="eyebrow">SYSTEM INITIALIZING</p><h2>CALIBRATING<br />TEMPORAL FIELD</h2><p>Loading renderer and physics environment…</p></div></div>;
}

export function RendererError() {
  return <div className="screen" role="alert"><div className="screen-panel"><p className="eyebrow">CONNECTION INTERRUPTED</p><h2>TEMPORAL<br />RENDERER OFFLINE</h2><p>Your browser could not initialize the graphics environment. Try enabling hardware acceleration or opening ECHO//SHIFT in a modern browser.</p><Link className="secondary-button" href="/">RETURN TO TERMINAL</Link></div></div>;
}

export function DesktopRequired() {
  return <div className="screen mobile-only"><div className="screen-panel"><p className="eyebrow">DESKTOP INTERFACE REQUIRED</p><h2>OPEN ON DESKTOP</h2><p>ECHO//SHIFT is currently designed for keyboard + mouse.</p><Link className="secondary-button" href="/">RETURN TO TERMINAL</Link></div></div>;
}

export function GameOverlays({ resume, pointerError }: { resume: () => void; pointerError: string }) {
  const phase = useGameStore((s) => s.phase);
  const reduceMotion = useGameStore((s) => s.reduceMotion);
  const run = useGameStore((s) => s.run);
  const levelIndex = useGameStore((s) => s.levelIndex);
  if (phase === "loading") return <LoadingScreen />;
  if (phase === "intro") return (
    <div className="screen"><div className="screen-panel">
      <p className="eyebrow">LAB {String(levelIndex).padStart(2, "0")} / {levels[levelIndex].name}</p><h2>{levelIndex === 0 ? <>YOUR PAST<br />REMAINS.</> : <>TWO PLATES.<br />THREE OF YOU.</>}</h2>
      <p>{levelIndex === 0 ? <>A locked door. A pressure plate. Only one of you.<br />For now.</> : <>Two separated pressure plates power the gate.<br />Both must stay active when you leave.</>}</p>
      <p>{levelIndex === 0 ? "Reach the violet core beyond the gate. Each reset leaves a hologram replaying your actual moves. End a run on the plate, then cooperate with your past self." : "Leave one echo holding Plate A. Leave another holding Plate B. On your third run, reach the core while your past selves work together."}</p>
      <p className="notice">Refreshing destroys this timeline.</p>
      <button className="primary-button" onClick={resume}>BEGIN EXPERIMENT <span aria-hidden="true">↗</span></button>
      <p className="build-note">WASD / MOVE · SPACE / JUMP · SHIFT / SPRINT<br />MOUSE / LOOK · R / LEAVE ECHO · E / INTERACT · ESC / PAUSE</p>
      {pointerError && <p role="alert">{pointerError}</p>}
    </div></div>
  );
  if (phase === "paused") return <PauseMenu resume={resume} pointerError={pointerError} />;
  if (phase === "runResetting") return <div className={`reset-effect${reduceMotion ? " still" : ""}`} role="status"><div><p className="eyebrow">YOUR PAST REMAINS</p><h2>RUN {String(run + 1).padStart(2, "0")}</h2><p>Echo {String(run).padStart(2, "0")} materializing</p></div></div>;
  if (phase === "levelComplete" || phase === "gameComplete") return <VictoryScreen />;
  return null;
}

function PauseMenu({ resume, pointerError }: { resume: () => void; pointerError: string }) {
  const sensitivity = useGameStore((s) => s.sensitivity);
  const invertY = useGameStore((s) => s.invertY);
  const reduceMotion = useGameStore((s) => s.reduceMotion);
  const latestRecording = useGameStore((s) => s.latestRecording);
  const configure = useGameStore((s) => s.configure);
  const [confirmRestart, setConfirmRestart] = useState(false);
  return (
    <div className="screen"><div className="screen-panel">
      <p className="eyebrow">SIMULATION SUSPENDED</p><h2>TIMELINE PAUSED</h2>
      <button className="primary-button" onClick={resume}>RESUME <span aria-hidden="true">↗</span></button>
      {pointerError && <p role="alert">{pointerError}</p>}
      <label className="setting">MOUSE SENSITIVITY <input aria-label="Mouse sensitivity" type="range" min="0.2" max="2.5" step="0.1" value={sensitivity} onChange={(e) => configure({ sensitivity: Number(e.target.value) })} /></label>
      <label className="setting">INVERT Y <input type="checkbox" checked={invertY} onChange={(e) => configure({ invertY: e.target.checked })} /></label>
      <label className="setting">REDUCE CAMERA MOTION <input type="checkbox" checked={reduceMotion} onChange={(e) => configure({ reduceMotion: e.target.checked })} /></label>
      {latestRecording && <p data-testid="recording-summary">RUN {latestRecording.runId} CAPTURED / {latestRecording.duration.toFixed(2)}s / {latestRecording.frameCount} FRAMES / {latestRecording.endReason.toUpperCase()}</p>}
      <div className="button-row"><button className="secondary-button" onClick={() => useGameStore.getState().requestReset()}>END CURRENT RUN</button><button className="secondary-button" onClick={() => setConfirmRestart(true)}>RESTART TIMELINE</button></div>
      {confirmRestart && <div role="alert"><p>Collapse this timeline? All recorded runs will be lost.</p><div className="button-row"><button className="secondary-button" onClick={() => { useGameStore.getState().restartTimeline(); setConfirmRestart(false); }}>COLLAPSE + RESTART</button><button className="secondary-button" onClick={() => setConfirmRestart(false)}>CANCEL</button></div></div>}
      <p className="build-note">END A RUN WHILE STANDING ON A PLATE.<br />YOUR ECHO WILL REMAIN THERE AFTER THE RECORDING ENDS.</p>
    </div></div>
  );
}

function VictoryScreen() {
  const run = useGameStore((s) => s.run);
  const time = useGameStore((s) => s.sessionElapsed);
  const echoes = useGameStore((s) => s.puzzle.echoCount);
  const levelIndex = useGameStore((s) => s.levelIndex);
  const totalLoops = useGameStore((s) => s.totalLoops);
  const hasNextLevel = levelIndex + 1 < levels.length;
  const ideal = levels[levelIndex].expectedRuns;
  return <div className="screen victory-screen"><div className="screen-panel">
    <p className="eyebrow">{hasNextLevel ? "TEMPORAL CORE SECURED" : `${levels.length} CHAMBERS CLEARED`}</p><h2>TIMELINE<br />STABLE.</h2>
    <p>You held the door open with your own past.<br />Every hologram was a decision you made.</p>
    <div className="victory-stats"><span data-testid="total-loops">{totalLoops}<small>TOTAL TEMPORAL LOOPS</small></span><span>{time.toFixed(1)}s<small>ACTIVE SESSION TIME</small></span><span>{echoes}<small>COOPERATING ECHOES</small></span></div>
    <p className="notice">{run <= ideal ? `PERFECT SYNC / SOLVED IN ${ideal === 2 ? "TWO" : "THREE"} LOOPS` : `STABLE / CAN YOU SOLVE IT IN ${ideal} LOOPS?`}</p>
    {hasNextLevel && <button className="primary-button" onClick={() => useGameStore.getState().advanceLevel()}>ENTER {levels[levelIndex + 1].name} <span aria-hidden="true">↗</span></button>}
    <button className={hasNextLevel ? "secondary-button" : "primary-button"} onClick={() => useGameStore.getState().restartTimeline()}>BEGIN NEW TIMELINE <span aria-hidden="true">↗</span></button>
    <Link className="secondary-button" href="/">COLLAPSE TIMELINE</Link>
    <p className="build-note">{hasNextLevel ? "NEXT: COORDINATE MULTIPLE PAST SELVES" : "TWO-CHAMBER PROTOTYPE COMPLETE"}<br />THE FULL FIVE-LEVEL CAMPAIGN IS STILL IN DEVELOPMENT.</p>
  </div></div>;
}
