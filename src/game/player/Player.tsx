import { useEffect, useRef } from "react";
import { CapsuleCollider, RigidBody, useAfterPhysicsStep, useBeforePhysicsStep, useRapier, type RapierRigidBody } from "@react-three/rapier";
import type { KinematicCharacterController } from "@dimforge/rapier3d-compat";
import { PHYSICS_STEP, RUN_DURATION, SPAWN } from "@/game/core/constants";
import type { GameRuntime } from "@/game/core/GameRuntime";
import { useGameStore } from "@/game/state/gameStore";
import { Operative } from "./Operative";

export function Player({ runtime }: { runtime: GameRuntime }) {
  const body = useRef<RapierRigidBody>(null);
  const character = useRef<KinematicCharacterController | null>(null);
  const resetVersion = useGameStore((s) => s.resetVersion);
  const { world } = useRapier();
  const publishAt = useRef(0);

  useEffect(() => {
    const controller = world.createCharacterController(0.015);
    controller.enableAutostep(0.25, 0.2, true);
    controller.enableSnapToGround(0.12);
    controller.setMaxSlopeClimbAngle(Math.PI / 4);
    character.current = controller;
    return () => { character.current = null; world.removeCharacterController(controller); };
  }, [world]);

  useEffect(() => {
    runtime.reset();
    publishAt.current = 0;
    body.current?.setTranslation(SPAWN, true);
    body.current?.setNextKinematicTranslation(SPAWN);
  }, [resetVersion, runtime]);

  useBeforePhysicsStep(() => {
    if (!body.current || !character.current || useGameStore.getState().phase !== "playing") return;
    const keys = runtime.keys;
    const movement = runtime.controller.step({
      forward: Number(keys.has("KeyW")) - Number(keys.has("KeyS")),
      right: Number(keys.has("KeyD")) - Number(keys.has("KeyA")),
      sprint: keys.has("ShiftLeft") || keys.has("ShiftRight"),
      jump: runtime.jumpQueued,
      yaw: runtime.yaw,
    }, PHYSICS_STEP);
    runtime.jumpQueued = false;
    // Rapier resolves displacement, rather than allowing a dynamic body to slide or topple.
    character.current.computeColliderMovement(body.current.collider(0), movement);
    const corrected = character.current.computedMovement();
    const position = body.current.translation();
    body.current.setNextKinematicTranslation({ x: position.x + corrected.x, y: position.y + corrected.y, z: position.z + corrected.z });
    runtime.controller.grounded = character.current.computedGrounded();
    if (runtime.controller.grounded && runtime.controller.velocity.y < 0) runtime.controller.velocity.y = 0;
    const speed = Math.hypot(runtime.controller.velocity.x, runtime.controller.velocity.z);
    runtime.animation = !runtime.controller.grounded ? "jump" : speed > 4.5 ? "run" : speed > .15 ? "walk" : "idle";
    runtime.clock.step(PHYSICS_STEP);
  });

  useAfterPhysicsStep(() => {
    if (!body.current || useGameStore.getState().phase !== "playing") return;
    Object.assign(runtime.position, body.current.translation());
    const elapsed = runtime.clock.elapsed;
    if (elapsed >= publishAt.current) {
      useGameStore.getState().telemetry(elapsed, 0);
      publishAt.current = elapsed + 0.1;
    }
    if (elapsed >= RUN_DURATION) useGameStore.getState().requestReset();
  });

  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[SPAWN.x, SPAWN.y, SPAWN.z]} enabledRotations={[false, false, false]}>
      <CapsuleCollider args={[0.45, 0.3]} />
      <Operative runtime={runtime} />
    </RigidBody>
  );
}
