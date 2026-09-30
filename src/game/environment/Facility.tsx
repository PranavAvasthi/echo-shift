import { RigidBody } from "@react-three/rapier";

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

/** Grey-box chamber. Puzzle entities intentionally wait until recorded playback is proven. */
export function Facility() {
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
      <CollisionBlock position={[-4, 0.15, 0]} size={[2.6, 0.3, 2.6]} color="#58616d" />
      <gridHelper args={[18, 18, "#65717b", "#454f5a"]} position={[0, 0.006, -2]} />
      <mesh position={[0, 0.025, 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.8, 1.8]} />
        <meshStandardMaterial color="#58616d" emissive="#38e8ff" emissiveIntensity={0.12} />
      </mesh>
      {[-8.7, 8.7].map((x) => (
        <mesh key={x} position={[x, 0.08, -2]}>
          <boxGeometry args={[0.04, 0.05, 25]} />
          <meshBasicMaterial color="#62f3ff" />
        </mesh>
      ))}
      <mesh position={[0, 1.3, -12]}>
        <octahedronGeometry args={[0.6]} />
        <meshStandardMaterial color="#aebbc8" emissive="#b281ff" emissiveIntensity={0.35} roughness={0.35} />
      </mesh>
      <CollisionBlock position={[0, 0.25, -12]} size={[1.8, 0.5, 1.8]} />
    </group>
  );
}
