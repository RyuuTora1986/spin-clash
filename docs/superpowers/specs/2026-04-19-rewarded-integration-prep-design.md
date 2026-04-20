# Rewarded Integration Preparation Design

## Purpose

This document defines the approved `A` path for rewarded-ad integration work.

It is a preparation-and-hardening slice only.

The goal is not to prove final monetized launch readiness in this slice.
The goal is to turn the existing rewarded-provider scaffolding into a stable release-prep shell that is:

- configurable
- observable
- safe to fall back
- ready for later real-host manual validation

Hard constraints:
- keep the current static HTML/CSS/JS architecture
- do not add a backend
- do not let gameplay code talk to GPT globals directly
- do not change reward business rules
- keep `mock` as the committed default

## Problem Statement

The project already has a real rewarded path scaffold:

- `src/config-providers.js`
- `src/provider-runtime-tools.js`
- `src/reward-service.js`

It already supports:

- `mock`
- `adsense_rewarded`
- GPT script bootstrap
- rewarded slot lifecycle mapping
- local-safe failure fallback

That means the current gap is no longer "build rewarded support from scratch".

The real gap is:

1. release-facing configuration is still too loose
2. runtime observability is still not explicit enough for non-technical operator use
3. placement policy for live rewarded usage is not yet locked into one clear prep contract
4. deploy and acceptance documentation is still spread across multiple docs instead of one direct operator path
5. real validation is still blocked by provider/account/host reality, so this slice must prepare for that without pretending to complete it

## Current Findings

### 1. Provider boundary is already mostly correct

Gameplay callers still go through:

```js
rewardService.request(placement, context)
```

This is correct and must remain the only gameplay entry.

### 2. Base config is already mock-first

`src/config-providers.js` currently keeps:

- `reward.adapter = 'mock'`
- `reward.adsense.enabled = false`

This is also correct and must stay true after this slice.

### 3. Live rewarded runtime exists, but is still operator-hostile

The current live path already handles:

- GPT script loading
- rewarded slot request
- `rewardedSlotReady`
- `rewardedSlotGranted`
- `rewardedSlotClosed`
- safe rejection on unavailable provider paths

But it is still too easy for an operator to be unsure whether the current failure is caused by:

- adapter selection
- disabled provider
- missing ad unit path
- unsupported placement
- script load failure
- provider timeout
- close-without-grant

### 4. Release docs already describe the direction, but not as one execution pack

Relevant docs already exist:

- `docs/provider-integration-notes.md`
- `docs/reward-live-adapter-status.md`
- `docs/provider-phase-plan.md`
- `docs/github-pages-deploy.md`
- `docs/launch-blockers.md`

The remaining problem is not missing raw information.
It is missing one compact, execution-oriented preparation pass.

## Approved Scope

This slice includes:

1. reward-provider configuration hardening
2. live rewarded placement policy lock
3. runtime/debug observability improvements
4. failure-state normalization cleanup required to preserve operator clarity
5. release/deploy/operator documentation updates
6. acceptance coverage updates for the preparation layer

This slice does not include:

1. proving that a real ad will definitely fill
2. claiming monetized launch readiness
3. changing gameplay reward semantics
4. adding a backend verification service
5. adding new monetization surfaces outside rewarded preparation
6. redesigning the game UI

## Approach Options

### Option A: Documentation-only preparation

What it means:
- only update docs
- keep code as-is

Pros:
- cheapest

Cons:
- leaves operator ambiguity in runtime
- pushes real debugging cost into the next phase
- too weak for the approved goal

### Option B: Standard preparation shell

What it means:
- keep the current reward architecture
- harden config surface
- improve runtime observability
- update acceptance and operator docs

Pros:
- smallest useful slice
- directly supports the later live validation pass
- low risk to gameplay stability

Cons:
- requires small code changes, not docs only

### Option C: Full production integration pass

What it means:
- push straight through to real live validation completion
- bundle code prep and provider/account verification together

Pros:
- shortest path to a business answer

Cons:
- blocked by external platform readiness
- mixes code-prep work with live-provider uncertainty
- too large for the approved `A` path

## Recommendation

Recommend `Option B`.

Reason:
- it prepares the real integration surface without pretending the external provider state is already solved
- it protects the current game loop
- it minimizes rework before the later real validation pass

## Design

## 1. Configuration Contract

### Goal

Make rewarded live enablement explicit and reversible without touching gameplay code.

### Rules

Committed base config must remain:

```js
reward: {
  adapter: 'mock',
  adsense: {
    enabled: false
  }
}
```

Live rewarded mode may only be enabled through provider config and deploy-time override.

### Required live config surface

The rewarded live path must continue to require:

- adapter id:
  - `adsense_rewarded`
- explicit enable flag:
  - `reward.adsense.enabled === true`
- rewarded ad unit path:
  - `reward.adsense.rewardedAdUnitPath`

### New prep-level config lock

Add a placement allowlist under reward config.

Target shape:

```js
reward: {
  adapter: 'mock',
  mockMode: 'grant',
  livePlacements: {
    double_reward: true,
    continue_once: true,
    trial_unlock_arena: true
  },
  adsense: {
    enabled: false,
    scriptUrl: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
    rewardedAdUnitPath: '',
    gamInterstitialAdUnitPath: ''
  }
}
```

Purpose:
- lock which placements are even allowed to attempt real rewarded
- keep future placement expansion config-first
- prevent accidental live requests from unapproved placements

### Placement policy for this slice

Approved live rewarded placement scope remains:

- `double_reward`
- `continue_once`
- `trial_unlock_arena`

If a placement is not allowlisted for live rewarded:
- `isRewardAvailable(...)` should report unavailable with a provider-level reason
- `request(...)` should reject safely without falling into undefined behavior

Recommended normalized reason:
- `placement_not_enabled`

## 2. Reward Service Behavior

### Goal

Keep one stable reward interface while making live-prep behavior more explicit.

### Locked runtime contract

The service contract stays:

```js
rewardService.request(placement, context) -> Promise<result>
rewardService.wasGranted(result) -> boolean
rewardService.getFailureInfo(input) -> normalized failure info
```

### Required behavior

The reward service must continue to:

- never expose GPT globals to gameplay code
- reject unsupported adapter ids explicitly
- keep mock fallback available as the committed default mode
- keep normal gameplay running if live rewarded is unavailable

### Additional prep-level behavior

The live adapter path should expose clear reasons for:

- `provider_disabled`
- `ad_unit_missing`
- `placement_not_enabled`
- `provider_loading`
- `provider_unavailable`
- `request_in_flight`
- `provider_timeout`
- `slot_closed`
- `provider_misconfigured`

This slice does not need richer monetization semantics like fill-rate diagnostics from the provider if GPT does not expose them cleanly.
It only needs clean internal normalization.

## 3. Runtime Observability

### Goal

Make rewarded status understandable without reading source code.

### Requirement

The existing debug/runtime surface should expose enough information to answer:

1. Which reward adapter is active right now?
2. Is live reward actually enabled?
3. Is the current placement allowed to use live reward?
4. Is GPT ready, loading, or unavailable?
5. Is an ad unit path configured?
6. What was the last failure reason?
7. Is there already an in-flight reward request?

### Recommended minimum debug shape

The reward adapter info surface should be inspectable as:

- `adapter`
- `rewardEnabled`
- `ready`
- `loading`
- `activePlacement`
- `lastAvailabilityReason`
- `lastRequestReason`
- `allowedPlacements`
- `rewardedAdUnitConfigured`

Exact UI wording can follow existing debug conventions.
This slice does not require a polished new panel, only clear visibility in the current debug/runtime inspection path.

## 4. Failure Handling

### Goal

Ensure live rewarded failures remain operationally clear and player-safe.

### Required player-safe rule

No rewarded failure may:

- soft-lock battle flow
- corrupt reward state
- bypass the normal deny/error branch
- silently grant success

### Required operator-safe rule

A failed live request should be classifiable into one of these buckets:

- loading
- busy
- unavailable
- declined
- error

This preserves the current `rewardService.getFailureInfo(...)` direction and extends it only as needed.

## 5. Documentation Pack

### Goal

Turn the current distributed provider notes into a direct rewarded-prep operator path.

### Required doc updates

Update these docs so they reflect the post-prep state:

- `docs/provider-integration-notes.md`
- `docs/reward-live-adapter-status.md`
- `docs/github-pages-deploy.md`
- `docs/launch-blockers.md`

Add one new focused prep doc:

- `docs/rewarded-integration-prep-checklist.md`

### Purpose of the new checklist doc

It should answer, in order:

1. what this prep slice does
2. what it does not do
3. which config must be present for live rewarded
4. which placements are approved
5. how to tell whether runtime is using mock or live
6. what each common failure reason means
7. what remains before real manual validation

## 6. Acceptance And Verification

### Goal

Treat this as a preparation-layer ship gate, not a monetization-result gate.

### Required automated coverage

Existing provider checks should be extended only where the preparation slice changes behavior.

Required coverage after this slice:

- base config still defaults to `mock`
- unsupported adapters still reject explicitly
- disabled live rewarded still fails safely
- missing rewarded ad unit still reports unavailable
- non-allowlisted live placement reports unavailable / rejects safely
- live placement allowlist reports enabled state correctly
- reward debug info exposes enough operator-readable state
- no change breaks the shared reward result contract

### Required local verification

Run:

```powershell
npm run check:providers
npm run preflight
```

If additional provider checks are added, they must be wired into the same authoritative verification path.

## File-Level Change Plan

Primary code targets:

- `src/config-providers.js`
- `src/reward-service.js`
- any existing runtime/debug module that already surfaces provider state
- `scripts/check-provider-services.js`

Primary doc targets:

- `docs/provider-integration-notes.md`
- `docs/reward-live-adapter-status.md`
- `docs/github-pages-deploy.md`
- `docs/launch-blockers.md`
- `docs/rewarded-integration-prep-checklist.md`

## Non-Goals

Do not do any of the following in this slice:

- promise real fill
- claim rewarded monetization is fully validated
- add backend reward verification
- add new revenue products
- widen gameplay reward scope
- redesign the player-facing monetization UI

## Exit Condition

This preparation slice is complete when all of the following are true:

1. committed base config still defaults to safe mock mode
2. live rewarded enablement is fully config-driven
3. approved live placements are explicitly locked
4. unsupported or disabled live paths fail with normalized reasons
5. runtime/debug inspection can explain current rewarded state clearly
6. provider verification scripts cover the new prep-level behavior
7. operator docs clearly explain how to move from prep to real validation

## Next Step After This Design

After this prep slice ships, the next distinct phase is:

- real rewarded-ad manual validation on the target deployed host/browser/account path

That later phase should be treated as a separate validation task, not folded into this preparation batch.
