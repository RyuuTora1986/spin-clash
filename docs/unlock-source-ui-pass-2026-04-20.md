# Unlock Source UI Pass 2026-04-20

This is the implementation note for the first narrow unlock-source clarity pass.

## What Changed

The pass stays inside existing text surfaces.

It does not add a new progression system or a new shell panel.

### Loadout cards
- top type line now includes source class:
  - `Starter`
  - `Road Reward`
  - `Workshop`
- locked card hint text now uses exact requirement style instead of generic `LOCKED`

Examples:
- `Road Reward · Clear RANK I to unlock`
- `Workshop · Unlock for 180 SCRAP`

### Home preview panel
- the kicker now reflects unlock source instead of a generic fixed label
- locked Road tops now show exact rank unlock text where the reward rank is derivable
- locked Workshop tops now show exact purchase cost

### Road rank note
- the rank note now explicitly names the reward top, not only the reward multiplier

## What This Pass Intentionally Does Not Do

- no shell redesign
- no new badge component
- no new currency or reward logic
- no provider/runtime boundary changes

## Why This Scope Is Correct

After the Phase 1A / 1B content work, the main remaining clarity gap was:
- players could not immediately tell how a locked top was meant to be earned

That problem is solved best by:
- better source labels
- better exact hint text

not by adding more UI chrome.
