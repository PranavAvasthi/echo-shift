# ECHO//SHIFT — development log

## Completed
- Inspected repository: empty Git repository, no existing application or instructions.
- Selected React 19 / React Three Fiber 9 / Rapier 2 compatible foundation.
- Initialized Next.js App Router, strict TypeScript, lint tooling, and session-aware landing screen.
- Foundation validation: TypeScript, ESLint, and production build pass.

## Currently working
- Phase 1: Next.js, strict TypeScript, fixed-step physics, collision room, third-person controller.

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
- Gameplay has not yet been wired to a rendered scene or browser-verified.
- This initial delivery targets Phases 1 and 2, not the full game described in the roadmap.
