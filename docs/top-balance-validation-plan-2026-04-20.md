# 15-Top Balance And Unlock Validation Plan 2026-04-20

This document is the current validation pack for the merged `15-top` roster and the new unlock split.

The goal is not to immediately rebalance everything.

The goal is to decide, with discipline, whether the current structure should be:
- kept
- lightly adjusted
- partially reverted

## 1. What Must Be Validated

### Unlock structure
- starters:
  - `impact`
  - `armor`
- road rewards:
  - `RANK I -> trick`
  - `RANK II -> armor_bastion`
  - `RANK III -> impact_nova`
- workshop unlocks:
  - `impact_vanguard`
  - `trick_venom`
  - `impact_breaker`
  - `trick_raider`
  - `armor_aegis`
  - `trick_orbit`
  - `armor_mirror`
  - `impact_tremor`
  - `armor_mammoth`
  - `trick_glitch`

### High-risk questions
- Are the two starters enough to carry the first meaningful progression arc?
- Does `RANK I -> trick` arrive at the right moment, or does it feel like the roster starts too narrow before that?
- Does `armor_bastion` overcorrect node `7-9` difficulty?
- Does `impact_nova` become a late mandatory pickup rather than a reward spike?
- Do workshop prices create real choice, or just a fake ladder where the answer is always “save longer”?

## 2. Validation Method

Use three layers of validation.

### Layer A: Structural inspection
This is script-assisted and config-first.

Check:
- unlock source correctness
- price ordering
- reward top ordering
- node reward progression shape
- whether any top is orphaned from both reward and purchase routes

Expected commands:
- `npm run check:config`
- `npm run check:roster`
- `npm run check:roadrank`
- `npm run check:nextphase`

### Layer B: Directed scenario review
This is design/reasoning validation, not freeform play.

Review these concrete routes:
- Start with only `impact` and clear early path nodes
- Start with only `armor` and clear early path nodes
- Reach `RANK I` without buying a shop top
- Buy one early shop top before `RANK I`
- Reach `RANK II` with low-SCRAP behavior
- Reach `RANK III` after one or two “wrong” purchases

For each route, judge:
- frustration
- clarity
- choice quality
- whether the player feels trapped
- whether the reward top solves a real pain point or just outclasses everything

### Layer C: Final human playtest
This is deferred until the preceding content/UI prep is complete.

User should later test:
- first 20 minutes of progression
- one rank reward moment
- one shop-purchase moment
- one “I do not have enough SCRAP” moment

## 3. Review Matrix

Each top should be reviewed against the following:

| Top | Unlock Source | Timing | Price / Reward Weight | Early Power | Mid Power | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| impact | starter | immediate | none | baseline | baseline | low |
| armor | starter | immediate | none | baseline | baseline | low |
| trick | road | RANK I | milestone | high | baseline | medium |
| impact_vanguard | shop | early | 140 | medium | medium | low |
| trick_venom | shop | early-mid | 220 | medium | high | medium |
| impact_breaker | shop | early-mid | 240 | high | medium | medium |
| trick_raider | shop | mid | 300 | medium | high | medium |
| armor_aegis | shop | mid | 320 | medium | medium | low |
| trick_orbit | shop | mid | 340 | low | medium | low |
| armor_mirror | shop | mid-high | 380 | low | medium | low |
| impact_tremor | shop | high | 440 | medium | high | medium |
| armor_mammoth | shop | high | 540 | low | high | medium |
| trick_glitch | shop | very high | 620 | medium | high | high |
| armor_bastion | road | RANK II | milestone | low | high | high |
| impact_nova | road | RANK III | milestone | low | high | high |

## 4. Decision Rules

Use these rules to avoid endless tuning churn.

Keep as-is if:
- the top is strong but not obviously crowding out peers
- the unlock route feels meaningful
- the price matches the timing pressure

Adjust config only if:
- the issue is mostly price, node timing, reward ordering, or localization framing

Escalate to deeper review if:
- a starter is insufficient
- a road reward is effectively mandatory to continue enjoying the mode
- a shop top is so efficient that buying anything else feels irrational

## 5. Likely Findings To Watch For

These are not conclusions yet.

They are the most likely failure points that should be explicitly checked:
- `trick` may be too important as the first road reward because it also widens playstyle identity sharply
- `armor_bastion` may flatten mid/late tension if it hard-counters too many pressure nodes
- `impact_nova` may read more like a late “damage fix” than a prestige unlock if the player economy stays too flat
- `trick_glitch` at `620` may become aspirational in theory but irrelevant in practice if full-run economy does not support experimentation
- current workshop ordering may still feel too linear instead of situational

## 6. Deliverables After This Validation Pass

When Phase 1A is executed, produce:
- one ranked findings list
- one “keep / adjust / revert” table
- one narrow Phase 1B config-edit scope

Do not jump straight from this document into broad live tuning.

## 7. User Playtest Gate

Do not ask the user to play yet.

The user should only be pulled in after:
- this validation pass is completed
- any obvious config-only fixes are applied
- unlock-source UI clarity pass is ready

Then request one focused manual experience review rather than fragmented ad hoc testing.
