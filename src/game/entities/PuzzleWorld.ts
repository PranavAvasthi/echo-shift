import type { LevelDefinition } from "@/game/levels/level.types";
import type { InteractionActor, InteractionSource, PuzzleSnapshot } from "./interaction.types";
import type { ReplayAction } from "@/game/replay/replay.types";

export class PuzzleWorld {
  readonly occupants = new Map<string, InteractionSource[]>();
  doorOpen = false;
  canActivate = false;
  completed = false;
  private discoveredPlate = false;
  private playerBeyondDoor = false;

  constructor(readonly level: LevelDefinition) { this.reset(true); }

  update(actors: readonly InteractionActor[]) {
    for (const plate of this.level.plates) {
      const occupied = this.occupants.get(plate.id)!;
      occupied.length = 0;
      for (const actor of actors) {
        const p = actor.position;
        // Shared deterministic volumes use collision-resolved transforms for
        // players and sampled transforms for echoes. Jumping above a plate
        // does not count; echoes need no physics bodies and never block anyone.
        if (Math.abs(p.x - plate.position.x) <= 1.02 && Math.abs(p.z - plate.position.z) <= 1.02 && p.y >= .55 && p.y <= .99) occupied.push(actor.source);
      }
      if (occupied.some((source) => source.type === "player")) this.discoveredPlate = true;
    }
    this.doorOpen = this.level.door.requirements.every((id) => (this.occupants.get(id)?.length ?? 0) > 0);
    const player = actors.find((actor) => actor.source.type === "player");
    this.playerBeyondDoor = Boolean(player && player.position.z < this.level.door.position.z - 1);
    this.canActivate = Boolean(player && this.playerBeyondDoor && this.doorOpen && Math.hypot(player.position.x - this.level.objective.position.x, player.position.z - this.level.objective.position.z) < 2.1);
  }

  applyAction(source: InteractionSource, action: ReplayAction) {
    // A past self may affect shared puzzle entities, but only the current
    // player can finish a level. Past completion events cannot auto-win it.
    if (action.type === "ACTIVATE" && action.entityId === this.level.objective.id && source.type === "player" && this.canActivate && !this.completed) {
      this.completed = true;
      return true;
    }
    return false;
  }

  snapshot(echoCount: number): PuzzleSnapshot {
    const plates = this.level.plates.map((plate) => ({
      id: plate.id, label: plate.label, active: Boolean(this.occupants.get(plate.id)?.length),
      occupants: (this.occupants.get(plate.id) ?? []).map((source) => source.type === "player" ? "YOU" : `ECHO ${String(source.runId).padStart(2, "0")}`),
    }));
    const holding = [...this.occupants.values()].flat();
    let hint = "Find the cyan pressure plate. The door needs someone to stay behind.";
    if (this.discoveredPlate) hint = "The door closes when you leave. Return to the plate and press R.";
    if (echoCount) hint = "Your echo repeats your path. End a recording while standing on the plate.";
    if (holding.some((source) => source.type === "player")) hint = "Stay on the plate. Press R to leave your past self here.";
    if (this.doorOpen && holding.some((source) => source.type === "echo")) hint = "YOUR PAST REMAINS. Take the open door while your echo holds the plate.";
    if (this.playerBeyondDoor) hint = "Reach the violet core. Press E to stabilize the timeline.";
    if (this.canActivate) hint = "[E] STABILIZE THE CORE";
    return { plates, doorOpen: this.doorOpen, canActivate: this.canActivate, hint, echoCount };
  }

  reset(newTimeline = false) {
    this.doorOpen = this.canActivate = this.completed = this.playerBeyondDoor = false;
    if (newTimeline) this.discoveredPlate = false;
    for (const plate of this.level.plates) this.occupants.set(plate.id, []);
  }
}
