import { describe, expect, it } from "vitest";
import { echoReveal } from "./temporalPresentation";

describe("temporal reveal", () => {
  it("uses elapsed seconds, clamps endpoints, and finishes independently of FPS", () => {
    expect(echoReveal(-1, false)).toBe(0);
    expect(echoReveal(.375, false)).toBe(.5);
    for (const fps of [30, 60, 144]) {
      expect(echoReveal(Math.ceil(.75 * fps) / fps, false)).toBe(1);
    }
  });
  it("respects reduced motion without changing playback time", () => {
    expect(echoReveal(0, true)).toBe(1);
  });
});
