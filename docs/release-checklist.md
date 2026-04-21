# Release Checklist

Use this before treating the current static build as a deployable iteration.

Companion reference:
- `docs/manual-test-batches.md`
- `docs/host-validation-plan.md`

## Current Release Interpretation
- The repository is currently suitable for:
  - local/manual iteration
  - deployed host validation
  - limited external testing with the safe default provider configuration
- The repository is not yet ready for:
  - a final monetized public release with live rewarded ads and remote analytics treated as production-ready

Reason:
- reward and analytics service-layer integrations now exist
- committed base config still defaults to:
  - `reward.adapter = 'mock'`
  - `analytics.adapter = 'local_buffer'`
- live provider use remains deploy-time override driven and still needs final live/manual closeout

## Runtime Gate
- `npm install`
- `npm run verify:release`
- `npm run check:syntax`
- `npm run check:repo`
- `npm run check:docs`
- `npm run check:dom`
- `npm run check:config`
- `npm run check:analytics`
- `npm run check:storage`
- `npm run check:debugservice`
- `npm run check:loadout`
- `npm run check:session`
- `npm run check:ui`
- `npm run serve`
- open the exact `Open:` URL printed in the terminal
- open the exact `Debug:` URL printed in the terminal
- if persistence mode is not `local`, verify the runtime warning banner is visible and accurate
- verify runtime entry files do not depend on remote Google Fonts

## Core Flow Gate
- title screen renders
- `ENTER BATTLE` reaches loadout
- `Quick Battle` and `Challenge Road` both switch correctly
- arena selection responds
- top selection responds
- match start works
- battle renders tops and arena
- drag launch works
- match can finish and return a result screen

## Progression Gate
- Challenge Road can enter a node
- Challenge Road win advances the road
- Challenge Road top reward node can permanently unlock its top reward
- Challenge Road loss can show continue flow
- result reward increases SCRAP
- locked top can be purchased and stays unlocked after reload
- Shard Hex Array can be trialed when locked
- Shard Hex Array can be permanently unlocked
- unlocked arena persists after reload

## Service Gate
- share action opens browser share or falls back to result-card SVG download plus copied text
- double reward path completes without breaking result flow
- continue reward path retries the current Challenge Road node
- debug panel actions mutate state as expected
- debug panel action failures surface as readable status messages
- debug `COPY SAVE`, `IMPORT SAVE`, `COPY EVENTS`, `REWARD GRANT`, `REWARD DENY`, `REWARD ERROR`, `CLEAR EVENTS`, `MOCK SHARE`, and `MOCK REWARD` actions behave as expected
- save reset works

## Analytics Gate
Inspect local analytics buffer or debug console and confirm these event families appear during normal play:

- session:
  - `session_start` or `return_session`
  - `session_end`
- match:
  - `match_start`
  - `match_end`
- challenge:
  - `challenge_node_start`
  - `challenge_fail`
  - `challenge_clear`
- reward:
  - `reward_offer_show`
  - `reward_request_start`
  - `reward_complete`
  - `reward_decline`
  - `locked_arena_click`
  - `locked_arena_shortfall`
  - `trial_unlock_start`
  - `trial_unlock_complete`
  - `continue_used`
- share:
  - `share_click`
  - `share_complete`
- unlock:
  - `unlock_grant`
  - `unlock_purchase`

Reference:
- `docs/analytics-events.md`

## Provider Gate
- build remains fully playable with mock services only
- no gameplay code calls provider SDK globals directly
- reward/share/analytics integration still routes through service modules
- canonical reward live variable names are used for new deploys:
  - `SPIN_CLASH_REWARD_ADAPTER`
  - `SPIN_CLASH_ADSENSE_ENABLED`
- if enabling live rewarded ads for a release build:
  - H5 primary path:
    - `SPIN_CLASH_REWARD_ADAPTER=adsense_h5_rewarded`
    - `SPIN_CLASH_ADSENSE_ENABLED=true`
    - `SPIN_CLASH_ADSENSE_H5_ENABLED=true`
    - `SPIN_CLASH_ADSENSE_H5_PUBLISHER_ID` is set
    - `SPIN_CLASH_ADSENSE_H5_DATA_AD_CLIENT` is set
  - GPT fallback path:
    - `SPIN_CLASH_REWARD_ADAPTER=adsense_rewarded`
    - `SPIN_CLASH_ADSENSE_ENABLED=true`
    - `SPIN_CLASH_ADSENSE_GPT_REWARDED_AD_UNIT_PATH` is set
- if enabling PostHog forwarding for a release build:
  - `SPIN_CLASH_ANALYTICS_ADAPTER=posthog`
  - `SPIN_CLASH_ANALYTICS_ENABLE_FORWARDING=true`
  - `SPIN_CLASH_POSTHOG_ENABLED=true`
  - `SPIN_CLASH_POSTHOG_PROJECT_API_KEY` is set
- if any live provider override is enabled:
  - validate it on the real deployed host/browser before treating it as launch-ready

Reference:
- `docs/launch-blockers.md`
- `docs/deployment-notes.md`
- `docs/provider-integration-notes.md`
