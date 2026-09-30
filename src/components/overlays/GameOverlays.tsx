import { useState } from "react";
import Link from "next/link";
import { useGameStore } from "@/game/state/gameStore";

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
  if (phase === "loading") return <LoadingScreen />;
  if (phase === "intro") return (
    <div className="screen"><div className="screen-panel">
      <p className="eyebrow">LAB 00 / ENGINE CALIBRATION</p><h2>SESSION LINK<br />ESTABLISHED</h2>
      <p>Move around the test chamber. Jump onto the raised platform. Every movement is recorded at 25 samples per second.</p>
      <p>Press R to capture a partial run, or let the 30-second timer expire. This build validates movement and recording; recorded echoes arrive in the next milestone.</p>
      <p className="notice">Refreshing destroys this timeline.</p>
      <button className="primary-button" onClick={resume}>BEGIN CALIBRATION <span aria-hidden="true">↗</span></button>
      <p className="build-note">WASD / MOVE · SPACE / JUMP · SHIFT / SPRINT<br />MOUSE / LOOK · R / END RUN · ESC / PAUSE</p>
      {pointerError && <p role="alert">{pointerError}</p>}
    </div></div>
  );
  if (phase === "paused") return <PauseMenu resume={resume} pointerError={pointerError} />;
  if (phase === "runResetting") return <div className="screen" role="status"><div className="screen-panel"><p className="eyebrow">TEMPORAL CAPTURE COMPLETE</p><h2>RESETTING RUN</h2><p>Your movement remains in this session.</p></div></div>;
  return null;
}

function PauseMenu({ resume, pointerError }: { resume: () => void; pointerError: string }) {
  const sensitivity = useGameStore((s) => s.sensitivity);
  const invertY = useGameStore((s) => s.invertY);
  const reduceMotion = useGameStore((s) => s.reduceMotion);
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
      <div className="button-row"><button className="secondary-button" onClick={() => useGameStore.getState().requestReset()}>END CURRENT RUN</button><button className="secondary-button" onClick={() => setConfirmRestart(true)}>RESTART TIMELINE</button></div>
      {confirmRestart && <div role="alert"><p>Collapse this timeline? All recorded runs will be lost.</p><div className="button-row"><button className="secondary-button" onClick={() => { useGameStore.getState().restartTimeline(); setConfirmRestart(false); }}>COLLAPSE + RESTART</button><button className="secondary-button" onClick={() => setConfirmRestart(false)}>CANCEL</button></div></div>}
      <p className="build-note">MOVEMENT + RECORDING BUILD<br />ECHO PLAYBACK AND PUZZLES ARE THE NEXT MILESTONE.</p>
    </div></div>
  );
}
