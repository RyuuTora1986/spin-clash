# Reward Live Adapter Status

This document records the current state of the real reward-provider path.

## Chosen Provider Path
- chosen primary live reward path:
  - AdSense H5 rewarded through the Ad Placement API
- fallback live reward path:
  - Google Publisher Tag rewarded out-of-page slot through the AdSense / GAM web path
- locked adapter ids:
  - `adsense_h5_rewarded`
  - `adsense_rewarded`
- locked gameplay contract:
  - callers stay on `rewardService.request(placement, context)`
- locked placement scope for this adapter:
  - `double_reward`
  - `continue_once`
  - `trial_unlock_arena`

## Task 1 Acceptance Criteria
Task 1 is complete only if all of the following stay true:
- committed base config still defaults to `mock`
- live reward enablement only happens through provider config / deploy-time override
- `adsense_h5_rewarded` and `adsense_rewarded` remain the only supported real reward adapter ids
- unsupported reward adapter ids do not silently fall back to `mock`
- provider bootstrap, success, deny, timeout, and error paths stay normalized behind `rewardService`
- gameplay callers do not import GPT globals directly
- analytics integration remains unchanged by this task

## Current Runtime Entry
- `src/config-providers.js`
- `src/reward-service.js`
- optional deploy-time override:
  - `src/config-providers-override.js`
  - `src/config-providers-runtime.js`

## What Exists Now
- explicit reward adapter selection
- default `mock` adapter
- reserved live adapter paths:
  - `adsense_h5_rewarded`
  - `adsense_rewarded`
- explicit live rewarded placement allowlist in config:
  - `config.providers.reward.livePlacements`
- explicit reward-result helper:
  - `rewardService.wasGranted(result)`
- live adapter capability probe:
  - provider enabled or disabled
  - placement enabled or disabled
  - rewarded ad unit configured or missing
  - adapter id supported or unsupported
  - GPT script loading attempted or not
- shared provider-runtime helper for one-time script loading and script-ready waiting

## Runtime Boundary
Provider bootstrap:
- `rewardService` selects either:
  - `adsense_h5_rewarded`
  - `adsense_rewarded`
- H5 bootstrap stays inside `providerRuntime.initAdsenseH5(...)`
- GPT bootstrap stays inside `providerRuntime.loadScriptOnce(...)` and `providerRuntime.waitForScript(...)`
- the first request can wait through GPT script load instead of failing immediately while load is in flight
- if the configured reward adapter id is unsupported, the service exposes `provider_misconfigured` and rejects instead of switching to `mock`

Success callback path:
- GPT `rewardedSlotReady` calls `makeRewardedVisible()`
- GPT `rewardedSlotGranted` marks the request as granted
- GPT `rewardedSlotClosed` after a grant resolves:
  - `granted:true`

Deny path:
- GPT `rewardedSlotClosed` without a prior grant resolves:
  - `granted:false`
  - `reason:'slot_closed'`

Timeout path:
- if a rewarded request does not settle before the request timeout window, the service rejects:
  - `provider_timeout`

Error path:
- unsupported adapter id rejects:
  - `provider_misconfigured`
- non-allowlisted placement rejects:
  - `placement_not_enabled`
- disabled provider or missing ad unit reports unavailable through `isRewardAvailable(...)`
- GPT bootstrap or rewarded-slot setup failure rejects with a safe provider error such as:
  - `provider_unavailable`
- unsupported adapter debug state keeps `lastRequestReason:null` until a real request is attempted

## What The Live Adapters Do Today
If `adapter === 'adsense_h5_rewarded'`:
- `isRewardAvailable(placement)` returns a structured availability result
- `getAdapterInfo()` exposes H5 readiness state for debug inspection
- the adapter can report:
  - `provider_disabled`
  - `provider_misconfigured`
  - `placement_not_enabled`
  - `provider_loading`
  - `provider_timeout`
  - `provider_unavailable`
- the runtime bootstraps the AdSense H5 script once and calls page-level `adConfig(...)` once
- H5 test-mode is now supported through:
  - `SPIN_CLASH_ADSENSE_H5_TEST_MODE`
- rewarded completion semantics are normalized as:
  - `adViewed` -> resolves with `granted:true`
  - `adDismissed` -> resolves with `granted:false` and `reason:'slot_closed'`
  - `adBreakDone` with unavailable/timeout states -> rejects with a safe normalized provider error

If `adapter === 'adsense_rewarded'`:
- `isRewardAvailable(placement)` returns a structured availability result
- `getAdapterInfo()` exposes live adapter readiness state for debug inspection
- the adapter can report:
  - `provider_misconfigured`
  - `provider_disabled`
  - `placement_not_enabled`
  - `ad_unit_missing`
  - `provider_loading`
  - `provider_unavailable`
- `getAdapterInfo()` now also exposes:
  - `rewardEnabled`
  - `allowedPlacements`
  - `rewardedAdUnitConfigured`
- GPT script loading is attempted through the configured `scriptUrl`
- a first reward request can wait through that GPT load attempt instead of failing immediately while the script is still loading
- once GPT is ready, the adapter now issues a real rewarded out-of-page slot request through GPT
- the adapter listens for:
  - `rewardedSlotReady`
  - `rewardedSlotGranted`
  - `rewardedSlotClosed`
- the current result contract is now mapped as:
  - reward granted + slot closed -> resolves with `granted:true`
  - slot closed without grant -> resolves with `granted:false` and `reason:'slot_closed'`
  - request timeout -> rejects with `provider_timeout`
  - provider setup/load failure -> rejects with a safe error such as `provider_unavailable`
  - unsupported adapter id -> rejects with `provider_misconfigured` instead of granting through `mock`

## What The Live Adapter Does Not Do Yet
- does not yet handle richer provider failure semantics such as explicit no-fill reporting
- does not yet include production policy/eligibility validation for the actual AdSense account used by the project

## Live Validation Status On 2026-04-21
- current primary live path:
  - `adsense_h5_rewarded`
- current live preload mode:
  - `SPIN_CLASH_ADSENSE_H5_PRELOAD=on`
- validated live host:
  - `https://play.hakurokudo.com/`
- validated live runtime state before reward click:
  - `ready: true`
  - `rewardEnabled: true`
  - `rewardedAdUnitConfigured: true`
- validated live click-state after a real reward CTA click:
  - `lastRequestReason: "slot_visible"`
  - `activePlacement: "trial_unlock_arena"`
- supporting validation sources:
  - live browser runtime probe on `2026-04-21`
  - real-device operator validation on `iPhone 15 Pro Max` + `Chrome`

Practical meaning:
- the current H5 path is no longer blocked at bootstrap or preload readiness
- current live evidence is consistent with the rewarded flow entering the visible ad stage under a real user gesture

Current request result:
- if the configured reward adapter id is unsupported, request rejects with:
  - `provider_misconfigured`
- if GPT cannot become usable, request rejects with:
  - `provider_unavailable`
- if the rewarded slot request times out, request rejects with:
  - `provider_timeout`
- if the rewarded slot closes after a grant event:
  - the service resolves with `granted:true`
- if the rewarded slot closes without a grant event:
  - the service resolves with `granted:false`
  - `reason:'slot_closed'`

## Current Config Surface
Base config remains in `src/config-providers.js`.

For GitHub Pages deployment, the preferred path is now GitHub Actions repository variables instead of editing committed source.

Minimum live reward variables for AdSense H5:
- `SPIN_CLASH_REWARD_ADAPTER=adsense_h5_rewarded`
- `SPIN_CLASH_ADSENSE_ENABLED=true`
- `SPIN_CLASH_ADSENSE_H5_ENABLED=true`
- `SPIN_CLASH_ADSENSE_H5_PUBLISHER_ID=ca-pub-...`
- `SPIN_CLASH_ADSENSE_H5_DATA_AD_CLIENT=ca-pub-...`

Minimum live reward variables for GPT fallback:
- `SPIN_CLASH_REWARD_ADAPTER=adsense_rewarded`
- `SPIN_CLASH_ADSENSE_ENABLED=true`
- `SPIN_CLASH_ADSENSE_GPT_REWARDED_AD_UNIT_PATH=/YOUR_NETWORK_CODE/YOUR_REWARDED_UNIT`

The release build writes these values into the packaged `dist-static/src/config-providers-override.js`.

If you need a source-level example, the equivalent shape is:

```js
reward: {
  adapter: 'adsense_h5_rewarded',
  livePlacements: {
    double_reward: true,
    continue_once: true,
    trial_unlock_arena: true
  },
  adsense: {
    enabled: true,
    scriptUrl: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
    rewardedAdUnitPath: '',
    gamInterstitialAdUnitPath: '',
    h5: {
      enabled: true,
      scriptUrl: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
      publisherId: 'ca-pub-...',
      dataAdClient: 'ca-pub-...',
      testMode: false
    }
  }
}
```

## Validation
Run:

```powershell
npm run check:providers
npm run preflight
```

What this proves today:
- default mock mode still works
- committed live rewarded placement allowlist defaults stay locked
- disabled live adapter fails safely
- non-allowlisted live placements fail explicitly with `placement_not_enabled`
- unsupported live adapter ids fail explicitly instead of falling back into mock success
- unsupported adapter debug state no longer pretends a request already failed before first use
- enabled live adapter loads or probes safely
- first live request can wait through script load and still preserve the same service contract
- live rewarded slot events now map into the shared reward result shape
- live request timeout now has explicit regression coverage
- debug/runtime inspection now exposes operator-readable live reward state:
  - `rewardEnabled`
  - `allowedPlacements`
  - `rewardedAdUnitConfigured`
  - `lastAvailabilityReason`
  - `lastRequestReason`
  - `activePlacement`
- synchronous provider setup throws now normalize to `provider_unavailable` and clear in-flight request state
- synchronous `waitForScript(...)` bootstrap-helper throws now normalize to `provider_unavailable` and clear both the in-flight wait flag and the provider-runtime script loading state
- gameplay callers can now distinguish granted, declined, loading, busy, unavailable, and generic error outcomes through the shared reward failure helper
- service-layer contract remains intact

## Next Implementation Step
The next real code step is not a gameplay rewrite.
It is:
1. run manual browser validation against a real GPT/AdSense-supported environment and account
2. harden provider-specific edge cases such as no-fill, unsupported environment, and repeated-request behavior
3. keep mock mode as the default fallback until live validation is proven stable
