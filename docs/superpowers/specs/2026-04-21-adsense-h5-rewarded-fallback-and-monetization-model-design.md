# Spin Clash AdSense H5 Rewarded Fallback And Monetization Model Design

## Goal

Move the project off the current Google Ad Manager dependency as the primary Google monetization path by adding an `AdSense H5 rewarded-only` integration path that preserves the current player experience contract.

At the same time, formalize:
- a real-player-trigger frequency model for the three approved rewarded placements
- an initial revenue expectation model with two baselines
- the missing analytics needed to tune these placements later without guessing

This is a provider and measurement design slice.

It is not a gameplay expansion slice.

## Why This Slice Exists

The current repo already has a provider-safe reward boundary and a GPT-based live adapter path behind `rewardService`.

However, the business path is currently blocked by the need for usable Ad Manager workspace access and a real rewarded unit path.

The user now wants to:
- stop treating Ad Manager approval as the primary unlock path
- switch the active Google direction toward `AdSense H5`
- keep the existing user experience unchanged
- preserve the current GPT/Manager route as a fallback rather than deleting it
- build a math-based placement and revenue model that can later guide placement timing and frequency tuning

## Official Constraints That Matter

Based on the current Google help pages:

- AdSense H5 game ads require:
  - an approved AdSense account
  - separate H5 game ads access request / approval
- H5 game ads support:
  - interstitial ads
  - rewarded ads
- H5 game ads use:
  - AdSense page code
  - the H5 Games Ad Placement API
  - `adConfig(...)`
  - `adBreak(...)`
- H5 game ad settings initialize on page load and are not meant to be changed during the active page session
- rewarded ads must be explicitly user-chosen
- full-screen ads must appear only at natural transition points and must not interrupt dense gameplay

Primary references:
- [注册使用 AdSense H5 游戏广告](https://support.google.com/adsense/answer/1705831?hl=zh-Hans)
- [AdSense H5 游戏广告使用入门](https://support.google.com/adsense/answer/9959170?hl=zh-Hans)
- [将 AdSense 代码添加到您的游戏页面中](https://support.google.com/adsense/answer/9955214?hl=zh-Hans)
- [H5 游戏广告（Beta 版）政策](https://support.google.com/publisherpolicies/answer/11975916?hl=zh-Hans)
- [比较 Ad Manager、AdSense 和 AdMob](https://support.google.com/adsense/answer/9234653?hl=zh-Hans)

## Current Runtime State

Current reward boundary:
- gameplay calls `rewardService.request(placement, context)`
- gameplay checks success through `rewardService.wasGranted(result)`
- gameplay does not call provider SDK globals directly

Current approved rewarded placements:
- `double_reward`
- `continue_once`
- `trial_unlock_arena`

Current live path:
- adapter id: `adsense_rewarded`
- implementation shape: GPT rewarded out-of-page slot
- blocker: external Ad Manager / account / unit-path readiness

Current default path:
- adapter id: `mock`

Current analytics status:
- event families for reward flow already exist
- event quality is good enough for early `double_reward` and `continue_once` funneling
- event quality is not yet sufficient for precise `trial_unlock_arena` denominator analysis

## Non-Negotiable Player Experience Rules

These are hard requirements for the new H5 path.

### 1. Rewarded-only

This slice may not add:
- interstitial ads
- banner ads
- auto ads
- pre-battle forced ads
- battle-time interrupt ads

Only rewarded flows are in scope.

### 2. Placement timing stays unchanged

The new provider path must preserve the current user-facing trigger moments:

- `double_reward`
  - result screen only
  - one explicit user click
  - no auto-open

- `continue_once`
  - Challenge failure result screen only
  - one explicit user click
  - one continue opportunity per failed match flow

- `trial_unlock_arena`
  - only when the player attempts a locked arena and lacks enough SCRAP
  - only through explicit user choice

### 3. Reward grant semantics stay unchanged

The service contract must preserve:
- reward is granted only after provider-confirmed rewarded completion
- closing, declining, failing, timing out, or provider unavailability must not grant the reward
- gameplay result mutation happens only after `rewardService.wasGranted(result) === true`

### 4. Policy-safe timing

The new H5 path must not create any ad trigger:
- before the game is ready
- during battle action
- during drag / launch / skill execution loops
- on every user interaction
- on close of another full-screen ad

The only valid full-screen ad moments remain the current natural transition surfaces already used by the rewarded design.

## Chosen Design

### Recommendation

Adopt a dual-live-provider structure:
- keep `adsense_rewarded` as the existing GPT / Ad Manager backup route
- add a new `adsense_h5_rewarded` route as the primary near-term Google path
- keep `mock` as the committed default

This is the recommended design because it preserves:
- existing gameplay boundaries
- existing user experience timing
- future reversibility if Ad Manager approval completes later

### Rejected alternatives

#### Rejected: overwrite `adsense_rewarded` to mean H5

Why rejected:
- would blur GPT and H5 semantics
- would corrupt future fallback clarity
- would make debugging and deploy-time operator control worse

#### Rejected: delay all integration until H5 approval finishes

Why rejected:
- leaves the codebase blocked on external status
- prevents reward funnel instrumentation from becoming decision-ready
- delays real operator readiness without reducing future implementation work

## Architecture

### Provider IDs

Reward adapter ids after this slice:
- `mock`
- `adsense_h5_rewarded`
- `adsense_rewarded`

Meaning:
- `mock`: safe default, fully playable
- `adsense_h5_rewarded`: primary Google H5 rewarded route
- `adsense_rewarded`: GPT / Ad Manager fallback route

### Gameplay-facing contract

No gameplay call sites change.

The only supported public reward interface remains:

```js
rewardService.request(placement, context) -> Promise<{
  placement,
  adapter,
  granted,
  context,
  resultValue,
  reward?,
  reason?
}>
```

And:

```js
rewardService.wasGranted(result) -> boolean
rewardService.getFailureInfo(input) -> normalized failure bucket
rewardService.getAdapterInfo() -> operator-readable provider state
```

### Provider runtime split

`providerRuntime` should become the shared loader / readiness layer for both:
- GPT script lifecycle
- AdSense H5 page-code and H5 Games API lifecycle

The runtime must support:
- one-time script loading
- one-time page-level H5 initialization
- explicit readiness inspection
- clear failure normalization

### H5 initialization model

The H5 path must honor the official page-load initialization constraint.

Interpretation for this repo:
- H5 AdSense page code and H5 API bootstrap belong in the runtime/provider layer
- configuration that affects H5 ad behavior is frozen for the life of the loaded page
- deploy-time override can select the provider and inject keys / publisher identifiers
- gameplay may request rewarded opportunities later, but may not mutate the base H5 page config after load

### Result normalization

The H5 path must normalize provider outcomes into the same shared buckets already used by gameplay:
- granted
- declined
- loading
- busy
- unavailable
- error

At minimum, the H5 route must safely map:
- explicit rewarded completion
- user close without completion
- SDK unavailable
- not-ready / loading
- malformed configuration
- request in flight

## Config Design

### Base config direction

Committed default must remain:

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
    scriptUrl: '',
    rewardedAdUnitPath: '',
    gamInterstitialAdUnitPath: '',
    h5: {
      enabled: false,
      scriptUrl: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
      publisherId: '',
      dataAdClient: '',
      preloadHints: {
        sound: 'off',
        preload: 'auto'
      }
    }
  }
}
```

Notes:
- the semantic requirement is more important than the exact object shape

### Deploy-time override direction

Preferred live H5 switch shape:
- `SPIN_CLASH_REWARD_ADAPTER=adsense_h5_rewarded`
- `SPIN_CLASH_REWARD_ENABLED=true`
- `SPIN_CLASH_ADSENSE_H5_ENABLED=true`
- `SPIN_CLASH_ADSENSE_H5_PUBLISHER_ID=<publisher id>`

Preferred GPT backup switch shape remains possible:
- `SPIN_CLASH_REWARD_ADAPTER=adsense_rewarded`
- `SPIN_CLASH_REWARD_ENABLED=true`
- `SPIN_CLASH_REWARDED_AD_UNIT_PATH=<gpt rewarded path>`

Exact variable naming must stay operator-readable and consistent with the existing release packaging pattern.

## Placement Analysis Design

This slice must ship with an explicit operator-facing placement model, not just a provider adapter.

### Placement 1: `double_reward`

Player position in flow:
- after a completed match
- on the result screen
- emotionally read as "convert a completed outcome into extra reward"

Frequency character:
- highest-frequency rewarded placement
- lowest emotional friction
- largest likely revenue contributor
- biggest fatigue risk if overused

Hard product constraints:
- one offer per completed match result
- no auto-trigger
- once claimed or declined in that result context, no second offer in the same result context

### Placement 2: `continue_once`

Player position in flow:
- after Challenge failure
- on a loss recovery surface
- emotionally read as "save this run"

Frequency character:
- lower-frequency than `double_reward`
- highest sensitivity because it appears during player frustration
- likely second-largest revenue contribution
- strongest retention leverage

Hard product constraints:
- only on Challenge loss
- one explicit continue chance per failed match context
- must not chain into repeated continue offers in the same loss context

### Placement 3: `trial_unlock_arena`

Player position in flow:
- in Quick Battle shell
- when player wants a locked arena but cannot afford permanent unlock
- emotionally read as "temporary content access"

Frequency character:
- lowest-frequency rewarded placement
- primarily a conversion / curiosity release valve
- likely smallest direct revenue contributor

Hard product constraints:
- only when locked arena is selected
- only when purchase path is unaffordable
- session-limited temporary access remains the only reward semantics in this slice

## Baseline Modeling Design

Two baseline lenses are required.

### Baseline A: real-current behavior model

This baseline uses actual current event structure and current code gates.

#### What can already be modeled well

- `double_reward`
  - request volume
  - completion volume
  - decline volume
  - request-to-complete rate
  - request-to-decline rate

- `continue_once`
  - Challenge-loss denominator
  - request volume
  - completion volume
  - continue-applied volume

#### What is incomplete today

- `trial_unlock_arena` denominator quality
  - current events can see request and completion
  - current events cannot precisely reconstruct all player exposures to the locked-arena shortfall state

#### Required formulas

The design must preserve an operator-readable formula set like:

- `O_d = count(reward_offer_show where placement='double_reward')`
- `C_d = count(reward_complete where placement='double_reward')`
- `D_d = count(reward_decline where placement='double_reward')`
- `offer_rate_d ≈ O_d / count(match_end)`
- `completion_rate_d = C_d / O_d`

- `L_c = count(match_end where mode='challenge' and result='loss')`
- `O_c = count(reward_offer_show where placement='continue_once')`
- `C_c = count(reward_complete where placement='continue_once')`
- `U_c = count(continue_used)`
- `offer_rate_c ≈ O_c / L_c`
- `grant_rate_c = C_c / O_c`

- `T_s = count(trial_unlock_start where arenaId='hex_bowl')`
- `T_c = count(trial_unlock_complete where arenaId='hex_bowl')`
- `grant_rate_t = T_c / T_s`

### Baseline B: product-planning model

This baseline is assumption-driven and must be adjustable without changing code.

Required variables:
- `D` = DAU
- `S` = sessions per DAU per day
- `M` = average completed matches per session
- `result_reach_rate` = result-screen reach rate
- `C` = Challenge match share
- `F` = Challenge failure rate
- `U` = locked-arena shortfall attempts per DAU
- `k_i` = frequency suppression factor per placement
- `A_i` = player accept rate per placement
- `G_i` = provider-granted completion rate per placement
- `E_i` = eCPM or equivalent reward-complete yield per placement

Required offer formulas:

- `O_dr = D * S * M * result_reach_rate`
- `O_co = D * S * M * C * F`
- `O_tua = D * U`

Required delivery formulas:

- `Show_i = O_i * k_i * A_i`
- `Complete_i = Show_i * G_i`
- `Revenue_i = Complete_i / 1000 * E_i`

Required total:

- `Revenue_total = Revenue_dr + Revenue_co + Revenue_tua`

### Required scenario cuts

The model must support:
- conservative
- base
- aggressive

And each of those must be viewable under:
- `global blended`
- `mobile-web zh-skewed`

## Analytics And Modeling Gaps To Fix

This slice must explicitly fix the minimum gaps needed for future placement tuning.

### Required new identifiers

- `reward_attempt_id`
- `result_context_id`
- stable trial-unlock attempt identifier if needed for arena unlock funnels

### Required new denominator events

For `trial_unlock_arena`, add denominator-quality events such as:
- locked arena clicked
- locked arena affordability shortfall detected
- rewarded trial offer surfaced

For all three placements, distinguish:
- UI offer became visible
- player requested reward
- provider granted reward
- provider declined / closed / failed

Current `reward_offer_show` is too close to "request started" and is not a pure UI-impression signal.

### Required relationship tracking

The analytics layer must make it possible to correlate:
- reward attempt
- specific match or unlock context
- later progression or currency result

This is especially important for:
- post-continue outcome quality
- trial-unlock follow-on arena usage

## Validation Requirements

### Provider validation

The implementation must extend:
- provider service checks
- debug/runtime provider snapshot
- build/release config checks if needed

Minimum provider-proof expectations:
- unsupported adapter ids still fail safely
- `mock` still works
- `adsense_rewarded` backup path still works
- `adsense_h5_rewarded` path normalizes outcomes correctly
- gameplay caller contract remains unchanged

### Player-safety validation

The implementation must prove:
- no rewarded flow auto-opens on page load
- no rewarded flow opens during battle
- no rewarded flow appears outside the current three approved trigger moments
- failure states preserve safe gameplay behavior

### Modeling validation

The implementation must make it possible to derive:
- placement offer rates
- placement acceptance rates
- placement grant rates
- placement-specific estimated revenue contribution

without inventing data outside the tracked event set.

## Out Of Scope

This slice does not:
- guarantee H5 account approval
- automate Google account or backend operations
- add forced ads
- add new reward placements
- retune the game economy itself
- redesign result screens or loadout screens
- expand arena roster visibility beyond what current UI intentionally exposes

## Risks

### External approval risk

Code can prepare the H5 path, but cannot guarantee:
- approved AdSense account status
- H5 game ads access approval
- production fill / yield quality

### Semantic mismatch risk

The H5 rewarded lifecycle may not map one-to-one with the current GPT rewarded lifecycle.

Implementation must therefore prioritize:
- safe no-grant fallback
- explicit reward grant only on confirmed reward completion
- operator-readable debug state

### Analytics false-confidence risk

Without denominator and correlation improvements, early revenue tuning may overfit noisy partial signals.

That is why the analytics additions are part of this design rather than a separate downstream cleanup task.

## Acceptance Criteria

This design is successful only if all of the following are true:

1. the repo supports a new `adsense_h5_rewarded` path without changing gameplay call sites
2. `adsense_rewarded` remains available as a backup GPT / Ad Manager route
3. committed default remains `mock`
4. only the current three rewarded placements are eligible for live rewarded use
5. no forced-interruption ad format is introduced
6. rewarded grant semantics remain identical from the player perspective
7. the debug/provider inspection surface can explain both live routes
8. the analytics model can support both:
   - real-current baseline analysis
   - product-planning scenario analysis
9. trial-unlock denominator blind spots are explicitly addressed
10. implementation can proceed without requiring direct automation inside the user's Google ad account backend

## Implementation Direction

Implementation should proceed in this order:

1. contract-first tests and provider checks for the new adapter boundary
2. config surface extension for H5 path while preserving GPT fallback
3. H5 runtime adapter implementation
4. reward result normalization and debug inspection updates
5. analytics and placement-model instrumentation additions
6. release/deploy documentation update for the new primary Google path

This keeps player-facing behavior stable while moving the operator-facing monetization path forward.
