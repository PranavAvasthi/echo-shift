import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group } from "three";
import { ReplayPlayer } from "./ReplayPlayer";
import type { RecordedRun } from "./replay.types";
import type { GameRuntime } from "@/game/core/GameRuntime";
import { CharacterBody } from "@/game/player/CharacterBody";
import { useGameStore } from "@/game/state/gameStore";

function Echo({ recording, runtime }: { recording: RecordedRun; runtime: GameRuntime }) {
  const model = useRef<Group>(null);
  const replay = useMemo(() => new ReplayPlayer(recording), [recording]);
  useFrame(() => {
    const pose = replay.sample(runtime.clock.elapsed);
    if (!model.current) return;
    model.current.position.set(pose.position.x, pose.position.y, pose.position.z);
    model.current.quaternion.set(pose.rotation.x, pose.rotation.y, pose.rotation.z, pose.rotation.w);
  });
  return <group ref={model}>
    <CharacterBody motion={replay.pose} clock={runtime.clock} holographic />
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
