# PostHog Dashboard Spec 2026-04-23

This document defines the smallest useful PostHog dashboard setup for `Spin Clash` with the current event surface.

It is optimized for:
- rewarded-ad health
- core gameplay health
- progression and economy signals

It intentionally avoids:
- custom backend dependencies
- revenue events the game does not really have yet
- session replay cost as a default dependency

## 1. Scope

Use PostHog Product Analytics only for the first dashboard pass.

Keep these defaults:
- `capturePageview: false`
- `autocapture: false`
- `disableSessionRecording: true`

Why:
- the current project already has explicit gameplay events
- the question right now is product health and reward health, not generic web analytics
- replay can be enabled later only if debugging justifies the extra volume/cost

Reference:
- `docs/posthog-setup.md`
- `docs/analytics-events.md`
- `docs/monetization/2026-04-21-rewarded-ops-monitoring.md`
- `docs/monetization/2026-04-23-posthog-dashboard-manifest.json`

## 2. Dashboard Structure

Create two dashboards.

### Dashboard A
- name:
  - `Spin Clash - Reward Ops`
- purpose:
  - answer whether rewarded is healthy enough to matter commercially

### Dashboard B
- name:
  - `Spin Clash - Core Loop`
- purpose:
  - answer whether players are actually reaching the moments where rewarded can monetize

If time is tight, build Dashboard A first and delay Dashboard B.

## 3. Dashboard A: Reward Ops

### Tile 1. Reward offers by placement
- insight type:
  - trends
- events:
  - `reward_offer_show`
- breakdown:
  - `placement`
- interval:
  - daily

Question answered:
- how much monetizable opportunity each placement actually generates

### Tile 2. Reward requests by placement
- insight type:
  - trends
- events:
  - `reward_request_start`
- breakdown:
  - `placement`
- interval:
  - daily

Question answered:
- when players see the CTA, do they actually ask for the reward

### Tile 3. Reward completions by placement
- insight type:
  - trends
- events:
  - `reward_complete`
- breakdown:
  - `placement`
- interval:
  - daily

Question answered:
- which placement is generating actual completed rewarded views

### Tile 4. Reward declines by reason
- insight type:
  - trends or table
- events:
  - `reward_decline`
- breakdown:
  - `reason`
- filter:
  - optional second breakdown by `placement`

Question answered:
- are failures mostly product-side or provider-side

### Tile 5. Offer -> request -> complete funnel
- insight type:
  - funnel
- steps:
  - `reward_offer_show`
  - `reward_request_start`
  - `reward_complete`
- breakdown:
  - `placement`

Question answered:
- where the real drop-off is for each rewarded placement

### Tile 6. Continue reward application health
- insight type:
  - funnel
- steps:
  - `challenge_fail`
  - `reward_offer_show` filtered to `placement='continue_once'`
  - `reward_request_start` filtered to `placement='continue_once'`
  - `reward_complete` filtered to `placement='continue_once'`
  - `continue_used`

Question answered:
- does rewarded continue actually convert into gameplay continuation

### Tile 7. Trial unlock application health
- insight type:
  - funnel
- steps:
  - `locked_arena_shortfall`
  - `reward_offer_show` filtered to `placement='trial_unlock_arena'`
  - `reward_request_start` filtered to `placement='trial_unlock_arena'`
  - `reward_complete` filtered to `placement='trial_unlock_arena'`
  - `trial_unlock_complete`

Question answered:
- does the trial-arena placement actually function as a content sampling funnel

### Tile 8. Placement x mode table
- insight type:
  - table / trends
- event:
  - `reward_complete`
- breakdown:
  - `placement`
  - `context.mode` if the property arrives nested and queryable
  - otherwise fallback to event property views from `reward_offer_show.mode`

Question answered:
- where rewarded is actually working best by gameplay mode

## 4. Reward Dashboard Decision Rules

### Healthy
- `reward_complete` is stable
- `reward_decline` is not dominated by:
  - `provider_loading`
  - `provider_timeout`
  - `provider_unavailable`

### Needs provider investigation
- request volume is healthy but completions are weak
- provider failure reasons dominate declines

### Needs product tuning
- offer volume exists but requests are weak
- one placement is much weaker than the others in request rate

## 5. Dashboard B: Core Loop

### Tile 1. Session starts
- insight type:
  - trends
- events:
  - `session_start`
  - `return_session`
- interval:
  - daily

Question answered:
- is there enough real traffic to even interpret monetization data

### Tile 2. Match starts vs match ends
- insight type:
  - trends
- events:
  - `match_start`
  - `match_end`
- breakdown:
  - `mode`

Question answered:
- are players reaching result screens consistently

### Tile 3. Challenge fail vs challenge clear
- insight type:
  - trends
- events:
  - `challenge_fail`
  - `challenge_clear`
- interval:
  - daily

Question answered:
- how often the continue-on-loss placement should naturally occur

### Tile 4. Match-end segmentation
- insight type:
  - table
- event:
  - `match_end`
- breakdown:
  - `mode`
  - `arenaId`
  - `playerTop`
  - `roadRankId`

Question answered:
- which content slices generate the most result-screen volume

### Tile 5. Progression checkpoints
- insight type:
  - trends
- events:
  - `championship_checkpoint`
  - `unlock_purchase`
  - `research_purchase`

Question answered:
- whether players are advancing or stalling before monetization can deepen

## 6. Naming And Saved Insight List

Create saved insights with exact names like:
- `Reward Offers by Placement`
- `Reward Requests by Placement`
- `Reward Completions by Placement`
- `Reward Declines by Reason`
- `Reward Offer Request Complete Funnel`
- `Continue Once Reward Funnel`
- `Trial Unlock Reward Funnel`
- `Session Starts and Returns`
- `Match Starts vs Match Ends`
- `Challenge Fail vs Clear`
- `Match End Segmentation`
- `Progression Checkpoints and Purchases`

This matters because later notes and reviews can reference the saved insight names directly.

## 7. Property Conventions

Prioritize these properties for breakdowns:
- `placement`
- `reason`
- `mode`
- `arenaId`
- `playerTop`
- `roadRankId`
- `challengeNodeId`

When properties are missing on one event family:
- do not fake them
- instead use the nearest adjacent event that really carries the property

Example:
- `reward_request_start` may not be the easiest place to break down by gameplay mode
- use `reward_offer_show.mode` or `match_end.mode` instead when needed

## 8. Ratio Handling

If the current PostHog plan/UI supports formulas cleanly:
- compute:
  - request rate = `reward_request_start / reward_offer_show`
  - completion rate = `reward_complete / reward_request_start`

If formula support is awkward or unclear:
- keep numerator and denominator as side-by-side tiles
- do not waste time forcing dashboard math before traffic exists

This is important:
- the goal is operator clarity
- not perfect BI elegance

## 9. What Not To Put On The Dashboard Yet

Do not build these yet:
- fake revenue totals
- ARPDAU charts
- LTV charts
- provider payout estimates inside PostHog
- session replay as a default tile

Why:
- the game does not yet emit real ad revenue events
- current traffic is too early for serious LTV interpretation
- replay costs more and should stay opt-in

## 10. Weekly Review Routine

### Daily
- check:
  - `Reward Completions by Placement`
  - `Reward Declines by Reason`

### Twice weekly
- check:
  - `Reward Offer Request Complete Funnel`
  - `Continue Once Reward Funnel`
  - `Trial Unlock Reward Funnel`

### Weekly
- check:
  - `Match End Segmentation`
  - `Progression Checkpoints and Purchases`
- then update monetization assumptions in:
  - `docs/monetization/2026-04-21-adsense-h5-rewarded-baseline-model.md`

## 11. Immediate Next Step

Build the first 5 tiles of `Spin Clash - Reward Ops` first.

That is enough to answer the current business question:
- is rewarded failing because of provider health, player behavior, or just low traffic
