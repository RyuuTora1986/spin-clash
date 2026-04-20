# Services Plan

## StorageService
Responsibilities:
- Versioned local save reads and writes.
- Default state bootstrap.
- Migration hooks for future schema changes.
- Clear separation between profile data and run/session data.

Suggested surface:
```js
loadProfile()
saveProfile(profile)
loadRunState()
saveRunState(runState)
resetProfile()
getVersion()
```

Stored data should include:
- unlocked tops
- unlocked arenas
- soft currency
- challenge progress
- settings
- analytics opt state if needed later
- last session metadata

## RewardService
Responsibilities:
- One interface for rewarded-value exchange.
- Runtime selection between mock adapter and future provider adapter.
- Explicit lifecycle events so gameplay code never talks to provider SDKs directly.

Suggested surface:
```js
isRewardAvailable(placementId)
showReward(placementId)
getAdapterInfo()
```

Placements:
- `continue_once`
- `trial_unlock`
- `double_reward`

Initial adapter strategy:
- `MockRewardAdapter` resolves after a short simulated watch flow.
- `NullRewardAdapter` cleanly reports unavailable.
- Future adapters can wrap host-specific rewarded video SDKs.

Current implementation note:
- the live `adsense_rewarded` path now waits through the first GPT script load attempt and then issues a real GPT rewarded slot request
- current live result mapping:
  - granted reward + slot close -> `granted:true`
  - slot close without grant -> `granted:false`
  - provider/setup failure -> safe rejection such as `provider_unavailable`
- reward failure normalization is now shared through `rewardService.getFailureInfo(...)` so gameplay/UI flows can react consistently
- gameplay callers still do not change

## ShareService
Responsibilities:
- Build share payloads for result moments.
- Prefer Web Share API where available.
- Fall back to clipboard or download.

Current implementation note:
- result shares now build a lightweight SVG result card through `src/share-card-tools.js`
- preferred runtime path is:
  - Web Share file share when supported
  - Web Share text share
  - SVG card download plus copied text fallback
- non-result shares still use text-only fallback behavior

Suggested surface:
```js
canShare(kind)
shareResultCard(payload)
shareChallengePrompt(payload)
copyShareText(payload)
```

## AnalyticsService
Responsibilities:
- Track event payloads through one inspectable interface.
- Log locally in development and optionally forward later.
- Avoid polluting gameplay code with vendor logic.

Current implementation status:
- Implemented now:
  - `session_start`
  - `session_end`
  - `return_session`
  - `match_start`
  - `match_end`
  - `challenge_node_start`
  - `challenge_fail`
  - `challenge_clear`
  - `reward_offer_show`
  - `reward_complete`
  - `reward_decline`
  - `trial_unlock_start`
  - `trial_unlock_complete`
  - `continue_used`
  - `share_click`
  - `share_complete`
  - `unlock_grant`
  - `unlock_purchase`
  - reward analytics now include `adapter`, `granted`, and `resultValue` metadata in the mock path
  - save shape now supports both `unlocks.arenas` and `unlocks.tops`
  - provider config is now explicit in `src/config-providers.js`
  - analytics adapter selection is now explicit in `src/analytics-service.js`
  - reward adapter selection is now explicit in `src/reward-service.js`
  - PostHog queued events now auto-flush after script load instead of requiring a second gameplay event
  - adapter info now exposes:
    - `ready`
    - `loading`
    - `lastForwardReason`
    - `initialized`
    - `queuedEvents`
Reference:
- `docs/analytics-events.md`

Minimum events:
- `session_start`
- `session_end`
- `return_session`
- `match_start`
- `match_end`
- `challenge_node_start`
- `challenge_fail`
- `challenge_clear`
- `reward_offer_show`
- `reward_complete`
- `reward_decline`
- `trial_unlock_start`
- `trial_unlock_complete`
- `share_click`
- `share_complete`
- `unlock_grant`
- `unlock_purchase`

Suggested surface:
```js
track(eventName, payload)
flush()
getBufferedEvents()
clearBufferedEvents()
```

## Debug / Tuning Surface
Responsibilities:
- Enable `?debug=1` features only in developer mode.
- Inspect live config, save state, and analytics buffers.
- Allow temporary tuning overrides for local testing.
- Export and import debug config snapshots.

MVP features:
- show current mode, node, top stats, cooldowns, and economy values
- trigger reward mock placements
- trigger share mock payload preview
- inspect save JSON
- inspect analytics event log

Current lightweight implementation status:
- inspectable state snapshot in the debug panel
- save export via `COPY SAVE`
- save import via `IMPORT SAVE`
- legacy save migration and save-shape normalization now run through `src/storage-service.js`
- analytics export via `COPY EVENTS`
- tuning export via `COPY TUNING`
- tuning import via `IMPORT TUNING`
- baseline restore via `RESET TUNING`
- reward mock-mode switching via `REWARD GRANT`, `REWARD DENY`, and `REWARD ERROR`
- analytics reset via `CLEAR EVENTS`
- mock reward trigger via `MOCK REWARD`
- mock share trigger via `MOCK SHARE`

## Future Provider Integration Points
- Reward adapters can later map to ad-network SDK wrappers.
- Analytics adapter can later forward to GA4, custom endpoint, or ad-platform measurement layer.
- Share adapter can later support image rendering refinement without touching game logic.

## Architectural Rule
Gameplay code should emit intents and events. Services should handle platform specifics. That separation is what keeps the static build portable.

