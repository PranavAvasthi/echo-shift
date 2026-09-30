/** Presentation never advances or delays the recorded simulation timeline. */
export const RESET_DURATION_MS = 1200;
export const ECHO_REVEAL_SECONDS = .75;
export function echoReveal(elapsed: number, reducedMotion: boolean) {
  if (reducedMotion) return 1;
  const t = Math.max(0, Math.min(1, elapsed / ECHO_REVEAL_SECONDS));
  return t * t * (3 - 2 * t);
}
