import { RigidBody } from "@react-three/rapier";
import type { GameRuntime } from "@/game/core/GameRuntime";
import { PressurePlate } from "@/game/entities/PressurePlate";
import { Door } from "@/game/entities/Door";
import { ObjectiveCore } from "@/game/entities/ObjectiveCore";

interface BlockProps {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
}

function CollisionBlock({ position, size, color = "#424a54" }: BlockProps) {
  return (
    <RigidBody type="fixed" position={position} colliders="cuboid">
      <mesh receiveShadow castShadow userData={{ cameraObstacle: true }}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </RigidBody>
  );
}

/** The first cooperative room; props stay replaceable without changing puzzle rules. */
export function Facility({ runtime }: { runtime: GameRuntime }) {
  return (
    <group>
      <CollisionBlock position={[0, -0.25, -2]} size={[18, 0.5, 26]} color="#353d47" />
      <CollisionBlock position={[-9, 2.5, -2]} size={[0.4, 5, 26]} />
      <CollisionBlock position={[9, 2.5, -2]} size={[0.4, 5, 26]} />
      <CollisionBlock position={[0, 2.5, 11]} size={[18, 5, 0.4]} />
      <CollisionBlock position={[0, 2.5, -15]} size={[18, 5, 0.4]} />
      <CollisionBlock position={[-5.3, 2, -5]} size={[7.4, 4, 0.5]} />
      <CollisionBlock position={[5.3, 2, -5]} size={[7.4, 4, 0.5]} />
      <CollisionBlock position={[0, 3.6, -5]} size={[3.2, 0.8, 0.5]} />
      <CollisionBlock position={[4, 0.55, 0]} size={[2.6, 1.1, 2.6]} color="#58616d" />
      <gridHelper args={[18, 18, "#65717b", "#454f5a"]} position={[0, 0.006, -2]} />
      {runtime.world.level.plates.map((plate) => <PressurePlate key={plate.id} definition={plate} runtime={runtime} />)}
      <Door runtime={runtime} />
      {[-8.7, 8.7].map((x) => (
        <mesh key={x} position={[x, 0.08, -2]}>
          <boxGeometry args={[0.04, 0.05, 25]} />
          <meshBasicMaterial color="#62f3ff" />
        </mesh>
      ))}
      <ObjectiveCore runtime={runtime} />
      <CollisionBlock position={[0, 0.25, -12]} size={[1.8, 0.5, 1.8]} />
    </group>
  );
}
