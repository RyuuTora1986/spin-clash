# Rewarded Ops Monitoring 2026-04-21

This document is the operator-facing monitoring sheet for the currently live rewarded setup.

It is not a design doc.

It tells the operator what to watch now that rewarded ads are live.

## Current Live Scope
- Provider path:
  - `adsense_h5_rewarded`
- Live placements:
  - `double_reward`
  - `continue_once`
  - `trial_unlock_arena`

## What To Measure First

### 1. Offer Rate
Question:
- how often does the player even see each reward CTA?

Primary events:
- `reward_offer_show`

Readout by placement:
- `double_reward`
- `continue_once`
- `trial_unlock_arena`

Meaning:
- if offer volume is too low, monetization is structurally capped before click-through even matters

### 2. Click / Request Rate
Question:
- when the CTA is shown, how often does the player actually ask for the reward?

Primary events:
- `reward_offer_show`
- `reward_request_start`

Core formula:
- request rate = `reward_request_start / reward_offer_show`

Meaning:
- low request rate usually means weak placement desirability, poor timing, or confusing reward value

### 3. Completion Rate
Question:
- once a request starts, how often does the reward actually settle successfully?

Primary events:
- `reward_request_start`
- `reward_complete`
- `reward_decline`

Core formula:
- reward completion rate = `reward_complete / reward_request_start`

Read by placement:
- `double_reward`
- `continue_once`
- `trial_unlock_arena`

Meaning:
- this is the first hard health metric for the live ad stack
- low completion with high request rate usually means provider/fill/readiness friction, not product disinterest

### 4. Failure Mix
Question:
- when reward requests fail, why do they fail?

Primary event:
- `reward_decline`

Break down by:
- `reason`
- `placement`
- device/browser where available from the analytics environment

Reasons to watch first:
- `provider_loading`
- `provider_timeout`
- `provider_unavailable`
- `slot_closed`

Meaning:
- `provider_loading` spikes usually indicate preload / readiness issues
- `provider_timeout` spikes usually indicate late-stage provider stall after request start
- `slot_closed` is a user-behavior outcome, not always a provider-health problem

## Placement-Specific KPIs

### `double_reward`
Primary commercial metric:
- `reward_complete / match_end`

Supporting metrics:
- `reward_offer_show / match_end`
- `reward_request_start / reward_offer_show`
- `reward_complete / reward_request_start`

Interpretation:
- this is likely the main rewarded revenue driver
- if this placement underperforms, total rewarded LTV will usually underperform too

### `continue_once`
Primary product-health metric:
- `continue_used / challenge_fail`

Supporting metrics:
- `reward_offer_show / challenge_fail`
- `reward_request_start / reward_offer_show`
- `reward_complete / reward_request_start`

Interpretation:
- this placement is trust-sensitive
- do not optimize it aggressively if it harms fairness perception or challenge clarity

### `trial_unlock_arena`
Primary funnel metric:
- `trial_unlock_complete / locked_arena_shortfall`

Supporting metrics:
- `reward_offer_show / locked_arena_shortfall`
- `reward_request_start / reward_offer_show`
- `reward_complete / reward_request_start`

Interpretation:
- this is a lower-volume placement
- its value is less about raw revenue and more about content sampling, retention, and unlock conversion support

## Minimum Dashboard Views

### Daily placement sheet
For each placement show:
- `reward_offer_show`
- `reward_request_start`
- `reward_complete`
- `reward_decline`
- request rate
- completion rate

### Daily failure sheet
For each placement show `reward_decline` grouped by:
- `reason`
- day

### Match-context sheet
For result-bound flows show:
- `match_end`
- `reward_offer_show`
- `reward_request_start`
- `reward_complete`

Group by:
- `mode`
- `arenaId`
- `playerTop`
- `roadRankId` when present

### Trial-unlock sheet
Show:
- `locked_arena_click`
- `locked_arena_shortfall`
- `reward_offer_show`
- `trial_unlock_start`
- `reward_request_start`
- `reward_complete`
- `trial_unlock_complete`

## Immediate Decision Rules

### Healthy
- `reward_complete / reward_request_start` is stable
- failure reasons are not dominated by provider-readiness failures
- `double_reward` request and completion rates are both healthy

### Needs provider investigation
- `provider_loading` dominates `reward_decline`
- `provider_timeout` rises after traffic/device shifts
- request rate is healthy but completion rate is weak

### Needs product tuning
- offer volume exists but request rate is weak
- one placement underperforms while others are healthy
- `trial_unlock_arena` volume is too low to matter

## Recommended Review Cadence
- daily:
  - completion rate by placement
  - failure mix by placement
- twice weekly:
  - request rate by placement
  - arena/top segmentation
- weekly:
  - update Baseline A/B/C assumptions using observed rates

## Linked References
- `docs/analytics-events.md`
- `docs/monetization/2026-04-21-adsense-h5-rewarded-baseline-model.md`
- `docs/provider-phase-report-2026-04-21-final.md`
