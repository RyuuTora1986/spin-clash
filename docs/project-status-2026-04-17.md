# Project Status 2026-04-17

This document records the current project state against the original MVP direction and defines the next recommended execution order.

## Executive Summary

Current status:
- the project is no longer a fragile single-file prototype
- the static commercialization shell is largely in place
- the main remaining uncertainty is release readiness, not gameplay shell completeness

Estimated completion:
- static iterable MVP shell: about `96%`
- public commercial launch readiness: about `78%`

Why the gap exists:
- core gameplay preservation, progression shell, persistence, debug tooling, analytics abstraction, and mock commercialization surfaces are already implemented
- public release conditions are still open around:
  - real reward provider strategy
  - remote analytics sink choice
  - provider-phase integration hardening

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
- tri-language player-facing localization implemented for `English`, `中文`, and `日本語`

### Progression And Content
- arena unlocks implemented
- `Trick` top unlock implemented
- Challenge Road top reward implemented
- Challenge Road node progression persists locally
- enemy presets now separated into their own config table
- enemy presets now apply differentiated AI tuning across Challenge Road nodes
- shared economy/runtime tuning now lives in `src/config-economy.js`

### Services Layer
- `StorageService`
- `AnalyticsService`
- `RewardService`
- `ShareService`
- debug/tuning surface behind `?debug=1`

### Debug And Verification Tooling
- save export/import
- save migration/normalization regression check
- locale persistence and locale-table parity regression check
- analytics export/clear
- tuning export/import/reset for economy and enemy presets
- debug action failure handling regression check
- loadout purchase/trial regression check
- session lifecycle regression check
- reward mock mode switching
- storage diagnostics
- grouped manual test batches
- release and deployment notes

## What Is Not Done Yet

### Launch Blockers
1. reward flow has a live adapter path but is not yet live-validated
2. remote analytics sink is not selected or integrated
3. provider-phase integration work has not been completed

Reference:
- `docs/launch-blockers.md`
- `docs/host-validation-report-2026-04-17-github-pages.md`

### Lower-Priority Incomplete Areas
- lightweight SVG result-card share output is implemented, but polished raster/social-card output is not
- enemy preset tuning now varies meaningfully, but more post-playtest balance iteration is still possible
- real provider adapters exist, but live validation and provider-specific hardening are not finished
- tri-language support is implemented, but still benefits from one grouped manual overflow/readability pass across all three languages

## Milestone Assessment

### Milestone 1: Preserve And Stabilize The Baseline
- status: complete

### Milestone 2: Extract Core Systems
- status: mostly complete
- note: `src/main.js` still acts as the orchestrator, which is acceptable for the current scope

### Milestone 3: Config Layer
- status: complete for the current MVP boundary
- note: tops, arenas, modifiers, enemy presets, challenge nodes, text, and shared economy/runtime values are now config-driven

### Milestone 4: Services Foundation
- status: functionally complete for MVP shell
- note: real provider paths now exist, but final live validation is still pending

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

Status:
- complete for current baseline host

Closed result:
- GitHub Pages passed host validation
- `persistenceMode === local`
- current baseline host is now acceptable for provider-phase work

### Phase C2: Provider Decision Layer
Goal:
- turn the current shell into a monetization-ready integration surface

Do after host validation:
1. validate the recommended reward provider path
2. validate the recommended remote analytics sink
3. integrate both only through existing service layers

Reference:
- `docs/provider-recommendation-2026-04-17.md`

### Phase C3: Final Config Closure
Goal:
- reduce future content expansion cost without expanding scope

Do after provider decisions:
1. enemy preset extraction is complete
2. economy/runtime extraction is complete
3. keep gameplay kernel changes minimal when adding future content

## What Should Not Be Prioritized Now
- more content before host validation
- more tops before provider/analytics decisions
- framework migration
- build tool overhaul
- image-card polish before release blockers

## Practical Recommendation

The project should now be treated as:
- ready for continued iteration
- ready for provider-phase implementation
- not yet ready to be called a final public commercial release

The highest-value blocked next step is still converting the existing mock provider surfaces into one real reward path and one real analytics forwarding path.
The highest-value optional unblocked next step is tuning enemy preset variation, because the lightweight result-card share layer is now already in place.
