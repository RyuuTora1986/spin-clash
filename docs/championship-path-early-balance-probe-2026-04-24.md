# Championship Path Early Balance Probe

Date: `2026-04-24`

Target runtime:
- Live site: `https://play.hakurokudo.com/`
- Locale: `zh`
- Save state: fresh early-game profile
- Tops: starter only (`impact`, `armor`)
- Research: none
- Rank: `RANK I`

## Goal

Verify whether early `Championship Path` difficulty is broadly overtuned, identify the real choke point, and separate:

- enemy numeric / AI pressure problems
- node configuration problems
- arena / opening geometry problems

## Test Method

Real browser runtime testing was executed on the live site, not only local config inspection.

Standardized conditions:
- reset save to a fresh early-game state before each run
- enter `Championship Path` on a specific node
- use the starter player top `Crimson Edge`
- use the same simple reactive control bot for each run:
  - fixed opener drag profile
  - guard on obvious bad edge pressure / high closing speed
  - dash only on clean pursuit lines
  - burst skill only when ready and in range

This is not a perfect human simulation, but it is good enough to compare nodes and candidate fixes under repeatable conditions.

## Baseline Results

### Baseline opener: `center`

Definition:
- drag from the standard start point to a neutral center-line release

Results:

| Node | Runtime config | Sample | Win rate | Main loss mode |
| --- | --- | ---: | ---: | --- |
| `node-1 / Opening Seed` | `circle_bowl + armor_standard + standard` | 3 | `3/3` | none |
| `node-2 / Heart Cut` | `heart_bowl + trick_standard + burstRush` | 6 | `0/6` | `ringout` |
| `node-3 / Redline Gate` | `circle_bowl + impact_standard + overclock` | 7 | `4/7` | `spinout` |

### Key finding

The early-path frustration is **not** evenly distributed across nodes.

The dominant choke point is:

- `node-2 / Heart Cut`

Observed pattern:
- with the default neutral opener, `node-2` produced `0/6` wins
- losses ended very fast, usually in about `6s`
- failure mode was consistently `ringout`

By contrast:
- `node-1` is already in a healthy range for early onboarding
- `node-3` is somewhat hard, but acceptable for a chapter boss

## Node-2 Deeper Probe

### Opener sweep on live runtime

Node under test:
- `heart_bowl + trick_standard + burstRush`

| Opener | Sample | Win rate | Note |
| --- | ---: | ---: | --- |
| `center` | 3 | `0/3` | instant early failures |
| `left` | 3 | `0/3` | no meaningful improvement |
| `right` | 3 | `0/3` | no meaningful improvement |
| `hard_right` | 3 | `0/3` | still hard fail |
| `hard_left` | 8 | `6/8` | only clearly viable opener |

### Interpretation

`node-2` is currently a **narrow-solution fight**.

It is not simply “hard”.

It is specifically:
- highly sensitive to the opening angle
- too punishing for a second-node onboarding match
- effectively asking the player to discover one relatively narrow launch solution

That is the real reason it feels bad.

## What Was Actually Tested As Candidate Fixes

These were tested directly in the live runtime by mutating config in-memory and replaying the node under the same probe conditions.

### Candidate A: enemy preset only

Test:
- keep `node-2` structure
- soften `trick_standard` AI pressure only

Observed result:
- neutral opener stayed at `0/5`
- still lost by `ringout`

Conclusion:
- **enemy numeric softening alone did not solve the node**

### Candidate B: arena forgiveness only

Test:
- keep `node-2` structure
- make `heart_bowl` opening rescue / pull / wall behavior more forgiving

Observed result:
- neutral opener stayed at `0/5`
- still lost by `ringout`

Conclusion:
- **small heart-bowl physics tuning alone did not solve the node**

### Candidate C: node arena swap only

Test:
- move `node-2` from `heart_bowl` to `circle_bowl`
- keep `trick_standard`

Observed result:
- neutral opener stayed at `0/5`
- loss mode shifted more toward `spinout`, but the node still failed

Conclusion:
- **arena swap alone also did not solve the node**

## Objective Conclusion

The problem is **not one isolated numeric knob**.

`node-2` is currently hard because of the combination of:
- an early trick matchup
- an angle-sensitive learning ask
- a very narrow viable opener window

That means the most reliable fix is **not**:
- only reducing enemy AI numbers
- only nudging heart-bowl physics
- only swapping the arena

The most reliable fix is a **node-level redesign**.

## Recommended Fix Order

### Recommended path: node-level redesign first

Best recommendation:

1. Keep `node-1` as-is.
2. Redesign `node-2` into an easier “heart-intro” lesson.
3. Move the current sharper `Heart Cut` version later in the road, after the player has already cleared a checkpoint.

Practical ways to do that:

- Option A:
  - `node-2` stays on `heart_bowl`
  - replace `trick_standard` with a dedicated easier intro enemy preset
  - remove the current “one narrow opener” pressure

- Option B:
  - `node-2` becomes a gentler heart-bowl teaching fight
  - current `Heart Cut` setup moves to a later node such as `node-4` or `node-5`

This is the safest player-experience fix.

### If you insist on numeric-only adjustment

Then it should not be a blind global nerf.

Recommended shape:
- create a new preset such as `trick_intro_early`
- use it only for `node-2`
- do **not** globally weaken `trick_standard`

Why:
- current evidence shows the problem is early-path onboarding, not that the entire `trick_standard` archetype is broken everywhere

### If you insist on arena-level adjustment

Then do **not** globally nerf `heart_bowl`.

Recommended shape:
- create a dedicated intro arena variant such as `heart_bowl_intro`
- use it only on `node-2`

Why:
- later content may still want the sharper existing heart-bowl behavior
- the live probe did not show that tiny global heart tweaks were enough anyway

## Change-Type Classification

### If only enemy preset / AI values change

Classification:
- `core gameplay balance`

Likely files:
- `C:\Users\29940\spin-clash\src\config-enemy-presets.js`
- possibly `C:\Users\29940\spin-clash\src\config-challenge-road.js`

### If road configuration changes

Classification:
- `core progression balance`

Likely files:
- `C:\Users\29940\spin-clash\src\config-challenge-road.js`

This is the branch I currently recommend most.

### If arena geometry / opening behavior changes

Classification:
- `core combat rules`

Likely files:
- `C:\Users\29940\spin-clash\src\config-arenas.js`
- possibly `C:\Users\29940\spin-clash\src\round-flow-tools.js`
- possibly `C:\Users\29940\spin-clash\src\battle-sim-tools.js`

This is the highest-risk branch and should be used only if node-level redesign is rejected.

## Sync Back To Mother/Base And Channels

This issue is a core game balance issue, not a channel wrapper issue.

So the correct sync path is:

1. change the internal mother/base config
2. rebuild `direct_web_google`
3. rebuild `crazygames_basic`
4. run channel verification

Correct release flow:

1. edit the core source files
2. run channel impact classification for this feature
3. run:
   - `npm run verify:channels`
4. rebuild:
   - `npm run build:channel -- --channel direct_web_google`
   - `npm run build:channel -- --channel crazygames_basic`

This should **not** be implemented as a CrazyGames-only balance override unless later data proves the problem exists only there.

Current evidence says the issue already exists on the live Google/self-hosted runtime, so the fix should go into the mother/base version first.
