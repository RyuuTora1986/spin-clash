# Provider Integration Notes

This project is intentionally mock-first.

The runtime must stay fully playable without live ad, share-card, or remote analytics providers.

## Current Status

Implemented today:
- local save persistence
- local analytics event buffer
- PostHog forwarding adapter behind `analyticsService`
- mock reward completion path
- browser-native share fallback
- explicit provider config in `src/config-providers.js`

Not implemented today:
- generated result-card image pipeline

## Reward Boundary

Current runtime entry:
- `src/reward-service.js`
- current provider config:
  - `src/config-providers.js`
  - optional deploy-time override:
    - `src/config-providers-override.js`
    - `src/config-providers-runtime.js`

Current gameplay callers:
- `double_reward`
- `continue_once`
- `trial_unlock_arena`

Architectural rule:
- gameplay code calls `rewardService.request(...)`
- reward-success branches must confirm `rewardService.wasGranted(result)`
- gameplay code does not talk to SDK globals directly
- provider-specific logic stays inside the reward service layer

Current mock behavior:
- resolves a successful reward by default
- can be switched in debug mode between:
  - `grant`
  - `deny`
  - `error`
- emits:
  - `reward_offer_show`
  - `reward_complete`
  - or `reward_decline`
- includes normalized analytics metadata:
  - `adapter`
  - `granted`
  - `resultValue`
  - `mockMode`

Current adapter config direction:
- `mock`
- reserved future path:
  - `adsense_rewarded`
- deploy-time override support now exists for static release packaging, so Pages deployments can switch providers without changing the committed base config
- committed prep-level placement allowlist now exists under:
  - `config.providers.reward.livePlacements`
- current approved live rewarded placements remain:
  - `double_reward`
  - `continue_once`
  - `trial_unlock_arena`

Current live-adapter behavior:
- first reward request can trigger GPT script loading and wait through that first load attempt
- if GPT cannot become usable, the service rejects cleanly with:
  - `provider_unavailable`
- if a placement is not allowlisted for live rewarded, the service now rejects cleanly with:
  - `placement_not_enabled`
- if GPT becomes reachable, the adapter now opens a real rewarded GPT slot request
- current live result mapping:
  - `rewardedSlotGranted` remembered until `rewardedSlotClosed`
  - `rewardedSlotClosed` after grant -> resolve `granted:true`
  - `rewardedSlotClosed` without grant -> resolve `granted:false`
  - unexpected provider/setup failures -> reject with a safe error
- debug/runtime inspection now exposes:
  - `rewardEnabled`
  - `allowedPlacements`
  - `rewardedAdUnitConfigured`
  - `lastAvailabilityReason`
  - `lastRequestReason`
  - `activePlacement`
- gameplay/UI callers can now use:
  - `rewardService.getFailureInfo(...)`
  - to normalize deny/loading/busy/unavailable/error states without duplicating provider-specific reason logic

If a real provider is added later, preserve this contract:

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

Success check helper:

```js
rewardService.wasGranted(result) -> boolean
```

## Share Boundary

Current runtime entry:
- `src/share-service.js`

Current behavior:
- normalizes `share_click` analytics payloads
- prefers `navigator.share(...)` when available
- falls back to clipboard or prompt copy flow

Architectural rule:
- callers pass structured result context
- share-service owns browser capability handling
- future image-card generation should plug in here, not in match-flow code

## Analytics Boundary

Current runtime entry:
- `src/analytics-service.js`
- current provider config:
  - `src/config-providers.js`

Current behavior:
- appends events into local save data
- keeps the latest `200`
- logs to console when debug mode is enabled
- supports explicit adapter selection:
  - `local_buffer`
  - `posthog`
- exposes runtime adapter state for debug inspection:
  - `ready`
  - `loading`
  - `lastForwardReason`
  - `initialized`
  - `queuedEvents`
- when PostHog forwarding is enabled but the SDK is not ready yet:
  - events stay locally buffered
  - the forward adapter can queue them in memory temporarily
  - the queue auto-flushes after the script loads and `posthog.init(...)` succeeds
- when PostHog load/init cannot become usable:
  - the service reports `posthog_unavailable`
  - the transient remote queue is cleared
  - the local event buffer remains the fallback source of truth
- each stored analytics event also carries a normalized forwarding result:
  - `local_only`
  - `posthog_loading`
  - `posthog_config_missing`
  - `posthog_unavailable`
  - or `{ forwarded:true }`

Architectural rule:
- gameplay and services emit normalized events through `analyticsService.track(...)`
- remote provider forwarding, if added later, must be additive
- event names should remain stable

Reference:
- `docs/analytics-events.md`

## Safe Future Integration Path

Recommended order:
1. Keep mock services as default.
2. Add provider adapters behind the same service interface.
3. Enable live providers only when host/platform support is confirmed.
4. Keep gameplay flows working when providers are unavailable.

Operational references:
- `docs/provider-preflight.md`
- `docs/provider-phase-plan.md`
- `docs/provider-phase-report-template.md`
- `docs/reward-provider-evaluation-sheet.md`
- `docs/analytics-sink-evaluation-sheet.md`

Validation references:
- `scripts/check-provider-services.js`
- `scripts/check-config.js`
- `scripts/check-debug-runtime-snapshots.js`
- `npm run check:providers`

## Unlock Boundary

Current storage shape already supports:
- `unlocks.arenas`
- `unlocks.tops`

Current runtime helper surface:
- `unlockArenaById(...)`
- `unlockTopById(...)`

That means future top unlocks should reuse the same persistence direction and the same normalized analytics family:
- `unlock_grant`

## Do Not Do

- Do not call ad SDK globals directly from UI handlers.
- Do not embed provider-specific payload schemas into gameplay code.
- Do not make share or reward flows block the core duel loop.
- Do not require a backend just to preserve current MVP behavior.
