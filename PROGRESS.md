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

## Currently working
- Phase 2: wire the verified recorder to player simulation, archive runs in memory, verify manual/automatic recording and timeline restart in the browser.

## Remaining
- Phase 2: timestamped, fixed-rate replay recording and automated validation.
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
- Next.js App Router provides `/` and `/game`; gameplay is client-only and lazy loaded.

## Known issues / verification
- Current chamber is a movement test, not yet the cooperative puzzle. Doorway is open; floor marker and prism are non-interactive.
- Chromium browser tests require a focused desktop window on macOS; headless pointer lock was rejected. Tests use native graphics.
- R3F currently emits a single upstream Three.js Clock deprecation notice; Rapier emits a single WASM initialization deprecation notice. No application runtime errors observed.
- This initial delivery targets Phases 1 and 2, not the full game described in the roadmap.
