# Implementation Roadmap

## Milestone 1: Preserve And Stabilize The Baseline
Goal:
- Create an untouched backup of the original HTML.
- Make the prototype runnable from a clean static entry point without changing the duel feel.

Likely file work:
- create `originals/spin_clash.original.html`
- create `index.html`
- create `src/main.js`
- create initial `css/` files
- vendor local Three.js copy

Validation:
- local static run loads without CDN failure except any intentionally deferred font dependency
- Quick Battle start flow works
- one full match can be played
- no obvious rendering or console breakage

Acceptance criteria:
- original file preserved untouched
- current gameplay feel is materially unchanged
- static shell loads from split entry point

## Milestone 2: Extract Core Systems
Goal:
- Split audio, render, gameplay, and input into modules with no new product scope.

Likely file work:
- `src/audio/*`
- `src/render/*`
- `src/gameplay/*`
- `src/input/*`
- `src/bootstrap/*`

Validation:
- Quick Battle still supports drag launch, dash, skill use, round transition, and match result
- both existing arenas still work
- each existing top still behaves correctly

Acceptance criteria:
- monolith responsibilities are separated
- no gameplay regression in the preserved mode
- all text references flow through a text config or centralized table

## Milestone 3: Config Layer
Goal:
- Move hardcoded content and tuning into config modules.

Likely file work:
- `src/config/tops.js`
- `src/config/arenas.js`
- `src/config/modifiers.js`
- `src/config/enemy-presets.js`
- `src/config/economy.js`
- `src/config/text.js`

Validation:
- changing config values updates runtime behavior without code edits
- existing roster and arenas load from config
- debug readout shows active config ids and values

Acceptance criteria:
- top, arena, and economy tuning are config-driven
- no duplicate hardcoded content tables remain in gameplay logic

## Milestone 4: Services Foundation
Goal:
- Add StorageService, AnalyticsService, RewardService, ShareService, and debug shell.

Likely file work:
- `src/services/*`
- `src/debug/*`

Validation:
- progress persists across reloads
- save schema version is visible
- analytics events can be inspected locally
- reward mock placements can be triggered without breaking flow
- share fallback works in unsupported browsers

Acceptance criteria:
- platform-facing concerns are isolated behind services
- game remains fully playable with only mock adapters

## Milestone 5: Challenge Road
Goal:
- Add the one progression shell for MVP.

Likely file work:
- `src/modes/challenge-road-mode.js`
- `src/config/challenge-road.js`
- loadout and result overlay updates
- progression UI components

Validation:
- player can enter Challenge Road
- node progression saves locally
- fail, retry, continue, and clear flows all work
- reward events fire correctly

Acceptance criteria:
- 6 to 8 nodes playable end-to-end
- no second gameplay system added
- Quick Battle still works unchanged

## Milestone 6: Third Arena And Small Unlock Layer
Goal:
- Add one new arena and small unlockable content set.

Likely file work:
- `src/config/arenas.js`
- `src/content/arena-factory.js`
- `src/config/tops.js`
- progression UI updates

Validation:
- new arena loads in both Quick Battle and Challenge Road
- unlock flow is persistent and reversible in debug mode
- share and analytics payloads include correct arena and top ids

Acceptance criteria:
- one distinct new arena only
- unlock loop stays simple and readable

## Milestone 7: Launch Hardening
Goal:
- remove external fragility, finalize docs, and harden validation.

Likely file work:
- runtime docs
- integration notes
- deployment docs
- final polish fixes

Validation:
- static deployment build works locally and on target host
- no required runtime depends on unavailable backend services
- mock adapters can be swapped for real providers without gameplay rewrites

Acceptance criteria:
- project is commercially testable as a static game
- repo is inspectable and maintainable

## Core Validation Path For Later Phases
1. Load local static host successfully.
2. Start Quick Battle from title screen.
3. Complete one full best-of-3 match in each arena.
4. Verify dash and each burst skill family.
5. Verify save persistence across reload.
6. Enter Challenge Road and clear at least one node.
7. Fail a node and test rewarded continue mock.
8. Trigger double reward and trial unlock mock.
9. Trigger share flow and inspect generated payload.
10. Inspect analytics buffer for required events.
11. Enable `?debug=1` and verify config and save inspection.
