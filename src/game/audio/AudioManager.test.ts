import { afterEach, describe, expect, it, vi } from "vitest";
import { AudioManager } from "./AudioManager";

function node() {
  return { connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null,
    frequency: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), setTargetAtTime: vi.fn() }, pan: { value: 0 }, type: "sine" };
}
class TestContext {
  static latest: TestContext;
  currentTime = 10;
  destination = {};
  oscillators: ReturnType<typeof node>[] = [];
  gains: ReturnType<typeof node>[] = [];
  panners: ReturnType<typeof node>[] = [];
  resume = vi.fn(async () => {});
  close = vi.fn(async () => {});
  constructor() { TestContext.latest = this; }
  createOscillator() { const n = node(); this.oscillators.push(n); return n; }
  createGain() { const n = node(); this.gains.push(n); return n; }
  createStereoPanner() { const n = node(); this.panners.push(n); return n; }
}
afterEach(() => vi.unstubAllGlobals());
describe("procedural game audio", () => {
  it("is lazy and tolerates unavailable audio", () => {
    vi.stubGlobal("AudioContext", undefined);
    const audio = new AudioManager();
    expect(() => { audio.unlock(); audio.play("echo"); audio.dispose(); }).not.toThrow();
  });
  it("caps transient voices, clamps panning and volume, and closes resources", () => {
    vi.stubGlobal("AudioContext", TestContext);
    const audio = new AudioManager();
    audio.unlock(); audio.setMix(2, true);
    const context = TestContext.latest;
    expect(context.gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(1, 10, .035);
    for (let i = 0; i < 30; i++) audio.play("plateOn", 4);
    expect(context.oscillators).toHaveLength(13); // one hum + at most twelve transient voices
    expect(context.panners[0].pan.value).toBe(1);
    expect(context.oscillators[1].frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(660, 10.12);
    audio.dispose();
    expect(context.close).toHaveBeenCalledOnce();
    expect(context.oscillators.every((oscillator) => oscillator.stop.mock.calls.length > 0)).toBe(true);
  });
  it("does not generate cues while paused or muted", () => {
    vi.stubGlobal("AudioContext", TestContext);
    const audio = new AudioManager(); audio.unlock();
    audio.setMix(.65, false); audio.play("reset");
    audio.setMix(0, true); audio.play("step");
    expect(TestContext.latest.oscillators).toHaveLength(1);
    audio.dispose();
  });
});
