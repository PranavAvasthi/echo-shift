import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group, Mesh } from "three";
import { echoReveal } from "@/game/core/temporalPresentation";
import { ReplayPlayer } from "./ReplayPlayer";
import type { RecordedRun } from "./replay.types";
import type { GameRuntime } from "@/game/core/GameRuntime";
import { CharacterBody } from "@/game/player/CharacterBody";
import { useGameStore } from "@/game/state/gameStore";

function Echo({ recording, runtime }: { recording: RecordedRun; runtime: GameRuntime }) {
  const model = useRef<Group>(null);
  const scan = useRef<Mesh>(null);
  const reveal = useRef({ value: 1 });
  const replay = useMemo(() => new ReplayPlayer(recording), [recording]);
  useFrame(() => {
    const pose = replay.sample(runtime.clock.elapsed);
    if (!model.current) return;
    model.current.position.set(pose.position.x, pose.position.y, pose.position.z);
    model.current.quaternion.set(pose.rotation.x, pose.rotation.y, pose.rotation.z, pose.rotation.w);
    const state = useGameStore.getState();
    reveal.current.value = recording.runId === state.run - 1 ? echoReveal(runtime.clock.elapsed, state.reduceMotion) : 1;
    if (scan.current) {
      scan.current.visible = reveal.current.value < 1 && state.phase === "playing";
      scan.current.position.y = -.74 + 1.65 * reveal.current.value;
    }
  });
  return <group ref={model}>
    <CharacterBody motion={replay.pose} clock={runtime.clock} holographic reveal={reveal} />
    <mesh ref={scan} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[.36, .43, 24]} /><meshBasicMaterial color="#b6f8ff" transparent opacity={.8} depthWrite={false} />
    </mesh>
    <Html position={[0, 1.2, 0]} center distanceFactor={8} zIndexRange={[1, 0]} style={{ pointerEvents: "none" }}>
      <span className="echo-label" data-testid={`echo-${recording.runId}`}>ECHO {String(recording.runId).padStart(2, "0")}<small>YOUR PREVIOUS RUN</small></span>
    </Html>
  </group>;
}

export function EchoFleet({ runtime }: { runtime: GameRuntime }) {
  const run = useGameStore((s) => s.run);
  const recordings = runtime.timeline.recordings.filter((recording) => recording.runId < run);
  return <group>{recordings.map((recording) => <Echo key={recording.runId} recording={recording} runtime={runtime} />)}</group>;
}
