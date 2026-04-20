# Next-Phase Gameplay Expansion Design

**Goal:** define the next approved product step after the static MVP shell so gameplay depth, content identity, replay value, and presentation quality improve without breaking the current duel core or static-host boundary.

## Design Authority
- This document is the authoritative merged direction for the next phase.
- Parallel agent drafts were treated as inputs only.
- If any earlier discussion or draft conflicts with this document, this document wins.

## Design Principles
- Keep the current duel core intact: short best-of-3 matches, drag launch, dash, burst skill, 3D arena, strong SFX energy.
- Expand through authored encounters, not through a second gameplay system.
- Prefer config-driven content over hardcoded one-off logic.
- Keep the project static-host friendly: no backend, no multiplayer, no cloud dependency.
- Add depth through better packaging, pacing, progression, and content expression, not through scope explosion.

## Approved Scope Summary
- Upgrade `Challenge Road` into a more substantial `Championship Path`.
- Expand encounter depth with more enemy presets, better node choreography, and a small number of derived tops.
- Add a lightweight long-term progression sink for `SCRAP`.
- Upgrade title, loadout, challenge, battle HUD, and result screens so the game feels closer to a packaged product.
- Do not introduce inventory-heavy systems, a second currency, multiplayer, or a large roguelike layer.

## Product Direction

### Why The Next Step Is Not A New Big System
- The current game already has a usable duel kernel and a working static product shell.
- The main weakness is not lack of systems; it is lack of authored depth and productized presentation.
- Adding a second mode, deeper meta systems, or a fourth combat family now would create more balancing and UI cost than value.
- The best next step is to make the current battle loop more memorable, readable, and replayable.

### What Must Stay Intact
- `Quick Battle` remains the clean sandbox mode.
- `Challenge Road` remains the primary progression shell.
- Existing top classes still define the game triangle:
  - `Impact`: aggressive collision and burst conversion.
  - `Armor`: resilience, pressure, and ring control.
  - `Trick`: line cutting, edge play, and angle abuse.
- Existing arena identities still matter:
  - `Circle`: ring pressure and center control.
  - `Heart`: asymmetric pathing and recovery.
  - `Hex`: wall angle punishment and rebound reads.

## Championship Path

### Target Shape
- Expand the current road from `6` nodes to `10` nodes.
- Present it to players as `Championship Path`.
- Keep the underlying runtime in one progression mode; do not build a second campaign system.
- Keep internal `challenge*` runtime/save/debug naming where practical; this phase is a player-facing packaging upgrade, not a project-wide rename campaign.
- Target one complete run length of about `12` to `15` minutes.

### Path Structure
- `4` chapters.
- `2` checkpoints.
- Chapter boss nodes at `3` and `6`.
- Final nodes at `9` and `10` should feel like semifinal and championship matches.
- Move `Trick` unlock forward to node `4` so the player can use it during the back half of the path.

### Chapter Intent
1. `Qualifier`
- Reintroduce the matchup triangle cleanly.
- Keep the first node readable and fair.
- Start establishing enemy personalities, not just enemy stats.

2. `Arena Circuit`
- Make `circle`, `heart`, and `hex` feel like distinct duel questions.
- Use arena pressure and modifiers to force adaptation.
- Introduce the first meaningful content unlock.

3. `Rival Series`
- Reuse known opponents but in more specialized preset forms.
- Shift from learning to counterplay.
- Make the path feel authored rather than flat.

4. `Championship`
- Deliver stronger titles, rewards, and result treatment.
- Make the final two nodes feel escalated without new combat rules.
- End with a clear champion moment and stronger share surface.

### Node Design Rules
- Each node should be defined by `arena + enemyPreset + modifier + reward`.
- Boss nodes get special labeling, first-clear bonuses, and checkpoint treatment.
- Optional node objectives can exist later, but are not required for the first implementation pass.
- Avoid filler nodes with no specific purpose.

### Recommended Metadata Additions
- `chapterId`
- `tier`
- `checkpointOnClear`
- `firstClearBonus`
- `previewLabel`
- `previewDesc`
- Optional later:
  - `bonusObjectiveId`
  - `bonusReward`

## Encounter Depth Expansion

### Core Rule
- The next content pack should deepen encounters, not widen the game uncontrollably.
- Content value should come from matchup personality and arena pressure more than from net-new mechanics.

### New Player Tops
- First package should add `2` unlockable derived tops:
  - `impact_breaker`
  - `trick_raider`
- Do not add a fourth combat family.
- Do not add more than `2` new player tops in the first pack.
- Before shipping the new tops, remove any lingering shell assumptions that only `3` tops can be shown or selected.

### Derived Top Intent
- `impact_breaker`
  - Higher speed and conversion pressure.
  - Lower forgiveness than base `impact`.
  - Feels like a line-breaking collision specialist.

- `trick_raider`
  - Higher mobility and edge-hunting pressure.
  - Lower survivability than base `trick`.
  - Feels like a predatory arena-abuse variant.

### Tops Deferred
- `armor_bastion` is allowed later but deferred from the first pack.
- Reason: it is the most likely to overlap too heavily with current `armor` feel.

### Enemy Preset Expansion
- Increase enemy personality depth before increasing combat families.
- Add at least `3` new elite presets in the first content pack.
- Preferred roster direction:
  - `armor_anchor`
  - `armor_ram`
  - `trick_hunter`
  - `trick_drifter`
  - `impact_bruiser`
  - `impact_blitz`
- First implementation pass does not need all six if three strong additions already improve encounter variety materially.

### Modifier Expansion
- Add `3` new lightweight modifiers in the first pack.
- Keep modifiers scalar and readable.
- Focus on:
  - stronger opening pressure
  - shorter decision windows
  - heavier control of arena space
- Avoid effect types that need bespoke combat scripting.

### Arena Strategy
- Do not prioritize a new fourth geometry arena in this phase.
- Keep using `circle`, `heart`, and `hex`, but make them matter more through authored encounter composition.
- Arena remix variants are acceptable later if geometry parameters become more config-driven.

## Progression And Economy

### Main Goal
- Turn `SCRAP` from a short-lived unlock currency into a lasting progression resource.
- Keep the economy transparent and readable.
- Keep one soft currency only.

### First Implementation Slice
- `Workshop Research`
- `Road Rank`

### Workshop Research
- Permanent upgrades bought with `SCRAP`.
- Exactly `3` research lines in the first version.
- Recommended lines:
  - `Spin Core`
  - `Guard Frame`
  - `Burst Relay`
- Each line should cap at `4` levels.
- Total permanent stat gain must remain conservative.

### Road Rank
- Add replayable Challenge difficulty tiers without needing a second content tree.
- Recommended first version:
  - `Rank I`
  - `Rank II`
  - `Rank III`
- Higher ranks multiply enemy tuning and rewards.
- Clearing a full rank unlocks the next one.

### Deferred Progression Layers
- `Top Mastery` is approved as the next small layer after research and rank.
- `Road Tuning Picks` are approved only as a later slice.
- Both are valid, but neither belongs in the first implementation batch.

### Economy Rules
- Keep `Quick Battle` as the lower, stable payout mode.
- Keep `Championship Path` as the main progression payout mode.
- Do not add premium currency, chest systems, or random rolls.
- Rewarded placements remain:
  - continue once after failure
  - session-limited trial unlock
  - result double reward

## UI And UX Upgrade Package

### Title Screen
- Replace the thin single-entry feel with a stronger product front door.
- Primary routes:
  - `Continue Path`
  - `Quick Battle`
  - `Workshop`
- Surface current progression state and the most important unfinished goal.
- Keep debug access low-weight and hidden behind existing rules.

### Loadout
- Reframe loadout from a utility panel into a pre-battle decision screen.
- Use one strong featured card for the selected top.
- Show top identity, skill pitch, and a small number of readable tendencies.
- Show different supporting information by mode:
  - Quick Battle: sandbox choice and arena preference
  - Championship Path: node preview, enemy preset, modifier, reward

### Championship Path Screen
- Present a clear route strip or chapter flow instead of a flat list.
- Make current node, cleared nodes, and boss nodes obvious.
- Allow each node to expose a short preview panel.
- The screen should feel like a tournament path, not a config browser.

### Battle HUD
- Improve readability without overloading the player.
- Add a brief `VS` intro card before battle.
- Make ring-out danger and edge pressure more legible.
- Prefer fewer, heavier event messages over constant small notifications.
- Improve telegraphing for enemy skill readiness and burst swings.

### Result Screen
- Separate emotional result framing from utility actions.
- Clearly display:
  - win/loss reason
  - score line
  - reward breakdown
  - unlock progress
  - next recommended action
- Make the layout naturally screenshot-friendly for sharing.

## Config And Code Boundary

### Config-First In This Phase
- `src/config-challenge-road.js`
- `src/config-enemy-presets.js`
- `src/config-modifiers.js`
- `src/config-tops.js`
- new progression config modules for research and rank
- text/config entries for chapter, node, and UX copy

### Code-Driven In This Phase
- loadout and result screen presentation logic
- route/checkpoint progression handling
- workshop purchase flow
- road rank progression flow
- HUD readability improvements
- small runtime plumbing for preview metadata

### Code Explicitly Not In Scope
- new combat family behaviors
- deep combat kernel rewrite
- new backend integrations for gameplay
- inventory, parts, crafting, or loot logic
- procedural campaign generation

## Release Discipline
- This phase must remain compatible with the existing static-host deployment path.
- Existing services remain valid boundaries:
  - `StorageService`
  - `RewardService`
  - `ShareService`
  - `AnalyticsService`
- New gameplay work must continue to emit useful analytics and remain debug-inspectable.

## Approved Non-Goals For This Phase
- multiplayer
- PvP
- login or backend accounts
- cloud save
- leaderboard service
- second currency
- parts inventory
- crafting
- large roguelike systems
- open exploration
- daily mission/live-ops stack
- fourth combat family
- major framework migration

## Recommended Implementation Order
1. expand `Challenge Road` into `Championship Path`
2. add enemy preset and modifier depth
3. add the first two derived player tops
4. add `Workshop Research`
5. add `Road Rank`
6. upgrade title, loadout, path, HUD, and result presentation
7. later add `Top Mastery`
8. later add `Road Tuning Picks`

## Final Rule
- If a future idea makes the game feel larger but not sharper, cut it.
- The purpose of this phase is to make the current game more compelling, not more bloated.
