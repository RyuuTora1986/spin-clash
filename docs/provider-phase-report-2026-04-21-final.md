# Provider Phase Report 2026-04-21 Final

This is the final rewarded-provider closeout artifact for the repository as of `2026-04-21`.

It supersedes the earlier partial artifact at:
- `docs/provider-phase-report-2026-04-18-partial.md`

## Summary
- Date: `2026-04-21`
- Integrator: Codex
- Target live host:
  - `https://play.hakurokudo.com/`
- Chosen live reward path:
  - `adsense_h5_rewarded`
- Reward scope kept live:
  - `double_reward`
  - `continue_once`
  - `trial_unlock_arena`
- Live adapter status:
  - enabled through deploy-time override
  - committed base config still defaults to `mock`
- Analytics sink status:
  - PostHog forwarding remains available through deploy-time override
  - local buffered analytics remains the source-of-truth fallback

## Final Rewarded Outcome
- The AdSense H5 rewarded path is now validated as the current primary live path.
- The repository no longer fails during H5 bootstrap due to false runtime unavailability detection.
- The live Pages package now emits the AdSense H5 script and bootstrap block in `<head>`.
- The live H5 package now records the Google `onReady` signal and promotes provider runtime state to `ready`.
- The live H5 deployment variable was switched to:
  - `SPIN_CLASH_ADSENSE_H5_PRELOAD=on`

## Root-Cause History
The rewarded no-show problem was traced to three concrete integration issues:

1. H5 API false-negative detection
- after `adsbygoogle.js` bootstrapped, `window.adsbygoogle` no longer stayed an array
- the runtime had been treating `Array.isArray(window.adsbygoogle)` as the readiness contract
- result:
  - the provider self-classified as unavailable even after Google loaded correctly

2. Missing head bootstrap in the packaged live build
- the H5 script and queue bootstrap were previously injected lazily at request time
- result:
  - the live package did not match the intended head-first H5 integration shape

3. H5 preload mode was too weak for stable readiness
- controlled browser probes showed:
  - `preloadAdBreaks=auto` never produced a durable ready state
  - `preloadAdBreaks=on` produced a durable ready state and allowed real user-gesture clicks to advance into `slot_visible`

## Final Live Validation Evidence

### A. Deployed runtime inspection
- Host:
  - `https://play.hakurokudo.com/`
- Confirmed live version:
  - `1.0.10`
- Confirmed live head bootstrap:
  - AdSense H5 script tag present in `<head>`
  - queue bootstrap present in `<head>`
  - `window.__spinClashAdsenseH5Bootstrap`
  - `adConfig({ preloadAdBreaks: "on", ... onReady ... })`

### B. Browser runtime probe
- Before reward click on live host:
  - `ready: true`
  - `rewardEnabled: true`
  - `rewardedAdUnitConfigured: true`
- After a real reward CTA click:
  - `lastRequestReason: "slot_visible"`
  - `activePlacement: "trial_unlock_arena"`
  - no fallback failure message was shown

### C. Real-device validation
- Device:
  - `iPhone 15 Pro Max`
- Browser:
  - `Chrome`
- Operator report:
  - all reward flows tested
  - no visually observable issue reported

## Reward Validation Matrix

| Flow | Current status | Evidence |
| --- | --- | --- |
| `double_reward` | validated live | real-device operator report on `2026-04-21`; live runtime now reaches ready/display state |
| `continue_once` | validated live | real-device operator report on `2026-04-21`; gameplay contract unchanged behind `rewardService` |
| `trial_unlock_arena` | validated live | live browser runtime probe reached `slot_visible`; real-device operator report on `2026-04-21` reported no visible issue |
| reward unavailable / loading fallback | validated live | earlier live probes reproduced `provider_loading`; current user-facing copy degrades safely |

## Current Live Variables
Current live H5 path requires these variables:
- `SPIN_CLASH_REWARD_ADAPTER=adsense_h5_rewarded`
- `SPIN_CLASH_ADSENSE_ENABLED=true`
- `SPIN_CLASH_ADSENSE_H5_ENABLED=true`
- `SPIN_CLASH_ADSENSE_H5_PUBLISHER_ID=<configured>`
- `SPIN_CLASH_ADSENSE_H5_DATA_AD_CLIENT=<configured>`
- `SPIN_CLASH_ADSENSE_H5_TEST_MODE=true`
- `SPIN_CLASH_ADSENSE_H5_PRELOAD=on`
- `SPIN_CLASH_ADSENSE_H5_SOUND=off`

## Commands And Checks
- `npm run check:providers`
- `npm run verify:release`
- live browser runtime inspection against:
  - `https://play.hakurokudo.com/`
- local `dist-static` browser probe with real CTA click under:
  - `SPIN_CLASH_ADSENSE_H5_PRELOAD=on`

## Outcome
- Status:
  - final rewarded-provider closeout complete
- Current primary provider path:
  - `adsense_h5_rewarded`
- Current fallback path retained:
  - `adsense_rewarded`
- Remaining work:
  - no longer rewarded-provider integration closeout
  - now shifts to monitoring fill behavior, completion rates, and economics
