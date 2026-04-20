# Provider Recommendation 2026-04-17

This document narrows the next provider-phase work to the smallest realistic first pass for the current static-web game shell.

## Summary

Recommended first provider path:
1. reward path: Google AdSense rewarded / offerwall path for web validation
2. analytics sink: PostHog JavaScript web SDK for custom gameplay events

Why this pair:
- both can be integrated from the client side without adding gameplay backend infrastructure
- reward and analytics can stay behind the existing `RewardService` and `AnalyticsService`
- this keeps the project aligned with the current static-host-only scope

## Reward Provider Recommendation

### Recommended first path
- provider: Google AdSense
- reason:
  - it is web-native rather than app-package-native
  - it matches the current static site deployment model better than mobile ad SDK paths
  - it is the cheapest first real monetization validation path for a browser game shell

### Important fit caveat
- this path should be treated as a validation target first, not a guaranteed final monetization answer
- the actual available rewarded surface and account eligibility need to be checked in the AdSense account used for the project
- if the account or placement constraints do not fit the existing result-screen / continue / trial UX, keep the current mock adapter and switch to the next provider candidate instead of rewriting gameplay callers

### Implementation rule
- keep callers unchanged:

```js
rewardService.request(placement, context)
```

- only the adapter changes

### Official references
- Google AdSense offerwall overview:
  - `https://support.google.com/adsense/answer/13860639`
- Google Publisher Tag rewarded / game manual interstitial documentation:
  - `https://developers.google.com/publisher-tag/samples/display-rewarded-ad`
  - `https://developers.google.com/publisher-tag/samples/display-gaming-interstitial-ad`

## Analytics Provider Recommendation

### Recommended first path
- provider: PostHog Cloud JavaScript SDK
- reason:
  - it supports direct client-side custom event capture
  - it fits the current event model better than pageview-only analytics products
  - it can ingest the existing gameplay event families with minimal service-layer translation

### Why not use a pageview-only analytics product first
- the current project already needs event surfaces such as:
  - `match_start`
  - `match_end`
  - `challenge_fail`
  - `reward_complete`
  - `share_click`
- pageview-first analytics can help with traffic measurement, but they do not replace custom gameplay telemetry

### Implementation rule
- keep callers unchanged:

```js
analyticsService.track(eventName, payload)
```

- add one forwarding adapter under the service layer
- keep local buffering/export available even after remote forwarding is added

### Official references
- PostHog JavaScript installation:
  - `https://posthog.com/docs/libraries/js`
- PostHog custom event capture:
  - `https://posthog.com/docs/product-analytics/capture-events`

## Fallback Decision Rules

If the reward path fails for account, policy, or placement-fit reasons:
1. keep the mock reward adapter active
2. record the exact mismatch
3. evaluate the next web-native reward path without changing gameplay callers

If the analytics path fails for privacy, cost, or operational reasons:
1. keep local analytics buffering active
2. leave the forwarding adapter optional
3. evaluate a second sink after one real event-forwarding attempt is understood

## Recommended Next Work
1. add a provider-selection outcome report
2. implement `RewardService` provider adapter behind a feature flag or config switch
3. implement `AnalyticsService` forwarding adapter behind a feature flag or config switch
