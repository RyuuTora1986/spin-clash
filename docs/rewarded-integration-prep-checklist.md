# Rewarded Integration Prep Checklist

This checklist is the operator path for the rewarded preparation slice.

It explains what is already closed, what to inspect, and what still remains before real manual validation.

## 1. What This Prep Slice Does

This slice hardens the rewarded integration surface without pretending that live monetization is already proven.

Closed in this slice:
- committed base config stays mock-first
- live rewarded placement scope is explicitly locked
- live rewarded failure reasons are normalized
- debug/runtime inspection exposes operator-readable reward state
- provider regression coverage now checks the prep layer

## 2. What This Prep Slice Does Not Do

This slice does not prove:
- real fill
- AdSense account eligibility
- final launch readiness
- public monetization approval
- broader placement rollout beyond the approved three placements

## 3. Required Live Reward Config

Committed base config remains:

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

For a live reward validation deployment, all of the following must be true:
- `reward.adapter === 'adsense_rewarded'`
- `reward.adsense.enabled === true`
- `reward.adsense.rewardedAdUnitPath` is non-empty

For GitHub Pages, this is normally supplied through:
- `SPIN_CLASH_REWARD_ADAPTER=adsense_rewarded`
- `SPIN_CLASH_REWARD_ENABLED=true`
- `SPIN_CLASH_REWARDED_AD_UNIT_PATH=/YOUR_NETWORK_CODE/YOUR_REWARDED_UNIT`

## 4. Approved Live Rewarded Placements

Only these placements are approved in the current prep slice:
- `double_reward`
- `continue_once`
- `trial_unlock_arena`

If another placement tries to use the live adapter, the service should fail safely with:
- `placement_not_enabled`

## 5. How To Tell Mock Or Live State

Check the runtime/debug provider snapshot.

Reward fields to inspect:
- `rewardAdapter`
- `rewardEnabled`
- `rewardReady`
- `rewardLoading`
- `rewardAllowedPlacements`
- `rewardedAdUnitConfigured`
- `rewardAvailabilityReason`
- `rewardRequestReason`
- `rewardActivePlacement`

Interpretation:
- `rewardAdapter: "mock"` means the release is still using safe mock mode
- `rewardAdapter: "adsense_rewarded"` plus `rewardEnabled: true` means live reward mode is configured
- `rewardedAdUnitConfigured: false` means the build/runtime config is still incomplete
- `rewardAllowedPlacements` must contain exactly the approved live placements for this slice

## 6. Common Failure Reasons

- `provider_disabled`
  - live adapter selected but live reward is not enabled
- `placement_not_enabled`
  - this placement is not approved for live rewarded in the current config
- `ad_unit_missing`
  - live reward is enabled but no rewarded ad unit path is configured
- `provider_loading`
  - GPT is still loading or the first request is still waiting for GPT
- `provider_unavailable`
  - GPT failed to become usable or provider setup failed
- `request_in_flight`
  - another live reward request is already running
- `provider_timeout`
  - the live rewarded request did not settle in time
- `slot_closed`
  - the rewarded slot closed without a grant
- `provider_misconfigured`
  - an unsupported reward adapter id was configured

Failure bucket intent:
- loading
- busy
- unavailable
- declined
- error

## 7. Verification Commands

Run:

```powershell
npm run check:providers
npm run preflight
```

Prep-level proof expected from these checks:
- base config still defaults to mock
- live placement allowlist defaults are present
- non-allowlisted live placements reject with `placement_not_enabled`
- debug/runtime snapshot exposes the reward prep state
- live reward provider contract still stays behind `rewardService`

## 8. What Still Remains After This Prep Slice

Still open after this checklist passes:
- real browser validation on the target deployed host
- real AdSense/GPT rewarded account eligibility confirmation
- custom-domain HTTPS readiness if public launch uses the branded domain
- final rewarded manual validation evidence capture

That next phase should be treated as a separate validation task, not folded back into this prep slice.
