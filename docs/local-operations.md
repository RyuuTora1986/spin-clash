# Local Operations

This project is intended to run as a plain static site.

## Local Run

From the repo root:

```powershell
npm install
npm run serve
npm run build:static
```

Optional double-click helpers from the repo root:
- `run-local-server.cmd`
- `run-build-static.cmd`
- `run-verify-release.cmd`
- `run-preflight.cmd`

Open:
- read the exact `Open:` URL printed by `npm run serve`
- default start target: `http://127.0.0.1:4173/index.html`

Debug mode:
- read the exact `Debug:` URL printed by `npm run serve`
- default debug target: `http://127.0.0.1:4173/index.html?debug=1`

Local server behavior:
- serves the current repo root, not the shell's current directory
- resolves `/` directly to `index.html`
- starts at port `4173`
- if `4173` is busy, it automatically moves to the next free port and prints the real URL

Do not rely on `file://` for normal validation. Use a local static server.

## Static Validation

Run:

```powershell
npm run preflight
npm run build:static
npm run check:static
npm run verify:release
```

Or run individual checks:

```powershell
npm run check:syntax
npm run check:repo
npm run check:docs
npm run check:localserver
npm run check:dom
npm run check:config
npm run check:nextphase
npm run check:analytics
npm run check:storage
npm run check:localization
npm run check:naming
npm run check:ja-ruby
npm run check:battleperf
npm run check:roster
npm run check:encounter
npm run check:workshop
npm run check:roadrank
npm run check:providers
npm run check:debugservice
npm run check:debug
npm run check:debugruntime
npm run check:loadout
npm run check:shellpresentation
npm run check:session
npm run check:roundflow
npm run check:matchflow
npm run check:share
npm run check:ui
npm run check:static
npm run verify:release
```

What it checks:
- every runtime file under `src/`
- parse-level syntax regressions before manual play testing
- critical runtime/doc/reference file presence
- local Markdown link integrity
- repo-local static server routing and root resolution
- core `index.html` / JS DOM id contract integrity
- config consistency across content tables and Challenge Road references
- next-phase Championship Path structure and checkpoint metadata
- tracked analytics event names staying aligned with docs
- legacy save migration and save-shape normalization
- English/Chinese/Japanese locale table parity, saved locale behavior, and live runtime text application
- localized content naming parity and Japanese ruby-only display surfaces
- battle performance contracts for metrics hooks, HUD refresh throttling, scratch texture batching, trail sampling, and particle reuse
- Workshop Research config shape, purchase persistence, and loadout integration
- Road Rank unlock flow, selection wiring, and challenge-entry UI exposure
- provider adapter selection and fallback behavior staying valid
- debug-panel synchronous action failures surfacing as status messages instead of uncaught errors
- debug tuning import/reset behavior for economy, arenas, tops, research, road ranks, championship nodes, and enemy preset config
- debug progression/runtime snapshot builders and export actions
- arena purchase, arena trial, and top purchase analytics paths in the loadout flow
- title entry, featured top, battle intro, and result breakdown shell presentation
- session_start, return_session, and once-only session_end behavior
- match boot/setup behavior and challenge node metadata threading
- result-flow context, share-moment behavior, and Challenge Road clear-node unlock analytics staying valid
- share service SVG-card generation and fallback download path staying valid
- `index.html` UI invoke hooks staying aligned with exposed UI actions
- final packaged static release staying limited to runtime files only

What it does not check:
- gameplay feel
- browser rendering
- ad/share/browser API behavior
- live host behavior after upload

## Debug Mode

`?debug=1` enables a small developer panel in the top-left corner.

Current actions:
- `+200 SCRAP`
- `UNLOCK HEX` (`Shard Hex Array`)
- `UNLOCK TRICK` (`Night Gale`)
- `UNLOCK BREAKER` (`Warbreak Pike`)
- `UNLOCK RAIDER` (`Shadowraid`)
- `RANK II`
- `RANK III`
- `NODE 4`
- `FINAL NODE`
- `COPY PROGRESSION`
- `COPY RUNTIME`
- `COPY SAVE`
- `IMPORT SAVE`
- `COPY EVENTS`
- `COPY TUNING`
- `IMPORT TUNING`
- `RESET TUNING`
- `COPY PROVIDERS`
- `REWARD GRANT`
- `REWARD DENY`
- `REWARD ERROR`
- `CLEAR EVENTS`
- `MOCK SHARE`
- `COPY SHARE SVG`
- `DOWNLOAD SHARE SVG`
- `MOCK REWARD`
- `RESET SAVE`

Current debug visibility:
- save version and persistence state
- storage mode: `local`, `session`, `window_name`, or `memory`
- persistence diagnostic object for current fallback reason
- selected mode and arena
- challenge unlocked node index and checkpoint resume index
- challenge unlocked rank index and selected rank label
- player and enemy top ids
- unlocked arena list
- unlocked top list
- trial arena list
- currency
- live enemy AI config for the current preset
- current enemy preset label
- whether runtime tuning overrides are active
- battle perf buckets (`frameMs`, `physTick`, `battleView`, `renderer`)
- battle performance mode flags, including whether low-end mobile downgrade hooks are active
- reward mock mode
- reward adapter state
- reward availability reason
- reward request reason
- reward active placement
- analytics adapter state
- analytics ready state
- analytics loading state
- analytics forward reason
- analytics initialized state
- analytics queued event count
- analytics event count
- last analytics event name

Persistence notes:
- `local`: normal long-term save behavior
- `session`: survives reloads in the same tab, but is not a durable long-term save
- `window_name`: survives reloads in the same tab when browser storage APIs are blocked, but is not a durable long-term save
- `memory`: no browser storage is available; progress will be lost on reload

Runtime behavior:
- when persistence is not `local`, the game now shows a top warning banner so save limitations are visible even outside debug mode
- tuning imports are debug-only and session-local; use `COPY TUNING` before large changes if you want a restorable snapshot
- tuning import now accepts full-table overrides for `arenas`, `tops`, `research`, `roadRanks`, and `challengeRoad` in addition to `economy` and `enemyPresets`
- array-based tuning roots are replaced as complete tables, so the normal workflow is: `COPY TUNING` -> edit the copied JSON -> `IMPORT TUNING`
- invalid pasted JSON in debug import actions should now surface as a red status message in the panel instead of throwing an uncaught runtime error

## Manual Smoke Test

Reference:
- `docs/manual-test-batches.md`

Recommended order:
1. Open the title screen.
2. Enter loadout from `ENTER BATTLE`.
3. Switch `Quick Battle` and `Challenge Road`.
4. From the title screen, confirm `CONTINUE PATH`, `QUICK BATTLE`, and `WORKSHOP` all enter the correct loadout state.
5. Switch language on the title screen, then again in loadout, and confirm the chosen language survives refresh.
6. Change arena and top selection.
7. Confirm the featured top panel updates as the selected top changes.
8. Start a Quick Battle match.
9. Confirm the pre-fight intro banner shows matchup and arena context in the selected language.
10. Drag launch and finish a match.
11. Use result actions:
   - replay
   - double reward
   - share
   - if desktop fallback path is used, confirm a share card download or copied text path occurs
12. Enter Challenge Road and clear or fail a node.
13. Select a higher `ROAD RANK` in Championship Path and confirm locked ranks stay disabled until unlocked.
14. Trigger continue flow after a Challenge Road loss.
15. In debug mode, grant SCRAP, unlock Hex Bowl, and if needed jump rank state with `RANK II` or `RANK III`.
16. Retry locked-arena trial flow in Quick Battle.

## Save Reset

Safe reset options:
- use debug panel `RESET SAVE`
- clear local storage for this origin in the browser

Current storage key:
- `spin-clash-save`

## Analytics Inspection

Analytics are stored locally in save data.

Current behavior:
- latest `200` events are retained
- events are inspectable through saved state
- debug mode logs events to console

Reference:
- `docs/analytics-events.md`

## Known Local Constraint

In this environment, Playwright browser launch is blocked by OS-level `spawn EPERM`.

That means:
- repo-level browser automation wiring exists
- local automated Chromium runs are not currently reliable here
- manual browser validation is still the trusted path for gameplay verification
