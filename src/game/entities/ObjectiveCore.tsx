import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Mesh, MeshStandardMaterial } from "three";
import type { GameRuntime } from "@/game/core/GameRuntime";

export function ObjectiveCore({ runtime }: { runtime: GameRuntime }) {
  const core = useRef<Mesh>(null);
  const material = useRef<MeshStandardMaterial>(null);
  const position = runtime.world.level.objective.position;
  useFrame(() => {
    if (core.current) {
      core.current.rotation.y = runtime.clock.elapsed * .4;
      core.current.rotation.z = Math.sin(runtime.clock.elapsed * .7) * .08;
    }
    if (material.current) material.current.emissiveIntensity = runtime.world.canActivate ? 1.5 : .65;
  });
  return <group position={[position.x, position.y, position.z]}>
    <mesh ref={core}><octahedronGeometry args={[.6]} /><meshStandardMaterial ref={material} color="#d6b2ff" emissive="#b281ff" emissiveIntensity={.65} metalness={.25} roughness={.2} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.95, .018, 8, 48]} /><meshBasicMaterial color="#b281ff" /></mesh>
    <Html position={[0, 1.1, 0]} center distanceFactor={12} style={{ pointerEvents: "none" }}><span className="world-label objective-label">TEMPORAL CORE<small>E / STABILIZE</small></span></Html>
  </group>;
}
