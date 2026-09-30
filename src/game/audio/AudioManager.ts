export type SoundCue = "step" | "land" | "plateOn" | "plateOff" | "door" | "reset" | "echo" | "complete";
const cues: Record<SoundCue, readonly [number, number, number, number]> = {
  step: [90, 45, .055, .035], land: [120, 40, .13, .065],
  plateOn: [440, 660, .12, .06], plateOff: [330, 165, .12, .045],
  door: [100, 180, .35, .04], reset: [600, 55, .95, .07],
  echo: [220, 880, .65, .055], complete: [440, 1320, 1.1, .07],
};

/** Original procedural cues: bounded voices, no downloads, timers, or copyrighted assets. */
export class AudioManager {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private hum: OscillatorNode | null = null;
  private voices = new Set<OscillatorNode>();
  private volume = .65;
  private active = false;

  unlock() {
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = 0;
        this.master.connect(this.context.destination);
        const bed = this.context.createGain();
        bed.gain.value = .012;
        bed.connect(this.master);
        this.hum = this.context.createOscillator();
        this.hum.frequency.value = 55;
        this.hum.connect(bed);
        this.hum.start();
      }
      void this.context.resume().catch(() => { /* Silent fallback when browser denies audio. */ });
    } catch { /* Gameplay remains available when audio is unavailable. */ }
  }

  setMix(volume: number, active: boolean) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.active = active;
    if (this.context && this.master) this.master.gain.setTargetAtTime(active ? this.volume : 0, this.context.currentTime, .035);
  }

  play(cue: SoundCue, pan = 0) {
    const context = this.context;
    if (!context || !this.master || !this.active || !this.volume || this.voices.size >= 12) return;
    const [start, end, duration, level] = cues[cue];
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const panner = context.createStereoPanner();
    oscillator.type = cue === "step" || cue === "land" ? "triangle" : "sine";
    const now = context.currentTime;
    oscillator.frequency.setValueAtTime(start, now);
    oscillator.frequency.exponentialRampToValueAtTime(end, now + duration);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(level, now + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    oscillator.connect(gain); gain.connect(panner); panner.connect(this.master);
    this.voices.add(oscillator);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); panner.disconnect(); this.voices.delete(oscillator); };
    oscillator.start(now); oscillator.stop(now + duration + .02);
  }

  dispose() {
    for (const voice of this.voices) voice.stop();
    this.voices.clear();
    this.hum?.stop();
    if (this.context) void this.context.close().catch(() => {});
    this.context = this.master = this.hum = null;
  }
}
