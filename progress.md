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

2026-04-21
- Battle performance hardening pass for low/mid-end mobile priority:
  - added `check:battleperf` and folded it into `preflight`
  - added runtime battle perf metrics (`frameMs`, `physTick`, `battleView`, `renderer`) plus exposed `battlePerformanceMode`
  - fixed battle HUD hot path by caching DOM refs and correcting enemy spin percent to use `te.maxSpin`
  - removed `Date.now()` from battle view / sim active paths and replaced it with a battle visual clock
  - throttled HUD refresh cadence in battle view
  - batched scratch texture uploads behind movement thresholds and upload intervals
  - reduced trail churn by sampling on movement thresholds instead of pushing a new point every frame
  - reused collision particle instances instead of allocating fresh meshes/materials every burst
  - fixed `battlePerformanceMode.activeBattle` drift so debug/runtime perf state reflects the actual battle loop
- Verification performed:
  - `npm run check:battleperf`
  - `npm run check:syntax`
  - `npm run check:shellpresentation`
  - full `npm run preflight`
  - local browser smoke on `http://127.0.0.1:4173/index.html?debug=1`:
    - entered Quick Battle
    - started a round
    - launched into active combat via mouse drag simulation
    - advanced multiple seconds with `window.advanceTime(...)`
    - inspected runtime perf buckets and confirmed no battle long-frame counters were triggered in this environment
    - checked console errors; only repeated `favicon.ico` 404s were present
- Browser automation note:
  - attempted the required Playwright client from the local `develop-web-game` skill
  - current environment still lacks the Playwright Chromium binary, so that client path failed before screenshot capture
  - fallback validation used the working local server plus Chrome DevTools automation and screenshot inspection
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

- GitHub Pages host-validation closeout:
  - published the current build to GitHub Pages and confirmed `persistenceMode === local`
  - fixed the remaining user-visible red runtime banner on the main route by ignoring non-same-origin runtime noise in `src/runtime-audio-tools.js`
  - added a concrete GitHub Pages host-validation report and moved the project state from host-validation focus to provider-phase focus
  - added a first concrete provider recommendation document so the next phase can start from one narrowed reward path and one narrowed analytics path

- Provider-phase scaffolding expansion:
  - added explicit provider config for PostHog and AdSense-related live reward settings in `src/config-providers.js`
  - upgraded `src/analytics-service.js` from local-only buffering to a safe adapter model with real PostHog loading/forwarding scaffolding while keeping local buffering as the default
  - upgraded `src/reward-service.js` from a mock-only internal constant to an explicit adapter model with safe live-adapter capability probing for `adsense_rewarded`
  - added `scripts/check-provider-services.js` and `npm run check:providers` so provider scaffolding is part of preflight validation
  - added `docs/posthog-setup.md` and `docs/reward-live-adapter-status.md` so the next implementation slice can move straight into live provider integration instead of rediscovering setup details

- Provider runtime-state hardening:
  - expanded reward provider config to include GPT script and ad-unit placeholders for a real rewarded path
  - refined `src/reward-service.js` so live reward adapter state is inspectable (`ready`, `loading`, `lastAvailabilityReason`) without side effects from debug inspection
  - expanded `scripts/check-provider-services.js` to assert adapter readiness and safe fallback states for both analytics and reward providers
  - updated provider docs and debug-operations docs so provider-state inspection is part of the normal workflow

- Analytics runtime-state hardening:
  - extended `src/analytics-service.js` so provider adapter info now exposes `ready`, `loading`, and `lastForwardReason`
  - surfaced the new analytics provider-state fields through the debug panel for in-browser inspection
  - tightened provider validation so PostHog loading state and local-buffer state are asserted explicitly in `scripts/check-provider-services.js`
  - updated local/provider operations docs so future provider debugging starts from the visible runtime state rather than guesswork

- Reward contract hardening:
  - added `rewardService.wasGranted(result)` so gameplay callers no longer treat `granted:false` reward results as success
  - updated live reward callers in match/result/loadout/debug flows to gate their success branches on the normalized grant helper
  - expanded provider validation so mock deny and mock error modes are asserted explicitly, preventing future regressions in reward-result semantics

- Provider runtime async-hardening:
  - upgraded `src/provider-runtime-tools.js` from simple one-shot script injection to a reusable script-state layer with waitable script readiness
  - upgraded `src/analytics-service.js` so PostHog events queued during first load auto-flush after the SDK becomes ready, instead of waiting for a second gameplay event
  - upgraded `src/reward-service.js` so the first live reward request can wait through GPT script loading and still return a stable service-layer reason
  - expanded `scripts/check-provider-services.js` to cover queued-event flush behavior, first-request reward waiting, and richer provider adapter state reporting
  - updated provider/runtime docs so the current live-provider boundary and new debug-visible state are explicit

- GPT rewarded lifecycle integration:
  - replaced the old `provider_not_implemented` stopgap in `src/reward-service.js` with a real GPT rewarded slot request flow
  - mapped `rewardedSlotReady`, `rewardedSlotGranted`, and `rewardedSlotClosed` into the shared reward result contract without changing gameplay callers
  - added live-adapter cleanup and safe repeated-request guarding so slot listeners do not leak across reward attempts
  - surfaced live reward request state in debug data and expanded provider docs to reflect that the repository now has a real rewarded lifecycle path, pending manual live validation

- Deploy-time provider override support:
  - added `src/config-providers-override.js` and `src/config-providers-runtime.js` so provider settings can be overridden without changing the committed base config
  - upgraded `scripts/build-static-release.js` to generate packaged provider overrides from environment variables and fail fast on incomplete live reward/PostHog release config
  - wired GitHub Pages workflow variables into the release build so live provider validation no longer requires editing `src/config-providers.js` by hand
  - updated deploy/provider docs so the remaining manual work for live reward validation is now mostly GitHub variable entry plus browser testing

- Reward failure UX hardening:
  - added `rewardService.getFailureInfo(...)` so deny/loading/busy/unavailable/error states are normalized in one place
  - updated match-result and arena-trial flows to show clear reward-failure messages instead of silently doing nothing when a reward is denied or unavailable
  - added `COPY PROVIDERS` to the debug panel so live adapter state can be copied out in one step during future provider validation
  - updated local/manual/provider docs so the new failure messages and provider-export action are part of the expected validation workflow

- Enemy preset config closure:
  - added `src/config-enemy-presets.js` as the live enemy preset table for Challenge Road
  - changed Challenge Road nodes to reference `enemyPresetId` instead of hardcoded `enemyTopId`
  - updated round setup, challenge panel display, battle AI tuning reads, and debug state so enemy preset data now flows through config instead of node-local hardcoding
  - updated config/status/runtime docs so the remaining unblocked config work is now economy tuning rather than enemy preset extraction

- Economy config closure:
  - added `src/config-economy.js` for shared win/loss rewards, double-reward multiplier, default round timer, and Challenge Road continue limits
  - changed match flow and round flow to read those values from config instead of hardcoded literals
  - exposed the live economy snapshot in debug output so reward and continue tuning are inspectable without code reads

- Result snapshot and share-moment hardening:
  - added `scripts/check-match-flow.js` and wired it into `npm run preflight` so Challenge Road result-context regressions are now automatically caught
  - fixed result-screen state so double reward and share actions keep the cleared node context even after Challenge Road progression advances
  - upgraded share payloads from one generic text string to classified result moments (`road_clear`, `challenge_clear`, `ring_out`, `perfect_win`, `close_loss`, `victory`, `defeat`)
  - updated analytics and commercialization docs so the implemented share surface matches runtime behavior

- SVG result-card share output:
  - added `src/share-card-tools.js` to generate lightweight static SVG result cards without new dependencies
  - upgraded `src/share-service.js` so result shares now prefer file-share when supported, then text share, then SVG download plus copied text
  - added `scripts/check-share-service.js` and wired it into `npm run preflight` so result-card generation and fallback behavior stay covered
  - updated README and operations docs so the new share artifact path is reflected in local testing and release checks

- Share completion analytics:
  - upgraded `src/share-service.js` to emit `share_complete` with the resolved delivery method and artifact type
  - extended share-service validation so fallback share flows now prove both `share_click` and `share_complete`
  - updated analytics/service/release docs so share measurement now covers both attempt and completed delivery path

- Enemy preset variation and share debug export:
  - tuned `src/config-enemy-presets.js` so the shipped Challenge Road presets no longer share one identical AI profile
  - tightened `scripts/check-config.js` so future preset regressions fail if AI variation collapses back to one signature
  - exposed live enemy AI config in the debug panel
  - added `COPY SHARE SVG` and `DOWNLOAD SHARE SVG` debug actions for offline result-card inspection
  - exposed `shareService.downloadResultCard(...)` and extended share-service validation to cover direct SVG export

- Analytics payload enrichment and validation hardening:
  - preserved richer result-share analytics fields in `src/share-service.js`, including top labels, enemy preset identity, and score lines
  - propagated enemy preset identity into `challenge_node_start`, `match_start`, and `match_end`
  - exposed enemy preset labels through debug/runtime snapshots for easier inspection
  - added `scripts/check-round-flow.js` and extended existing share/match-flow checks so the new analytics fields are regression-covered

- Debug tuning path closure:
  - added session-local debug tuning import/export/reset support for `economy` and `enemyPresets`
  - kept tuning strictly behind `?debug=1` so the player path stays unchanged
  - added `scripts/check-debug-tuning.js` and wired it into preflight so the tuning path stays regression-covered

- Storage-service hardening:
  - normalized legacy/top-level save fields into the current nested save shape inside `src/storage-service.js`
  - preserved starter unlocks while deduping imported unlock arrays and discarding invalid analytics entries
  - added `scripts/check-storage-service.js` and wired it into preflight so legacy-save regressions fail before release packaging

- Debug panel error-handling hardening:
  - fixed `src/debug-service.js` so synchronous action failures now surface in the panel status line instead of throwing uncaught errors
  - added `scripts/check-debug-service.js` and wired it into preflight to protect debug import flows like `IMPORT SAVE` and `IMPORT TUNING`

- Loadout analytics regression coverage:
  - added `scripts/check-loadout-flow.js` to cover arena purchase, arena trial, and top purchase behavior plus their analytics payloads
  - wired the new loadout flow check into preflight so unlock/trial analytics regressions fail before release packaging

- Session analytics regression coverage:
  - added `scripts/check-session-analytics.js` to cover first-session, return-session, and once-only `session_end` behavior
  - fixed `src/debug-runtime-tools.js` so first boot no longer misclassifies as `return_session` due to a mutated save reference
  - wired the new session analytics check into preflight so lifecycle analytics regressions fail before release packaging

- Challenge clear unlock analytics hardening:
  - extended `scripts/check-match-flow.js` so Challenge Road clear rewards now regression-cover arena/top `unlock_grant` payloads too
  - fixed `src/match-flow-tools.js` so unlock analytics use the cleared node snapshot instead of the advanced next-node state

2026-04-17
- Phase 1 shell route refactor started:
  - wrote `docs/superpowers/plans/2026-04-17-shell-route-refactor.md`
  - created `docs/change-records/2026-04-17-ui-flow-combat-rework-log.md`
  - next step is to add a failing route contract check before runtime edits

- Phase 1 shell route refactor first slice complete:
  - added explicit shell route state in `src/main.js` and `src/ui-entry-tools.js`
  - title entries now route to `path`, `quick`, `workshop`, and `settings` instead of one overloaded loadout entry
  - added route header/back UI plus a basic settings route surface without changing the overall visual direction
  - added `scripts/check-shell-routes.js` and `npm run check:routes`
  - validation passed:
    - `npm run check:routes`
    - `npm run check:ui`
    - `npm run check:dom`
    - `npm run check:shellpresentation`
    - `npm run check:loadout`
    - `npm run check:syntax`
  - next TODOs:
    - tighten route-specific layout cleanup through manual runtime validation
    - route battle/result return fully through `battleReturnRoute`
    - replace settings scaffold text with real music/SFX controls in a later isolated slice

- Phase 1 shell route refactor second slice complete:
  - carried `battleReturnRoute` through match start, result primary CTA, and swap-rematch return handlers
  - changed result return behavior so `Battle -> Result` returns to the originating shell route instead of immediately starting another round
  - updated result CTA copy to reflect the captured origin route for `Championship Path`, `Quick Battle`, and `Home`
  - refined the secondary result CTA so `swapRematch` reads as a route-aware loadout-adjust action instead of the old immediate-rematch wording
  - fixed a result-screen ordering bug where `updateModeUI()` could overwrite the origin-specific return CTA after reward grant
  - added `scripts/check-route-return-flow.js` so the return-path contract is regression-covered across `ui-entry-tools` and `match-flow-tools`
  - upgraded `Settings` into a real persisted route with `music` / `sfx` toggles wired to storage and runtime audio gates
  - added `scripts/check-settings-flow.js` and extended storage/shell checks so settings persistence is part of `preflight`
  - aligned older `check:workshop` and `check:roadrank` harnesses with the current explicit-route shell model so `preflight` stays green
- Validation after the batch:
  - `npm run preflight`
  - `npm run check:matchflow`
  - `npm run check:dom`
  - `npm run check:routes`
  - `npm run check:routeflow`
  - `npm run check:settings`
  - `npm run check:storage`
  - `npm run check:shellpresentation`
  - `npm run check:localization`
  - `npm run check:ui`
  - `npm run check:loadout`
  - `npm run check:syntax`
- Next TODOs:
  - browser-level manual validation is still pending because local Playwright/browser launch is blocked in this environment with `spawn EPERM`
  - if the next batch starts combat refactor, keep shell/settings persistence isolated and avoid pushing battle-state assumptions back into route code
  - decide later whether `swapRematch` should stay as the same route-return action or become a more distinct loadout-adjust path
  - keep combat-rule refactor deferred until the shell route pass is fully stabilized

- Combat prep batch complete:
  - added config-level combat schema on tops so every top now carries `dash`, `guard`, and `signature` action metadata plus collision-role and attrition hints
  - added round-flow normalization/bridge logic so legacy templates still work while runtime tops now expose normalized `template.combat` and explicit `guarding` state
  - extracted pure impact-role helpers from `src/battle-sim-tools.js` so future aggressor/defender collision work can move onto named contracts instead of one opaque `checkColl(...)` block
  - kept live collision damage and spin loss behavior effectively unchanged in this slice; helper extraction is prep, not the actual rebalance yet
  - updated action/HUD/debug readers to prefer the new signature-skill path and fallback to legacy `template.skill`
  - added `scripts/check-combat-schema.js` and `scripts/check-collision-helpers.js`, and wired both into `npm run preflight`
- Validation after the batch:
  - `npm run check:combatschema`
  - `npm run check:collisionhelpers`
  - `npm run check:roundflow`
  - `npm run check:debugruntime`
  - `npm run check:shellpresentation`
  - `npm run check:ui`
  - `npm run check:syntax`
- Next TODOs:
  - use the new impact helper exports to convert collision resolution from symmetric damage application to explicit aggressor/defender outcome weighting
  - decide whether passive hp attrition lands as the next isolated slice or together with the first collision rebalance slice
  - activate `Guard` only after HUD/control copy and cooldown semantics are locked; the runtime state hook is now in place, but input/UI are not enabled yet
  - browser-level manual validation remains bypassed for now because Chromium launch still fails in this environment with `spawn EPERM`

- Collision + attrition slice complete:
  - upgraded `src/battle-sim-tools.js` so collision outcomes now pass through a role-aware `buildCollisionOutcome(...)` helper instead of applying only the old symmetric post-hit damage numbers
  - clear aggressor advantage now reduces recoil on the aggressor side and increases hp/spin punishment on the defender side, while unresolved head-on impacts stay effectively symmetric
  - added live passive `hp` decay from `template.combat.attrition.hpDecayPerSec` inside `movTop(...)`, keeping it intentionally light so hits still matter more than passive breakdown
  - extended `scripts/check-collision-helpers.js` to prove both the new directional collision weighting and the family-based passive durability ordering
- Validation after the batch:
  - `npm run check:collisionhelpers`
  - `npm run check:syntax`
  - `npm run preflight`
- Next TODOs:
  - tune the new aggressor/defender weighting with real runtime feel checks once browser launch is possible again
  - activate universal `Guard` in a separate slice: input, cooldown/readiness state, and player-facing copy are still intentionally deferred
  - if passive hp attrition feels too flat later, consider a small rank/mode or arena modulation, but do not mix that with the first Guard implementation pass
  - browser-level manual validation is still bypassed for now because Chromium launch remains blocked in this environment with `spawn EPERM`

- Guard activation slice complete:
  - activated universal `Guard` across config/runtime/UI: `E` key, HUD guard button, localized label/icon/hint text, cooldown/duration state, and guard SFX
  - updated battle sim so guarding reduces incoming hp/spin damage and expires over time; enemy AI also has a light guard trigger under close threat windows
  - enabled guard by default in the combat schema for all current tops and surfaced guard state in runtime/debug text snapshots
  - kept the current visual style intact; this is a control/HUD extension, not a shell redesign
- Validation after the batch:
  - `npm run check:guard`
  - `npm run check:shellpresentation`
  - `npm run check:ui`
  - `npm run check:routes`
  - `npm run check:syntax`
  - `npm run preflight`
- Next TODOs:
  - manual feel-check current guard cooldown/duration and AI guard timing once browser launch is possible again
  - the next clean slice should address skill-structure overlap, especially `Armor` still using `Shield` while `Guard` is now universal
  - if needed, separate later tuning between `Guard` mitigation numbers and collision role-weighting numbers instead of mixing both into one rebalance pass
  - browser-level manual validation is still bypassed for now because Chromium launch remains blocked in this environment with `spawn EPERM`

- Approved next-phase design direction after the static MVP shell reached practical completion for local iteration.
- Locked one authoritative next-step product direction:
  - expand `Challenge Road` into a `10`-node `Championship Path`
  - prioritize encounter depth over larger systems
  - add `Workshop Research` and `Road Rank` before any heavier meta layer
  - upgrade title, loadout, challenge, HUD, and result presentation as the main shell polish pass
- Added authoritative next-phase docs:
  - `docs/superpowers/specs/2026-04-17-next-phase-gameplay-expansion-design.md`
  - `docs/superpowers/plans/2026-04-17-next-phase-gameplay-expansion.md`
- The next execution rule is explicit:
  - subagents may propose drafts
  - final project docs must be centrally reconciled and authored as one consistent source of truth

- Championship Path foundation batch complete:
  - expanded `src/config-challenge-road.js` from `6` nodes to `10` nodes with chapter, tier, preview, checkpoint, and first-clear metadata
  - added persistent `challenge.checkpointNodeIndex` support in `src/storage-service.js`
  - updated `src/progression-tools.js` so challenge progress derives the latest valid checkpoint resume node
  - updated `src/match-flow-tools.js` so checkpoint clears persist checkpoint progress and first-clear bonuses are included in base reward calculation
  - updated `src/loadout-ui-tools.js` to surface chapter/tier/checkpoint preview information without changing the existing visual style
  - updated `src/debug-runtime-tools.js` to expose checkpoint state and retarget the `FINAL NODE` debug action to the new 10-node path
  - updated challenge-facing copy to `CHAMPIONSHIP PATH` while keeping internal `challenge*` runtime naming intact
- Added new regression coverage:
  - `scripts/check-next-phase-config.js`
  - extended `scripts/check-storage-service.js`
  - extended `scripts/check-match-flow.js`
  - wired `npm run check:nextphase` into `preflight`
- Validation after the batch:
  - `npm run check:nextphase`
  - `npm run check:storage`
  - `npm run check:matchflow`
  - `npm run preflight`
  - `npm run verify:release`

- Expanded roster shell batch complete:
  - added `scripts/check-roster-shell.js` and wired `npm run check:roster` into `preflight`
  - expanded `src/config-tops.js` from `3` to `5` tops
  - added derived player tops `impact_breaker` and `trick_raider`
  - added low-intrusion roster metadata on tops: `family`, `variant`, `unlockSource`, `meshFamily`
  - expanded `src/config-text.js` card text entries from `3` to `5`
  - expanded `index.html` loadout card DOM from `3` to `5`
  - kept the existing visual style while adjusting small-screen landscape wrapping so 5 cards still fit
  - updated `src/top-render-tools.js` and `src/round-flow-tools.js` so derived tops can reuse the correct visual family instead of falling into the old `else` branch
  - added debug actions for `UNLOCK BREAKER` and `UNLOCK RAIDER`
- Validation after the batch:
  - `npm run check:roster`
  - `npm run check:config`
  - `npm run check:dom`
  - `npm run check:ui`
  - `npm run check:loadout`
  - `npm run preflight`

- Encounter depth config batch complete:
  - added `scripts/check-encounter-pack.js` and wired `npm run check:encounter` into `preflight`
  - expanded `src/config-enemy-presets.js` from `3` to `6` presets
  - added elite presets `armor_ram`, `trick_drifter`, and `impact_blitz`
  - expanded `src/config-modifiers.js` from `6` to `9` modifiers
  - added lightweight modifiers `launchSurge`, `grindCore`, and `lowSpin`
  - rewired multiple `Championship Path` nodes to use the new presets and modifiers so encounter variety is real, not shelf-only data
- Validation after the batch:
  - `npm run check:encounter`
  - `npm run check:config`
  - `npm run check:nextphase`
  - `npm run check:roundflow`
  - `npm run check:matchflow`

- Workshop Research batch complete:
  - added `src/config-research.js` with `Spin Core`, `Guard Frame`, and `Burst Relay`, each with `4` conservative permanent levels
  - extended `src/storage-service.js` so existing saves gain normalized persistent `research.levels` defaults without breaking older data
  - extended `src/progression-tools.js` with research level lookup, aggregated player research bonuses, and SCRAP purchase handling
  - updated `src/round-flow-tools.js` so player-only research bonuses are applied through template shaping before round spawn instead of one-off battle hacks
  - updated `index.html`, `css/game.css`, `src/loadout-ui-tools.js`, and `src/ui-entry-tools.js` to add a small in-loadout Workshop panel while preserving the current visual language
  - updated `src/debug-runtime-tools.js` to expose research levels and live aggregated bonuses in debug snapshots
  - added `research_purchase` analytics coverage and documentation
  - added `scripts/check-workshop-flow.js`, extended `scripts/check-next-phase-config.js`, and extended `scripts/check-storage-service.js`
  - wired `npm run check:workshop` into `preflight`
- Validation after the batch:
  - `npm run check:syntax`
  - `npm run check:nextphase`
  - `npm run check:storage`
  - `npm run check:workshop`
  - `npm run check:analytics`
  - `npm run check:loadout`
  - `npm run check:roundflow`

- Road Rank batch complete:
  - wired `src/config-road-ranks.js` into `index.html` and `src/main.js` so rank data now participates in the live runtime instead of only isolated checks
  - extended `src/loadout-ui-tools.js`, `src/ui-entry-tools.js`, and `css/game.css` with a small Championship Path rank strip that preserves the current visual language
  - added player-facing Road Rank copy in `src/config-text.js` and descriptive metadata in `src/config-road-ranks.js`
  - updated `src/debug-runtime-tools.js` so unlocked and selected rank state is visible and can be forced to `RANK II` or `RANK III` in debug mode
  - added `scripts/check-road-rank-ui.js` and wired `npm run check:roadrank` into `preflight` so rank UI regressions fail before release verification
  - updated README, local operations, and analytics docs so Road Rank runtime behavior matches the repo guidance
- Validation after the batch:
  - `node scripts/check-road-rank-ui.js`
  - `npm run check:roadrank`
  - `npm run check:ui`
  - `npm run preflight`
  - `npm run verify:release`

- Shell presentation upgrade batch complete:
  - updated the title screen so the primary route is `CONTINUE PATH`, with direct `QUICK BATTLE` and `WORKSHOP` side entries
  - added dynamic title progress and goal lines tied to current save state
  - added a featured selected-top panel in loadout so the chosen top reads like a product card instead of only a small tile selection
  - upgraded the Championship Path preview with a node strip that marks cleared, current, boss/final, and checkpoint nodes
  - added a compact pre-fight battle intro banner plus stronger HUD danger states for low HP and low spin
  - upgraded the result screen with reward breakdown text and explicit next-step guidance
  - added `scripts/check-shell-presentation.js` and wired `npm run check:shellpresentation` into `preflight`
- Validation after the batch:
  - `node scripts/check-shell-presentation.js`
  - `npm run check:shellpresentation`
  - `npm run check:ui`
  - `npm run check:dom`
  - `npm run verify:release`

- Analytics and debug closeout batch complete:
  - extended `src/match-flow-tools.js` so Championship Path result analytics now carry chapter/tier/checkpoint context, reward breakdown fields, and emit `championship_checkpoint` plus `road_rank_unlock`
  - extended `src/round-flow-tools.js` so `challenge_node_start` now includes chapter/tier/reward/rank metadata
  - extended `src/loadout-ui-tools.js` and `src/progression-tools.js` so workshop purchases now report richer payloads and rank changes emit `road_rank_select`
  - extended `src/debug-runtime-tools.js` with explicit progression/runtime snapshot builders plus `COPY PROGRESSION` and `COPY RUNTIME`
  - added `scripts/check-debug-runtime-snapshots.js` and wired `npm run check:debugruntime` into `preflight`
  - updated analytics and local-ops docs so the documented event surface and debug panel actions match the runtime
- Validation after the batch:
  - `node scripts/check-workshop-flow.js`
  - `node scripts/check-road-rank-flow.js`
  - `node scripts/check-road-rank-ui.js`
  - `node scripts/check-match-flow.js`
  - `node scripts/check-round-flow.js`
  - `node scripts/check-debug-runtime-snapshots.js`

- Manual QA batch prep update:
  - extended `docs/manual-test-batches.md` with a dedicated Championship Path / Workshop / Road Rank / snapshot-export regression batch so the next human playtest can validate the connected progression shell in one pass

- Tri-language localization batch complete:
  - added player-facing runtime localization for `English`, `中文`, and `日本語` without changing the current shell art direction
  - added saved-locale bootstrap with browser-locale fallback so player language persists across reloads and defaults cleanly on first visit
  - localized title, loadout, Workshop, Championship Path, HUD, result, share, arena/top/modifier/enemy/challenge content, and reward failure messaging
  - added lightweight locale switchers on the title and loadout shells while keeping developer/debug-facing text in English/ASCII
  - added `scripts/check-localization.js`, wired `npm run check:localization` into `preflight`, and reran `npm run verify:release`

- Debug tuning expansion batch complete:
  - expanded `COPY TUNING / IMPORT TUNING / RESET TUNING` support beyond `economy` and `enemyPresets`
  - tuning import/export now covers `arenas`, `tops`, `research`, `roadRanks`, and `challengeRoad` as session-local full-table overrides
  - added compact tuning summary visibility in the debug panel for unlock costs, research spend, reward totals, and rank multipliers
  - updated debug tuning/runtime snapshot checks and local/manual operation docs so the wider tuning surface is regression-covered and documented

- Balance pass batch complete:
  - split runtime reward bases so `Quick Battle` now uses lower practice payouts while `Championship Path` keeps its own win/loss baseline
  - tightened early and mid-path economy by lowering early node rewards, lowering `HEX BOWL` / `Trick` entry costs, and raising `Breaker` / `Raider` late-goal costs
  - smoothed research pricing so first levels stay accessible while full-track completion backloads more SCRAP
  - reduced `RANK II` / `RANK III` reward inflation and softened the harshest elite-preset and modifier spikes in nodes `4-6`
  - added `docs/balance-pass-2026-04-17.md` as the explicit tuning baseline, expected UX impact record, and next-playtest retro checklist

- UI flow and combat rework progression update:
  - completed the explicit shell-route split into `Home`, `Championship Path`, `Quick Battle`, `Workshop`, and `Settings`, with battle/result flows now returning to the originating route
  - shipped persisted `Settings` toggles for `music` and `sfx` without changing the existing static architecture or visual language
  - refactored combat toward the approved baseline: role-aware aggressor/defender collision outcomes, light top-based `hp` attrition, and universal `Dash + Guard + Signature`
  - replaced Armor's overlapping `Shield` signature with `Fortress Pulse`, updated its tri-language text/audio/runtime handling, and added `scripts/check-signature-skills.js`
  - added `src/config-signature-skills.js` so signature HUD icon metadata and audio-style routing are now config-driven instead of duplicated in runtime files
  - aligned HUD default skill labeling with the currently selected top so the non-battle state no longer assumes `Fly Charge`
  - extended signature registry metadata into flash/message telegraph behavior, reducing hardcoded per-skill presentation branches in `combat-action-tools.js`
  - added localized active-battle ready hints so full `BURST` now surfaces a clearer `Q READY · <skill>` prompt instead of relying only on the ring/button state
  - extended signature registry again into HUD accent colors so the ready ring and ready hint can telegraph different signature identities without a visual redesign
  - moved guard baseline tuning into combat action metadata and updated runtime consumers to read `guard.cooldown` and `guard.duration` from the normalized combat schema
  - made a conservative gameplay polish pass on the current baseline: `Armor` core `roleBias` raised to `0.95`, guard became shorter-but-clearer, and `Fortress Pulse` now stabilizes the user more while slightly reducing its push and damage output
  - upgraded battle readability again so the left/right role labels now surface live `READY` and `GUARD` status instead of leaving enemy readiness mostly implicit
  - aligned those role labels with the existing accent system so signature-ready and guard states read more clearly without changing the shell art direction
- Validation after the update:
  - `npm run check:signatures`
  - `npm run check:combatschema`
  - `npm run check:roster`
  - `npm run check:shellpresentation`
  - `npm run preflight`
- Current known limit:
  - browser/manual click validation is still blocked in this environment because Chromium launch fails with `spawn EPERM`; no browser verification has been claimed for this slice

- Combat intent + variant polish update:
  - added enemy AI intent lead-ins for `skill`, `guard`, and `dash`, so the CPU now telegraphs those actions before committing instead of snapping straight into them
  - initialized explicit runtime intent fields on spawned tops and exposed them through `renderGameToText()` / debug runtime snapshots for easier manual QA and future tuning
  - upgraded battle HUD role labels so enemy lead-ins now surface as live `SKILL`, `DASH`, and `GUARD` reads with the same restrained accent language already used elsewhere
  - extended `src/config-signature-skills.js` from presentation metadata into light tuning metadata, so derived tops can diverge without inventing new signature ids
  - made `Breaker` feel more explosive by giving its `Fly Charge` a stronger/faster line break and a short collision-role bias window
  - made `Raider` feel more predatory by giving its `Phantom` a longer phantom window, stronger push, and visible lateral drift
  - added `scripts/check-combat-intent-telegraph.js`, extended `scripts/check-signature-skills.js`, and wired `npm run check:combatintent` into `preflight`
- Validation after the update:
  - `npm run check:signatures`
  - `npm run check:combatintent`
  - `npm run check:localization`
  - `npm run check:shellpresentation`
  - `npm run check:debugruntime`
  - `npm run check:roundflow`
  - `npm run preflight`
- Manual route smoke update:
  - the user manually tested the current local build in an existing Chrome session on `2026-04-18`
  - no visible issues were found across the main shell/return paths:
    - `Home -> Championship Path -> Battle -> Result -> Championship Path`
    - `Home -> Quick Battle -> Battle -> Result -> Quick Battle`
    - `Home -> Workshop -> Back -> Home`
    - `Championship Path -> Workshop -> Back -> Championship Path`
    - `Quick Battle -> Settings -> Back -> Quick Battle`
  - this closes the earlier browser-validation gap for shell route flow, but does not yet count as a full combat-balance or homepage-presentation signoff
- Current known limit:
  - direct agent-controlled Chromium launch/attachment is still not established in this environment, so browser validation currently depends on user-driven Chrome testing rather than an agent-run browser loop

- Home showcase polish batch complete:
  - upgraded the title/home shell with a dedicated current-top showcase panel instead of only progress lines and route buttons
  - added left/right home-cycle controls that rotate only through unlocked tops and keep using the same `playerTopId` state consumed by loadout and battle flow
  - mirrored current-top pitch and trait text into `Home`, so the player can identify the active top before entering `Championship Path` or `Quick Battle`
  - added a light selected-top normalization pass at route entry so debug/save resets do not leave the shell focused on a locked top
  - extended `scripts/check-shell-presentation.js` to cover the new home showcase DOM and bindings
- Validation after the batch:
  - `npm run check:syntax`
  - `npm run check:ui`
  - `npm run check:shellpresentation`
  - `npm run preflight`
- Current follow-up:
  - manual Chrome smoke still useful for the new home showcase spacing, arrow affordance clarity, and unlocked-top cycling feel

- Home model showcase batch complete:
  - replaced the interim text-first home top panel with a dedicated model-first stage inside `Home`
  - added `src/home-top-showcase-tools.js` as an isolated home-only Three.js renderer that reuses the existing `mkTop(...)` model factory
  - added a lightweight pedestal, transparent stage, idle spin/bob animation, and route-bound visibility so the selected top now reads visually on the home screen
  - kept home selection bound to the same `playerTopId` and unlocked-top cycle logic already used by route entry and match start
  - reduced home copy to supporting text so the model becomes the primary identity surface
  - added `docs/superpowers/plans/2026-04-18-home-top-showcase-model.md` as the implementation plan snapshot for this slice
- Validation after the batch:
  - `npm run check:syntax`
  - `npm run check:shellpresentation`
  - `npm run check:ui`
  - `npm run preflight`
- Current follow-up:
  - manual Chrome smoke is needed specifically for stage centering, desktop/mobile fit, and whether the model presence now matches the intended “display stand” feel

- Home model showcase hotfix:
  - fixed a real runtime error on the live page: `Cannot access 'playerTopId' before initialization`
  - root cause was init order in `src/main.js`: the home showcase renderer was initialized before `playerTopId` finished declaration
  - moved `homeTopShowcaseTools.initialize()` to the first safe point after `let gameState='title', playerTopId=0, ...`
  - attached to the user's existing Chrome session through the available local CDP bridge, reloaded the current `Spin Clash` tab, and confirmed:
    - no `runtime-error-box`
    - `#home-top-stage` present
    - one showcase canvas mounted
- Validation after the hotfix:
  - `npm run check:syntax`
  - `npm run preflight`

- Home showcase layout alignment update:
  - attached to the user's current Chrome tab again and captured the live home page before/after screenshots into:
    - `output/home-layout-analysis.png`
    - `output/home-layout-analysis-fixed.png`
  - diagnosed the visible layout drift as CSS grid auto-placement, not model/render logic: the right nav button had fallen out of the intended third column and was stacking on the left below the stage
  - locked the home showcase panel into explicit grid areas so the layout now renders as `left nav / model stage / right nav` with the description copy centered below
  - preserved the existing shell art direction and only tightened layout structure in `css/game.css`
- Validation after the alignment update:
  - `npm run check:shellpresentation`
  - `npm run preflight`
  - live geometry check on the attached Chrome page confirmed the right nav moved from `x=79` to `x=723`

- Home showcase frame-fit update:
  - attached to the same Chrome page after the layout pass because the user reported the selected top still looked like it extended below the visible inner display frame
  - traced the issue to the visible frame inset depth in `css/game.css`, not to renderer overflow or model initialization
  - adjusted the home showcase inner-frame inset from `14px 8px 22px` to `10px 8px 8px`, so the pedestal and glow now sit inside the visible stage plate
  - captured the updated live page to `output/home-frame-fit-pass1.png`
- Validation after the frame-fit update:
  - `npm run check:shellpresentation`
  - `npm run preflight`

- Home showcase simplification update:
  - after another live screenshot review, shifted from "keep adjusting frame fit" to the cleaner fix the user approved: remove the hard backdrop frame and reduce the side nav buttons
  - removed the showcase pseudo-frame entirely in `css/game.css`, so the model no longer reads as pressing against a rectangular inner box
  - slimmed the side nav controls into centered pill buttons and reduced their visual weight from tall bars to small `30x84` controls
  - attached to the current Chrome page and captured the result to `output/home-showcase-simplified.png`
- Validation after the simplification update:
  - `npm run check:syntax`
  - `npm run check:shellpresentation`
  - `npm run preflight`

- Home preview roster + lock-shadow update:
  - split `Home` preview state from equipped battle state so the title screen can cycle across the full roster, including locked tops, without breaking battle-entry rules
  - removed the old `已解锁 X/N` count from the home preview and replaced it with direct state chips plus lock-state teaser copy
  - kept locked top names and types visible, but suppressed full ability disclosure in favor of unlock guidance tied to each top's unlock source
  - added a home-only locked-preview rendering pass and then iterated it through multiple live screenshots:
    - first pass proved the feature but still looked like a dimmed normal model
    - later passes progressively removed material detail, darkened lighting, narrowed the shadow mask, and pushed the model toward a more intentional silhouette reveal
  - live screenshot trail for this iteration batch:
    - `output/home-preview-unlocked.png`
    - `output/home-preview-locked.png`
    - `output/home-preview-locked-pass2.png`
    - `output/home-preview-locked-pass3.png`
    - `output/home-preview-locked-pass4.png`
  - the temporary save narrowing used to verify locked states in the live page was restored immediately after each pass, and the attached Chrome tab was returned to the original unlocked save
- Validation in this batch:
  - `npm run check:syntax`
  - `npm run check:shellpresentation`

- Home preview visual-regression follow-up:
  - continued the lock-preview pass with a stricter visual-review standard: not only whether the locked state functioned, but whether the entire showcase block still looked coherent on the full page
  - identified and removed two design regressions found only by screenshot review:
    - the large egg-shaped dark backdrop made the showcase area look dirty and overdesigned
    - the duplicate locked labels created redundant hierarchy inside the same panel
  - shifted the lock-preview strategy away from backdrop-heavy masking and toward darker home-only lighting, lower pedestal energy, reduced accent visibility, and clearer subject-vs-pedestal separation
  - latest screenshot progression for this refinement pass:
    - `output/home-preview-locked-pass5.png`
    - `output/home-preview-locked-pass6.png`
  - restored the user's original local save after each live locked-state verification pass
- Validation in this follow-up:
  - `npm run check:syntax`
  - `npm run check:shellpresentation`

- Home showcase whole-block cleanup follow-up:
  - moved from locked-state-only polish into full-block regression review, comparing the unlocked showcase screenshot against the locked silhouette screenshot instead of judging each state in isolation
  - removed another layer of visual noise that only became obvious in full-page screenshots:
    - unlocked state no longer shows a duplicated type line when the localized type text and top name are effectively the same
    - unlocked state chip styling was softened so it stops fighting the top name for attention
  - latest whole-page unlocked regression screenshot:
    - `output/home-current-regression-pass2.png`
- Validation in this cleanup:
  - `npm run check:syntax`
  - `npm run check:shellpresentation`

- Quick Battle arena-showcase batch complete:
  - added `docs/superpowers/plans/2026-04-18-quick-battle-arena-showcase-plan.md` as the plan snapshot for the new route-specific layout
  - rebuilt `Quick Battle` into an arena-first route with:
    - large top-stage arena preview
    - left/right arena cycling
    - arena name/status/description copy
    - a lower ready strip with a small deployed-top model and a dedicated start area
  - added `src/quick-battle-preview-tools.js` as a second isolated showcase renderer so arena and mini-top previews do not couple back into battle rendering or the home showcase renderer
  - changed quick arena browsing from “unlock while selecting” to “preview while browsing, resolve unlock/trial on start”, which better matches the approved route hierarchy
  - added a blocked start state for locked-top edge cases with warning-colored button treatment and explicit hint copy
  - attached to the user's current Chrome session and captured:
    - `output/quick-battle-pass2.png`
    - `output/quick-battle-locked-arena-pass1.png`
    - `output/quick-battle-locked-arena-pass3.png`
  - verified in the attached tab that an unlocked quick-battle start still reaches battle state without runtime error
- Validation after the batch:
  - `npm run check:shellpresentation`
  - `npm run check:ui`
  - `npm run check:syntax`
  - `npm run preflight`

- Home locked-preview route-guard hotfix complete:
  - fixed a logic mismatch where `Home` could preview a locked top but still let the player enter `Quick Battle` or `Championship Path`
  - added failing assertions first in:
    - `scripts/check-shell-routes.js`
    - `scripts/check-shell-presentation.js`
  - fixed it in two layers:
    - home route buttons now disable when the previewed top is locked
    - route actions themselves also refuse `goQuick / goPath` from `Home` if the current preview top is locked
  - attached to the existing Chrome tab after reload and verified:
    - `冲击 / 装甲` keep route buttons enabled
    - `诡步 / 破阵 / 掠袭` now disable both route buttons
- Validation after the hotfix:
  - `npm run check:routes`
  - `npm run check:shellpresentation`
  - `npm run check:syntax`

2026-04-18 local resume update
- Added `docs/session-handoff-2026-04-18.md` as the new repo-local recovery entrypoint for this project.
- The shell route split is now largely implemented and should not be treated as only planned work anymore:
  - `Home`
  - `Championship Path`
  - `Quick Battle`
  - `Workshop`
  - `Settings`
  - route-aware `Battle` / `Result`
- Recent work completed on top of the route split:
  - `Home` locked/unlocked roster preview and silhouette treatment
  - `Home` route-entry guard while previewing locked tops
  - `Quick Battle` arena-first layout
  - lower quick-battle strip cleanup
  - explicit 3-state locked-arena CTA semantics
  - heart arena preview geometry-source fix
  - screenshot-driven heart preview presentation tuning
  - cross-arena preview thickness/scale alignment
- Latest useful screenshot references for quick resume:
  - `output/quick-battle-circle-current-pass3.png`
  - `output/quick-battle-heart-current-pass7.png`
  - `output/quick-battle-hex-current-pass3.png`
- Latest local validation at session end:
  - `npm run check:shellpresentation`
  - `npm run check:syntax`
  - `npm run preflight`
  - all green
- Resume rule:
  - use repository docs and current code as the source of truth
  - do not rely on the shared global `AI-Memory` pointer for this project if multiple sessions are active
- Recommended next resume order:
  1. `docs/session-handoff-2026-04-18.md`
  2. `docs/change-records/2026-04-17-ui-flow-combat-rework-log.md`
  3. `docs/superpowers/specs/2026-04-17-ui-flow-combat-feedback-design.md`
  4. `docs/superpowers/specs/2026-04-17-next-phase-gameplay-expansion-design.md`
  5. `docs/project-status-2026-04-17.md`
  6. `docs/balance-pass-2026-04-17.md`
  7. `progress.md`

2026-04-18 Task 4 manual acceptance follow-up
- Continued browser smoke through the attachable Chrome CDP proxy against `file:///C:/Users/29940/spin-clash/index.html` because local static-server spawn is still constrained in this environment.
- Reconfirmed route-shell behavior under `file://`:
  - `Home -> Quick Battle` still enters the route cleanly
  - `Quick Battle -> Start Match` hides loadout, shows HUD, and enters `mode:"prepare"` without runtime error
  - `mode:"prepare"` after `START MATCH` is expected behavior, not a regression; code and live interaction both confirmed the player must drag to launch
  - one synthetic drag launch moved the runtime into `mode:"active"` with the expected combat hint text and enemy intent telegraph present
  - advancing the fight resolved `ROUND 1 -> ROUND 2`, then a second launch/advance resolved to `mode:"matchResult"`
  - result `PLAY AGAIN` returned to `Quick Battle` without surfacing a runtime error
- Localization smoke under `file://`:
  - `Quick Battle` route copy switched cleanly across `English / 中文 / 日本語`
  - Japanese locale persisted after reload on the title screen
  - fresh screenshots captured:
    - `output/task4-enter-quick-pass2.png`
    - `output/task4-start-match-prepare-pass2.png`
    - `output/task4-after-drag-active-pass1.png`
    - `output/task4-match-result-pass1.png`
    - `output/task4-result-return-quick-pass1.png`
    - `output/task4-locale-ja-quick-pass1.png`
    - `output/task4-title-safe-area-fixed-ja-pass6.png`
- Acceptance bug found during this pass:
  - the title/home shell could vertically overflow on shorter desktop heights, which pushed the `SPIN CLASH` heading off-screen and made the lower title actions require scroll
  - root cause: the title overlay had no explicit top-safe spacing contract while the home/title block had grown taller than the centered viewport budget
  - added a new shell-presentation regression guard for dedicated `#ov-title` top-safe spacing
  - added compact `max-height:900px` title-shell CSS adjustments in `css/game.css`
  - tightened the short-height contract again by giving the home showcase stage an explicit reduced height inside the short-viewport block, instead of relying on `min-height` only
- Verification after the title-shell fix:
  - `npm run check:shellpresentation`
  - `npm run check:ui`
  - `npm run preflight`
  - all green on this pass
- Short-height desktop recheck:
  - at `1274x849` with the storage warning visible, the title heading now sits below the warning instead of behind it
  - all four title actions, including `SETTINGS`, now fit inside the first viewport without relying on overlay scrolling
  - treat this specific short-height title-shell regression as closed for the current local/browser baseline
- Remaining Task 4 caveat:
  - acceptance evidence is still from `file://` plus the attached local Chrome session, not the recommended local static-server URL
  - keep final Task 4 signoff conditional on one normal local-server browser pass when the environment allows it

2026-04-18 Task 5 quick-battle visual closure follow-up
- Reviewed the latest `circle / heart / hex` quick-battle screenshots side by side before changing code again.
- Chosen micro-slice stayed aligned with the release plan default target:
  - improve locked `Hex Bowl` readability only
  - keep the current quick-battle route layout and unlocked-arena direction intact
  - do not touch combat arena math
- Added a source-level regression guard in `scripts/check-shell-presentation.js` so the locked hex preview now has an explicit readability contract instead of relying only on subjective screenshot memory.
- Narrow preview-only pass landed in `src/quick-battle-preview-tools.js`:
  - added a dedicated locked-hex top plate
  - added a locked-hex inset top guide line
  - slightly separated locked hex shell/floor materials so the top surface reads apart from the side wall
- Fresh screenshot evidence from a new attached `file://` tab:
  - `output/task5-locked-hex-readability-pass4.png`
- Verification after the micro-pass:
  - `npm run check:shellpresentation`
  - `npm run check:syntax`
- Current read:
  - locked hex still stays intentionally subdued, but it no longer depends only on one flat dark silhouette; there is now a clearer top-vs-side read
  - this is a narrow readability pass, not a redesign

2026-04-18 Task 6 localization readability closure
- Continued attached-browser validation through the local Chrome CDP proxy against `file:///C:/Users/29940/spin-clash/index.html`.
- Focused the pass on the highest-risk CJK surfaces from Batch 6:
  - title / loadout shell heading stack
  - settings and workshop explanatory copy
  - championship path roster card naming
- Real issues confirmed before code changes:
  - `#ov-loadout` could pin its heading stack too close to the top edge, which let the persistent storage warning sit on top of the route title/subtitle area in `冠军之路 / チャンピオンロード`
  - Japanese roster cards repeated the same label twice for name/type pairs such as `インパクト / インパクト`, which weakened quick readability in the featured-top and card grid
- Minimal fixes landed:
  - added a dedicated `#ov-loadout` top-safe spacing contract in `css/game.css`, with top anchoring plus explicit top padding so route headings no longer render under the storage warning
  - tightened Japanese card type labels in `src/config-text.js` so they now read as category words instead of duplicating the top names:
    - `衝撃型`
    - `装甲型`
    - `奇策型`
    - `破陣型`
    - `襲撃型`
  - added regression guards:
    - `scripts/check-shell-presentation.js` now asserts a dedicated `#ov-loadout` safe-area contract exists
    - `scripts/check-localization.js` now asserts Japanese card type labels stay distinct from localized top names
- Fresh screenshot evidence:
  - before:
    - `output/task6-ja-path.png`
    - `output/task6-zh-path.png`
  - after:
    - `output/task6-ja-path-fixed.png`
    - `output/task6-zh-path-fixed.png`
    - `output/task6-ja-title.png`
    - `output/task6-ja-settings.png`
    - `output/task6-zh-title.png`
    - `output/task6-zh-settings.png`
    - `output/task6-zh-workshop.png`
- Verification after the Task 6 pass:
  - `npm run check:localization`
  - `npm run check:shellpresentation`
  - `npm run preflight`
  - all green
- Current read:
  - Task 6 is closed for the current local/browser baseline
  - no new combat-feel blocker was surfaced during this localization pass
  - default next move is `Task 8: Release Closure And Ship Gate`, unless the user explicitly wants the optional combat-feel pass first

2026-04-18 Task 8 release closure and ship gate
- Synced release-facing docs to the actual current repository state:
  - `docs/release-checklist.md`
  - `docs/launch-blockers.md`
  - `docs/deployment-notes.md`
  - `docs/github-pages-deploy.md`
- Important release-state clarification now recorded in docs:
  - reward and analytics service integrations exist and are config-driven
  - committed base config still defaults to safe local/manual operation:
    - `reward.adapter = mock`
    - `analytics.adapter = local_buffer`
  - live rewarded ads and live PostHog forwarding remain deploy-time override features, not the default shipped baseline
- Final local release gate run:
  - `npm run verify:release`
  - result: green
- Final release decision for the current repository state:
  - safe for `limited external test`
  - not yet safe to call a final monetized public release
- Remaining true blocker:
  - live/manual rewarded-ad validation on the deployed target host/browser
  - live/manual PostHog forwarding validation on the deployed target host/browser
- Recommended next practical step:
  - deploy or reuse the GitHub Pages build with the intended provider overrides
  - run the live provider closeout pass and upgrade `docs/provider-phase-report-2026-04-18-partial.md` into a final closeout artifact

2026-04-18 provider closeout attempt follow-up
- Began the next post-Task-8 step: inspect the currently deployed GitHub Pages target as the expected provider-closeout baseline.
- Used a fresh attached-browser background tab against:
  - `https://ryuutora1986.github.io/spin-clash/?debug=1`
- Confirmed a new operational blocker:
  - the current public Pages deployment is not the latest provider-aware release package
  - deployed script list does not include:
    - `src/config-providers.js`
    - `src/config-providers-runtime.js`
    - `src/config-providers-override.js`
  - direct deployed fetch checks for those files returned `404`
  - local `dist-static/` built by `npm run verify:release` does contain all three files
- Practical conclusion:
  - current public Pages cannot yet serve as the final provider validation target
  - next required move is redeploy the current release package before attempting real rewarded-ad or PostHog closeout
- Evidence:
  - screenshot:
    - `output/task8-pages-debug-current.png`

2026-04-18 GitHub Pages redeploy recovery
- Continued from the failed provider-closeout baseline and recovered the deployed host without using local `git push`, because this environment still cannot write `.git/index.lock`.
- Synced the current release/runtime/workflow files to remote `main` through the GitHub API in batches until the critical provider/runtime set was current.
- Diagnosed and cleared the actual GitHub Pages workflow blockers in sequence:
  - first failure: remote `main` still had an older `config-challenge-road.js`, so `check:nextphase` failed on Linux CI
  - second failure: remote `docs/analytics-events.md` was stale, so `check:analytics` failed on Linux CI
- Final successful deploy evidence:
  - GitHub Actions run: `24606760465`
  - deployed commit: `2112a971bba669594d60db2109887d3001450aaa`
- Fresh deployed-host verification after the successful Pages run:
  - opened cache-busted live URLs through the attached browser proxy:
    - `https://ryuutora1986.github.io/spin-clash/?debug=1`
    - `https://ryuutora1986.github.io/spin-clash/`
  - confirmed the deployed script list now includes:
    - `src/config-providers.js`
    - `src/config-providers-override.js`
    - `src/config-providers-runtime.js`
    - `src/provider-runtime-tools.js`
  - direct in-page fetch checks for those four files returned `200`
  - `?debug=1` mounted the debug panel successfully
  - no visible runtime error banner was present in that fresh deployed check
 - Current practical state after recovery:
  - the public GitHub Pages URL is now current enough to use as the provider-closeout baseline
  - the remaining blocker is real rewarded-ad validation plus real PostHog forwarding validation under deploy-time overrides, not stale host package mismatch
  - docs updated:
    - `docs/provider-phase-report-2026-04-18-partial.md`
    - `docs/launch-blockers.md`

2026-04-18 PostHog live validation closeout
- Continued provider closeout on the recovered GitHub Pages baseline and used the user's authenticated browser session plus GitHub Actions repository variables to enable live PostHog forwarding without changing committed base config.
- Created live PostHog repository variables:
  - `SPIN_CLASH_ANALYTICS_ADAPTER=posthog`
  - `SPIN_CLASH_ANALYTICS_ENABLE_FORWARDING=true`
  - `SPIN_CLASH_POSTHOG_ENABLED=true`
  - `SPIN_CLASH_POSTHOG_PROJECT_API_KEY=<configured in repo variables>`
  - `SPIN_CLASH_POSTHOG_API_HOST=https://us.i.posthog.com`
  - `SPIN_CLASH_POSTHOG_SCRIPT_URL=https://us-assets.i.posthog.com/static/array.js`
- Triggered and completed two deploy runs during this closeout:
  - `24607190399`
  - `24607227795`
- Found and resolved one real deployed-runtime gap:
  - enabling PostHog with only key + host was not enough in the current implementation
  - without `SPIN_CLASH_POSTHOG_SCRIPT_URL`, the runtime switched to `posthog` mode but stayed `posthog_unavailable`
  - after adding the script URL variable and redeploying, the deployed override file served the expected live PostHog config
- Live runtime/browser validation results on `https://ryuutora1986.github.io/spin-clash/?debug=1`:
  - adapter state switched to `posthog`
  - forwarding state switched to enabled
  - first validation event showed expected transitional `posthog_loading`
  - SDK then reached `ready: true`, `initialized: true`, `queuedEvents: 0`
  - follow-up validation event returned `forwarded: true`
- Important operational note:
  - an already-open browser tab may continue using cached older provider scripts until hard refresh
  - the deployed file itself was confirmed current via direct fetch from `src/config-providers-override.js`
- Current practical state after this pass:
  - first real deployed-host PostHog validation is complete
  - analytics forwarding is no longer a launch blocker for the current first-sink scope
  - the only major provider-closeout item still open is real rewarded-ad validation with a production-capable GPT/AdSense ad unit path
- Docs updated:
  - `docs/provider-phase-report-2026-04-18-partial.md`
  - `docs/launch-blockers.md`
  - `docs/github-pages-deploy.md`

2026-04-19 company-domain custom-host cutover
- Chosen host direction changed from trying to monetize directly on the WordPress root company site to using a controlled company subdomain for the game host:
  - target: `play.hakurokudo.com`
- Confirmed with the user's authenticated browser session that:
  - `hakurokudo.com` is the active primary domain in WordPress.com
  - DNS for `hakurokudo.com` is managed inside the same WordPress domain console
  - an existing `test.hakurokudo.com` subdomain already pointed to an external static host, proving the subdomain pattern is viable in this setup
- Configured GitHub Pages custom domain in the repository browser settings:
  - `Settings -> Pages -> Custom domain -> play.hakurokudo.com`
- Added the required WordPress DNS record in the user's authenticated domain console:
  - `CNAME`
  - host: `play`
  - target: `ryuutora1986.github.io`
- Immediate validation after the DNS write:
  - `Resolve-DnsName play.hakurokudo.com -Type CNAME` returned `ryuutora1986.github.io`
  - `http://play.hakurokudo.com/` already served the live `Spin Clash` build
  - GitHub Pages still reported:
    - `DNS Check in Progress`
    - HTTPS unavailable for now
  - `https://play.hakurokudo.com/` currently returns the expected temporary certificate mismatch warning while GitHub Pages certificate issuance is pending
- Practical meaning:
  - company-branded static hosting is no longer the blocker
  - the main remaining provider blocker is still rewarded-ad live/manual validation plus the missing production-capable Ad Manager rewarded setup
- Docs updated locally for the new host shape:
  - `docs/github-pages-deploy.md`
  - `docs/launch-blockers.md`
  - `docs/provider-phase-report-2026-04-18-partial.md`

2026-04-19 game-host AdSense verification asset prep
- Continued the main provider path on the new company-branded game host instead of waiting on the WordPress root site.
- Added the basic static host verification materials directly to the game repository:
  - `index.html` now includes:
    - `<meta name="google-adsense-account" content="ca-pub-4799303992679484">`
  - new root file:
    - `ads.txt`
    - content: `google.com, pub-4799303992679484, DIRECT, f08c47fec0942fa0`
- Updated the static release pipeline so these materials are treated as real release assets:
  - `scripts/build-static-release.js` now packages `ads.txt`
  - `scripts/check-static-package.js` now asserts `dist-static/ads.txt`
  - `scripts/check-repo.js` now asserts repo-root `ads.txt`
- Practical meaning:
  - once the updated Pages deploy is published, `play.hakurokudo.com` will have the minimum static ownership materials needed for AdSense site review on the game host itself
  - remaining blockers after this prep are still:
    - GitHub Pages HTTPS issuance for the custom domain
    - real Ad Manager rewarded setup and live rewarded validation

2026-04-19 rewarded integration prep closure
- Executed the approved rewarded-prep slice instead of staying in design-only state.
- Locked live rewarded placement scope in committed provider config:
  - `double_reward`
  - `continue_once`
  - `trial_unlock_arena`
- `src/reward-service.js` now treats non-allowlisted live placements as a first-class safe failure:
  - `placement_not_enabled`
- reward adapter info now exposes the operator-facing prep fields needed for later live validation:
  - `rewardEnabled`
  - `allowedPlacements`
  - `rewardedAdUnitConfigured`
  - existing readiness / request-state fields remain intact
- `src/debug-runtime-tools.js` now surfaces those reward prep fields in the debug/runtime panel, so mock-vs-live and config completeness can be read without opening source files.
- Added regression coverage for:
  - config default live placement allowlist
  - `placement_not_enabled` classification
  - non-allowlisted live placement rejection path
  - reward prep debug snapshot visibility
- Added one direct operator doc:
  - `docs/rewarded-integration-prep-checklist.md`
- Synced reward/provider/deploy/blocker docs to the current prep state:
  - `docs/provider-integration-notes.md`
  - `docs/reward-live-adapter-status.md`
  - `docs/github-pages-deploy.md`
  - `docs/launch-blockers.md`
- Fresh verification after the prep slice:
  - `npm run check:providers`
  - `npm run preflight`
  - both passed
- Current meaning:
  - rewarded prep is no longer the blocker
  - the next real blocker remains external live/manual rewarded validation on the deployed host/account/browser path

2026-04-19 Ad Manager access check and rewarded ad unit prep follow-up
- Continued from `docs/session-handoff-2026-04-19.md` using the attached Chrome CDP session instead of reopening local code work.
- Confirmed the current browser session exposes three Google accounts in the Ad Manager chooser:
  - `liuyinzg@gmail.com`
  - `hakurokudo2024@gmail.com`
  - `ryuushinyu0305@gmail.com`
- Narrowed the current Ad Manager access state:
  - `hakurokudo2024@gmail.com` lands on the public Ad Manager marketing page, not a usable workspace
  - `ryuushinyu0305@gmail.com` is blocked by a supervised/age-restricted service gate
  - `liuyinzg@gmail.com` did not produce a confirmed usable Ad Manager workspace in the checked session either
- Practical conclusion:
  - no currently signed-in account has confirmed usable Ad Manager network access yet
  - the remaining rewarded blocker is account/workspace access plus creation of one real rewarded ad unit, not further local prep code
- Cross-checked the current external setup requirement against official Ad Manager help:
  - rewarded web setup still goes through `Inventory -> Ad units -> New ad unit`
  - the repo still only needs the final full rewarded ad unit path in:
    - `SPIN_CLASH_REWARDED_AD_UNIT_PATH`
- Added a dedicated operator note:
  - `docs/admanager-access-check-2026-04-19.md`
- Continued the same session to probe the actual signup path instead of stopping at the public marketing page:
  - `authuser=1` signup start returned:
    - `errorReason=showLeadGenerationForm`
    - visible requirement: this account needs an AdSense account first
  - `authuser=0` signup start returned:
    - `errorReason=uncheckedAdsenseAccount`
    - visible requirement: Google is still reviewing the AdSense application; Ad Manager should be retried after the approval email
- Practical conclusion tightened further:
  - the strongest current path is to wait for the `authuser=0` AdSense review result, then retry Ad Manager signup/login there first
  - if the business must use `hakurokudo2024@gmail.com` as the long-term owner, that exact Google account will still need its own valid AdSense-linked signup path

2026-04-19 rewarded live cutover runbook
- Continued the mainline without reopening runtime code, since the live blocker is still external.
- Added a concrete post-approval operator runbook:
  - `docs/rewarded-live-cutover-runbook.md`
- The new runbook closes the biggest remaining process gap:
  - exact sequence after AdSense / Ad Manager access unblocks
  - ad unit creation path
  - GitHub Actions variable update path
  - live deployment expectations
  - manual rewarded validation flow on `play.hakurokudo.com`
  - go / no-go criteria
- Synced document navigation and blocker references:
  - `docs/docs-index.md`
  - `docs/launch-blockers.md`

2026-04-19 AdSense site-status follow-up
- Recorded the latest user-provided AdSense site status for:
  - `hakurokudo.com`
- Current state observed by the user:
  - status:
    - `正在准备`
  - authorization:
    - `已授权`
  - observed at:
    - `2026-04-19 02:47 JST`
- Practical meaning:
  - site-side authorization appears to be complete
  - Google-side preparation/review is still not finished
  - the rewarded mainline remains blocked on external account/platform readiness, not on additional repository code prep

2026-04-20 external platform status recheck
- Rechecked the live external blocker status through the attached logged-in browser session instead of inferring from yesterday's notes.
- AdSense site detail for `hakurokudo.com` still shows:
  - `正在准备`
  - `验证网站所有权`
  - `已请求审核`
- Ad Manager signup recheck on the strongest candidate path still returns:
  - `errorReason=uncheckedAdsenseAccount`
  - visible message still says Google is reviewing the AdSense application
- Practical meaning:
  - no material external platform progress is visible yet
  - the rewarded mainline is still blocked on Google-side review state, not on local repository work

2026-04-20 external platform status recheck follow-up
- Added the exact browser-read strings so the blocker note no longer depends only on paraphrase.
- AdSense site detail currently reads:
  - `正在准备`
  - `验证网站所有权`
  - `已请求审核`
- Ad Manager direct `/home` still does not expose any usable workspace:
  - `authuser=0` -> public marketing page
  - `authuser=1` -> public marketing page
  - `authuser=2` -> public marketing page
- Ad Manager signup paths still return the same blockers:
  - `authuser=0` -> `errorReason=uncheckedAdsenseAccount`
  - `authuser=1` -> `errorReason=showLeadGenerationForm`
  - `authuser=2` -> `service-restricted`
- Practical meaning remains unchanged:
  - rewarded live closeout is still blocked on Google-side account/review state
  - there is still no justification to reopen runtime code changes before platform status changes

2026-04-20 AdinPlay priority-switch preparation
- Chosen first-priority non-Google path is now:
  - `AdinPlay`
- Confirmed the current AdinPlay publisher contact form fields through the live embedded form on:
  - `https://adinplay.com/contact/for-publishers`
- Confirmed required fields:
  - first name
  - last name
  - email
  - phone number
  - website URL
  - monthly pageviews
  - site content category
  - submission reason
- Confirmed recommended interest targets available in the form:
  - `Rewarded Ads`
  - `Video Ads`
  - `Interstitial Ads`
  - `Display Ads`
- Added a project-specific operator note:
  - `docs/adinplay-priority-switch-plan-2026-04-20.md`
- Locked execution direction in that note:
  - apply to AdinPlay now
  - do not reopen runtime code until AdinPlay confirms a real supported web integration path
  - preserve the current `rewardService` adapter boundary so future return to Google remains a provider toggle instead of a gameplay rewrite

2026-04-20 non-Google application execution follow-up
- Submitted the real AdinPlay publisher application with the current live project values:
  - contact:
    - `Ryuu Tora`
    - `liuyinzg@gmail.com`
    - `+81 08037006508`
  - website:
    - `https://play.hakurokudo.com/`
  - monthly pageviews estimate:
    - `1000`
  - content:
    - `H5 / HTML5`
  - requested interests:
    - `Rewarded Ads`
    - `Video Ads`
    - `Interstitial Ads`
    - `Display Ads`
- Verified AdinPlay submission success through the live confirmation page:
  - `https://adinplay.com/thank-you`
- Submitted the real Nitro publisher application as the second-priority non-Google path:
  - company:
    - `Hakurokudo`
  - website:
    - `https://play.hakurokudo.com/`
  - country:
    - `JP`
  - traffic bucket:
    - `Below 50K`
- Verified Nitro submission success through the live confirmation page:
  - `https://nitropay.com/success`
- Continued the real Playwire application and confirmed the concrete blocker on the live onboarding form:
  - step 1 contact fields can be filled normally
  - website info step requires all of:
    - `Website URL`
    - `Monthly Pageviews`
    - `Upload screenshot proof of pageviews`
  - the file upload is currently hard-required by the form
- After the user chose to proceed with currently available proof, captured the logged-in WordPress / Jetpack stats page for:
  - `hakurokudo.com`
- Used that real stats screenshot as the uploaded traffic-proof attachment in the Playwire onboarding form.
- Completed the Playwire submission with:
  - website:
    - `https://play.hakurokudo.com/`
  - monthly pageviews bucket:
    - `Less than 500,000`
  - traffic source:
    - `Asia`
- Verified Playwire submission success through the live completion page:
  - `https://ramp.playwire.com/onboarding/completed.5190`
- Practical meaning:
  - `AdinPlay`, `Nitro`, and `Playwire` are now all pending external review
  - the Playwire proof used the currently available WordPress / Jetpack site stats, not a dedicated `play.hakurokudo.com` analytics dashboard
  - there is still no reason to reopen runtime code before any approved platform provides a real integration path

2026-04-20 arena expansion sandbox merged back to main workspace
- Merged the finished arena-content sandbox changes back into the main workspace.
- Added three new playable arenas:
  - `cyclone_bowl`
  - `rose_bowl`
  - `octa_bowl`
- The arena expansion now reads more of its runtime behavior from config-driven arena profiles, including:
  - shape / geometry
  - physics
  - renderer-facing parameters
- Added the new validation entry:
  - `npm run check:arenas`
- Main-workspace verification after merge:
  - `npm run preflight` -> passed
- Practical meaning:
  - arena content can continue to expand without reopening the ad-provider integration boundary
  - rewarded / provider runtime files still remain untouched by this content-line merge

2026-04-20 content and balance sandbox merged back to main workspace
- Merged the finished content/balance sandbox changes back into the main workspace.
- Challenge Road back-half remix:
  - added new enemy presets:
    - `armor_bastion`
    - `trick_duelist`
    - `impact_reaper`
  - remixed nodes `7-9`
  - kept node `10` on the established `impact_blitz + overclock` final pairing
- Progression-facing tuning updates:
  - `challengeLossBase` raised from `10` to `12`
  - `GUARD FRAME` is now the cheapest full research line
  - `Rank II` / `Rank III` enemy scalars were increased slightly while reward multipliers stayed fixed
- Localization/content updates:
  - added localized names for the new enemy presets
  - updated CN/JP node `7-9` descriptions
  - updated CN/JP Road Rank descriptions
- Added the dedicated note:
  - `docs/balance-pass-2026-04-20.md`
- Main-workspace verification after merge:
  - `npm run preflight` -> passed
- Review note kept on record:
  - this balance pass is still hypothesis-driven and was not based on a fresh manual playtest
  - the highest-risk content change remains `node-8` on `suddenDeath + trick_duelist`

2026-04-20 top expansion sandbox merged back to main workspace
- Merged the finished top-expansion sandbox changes back into the main workspace.
- Expanded the playable top roster from `5` to `15` entries by adding:
  - `impact_breaker`
  - `trick_raider`
  - `impact_vanguard`
  - `impact_nova`
  - `impact_tremor`
  - `armor_bastion`
  - `armor_aegis`
  - `armor_mammoth`
  - `armor_mirror`
  - `trick_venom`
  - `trick_orbit`
  - `trick_glitch`
- Merged the new unlock split without reopening the ad/runtime boundary:
  - starters:
    - `impact`
    - `armor`
  - rank rewards:
    - `RANK I -> trick`
    - `RANK II -> armor_bastion`
    - `RANK III -> impact_nova`
  - shop unlocks remain priced content entries
- Mainline merge notes:
  - loadout top cards are now generated from config rather than a fixed shell count
  - `unlockCost: 0` no longer implies default unlock on its own
  - `unlockSource: 'road'` tops are blocked from direct purchase
  - rank-final clears now grant `roadRanks[n].rewardTopId`
- Merge-repair work completed in main:
  - restored arena-expansion localized strings that had been overwritten by the older top sandbox baseline
  - restored content/balance localized strings for:
    - `roadRanks`
    - `enemyPresets`
    - Challenge Road `node-7` to `node-9`
  - re-added arena root-state assertions inside `scripts/check-loadout-flow.js`
- Main-workspace verification after merge:
  - `npm run preflight` -> passed
- Practical meaning:
  - the content roster is now materially larger while reward/provider files still remain untouched
  - the remaining risk is balance quality, not merge correctness

2026-04-20 post-merge content execution docs staged
- Wrote the continuing content-only execution baseline for the next mainline phase:
  - `docs/content-post-merge-execution-plan-2026-04-20.md`
- Locked the immediate next work as `Phase 1A` instead of jumping straight into UI polishing:
  - validate the merged `15-top` unlock structure first
  - only after that, move into unlock-source UI clarity
- Added the dedicated validation pack:
  - `docs/top-balance-validation-plan-2026-04-20.md`
- Added the narrow UI-design note for the later clarity pass:
  - `docs/unlock-source-ui-design-2026-04-20.md`
- Updated discovery surfaces:
  - `docs/docs-index.md`
  - `README.md`
- Practical meaning:
  - content work can keep advancing in a disciplined sequence while ad-platform approval is still externally blocked
  - the user does not need to be pulled back in yet; the planned human playtest gate remains at the end of Phases 1 and 2

2026-04-20 Phase 1A static validation report completed
- Completed the first actual validation pass for the merged `15-top` roster and unlock split:
  - `docs/top-balance-validation-report-2026-04-20-phase-1a.md`
- Validation basis:
  - inspected live config for:
    - tops
    - Road ranks
    - Challenge Road rewards
    - economy
    - enemy presets
  - ran:
    - `npm run check:config`
    - `npm run check:roster`
    - `npm run check:roadrank`
    - `npm run check:nextphase`
- Main conclusions:
  - the merged structure is technically coherent
  - the biggest issue is pacing, not merge correctness
  - early shop diversity is still too narrow
  - the first trick-family access is structurally too late
  - `armor_bastion` may compress the mid-tier armor shop branch
- Documentation repair:
  - corrected the stale `armor_mammoth` price drift in the validation plan from `520` to the live config value `540`
- Practical meaning:
  - the next justified move is a narrow Phase 1B config pass
  - this still does not require user playtest yet

2026-04-20 Phase 1B narrow trick-access correction applied
- Applied the smallest config-only correction justified by the Phase 1A report:
  - `src/config-tops.js`
  - `trick_venom` price:
    - `220 -> 180`
- Reason:
  - the first purchasable trick-family path was structurally arriving too late
  - this correction makes one non-reward trick option reachable much earlier without rewriting the whole shop ladder
- Wrote the dedicated note:
  - `docs/balance-pass-2026-04-20-phase-1b.md`
- Updated discovery surfaces:
  - `docs/docs-index.md`
  - `README.md`
- Practical meaning:
  - early style diversity is slightly widened while the rest of the merged unlock structure stays stable
  - the next intended step is the unlock-source UI clarity pass, not another broad price rewrite

2026-04-20 unlock-source UI clarity pass applied
- Implemented the first narrow unlock-source UI pass without reopening shell architecture or provider/runtime boundaries.
- Updated loadout / home / Road-rank text surfaces so players can distinguish:
  - starter tops
  - Road reward tops
  - Workshop tops
- Main runtime changes:
  - `src/loadout-ui-tools.js`
  - `src/config-text.js`
- New behavior:
  - loadout card type line now includes source class
  - locked top hint text now uses exact rank or Workshop-cost messaging where derivable
  - home preview kicker now reflects source class
  - Road rank note now names the reward top directly
- Wrote the implementation note:
  - `docs/unlock-source-ui-pass-2026-04-20.md`
- Updated discovery surfaces:
  - `docs/docs-index.md`
  - `README.md`
- Practical meaning:
  - the roster’s progression language is now closer to the actual unlock logic
  - the remaining meaningful validation step is a later focused human experience pass, not more blind UI expansion

2026-04-20 focused human playtest packet prepared
- Wrote the final user-facing experience gate for this content line:
  - `docs/focused-human-playtest-2026-04-20.md`
- Scope of that playtest packet:
  - early roster narrowness
  - lock-source readability
  - rank reward meaning
  - direct top feel / price intuition
- Updated discovery surfaces:
  - `docs/docs-index.md`
  - `README.md`
- Practical meaning:
  - this content-line prep now has a clean final handoff point
  - when it is time to involve the user, the playtest ask can be focused and short instead of ad hoc

2026-04-20 home/settings/path information cleanup shipped
- Reworked shell information density to remove internal/dev-feeling copy without reopening gameplay or ad-provider boundaries.
- Main runtime changes:
  - `index.html`
  - `css/game.css`
  - `src/loadout-ui-tools.js`
  - `src/config-text.js`
  - `package.json`
- Main UX outcomes:
  - home now collapses the old dual status cards into one formal line near the primary CTA:
    - `冠军之路 · RANK名 · 节点名`
  - title-page language switching is no longer surfaced in the center stack
  - settings now owns language selection and exposes only formal labels for:
    - language
    - music
    - SFX
  - championship-path copy was rewritten toward:
    - arena
    - enemy
    - rule
    - reward
    instead of design-doc style explanation text
  - loadout shell headers beside back-navigation were visually removed from the player-facing layout
- Release-facing updates:
  - bumped the visible build/version to `1.0.2`
  - added `?v=1.0.2` cache-busting query strings to the changed shell CSS / text / loadout scripts
- Verification:
  - `npm run check:syntax`
  - `npm run check:localization`
  - `npm run check:settings`
  - `npm run check:dom`
  - `npm run check:routes`
  - `npm run check:roadrank`
  - `npm run check:loadout`
  - `npm run check:shellpresentation`
- Practical meaning:
  - the home/loadout/settings/path shell now reads closer to a shipped game UI and less like a development harness
  - the next intended step is live user experience validation on the deployed site, not another speculative copy expansion pass

2026-04-20 UI/UX governance draft written for Spin Clash
- Wrote a project-specific shell-governance document by extracting and narrowing the most relevant local skill logic from:
  - `frontend-skill`
  - `animejs-front-end-skill`
  - `develop-web-game`
- New design source of truth:
  - `docs/spin-clash-ui-ux-governance-2026-04-20.md`
- What the document covers:
  - screen purpose boundaries
  - the four-question closure rule
  - preview-vs-action separation
  - copy-tone discipline
  - motion justification
  - a re-analysis of the current `Home / Championship Path / Quick Battle / Workshop / Settings` shell using that governance layer
- Updated discovery surface:
  - `docs/docs-index.md`
- Practical meaning:
  - future shell changes can now be judged against one project-specific UI/UX standard instead of mixing generic frontend advice ad hoc
  - the next correct step is user review of the governance document itself, then a narrow shell pass guided by it, not immediate generic-skill packaging

2026-04-20 shell visual productization pass shipped
- Locked the construction brief in:
  - `docs/ui-shell-visual-productization-plan-2026-04-20.md`
- Main runtime files changed:
  - `index.html`
  - `css/game.css`
  - `src/loadout-ui-tools.js`
  - `src/ui-entry-tools.js`
  - `src/main.js`
  - `src/config-text.js`
  - `package.json`
- Main shell outcomes:
  - `Championship Path` no longer presents as a roster-first page:
    - the top card wall now belongs to `Quick Battle`
    - the path page now centers current node, route strip, rank band, reward summary, and current loadout
  - `Quick Battle` now behaves more like a real pre-fight page:
    - selected top gains source / requirement / wallet / action closure
    - locked `SCRAP` tops can now route into purchase or path-earn flows without guessing
  - the insufficient-funds purchase dialog now points players back to `Championship Path` instead of dead-ending on acknowledgement copy
  - desktop shell surfaces were widened and rebalanced so:
    - home feels closer to a hero/poster entry
    - workshop/settings feel more like full pages and less like small floating panels
  - release-facing shell cache busting and visible version were moved to `1.0.3`
- Verification:
  - `npm run verify:release`
2026-04-20 real-player-window shell compression pass completed
- Context:
  - user requested a real browser-window visual review before any new hands-on experience
  - validation target was the actual attached Chrome window at roughly `1280x608` CSS px, not code-only judgement
- Main runtime files changed:
  - `scripts/local-browser-qa.js`
  - `index.html`
  - `css/game.css`
  - `src/loadout-ui-tools.js`
- Main shell outcomes:
  - screenshot capture for local browser QA now defaults to viewport-true screenshots instead of forced full-page output
  - workshop balance moved into the workshop surface, removing the need for a generic top currency bar
  - short-height desktop shell now compresses `Home / Quick Battle / Championship Path / Workshop / Settings` more aggressively
  - short-height home prioritizes route progress + CTA before the preview block
  - short-height quick prioritizes deployed-top closure before the arena preview
- Real-browser evidence:
  - captured screenshot sets from the actual attached player window:
    - `output/real-player-window-2026-04-20-pass3`
    - `output/real-player-window-2026-04-20-pass3-resized`
  - measured first-fold CTA visibility in the attached window:
    - home primary CTA visible
    - path challenge CTA visible
    - quick fight CTA visible
- Verification:
  - `npm run preflight`
- Practical meaning:
  - this shell pass is ready for real user hands-on validation
  - the next highest-value step is your focused体验，而不是继续盲改文案或布局
2026-04-20 home-and-quick-shell refinement pass completed
- Context:
  - after switching to user-supplied real screenshots as the trustworthy visual basis, the highest-priority remaining shell issues were narrowed to `Home` and `Quick Battle`
  - goal was not another global polish pass, but a tighter two-page productization step aligned with `docs/spin-clash-ui-ux-governance-2026-04-20.md`
- Main runtime files changed:
  - `index.html`
  - `css/game.css`
  - `src/loadout-ui-tools.js`
  - `src/config-text.js`
  - `scripts/check-shell-presentation.js`
- Main shell outcomes:
  - `Home` now binds route progress, CTA cluster, and showcase into one explicit hero composition via `home-hero-panel` / `home-command-panel`
  - desktop `Home` no longer treats the showcase as a detached block below the buttons
  - `Quick Battle` now introduces a dedicated `quick-ready-band` so the selected top and launch CTA read as one pre-fight decision surface
  - the selected-top state badge is back, but now used intentionally as a concise acquisition/state marker instead of empty chrome
  - quick-battle copy was shortened so the page reads more like a battle-prep surface and less like a module explainer
- Verification:
  - `npm run check:shellpresentation`
  - `npm run check:dom`
  - `npm run check:localization`
  - `npm run check:loadout`
  - `npm run preflight`
  - `npm run verify:release`
- Practical meaning:
  - the next review should focus on whether the new `Home` hero now feels like one composition and whether `Quick Battle` still feels too long in your real browser
  - if another shell pass is needed, it should remain constrained to those two pages unless your real screenshots show a new high-severity issue elsewhere
2026-04-20 visual-validation protocol documented
- Context:
  - user explicitly called out that another Codex session could capture correct full-browser screenshots without manual approval prompts, while this session's direct attached-Chrome captures were cropped / misaligned
  - conclusion was locked: the issue was the screenshot chain, not the game's UI itself
- Main docs changed:
  - `docs/spin-clash-ui-ux-governance-2026-04-20.md`
  - `docs/visual-validation-protocol-2026-04-20.md`
  - `docs/docs-index.md`
  - `README.md`
- Main protocol outcome:
  - direct CDP attachment to a live user Chrome session is no longer trusted by default for final design review
  - real visible-window screenshots are now the highest-trust evidence for shell judgement in this project
  - automated screenshots may still be used for structural debugging, but not for final aesthetic/layout approval unless the chain is revalidated
- Verification:
  - `npm run check:docs`
- Practical meaning:
  - future UI review sessions should stop earlier when screenshot evidence is questionable instead of continuing to reason from invalid captures

2026-04-21 proxy-chain visual flow replay validation completed
- Context:
  - user requested a video-style full-scene visual validation covering shell pages, live battle HUD, and result surfaces
  - final visual evidence was required to use the trusted Codex browser proxy chain rather than direct attached-Chrome CDP screenshots
- Main runtime files changed:
  - `scripts/proxy-visual-flow-capture.js`
- Main validation outcomes:
  - added a proxy-driven capture script that:
    - starts the local static server
    - revalidates the proxy capture chain with visible corner/center diagnostics
    - captures `Home / Championship Path / Workshop / Settings / Quick Battle`
    - enters a real Challenge Road fight
    - captures battle HUD, round-result overlay, and match-result overlay
    - emits a replayable HTML timeline plus a markdown report
  - latest artifact set:
    - `output/proxy-visual-flow-video-2026-04-20T15-10-59/`
    - `replay.html`
    - `report.md`
- Verification:
  - `node --check scripts/proxy-visual-flow-capture.js`
  - proxy-chain capture run completed successfully with 13 frames
- Practical meaning:
  - future visual review can reuse the same proxy-driven replay workflow instead of ad-hoc screenshots
  - the current build now has trustworthy captured evidence for shell pages, battle HUD, and settlement UI

2026-04-21 shell polish pass 2 completed after proxy replay
- Context:
  - proxy replay evidence confirmed three remaining presentation issues:
    - `Home` still placed the top showcase below the command surface
    - `Quick Battle` still read as a tall stacked page with a roster wall
    - result screens still lacked strong dedicated panel surfaces and leaked residual overlay text
- Main runtime files changed:
  - `index.html`
  - `css/game.css`
  - `src/round-flow-tools.js`
  - `src/match-flow-tools.js`
- Main shell outcomes:
  - `Home` now restores the requested model-first composition: title -> showcase -> progress/CTA command panel
  - `Quick Battle` now compresses the pre-fight shell into a two-column desktop composition and turns the roster into a horizontal selection belt instead of a multi-row wall
  - `Round Result` and `Match Result` now render inside dedicated centered result shells with clearer hierarchy and action grouping
  - result-state cleanup now forcibly clears transient combat callouts and prevents prior overlay ghosts from leaking into `Match Result`
- Trusted visual evidence:
  - refreshed proxy replay artifact set:
    - `output/proxy-visual-flow-video-2026-04-20T15-31-51/`
    - `replay.html`
    - `report.md`
- Verification:
  - `npm run check:shellpresentation`
  - `npm run check:dom`
  - `npm run check:localization`
  - `npm run check:loadout`
  - `npm run check:roundflow`
  - `npm run check:matchflow`
  - `npm run preflight`
  - proxy-chain replay capture completed successfully
- Practical meaning:
  - the next human review should focus on taste and remaining polish rather than layout correctness
  - `Home / Quick Battle / Result` now have a reliable visual baseline backed by trusted proxy-chain evidence

2026-04-21 battle skill cluster redesign completed
- Context:
  - user requested a fresh pass on the three in-battle skill buttons using the established UI/UX governance rules, with focus on recognizability, comprehension, tapability, and not obscuring the arena
- Main runtime files changed:
  - `index.html`
  - `css/game.css`
  - `src/ui-shell-tools.js`
  - `src/round-flow-tools.js`
  - `src/match-flow-tools.js`
  - `scripts/check-shell-presentation.js`
- Main HUD outcomes:
  - the skill controls are no longer a narrow vertical tool strip beside the player panel
  - desktop battle HUD now uses a bottom-center horizontal skill cluster that sits in the lower safe band instead of eating into the left arena edge
  - each skill button now exposes a direct state line (`READY / CD / BURST / ACTIVE`) so players do not need to infer readiness from color alone
  - the cluster uses larger rectangular tap targets with a stronger icon / label / secondary state hierarchy
  - mobile and low-height landscape breakpoints were updated so the cluster remains horizontal and thumb-reachable without covering core arena space
  - transient battle callouts are explicitly cleared before settlement overlays so the combat HUD does not ghost through result screens
- Trusted visual evidence:
  - refreshed proxy replay artifact set:
    - `output/proxy-visual-flow-video-2026-04-20T15-49-01/`
    - `replay.html`
    - `report.md`
- Verification:
  - `npm run check:shellpresentation`
  - `npm run check:dom`
  - `npm run check:ui`
  - `npm run preflight`
  - proxy-chain replay capture completed successfully
- Practical meaning:
  - battle input now reads as a player-facing control surface rather than a debug-adjacent utility stack
  - the next human review should focus on final taste and wording rather than button discoverability or gross layout conflict

2026-04-21 mobile proxy-chain visual replay validation added
- Context:
  - user explicitly called out that desktop-only video validation was insufficient because `spin-clash` is expected to be primarily played on phones
  - the repo needed a first-class mobile replay flow using the trusted Codex browser proxy chain, not ad-hoc screenshots
- Main tooling/files changed:
  - `scripts/check-proxy-visual-flow-capture.js`
  - `scripts/proxy-visual-flow-capture.js`
  - `package.json`
  - `docs/visual-validation-protocol-2026-04-20.md`
  - global proxy runtime: `C:\Users\29940\.codex-proxy\skills\web-access\scripts\cdp-proxy.mjs`
- Main validation outcomes:
  - proxy chain now supports explicit viewport/device emulation through a `/viewport` endpoint backed by `Emulation.setDeviceMetricsOverride`
  - `proxy-visual-flow-capture.js` now supports `--profile desktop|mobile` plus `--dry-run` contract verification
  - mobile profile contract is locked to `390x844`, `dpr=3`, `mobile=true`, `touch=true`
  - trusted mobile replay artifact set:
    - `output/proxy-visual-flow-video-mobile-2026-04-20T16-12-22/`
    - `replay.html`
    - `report.md`
- Mobile review findings:
  - `Home` is readable and coherent on phone, with model-first composition preserved
  - `Quick Battle` is understandable on phone, but the roster strip still reads as a cramped bottom layer and should be reviewed again before final polish
  - battle HUD skill cluster remains thumb-reachable and does not dominate the arena on phone
  - `Match Result` is clearly visible on phone
  - the frame captured during `roundResult` state still visually looks like battle HUD rather than a distinct round-settlement panel, which means mobile round-settlement presentation remains a real open issue even though match settlement is present
- Verification:
  - `node scripts/check-proxy-visual-flow-capture.js`
  - `node --check scripts/proxy-visual-flow-capture.js`
  - `node --check C:\Users\29940\.codex-proxy\skills\web-access\scripts\cdp-proxy.mjs`
  - trusted proxy-chain mobile replay run completed successfully
- Practical meaning:
 - future important UI work in this repo now requires both desktop and mobile trusted replay coverage before asking the user for visual acceptance
 - the next UI pass should prioritize mobile `roundResult` visibility and then revisit `Quick Battle` bottom-strip density on phone

2026-04-21 mobile battle HUD scheme-B refactor landed
- Context:
  - user explicitly chose `方案 B`: move battle status to the top and keep only the skill controls in the bottom thumb zone
  - the concrete issue was that the three mobile skill buttons were colliding with the left/right HUD panels, making the combat HUD feel crowded and visually unstable
  - this pass followed the `D:\Game-UI-Polish` principle set: separate information layers by task importance, keep touch targets in the thumb zone, and avoid stealing arena visibility for secondary metadata
- Main files changed:
  - `css/game.css`
  - `scripts/check-shell-presentation.js`
- Main UI changes:
  - mobile portrait battle HUD now uses top-corner compact status rails for player and enemy instead of bottom-corner panels
  - the bottom action lane is now reserved for the three skill buttons, with reduced width and tighter icon/text packing instead of competing with status panels
  - the mobile `swap` control is relocated out of the top-right corner so it does not collide with the enemy status rail
  - battle hint placement is retuned to sit above the skill lane rather than drifting into the same bottom interaction band
- Verification:
  - `npm run check:shellpresentation`
  - `npm run check:ui`
  - `npm run preflight`
  - trusted proxy-chain mobile replay run:
    - `output/proxy-visual-flow-video-mobile-2026-04-20T16-43-33/`
- Proxy replay visual conclusion:
  - battle frames now show a clean three-layer structure on phone: top status rails, central arena, bottom skill controls
  - the skill cluster no longer visibly collides with the left/right status presentation on phone
 - round-result presentation is still a separate open issue, but the specific bottom-HUD collision problem is materially improved
- Practical meaning:
  - mobile combat HUD is now aligned with the project’s “information on top, action on bottom” rule instead of trying to reuse the desktop bottom-layer layout

2026-04-21 handoff package prepared for next Codex thread
- Context:
  - user asked to sync the latest local state to GitHub and explicitly wanted a reliable handoff for starting a fresh conversation
- Main files changed:
  - `docs/session-handoff-2026-04-21.md`
  - `docs/docs-index.md`
  - `README.md`
- Main outcome:
  - the repo now includes an explicit handoff document that freezes:
    - current branch strategy
    - today’s UI/UX and mobile HUD work
    - trusted replay evidence paths
    - current open issues
    - recommended next-step order
    - next-conversation re-entry checklist
- Verification:
  - `npm run check:docs`
  - `npm run verify:release`
- Practical meaning:
  - the next conversation no longer needs to reconstruct today’s state from chat history alone
  - re-entry can start from `progress.md` plus `docs/session-handoff-2026-04-21.md`

2026-04-21 mobile round-result takeover pass completed
- Context:
  - mobile round settlement still read too much like battle HUD
- Main runtime files changed:
  - `scripts/check-shell-presentation.js`
  - `src/round-flow-tools.js`
  - `css/game.css`
- Main UI outcomes:
  - mobile portrait `roundResult` now activates a dedicated takeover state
  - top rails, skill cluster, swap, and hint/message surfaces are hidden during settlement
  - the round-result card now reads as the dominant settlement panel
- Verification:
  - `npm run check:shellpresentation`
  - `npm run check:dom`
  - `npm run check:ui`
  - `npm run preflight`
  - `node scripts/proxy-visual-flow-capture.js --profile mobile`
- Trusted visual evidence:
  - `output/proxy-visual-flow-video-mobile-2026-04-20T17-43-25/`
- Visual conclusion:
  - trusted mobile replay now shows the round-result card as the first visual anchor, with the top status rails, bottom skill buttons, swap, and hint/message surfaces cleared out of `roundResult`; the arena remains only as weak background context, and `12-match-result.png` still reads as a correct full-screen match-settlement screen.

2026-04-21 adsense h5 rewarded fallback and monetization model pass completed
- Context:
  - user decided not to block Google monetization on Ad Manager approval alone
  - the repo needed a primary `AdSense H5 rewarded-only` route while preserving the existing three player-facing rewarded moments and keeping the GPT / Ad Manager path as a fallback
  - the repo also needed a math-based baseline for trigger frequency and early revenue estimation before live traffic data exists
- Main runtime files changed:
  - `src/config-providers.js`
  - `src/provider-runtime-tools.js`
  - `src/reward-service.js`
  - `src/match-flow-tools.js`
  - `src/loadout-ui-tools.js`
  - `scripts/build-static-release.js`
  - `scripts/check-config.js`
  - `scripts/check-provider-services.js`
  - `scripts/check-debug-runtime-snapshots.js`
  - `docs/analytics-events.md`
  - `docs/monetization/2026-04-21-adsense-h5-rewarded-baseline-model.md`
- Main implementation outcomes:
  - the repo now supports `mock`, `adsense_h5_rewarded`, and `adsense_rewarded` reward adapters without changing gameplay call sites
  - `adsense_h5_rewarded` now boots through shared provider runtime helpers, preserves rewarded-only semantics, and normalizes H5 completion / dismiss / unavailable states into the existing reward-service contract
  - the GPT / Ad Manager rewarded path remains available as a fallback
  - reward analytics now distinguish reward CTA visibility from explicit request start, and each request now carries `reward_attempt_id`
  - result-bound reward flows now carry `result_context_id`, and the arena-trial flow now carries `trial_unlock_context_id`
  - Quick Battle arena-trial analytics now include denominator events for locked-arena click and affordability shortfall
  - the repo now includes an operator-facing dual-baseline monetization model for real-current measurement and planning scenarios
- Verification:
  - `npm run check:providers`
  - `npm run check:config`
  - `npm run check:debugruntime`
  - `npm run check:analytics`
  - `npm run check:matchflow`
  - `npm run check:loadout`
  - `npm run preflight`
  - `npm run verify:release`
- Practical meaning:
  - the codebase is now implementation-ready for `AdSense H5 rewarded-only` without adding any forced ad format or changing the existing player-facing reward timing
  - live monetization is still externally gated by approved AdSense account status plus H5 game ads access approval
  - no Google account/backend automation was performed in this slice

2026-04-21 adsense h5 live config naming and paid acquisition baseline pass completed
- Context:
  - after the H5 rewarded fallback landed, the next gap was operator clarity rather than gameplay logic
  - the repo needed a cleaner canonical naming scheme for live reward deployment variables, an explicit H5 test/prod cutover path, and a paid-acquisition baseline that could judge whether rewarded-ad economics justify spend
- Main files changed:
  - `src/config-providers.js`
  - `src/provider-runtime-tools.js`
  - `src/reward-service.js`
  - `scripts/build-static-release.js`
  - `scripts/check-provider-services.js`
  - `docs/github-pages-deploy.md`
  - `docs/rewarded-live-cutover-runbook.md`
  - `docs/release-checklist.md`
  - `docs/reward-live-adapter-status.md`
  - `docs/monetization/2026-04-21-adsense-h5-rewarded-baseline-model.md`
- Main operator outcomes:
  - release-time reward variable naming now has a canonical scheme:
    - `SPIN_CLASH_ADSENSE_ENABLED`
    - `SPIN_CLASH_ADSENSE_GPT_*`
    - `SPIN_CLASH_ADSENSE_H5_*`
  - older GPT-era env names are still accepted as compatibility aliases, so existing deploy muscle memory does not break
  - AdSense H5 now supports an explicit test-mode switch through `SPIN_CLASH_ADSENSE_H5_TEST_MODE`, which maps to the AdSense H5 script tag instead of relying on undocumented manual edits
  - deploy docs now separate:
    - H5 rewarded test pass
    - H5 rewarded production pass
    - GPT / Ad Manager fallback pass
  - the monetization model now includes `Baseline C: Paid Acquisition Model`, so acquisition can be judged against rewarded-ad LTV, ROAS, CPI ceiling, and payback speed instead of internal funnel health alone
- Verification:
  - `npm run check:providers`
  - `npm run check:config`
  - `npm run check:docs`
  - `npm run verify:release`
- Practical meaning:
  - the repo now has a clearer operator contract for switching between H5 test, H5 production, and GPT fallback without touching committed gameplay code
  - the current planning model still suggests rewarded-ad revenue is structurally too narrow to justify serious paid acquisition scaling under the baseline assumptions; CPI, retention, or ARPDAU would need to improve materially before that changes

2026-04-21 adsense h5 rewarded no-show root-cause pass completed
- Context:
  - live reward clicks had already left `mock`, but the Google path still failed before any real rewarded placement could settle
  - root-cause investigation on the real host and a local dist-static repro showed two integration defects rather than a pure inventory problem
- Root causes locked:
  - after `adsbygoogle.js` boots, `window.adsbygoogle` becomes a non-array object, but `provider-runtime-tools.js` was still treating `Array.isArray(window.adsbygoogle)` as the H5 API readiness test, so the provider self-classified as `provider_unavailable` even after the Google tag loaded successfully
  - the static release package was not emitting the AdSense H5 tag and queue bootstrap into `<head>`, which left the H5 path on a lazy first-click injection flow instead of the official head-first integration shape
- Main files changed:
  - `src/provider-runtime-tools.js`
  - `scripts/build-static-release.js`
  - `scripts/check-provider-services.js`
  - `scripts/check-static-package.js`
- Main fixes:
  - H5 API detection now accepts the real post-bootstrap `adsbygoogle` object shape instead of requiring an array forever
  - the H5 release build now injects the AdSense tag, queue bootstrap, and initial `adConfig({ preloadAdBreaks, sound })` call into packaged `index.html` head output when the H5 adapter is selected for release
  - the H5 release path now records a bootstrap marker so runtime init does not re-send duplicate `adConfig()` preload settings
  - the runtime no longer writes custom `data-spin-clash-provider-key` attributes onto the AdSense H5 script tag, avoiding the unsupported-attribute warning on the Google tag
- Verification:
  - `node scripts/check-provider-services.js`
  - `npm run build:static` with H5 release env
  - `node scripts/check-static-package.js` with H5 release env
  - local `dist-static` browser probe with Playwright confirmed the failure mode moved from `provider_unavailable` to `provider_loading`, meaning the provider no longer self-breaks during bootstrap and is now at the real Google availability/preload stage
- Practical meaning:
  - the repo is no longer blocked by its own broken H5 bootstrap detection
  - any remaining no-show behavior after deploy should now be interpreted as true Google-side readiness / preload / eligibility behavior, not the previous self-inflicted runtime false negative

2026-04-21 adsense h5 ready-state and preload escalation completed
- Context:
  - after the bootstrap self-failure was removed, live clicks no longer ended at `provider_unavailable`, but still stalled at `provider_loading`
  - controlled browser probes were then used to separate `auto` preload behavior from `on` preload behavior under the real Ad Placement API
- Main findings:
  - with `preloadAdBreaks=auto`, the Google H5 bootstrap never exposed a durable ready signal in browser probes, and rewarded clicks stayed stuck on `provider_loading`
  - with `preloadAdBreaks=on`, the Google H5 bootstrap did surface a ready state, and real button clicks advanced into `slot_visible` instead of failing before display
  - direct programmatic reward requests without a real user gesture still timed out even when `ready=true`, which is consistent with the Ad Placement API expectation that `adBreak()` be tied to an actual user action
- Main files changed:
  - `src/provider-runtime-tools.js`
  - `scripts/build-static-release.js`
  - `scripts/check-provider-services.js`
  - `scripts/check-static-package.js`
- Main fixes:
  - the packaged H5 bootstrap now registers an `onReady` callback in `<head>` and records readiness into `window.__spinClashAdsenseH5Bootstrap`
  - runtime H5 state now reads that bootstrap marker and promotes the provider to `ready` without duplicate `adConfig()` calls
  - release validation now guards the presence of the H5 ready marker in packaged output
- Verification:
  - `npm run verify:release`
  - H5 release build with `SPIN_CLASH_ADSENSE_H5_PRELOAD=on`
  - local browser probe with real button click in `dist-static`:
    - before click: `ready=true`
    - after click: `lastRequestReason='slot_visible'`
- Practical meaning:
  - the strongest remaining working hypothesis is no longer “the H5 adapter is broken”
  - the H5 path now reaches the display stage when Google reports the placement ready and the request comes from a true user gesture

2026-04-21 public-info readiness pass completed
- Context:
  - Task 4 threaded the new public-info shell state through runtime boot without changing any route behavior outside the approved scope
- Main files changed:
  - `src/main.js`
  - `progress.md`
- Main outcome:
  - added minimal `infoPage` runtime state in `main.js`
  - passed `getInfoPage` / `setInfoPage` into both `createLoadoutUiTools(...)` and `createUiEntryTools(...)`
  - kept the change limited to runtime state wiring so existing shell behavior stayed intact
- Verification:
  - `node scripts/check-ui-actions.js`
  - `node scripts/check-settings-flow.js`
  - `node scripts/check-dom-contract.js`
  - `node scripts/check-localization.js`
  - `npm run check:dom`
  - `npm run check:localization`
  - `npm run check:ui`
  - `npm run preflight`

2026-04-22 gameplay ux visual optimization implementation completed
- Context:
  - this pass executed the approved gameplay UX / visual optimization package instead of only documenting problems
  - the implementation stayed locked to the underlying design principles: clarify the player's immediate question, move guidance closer to action, strengthen causality in result states, reduce same-level CTA competition, and keep public-reading surfaces formal on both desktop and mobile
- Main files changed:
  - `index.html`
  - `css/game.css`
  - `src/ui-shell-tools.js`
  - `src/round-flow-tools.js`
  - `src/match-flow-tools.js`
  - `src/loadout-ui-tools.js`
  - `src/config-text.js`
  - `scripts/check-shell-presentation.js`
  - `scripts/check-route-return-flow.js`
- Main outcomes:
  - restructured the home shell so `Championship Path` and `Quick Battle` now read as clear first-step choices with supporting notes, while workshop/settings drop into a secondary utility lane
  - moved battle opening guidance into a two-layer model: a readable top hint for the current action and a bottom-side opening brief anchored near the combat controls
  - upgraded round-result feedback from pure win/loss reporting into a causal card with `cause + next adjustment`, so players can see both what happened and what to correct next round
  - rebuilt match-result hierarchy so the primary CTA reflects the real recommended next move, with guided copy and role-based CTA ordering instead of a flat list of equal buttons
  - strengthened path and workshop decision support by surfacing payout intent, progression guidance, next-duel impact, and affordability notes directly inside the decision surface
  - expanded the public info shell into a more formal desktop reading surface and stabilized the mobile CJK header layout so the legal/info pages no longer read like temporary popups
  - upgraded the shell presentation / route return contracts to lock the new progression-first result behavior in tests
- Verification:
  - `npm run preflight`
  - `npm run verify:release`
  - local Chromium dogfood capture using Playwright against `http://127.0.0.1:4174/index.html`
- Evidence:
  - `output/ux-visual-qa-20260422/desktop-home.png`
  - `output/ux-visual-qa-20260422/desktop-battle-intro.png`
  - `output/ux-visual-qa-20260422/desktop-round-result.png`
  - `output/ux-visual-qa-20260422/desktop-match-result.png`
  - `output/ux-visual-qa-20260422/desktop-about.png`
  - `output/ux-visual-qa-20260422/mobile-home.png`
  - `output/ux-visual-qa-20260422/mobile-round-result.png`
  - `output/ux-visual-qa-20260422/mobile-match-result.png`
  - `output/ux-visual-qa-20260422/mobile-privacy.png`
- Practical meaning:
  - the repo now carries the UX optimization as actual runtime behavior rather than as a detached design package
  - the most critical comprehension gaps identified in the earlier review are now covered by code, style, and test contracts instead of depending on later manual polish
