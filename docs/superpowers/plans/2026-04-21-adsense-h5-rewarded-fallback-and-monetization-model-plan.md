# AdSense H5 Rewarded Fallback And Monetization Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `adsense_h5_rewarded` provider path that preserves the current three rewarded placements and player-facing grant semantics, keep the existing GPT / Ad Manager path as a fallback, and ship the minimum analytics plus operator-facing modeling needed to reason about trigger frequency and early revenue.

**Architecture:** Keep gameplay on the existing `rewardService.request(...)` boundary. Extend config and provider validation first, then split the reward provider layer into three explicit adapters: `mock`, `adsense_h5_rewarded`, and `adsense_rewarded`. Use `providerRuntime` as the shared loader and readiness layer for both GPT and AdSense H5 page-code bootstrap. Add denominator-quality reward analytics without changing gameplay timing. Ship one operator-facing monetization model document tied to both current event structure and planning assumptions.

**Tech Stack:** Static HTML/JS game runtime, Node-based repo validation scripts, release-time provider override injection via `scripts/build-static-release.js`, no backend services.

---

### File Map

**Existing files that this plan is expected to touch**
- `src/config-providers.js`
  - Extend reward config so H5 and GPT live paths can coexist without changing the committed default.
- `src/provider-runtime-tools.js`
  - Add one-time AdSense H5 script/bootstrap lifecycle support and shared readiness inspection helpers.
- `src/reward-service.js`
  - Add the new H5 adapter, preserve GPT fallback, normalize outcomes, and enrich reward analytics payloads.
- `src/analytics-service.js`
  - Preserve local buffering but support the richer reward payload contract.
- `scripts/check-config.js`
  - Extend config expectations and release override merge coverage for the new adapter/config surface.
- `scripts/check-provider-services.js`
  - Lock contract-first behavior for the H5 adapter, fallback safety, and analytics semantics.
- `scripts/check-debug-runtime-snapshots.js`
  - Keep debug/runtime reporting readable across both live Google paths without leaking sensitive config.
- `scripts/build-static-release.js`
  - Add H5 release override env parsing and validation.
- `progress.md`
  - Record implementation, verification, and model artifact paths.

**New files this plan is expected to create**
- `docs/monetization/2026-04-21-adsense-h5-rewarded-baseline-model.md`
  - Operator-facing dual-baseline math model for placement frequency and revenue expectation.

**Files expected to remain unchanged**
- `index.html`
- Gameplay call sites that already use `rewardService`
- Arena, battle, and ad-placement UX surfaces beyond analytics context enrichment

---

### Task 1: Lock the new provider/config contract before implementation

**Files:**
- Modify: `scripts/check-provider-services.js`
- Modify: `scripts/check-config.js`
- Modify: `scripts/check-debug-runtime-snapshots.js`

- [ ] **Step 1: Add failing provider checks for `adsense_h5_rewarded`**

Extend `scripts/check-provider-services.js` with contract-first expectations that fail before implementation:
- `adsense_h5_rewarded` is a valid adapter id
- committed default remains `mock`
- H5 adapter reports unavailable when disabled or missing publisher config
- H5 adapter preserves the existing placement allowlist
- H5 adapter maps close / fail / not-ready into safe normalized reasons
- H5 adapter never grants on close-without-reward

- [ ] **Step 2: Extend config/runtime validation**

Update `scripts/check-config.js` so the config contract allows:
- `reward.adapter` in `['mock', 'adsense_h5_rewarded', 'adsense_rewarded']`
- `reward.adsense.h5` nested configuration
- release override merging for H5 env fields

The config check must also assert:
- H5 live builds require an explicit publisher/client identifier when the H5 adapter is enabled
- GPT fallback rules remain unchanged for `adsense_rewarded`

- [ ] **Step 3: Extend debug snapshot expectations**

Update `scripts/check-debug-runtime-snapshots.js` so debug/runtime views prove:
- both live adapter ids are surfaced readably
- adapter readiness/failure states stay operator-readable
- no sensitive ad config strings leak into the panel snapshot

- [ ] **Step 4: Run the contract checks and confirm they fail for the right reason**

Run:

```bash
npm run check:providers
npm run check:config
npm run check:debugruntime
```

Expected:
- at least one failure tied to the missing H5 adapter/config/runtime contract
- no syntax-level crash

---

### Task 2: Extend the config and release override surface

**Files:**
- Modify: `src/config-providers.js`
- Modify: `scripts/build-static-release.js`

- [ ] **Step 1: Add the H5 config branch without changing defaults**

Extend `src/config-providers.js` so:
- committed `reward.adapter` stays `mock`
- existing `reward.adsense` GPT fields remain available
- new `reward.adsense.h5` contains:
  - `enabled`
  - `scriptUrl`
  - `publisherId`
  - `dataAdClient`
  - `preloadHints.sound`
  - `preloadHints.preload`

- [ ] **Step 2: Add release override parsing for H5**

Extend `scripts/build-static-release.js` to support H5 override inputs such as:
- `SPIN_CLASH_ADSENSE_H5_ENABLED`
- `SPIN_CLASH_ADSENSE_H5_SCRIPT_URL`
- `SPIN_CLASH_ADSENSE_H5_PUBLISHER_ID`
- `SPIN_CLASH_ADSENSE_H5_DATA_AD_CLIENT`
- `SPIN_CLASH_ADSENSE_H5_PRELOAD`
- `SPIN_CLASH_ADSENSE_H5_SOUND`

These should merge into the same runtime override file as the existing GPT and analytics fields.

- [ ] **Step 3: Validate H5 release requirements**

Add release-time guardrails so:
- `adsense_h5_rewarded` requires H5 enabled plus a publisher/client identifier
- `adsense_rewarded` still requires the GPT rewarded ad unit path
- no rule enables interstitial or banner behavior in this slice

- [ ] **Step 4: Re-run config validation**

Run:

```bash
npm run check:config
```

Expected:
- `PASS`

---

### Task 3: Implement shared AdSense H5 runtime support

**Files:**
- Modify: `src/provider-runtime-tools.js`

- [ ] **Step 1: Add H5 bootstrap state management**

Add runtime-owned state for:
- one-time H5 script loading
- one-time page-level H5 initialization
- readiness inspection
- last error / last init reason

- [ ] **Step 2: Add H5 bootstrap helpers**

Add helpers that the reward layer can call safely:
- `hasAdsenseH5Api()`
- `initAdsenseH5(config)`
- `getAdsenseH5State()`

The bootstrap should:
- load the page-level AdSense script once
- attach or confirm the AdSense client identifier
- call the H5 page-level config only once per page lifetime
- remain a no-op-safe path if the page script/global is unavailable

- [ ] **Step 3: Normalize H5 runtime failure buckets**

Ensure the runtime can distinguish:
- script loading
- missing config
- unavailable API
- initialized but not ready

These states must later map cleanly into `rewardService.getFailureInfo(...)`.

- [ ] **Step 4: Run provider/debug checks**

Run:

```bash
npm run check:providers
npm run check:debugruntime
```

Expected:
- some reward-service tests may still fail until Task 4 lands
- runtime-specific failures should now move past the missing-bootstrap stage

---

### Task 4: Implement the new H5 adapter while preserving GPT fallback

**Files:**
- Modify: `src/reward-service.js`

- [ ] **Step 1: Refactor reward adapter selection to three explicit routes**

Keep:
- `mock`
- `adsense_h5_rewarded`
- `adsense_rewarded`

Reject unknown adapter ids with the existing safe unavailable behavior.

- [ ] **Step 2: Add `adsense_h5_rewarded` availability and request flow**

The H5 adapter must:
- reuse the existing placement allowlist
- require explicit user-triggered request calls only
- bootstrap through `providerRuntime`
- guard against in-flight duplicate requests
- resolve `granted:true` only on confirmed reward completion
- resolve or reject with normalized non-grant outcomes on close, unavailable, or failure

- [ ] **Step 3: Keep GPT fallback behavior intact**

Do not regress:
- GPT script loading
- rewarded slot request lifecycle
- allowed placement behavior
- close-without-grant semantics

- [ ] **Step 4: Make adapter info explain both live paths**

`rewardService.getAdapterInfo()` should stay operator-readable across:
- `mock`
- `adsense_h5_rewarded`
- `adsense_rewarded`

It must not leak raw ad unit ids or publisher strings.

- [ ] **Step 5: Run the provider checks to green**

Run:

```bash
npm run check:providers
npm run check:debugruntime
```

Expected:
- both commands `PASS`

---

### Task 5: Add denominator-quality reward analytics and stable context ids

**Files:**
- Modify: `src/reward-service.js`
- Modify: `src/analytics-service.js`
- Modify: `scripts/check-analytics-events.js`
- Modify: any existing gameplay/runtime files needed only to source context ids or trial-offer denominator events

- [ ] **Step 1: Add stable reward attempt identifiers**

Enrich reward analytics payloads with:
- `reward_attempt_id`
- `result_context_id` when the reward is tied to a result screen
- stable unlock attempt context for `trial_unlock_arena`

- [ ] **Step 2: Separate offer-visible from request-start**

Adjust reward analytics so the event model can distinguish:
- UI offer became visible
- player requested reward
- reward granted
- reward declined / closed / failed

This may reuse existing names if the semantics become clean; otherwise add new event names and keep checks aligned.

- [ ] **Step 3: Add missing `trial_unlock_arena` denominator events**

Add the minimum event points needed to reason about:
- locked arena clicked
- affordability shortfall detected
- rewarded trial offer surfaced

Do not change the unlock UX itself.

- [ ] **Step 4: Keep analytics safe under local-only mode**

The richer payload contract must still:
- buffer locally without remote forwarding
- avoid runtime crashes when optional ids are absent
- remain compatible with existing debug views

- [ ] **Step 5: Run analytics and flow validation**

Run:

```bash
npm run check:analytics
npm run check:session
npm run check:matchflow
npm run check:roundflow
```

Expected:
- all commands `PASS`

---

### Task 6: Ship the operator-facing dual-baseline model

**Files:**
- Create: `docs/monetization/2026-04-21-adsense-h5-rewarded-baseline-model.md`

- [ ] **Step 1: Document the real-current baseline**

Write an operator-facing section that covers:
- actual current trigger locations in player flow
- per-match / per-loss / per-session ceilings
- formulas supported by today’s event structure
- remaining blind spots that the new instrumentation closes

- [ ] **Step 2: Document the planning baseline**

Write a second section with adjustable variables for:
- `DAU`
- sessions per DAU
- completed matches per session
- Challenge share/failure rate
- locked-arena shortfall attempts
- accept rate, grant rate, and yield per placement

- [ ] **Step 3: Add scenario cuts**

Include:
- conservative
- base
- aggressive

And show each under:
- `global blended`
- `mobile-web zh-skewed`

- [ ] **Step 4: State placement conclusions from a player-experience view**

The document must clearly state:
- `double_reward` is the highest-frequency and likely largest revenue driver
- `continue_once` is the most UX-sensitive and must remain tightly bounded
- `trial_unlock_arena` is the lowest-frequency conversion valve

---

### Task 7: Run full verification and record the rollout state

**Files:**
- Modify: `progress.md`

- [ ] **Step 1: Run targeted checks first**

Run:

```bash
npm run check:providers
npm run check:config
npm run check:debugruntime
npm run check:analytics
npm run check:dom
```

- [ ] **Step 2: Run full repo verification**

Run:

```bash
npm run preflight
npm run verify:release
```

Expected:
- both commands `PASS`

- [ ] **Step 3: Record the implementation in `progress.md`**

Append a log entry covering:
- the new `adsense_h5_rewarded` path
- preserved GPT fallback
- added analytics/modeling coverage
- validation commands that passed
- the new monetization model document path

- [ ] **Step 4: Keep rollout status explicit**

The log must state:
- the repo is implementation-ready for AdSense H5
- real production monetization still depends on AdSense account approval plus H5 access approval
- no Google backend automation was performed as part of this slice
