# AdSense H5 Rewarded Baseline Model

## Scope

This document defines the initial operator-facing math model for the three approved rewarded placements:
- `double_reward`
- `continue_once`
- `trial_unlock_arena`

It is intentionally player-experience-first.

It does not justify adding forced ads, interstitial ads, or extra placements.

## Player-Flow Trigger Map

### `double_reward`

Player position:
- after a completed match
- on the `matchResult` screen
- after the base reward is already visible

Player interpretation:
- "watch a video to double the reward I already earned"

Frequency ceiling from current code:
- one visible CTA per result context
- one request per result context
- one grant per result context
- the daily ceiling is effectively the number of completed matches that reach `showMatchResult()`

Experience risk:
- lowest friction
- highest repeat frequency
- likely largest contributor to early revenue
- also the first placement that will fatigue players if the accept rate is pushed too hard

### `continue_once`

Player position:
- after a Challenge loss
- on the `matchResult` loss surface
- only while continue is still unused in that challenge flow

Player interpretation:
- "watch a video to save this run"

Frequency ceiling from current code:
- one visible CTA per failed Challenge result context
- one request per failed Challenge result context
- one successful continue application per failed Challenge result context
- current runtime `challengeContinueLimit` is effectively bounded to one

Experience risk:
- highest emotional sensitivity
- lower volume than `double_reward`
- stronger retention leverage than direct revenue leverage
- if this feels unreliable, player trust drops immediately

### `trial_unlock_arena`

Player position:
- in Quick Battle shell
- after the player taps a locked arena
- only when permanent unlock is unaffordable

Player interpretation:
- "watch a video to temporarily try this arena"

Frequency ceiling from current code:
- only on locked arena exploration
- only after affordability shortfall
- session access is temporary and session-limited by arena id
- current UI makes this practically low-volume because the visible locked-arena path is narrow

Experience risk:
- lowest frequency
- low frustration when clearly presented
- small direct revenue contribution
- better understood as a curiosity/conversion valve than a yield driver

## Baseline A: Real-Current Measurement Model

This baseline is constrained by what the repo can actually measure today.

### Stable identifiers now available

- `result_context_id`
- `reward_attempt_id`
- `trial_unlock_context_id`

These identifiers let us correlate:
- result surface exposure
- reward CTA visibility
- request start
- completion or decline

### Current denominator-quality events

For result-bound rewards:
- `match_end`
- `challenge_fail`
- `reward_offer_show`
- `reward_request_start`
- `reward_complete`
- `reward_decline`
- `continue_used`

For arena-trial rewards:
- `locked_arena_click`
- `locked_arena_shortfall`
- `reward_offer_show`
- `trial_unlock_start`
- `reward_request_start`
- `reward_complete`
- `reward_decline`
- `trial_unlock_complete`

### Real-current formulas

#### `double_reward`

- `M_end = count(match_end)`
- `O_dr = count(reward_offer_show where placement='double_reward')`
- `R_dr = count(reward_request_start where placement='double_reward')`
- `C_dr = count(reward_complete where placement='double_reward')`
- `D_dr = count(reward_decline where placement='double_reward')`

Derived:
- `offer_rate_dr = O_dr / M_end`
- `request_rate_dr = R_dr / O_dr`
- `grant_rate_dr = C_dr / R_dr`
- `decline_rate_dr = D_dr / R_dr`

Expected current interpretation:
- `offer_rate_dr` should stay very close to `1.0` whenever the result surface is valid and the reward button is not already consumed

#### `continue_once`

- `L_co = count(challenge_fail)`
- `O_co = count(reward_offer_show where placement='continue_once')`
- `R_co = count(reward_request_start where placement='continue_once')`
- `C_co = count(reward_complete where placement='continue_once')`
- `D_co = count(reward_decline where placement='continue_once')`
- `U_co = count(continue_used)`

Derived:
- `offer_rate_co = O_co / L_co`
- `request_rate_co = R_co / O_co`
- `grant_rate_co = C_co / R_co`
- `apply_rate_co = U_co / C_co`

Expected current interpretation:
- `apply_rate_co` should stay close to `1.0`
- if `C_co` rises but `U_co` does not, the gameplay follow-through is broken

#### `trial_unlock_arena`

- `K_t = count(locked_arena_click)`
- `S_t = count(locked_arena_shortfall)`
- `O_t = count(reward_offer_show where placement='trial_unlock_arena')`
- `T_s = count(trial_unlock_start)`
- `R_t = count(reward_request_start where placement='trial_unlock_arena')`
- `C_t = count(reward_complete where placement='trial_unlock_arena')`
- `D_t = count(reward_decline where placement='trial_unlock_arena')`
- `T_c = count(trial_unlock_complete)`

Derived:
- `shortfall_rate_t = S_t / K_t`
- `offer_rate_t = O_t / S_t`
- `request_rate_t = R_t / O_t`
- `grant_rate_t = C_t / R_t`
- `apply_rate_t = T_c / C_t`

Expected current interpretation:
- `offer_rate_t` should stay close to `1.0`
- `apply_rate_t` should stay close to `1.0`

### Revenue roll-up from live data

If live placement-specific yield is known:

- `Revenue_dr = C_dr / 1000 * E_dr`
- `Revenue_co = C_co / 1000 * E_co`
- `Revenue_t = C_t / 1000 * E_t`
- `Revenue_total = Revenue_dr + Revenue_co + Revenue_t`

If only blended yield is known:

- `Revenue_total_blended = (C_dr + C_co + C_t) / 1000 * E_blended`

## Baseline B: Product-Planning Model

This baseline is assumption-driven and should be used before meaningful production volume exists.

### Variables

- `D`: DAU
- `S`: sessions per DAU per day
- `M`: completed matches per session
- `rho`: result-screen reach rate
- `C`: Challenge match share
- `F`: Challenge failure rate
- `U`: locked-arena shortfall attempts per DAU per day
- `A_i`: CTA accept rate for placement `i`
- `G_i`: provider grant/completion rate for placement `i`
- `E_i`: effective revenue per 1000 completed rewarded views for placement `i`

### Offer formulas

- `O_dr = D * S * M * rho`
- `O_co = D * S * M * C * F`
- `O_t = D * U`

### Request formulas

- `R_dr = O_dr * A_dr`
- `R_co = O_co * A_co`
- `R_t = O_t * A_t`

### Completion formulas

- `C_dr = R_dr * G_dr`
- `C_co = R_co * G_co`
- `C_t = R_t * G_t`

### Revenue formulas

- `Revenue_dr = C_dr / 1000 * E_dr`
- `Revenue_co = C_co / 1000 * E_co`
- `Revenue_t = C_t / 1000 * E_t`
- `Revenue_total = Revenue_dr + Revenue_co + Revenue_t`

## Initial Scenario Assumptions

These are planning assumptions, not observed production data.

### Conservative

- `D=500`
- `S=1.2`
- `M=4.0`
- `rho=0.95`
- `C=0.22`
- `F=0.38`
- `U=0.06`
- accept: `A_dr=0.16`, `A_co=0.26`, `A_t=0.18`
- grant: `G_dr=0.72`, `G_co=0.74`, `G_t=0.70`

### Base

- `D=1500`
- `S=1.5`
- `M=4.8`
- `rho=0.97`
- `C=0.28`
- `F=0.42`
- `U=0.09`
- accept: `A_dr=0.22`, `A_co=0.34`, `A_t=0.24`
- grant: `G_dr=0.78`, `G_co=0.79`, `G_t=0.76`

### Aggressive

- `D=5000`
- `S=1.8`
- `M=5.6`
- `rho=0.98`
- `C=0.33`
- `F=0.45`
- `U=0.13`
- accept: `A_dr=0.29`, `A_co=0.41`, `A_t=0.31`
- grant: `G_dr=0.82`, `G_co=0.83`, `G_t=0.80`

## Initial Yield Slices

These are provisional revenue assumptions used only for planning.

### `global blended`

- conservative: `E_dr=18`, `E_co=22`, `E_t=20`
- base: `E_dr=24`, `E_co=30`, `E_t=26`
- aggressive: `E_dr=30`, `E_co=38`, `E_t=32`

### `mobile-web zh-skewed`

- conservative: `E_dr=12`, `E_co=15`, `E_t=13`
- base: `E_dr=16`, `E_co=21`, `E_t=18`
- aggressive: `E_dr=20`, `E_co=27`, `E_t=22`

## Scenario Output

Values below are inferred from the planning baseline above.

### `global blended`

| Scenario | Daily Offers (`double/continue/trial`) | Daily Completes (`double/continue/trial`) | Est. Daily Revenue | Est. Monthly Revenue |
| --- | --- | --- | --- | --- |
| Conservative | `2280 / 201 / 30` | `263 / 39 / 4` | `$5.65` | `$169.58` |
| Base | `10476 / 1270 / 135` | `1798 / 341 / 25` | `$54.02` | `$1620.57` |
| Aggressive | `49392 / 7484 / 650` | `11745 / 2547 / 161` | `$454.30` | `$13629.14` |

### `mobile-web zh-skewed`

| Scenario | Daily Offers (`double/continue/trial`) | Daily Completes (`double/continue/trial`) | Est. Daily Revenue | Est. Monthly Revenue |
| --- | --- | --- | --- | --- |
| Conservative | `2280 / 201 / 30` | `263 / 39 / 4` | `$3.78` | `$113.40` |
| Base | `10476 / 1270 / 135` | `1798 / 341 / 25` | `$36.37` | `$1091.10` |
| Aggressive | `49392 / 7484 / 650` | `11745 / 2547 / 161` | `$307.22` | `$9216.67` |

## Placement Mix Interpretation

These are inferences from the formulas above.

- `double_reward` is likely to contribute roughly `75%` to `85%` of early rewarded revenue.
- `continue_once` is likely the second-largest contributor even with much lower volume, because its accept rate and yield can both be stronger than `double_reward`.
- `trial_unlock_arena` is expected to stay under `5%` of direct rewarded revenue in early traffic unless arena browsing becomes a much larger loop.

## Baseline C: Paid Acquisition Model

### Purpose

This baseline extends the rewarded-ads revenue model into a real user-acquisition model.

- Baseline A answers what can be measured from the current event structure.
- Baseline B answers what rewarded revenue might look like under product-planning assumptions.
- Baseline C answers whether paid acquisition can be justified economically.

Use it to answer:
- whether rewarded-ad LTV can repay acquisition cost
- how quickly the product can pay back spend
- whether the scaling blocker is retention, ad yield, or CPI

### Additional Variables

#### Acquisition

- `N`: new installs or acquired first visits per day
- `CPI`: cost per install
- `Activation`: share of installs that reach a valid first gameplay session

#### Retention

- `R1`: day-1 retention
- `R3`: day-3 retention
- `R7`: day-7 retention
- `R30`: day-30 retention

#### Monetization

- `ARPDAU_1`: ad revenue per active user on day 0/1
- `ARPDAU_3`: ad revenue per active user during days 1-3
- `ARPDAU_7`: ad revenue per active user during days 4-7
- `ARPDAU_30`: ad revenue per active user during days 8-30
- `Decay`: late-tail multiplier used to avoid overestimating the long-tail ad cohort

#### Output

- `CAC_day0`
- `Revenue_D0`
- `Revenue_D7`
- `Revenue_D30`
- `LTV_ad`
- `ROAS_D1`
- `ROAS_D7`
- `ROAS_D30`
- `Payback_days`

### Core Formulas

#### Acquisition cost

- `CAC_day0 = N * CPI`

#### Activation

- `Activated_users = N * Activation`

#### Cohort revenue approximation

- `Revenue_D0 = Activated_users * ARPDAU_1`
- `Users_D1 = Activated_users * R1`
- `Users_D3 = Activated_users * R3`
- `Users_D7 = Activated_users * R7`
- `Users_D30 = Activated_users * R30`

#### Simplified ad LTV

- `LTV_0 = Activation * ARPDAU_1`
- `LTV_1_3 = 3 * Activation * R1 * ARPDAU_3`
- `LTV_4_7 = 4 * Activation * R3 * ARPDAU_7`
- `LTV_8_30 = 23 * Activation * R7 * ARPDAU_30 * Decay`
- `LTV_ad = LTV_0 + LTV_1_3 + LTV_4_7 + LTV_8_30`

This is a planning approximation, not a production finance model.

#### ROAS

- `ROAS_D1 = Revenue_D0 / CAC_day0`
- `ROAS_D7 = Revenue_D0_to_D7 / CAC_day0`
- `ROAS_D30 = Revenue_D0_to_D30 / CAC_day0`

#### Payback

- `Payback_days = earliest day where cumulative cohort ad revenue >= CAC_day0`

For a rewarded-ad-heavy H5 product, payback speed is a hard operating constraint.

### Planning Assumptions For Baseline C

These assumptions intentionally reuse the relative monetization strength implied by Baseline B.

#### Conservative

- `N=1000`
- `CPI=0.55`
- `Activation=0.72`
- `R1=0.28`
- `R3=0.16`
- `R7=0.09`
- `R30=0.025`
- `Decay=0.55`

Yield inputs:
- `global blended`
  - `ARPDAU_1=0.0113`
  - `ARPDAU_3=0.0085`
  - `ARPDAU_7=0.0060`
  - `ARPDAU_30=0.0030`
- `mobile-web zh-skewed`
  - `ARPDAU_1=0.0076`
  - `ARPDAU_3=0.0057`
  - `ARPDAU_7=0.0040`
  - `ARPDAU_30=0.0020`

#### Base

- `N=1000`
- `CPI=0.40`
- `Activation=0.78`
- `R1=0.34`
- `R3=0.20`
- `R7=0.11`
- `R30=0.03`
- `Decay=0.65`

Yield inputs:
- `global blended`
  - `ARPDAU_1=0.0360`
  - `ARPDAU_3=0.0270`
  - `ARPDAU_7=0.0190`
  - `ARPDAU_30=0.0090`
- `mobile-web zh-skewed`
  - `ARPDAU_1=0.0242`
  - `ARPDAU_3=0.0180`
  - `ARPDAU_7=0.0120`
  - `ARPDAU_30=0.0060`

#### Aggressive

- `N=1000`
- `CPI=0.28`
- `Activation=0.84`
- `R1=0.40`
- `R3=0.24`
- `R7=0.14`
- `R30=0.04`
- `Decay=0.75`

Yield inputs:
- `global blended`
  - `ARPDAU_1=0.0909`
  - `ARPDAU_3=0.0680`
  - `ARPDAU_7=0.0450`
  - `ARPDAU_30=0.0200`
- `mobile-web zh-skewed`
  - `ARPDAU_1=0.0614`
  - `ARPDAU_3=0.0460`
  - `ARPDAU_7=0.0310`
  - `ARPDAU_30=0.0140`

### Scenario Output

#### `global blended`

| Scenario | `CAC_day0` | `Revenue_D0` | `Revenue_D7` | `Revenue_D30` | `LTV_ad` | `ROAS_D1` | `ROAS_D7` | `ROAS_D30` | `Payback_days` | CPI ceiling |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Conservative | `$550.00` | `$8.14` | `$16.04` | `$18.50` | `$0.0185` | `1.48%` | `2.92%` | `3.36%` | `>30` | `$0.0185` |
| Base | `$400.00` | `$28.08` | `$61.42` | `$72.96` | `$0.0730` | `7.02%` | `15.35%` | `18.24%` | `>30` | `$0.0730` |
| Aggressive | `$280.00` | `$76.36` | `$181.19` | `$221.76` | `$0.2218` | `27.27%` | `64.71%` | `79.20%` | `>30` | `$0.2218` |

#### `mobile-web zh-skewed`

| Scenario | `CAC_day0` | `Revenue_D0` | `Revenue_D7` | `Revenue_D30` | `LTV_ad` | `ROAS_D1` | `ROAS_D7` | `ROAS_D30` | `Payback_days` | CPI ceiling |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Conservative | `$550.00` | `$5.47` | `$10.76` | `$12.40` | `$0.0124` | `0.99%` | `1.96%` | `2.25%` | `>30` | `$0.0124` |
| Base | `$400.00` | `$18.88` | `$40.68` | `$48.38` | `$0.0484` | `4.72%` | `10.17%` | `12.10%` | `>30` | `$0.0484` |
| Aggressive | `$280.00` | `$51.58` | `$122.94` | `$151.34` | `$0.1513` | `18.42%` | `43.91%` | `54.05%` | `>30` | `$0.1513` |

### Operator Interpretation

Use Baseline C to answer five questions:

1. Is the current rewarded stack sufficient to support paid acquisition?
2. What CPI ceiling can the product tolerate?
3. Is recovery viable by D7, D30, or not at all?
4. Should spend be increased, held flat, or reduced?
5. Is the revenue problem caused by weak retention, weak ad yield, or expensive acquisition?

Current model conclusion:
- under all three planning scenarios above, rewarded-ad LTV alone does not repay the acquisition costs assumed here
- even the aggressive `global blended` case reaches only `79.20%` D30 ROAS
- this means the current rewarded stack should not be treated as paid-UA-scalable without either:
  - materially lower CPI
  - materially stronger retention
  - materially higher ad revenue per active user

### Practical Warning

If:
- `double_reward` is the dominant revenue driver
- `continue_once` must remain trust-protected
- `trial_unlock_arena` stays low-volume

then the rewarded revenue base is structurally narrow.

A healthy internal rewarded funnel does not automatically imply scalable paid acquisition.

### Recommended Decision Thresholds

- `LTV_ad < CPI`: do not scale
- `LTV_ad ~= CPI`: limited testing only
- `LTV_ad > CPI`: candidate for controlled scaling
- long payback window: high cash-flow risk even if nominally profitable

## Player-Experience Guardrails

These are not optional tuning ideas. They are the constraints that keep the monetization model compatible with the current product promise.

- Do not add interstitials to chase the revenue gap in these tables.
- Do not auto-open rewarded ads from `reward_offer_show`.
- Treat `continue_once` as a trust feature first and a monetization feature second.
- If `double_reward` request rate starts rising while retention falls, reduce exposure before adding any new monetization surface.
- If `trial_unlock_arena` is low-volume but high-conversion, leave it as a niche funnel instead of forcing more arena prompts.

## Immediate Operator Use

Use this document for three concrete questions:

1. Which placement should be tuned first?
   Start with `double_reward`, because it dominates volume and revenue.

2. Which placement should be protected from aggressive experimentation?
   Protect `continue_once`, because it sits at the highest-friction emotional moment.

3. Which placement is best for understanding exploratory intent rather than yield?
   `trial_unlock_arena`, because the denominator is a loadout curiosity action, not a match outcome action.
