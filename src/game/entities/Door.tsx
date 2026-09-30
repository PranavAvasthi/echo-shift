import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody, useBeforePhysicsStep, type RapierCollider } from "@react-three/rapier";
import { Html } from "@react-three/drei";
import { MathUtils, type Group, type MeshBasicMaterial } from "three";
import type { GameRuntime } from "@/game/core/GameRuntime";
import { useGameStore } from "@/game/state/gameStore";
import { levels } from "@/game/levels";

export function Door({ runtime }: { runtime: GameRuntime }) {
  const collider = useRef<RapierCollider>(null);
  const panel = useRef<Group>(null);
  const light = useRef<MeshBasicMaterial>(null);
  const resetVersion = useGameStore((s) => s.resetVersion);
  const levelIndex = useGameStore((s) => s.levelIndex);
  const { x, z } = levels[levelIndex].door.position;
  useEffect(() => {
    collider.current?.setEnabled(true);
    if (panel.current) panel.current.position.y = 0;
  }, [resetVersion]);
  useBeforePhysicsStep(() => {
    // Update collision directly at simulation rate; UI rendering cannot keep
    // the gate open after occupancy ends. The visual panel eases separately.
    collider.current?.setEnabled(!runtime.world.doorOpen);
  });
  useFrame((_, delta) => {
    if (panel.current) panel.current.position.y = MathUtils.damp(panel.current.position.y, runtime.world.doorOpen ? 3.3 : 0, 16, Math.min(delta, .05));
    light.current?.color.set(runtime.world.doorOpen ? "#38e8ff" : "#ff4057");
  });
  return <group position={[x, 0, z]}>
    <RigidBody type="fixed" colliders={false}><CuboidCollider ref={collider} args={[1.6, 1.6, .18]} position={[0, 1.6, 0]} /></RigidBody>
    <group ref={panel}>
      <mesh position={[0, 1.6, 0]} castShadow receiveShadow userData={{ cameraObstacle: true }}><boxGeometry args={[3.15, 3.2, .3]} /><meshStandardMaterial color="#151b23" metalness={.45} roughness={.55} /></mesh>
      <mesh position={[0, 1.6, .17]}><boxGeometry args={[.04, 2.8, .02]} /><meshBasicMaterial ref={light} color="#ff4057" /></mesh>
      {[-1.4, 1.4].map((side) => <mesh key={side} position={[side, 1.6, .18]}><boxGeometry args={[.05, 2.8, .03]} /><meshBasicMaterial color="#718191" /></mesh>)}
    </group>
    <Html position={[0, 3.45, .25]} center distanceFactor={12} zIndexRange={[1, 0]} style={{ pointerEvents: "none" }}><span className="world-label">TEMPORAL GATE<small>PRESSURE LINK / {levels[levelIndex].plates.map((plate) => plate.label).join(" + ")}</small></span></Html>
  </group>;
}
