Original prompt: Convert the prepared single-file browser game prototype in C:\Users\29940\spin-clash into the smallest commercialization-ready static web game foundation, preserving the core duel feel and proceeding in phases.

2026-04-16
- Phase A docs written under docs/.
- Remote GitHub repo reset and recreated at https://github.com/RyuuTora1986/spin-clash.
- Phase B round 1 established static shell with index.html, css/game.css, src/main.js, and local assets/vendor/three.min.js.
- Original prototype backed up to originals/spin_clash.original.html.
- Current focus: clean remaining runtime text/duplication issues and verify Quick Battle on the new shell with automated browser checks.
- Added render_game_to_text and advanceTime hooks for browser automation and cleaned duplicate orb pickup message.\n
- Playwright package installed locally for validation prep. Browser launch remains blocked in this environment by EPERM/Access denied, so browser-level automation is not yet usable here.\n- Added npm scripts and ignored local validation caches/dependencies in .gitignore.\n

- Fixed local-launch regression in index shell: replaced module entry with deferred plain script so direct file:// open can execute main.js, restored font links in index.html, and repaired the broken .card.sel::after CSS string that could disrupt overlay styling.

- Phase B batch in progress: added bootstrap/config/service scripts, wired persistent local save with versioning, analytics event buffer, rewarded/share mock services, debug query support, Challenge Road node config, and loadout/result UI hooks for mode switching, rewards, and sharing.
- Challenge Road currently advances sequentially from local save state; Quick Battle remains selectable; browser automation is still blocked by the environment so runtime confirmation still depends on manual play checks.

- Feedback pass: added visible SCRAP balance in loadout/result overlays, made double reward visibly claim and disable after use, and clarified Challenge Road progression by changing the result CTA to NEXT NODE / RETRY NODE / ROAD CLEAR based on outcome.

- Added third arena Hex Bowl with polygon bowl geometry, wall/out-of-ring handling, and Challenge Road nodes 4-6 now route through it.
- Added minimal arena unlock layer: Hex Bowl can be bought with SCRAP from Quick Battle loadout or activated as a rewarded trial; clearing a Challenge Road node on an arena now permanently unlocks that arena for Quick Battle.

- Refined runtime error overlay: ignore opaque generic 'Script error.' events with no filename so homepage no longer shows false-positive red error bars, while still surfacing actionable same-origin errors and unhandled promise rejections.

- Hardened enter flow: title-to-loadout transition no longer depends on successful Web Audio initialization; audio init is now best-effort so Enter Battle cannot be blocked by AudioContext startup failures.

- Fixed loadout/runtime regressions discovered during manual testing:
  - title -> loadout transition now works reliably in the user's local environment
  - loadout mode tabs, arena buttons, top cards, and start buttons respond again
  - loadout overlay now clears correctly when a match starts
  - early script abort from `currentArena` initialization order was corrected

- Tightened Hex Bowl access flow:
  - Quick Battle now tracks a selected arena separately from the active arena
  - Start Match performs a final arena access check before battle start
  - Hex Bowl trial flow now reliably enters the hex arena instead of silently falling through

- Added lightweight debug verification path behind `?debug=1`:
  - add SCRAP
  - unlock Hex Bowl
  - jump to Challenge Road node 4 or final node
  - reset save

- Manual user verification passed for the following:
  - Enter Battle
  - Quick Battle / Challenge Road mode switch
  - arena selection
  - top selection
  - Start Match / Enter Road flow
  - Hex Bowl trial activation and actual hex arena entry
  - debug panel actions under local static serving

- Remaining near-term cleanup:
  - review duplicated event entry paths between HTML `onclick` fallbacks and JS-side handlers
  - reduce temporary compatibility code once local launch behavior is stable enough
  - continue modular split of `src/main.js` into smaller runtime modules without breaking manual-play flow

- Continued modular split:
  - extracted loadout/progression display and arena access helpers into `src/loadout-ui-tools.js`
  - `index.html` now loads the new plain-script factory before `src/main.js`
  - `src/main.js` now consumes that factory through the same injection pattern already used by `src/progression-tools.js`
  - battle, physics, renderer, and HTML-level `__spinClashInvoke(...)` compatibility entrypoints were left intact
  - syntax checks passed for `src/main.js` and `src/loadout-ui-tools.js`

- Continued modular split again:
  - extracted result overlay, reward payout, continue flow, share action, and challenge reward progression into `src/match-flow-tools.js`
  - `index.html` now loads the match flow factory before `src/main.js`
  - `src/main.js` keeps the old function names as thin wrappers so existing UI and end-of-round calls stay stable
  - fixed one transient duplicate runtime-state declaration introduced during refactor before final validation
  - syntax checks passed for `src/main.js` and `src/match-flow-tools.js`

- Continued modular split again:
  - extracted runtime inspection and debug bootstrap concerns into `src/debug-runtime-tools.js`
  - moved `render_game_to_text`, `advanceTime`, debug panel mounting, and session-start instrumentation behind the new factory
  - `src/main.js` now keeps only thin wrappers plus injection wiring for debug/runtime tooling
  - static checks passed for `src/main.js` and `src/debug-runtime-tools.js`

- Continued modular split again:
  - extracted title/loadout entry glue and window action registration into `src/ui-entry-tools.js`
  - moved Enter Battle, top selection, mode switch, arena select, Start Match gatekeeping, rematch return, and `window.__spinClashUI` binding behind the new factory
  - `src/main.js` now keeps only thin wrappers for these entry actions while battle/runtime code remains local
  - static checks passed for `src/main.js` and `src/ui-entry-tools.js`

- Continued modular split again:
  - extracted startup sequencing into `src/startup-tools.js`
  - moved automation hook exposure, debug/session initialization ordering, active challenge index bootstrap, and RAF startup behind the new startup factory
  - `src/main.js` now keeps the local loop and render-text wrapper but no longer owns the startup order directly
  - static checks passed for `src/main.js` and `src/startup-tools.js`

- Continued modular split again:
  - extracted overlay/HUD shell helpers into `src/ui-shell-tools.js`
  - moved loadout overlay visibility helpers, arena selection visual sync, skill icon sync, battle HUD refresh, round pips refresh, and HUD show/hide helpers behind the new UI shell factory
  - `src/main.js` now keeps only thin wrappers for these UI shell concerns while battle state mutation stays local
  - static checks passed for `src/main.js` and `src/ui-shell-tools.js`

- Continued modular split again:
  - extracted player input and skill action glue into `src/combat-action-tools.js`
  - moved drag/touch/key input registration, player dash trigger, player skill trigger, flash overlay effect, and skill action dispatch behind the new combat action factory
  - `src/main.js` now keeps only thin wrappers for player action entrypoints while battle simulation remains local
  - static checks passed for `src/main.js` and `src/combat-action-tools.js`

- Continued modular split again:
  - extracted round flow glue into `src/round-flow-tools.js`
  - moved top template shaping, round setup, launch transition, and round-result presentation sequencing behind the new round flow factory
  - `src/main.js` now keeps only thin wrappers for `mkTopData`, modifier application, round timer lookup, `initRound`, `launch`, and `endRound`
  - static checks passed for `src/main.js` and `src/round-flow-tools.js`

- Continued modular split again:
  - extracted particles and orb pickup effects into `src/battle-effects-tools.js`
  - moved particle spawn/tick and orb spawn/tick handling behind the new effects factory
  - `src/main.js` now keeps only thin wrappers for `spawnParts`, `tickParts`, `spawnOrbs`, and `tickOrbs`
  - static checks passed for `src/main.js` and `src/battle-effects-tools.js`

- Continued modular split again:
  - extracted runtime error handling and Web Audio/SFX stack into `src/runtime-audio-tools.js`
  - moved runtime error overlay, global error/rejection guards, music scheduling, and all SFX helpers behind the new runtime/audio factory
  - `src/main.js` now keeps only thin wrappers for runtime error reporting and audio entrypoints
  - static checks passed for `src/main.js` and `src/runtime-audio-tools.js`

- Continued modular split again:
  - extracted arena visual construction into `src/arena-render-tools.js`
  - moved circle/heart/hex arena mesh building and arena rebuild orchestration behind the new factory
  - fixed a latent runtime hazard where `HEART_PTS` was being read before `arenaMathTools` initialization by switching to lazy access
  - next likely safe extraction targets are trail rendering or scratch-layer mesh generation, while core battle simulation stays local

- Continued modular split again:
  - extracted trail mesh creation/update into `src/trail-render-tools.js`
  - `src/main.js` now keeps only compatibility wrappers for trail init/update while trail mesh ownership lives in the new factory
  - Playwright client execution was attempted against a local static server, but the bundled skill script could not resolve its own `playwright` package from `C:\Users\29940\.codex-proxy\skills\...`; this remains an environment/tooling issue rather than a game runtime error

- Continued modular split again:
  - extracted arena scratch/decal surface rendering into `src/scratch-layer-tools.js`
  - moved scratch canvas texture updates and per-arena scratch mesh rebuilds behind a dedicated factory
  - `main.js` now calls the scratch layer only as a visual service during arena rebuild and frame tick

- Continued modular split again:
  - extracted top model/texture construction into `src/top-render-tools.js`
  - moved `mkSpotTex` and `mkTop` out of `main.js`; main now treats top rendering as another isolated visual service
  - Playwright client was retried from a repo-local copy so package resolution worked, but browser launch still fails in this environment with `spawn EPERM`

- Continued modular split again:
  - extracted aim-line rendering and screen-to-arena projection into `src/aim-line-tools.js`
  - `main.js` now keeps drag state and launch rules, while aim-line visibility/update math lives in the new visual helper

- Continued modular split again:
  - extracted resize/camera-base and scene lighting bootstrap into `src/scene-shell-tools.js`
  - `main.js` no longer owns ambient/point light setup or base camera resize math directly

- Continued modular split again:
  - extracted battle movement/collision/AI into `src/battle-sim-tools.js`
  - extracted in-battle message banner into `src/message-ui-tools.js`
  - extracted camera shake + top mesh pose/crown visual updates into `src/battle-view-tools.js`
  - `main.js` is now much closer to a runtime orchestrator around services, UI glue, and the validated core loop entrypoints

- Final consolidation pass:
  - extracted aim line, scene shell, battle sim, battle view, and message banner helpers
  - reduced src/main.js from 927 lines to 779 lines while keeping battle entrypoints stable
  - reran the repo-local Playwright client against a local static server; package resolution succeeded, but browser launch still failed with the same environment-level spawn EPERM restriction

- Final review cleanup:
  - changed README doc links to portable relative links
  - changed `npm run check:syntax` to a cross-platform Node-based runner
  - cached scaled hex polygons inside `src/battle-sim-tools.js` to avoid repeated hot-path allocations

- Analytics coverage cleanup:
  - added `trial_unlock_start` and `trial_unlock_complete` around rewarded arena trial activation in `src/loadout-ui-tools.js`
  - updated `docs/analytics-events.md` and `docs/services-plan.md` to match the implemented event surface
  - reran `npm run check:syntax` successfully after the change

- Analytics normalization cleanup:
  - added normalized `unlock_grant` analytics for permanent arena unlocks via Quick Battle purchase and first-time Challenge Road clear
  - kept legacy `unlock_purchase` for backward-compatible reporting while giving future top/content unlocks a reusable event shape
  - updated analytics/service docs and prepared the next step around richer reward payload metadata

- Reward analytics cleanup:
  - enriched reward telemetry in `src/reward-service.js` with `adapter`, `granted`, and placement-specific `resultValue`
  - kept the mock reward flow behavior unchanged while making future real-provider integration measurable without gameplay rewrites
  - updated analytics/service docs so the documented payloads match the implemented event stream

- Session analytics cleanup:
  - expanded `session_start` and `return_session` payloads with save version, progress state, currency, challenge unlock depth, and unlocked arena count
  - kept the boot flow unchanged while making return-session and retention analysis materially more useful

- Share analytics cleanup:
  - normalized `share_click` payloads in `src/share-service.js` instead of storing arbitrary caller payloads
  - updated match-result share calls to send structured fields for mode, result, arena, tops, and challenge node

- Match-start analytics cleanup:
  - added `arenaId`, `playerTopLabel`, and `enemyTopLabel` to `match_start`
  - closed the last obvious MVP-level analytics gap without changing battle flow

- Release/readme cleanup:
  - added docs/local-operations.md for local run, debug, save reset, analytics inspection, and manual smoke testing
  - added docs/provider-integration-notes.md for mock-first service boundaries and future provider integration rules
  - updated README.md to link the new operational docs and clarify mock-vs-real provider expectations

- Release and analytics closeout:
  - added docs/release-checklist.md as a compact deployability gate for runtime, progression, services, and analytics
  - added `endReason` and `roundCount` to `match_end` analytics with minimal round-to-match state handoff

- Match duration analytics cleanup:
  - added whole-match `durationSec` tracking from first launch to result resolution
  - kept timing state separate from round timers so multi-round matches report one stable match duration

- Repository and unlock-foundation cleanup:
  - added common local editor folders to .gitignore so repo status stays quieter in normal development
  - expanded save/progression plumbing to support both `unlocks.arenas` and `unlocks.tops`
  - updated repo-facing docs so current priorities and future top unlock direction match the implemented foundations

- First real top unlock flow:
  - set `Trick` to require SCRAP and wired locked-card purchase directly into the existing loadout selection flow
  - reused `unlock_grant` for top purchase analytics instead of inventing a separate unlock event family
  - added locked-card visual state so top unlocks are visible without adding a new screen or modal

- Top unlock closeout:
  - added `UNLOCK TRICK` to the debug panel for faster local validation
  - configured Challenge Road node 5 to grant `Trick` on first clear and emit `unlock_grant` for progression-based top unlocks too

- Storage root-cause fix and debug closeout:
  - fixed `src/storage-service.js` nested save sanitization so partial legacy saves no longer crash persistence and silently downgrade storage to memory mode
  - added persistence diagnostics and fallback visibility to the debug panel to make storage failures inspectable
  - expanded debug actions with `COPY SAVE`, `CLEAR EVENTS`, `MOCK SHARE`, and `MOCK REWARD`

- Persistence-visibility cleanup:
  - added a runtime warning banner for `session`, `window_name`, and `memory` save modes so non-durable save behavior is visible outside debug mode

- Debug portability cleanup:
  - added `storageService.import(...)` for controlled save restore
  - expanded debug actions with `IMPORT SAVE` and `COPY EVENTS` so save-state and analytics snapshots can be moved between test runs

- Session analytics closeout:
  - added `session_end` tracking through browser lifecycle hooks with once-only emission and normalized payload fields for duration, persistence mode, last mode, and last arena

- Reward mock-control cleanup:
  - upgraded the mock reward service to support `grant`, `deny`, and `error` modes
  - exposed reward-mode switching in the debug panel so reward success and failure branches can be tested without a live provider

- QA workflow cleanup:
  - added `docs/manual-test-batches.md` so future manual verification can be run in grouped batches instead of fragmented one-off checks

- Deployment documentation cleanup:
  - added `docs/deployment-notes.md` to capture the actual static-host constraints, persistence expectations, and remaining external/runtime dependencies of the current build

- Release-boundary cleanup:
  - added `docs/launch-blockers.md` to separate “iterable static build” from “final public commercial launch” and keep the remaining blockers explicit

- Status and host-validation cleanup:
  - added `docs/project-status-2026-04-17.md` to record actual completion level against the original MVP direction
  - added `docs/host-validation-plan.md` to make the next recommended phase explicit and repeatable

- Host validation reporting cleanup:
  - added `docs/host-validation-report-template.md` so real static-host validation results can be recorded consistently once deployment begins

- Deployment preflight cleanup:
  - added `docs/deployment-preflight.md` so host validation can start from a stable local baseline instead of mixing local regressions with host-specific issues

- Host evaluation cleanup:
  - added `docs/host-evaluation-sheet.md` so candidate static hosts can be judged with one repeatable rubric before provider work begins

- Provider-phase planning cleanup:
  - added `docs/provider-preflight.md`, `docs/provider-phase-plan.md`, and `docs/provider-phase-report-template.md` so reward/analytics integration can start from a fixed process once host validation passes

- Provider decision cleanup:
  - added `docs/reward-provider-evaluation-sheet.md` and `docs/analytics-sink-evaluation-sheet.md` so the first real provider choices can be judged with explicit criteria instead of ad hoc discussion

- Documentation navigation cleanup:
  - added `docs/docs-index.md` so the growing documentation set has one top-level navigation file by workflow stage

- Repo validation cleanup:
  - added `scripts/check-repo.js` and `npm run check:repo` to verify critical runtime files, `index.html` local references, the preserved original backup, and required operational docs before deployment work

- Documentation validation cleanup:
  - added `scripts/check-doc-links.js` and `npm run check:docs` to catch broken local Markdown links across `README.md` and `docs/`

- Validation workflow cleanup:
  - added `npm run preflight` as the single command that runs syntax, repo-structure, and documentation-link validation before host work or release checks

- Local operations convenience cleanup:
  - added `run-preflight.cmd` and `run-local-server.cmd` at repo root so local validation and static serving can be triggered without retyping commands

- DOM contract validation cleanup:
  - added `scripts/check-dom-contract.js` and `npm run check:dom` to catch missing `index.html` ids that are still referenced from runtime code before they turn into broken UI interactions

- Config validation cleanup:
  - added `scripts/check-config.js` and `npm run check:config` to catch mismatched text/config tables and invalid Challenge Road references before runtime testing

- Analytics consistency cleanup:
  - added `scripts/check-analytics-events.js` and `npm run check:analytics` to keep emitted analytics event names aligned with `docs/analytics-events.md`

- UI action contract cleanup:
  - added `scripts/check-ui-actions.js` and `npm run check:ui` to catch broken `__spinClashInvoke(...)` action names before they turn into non-responsive buttons

- Validation hardening cleanup:
  - fixed `scripts/check-ui-actions.js` so it correctly reads both `key: value` and shorthand keys from `window.__spinClashUI`
  - verified `npm run check:ui` and `npm run preflight` both pass after the fix

- Runtime dependency cleanup:
  - removed Google Fonts from `index.html` and switched the live shell to local system font stacks in `css/game.css`
  - extended `scripts/check-repo.js` so runtime entry files fail validation if remote Google Fonts are reintroduced
  - updated launch/deployment/status docs so the remaining public-launch blockers now focus on host validation plus real reward/analytics providers

- GitHub Pages deployment foundation:
  - added `scripts/build-static-release.js` and `npm run build:static` to package only runtime files into `dist-static/`
  - added `scripts/check-static-package.js` and `npm run check:static` to verify the packaged release does not accidentally ship docs or local workflow files
  - added `.github/workflows/deploy-pages.yml` so pushes to `main` can deploy the packaged static build through GitHub Pages
  - added `docs/github-pages-deploy.md` plus local helper `run-build-static.cmd`
  - updated README and host-validation docs so the next concrete phase can be real host validation instead of more local-only preparation

- Release verification consolidation:
  - added `npm run verify:release` to run preflight, build the static package, and validate the packaged output in one command
  - updated the Pages workflow to use `verify:release` directly so CI checks the same release path recommended locally
  - added `run-verify-release.cmd` so the full release verification path is one click from Windows Explorer
