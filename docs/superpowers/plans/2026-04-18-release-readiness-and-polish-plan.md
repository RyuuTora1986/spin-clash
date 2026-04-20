# Spin Clash Release Readiness And Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** close the remaining release blockers and the highest-value polish gaps without destabilizing the current static game foundation.

**Architecture:** keep the existing static HTML/CSS/JS architecture, treat provider integration as a service-layer-only change, and isolate visual polish from gameplay/balance changes. Use the existing automated checks as the default regression gate and add narrow manual acceptance evidence where automation cannot fully prove UX quality.

**Tech Stack:** plain HTML, CSS, JavaScript, local static hosting, existing Node-based verification scripts, current service boundaries (`StorageService`, `RewardService`, `AnalyticsService`, `ShareService`)

---

## Current State Snapshot

- Static playable foundation: effectively complete
- Shell route architecture: complete baseline
- Combat baseline: complete first stable version
- Screenshot-driven route polish: mostly complete
- Release readiness: blocked mainly by provider integration and final acceptance closure

## Priority Rule

Execute in this order:

1. release blockers
2. manual acceptance and localization closure
3. safe UI polish micro-slices
4. combat/balance feel pass only if still needed after manual review
5. release docs and ship gate closure

## Remaining Work Summary

| Priority | Workstream | Release Blocking | Estimated Effort | Status |
| --- | --- | --- | --- | --- |
| P0 | Real reward-provider validation and integration hardening | Yes | 1-2 days | Not done |
| P0 | Remote analytics sink selection, wiring, and validation | Yes | 1-2 days | Not done |
| P0 | Provider-phase end-to-end hardening and acceptance | Yes | 1 day | Not done |
| P1 | Manual browser acceptance pass across shell, battle readability, and localization | No, but high confidence gate | 0.5-1 day | Partially done |
| P1 | Quick Battle preview final approval, likely Hex locked-readability micro-pass | No | 0.25-0.5 day | In progress |
| P1 | Tri-language overflow/readability cleanup | No | 0.25-0.5 day | Not done |
| P2 | Result/share presentation polish beyond current basic output | No | 0.5-1 day | Not done |
| P2 | Combat feel rebalance pass after fresh manual play | No | 0.5-1 day | Optional follow-up |
| P2 | Final release-doc closure and launch checklist signoff | No, but strongly recommended before release | 0.25-0.5 day | Not done |

## Task 1: Close Reward Provider Path

**Files:**
- Review: `C:\Users\29940\spin-clash\docs\provider-recommendation-2026-04-17.md`
- Review: `C:\Users\29940\spin-clash\docs\provider-phase-plan.md`
- Review: `C:\Users\29940\spin-clash\docs\reward-live-adapter-status.md`
- Modify: `C:\Users\29940\spin-clash\src\reward-service.js`
- Modify: `C:\Users\29940\spin-clash\src\config-providers.js`
- Modify: `C:\Users\29940\spin-clash\src\config-providers-runtime.js`
- Modify if needed: `C:\Users\29940\spin-clash\src\provider-runtime-tools.js`
- Test: `C:\Users\29940\spin-clash\scripts\check-provider-services.js`
- Update: `C:\Users\29940\spin-clash\docs\provider-phase-report-template.md`

- [ ] Confirm the chosen real reward-provider path and freeze the provider-specific acceptance criteria.
- [ ] Map the exact runtime boundary: provider bootstrap, success callback, deny path, timeout path, and error path.
- [ ] Implement the minimum production adapter through the existing reward-service boundary only.
- [ ] Add or tighten regression checks so provider wiring failures do not silently fall back into mock behavior.
- [ ] Run `npm run check:providers` and `npm run preflight`.
- [ ] Record the real adapter state and known limits in `docs/reward-live-adapter-status.md`.

## Task 2: Close Remote Analytics Sink

**Files:**
- Review: `C:\Users\29940\spin-clash\docs\provider-recommendation-2026-04-17.md`
- Review: `C:\Users\29940\spin-clash\docs\posthog-setup.md`
- Modify: `C:\Users\29940\spin-clash\src\analytics-service.js`
- Modify if needed: `C:\Users\29940\spin-clash\src\config-providers.js`
- Modify if needed: `C:\Users\29940\spin-clash\src\provider-runtime-tools.js`
- Test: `C:\Users\29940\spin-clash\scripts\check-analytics-events.js`
- Test: `C:\Users\29940\spin-clash\scripts\check-provider-services.js`

- [ ] Freeze the analytics sink choice and the exact event-forwarding contract.
- [ ] Keep event normalization inside `analytics-service.js`; do not spread provider-specific shape logic back into gameplay modules.
- [ ] Implement the real forwarding layer with explicit no-network-safe fallback behavior for local runs.
- [ ] Verify the current documented event surface still matches runtime payloads.
- [ ] Run `npm run check:analytics`, `npm run check:providers`, and `npm run preflight`.
- [ ] Record setup and runtime caveats in `docs/posthog-setup.md` or the chosen sink document.

## Task 3: Provider-Phase Hardening

**Files:**
- Review: `C:\Users\29940\spin-clash\docs\launch-blockers.md`
- Review: `C:\Users\29940\spin-clash\docs\provider-phase-plan.md`
- Review: `C:\Users\29940\spin-clash\docs\provider-phase-report-template.md`
- Modify as needed: `C:\Users\29940\spin-clash\src\reward-service.js`
- Modify as needed: `C:\Users\29940\spin-clash\src\analytics-service.js`
- Modify as needed: `C:\Users\29940\spin-clash\src\debug-service.js`
- Test: `C:\Users\29940\spin-clash\scripts\check-provider-services.js`
- Test: `C:\Users\29940\spin-clash\scripts\check-debug-service.js`

- [ ] Run one end-to-end provider matrix: reward success, reward deny, reward timeout/error, analytics send success, analytics send fail.
- [ ] Verify local static mode still behaves safely when provider credentials or remote endpoints are absent.
- [ ] Verify debug tooling still exposes enough information to diagnose provider failures without leaking secrets.
- [ ] Run `npm run check:providers`, `npm run check:debugservice`, and `npm run preflight`.
- [ ] Update `docs/launch-blockers.md` so only real unresolved blockers remain listed.

## Task 4: Manual Acceptance Closure

**Files:**
- Review: `C:\Users\29940\spin-clash\docs\manual-test-batches.md`
- Review: `C:\Users\29940\spin-clash\docs\local-operations.md`
- Review: `C:\Users\29940\spin-clash\docs\session-handoff-2026-04-18.md`
- Update evidence log if needed: `C:\Users\29940\spin-clash\progress.md`

- [ ] Re-run the main shell route-return matrix in a real browser session.
- [ ] Add one focused combat-feel pass for guard readability, enemy intent telegraph timing, and result return clarity.
- [ ] Add one focused localization pass across English, Chinese, and Japanese for overflow, truncation, and hierarchy breakage.
- [ ] Capture fresh screenshots for any page that still looks questionable under real browser conditions.
- [ ] Record concrete pass/fail notes in `progress.md` or a new dated acceptance note.

## Task 5: Quick Battle Final Visual Closure

**Files:**
- Modify if needed: `C:\Users\29940\spin-clash\src\quick-battle-preview-tools.js`
- Modify if needed: `C:\Users\29940\spin-clash\css\game.css`
- Test: `C:\Users\29940\spin-clash\scripts\check-shell-presentation.js`
- Update: `C:\Users\29940\spin-clash\docs\change-records\2026-04-17-ui-flow-combat-rework-log.md`

- [ ] Review the latest `circle / heart / hex` arena screenshots side by side before changing code again.
- [ ] If the route still feels unfinished, prefer one narrow micro-slice only.
- [ ] Default target: improve locked `Hex` readability without redesigning the route or changing unlocked arena direction.
- [ ] Keep any change preview-only; do not touch combat arena math.
- [ ] Run `npm run check:shellpresentation`, `npm run check:syntax`, and `npm run preflight`.
- [ ] Record the before/after visual reason in the change log.

## Task 6: Localization Readability Closure

**Files:**
- Modify if needed: `C:\Users\29940\spin-clash\src\config-text.js`
- Modify if needed: `C:\Users\29940\spin-clash\css\game.css`
- Test: `C:\Users\29940\spin-clash\scripts\check-localization.js`
- Test: `C:\Users\29940\spin-clash\scripts\check-shell-presentation.js`

- [ ] Identify any remaining line-wrap, truncation, or repeated-label problems in Chinese and Japanese first, because those are the highest overflow-risk surfaces.
- [ ] Prefer copy tightening or local layout tolerance increases over route-level redesign.
- [ ] Keep debug/developer-facing text ASCII-safe and unchanged unless a regression is proven.
- [ ] Run `npm run check:localization`, `npm run check:shellpresentation`, and `npm run preflight`.

## Task 7: Optional Combat Feel Pass

**Files:**
- Review: `C:\Users\29940\spin-clash\docs\balance-pass-2026-04-17.md`
- Modify if needed: `C:\Users\29940\spin-clash\src\config-tops.js`
- Modify if needed: `C:\Users\29940\spin-clash\src\config-signature-skills.js`
- Modify if needed: `C:\Users\29940\spin-clash\src\battle-sim-tools.js`
- Test: `C:\Users\29940\spin-clash\scripts\check-collision-helpers.js`
- Test: `C:\Users\29940\spin-clash\scripts\check-guard-flow.js`
- Test: `C:\Users\29940\spin-clash\scripts\check-combat-intent-telegraph.js`

- [ ] Only start this task if fresh manual play reveals a real feel problem rather than a cosmetic concern.
- [ ] Keep changes narrowly scoped to one combat read issue at a time: collision clarity, guard pacing, or signature timing.
- [ ] Avoid mixing balance tuning with shell polish or provider integration.
- [ ] Run the smallest relevant check set first, then `npm run preflight` after the final tuned state.
- [ ] Record the exact tuning reason in `docs/balance-pass-2026-04-17.md` or a dated follow-up note.

## Task 8: Release Closure And Ship Gate

**Files:**
- Review: `C:\Users\29940\spin-clash\docs\release-checklist.md`
- Review: `C:\Users\29940\spin-clash\docs\launch-blockers.md`
- Review: `C:\Users\29940\spin-clash\docs\deployment-notes.md`
- Review: `C:\Users\29940\spin-clash\docs\github-pages-deploy.md`
- Modify as needed: `C:\Users\29940\spin-clash\progress.md`

- [ ] Update the release checklist to reflect the actual final provider state, not the earlier mock-first assumption.
- [ ] Remove closed blockers from `launch-blockers.md` and leave only real remaining gaps.
- [ ] Run `npm run verify:release` for the final local release gate.
- [ ] Capture the final release decision: safe to soft-launch, safe to limited external test, or still blocked.

## Exit Criteria

Treat the project as ready for limited public release only when all of the following are true:

- reward provider path is live-validated
- analytics sink is wired and observable
- provider failure modes are documented and non-destructive
- `npm run verify:release` is green
- manual browser acceptance is refreshed after the final code changes
- no unresolved blocker in `docs/launch-blockers.md` would create player-facing breakage or false monetization behavior

## Practical Read Of Remaining Scope

- True release-blocking items: `3`
- High-value but non-blocking acceptance/polish items: `3`
- Optional post-acceptance polish items: `2`

The repo is close to feature-complete, but not close enough to call the business/release layer finished until the provider path is real.
