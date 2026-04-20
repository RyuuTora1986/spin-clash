# Unlock Source UI Design 2026-04-20

This document defines the narrow UI pass for making top unlock sources understandable without reopening gameplay systems or ad-provider boundaries.

## 1. Problem

The current unlock logic is stronger than the current unlock presentation.

After the 15-top merge:
- some tops are starter content
- some are Road rewards
- some are Workshop purchases

But the player-facing shell still trends toward generic “locked” messaging.

That is too weak for the current progression structure.

## 2. Design Goal

A player should understand, without entering battle, which of the following applies:
- usable immediately
- unlocked by clearing a rank milestone
- purchased in the Workshop with SCRAP

## 3. Recommended UI Language

Use one consistent three-source vocabulary:
- `Starter`
- `Road Reward`
- `Workshop`

Avoid inventing extra categories unless the underlying logic changes.

## 4. Priority Surfaces

### Surface A: Loadout top cards
This is the most important surface.

Every top card should communicate:
- lock state
- unlock source
- price if purchasable
- milestone hint if Road-only

Recommended card copy:
- starter unlocked:
  - `Starter top`
- road locked:
  - `Road Reward`
  - `Clear RANK I to unlock`
  - `Clear RANK II to unlock`
  - `Clear RANK III to unlock`
- workshop locked:
  - `Workshop`
  - `Unlock for 320 SCRAP`
- mixed future fallback if ever needed:
  - `Road Reward or Workshop`

### Surface B: Home featured top panel
This is the preview surface.

It should not be as detailed as the loadout card, but it should still show:
- current source class
- one short next-step hint if locked

### Surface C: Rank reward preview
If the rank shell already has a reward row, it should explicitly name the reward top rather than only implying “better rewards”.

This is not a new feature branch.

It is a clarity pass on an already-existing reward structure.

## 5. Scope Control

Keep this pass narrow.

Do:
- improve text
- add small labels/badges
- surface exact rank requirement where already derivable from config

Do not:
- redesign the full shell
- add new progression systems
- add new currencies
- widen reward logic
- touch provider integration files

## 6. Likely Implementation Scope

Primary files:
- `src/loadout-ui-tools.js`
- `src/ui-entry-tools.js`
- `src/config-text.js`

Conditional only if needed:
- `index.html`

## 7. Acceptance Criteria

This UI pass is successful if:
- locked Road tops no longer look identical to locked Workshop tops
- players can infer the next action from the card itself
- the copy stays short enough to avoid clutter
- all three locales remain consistent

## 8. Sequence Constraint

Do not implement this before finishing the balance/unlock validation pass.

If the rank reward ordering or price ladder changes, this copy will need to change with it.

The correct order is:
1. validate unlock structure
2. make any config-only corrections
3. implement this UI clarity pass
