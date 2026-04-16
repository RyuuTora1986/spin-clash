# Runtime Modules

This document maps the current runtime split so future work can target the right layer without reopening the whole codebase.

## Bootstrap
- `src/bootstrap-app-globals.js`
  - Initializes `window.SpinClash`
  - Provides the shared namespace used by plain script factories

## Config
- `src/config-text.js`
  - Centralized player-facing and UI text
- `src/config-tops.js`
  - Top definitions and archetype tuning
- `src/config-arenas.js`
  - Arena definitions and unlock data
- `src/config-modifiers.js`
  - Match modifier definitions
- `src/config-challenge-road.js`
  - Challenge Road node sequence

## Services
- `src/storage-service.js`
  - Local save read/write and versioned persistence
- `src/analytics-service.js`
  - Inspectable analytics event buffer abstraction
- `src/reward-service.js`
  - Rewarded flow abstraction and mock completion path
- `src/share-service.js`
  - Share abstraction with browser fallback
- `src/debug-service.js`
  - Debug query detection and lightweight debug helpers

## Progression And Loadout
- `src/progression-tools.js`
  - Save mutation helpers, currency, arena unlocks, challenge progress
- `src/loadout-ui-tools.js`
  - Loadout labels, mode UI, arena gating, currency display
- `src/ui-entry-tools.js`
  - Enter Battle, mode switch, top/arena selection, start/rematch routing

## Match Flow
- `src/round-flow-tools.js`
  - Round setup, launch, result sequencing, top data shaping
- `src/match-flow-tools.js`
  - Match result UI, rewards, continue, share, challenge progression

## Runtime Shell
- `src/startup-tools.js`
  - Boot ordering, startup hooks, animation loop start
- `src/ui-shell-tools.js`
  - HUD, overlays, battle/loadout shell visibility and refresh
- `src/debug-runtime-tools.js`
  - `render_game_to_text`, `advanceTime`, debug state sync, panel mounting
- `src/runtime-audio-tools.js`
  - Runtime error overlay, music, SFX, audio bootstrap guards
- `src/message-ui-tools.js`
  - In-battle message banner helper

## Render And Scene
- `src/scene-shell-tools.js`
  - Camera resize baseline and fixed scene lighting
- `src/aim-line-tools.js`
  - Aim line mesh and screen-to-arena projection
- `src/arena-math-tools.js`
  - Heart/hex math helpers and polygon queries
- `src/arena-render-tools.js`
  - Arena visual mesh building and rebuild orchestration
- `src/scratch-layer-tools.js`
  - Arena decal/scratch texture surface
- `src/trail-render-tools.js`
  - Player/enemy trail meshes
- `src/top-render-tools.js`
  - Top geometry and texture construction
- `src/battle-view-tools.js`
  - Camera shake and per-frame top mesh/crown pose updates

## Combat
- `src/combat-action-tools.js`
  - Input bindings, player dash/skill dispatch, flash overlay
- `src/battle-effects-tools.js`
  - Particle/orb spawn and runtime ticking
- `src/battle-sim-tools.js`
  - Movement, wall response, collision resolution, AI

## Remaining Role Of `src/main.js`
- Wires every factory together
- Holds runtime state shared across modules
- Owns `physTick` loop orchestration
- Keeps battle-kernel entry compatibility stable
- Exposes the thin wrapper surface used by existing UI hooks

## Practical Rule
- If the change is about data, use `config-*`
- If the change is about save/reward/share/debug plumbing, use `*-service.js`
- If the change is about flow/UI behavior, use `*-tools.js`
- If the change touches core duel numbers or outcome rules, inspect `src/main.js` plus `src/battle-sim-tools.js` and `src/round-flow-tools.js`
