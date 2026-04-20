# Balance Pass 2026-04-20

This pass extends `Spin Clash` content and progression without changing reward/provider/runtime boundaries.

## Goals

- make the back half of `Challenge Road` feel less like repeated elite rematches
- preserve the current full-clear economy curve instead of inflating rewards again
- make late-road losses feel less wasted
- keep `Rank II` and `Rank III` threatening through enemy pressure, not through larger payout spikes
- make the safest research line the cheapest answer to the sharper late-road mix

## What Changed

### Challenge Road Back-Half Remix

Nodes `7-9` were remixed to use new encounter identities instead of reusing mostly earlier presets:

- `node-7`
  - now uses `armor_bastion`
  - now uses `heavyFloor`
  - reward changed from `44` to `42`
- `node-8`
  - now uses `trick_duelist`
  - now uses `suddenDeath`
  - reward changed from `50` to `48`
- `node-9`
  - now uses `impact_reaper`
  - stays on `grindCore`
  - reward changed from `58` to `62`

`node-10` stays on the established `impact_blitz + overclock` final boss pairing so the championship finish remains recognizable.

Important outcome:

- the road back half is more distinct
- the total base node reward still stays at `372`
- the full first-clear `Rank I` payout still stays at `600`

### New Enemy Presets

Added:

- `armor_bastion`
- `trick_duelist`
- `impact_reaper`

Intent:

- `armor_bastion` is the deliberate center-lock control wall
- `trick_duelist` is the volatile high-commit duel check
- `impact_reaper` is the late-road punish/chase preset

### Economy

Only one economy value changed:

- `challengeLossBase`
  - `10 -> 12`

Intent:

- late-road failure should still move the file forward
- harder node identity should not turn into dead-time losses

Quick Battle payout values remain unchanged.

### Research Costs

Research identity is now a little clearer:

- `SPIN CORE`
  - `45 / 80 / 145 / 220`
- `GUARD FRAME`
  - `45 / 80 / 140 / 210`
- `BURST RELAY`
  - `40 / 85 / 145 / 220`

Derived total:

- full research spend:
  - `1455`

Intent:

- `GUARD FRAME` is now the cheapest full line, matching its role as the stable answer to sharper late-road pressure
- `SPIN CORE` and `BURST RELAY` now ask for a slightly heavier late commitment

### Road Rank Pressure

Reward multipliers stay the same:

- `RANK I`: `x1.00`
- `RANK II`: `x1.20`
- `RANK III`: `x1.38`

Enemy scaling is slightly sharper:

- `RANK II`
  - `hpMul: 1.08`
  - `spinMul: 1.09`
  - `spdMul: 1.04`
  - `massMul: 1.015`
  - `brate: 1.05`
- `RANK III`
  - `hpMul: 1.15`
  - `spinMul: 1.17`
  - `spdMul: 1.07`
  - `massMul: 1.04`
  - `brate: 1.10`

Derived full-clear totals:

- `Rank I`: `600`
- `Rank II`: `720`
- `Rank III`: `828`

Interpretation:

- `Rank II` lost one rounded full-clear point versus the previous distribution because more value moved onto node `9`
- this is acceptable because the reward curve is still controlled and the rank identity is now coming more from combat pressure

## Expected Player Experience

### Nodes 7-10

- `node-7` should feel like a center-ownership check, not just another generic armor rematch
- `node-8` should feel like a volatile duel spike with clear "my launch failed" readability
- `node-9` should feel like the real semifinal wall before the known final-boss archetype
- `node-10` should still read like the familiar championship finish

### Progression

- late losses should feel less punishing because `Challenge Road` loss payout is higher
- players who start failing on the remixed back half should have a cleaner incentive to buy `GUARD FRAME`
- higher ranks should feel tougher primarily because enemies are sharper, not because rewards are too efficient to ignore

## Review Questions

1. Does `node-7` now read as a real control check rather than recycled armor pressure?
2. Is `node-8` exciting and readable, or just too swingy under `suddenDeath`?
3. Does `node-9` now feel like a proper semifinal ramp before the final boss?
4. Are late-road losses at `12 SCRAP` enough to keep retries feeling productive?
5. Does `GUARD FRAME` become the natural defensive spend, or is it still ignored?
