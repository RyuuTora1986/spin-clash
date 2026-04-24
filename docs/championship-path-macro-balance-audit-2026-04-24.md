# Championship Path Macro Balance Audit

Date: `2026-04-24`

Primary evidence sources:
- Live-site early deep probe: `docs/championship-path-early-balance-probe-2026-04-24.md`
- Automated macro probe output:
  - `output/championship-path-balance-probe-2026-04-23T20-31-19/report.md`
  - `output/championship-path-balance-probe-2026-04-23T20-31-19/report.json`
- Runtime config inspection:
  - `src/config-challenge-road.js`
  - `src/config-enemy-presets.js`
  - `src/config-arenas.js`
  - `src/config-modifiers.js`
  - `src/config-tops.js`
  - `src/config-economy.js`

Target runtime:
- Live site: `https://play.hakurokudo.com/`
- Locale: `en`
- Save state: fresh early profile
- Player tops: starter roster only (`impact`, `armor`)
- Main probe top: starter `impact / Crimson Edge`
- Probe harness: `scripts/probe-championship-path-balance.js`

## 2026-04-24 Local Rebalance Update

This update supersedes the raw "current path" findings below for the local workspace.

Final local regression:
- Report: `output/championship-path-balance-probe-2026-04-24T07-00-27/report.md`
- Tested nodes: all 10 Championship Path nodes
- Baseline samples: `2`
- Sweep samples: `1`
- Flagged sweep nodes: none

Final local classification:
- `node-1`: `stable`, center win rate `50%`, solution width `100%`
- `node-2`: `stable`, center win rate `100%`, solution width `100%`
- `node-3`: `acceptable_boss_pressure`, center win rate `50%`, solution width `100%`
- `node-4`: `stable`, center win rate `100%`, solution width `100%`
- `node-5`: `stable`, center win rate `50%`, solution width `100%`
- `node-6`: `acceptable_boss_pressure`, center win rate `50%`, solution width `100%`
- `node-7`: `stable`, center win rate `100%`, solution width `100%`
- `node-8`: `stable`, center win rate `100%`, solution width `100%`
- `node-9`: `stable`, center win rate `100%`, solution width `100%`
- `node-10`: `stable`, center win rate `100%`, solution width `100%`

Main rebalance decisions:
- `node-2` now uses `heart_bowl_intro` with a steadier armor rival, removing the early heart narrow-solution trap.
- `node-3` now uses `circle_boss_intro`, a softer `impact_standard`, and `burstRush` as a first-boss teaching rule.
- Standard `hex_bowl` launches now start slightly offset so center launch is not a direct ringout quiz.
- `node-4` is now a protected hex introduction using `trick_hex_intro` plus `heavyFloor`.
- `node-6` uses `impact_floor_press` instead of reusing final-stage `impact_blitz`.
- `node-6` and `node-9` now use less punishing player-favoring modifier profiles to remove center-opener ringout traps while keeping short boss/late-node pressure.
- Release compliance adjustment: `node-7` now carries the required `armor_ram` encounter in the later Rival Series window instead of returning that harder armor check to the early onboarding nodes.

Residual risk:
- The `node-7` `armor_ram` placement was validated by encounter/release checks, but the full 10-node probe was not rerun to completion after that micro-adjustment.
- Several nodes now resolve quickly in the probe because the automated player favors direct pressure. This is acceptable for the CrazyGames Basic Launch retention goal, but live player telemetry should be used later to decide whether to add pressure back.
- `node-2`, `node-8`, and `node-10` can still produce very short ringout wins in the probe. These are wins, not blockers, but they may need polish if average session depth becomes too shallow.

## Why This Audit Exists

The problem is no longer just `node-2`.

The real design question is:
- how many path nodes are effectively "narrow-solution" traps
- where the road stops teaching and starts only punishing
- whether the reward / unlock cadence is strong enough to offset difficulty spikes
- whether the whole path creates healthy flow instead of repeated frustration cliffs

This document turns that into a reusable measurement method.

## Measurement Framework

### 1. Access Win Rate

Definition:
- Win rate with the standard `center` opener and the same simple reactive control bot

Purpose:
- Measures whether a node is broadly accessible without hidden knowledge

Interpretation:
- high = node is readable and fair under naive play
- low = node may be overtuned, mis-sequenced, or hiding a narrow required answer

### 2. Solution Width Score

Definition:
- Among tested openers (`center / left / right / hard_left / hard_right`), how many produce acceptable win rate

Purpose:
- Separates:
  - broadly difficult fights
  - narrow-solution fights

Interpretation:
- low solution width = player must discover one narrow launch pattern
- high solution width = difficulty comes from sustained combat, not a hidden opener quiz

### 3. Failure Harshness

Definition:
- early-loss time
- loss reason mix (`ringout / spinout / hpbreak`)

Purpose:
- Measures how punishing failure feels

Interpretation:
- instant `ringout` losses at `0.4s` to `1.0s` are much worse for flow than a `15s` spin-out after a visible duel

### 4. Chapter Spike Ratio

Definition:
- Compare a node's accessibility against the previous stable node in the same chapter window

Purpose:
- Detects when the path jumps too far too fast

Interpretation:
- a boss is allowed to spike
- a post-checkpoint normal node should not feel harsher than the boss that preceded it

### 5. Reward Reachability

Definition:
- Cumulative first-clear currency before each node, compared against:
  - arena unlock costs
  - first meaningful shop top costs

Purpose:
- Checks whether the player can actually cash in on progression before the next frustration wall

### 6. Novelty Cadence

Definition:
- How often the player gets a new experience beat:
  - new arena access
  - new purchasable top
  - guaranteed road reward
  - modifier / archetype novelty

Purpose:
- Flow depends on alternating:
  - challenge
  - payoff
  - new possibility

## Recommended Target Bands

These are the bands I recommend using for future balance passes.

### Intro / onboarding node

- Access Win Rate: `70%` to `85%`
- Solution Width Score: `>= 60%`
- Early ringout share: `< 35%`
- Average losing active time: `> 10s`

### Standard progression node

- Access Win Rate: `55%` to `70%`
- Solution Width Score: `>= 40%`
- Early ringout share: `< 45%`

### Boss / checkpoint node

- Access Win Rate: `40%` to `55%`
- Solution Width Score: `>= 25%`
- Losses can be sharper, but should usually feel like a duel, not an instant launch failure

### Final node

- Access Win Rate: `30%` to `45%`
- Solution Width Score: `>= 20%`
- Final pressure is allowed, but instant opener failure should still be rare

## Real Findings From The Current Path

## Stable anchors

Current evidence says these nodes are the healthiest anchors:

- `node-1`
- `node-5`
- `node-7`

Why they matter:
- they give the road places where the player can re-stabilize
- they prove the whole path is not globally overtuned

## Confirmed narrow-solution trap

### `node-2 / Heart Cut`

This remains the strongest confirmed problem node.

Strong evidence:
- earlier live deep probe:
  - neutral opener `0/6`
  - `hard_left` `6/8`
- macro probe:
  - `center` `0/2`
  - `left` `1/1`
  - all other tested openers failed

Conclusion:
- this node is not just hard
- it is effectively asking the player to find a narrow launch answer too early

## Repeated heart-bowl cliff pattern

The most important macro finding is not a single node.

It is this cluster:
- `node-2`
- `node-4`
- `node-8`
- `node-10`

Shared structure:
- all are on `heart_bowl`
- most current failures are near-instant `ringout`
- the harshest nodes in the path are over-represented on the same arena family

This suggests a systemic issue:
- not "heart bowl is always bad"
- but "heart bowl is repeatedly being paired with pressure packages that create opener cliffs"

That means the path probably needs:
- a gentler `heart intro`
- a mid-path `heart standard`
- and possibly a sharper late `heart mastery`

In other words:
- **arena variants are likely better than one global heart-bowl nerf**

## Post-checkpoint pacing problem

### `node-4 / Guard Break`

This node currently reads as the worst broad spike.

Evidence:
- `center` baseline: `0/2`
- all tested alternates in the macro probe also failed
- failure mode is repeated near-instant `ringout`

Interpretation:
- unlike `node-2`, this does not currently look like a "one hidden correct opener" problem
- it looks like a **post-checkpoint normal node that is simply too harsh for its role**

That makes `node-4` especially important:
- after the first checkpoint, the road should briefly re-stabilize
- instead, it currently produces another cliff

## Boss pressure

### `node-3 / Redline Gate`

Current data is mixed:
- earlier manual probe showed `4/7` on neutral opener, which is harsh but still playable for a first boss
- automated macro probe showed `0/2` on `center`

So the safest conclusion is:
- `node-3` is at least **borderline too hard**
- but I would not yet treat it as the first fix
- the bigger priority is still the surrounding path shape:
  - `node-2`
  - `node-4`

### `node-6 / Floor Press`

Current macro probe:
- `center` `1/2`

Interpretation:
- this is close to the target band for a checkpoint boss
- it can remain a real spike if earlier chapters are smoothed

### `node-10 / Crown Clash`

Current macro probe:
- `center` `0/2`
- all sampled alternates also failed
- failure is near-instant `ringout`

Interpretation:
- this is currently **overtuned final pressure**
- not because finals cannot be hard
- but because it is currently too opener-fragile and too fast-fail to feel climactic

## Economy And Novelty Read

Raw currency pacing is better than the frustration curve makes it feel.

Using current config:
- by clearing `node-3`, the player can afford `hex_bowl` (`120 SCRAP`)
- by clearing `node-4`, the player can afford the first meaningful shop top `impact_vanguard` (`140 SCRAP`)
- by clearing `node-5`, the player can afford `trick_venom` (`180 SCRAP`)

So the macro economy problem is **not** that rewards are stingy.

The bigger issue is:
- players may hit `node-2` and `node-4` before reaching those positive beats reliably

There is also a novelty problem:
- guaranteed new road reward is relatively late
- the shop can already provide novelty, but only if the player notices it and reaches the currency threshold

That means the current path would benefit from one of these:
- stronger shop / new-top guidance after `node-4`
- a guaranteed authored unlock around `node-5` or `node-6`

## Macro Optimization Direction

## Desired road shape

I recommend shaping the path like this:

1. `node-1`
- stable onboarding anchor

2. `node-2`
- heart-bowl lesson
- not a hidden-opener trap

3. `node-3`
- first real boss
- higher pressure is fine

4. `node-4`
- recovery / unlock node
- should re-stabilize the player after the checkpoint

5. `node-5`
- first real lateral mastery test
- hex-specific control lesson is fine

6. `node-6`
- second checkpoint boss

7. `node-7`
- recovery / consolidation node

8. `node-8`
- advanced heart rematch
- difficult, but still wider than current

9. `node-9`
- semifinal pressure

10. `node-10`
- final climax
- hard, but not instant-launch punishment

## Fix order

Recommended order:

1. redesign `node-2`
2. redesign `node-4`
3. re-check `node-3`
4. redesign `node-8`
5. redesign `node-10`
6. then re-evaluate whether `node-6` still feels correct

## How To Decide What To Change

### If only enemy numbers / AI should change

Use this when:
- baseline access is low
- opener sweep is also broadly low
- failures look like sustained attrition / spinout pressure
- the node role is correct, but the raw pressure is too high

Best current candidate:
- `node-3`, if it still stays too hard after `node-2` and `node-4` are fixed

### If road configuration should change

Use this when:
- the node's role in the curve is wrong
- too many spikes cluster together
- a recovery node is not actually serving as recovery

Best current candidates:
- `node-2`
- `node-4`
- `node-8`
- `node-10`

### If arena construction should change

Use this when:
- multiple nodes on the same arena family show the same instant-fail signature
- the problem repeats across different enemy presets and modifiers

Best current systemic candidate:
- the `heart_bowl` family

But the recommended shape is:
- **do not global-nerf all heart content blindly**
- instead split it into role-based variants

## Practical Method For Future Balance Passes

## Step 1

Run the probe:

```bash
npm run probe:roadbalance -- --baseline-samples 2 --sweep-samples 1
```

For a stricter pass:

```bash
npm run probe:roadbalance -- --baseline-samples 3 --sweep-samples 2
```

## Step 2

Mark nodes that violate target bands.

At minimum, flag a node if:
- baseline access is below its target band
- solution width is too narrow
- early ringout failures dominate

## Step 3

Choose the least invasive correct branch:
- enemy preset only
- node config / chapter sequencing
- arena variant

## Step 4

After every change:
- rerun the probe
- rerun focused human play on the touched nodes
- confirm reward reachability still feels worth the effort

## Bottom Line

The path is not globally broken.

But it is **not yet shaped like a healthy flow curve**.

Current highest-confidence macro problems are:
- `node-2` narrow-solution trap
- `node-4` broad post-checkpoint cliff
- repeated heart-bowl instant-ringout spikes across the road
- `node-10` final pressure being too opener-harsh

Current highest-confidence macro strength is:
- the raw economy is actually good enough to support progression

So the main task is **not** "give more money".

It is:
- widen the early and mid-path solution space
- restore a proper challenge/recovery cadence
- make sure players can reliably reach the first meaningful unlock beats

## 2026-04-24 Implementation Update

Applied changes in this pass:
- added a reusable `challenge-only / hiddenFromQuick` arena mechanism
- added `heart_bowl_intro` and moved `node-2` onto it
- added dedicated launch slots for `heart_bowl_intro`
- added `hex_bowl_intro` and moved `node-4` onto it
- added dedicated launch slots for `hex_bowl_intro`
- removed `burstRush` from `node-4`
- tested multiple `node-4` enemy variants, including a dedicated `armor_hex_intro`

Primary evidence from this pass:
- `output/championship-path-balance-probe-2026-04-23T21-31-19/report.md`
- `output/championship-path-balance-probe-2026-04-23T21-35-56/report.md`
- `output/championship-path-balance-probe-2026-04-23T21-40-28/report.md`
- `output/championship-path-balance-probe-2026-04-23T21-50-24/report.md`
- `output/championship-path-balance-probe-2026-04-23T21-55-45/report.md`

### What changed materially

#### `node-2`

Outcome:
- moved from a confirmed structural trap to a stable onboarding node in the probe harness

Latest measured state:
- baseline `center` opener: `4/4`
- classification: `stable`

Interpretation:
- the decisive fix was not a generic heart-bowl stat nerf
- it was giving the early heart lesson its own arena role and its own launch geometry

Important caution:
- the node is now likely too easy for the probe bot
- that is acceptable for this pass because the original problem was severe early frustration
- later polish can raise spectacle or fight duration slightly without reintroducing failure cliffs

#### `node-4`

Outcome:
- materially healthier than the original cliff, but still not in the target band for a post-checkpoint recovery / unlock node

Best measured state in this pass:
- baseline `center` opener: `1/4` (`25%`)
- solution width: up to `40%` in the better variants
- classification: still `broad_difficulty_spike`

Interpretation:
- `node-4` is no longer a pure copy of the old checkpoint-aftershock problem
- but it is still too punishing for its role
- the path now has one confirmed solved node (`node-2`) and one still-open node (`node-4`)

### Updated conclusion after implementation

Highest-confidence statements now are:
- `node-2` was an arena-role / launch-geometry problem and is effectively solved for now
- `node-4` is still the next required fix
- the new `challenge-only` arena mechanism is worth keeping, because it solved the exact class of problem that generic tuning could not solve on `node-2`

Recommended next balance pass:
1. keep `node-2` as-is for now
2. continue iterating only on `node-4`
3. after `node-4` reaches target band, rerun the macro probe on `node-8` and `node-10`
