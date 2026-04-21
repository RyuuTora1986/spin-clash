# Spin Clash

Static single-player spinning-top arena battle foundation for fast static deployment and continued iteration.

## Project State
- Original prototype preserved at `originals/spin_clash.original.html`
- Current playable entry point: `index.html`
- Local vendored renderer dependency: `assets/vendor/three.min.js`
- No runtime Google Fonts dependency
- Runtime split into small plain-script factories under `src/`
- Player-facing runtime supports `English`, `中文`, and `日本語` with saved locale preference
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
- read the exact `Open:` URL printed by `npm run serve`
- default start target: `http://127.0.0.1:4173/index.html`

Debug:
- read the exact `Debug:` URL printed by `npm run serve`
- default debug target: `http://127.0.0.1:4173/index.html?debug=1`

Operational reference:
- [Docs Index](./docs/docs-index.md)
- [Local Operations](./docs/local-operations.md)
- [Manual Test Batches](./docs/manual-test-batches.md)
- [Focused Human Playtest 2026-04-20](./docs/focused-human-playtest-2026-04-20.md)
- [Visual Validation Protocol 2026-04-20](./docs/visual-validation-protocol-2026-04-20.md)
- [Deployment Preflight](./docs/deployment-preflight.md)
- [Deployment Notes](./docs/deployment-notes.md)
- [Launch Blockers](./docs/launch-blockers.md)
- [Project Status 2026-04-17](./docs/project-status-2026-04-17.md)
- [Host Evaluation Sheet](./docs/host-evaluation-sheet.md)
- [GitHub Pages Deploy](./docs/github-pages-deploy.md)
- [Host Validation Plan](./docs/host-validation-plan.md)
- [Host Validation Report Template](./docs/host-validation-report-template.md)
- [Host Validation Report 2026-04-17 GitHub Pages](./docs/host-validation-report-2026-04-17-github-pages.md)
- [Provider Preflight](./docs/provider-preflight.md)
- [Provider Recommendation 2026-04-17](./docs/provider-recommendation-2026-04-17.md)
- [AdinPlay Priority Switch Plan 2026-04-20](./docs/adinplay-priority-switch-plan-2026-04-20.md)
- [Content Post-Merge Execution Plan 2026-04-20](./docs/content-post-merge-execution-plan-2026-04-20.md)
- [15-Top Balance And Unlock Validation Plan 2026-04-20](./docs/top-balance-validation-plan-2026-04-20.md)
- [15-Top Balance Validation Report 2026-04-20 Phase 1A](./docs/top-balance-validation-report-2026-04-20-phase-1a.md)
- [Balance Pass 2026-04-20 Phase 1B](./docs/balance-pass-2026-04-20-phase-1b.md)
- [Unlock Source UI Design 2026-04-20](./docs/unlock-source-ui-design-2026-04-20.md)
- [Unlock Source UI Pass 2026-04-20](./docs/unlock-source-ui-pass-2026-04-20.md)
- [Session Handoff 2026-04-21](./docs/session-handoff-2026-04-21.md)
- [PostHog Setup](./docs/posthog-setup.md)
- [Reward Live Adapter Status](./docs/reward-live-adapter-status.md)
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
npm run preflight
```

`check:syntax` validates every runtime file under `src/`.
`build:static` creates the minimal deployable static package in `dist-static/`.
`check:static` validates that the packaged release contains runtime files only.
`verify:release` runs runtime preflight, builds the static package, and validates the final packaged output.
`check:repo` validates critical runtime files, entry references, required operational docs, and rejects remote font dependencies in runtime entry files.
`check:docs` validates local Markdown links in `README.md` and `docs/`.
`check:localserver` validates that the repo-local static server serves this repo root and resolves `/` to `index.html`.
`check:dom` validates that key `document.getElementById(...)` contracts still match `index.html`.
`check:config` validates cross-file config consistency for tops, arenas, modifiers, and Challenge Road nodes.
`check:analytics` validates that tracked analytics event names are documented in `docs/analytics-events.md`.
`check:storage` validates legacy save migration, unlock normalization, and analytics log sanitization in `StorageService`.
`check:localization` validates locale table parity, locale persistence, and in-place runtime text switching for English/Chinese/Japanese.
`check:naming` validates the live top and arena names plus the shared family-level type labels across all locales.
`check:ja-ruby` validates Japanese furigana metadata plus ruby rendering on the approved preview/loadout surfaces only.
`check:battleperf` validates that battle perf hooks, HUD throttling, scratch batching, trail sampling, and particle reuse stay wired in.
`check:roster` validates the 15-top roster shell and derived-top metadata wiring.
`check:encounter` validates the current encounter preset/modifier pack.
`check:workshop` validates Workshop Research config, progression purchase flow, and loadout integration.
`check:roadrank` validates Road Rank unlock logic, selection wiring, and challenge-entry UI exposure.
`check:providers` validates provider adapter selection and safe fallback behavior for analytics/reward integration scaffolding.
`check:debugservice` validates that debug-panel actions surface synchronous failures in the status line instead of throwing.
`check:debug` validates debug-only tuning import/reset behavior for economy and enemy preset config.
`check:debugruntime` validates debug progression/runtime snapshot export coverage.
`check:loadout` validates arena purchase, arena trial, and top purchase flows plus their unlock/trial analytics payloads.
`check:shellpresentation` validates the title-entry, featured-loadout, battle-intro, and result-breakdown shell surfaces.
`check:session` validates first-session, return-session, and once-only session_end analytics behavior.
`check:roundflow` validates match boot/setup behavior including challenge node metadata threading.
`check:matchflow` validates Challenge Road result-context handling plus clear-node unlock analytics so reward/share/unlock actions stay tied to the cleared node.
`check:share` validates result-card SVG generation plus share fallback behavior.
`check:ui` validates that `index.html` action hooks still match the UI actions exposed by `src/ui-entry-tools.js`.
`preflight` runs the full local validation stack before host validation or release checks.

## Current Game Shell
### Modes
- `Quick Battle`
- `Championship Path`

### Supported Languages
- `English`
- `中文`
- `日本語`

Japanese presentation note:
- `日本語` uses small hiragana ruby on top/arena proper names in preview-style UI such as Home, Loadout, Quick Battle selection, and Road Rank / Path loadout panels.
- Battle HUD, result overlays, toast copy, and share text stay plain-text for faster reading.

### Arenas
- `Azure Ring Court`
- `Scarlet Heart Verge`
- `Shard Hex Array`
- `Tempest Maw Depth`
- `Thornbloom Snare`
- `Prism Arcade`

### Top Type Families
- `Assault`
- `Bulwark`
- `Skirmish`

### Core Services
- local save with versioning
- analytics event buffer abstraction
- rewarded flow abstraction with mock fallback
- share abstraction with browser fallback
- result-share SVG card generation with browser-share or download fallback
- lightweight debug/tuning tools behind `?debug=1`

### Current Progression Hooks
- persistent arena unlocks
- persistent top unlocks
- Challenge Road top reward unlocks
- Workshop Research permanent upgrades
- Road Rank unlock and selection
- rewarded arena trial
- Challenge Road node progression

### Current Shell Upgrades
- title screen routes around `CONTINUE PATH`, `QUICK BATTLE`, and `WORKSHOP`
- selected-top feature panel in loadout
- Championship Path node strip with current, cleared, and boss/final markers
- battle intro banner plus stronger HUD danger states
- result reward breakdown and next-step guidance
- debug tuning import/export now covers economy, unlock tables, research, ranks, and Championship Path nodes
- debug runtime now includes battle perf buckets plus the current battle performance mode flags for quick perf smoke checks

## Debug Mode
`?debug=1` exposes a small developer panel in the top-left corner.

Current debug actions:
- `+200 SCRAP`
- `UNLOCK HEX` (`Shard Hex Array`)
- `UNLOCK TRICK` (`Night Gale`)
- `UNLOCK BREAKER` (`Warbreak Pike`)
- `UNLOCK RAIDER` (`Shadowraid`)
- `RANK II`
- `RANK III`
- `NODE 4`
- `FINAL NODE`
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
4. Keep non-blocked polish focused on low-risk layers like share output and config tuning until provider credentials are ready
