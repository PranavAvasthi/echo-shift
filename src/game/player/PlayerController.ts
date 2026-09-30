import type { Vec3 } from "./player.types";

export interface MovementInput {
  forward: number;
  right: number;
  sprint: boolean;
  jump: boolean;
  yaw: number;
}

export class PlayerController {
  readonly velocity: Vec3 = { x: 0, y: 0, z: 0 };
  grounded = false;
  heading = 0;
  private groundGrace = 0;
  private jumpBuffer = 0;

  step(input: MovementInput, dt: number): Vec3 {
    // Forgive a late ledge jump and a press just before landing, without allowing double jumps.
    this.groundGrace = this.grounded ? .09 : Math.max(0, this.groundGrace - dt);
    this.jumpBuffer = input.jump ? .12 : Math.max(0, this.jumpBuffer - dt);
    const length = Math.hypot(input.forward, input.right);
    const speed = input.sprint ? 6.6 : 4.2;
    const forward = length ? input.forward / length : 0;
    const right = length ? input.right / length : 0;
    const targetX = (right * Math.cos(input.yaw) - forward * Math.sin(input.yaw)) * speed;
    const targetZ = (-forward * Math.cos(input.yaw) - right * Math.sin(input.yaw)) * speed;
    const response = 1 - Math.exp(-(this.grounded ? 24 : 10) * dt);
    this.velocity.x += (targetX - this.velocity.x) * response;
    this.velocity.z += (targetZ - this.velocity.z) * response;
    if (length) this.heading = Math.atan2(-targetX, -targetZ);
    if (this.jumpBuffer > 0 && this.groundGrace > 0) {
      this.velocity.y = 7.5;
      this.grounded = false;
      this.groundGrace = this.jumpBuffer = 0;
    }
    this.velocity.y = this.grounded ? -0.5 : Math.max(-24, this.velocity.y - 22 * dt);
    return { x: this.velocity.x * dt, y: this.velocity.y * dt, z: this.velocity.z * dt };
  }

  reset() {
    this.velocity.x = this.velocity.y = this.velocity.z = 0;
    this.grounded = false;
    this.heading = 0;
    this.groundGrace = this.jumpBuffer = 0;
  }
}
