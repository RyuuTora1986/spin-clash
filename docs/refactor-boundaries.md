# Refactor Boundaries

This file defines what is safe to keep refactoring and what should stay stable unless there is a concrete gameplay reason.

## Safe To Change
- `README.md`
- docs under `docs/`
- `config-*` content tables
- service adapters and mocks
- debug panel behavior
- loadout/result UI text and labels
- arena visual meshes
- trail/scratch/top render presentation
- share/reward/analytics abstractions

## Safe With Normal Caution
- `src/ui-entry-tools.js`
- `src/ui-shell-tools.js`
- `src/match-flow-tools.js`
- `src/round-flow-tools.js`
- `src/combat-action-tools.js`
- `src/debug-runtime-tools.js`

These modules are already separated and can be changed, but still affect playable flow.

## High-Risk Areas
- `physTick` orchestration in `src/main.js`
- `src/battle-sim-tools.js`
  - `movTop`
  - `checkColl`
  - `aiTick`
- launch timing and round start sequencing
- ring-out / spin-out / HP-out result triggers
- camera-follow / shake interactions that can obscure gameplay readability

These should not be rewritten for style alone.

## Do Not Split Further Without A Specific Need
- The remaining runtime state container in `src/main.js`
- Cross-module mutable combat state
- win/loss trigger logic
- timing-critical collision response

Further splitting here is only worth doing if:
- a bug fix needs tighter isolation
- a new feature cannot be added cleanly
- a repeated regression shows the boundary is still wrong

## Recommended Future Change Order
1. Content/config additions
2. Documentation and release cleanup
3. Service/provider integration points
4. UI polish and readability fixes
5. Only then, targeted battle-kernel refactors if a real defect demands it

## Validation Rule For High-Risk Changes
Any future change touching battle simulation should re-check:
- Enter Battle
- arena/top selection
- drag launch
- visible tops and visible arena
- timer countdown
- collision response
- match end
- Quick Battle result flow
- Challenge Road result flow
- Hex Bowl behavior

## Current Recommendation
Stop refactoring for its own sake here.
The project is at the point where documentation, content extension, and deployment hygiene are better value than further structural churn.
