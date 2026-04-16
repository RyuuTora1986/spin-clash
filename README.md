# Spin Clash

Static single-player spinning-top arena battle foundation for fast static deployment and continued iteration.

## Project State
- Original prototype preserved at `originals/spin_clash.original.html`
- Current playable entry point: `index.html`
- Local vendored renderer dependency: `assets/vendor/three.min.js`
- No runtime Google Fonts dependency
- Runtime split into small plain-script factories under `src/`
- Phase A design package remains under `docs/`
- Manual smoke test passed for:
  - main menu
  - Enter Battle
  - Quick Battle
  - Challenge Road
  - arena selection
  - top selection
  - match start/end
  - reward/share flows
  - debug panel
  - Hex Bowl access flow

## Run Locally
From the repo root:

```powershell
npm install
npm run serve
```

Double-click helpers:
- `run-local-server.cmd`
- `run-build-static.cmd`
- `run-verify-release.cmd`
- `run-preflight.cmd`

Open:
- `http://127.0.0.1:8000/index.html`

Debug:
- `http://127.0.0.1:8000/index.html?debug=1`

Operational reference:
- [Docs Index](./docs/docs-index.md)
- [Local Operations](./docs/local-operations.md)
- [Manual Test Batches](./docs/manual-test-batches.md)
- [Deployment Preflight](./docs/deployment-preflight.md)
- [Deployment Notes](./docs/deployment-notes.md)
- [Launch Blockers](./docs/launch-blockers.md)
- [Project Status 2026-04-17](./docs/project-status-2026-04-17.md)
- [Host Evaluation Sheet](./docs/host-evaluation-sheet.md)
- [GitHub Pages Deploy](./docs/github-pages-deploy.md)
- [Host Validation Plan](./docs/host-validation-plan.md)
- [Host Validation Report Template](./docs/host-validation-report-template.md)
- [Provider Preflight](./docs/provider-preflight.md)
- [Provider Phase Plan](./docs/provider-phase-plan.md)
- [Provider Phase Report Template](./docs/provider-phase-report-template.md)
- [Reward Provider Evaluation Sheet](./docs/reward-provider-evaluation-sheet.md)
- [Analytics Sink Evaluation Sheet](./docs/analytics-sink-evaluation-sheet.md)
- [Provider Integration Notes](./docs/provider-integration-notes.md)
- [Release Checklist](./docs/release-checklist.md)

## Available Scripts
```powershell
npm run serve
npm run build:static
npm run check:static
npm run verify:release
npm run check:syntax
npm run check:repo
npm run check:docs
npm run check:dom
npm run check:config
npm run check:analytics
npm run check:ui
npm run preflight
```

`check:syntax` validates every runtime file under `src/`.
`build:static` creates the minimal deployable static package in `dist-static/`.
`check:static` validates that the packaged release contains runtime files only.
`verify:release` runs runtime preflight, builds the static package, and validates the final packaged output.
`check:repo` validates critical runtime files, entry references, required operational docs, and rejects remote font dependencies in runtime entry files.
`check:docs` validates local Markdown links in `README.md` and `docs/`.
`check:dom` validates that key `document.getElementById(...)` contracts still match `index.html`.
`check:config` validates cross-file config consistency for tops, arenas, modifiers, and Challenge Road nodes.
`check:analytics` validates that tracked analytics event names are documented in `docs/analytics-events.md`.
`check:ui` validates that `index.html` action hooks still match the UI actions exposed by `src/ui-entry-tools.js`.
`preflight` runs the full local validation stack before host validation or release checks.

## Current Game Shell
### Modes
- `Quick Battle`
- `Challenge Road`

### Arenas
- `Neo Dome`
- `Heart Circuit`
- `Hex Bowl`

### Core Services
- local save with versioning
- analytics event buffer abstraction
- rewarded flow abstraction with mock fallback
- share abstraction with browser fallback
- lightweight debug tools behind `?debug=1`

### Current Progression Hooks
- persistent arena unlocks
- persistent top unlocks
- Challenge Road top reward unlocks
- rewarded arena trial
- Challenge Road node progression

## Debug Mode
`?debug=1` exposes a small developer panel in the top-left corner.

Current debug actions:
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

## Repo Structure
### Root
- `index.html`: static entry shell
- `css/game.css`: game styles
- `docs/`: design package and implementation notes
- `originals/`: untouched source backup
- `src/`: runtime/config/service modules
- `progress.md`: running refactor log

### Important Runtime Files
- `src/main.js`: runtime orchestrator and remaining battle kernel glue
- `src/config-*.js`: game text/content definitions
- `src/*-service.js`: storage, analytics, reward, share, debug abstractions
- `src/*-tools.js`: UI, render, battle, and shell factories

See:
- [docs-index.md](./docs/docs-index.md)
- [runtime-modules.md](./docs/runtime-modules.md)
- [refactor-boundaries.md](./docs/refactor-boundaries.md)
- [local-operations.md](./docs/local-operations.md)
- [manual-test-batches.md](./docs/manual-test-batches.md)
- [deployment-preflight.md](./docs/deployment-preflight.md)
- [deployment-notes.md](./docs/deployment-notes.md)
- [launch-blockers.md](./docs/launch-blockers.md)
- [project-status-2026-04-17.md](./docs/project-status-2026-04-17.md)
- [host-evaluation-sheet.md](./docs/host-evaluation-sheet.md)
- [host-validation-plan.md](./docs/host-validation-plan.md)
- [host-validation-report-template.md](./docs/host-validation-report-template.md)
- [provider-preflight.md](./docs/provider-preflight.md)
- [provider-phase-plan.md](./docs/provider-phase-plan.md)
- [provider-phase-report-template.md](./docs/provider-phase-report-template.md)
- [reward-provider-evaluation-sheet.md](./docs/reward-provider-evaluation-sheet.md)
- [analytics-sink-evaluation-sheet.md](./docs/analytics-sink-evaluation-sheet.md)
- [provider-integration-notes.md](./docs/provider-integration-notes.md)
- [release-checklist.md](./docs/release-checklist.md)

## Validation Status
### Verified locally by manual play
- title to loadout transition
- mode switching
- arena switching
- top switching
- launch drag
- battle rendering
- combat finish flow
- challenge progression flow
- reward/share interactions
- debug controls

### Static validation
Run:

```powershell
npm run check:syntax
npm run check:repo
npm run check:docs
npm run check:dom
npm run check:config
npm run check:analytics
npm run check:ui
npm run preflight
```

### Browser automation status
Playwright client wiring exists, but this environment still blocks Chromium launch with OS-level `spawn EPERM`.
That is a local execution constraint, not a known game runtime failure.

## Mock Vs Real Providers
- Reward flow is mock-first and stays playable without a live ad SDK.
- Share flow uses browser-native APIs first and falls back locally.
- Analytics currently persist locally and are inspectable before any remote sink exists.
- Real provider work should stay behind the existing service layer.

## Refactor Policy
- Keep the original prototype untouched
- Keep plain HTML/CSS/JS
- Keep static hosting compatibility
- Prefer config-driven additions over new hardcoded branches
- Do not mechanically split battle kernel code unless a specific change needs it

## Current Priorities
1. Validate one real static host and confirm `persistenceMode === local`
2. Keep reward/share/analytics boundaries stable so provider adapters can be added without gameplay rewrites
3. Only after host validation, choose the reward provider path and remote analytics sink
4. Leave deeper content expansion and config closure for after release-environment uncertainty is closed
