import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Mesh, PerspectiveCamera, Raycaster, Vector3 } from "three";
import type { GameRuntime } from "@/game/core/GameRuntime";
import { useGameStore } from "@/game/state/gameStore";

export function PlayerCamera({ runtime }: { runtime: GameRuntime }) {
  const { camera, scene, gl } = useThree();
  const scratch = useMemo(() => ({ target: new Vector3(), ideal: new Vector3(), direction: new Vector3(), ray: new Raycaster() }), []);
  const obstacles = useRef<Mesh[]>([]);
  const snap = useRef(true);
  const resetVersion = useGameStore((s) => s.resetVersion);
  useEffect(() => {
    snap.current = true;
    const meshes: Mesh[] = [];
    scene.traverse((object) => { if (object instanceof Mesh && object.userData.cameraObstacle) meshes.push(object); });
    obstacles.current = meshes;
  }, [scene, resetVersion]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const { target, ideal, direction, ray } = scratch;
    target.set(runtime.position.x, runtime.position.y + .5, runtime.position.z);
    const distance = 4.5;
    ideal.set(
      target.x + Math.sin(runtime.yaw) * Math.cos(runtime.pitch) * distance,
      target.y + Math.sin(runtime.pitch) * distance + .4,
      target.z + Math.cos(runtime.yaw) * Math.cos(runtime.pitch) * distance,
    );
    // Keep the follow camera in front of walls without coupling it to the player collider.
    direction.subVectors(ideal, target);
    const rayLength = direction.length();
    ray.set(target, direction.normalize());
    ray.far = rayLength;
    const hits = ray.intersectObjects(obstacles.current, false);
    if (hits.length) ideal.copy(target).addScaledVector(ray.ray.direction, Math.max(.4, hits[0].distance - .18));
    if (snap.current) { camera.position.copy(ideal); snap.current = false; }
    else camera.position.lerp(ideal, 1 - Math.exp(-12 * delta));
    camera.lookAt(target);
    if (camera instanceof PerspectiveCamera) {
      const sprint = runtime.animation === "run" && !useGameStore.getState().reduceMotion;
      camera.fov = MathUtils.damp(camera.fov, sprint ? 62 : 58, 8, delta);
      camera.updateProjectionMatrix();
    }
    runtime.frameTime = rawDelta * 1000;
    runtime.drawCalls = gl.info.render.calls;
    runtime.triangles = gl.info.render.triangles;
  });
  return null;
}
