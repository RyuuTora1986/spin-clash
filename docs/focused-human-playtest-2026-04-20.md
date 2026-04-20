# Focused Human Playtest 2026-04-20

Use this only after the current content-line prep is complete.

This is not a full regression pass.

It is the focused human-experience gate for the recent content work:
- arena expansion
- 15-top roster expansion
- narrow trick-access correction
- unlock-source UI clarity pass

## 1. Goal

Answer these four questions:
- Does the early progression now feel less narrow?
- Can a player understand how each locked top is earned?
- Do the rank rewards feel meaningful without making the shop feel pointless?
- Are any tops obviously overpowered, underpowered, or overpriced from direct feel?

## 2. Setup

Recommended:
1. open `index.html?debug=1`
2. use `RESET SAVE`
3. begin from a fresh state

Do not use broad debug skipping unless a step explicitly says so.

## 3. Playtest Route

### Segment A: first impression and unlock clarity

Steps:
1. Stay on the title screen and cycle through several tops.
2. Enter the loadout shell.
3. Review at least:
   - one starter top
   - one Road reward top
   - one Workshop top
4. Without starting a match yet, answer:
   - can you tell which tops are starter content?
   - can you tell which tops come from Road ranks?
   - can you tell which tops are bought with SCRAP?

What to notice:
- whether `Road Reward` vs `Workshop` reads immediately
- whether exact rank/cost hints are understandable at a glance
- whether any wording feels too long, noisy, or repetitive

### Segment B: early-path roster feel

Steps:
1. Start from the default fresh save.
2. Play through early Challenge Road progress normally.
3. Clear through the second checkpoint if practical.
4. Watch when `trick_venom` becomes realistically buyable.

What to notice:
- whether `impact + armor` still feels too narrow before the first meaningful shop decision
- whether the earlier `trick_venom` cost now creates a believable third-style entry point
- whether the shop now presents at least one meaningful non-starter temptation before the Road reward arrives

### Segment C: rank reward meaning

Steps:
1. Continue until at least one Road reward top is earned or can be previewed clearly.
2. Compare the reward top feeling against nearby Workshop options.

What to notice:
- does `trick` feel like a real milestone or “finally, the roster starts”?
- if `armor_bastion` is previewed/earned, does it make `armor_aegis` or `armor_mirror` feel pointless?
- does `impact_nova` feel like a prestige reward rather than a mandatory late fix?

### Segment D: direct top feel

Pick at least one top from each family you can access and play short matches.

Suggested minimum:
- `impact`
- `armor`
- `trick_venom` if purchased
- one reward top if available

What to notice:
- obvious dominance
- obvious frustration
- whether a top feels badly priced for what it delivers
- whether a top feels fun but too niche to justify its current unlock route

## 4. What Feedback Is Most Valuable

Most useful:
- “I understood this instantly / I did not understand this”
- “This top felt worth buying / not worth buying”
- “This reward felt exciting / too late / redundant”
- “This family became available at the right time / too late”

Less useful:
- broad “good/bad” statements without a concrete moment

## 5. Output Format

When the user is finally called in, ask for feedback in this shape:

1. What was the first locked top whose unlock path felt immediately clear?
2. At what point did the roster stop feeling too narrow?
3. Which top felt most worth buying?
4. Which top felt overpriced or unnecessary?
5. Which rank reward felt best, and which felt weakest?
6. Did any label or hint text feel confusing or too verbose?

## 6. Stop Rule

If the player reports:
- the roster still feels too narrow for too long
- Road reward wording is still unclear
- one reward top invalidates a whole paid branch

then stop before doing any broader content expansion and resolve that first.
