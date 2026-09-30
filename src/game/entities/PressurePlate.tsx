import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import type { MeshStandardMaterial } from "three";
import type { GameRuntime } from "@/game/core/GameRuntime";
import type { LevelDefinition } from "@/game/levels/level.types";

export function PressurePlate({ definition, runtime }: { definition: LevelDefinition["plates"][number]; runtime: GameRuntime }) {
  const material = useRef<MeshStandardMaterial>(null);
  const p = definition.position;
  useFrame(() => {
    const active = Boolean(runtime.world.occupants.get(definition.id)?.length);
    if (material.current) material.current.emissiveIntensity = active ? 1.2 : .2;
  });
  return <group position={[p.x, 0, p.z]}>
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={[0, .045, 0]} receiveShadow><boxGeometry args={[2.2, .09, 2.2]} /><meshStandardMaterial ref={material} color="#293441" emissive="#38e8ff" emissiveIntensity={.2} /></mesh>
    </RigidBody>
    <mesh position={[0, .097, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.55, .63, 32]} /><meshBasicMaterial color="#62f3ff" side={2} /></mesh>
    <Html position={[0, .3, 0]} center distanceFactor={10} zIndexRange={[1, 0]} style={{ pointerEvents: "none" }}><span className="world-label">PLATE {definition.label}<small>HOLD TO POWER DOOR</small></span></Html>
  </group>;
}
