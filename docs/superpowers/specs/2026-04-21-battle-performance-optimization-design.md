# Battle Performance Optimization Design

Date: 2026-04-21
Project: `spin-clash`
Focus: low/mid-end mobile battle performance, with bug-driven performance regressions included in scope

## Goal

Run battle scenes smoothly on low/mid-end mobile devices without changing combat rules or dulling critical duel feedback.

This pass must improve both:

- subjective feel: launch, collision, skill burst, and round-result beats should not feel hitchy
- objective performance: battle frame time should stay within an acceptable range for most of the match instead of relying on averages alone

## Success Criteria

### Objective

- steady-state battle frame time target: `16.7ms - 22ms`
- acceptable short spikes: up to `28ms - 33ms`, but not in long consecutive runs
- frame analysis must track:
  - average frame time
  - p95 / p99 frame time or equivalent spike buckets
  - long-frame counters for `>22ms`, `>28ms`, `>33ms`
  - battle sub-phase timing for the main runtime slices

### Subjective

- launch input should not feel delayed
- heavy collisions should not create obvious hitch chains
- burst skill activation should preserve impact and timing clarity
- round-result and match-result transitions should remain clean
- three consecutive matches should not exhibit progressive slowdown

## Non-Goals

- no combat rebalance
- no changes to collision formulas purely for speed unless a correctness bug is found
- no broad shell/UI redesign outside battle-adjacent surfaces
- no new graphics settings menu in this pass unless existing debug/perf instrumentation makes one trivially safe

## Scope

### In Scope

- battle loop instrumentation
- battle logic hot-path optimization
- performance bugs that inflate battle cost
- HUD / DOM update frequency control during battle
- battle-only render-cost reduction for low/mid-end mobile conditions
- regression checks for battle performance-sensitive behavior

### Out of Scope

- home showcase performance
- quick battle preview / decorative preview renderers, except where they interfere with active battle state
- provider / analytics forwarding performance outside battle runtime cost

## Current Hotspot Hypothesis

The current battle cost is likely cumulative rather than caused by one catastrophic defect.

High-probability contributors:

1. `ui-shell-tools.js`
- `updateHUD()` performs many DOM reads/writes every frame
- frequent `textContent`, `style.width`, `className`, and `querySelector('#burst-ring circle')`
- several values do not need 60fps full refresh

2. `battle-sim-tools.js`
- repeated `Date.now()` usage in active battle path
- repeated `mesh.traverse(...)` for guard / shield / phantom material changes
- per-frame material mutation across mesh hierarchies

3. `battle-view-tools.js`
- repeated `Date.now()` for wobble / crown pulse
- per-frame `_crown.traverse(...)` updates

4. `scratch-layer-tools.js`
- battle-time canvas draw + `texture.needsUpdate = true`
- likely too frequent on mobile GPUs

5. `trail-render-tools.js`
- per-frame position array churn and per-mesh opacity / scale updates
- cost is small on desktop but stacks on mobile alongside other battle work

6. `battle-effects-tools.js`
- collision particles create new meshes/materials on demand
- can produce GC spikes during heavy contact

7. Render-side baseline cost
- main renderer enables shadows globally
- main scene lights include a shadow-casting point light
- geometry and transparency load are not trivial for low-end mobile

## Known Correctness / Perf-Bug Suspects

These must be explicitly checked because they can create invisible performance waste:

- `ui-shell-tools.js` enemy spin percentage currently derives from `te.spin / tp.maxSpin`, which is likely incorrect and may trigger bad state churn
- orb respawn timer lifecycle must be checked for stale timers across round resets / restarts
- battle-end state must stop unnecessary battle-only updates
- repeated DOM queries in hot paths must be eliminated or proven cold
- particle / mesh creation volume during collision spikes must be measured

## Design Overview

The optimization pass will proceed in four layers, in order.

### Layer 1: Instrumentation and Baseline

Add battle-performance instrumentation before changing behavior.

Collect:

- frame time samples
- long-frame bucket counts
- timings for:
  - `physTick`
  - `battleViewTools.updateFrame`
  - `uiShellTools.updateHUD`
  - `scratchLayerTools.tick`
  - `renderer.render`
- counts for:
  - live particles
  - live orbs
  - trail points

Outputs:

- debug/runtime snapshot summary
- lightweight in-memory rolling metrics
- no player-facing UI changes outside debug/runtime inspection

Reason:

- prevents placebo optimization
- allows before/after comparisons per optimization slice
- helps isolate bug-driven spikes

### Layer 2: Bug and Hot-Path Cleanup

Fix correctness issues and obviously wasteful hot-path behavior before introducing visual downgrade.

Planned work:

- fix enemy spin percentage computation
- audit orb respawn timeout lifecycle around round init / round end / reset
- verify battle-only systems stop updating when not in active combat
- remove hot-path repeated DOM queries by caching battle HUD element refs
- replace `Date.now()`-driven battle animation pulses with loop-time accumulation
- replace repeated `mesh.traverse(...)` in battle with cached mutable material refs; if a subtree cannot be safely cached, leave it unchanged in this pass rather than updating it every frame

Reason:

- these are high-confidence wins
- they improve both correctness and performance
- they reduce cost without changing visual density first

### Layer 3: Frequency Control

Reduce unnecessary per-frame work while preserving feel.

Planned work:

- split HUD refresh frequency:
  - bars and critical state may update more often
  - text and status strings refresh at lower frequency or on threshold change
- throttle scratch updates:
  - only redraw when displacement exceeds a threshold
  - enforce a minimum upload interval before `texture.needsUpdate`
- reduce trail sampling frequency:
  - record points by distance or time threshold instead of every frame
- cap particle emission density per collision band

Reason:

- mobile performance usually improves more from "do less often" than "do the same cheaper"
- maintains most of the visual language while cutting redundant work

### Layer 4: Battle-Only Mobile Downgrade

If layers 1-3 are insufficient, enable targeted battle-time downgrade for low/mid-end mobile conditions.

Allowed downgrade targets:

- disable main battle shadows
- lower active battle renderer pixel ratio ceiling
- reduce trail length / density
- reduce scratch upload cadence further
- lower collision particle count
- lower certain glow / pulse animation rates

Constraints:

- battle readability must remain intact
- collision readability and skill readiness cues must remain intact
- no removal of critical gameplay feedback

## Detailed Module Plan

### `src/main.js`

- add battle metrics sampling wrapper around core phases
- keep instrumentation minimal and removable
- ensure timers like orb respawn are cleared/reset safely
- preserve battle loop order unless a measured bug requires reordering

### `src/ui-shell-tools.js`

- cache battle HUD DOM references once
- eliminate per-frame selector work
- add a battle HUD scheduler:
  - fast path for bars / urgent states
  - slower path for text / cooldown strings / role labels
- update only when values materially change

### `src/battle-sim-tools.js`

- remove `Date.now()` use from active battle simulation visuals
- replace runtime mesh traversal with cached material mutation hooks
- verify no battle-state mutation leaks after round end

### `src/battle-view-tools.js`

- use deterministic accumulated battle time instead of `Date.now()`
- avoid per-frame `_crown.traverse(...)`
- cache affected visual nodes/materials once at top creation time

### `src/scratch-layer-tools.js`

- add displacement gating
- add minimum update interval
- avoid texture upload on frames where visible trail contribution is negligible

### `src/trail-render-tools.js`

- convert trail point recording to threshold/time-gated sampling
- avoid opacity/scale writes for hidden trail nodes entirely in the active battle path

### `src/battle-effects-tools.js`

- reduce runtime allocation pressure
- implement bounded reuse for collision particles; if full pooling is too invasive, use a fixed-size active cap and stop allocating past the cap
- cap burst count on frequent collisions

### `src/scene-shell-tools.js`

- allow battle-time shadow disable or reduction under mobile-targeted performance mode

## Performance Mode Rules

This pass should not add a visible user-facing graphics menu by default.

Instead, battle performance mode should be determined by:

- mobile / narrow-device context
- renderer/device capability heuristics if safely available
- debug override when needed for verification

Expected behavior:

- desktop keeps current fidelity unless a correctness fix changes behavior
- low/mid-end mobile receives battle-only optimizations and possible visual downgrade

## Verification Plan

### Automated

Run and update relevant regression checks:

- syntax
- config
- localization if touched indirectly
- loadout / road rank / shell presentation if battle-adjacent UI helpers change
- new or expanded battle performance checks for:
  - instrumentation existence
  - HUD throttling contract
  - battle-only downgrade boundaries
  - timer cleanup where applicable

### Manual / Runtime

Low/mid-end-mobile-oriented checks must cover:

1. Quick Battle launch to first contact
2. sustained collision sequence
3. burst skill activation window
4. full round result
5. repeated match loop for at least three matches

Observe:

- hitch bursts
- input latency feel
- collision readability
- visible degradation quality
- progressive slowdown

## Risks

### Risk: Over-throttled HUD harms responsiveness

Mitigation:

- separate fast bar updates from slower text updates
- keep urgent states immediate

### Risk: Over-aggressive downgrade dulls battle feel

Mitigation:

- downgrade only after logic-layer wins
- preserve collision, burst, and round-result feedback first

### Risk: Perf instrumentation itself adds cost

Mitigation:

- keep metrics lightweight
- debug/runtime summaries only
- no expensive per-frame string building in normal flow

### Risk: Timer cleanup changes orb pacing or round feel

Mitigation:

- add regression checks around orb respawn / round reset behavior

## Recommended Execution Order

1. Add instrumentation and failing perf-sensitive checks
2. Fix correctness/perf bugs
3. Cache HUD DOM refs and add HUD throttling
4. Remove `Date.now()` and hot-path traversals
5. Throttle scratch/trail updates
6. Add battle-only mobile downgrade if still needed
7. Re-run validation and manual battle loops

## Exit Condition

This pass is complete when:

- battle metrics show improved steady-state and spike behavior
- subjective battle feel remains clean across launch, collision, burst, and result beats
- three-match repeat no longer shows clear progressive stutter
- no gameplay rule regressions are introduced
