# Balance Pass 2026-04-17

This document records the first deliberate economy and difficulty pass after the static MVP shell became stable enough for repeated local playtests.

## Goals

- make `Quick Battle` feel like a lower-stakes practice loop instead of the best farming route
- make `Championship Path` the main progression route without making early failure feel dead
- keep the first major purchase decision early and clear
- keep mid-path goals visible instead of letting the player buy too much too quickly
- soften the harshest node `4-6` pressure without draining the battle energy out of the game

## Baseline Problems

Before this pass, the shell had four linked problems:

1. `Quick Battle` and `Championship Path` still shared the same base win/loss payout logic in runtime, so the intended mode split only existed in docs.
2. Early and mid-path rewards were generous enough that the player could accumulate too much flexible SCRAP before the roster and research costs pushed back.
3. `Rank II` and `Rank III` reward multipliers were too inflationary relative to the amount of extra pressure they added.
4. The node `4-6` section stacked elite presets and harsh modifiers too aggressively, which risked a "too hard too early" wall.

## Default Value Changes

### Economy

| Surface | Before | After | Reason |
| --- | --- | --- | --- |
| Quick Battle win | `20` | `16` | Practice stays useful, but no longer outpaces the main path |
| Quick Battle loss | `8` | `6` | Losses still pay, but less farming by safe loss loops |
| Championship Path win base | shared `20` | `20` | Keeps main-path wins emotionally rewarding |
| Championship Path loss base | shared `8` | `10` | Path losses sting less and encourage another run |
| Double reward multiplier | `2` | `2` | No change; the offer stays easy to understand |

Runtime change:
- `Quick Battle` now uses `winBase / lossBase`
- `Championship Path` now prefers `challengeWinBase / challengeLossBase`
- fallback remains backward-safe if the challenge-specific fields are absent

### Unlock Costs

| Unlock | Before | After | Intent |
| --- | --- | --- | --- |
| `HEX BOWL` | `140` | `120` | Still a decision, but reachable at the first checkpoint |
| `Trick` | `120` | `90` | Earlier roster variety and earlier expression choice |
| `Breaker` | `220` | `250` | Mid-goal instead of a near-immediate add-on |
| `Raider` | `260` | `320` | Premium late-goal rather than easy overflow spend |

### Research Costs

| Track | Before | After | Total Before | Total After |
| --- | --- | --- | --- | --- |
| `SPIN CORE` | `40 / 80 / 130 / 190` | `45 / 80 / 135 / 210` | `440` | `470` |
| `GUARD FRAME` | `50 / 90 / 140 / 210` | `45 / 85 / 145 / 220` | `490` | `495` |
| `BURST RELAY` | `45 / 85 / 135 / 200` | `40 / 80 / 140 / 215` | `465` | `475` |
| Full research spend | - | - | `1395` | `1440` |

Intent:
- first research access stays friendly
- later levels cost more, so long-term progression does not collapse

### Road Rank Reward Curve

| Rank | Before | After |
| --- | --- | --- |
| `RANK I` | `x1.00` | `x1.00` |
| `RANK II` | `x1.25` | `x1.20` |
| `RANK III` | `x1.50` | `x1.38` |

Enemy scalars were also softened slightly so the rank jump stays meaningful without creating a reward gap that is too efficient to ignore.

### Championship Path Node Rewards

| Node | Before | After |
| --- | --- | --- |
| `1` | `20` | `14` |
| `2` | `24` | `18` |
| `3` | `30 + 8 bonus` | `24 + 6 bonus` |
| `4` | `34` | `28` |
| `5` | `38` | `32` |
| `6` | `44 + 10 bonus` | `38 + 8 bonus` |
| `7` | `48` | `44` |
| `8` | `52` | `50` |
| `9` | `56` | `58` |
| `10` | `60 + 16 bonus` | `66 + 14 bonus` |

Derived first-clear totals at current runtime rounding:

| Milestone | Before | After |
| --- | --- | --- |
| First checkpoint clear (`nodes 1-3`, `Rank I`) | `142` | `122` |
| Second checkpoint clear (`nodes 1-6`, `Rank I`) | `328` | `288` |
| Full first clear (`Rank I`) | `640` | `600` |
| Full first clear (`Rank II`) | `800` | `721` |
| Full first clear (`Rank III`) | `960` | `828` |

Key point:
- the total reward was reduced only moderately
- the curve was reshaped much more aggressively
- early and mid rewards were pulled down
- late rewards were preserved or lifted so the final stretch still feels worth it

### Difficulty Softening

The pass softened only the harshest pressure points.

Enemy presets softened:
- `armor_ram`
- `trick_drifter`
- `impact_blitz`

Modifier pressure softened:
- `overclock`
- `ironwall`
- `launchSurge`
- `grindCore`
- `lowSpin`

Intent:
- widen reaction windows
- reduce early-mid frustration spikes
- keep the same matchup identities instead of flattening all encounters

## Expected Player Experience Impact

### Early Game

Expected result:
- the player reaches the first checkpoint with enough SCRAP for exactly one meaningful direction change

What that means in practice:
- after a first `Rank I` checkpoint clear, the player can buy `Trick` immediately and still keep a little SCRAP
- or the player can unlock `HEX BOWL` immediately
- but they cannot comfortably buy everything at once

This is the intended early-game feeling:
- one meaningful choice
- not a shopping spree

### Mid Game

Expected result:
- node `4-6` still reads as the point where the road gets serious
- but it should stop feeling like an abrupt wall for average players

What should feel different:
- elite presets should still be threatening
- however, players should get more chances to recover positioning and burst timing
- losing on those nodes should still return enough SCRAP to feel like the run moved forward

### Late Game

Expected result:
- the back half of the path should feel more rewarding than before, even though the full-economy curve is overall tighter

Why:
- `Breaker` and especially `Raider` now absorb more surplus currency
- later nodes pay more heavily than earlier ones
- `Rank II` and `Rank III` still matter, but no longer explode the economy as fast

### Quick Battle Role

Expected result:
- `Quick Battle` becomes the low-pressure place to test tops, arenas, and feel
- it should no longer be the obvious best farm route

This is structurally important because the game needs:
- one mode for expression and practice
- one mode for progression pressure

## Review Questions For The Next Playtest

Use these questions instead of only asking whether the game "felt okay":

1. Did the first checkpoint feel like it gave one strong purchase choice, or still too little / too much?
2. Are players unlocking `Trick` first, `HEX BOWL` first, or holding for research?
3. Do nodes `4-6` still cause rage quits or hard stalls?
4. Is `Breaker` reachable at a satisfying point, or still too early?
5. Does `Raider` feel aspirational, or so expensive that players stop caring?
6. Do `Rank II` and `Rank III` feel worth the added risk without becoming mandatory farms?
7. After a loss in `Championship Path`, does the player feel "I made progress anyway" or "that run was wasted"?

## Adjustment Triggers

These are the concrete warning signs to watch.

### Economy Is Still Too Loose If

- many players can buy `Trick` and `HEX BOWL` before or immediately after node `3`
- `Breaker` is commonly bought before the second checkpoint
- `Raider` becomes normal before a full `Rank I` clear
- `Rank II` becomes the clearly dominant farming route too early

### Economy Is Too Tight If

- average players cannot afford either `Trick` or `HEX BOWL` after the first checkpoint
- losses in `Championship Path` feel like dead time instead of partial progress
- players hoard SCRAP because no medium goal feels reachable

### Difficulty Is Still Too Sharp If

- abandonment spikes at nodes `4`, `5`, or `6`
- `armor_ram` or `impact_blitz` feel unwinnable without one specific top
- players report that modifiers, not enemy identity, are the main source of frustration

### Difficulty Is Too Soft If

- most players pass nodes `4-6` on the first try without adapting
- `Rank I` becomes a low-attention cruise after a single unlock
- the elite presets stop feeling distinct from the standard presets

## Recommended Next Adjustment Order

If another pass is needed, adjust in this order:

1. node rewards and first-clear bonuses
2. unlock costs
3. modifier pressure
4. elite preset AI pressure
5. road-rank multipliers

This order preserves the cleanest read on what actually changed the player experience.
