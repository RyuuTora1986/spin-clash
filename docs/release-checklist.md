# Release Checklist

Use this before treating the current static build as a deployable iteration.

Companion reference:
- `docs/manual-test-batches.md`
- `docs/host-validation-plan.md`

## Runtime Gate
- `npm install`
- `npm run verify:release`
- `npm run check:syntax`
- `npm run check:repo`
- `npm run check:docs`
- `npm run check:dom`
- `npm run check:config`
- `npm run check:analytics`
- `npm run check:ui`
- `npm run serve`
- open `http://127.0.0.1:8000/index.html`
- open `http://127.0.0.1:8000/index.html?debug=1`
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
- Hex Bowl can be trialed when locked
- Hex Bowl can be permanently unlocked
- unlocked arena persists after reload

## Service Gate
- share action opens browser share or fallback copy path
- double reward path completes without breaking result flow
- continue reward path retries the current Challenge Road node
- debug panel actions mutate state as expected
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
  - `reward_complete`
  - `reward_decline`
  - `trial_unlock_start`
  - `trial_unlock_complete`
  - `continue_used`
- share:
  - `share_click`
- unlock:
  - `unlock_grant`
  - `unlock_purchase`

Reference:
- `docs/analytics-events.md`

## Provider Gate
- build remains fully playable with mock services only
- no gameplay code calls provider SDK globals directly
- reward/share/analytics integration still routes through service modules

Reference:
- `docs/launch-blockers.md`
- `docs/deployment-notes.md`
- `docs/provider-integration-notes.md`
