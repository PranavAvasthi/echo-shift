"use client";

import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { PCFShadowMap } from "three";
import { Facility } from "./environment/Facility";
import { Player } from "./player/Player";
import { PlayerCamera } from "./player/PlayerCamera";
import { EchoFleet } from "./replay/Echo";
import { GameAudio } from "./audio/GameAudio";
import type { GameRuntime } from "./core/GameRuntime";
import { PHYSICS_STEP } from "./core/constants";
import { useGameStore } from "./state/gameStore";

function Ready() {
  useEffect(() => { useGameStore.getState().transition("intro"); }, []);
  return null;
}

export default function GameScene({ runtime, onContextLost }: { runtime: GameRuntime; onContextLost: () => void }) {
  const phase = useGameStore((s) => s.phase);
  return (
    <Canvas shadows={{ type: PCFShadowMap }} dpr={[1, 1.5]} camera={{ position: [0, 3, 10], fov: 58, near: .1, far: 80 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor("#10151d");
        gl.domElement.addEventListener("webglcontextlost", (event) => { event.preventDefault(); onContextLost(); }, { once: true });
      }}>
      <ambientLight intensity={1.2} />
      <hemisphereLight args={["#b6d0de", "#26313b", 1.4]} />
      <directionalLight position={[4, 10, 5]} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-bias={-.001} />
      <fog attach="fog" args={["#10151d", 24, 55]} />
      <Suspense fallback={null}>
        <Physics timeStep={PHYSICS_STEP} paused={phase !== "playing"} gravity={[0, -22, 0]}>
          <Facility runtime={runtime} />
          <Player runtime={runtime} />
          <Ready />
        </Physics>
        <PlayerCamera runtime={runtime} />
        <EchoFleet runtime={runtime} />
        <GameAudio runtime={runtime} />
      </Suspense>
    </Canvas>
  );
}
