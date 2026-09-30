import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshBasicMaterial, MeshStandardMaterial, type Group, type Mesh } from "three";
import { useGameStore } from "@/game/state/gameStore";
import type { PlayerAnimation } from "./player.types";
import type { GameClock } from "@/game/core/GameClock";

/** Player and echoes share the same silhouette, including the temporal device. */
export function CharacterBody({ motion, clock, holographic = false, reveal }: {
  motion: { animation: PlayerAnimation }; clock: GameClock; holographic?: boolean; reveal?: RefObject<{ value: number }>;
}) {
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const torso = useRef<Mesh>(null);
  const material = useMemo(() => holographic
    ? new MeshBasicMaterial({ color: "#62f3ff", transparent: true, opacity: .45, depthWrite: false })
    : new MeshStandardMaterial({ color: "#202934", roughness: .65 }), [holographic]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame(() => {
    const moving = motion.animation === "walk" || motion.animation === "run";
    const stride = moving ? Math.sin(clock.elapsed * (motion.animation === "run" ? 15 : 10)) * .42 : 0;
    if (leftLeg.current) leftLeg.current.rotation.x = stride;
    if (rightLeg.current) rightLeg.current.rotation.x = -stride;
    if (leftArm.current) leftArm.current.rotation.x = -stride * .7;
    if (rightArm.current) rightArm.current.rotation.x = stride * .7;
    const hologram = torso.current?.material;
    if (holographic && hologram instanceof MeshBasicMaterial) {
      const flicker = useGameStore.getState().reduceMotion ? 0 : Math.sin(clock.elapsed * 19) * .03;
      hologram.opacity = (.45 + flicker) * (reveal?.current.value ?? 1);
    }
  });
  return <group>
    <mesh ref={torso} position={[0, .1, 0]} material={material} castShadow={!holographic}><boxGeometry args={[.48, .58, .28]} /></mesh>
    <mesh position={[0, .59, 0]} material={material} castShadow={!holographic}><boxGeometry args={[.3, .32, .3]} /></mesh>
    <mesh position={[0, .62, -.157]}><boxGeometry args={[.24, .055, .01]} /><meshBasicMaterial color="#b6f8ff" /></mesh>
    <mesh position={[0, .27, -.148]}><boxGeometry args={[.3, .025, .01]} /><meshBasicMaterial color="#38e8ff" /></mesh>
    <mesh position={[0, .2, .19]} rotation={[0, 0, Math.PI]}><coneGeometry args={[.12, .2, 3]} /><meshBasicMaterial color="#38e8ff" /></mesh>
    <mesh position={[.22, .15, .15]}><boxGeometry args={[.035, .1, .015]} /><meshBasicMaterial color={holographic ? "#62f3ff" : "#ff3cac"} /></mesh>
    <group ref={leftLeg} position={[-.14, -.2, 0]}><mesh position={[0, -.27, 0]} material={material} castShadow={!holographic}><boxGeometry args={[.18, .54, .22]} /></mesh></group>
    <group ref={rightLeg} position={[.14, -.2, 0]}><mesh position={[0, -.27, 0]} material={material} castShadow={!holographic}><boxGeometry args={[.18, .54, .22]} /></mesh></group>
    <group ref={leftArm} position={[-.34, .3, 0]}><mesh position={[0, -.2, 0]} material={material} castShadow={!holographic}><boxGeometry args={[.15, .5, .18]} /></mesh></group>
    <group ref={rightArm} position={[.34, .3, 0]}><mesh position={[0, -.2, 0]} material={material} castShadow={!holographic}><boxGeometry args={[.15, .5, .18]} /></mesh></group>
    {holographic && <mesh position={[0, .1, 0]}><boxGeometry args={[.5, .6, .3]} /><meshBasicMaterial color="#b6f8ff" wireframe transparent opacity={.65} depthWrite={false} /></mesh>}
  </group>;
}
