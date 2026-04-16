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
- `http://127.0.0.1:8000/index.html`

Debug mode:
- `http://127.0.0.1:8000/index.html?debug=1`

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
npm run check:dom
npm run check:config
npm run check:analytics
npm run check:ui
npm run check:static
npm run verify:release
```

What it checks:
- every runtime file under `src/`
- parse-level syntax regressions before manual play testing
- critical runtime/doc/reference file presence
- local Markdown link integrity
- core `index.html` / JS DOM id contract integrity
- config consistency across content tables and Challenge Road references
- tracked analytics event names staying aligned with docs
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
- `UNLOCK HEX`
- `UNLOCK TRICK`
- `NODE 4`
- `FINAL NODE`
- `COPY SAVE`
- `IMPORT SAVE`
- `COPY EVENTS`
- `REWARD GRANT`
- `REWARD DENY`
- `REWARD ERROR`
- `CLEAR EVENTS`
- `MOCK SHARE`
- `MOCK REWARD`
- `RESET SAVE`

Current debug visibility:
- save version and persistence state
- storage mode: `local`, `session`, `window_name`, or `memory`
- persistence diagnostic object for current fallback reason
- selected mode and arena
- player and enemy top ids
- unlocked arena list
- unlocked top list
- trial arena list
- currency
- reward mock mode
- analytics event count
- last analytics event name

Persistence notes:
- `local`: normal long-term save behavior
- `session`: survives reloads in the same tab, but is not a durable long-term save
- `window_name`: survives reloads in the same tab when browser storage APIs are blocked, but is not a durable long-term save
- `memory`: no browser storage is available; progress will be lost on reload

Runtime behavior:
- when persistence is not `local`, the game now shows a top warning banner so save limitations are visible even outside debug mode

## Manual Smoke Test

Reference:
- `docs/manual-test-batches.md`

Recommended order:
1. Open the title screen.
2. Enter loadout from `ENTER BATTLE`.
3. Switch `Quick Battle` and `Challenge Road`.
4. Change arena and top selection.
5. Start a Quick Battle match.
6. Drag launch and finish a match.
7. Use result actions:
   - replay
   - double reward
   - share
8. Enter Challenge Road and clear or fail a node.
9. Trigger continue flow after a Challenge Road loss.
10. In debug mode, grant SCRAP and unlock Hex Bowl.
11. Retry locked-arena trial flow in Quick Battle.

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
