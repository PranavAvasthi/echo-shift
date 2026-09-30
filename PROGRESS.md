# ECHO//SHIFT — development log

## Completed
- Original Web Audio feedback for footsteps, landing, plate edges, gate changes, temporal reset, echo appearance, core completion, and a quiet facility hum. Audio starts only on a user gesture, pauses/mutes with simulation, caps transient voices at twelve, and disposes on route exit. Existing pause panel has a session-only volume slider. Validation: 56 unit tests, TypeScript, lint, production build, and all four real-browser checks pass.
- Vertical-slice movement pass: 90ms coyote time, 120ms jump buffering, reset cleanup, smoothed camera aim, immediate wall retraction, and projection updates only when FOV changes. TypeScript, lint, and 51 unit tests pass.
- Updated the play guide, replay architecture explanation, limitations, and screenshots from actual recorded-echo browser playthroughs. The two-chamber prototype is ready to play.
- Gameplay HUD focuses on puzzle state; technical frame counts appear only with the development debug panel. Lowered the gate label to avoid covering the timer. TypeScript, lint, and a fresh real-browser two-chamber playthrough pass.
- Dual Core is playable after the first chamber: two distant plates, a 40-second run limit, two real echoes working simultaneously, chamber progression, session totals, final prototype completion, and a full timeline restart.
- Latest full verification: strict TypeScript, ESLint, 49 unit tests, production build, and all four browser tests pass. The browser campaign solves both chambers in five real loops without teleporting players or scripting clones.
- Screenshot review caught world-label stacking above the HUD/overlays; lowered all world labels beneath UI panels and checked TypeScript/lint.
- First cooperative chamber is playable end-to-end: physical gate, glowing shared plate, E-activated core, evolving tutorial hints, actual recorded echoes, reset effect, and victory/replay screen.
- Verified in Chromium without teleporting or scripting echoes: discover plate → leave it → collide with shut gate → record a partial run ending on plate → past self replays and holds → current self crosses → core activation → victory → clean restart.
- Full milestone validation: TypeScript, lint, 44 unit tests, production build, all four browser tests pass.
- Shared deterministic puzzle model and stable-ID tutorial definition: both current player and actual recorded echoes can occupy plates, the door requires live occupancy, and only the current player can activate the core. Six new interaction/reset/cooperation tests pass.
- Phase 3: actual recorded echo playback, timestamp position interpolation and quaternion slerp, end-pose holding, action crossing/rewind handling, multiple independent replays, shared player/echo character model.
- Playback validation: 37 total unit tests and the movement/echo browser regression pass; TypeScript, ESLint and production build pass.
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
- All checks pass: strict TypeScript, ESLint, 27 unit tests, production build, and three Chromium integration tests.
- Final movement review found that discrete gravity reduced jump clearance below the 1.1m training platform. Raised the impulse slightly and verified an actual platform jump/landing in Chromium, with a clearance regression test.
- Documented controls, setup/deployment, architecture diagram, replay design, performance decisions, limitations, and an actual browser screenshot in README.md.
- Browser verification covers recorded frame growth, manual capture, exact 30.000-second/751-frame timeout capture, restart confirmation, client-route re-entry, refresh collapse, and mobile fallback.

## Currently working
- Polish the first chamber's reset, actual echo reveal, sound feedback, and HUD. No additional levels or campaign mechanics in this pass.

## Remaining
- Reusable switches, cube relay, security timing, and remaining campaign levels.
- Remaining campaign, final facility art, original audio, full settings, and profiling.

## Architecture decisions
- Gameplay simulation lives outside React UI; mutable transforms use refs.
- Rapier uses a fixed 60 Hz simulation step; replay samples at 25 Hz with explicit timestamps.
- Session state lives only in memory. No browser storage, cookies, accounts, or backend.
- Primitive character/environment remain replaceable. Visual work stays minimal until the echo puzzle works.
- TypeScript 5.9 is pinned because the current lint parser does not support TypeScript 7.
- Transform samples come from post-physics observations. Actions retain their own timestamp stream and are never quantized to transform samples.
- Partial runs retain their precise final frame; actual playback holds that endpoint so deliberately short plate recordings work. No scripted clones are used.
- A newly mounted game route starts fresh state; leaving the game route disposes its runtime. Preferences remain in memory only.
- Chamber changes clear local recordings and entity occupancy while retaining session time/loop totals. A full timeline restart clears both chambers and all session totals.
- Next.js App Router provides `/` and `/game`; gameplay is client-only and lazy loaded.

## Known issues / verification
- Environment remains a deliberately small grey-box prototype; final facility art, spatial audio, campaign, and profiling remain unfinished.
- Browser tests use full headless Chromium (`channel: chromium`). The smaller headless-shell rejected native pointer lock; full Chromium now verifies it without capturing the desktop mouse.
- R3F currently emits a single upstream Three.js Clock deprecation notice; Rapier emits a single WASM initialization deprecation notice. No application runtime errors observed.
- Two playable chambers are complete; the full five-level campaign is still in development.
