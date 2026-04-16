# Provider Integration Notes

This project is intentionally mock-first.

The runtime must stay fully playable without live ad, share-card, or remote analytics providers.

## Current Status

Implemented today:
- local save persistence
- local analytics event buffer
- mock reward completion path
- browser-native share fallback

Not implemented today:
- live rewarded ad SDK
- remote analytics sink
- generated result-card image pipeline

## Reward Boundary

Current runtime entry:
- `src/reward-service.js`

Current gameplay callers:
- `double_reward`
- `continue_once`
- `trial_unlock_arena`

Architectural rule:
- gameplay code calls `rewardService.request(...)`
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

If a real provider is added later, preserve this contract:

```js
rewardService.request(placement, context) -> Promise<{
  placement,
  adapter,
  granted,
  context,
  resultValue,
  reason?
}>
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

Current behavior:
- appends events into local save data
- keeps the latest `200`
- logs to console when debug mode is enabled

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
