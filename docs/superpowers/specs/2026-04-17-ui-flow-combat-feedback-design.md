# UI Flow And Combat Feedback Design

## Purpose

This document translates the latest playtest feedback into one coherent optimization direction before any implementation starts.

This is a design-and-approval document only.

Hard constraints:
- preserve the current visual style
- do not turn the shell into a framework rewrite
- keep the duel core intact
- leave explicit rollback records during implementation

## Feedback Normalization

The raw feedback clusters into two real problem groups.

### Group A: Navigation And Screen Hierarchy

Player-facing symptoms:
- the interface feels messy
- too much content is stacked into one screen
- entering and returning are not predictable enough
- the player can lose track of where they are
- Championship Path is not yet presented like a real tournament route

### Group B: Combat Readability And Identity

Player-facing symptoms:
- collisions do not clearly communicate who struck whom
- durability does not yet produce the desired time-pressure curve
- skill identity is still too shallow
- the current top triangle is readable, but not deep enough in moment-to-moment expression

## What The Feedback Reveals

### 1. The current shell has an information architecture problem, not an art problem

Your feedback is not saying the game looks bad.

It is saying:
- the player does not have a stable mental map
- too many functions are being solved by one overloaded screen
- the shell currently behaves more like a developer control panel than a player-facing product flow

### 2. The game needs stronger state visibility

The player needs to know at a glance:
- where they are
- why they are here
- what they can do here
- what happens if they press the main button
- where they return after backing out or finishing a battle

Right now, those expectations are not explicit enough.

### 3. The combat needs stronger causality, not only more balance tweaks

Your combat feedback is not only "numbers are off".

It points to a deeper issue:
- impacts need clearer attacker/defender logic
- attrition needs to be easier to feel over time
- every top needs a more obvious baseline toolkit plus one clearer signature identity

## Current Code Findings

These are the concrete reasons the current shell produces the feeling you described.

### Current screen structure is flatter than it looks

At runtime, the current product shell is mostly:
- title screen
- one overloaded loadout screen
- battle
- result

Evidence:
- all three title entries route into the same `openLoadout(...)` flow in `src/ui-entry-tools.js:46`
- `ENTER PATH`, `QUICK BATTLE`, and `WORKSHOP` are different parameters into the same destination, not three real screens: `src/ui-entry-tools.js:70`, `src/ui-entry-tools.js:74`, `src/ui-entry-tools.js:78`
- the title buttons in `index.html:126` all feed that same structure

### Workshop and Championship are embedded inside the loadout screen

Evidence:
- workshop is a toggle panel, not an independent route: `src/loadout-ui-tools.js:211`, `src/loadout-ui-tools.js:688`
- Championship content is shown by hiding/showing a panel inside the same screen: `src/loadout-ui-tools.js:445`
- map strip and rank strip are already present, but they live inside that overloaded surface: `index.html:198`, `index.html:202`

### There is no real route stack or "return expectation"

The current shell mostly swaps overlays and mode flags.

This is why the player can feel:
- "I changed mode, but I did not really enter a different place"
- "I opened workshop, but it still feels like I am on the same page"
- "I finished a battle, but the return target is not a clear place in the product"

### Collision damage is currently close to symmetric

Evidence:
- collision is resolved in one shared `checkColl(...)` block: `src/battle-sim-tools.js:198`
- both sides take damage from the same base `damage=force*0.55`: `src/battle-sim-tools.js:224`
- both sides also lose spin from the same `force*18` pattern in that same block

This makes heavy collisions energetic, but not always directional enough.

### Only spin currently drains over time

Evidence:
- ongoing time attrition currently drains `spin`, not `hp`: `src/battle-sim-tools.js:103`

So if the desired fantasy is "durability also slowly breaks down over time, differently by top", that system does not exist yet.

### Skill structure is still shallow

Evidence:
- all tops currently have one top-defined special skill in config: `src/config-tops.js:10`
- runtime gives every top universal dash plus one single special skill slot: `src/round-flow-tools.js:83`

So your requested model:
- universal dash
- universal shield
- one additional signature skill per top

is not a tuning pass.
It is a real combat-interface and combat-rules upgrade.

## Bottom-Cause Summary

Your feedback ultimately points to four structural problems:

1. `Route structure is overloaded`
2. `State visibility is too implicit`
3. `Collision causality is too symmetric`
4. `Top identity is still only partially expressed`

That means the correct answer is not "just tweak some labels" and not "just rebalance hp".

It needs a coordinated shell-and-combat plan.

## Approach Options

### Option A: Router-first split, then combat refresh

What it means:
- keep the current art direction
- split the overloaded loadout into real screens
- establish explicit enter/back paths first
- then adjust collision, durability, and skill structure

Pros:
- solves the real navigation problem
- safest for player comprehension
- easiest to validate screen by screen
- easiest to leave rollback checkpoints

Cons:
- requires touching multiple shell modules
- not the cheapest short patch

### Option B: Keep one super-screen, but clean it up harder

What it means:
- keep the single loadout shell
- add stronger tabs, labels, breadcrumbs, and clearer button wording
- do not create real independent screens

Pros:
- cheapest code cost
- lowest immediate implementation risk

Cons:
- does not actually solve the overloaded mental model
- still feels like one giant panel with submodes
- likely to leave the same "I am lost" feeling

### Option C: Big hub redesign with more 3D shell behavior

What it means:
- add bigger camera transitions
- make the home screen more theatrical
- use more animated shell composition

Pros:
- strongest spectacle

Cons:
- too risky right now
- too easy to break the stable shell
- not necessary to solve the root issue

## Recommendation

Recommend `Option A`.

Reason:
- it addresses the actual cause of the UX confusion
- it preserves the current visual language
- it gives us the cleanest rollback path
- it separates navigation fixes from battle fixes instead of mixing them blindly

## Recommended Target Product Structure

## Screen Hierarchy

The shell should become five explicit player-facing screens:

1. `Home`
2. `Championship Path`
3. `Quick Battle`
4. `Workshop`
5. `Settings`

Battle and result stay as their own runtime layers, but they should return to the screen that launched them.

## Route Rules

### Home

Purpose:
- identity hub
- progress summary
- primary routing screen

Content:
- current unlocked top showcase
- left/right top switch for unlocked tops
- current progress summary
- `Championship Path`
- `Quick Battle`
- `Workshop`
- `Settings`

Expected return:
- if the player backs out from Championship, Quick Battle, Workshop, or Settings, they return here unless they entered Workshop/Settings as subroutes

### Championship Path Screen

Purpose:
- tournament map
- current progress visibility
- node selection and resume expectation

Content:
- graphical route / map strip
- current node
- cleared nodes
- boss / checkpoint / final emphasis
- progress summary
- current rank
- workshop shortcut
- `Continue` or `Start`
- `Back`

Expected return:
- entering a battle from here returns to here after battle flow ends

### Quick Battle Screen

Purpose:
- sandbox setup for fast play

Content:
- arena selection
- unlocked tops
- locked tops
- locked arenas
- workshop shortcut
- settings shortcut
- `Quick Start`
- `Back`

Expected return:
- entering a battle from here returns to here after battle flow ends

### Workshop Screen

Purpose:
- progression spending only

Content:
- research list
- current permanent effects
- cost and next level
- context header showing where the player came from
- `Back`

Expected return:
- if entered from Home, go back to Home
- if entered from Championship Path, go back to Championship Path
- if entered from Quick Battle, go back to Quick Battle

### Settings Screen

Purpose:
- low-frequency adjustments only

MVP content:
- language
- music on/off
- SFX on/off
- maybe reset confirmation entry later, but not by default in the first pass

Expected return:
- return to previous screen

## UI State Model

The shell should move from:
- overlay toggles plus mode flags

to:
- one explicit `uiRoute`
- one explicit `uiRouteFrom`
- one explicit `battleReturnRoute`

Recommended route IDs:
- `home`
- `path`
- `quick`
- `workshop`
- `settings`
- `battle`
- `result`

This is the core fix for "the player gets lost".

## Context Visibility Rules

Each screen should make three things explicit:

1. current place
2. current progress
3. expected primary action

That means:
- a clear screen title
- a one-line progress/context strip
- a clearly named primary button
- a visible `Back`

No screen should rely on the player guessing what the big button does.

## Visual-Style Preservation Rule

Implementation should preserve:
- current typography direction
- current chrome style
- current panel glow / frame language
- current button style family
- current arena/top presentation flavor

Allowed changes:
- screen split
- element re-layout
- button wording
- stronger route-map presentation
- one additional action button in battle HUD if approved

Not allowed:
- changing the art direction just because we are restructuring the flow

## Combat Optimization Direction

The combat work should be treated as a second package after the route split is stable.

## Collision Logic V2

Design goal:
- make it easier to feel who delivered the hit and who absorbed it

Recommended rule:
- keep shared collision impulse physics
- split post-collision damage into `aggressor` and `defender` outcomes

Recommended calculation direction:
- determine impact advantage from closing speed and momentum direction
- if one top clearly initiated or carried more impact into the contact:
  - defender loses more `hp`
  - defender loses more `spin`
  - aggressor still takes recoil, but less `hp`
- in near head-on equal collisions:
  - damage remains closer to even

This preserves chaos, but adds causality.

## Durability Attrition V2

Design goal:
- make long fights feel like a real breakdown race, not only a spin drain race

Recommended rule:
- keep current spin drain
- add a small `durabilityDrainPerSec` / `hpDecayPerSec` layer per top

Important:
- this must be light, not dominant
- hits still need to matter more than passive decay

Recommended identity direction:
- `Armor`: lowest durability decay
- `Impact`: medium durability decay
- `Trick`: higher durability decay
- variants inherit from family, then get small offsets

This creates clearer archetype pacing.

## Skill Structure V2

Your requested target is valid, but it is not a small tweak.

Recommended model:
- `Dash`: universal default action
- `Guard`: universal default defense action
- `Signature`: one unique top skill

This implies a three-action battle HUD.

### Why this is the right structure

It improves three things at once:
- baseline readability
- player onboarding
- top identity expression

It also removes the current problem where `Shield` is both:
- a baseline defensive fantasy
- and only Armor's personal signature

## Signature Skill Direction

If `Guard` becomes universal, family signatures should be:

- `Impact`: forward break / charge conversion
- `Armor`: anchor slam / fortress pulse / counter-weight burst
- `Trick`: phantom feint / angle cut / ghost pass

Derived tops should then be tuned variants of those families, not whole new combat families.

## Control Recommendation

PC:
- `Space` = Dash
- `E` = Guard
- `Q` = Signature

Mobile:
- add one more action button, but keep the current HUD language

This is a medium-risk change and should not be mixed into the same commit as the route refactor.

## Implementation Packaging Recommendation

Do not implement all requested changes in one undifferentiated batch.

Use this order:

### Phase 1: Shell Route Refactor

Deliver:
- real `Home`
- real `Championship Path`
- real `Quick Battle`
- real `Workshop`
- real `Settings`
- explicit `Back`
- explicit route state

### Phase 2: Battle Return Logic

Deliver:
- launch source tracking
- result-to-origin return path
- clearer result CTA wording by origin

### Phase 3: Collision And Attrition Refactor

Deliver:
- aggressor/defender damage split
- top-specific passive durability decay
- new balance baseline

### Phase 4: Skill Structure Upgrade

Deliver:
- universal guard
- new signature mapping
- HUD control expansion

### Phase 5: Balance And UX Polish

Deliver:
- tune numbers
- refine labels
- tighten edge cases

## Rollback Discipline

This feedback explicitly asks for rollback records, so implementation should include them as a formal rule.

Recommended rollback method:

1. create a change log document before implementation:
   - `docs/change-records/2026-04-17-ui-flow-combat-rework-log.md`
2. keep one implementation phase per commit or checkpoint
3. record before/after route maps and combat rules in that log
4. do not mix shell route refactor and combat skill refactor in the same checkpoint
5. preserve the existing playable state as the rollback base before Phase 1 starts

Minimum checkpoint set:
- `before_ui_route_refactor`
- `after_ui_route_refactor`
- `after_battle_return_refactor`
- `after_collision_attrition_refactor`
- `after_skill_structure_refactor`

## Validation Plan

### Shell Validation

The player should be able to answer correctly:
- where am I
- what is this screen for
- what happens if I press the main button
- where will back take me

### Navigation Validation

Required route tests:
- `Home -> Championship Path -> Battle -> Result -> Championship Path`
- `Home -> Quick Battle -> Battle -> Result -> Quick Battle`
- `Home -> Workshop -> Back -> Home`
- `Championship Path -> Workshop -> Back -> Championship Path`
- `Quick Battle -> Workshop -> Back -> Quick Battle`
- `Quick Battle -> Settings -> Back -> Quick Battle`

### Combat Validation

Required feel checks:
- aggressive clean hits should visibly punish the defender more
- prolonged fights should show different durability decay profiles by top
- universal guard must be understandable without hurting pace
- signature skills must feel more distinct than the current single-skill setup

## Decision Summary

The feedback should be interpreted as:
- `do not redesign the art`
- `do redesign the shell structure`
- `do make collision outcomes more directional`
- `do deepen top identity with universal baseline tools plus one signature skill`

## Approval Gate

If approved, the next implementation spec should follow this exact order:

1. route hierarchy
2. return-path logic
3. collision and durability rules
4. skill structure
5. tuning and polish

If rejected, the main thing to decide is this:
- whether you want the recommended real screen split
- or a cheaper but weaker "single loadout screen cleanup" path
