# Project Status 2026-04-17

This document records the current project state against the original MVP direction and defines the next recommended execution order.

## Executive Summary

Current status:
- the project is no longer a fragile single-file prototype
- the static commercialization shell is largely in place
- the main remaining uncertainty is release readiness, not gameplay shell completeness

Estimated completion:
- static iterable MVP shell: about `85%`
- public commercial launch readiness: about `65%`

Why the gap exists:
- core gameplay preservation, progression shell, persistence, debug tooling, analytics abstraction, and mock commercialization surfaces are already implemented
- public release conditions are still open around:
  - target-host persistence validation
  - real reward provider strategy
  - remote analytics sink choice
  - final host/runtime hardening

## What Is Already Done

### Core Runtime Foundation
- original prototype preserved as backup
- static entry point established
- local vendored `three.min.js`
- runtime split into inspectable plain-script factories
- current game remains playable locally

### Core Product Shape
- `Quick Battle` preserved
- `Challenge Road` implemented
- third arena `Hex Bowl` implemented
- lightweight unlock loop implemented
- one soft currency loop implemented

### Progression And Content
- arena unlocks implemented
- `Trick` top unlock implemented
- Challenge Road top reward implemented
- Challenge Road node progression persists locally

### Services Layer
- `StorageService`
- `AnalyticsService`
- `RewardService`
- `ShareService`
- debug/tuning surface behind `?debug=1`

### Debug And Verification Tooling
- save export/import
- analytics export/clear
- reward mock mode switching
- storage diagnostics
- grouped manual test batches
- release and deployment notes

## What Is Not Done Yet

### Launch Blockers
1. durable `local` persistence must be confirmed on the chosen target host/browser
2. reward flow is still mock-only
3. remote analytics sink is not selected or integrated
4. final host validation pass has not been completed

Reference:
- `docs/launch-blockers.md`

### Lower-Priority Incomplete Areas
- enemy preset layer is not yet fully separated as its own config abstraction
- economy config is still lighter than the original Phase A target architecture
- polished image-card share output is not implemented
- no real provider adapters are integrated yet

## Milestone Assessment

### Milestone 1: Preserve And Stabilize The Baseline
- status: complete

### Milestone 2: Extract Core Systems
- status: mostly complete
- note: `src/main.js` still acts as the orchestrator, which is acceptable for the current scope

### Milestone 3: Config Layer
- status: mostly complete
- note: tops, arenas, modifiers, challenge nodes, and text are config-driven
- remaining gap: enemy presets/economy are not fully separated

### Milestone 4: Services Foundation
- status: functionally complete for MVP shell
- note: real providers are not connected yet

### Milestone 5: Challenge Road
- status: complete for MVP scope

### Milestone 6: Third Arena And Small Unlock Layer
- status: mostly complete
- note: third arena and one real top unlock loop are in place

### Milestone 7: Launch Hardening
- status: partially complete
- remaining work is now concentrated here

## Recommended Next Execution Order

### Phase C1: Host Validation
Goal:
- prove the current static build behaves correctly on the real chosen host

Do next:
1. choose the actual static host target
2. deploy the current build there
3. run the grouped manual host validation batches
4. record real persistence mode and asset/runtime behavior

### Phase C2: Provider Decision Layer
Goal:
- turn the current shell into a monetization-ready integration surface

Do after host validation:
1. choose the reward provider/platform path
2. choose the remote analytics sink
3. integrate both only through existing service layers

### Phase C3: Final Config Closure
Goal:
- reduce future content expansion cost without expanding scope

Do after provider decisions:
1. separate enemy presets more explicitly
2. separate economy tuning more explicitly
3. keep gameplay kernel changes minimal

## What Should Not Be Prioritized Now
- more content before host validation
- more tops before provider/analytics decisions
- framework migration
- build tool overhaul
- image-card polish before release blockers

## Practical Recommendation

The project should now be treated as:
- ready for continued iteration
- ready for host validation
- not yet ready to be called a final public commercial release

The highest-value next step is not more gameplay scope.
The highest-value next step is closing the release-environment uncertainty.
