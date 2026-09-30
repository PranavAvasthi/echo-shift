# ECHO//SHIFT — development log

## Completed
- Inspected repository: empty Git repository, no existing application or instructions.
- Selected React 19 / React Three Fiber 9 / Rapier 2 compatible foundation.
- Initialized Next.js App Router, strict TypeScript, lint tooling, and session-aware landing screen.
- Foundation validation: TypeScript, ESLint, and production build pass.
- Phase 1 complete: fixed-step Rapier character controller, camera-relative WASD, sprint, grounded jumping, acceleration/deceleration, room/platform collision, collision-aware third-person camera.
- Added input cleanup on pause/focus loss, pointer lock, mobile notice, WebGL failure handling, minimal HUD, and session-only settings.
- Seven foundation tests pass. Real desktop Chromium verified jump/landing, movement, wall collision, pause freeze, and manual reset; mobile notice verified separately.
- First browser pass exposed a zero-height scene wrapper and a pointer-lock cursor warp; both were fixed and regression-verified.
- Phase 2 recorder module complete: 25 Hz timestamp grid, bracketing physics resampling, quaternion slerp, velocity/animation capture, precise partial endpoints, independent action timestamps, bounded duration, idempotent finish.
- Phase 2 complete: actual collision-resolved player transforms are sampled after physics, partial/timeout runs are captured once, and a six-run archive remains in memory until restart/refresh.
- All checks pass: strict TypeScript, ESLint, 26 unit tests, production build, and three Chromium integration tests.
- Browser verification covers recorded frame growth, manual capture, exact 30.000-second/751-frame timeout capture, restart confirmation, client-route re-entry, refresh collapse, and mobile fallback.

## Currently working
- Documentation and final foundation review. Next gameplay milestone: Phase 3, real recorded echo playback.

## Remaining
- Phase 3: interpolation and actual recorded echo playback.
- Phase 4: shared pressure plate, door, switch interaction model.
- Phase 5: temporal run resets and echo creation.
- Prove the one-room cooperative puzzle before building any remaining levels.
- Phases 6–11: tutorial, five levels, visual polish, original audio, full UX, profiling.

## Architecture decisions
- Gameplay simulation lives outside React UI; mutable transforms use refs.
- Rapier uses a fixed 60 Hz simulation step; replay samples at 25 Hz with explicit timestamps.
- Session state lives only in memory. No browser storage, cookies, accounts, or backend.
- Primitive character/environment remain replaceable. Visual work stays minimal until the echo puzzle works.
- TypeScript 5.9 is pinned because the current lint parser does not support TypeScript 7.
- Transform samples come from post-physics observations. Actions retain their own timestamp stream and are never quantized to transform samples.
- Partial runs retain their precise final frame for later endpoint holding. This build does not implement or fake that echo behavior.
- A newly mounted game route starts fresh state; leaving the calibration route disposes its runtime. Preferences remain in memory only.
- Next.js App Router provides `/` and `/game`; gameplay is client-only and lazy loaded.

## Known issues / verification
- Current chamber is a movement test, not yet the cooperative puzzle. Doorway is open; floor marker and prism are non-interactive.
- Browser tests use full headless Chromium (`channel: chromium`). The smaller headless-shell rejected native pointer lock; full Chromium now verifies it without capturing the desktop mouse.
- R3F currently emits a single upstream Three.js Clock deprecation notice; Rapier emits a single WASM initialization deprecation notice. No application runtime errors observed.
- This initial delivery targets Phases 1 and 2, not the full game described in the roadmap.
