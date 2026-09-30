/** Simulation time is authoritative. Pauses and inactive tabs never advance it. */
export class GameClock {
  elapsed = 0;

  step(delta: number) {
    if (!Number.isFinite(delta) || delta < 0) throw new Error("Invalid clock delta");
    this.elapsed += delta;
    return this.elapsed;
  }

  reset() { this.elapsed = 0; }
}
