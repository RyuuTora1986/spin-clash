# Balance Pass 2026-04-20 Phase 1B

This pass applies the smallest config-only correction justified by the Phase 1A static validation report.

## Change

- `trick_venom` cost:
  - `220 -> 180`

## Why This Specific Change

Phase 1A showed that the merged `15-top` structure had one clear pacing problem:
- the roster technically includes three families
- but practical early access was still too concentrated in `impact` and `armor`

Before this pass:
- first-clear income through `node-6` was `168`
- the first purchasable trick-family top cost `220`
- this meant the player could not access a non-reward trick-family top before the late `RANK I` stretch

After this pass:
- `trick_venom` becomes reachable immediately after a strong early-path clear
- the player gets one earlier non-starter trick path without:
  - touching reward delivery logic
  - changing Road reward ownership
  - widening the balance pass into a full price rewrite

## What This Pass Does Not Change

It does not change:
- starter tops
- rank reward tops
- armor branch prices
- late aspirational tops
- challenge node rewards

## Reason For Staying This Narrow

Static validation was strong enough to justify one early-access correction.

It was not strong enough to justify broad repricing across all three families.

The next steps should therefore be:
1. verify this narrower early trick-access correction
2. then move to unlock-source UI clarity
3. leave larger balance questions for later manual experience review
