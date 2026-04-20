# 15-Top Balance Validation Report 2026-04-20 Phase 1A

This is the Phase 1A static validation report for the merged `15-top` roster and unlock split.

This report is intentionally narrow.

It does not claim gameplay balance is solved.

It only answers:
- whether the current structure is internally coherent
- where the biggest likely failure points are
- what the smallest safe Phase 1B scope should be

## 1. Validation Scope

Reviewed sources:
- `src/config-tops.js`
- `src/config-road-ranks.js`
- `src/config-challenge-road.js`
- `src/config-economy.js`
- `src/config-enemy-presets.js`

Commands run:
- `npm run check:config`
- `npm run check:roster`
- `npm run check:roadrank`
- `npm run check:nextphase`

Result:
- all passed

## 2. Structural Snapshot

### Unlock split
- starters:
  - `impact`
  - `armor`
- Road rewards:
  - `RANK I -> trick`
  - `RANK II -> armor_bastion`
  - `RANK III -> impact_nova`
- Workshop tops:
  - `impact_vanguard` `140`
  - `trick_venom` `220`
  - `impact_breaker` `240`
  - `trick_raider` `300`
  - `armor_aegis` `320`
  - `trick_orbit` `340`
  - `armor_mirror` `380`
  - `impact_tremor` `440`
  - `armor_mammoth` `540`
  - `trick_glitch` `620`

### Challenge Road first-clear checkpoints
- through `node-3`: `62`
- through `node-6`: `168`
- through `node-8`: `258`
- through `node-9`: `320`
- full clear (`node-10`): `400`

### Full-clear totals by rank
- `RANK I`: `400`
- `RANK II`: `474`
- `RANK III`: `541`

## 3. Main Findings

### Finding 1: early shop diversity is currently too narrow

Static conclusion:
- before the player clears `node-6`, the only shop top they can certainly afford from first-clear income is `impact_vanguard` at `140`
- the first purchasable trick-family option, `trick_venom` at `220`, does not become reachable until after `node-8`

Practical meaning:
- the player starts with two families available in practice:
  - starter `impact`
  - starter `armor`
- the third family identity, `trick`, is functionally delayed for too long relative to how early the mode already teaches trick matchups

Severity:
- high

### Finding 2: `RANK I -> trick` is structurally late for a first style-expansion reward

Static conclusion:
- the player encounters trick-family pressure at:
  - `node-2`
  - `node-5`
  - `node-8`
- but the free base `trick` unlock only lands on full `RANK I` clear

Practical meaning:
- the first Road reward is not just “a stronger top”
- it is the first clean access to an entirely different family identity
- delivering that identity only after full-rank clear makes the roster feel narrower than the new 15-top structure implies

Severity:
- high

### Finding 3: `armor_bastion` may compress the mid-tier armor branch

Static conclusion:
- `armor_bastion` is a very strong defensive milestone reward:
  - `hp: 220`
  - `mass: 1.00`
  - `hpDecayPerSec: 0.04`
- the paid armor branch around it is:
  - `armor_aegis` `320`
  - `armor_mirror` `380`
  - `armor_mammoth` `540`

Practical meaning:
- if `armor_bastion` lands before the player feels a real need for `aegis` or `mirror`, the mid-tier armor shop line risks looking like filler between starter `armor` and reward `armor_bastion`

Severity:
- medium-high

### Finding 4: late-shop aspiration is uneven, not obviously wrong

Static conclusion:
- `armor_mammoth` at `540` is barely reachable on one full `RANK III` first-clear run
- `trick_glitch` at `620` is not reachable from a single full `RANK III` first-clear run

Practical meaning:
- the current ladder already implies two different late-economy roles:
  - `armor_mammoth` = late but still one-run reachable
  - `trick_glitch` = repeat-clear aspirational

This can be valid, but it should be intentional.

Severity:
- medium

### Finding 5: merged docs had one known price drift

Static conclusion:
- one earlier document path still reflected `armor_mammoth = 520`
- current live config is `540`

Practical meaning:
- the current source of truth is the config, not the earlier handoff summary

Severity:
- low

## 4. Keep / Adjust / Revert Table

| Topic | Decision | Reason |
| --- | --- | --- |
| Starter pair = `impact + armor` | Keep | Structurally coherent and complementary; no static evidence yet that one must be removed or replaced. |
| `RANK I -> trick` as a first style-expansion milestone | Adjust | The family unlock arrives too late relative to encounter teaching and shop affordability. |
| `RANK II -> armor_bastion` | Keep, but review | Likely valuable as a milestone, but may crowd out mid-tier armor purchases. |
| `RANK III -> impact_nova` | Keep | Reads like a late prestige reward and does not obviously break the earlier economy by itself. |
| `trick_glitch` above one-run full-clear income | Keep for now | Acceptable if the intended role is repeat-clear aspiration. |

## 5. Recommended Phase 1B Scope

Keep Phase 1B config-only.

The smallest justified follow-up scope is:
- make one earlier non-starter trick path realistically reachable
- preserve the starter pair
- avoid broad family reshuffles
- avoid changing reward-provider or runtime boundaries

The most likely config-only levers are:
- one or more Workshop prices in the early/mid trick branch
- possibly one mid-tier armor price if `armor_bastion` makes the armor shop line too obviously skippable

Do not yet:
- redesign rank reward logic
- move reward delivery out of the current rank-final structure
- rewrite loadout or progression systems

## 6. Human Playtest Gate

Do not call for user playtest yet.

The next correct order is still:
1. apply any narrow Phase 1B config corrections
2. complete the unlock-source UI clarity pass
3. then ask the user for one focused experience review

## 7. Bottom-Line Conclusion

The merged `15-top` structure is internally consistent and technically safe.

The main problem is not merge correctness.

The main problem is pacing:
- style diversity opens too late
- the first trick-family access is too back-loaded
- the mid-tier armor shop line may be squeezed by the free `armor_bastion` milestone

That is a good Phase 1B problem.

It is narrow, config-shaped, and does not require reopening frozen provider/runtime boundaries.
