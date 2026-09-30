import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { GameRuntime } from "@/game/core/GameRuntime";
import { CharacterBody } from "./CharacterBody";

/** Replaceable primitive model. No controller logic depends on this hierarchy. */
export function Operative({ runtime }: { runtime: GameRuntime }) {
  const model = useRef<Group>(null);
  useFrame(() => {
    if (!model.current) return;
    model.current.rotation.y = runtime.controller.heading;
  });

  return (
    <group ref={model}>
      <CharacterBody motion={runtime} clock={runtime.clock} />
    </group>
  );
}
