import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { GameRuntime } from "@/game/core/GameRuntime";

/** Replaceable primitive model. No controller logic depends on this hierarchy. */
export function Operative({ runtime }: { runtime: GameRuntime }) {
  const model = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  useFrame(() => {
    if (!model.current) return;
    model.current.rotation.y = runtime.controller.heading;
    const moving = runtime.animation === "walk" || runtime.animation === "run";
    const stride = moving ? Math.sin(runtime.clock.elapsed * (runtime.animation === "run" ? 15 : 10)) * 0.42 : 0;
    if (leftLeg.current) leftLeg.current.rotation.x = stride;
    if (rightLeg.current) rightLeg.current.rotation.x = -stride;
    if (leftArm.current) leftArm.current.rotation.x = -stride * .7;
    if (rightArm.current) rightArm.current.rotation.x = stride * .7;
  });

  return (
    <group ref={model}>
      <mesh position={[0, 0.1, 0]} castShadow><boxGeometry args={[0.48, 0.58, 0.28]} /><meshStandardMaterial color="#151b23" roughness={0.6} /></mesh>
      <mesh position={[0, 0.59, 0]} castShadow><boxGeometry args={[0.3, 0.32, 0.3]} /><meshStandardMaterial color="#202934" /></mesh>
      <mesh position={[0, 0.62, -0.157]}><boxGeometry args={[0.24, 0.055, 0.01]} /><meshBasicMaterial color="#62f3ff" /></mesh>
      <mesh position={[0, 0.27, -0.148]}><boxGeometry args={[0.3, 0.025, 0.01]} /><meshBasicMaterial color="#38e8ff" /></mesh>
      <mesh position={[0, 0.2, 0.19]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.12, 0.2, 3]} /><meshBasicMaterial color="#38e8ff" /></mesh>
      <mesh position={[0.22, 0.15, 0.15]}><boxGeometry args={[0.035, 0.1, 0.015]} /><meshBasicMaterial color="#ff3cac" /></mesh>
      <group ref={leftLeg} position={[-0.14, -0.2, 0]}><mesh position={[0, -0.27, 0]} castShadow><boxGeometry args={[0.18, 0.54, 0.22]} /><meshStandardMaterial color="#202934" /></mesh></group>
      <group ref={rightLeg} position={[0.14, -0.2, 0]}><mesh position={[0, -0.27, 0]} castShadow><boxGeometry args={[0.18, 0.54, 0.22]} /><meshStandardMaterial color="#202934" /></mesh></group>
      <group ref={leftArm} position={[-0.34, 0.3, 0]}><mesh position={[0, -0.2, 0]} castShadow><boxGeometry args={[0.15, 0.5, 0.18]} /><meshStandardMaterial color="#202934" /></mesh></group>
      <group ref={rightArm} position={[0.34, 0.3, 0]}><mesh position={[0, -0.2, 0]} castShadow><boxGeometry args={[0.15, 0.5, 0.18]} /><meshStandardMaterial color="#202934" /></mesh></group>
    </group>
  );
}
