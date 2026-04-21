# Mobile Round Result Takeover Design

## Purpose

This document locks the next small UI pass for `spin-clash`.

The goal is narrow:
- fix mobile portrait `roundResult`
- make it read as a dedicated settlement layer
- avoid reopening desktop result behavior, `matchResult`, or unrelated shell work

This is a design-and-approval document only.

## Problem Summary

Trusted mobile replay evidence shows that `roundResult` exists, but it still reads too much like battle HUD with text placed on top.

Player-facing symptom:
- the round is over, but the screen still visually competes with:
  - top status rails
  - bottom skill buttons
  - swap control
  - battle hint/message surfaces

That makes the round settlement feel transitional instead of decisive.

## Evidence Basis

Primary evidence:
- `docs/session-handoff-2026-04-21.md`
- `docs/visual-validation-protocol-2026-04-20.md`
- `output/proxy-visual-flow-video-mobile-2026-04-20T16-43-33/report.md`
- `output/proxy-visual-flow-video-mobile-2026-04-20T16-43-33/11-round-result.png`
- `output/proxy-visual-flow-video-mobile-2026-04-20T16-43-33/12-match-result.png`

Design direction was additionally confirmed in-session through a visual companion mockup:
- target choice: strong takeover, not a light transitional strip
- HUD handling choice: fully hidden during mobile `roundResult`

## Locked Decisions

### 1. This is a strong takeover pass

Mobile portrait `roundResult` should behave like a real settlement card that takes over the screen.

It should not remain a lightweight notification layer.

### 2. HUD should fully exit during mobile `roundResult`

During mobile portrait `roundResult`, the following should not remain visually active:
- top player status rail
- top enemy status rail
- bottom skill cluster
- swap control
- battle hint bar
- transient battle message surface

The arena may remain as weak context only.

### 3. Scope stays intentionally narrow

This pass should not:
- redesign desktop result screens
- restructure result timing
- rewrite `matchResult`
- solve mobile `Quick Battle` roster density
- reopen battle rules or shell architecture

## Recommended Approach

Recommend a mobile-only `roundResult takeover` layer.

What it means:
- use existing `roundResult` state as the only behavioral trigger
- add a dedicated mobile portrait visual mode for that state
- keep battle flow timing and overlay sequencing unchanged

Reason:
- it directly fixes the user-visible issue
- it keeps the change local
- it avoids mixing this visual correction with larger result-flow or shell refactors

## UI Behavior Specification

## Trigger

The takeover behavior should activate only when all of these are true:
- current game state is `roundResult`
- mobile portrait breakpoint is active
- the round-result overlay is visible

Desktop and landscape behavior should continue using the current result presentation unless separately changed later.

## Background Treatment

The arena should remain visible only as muted context.

Desired effect:
- darker overall field
- weaker arena lines and action residue
- no strong competition with the card

The player should still sense that the round happened in the arena, but the arena should no longer compete as the main reading surface.

## HUD Visibility Rules

While the mobile takeover is active:
- HUD rails should be visually removed from the active reading layer
- skill buttons should not remain readable or actionable
- swap should disappear
- hint/message surfaces should disappear

This should feel like a temporary state takeover, not a blurred version of the full battle UI.

## Round Result Card Structure

The card should be the first visual anchor.

Expected hierarchy:
1. kicker, `ROUND RESULT`
2. outcome headline, for example `ENEMY WINS`
3. round reason/detail, for example `ROUND 1 - SPIN OUT`
4. next-step line, for example `NEXT ROUND STARTING`

The card should read as one dedicated panel, not as multiple disconnected chips.

## Card Presentation Direction

On mobile portrait:
- move the card into a stronger centered position
- increase perceived panel solidity
- strengthen separation between headline and detail
- keep copy concise
- leave enough vertical breathing room so the panel feels deliberate rather than squeezed

The card should feel closer to a short-lived round-settlement screen than to a floating toast.

## Implementation Boundaries

This pass should be implemented through two small layers:

### Layer A: state-bound takeover hook

Introduce a minimal, explicit visual-state hook tied to `roundResult`.

Responsibility:
- expose one clear CSS-addressable condition for takeover mode
- avoid adding a new route, scene, or timing state

### Layer B: mobile portrait CSS specialization

Add the actual takeover behavior in mobile portrait CSS only.

Responsibility:
- hide HUD-related surfaces during takeover
- strengthen overlay/background/card separation
- keep desktop and `matchResult` behavior stable

## Files Expected To Change

Primary:
- `css/game.css`
- one runtime file that exposes the takeover condition cleanly, most likely:
  - `src/round-flow-tools.js`
  - and/or the minimal existing overlay-state surface already used by battle/result UI

Potentially:
- `scripts/check-shell-presentation.js`

Not expected:
- `index.html`
- `src/match-flow-tools.js`, except only if a tiny defensive adjustment is required to avoid regression

## Validation Requirements

Implementation is only acceptable if all of these are true.

### Contract checks

Add or update a shell-presentation contract so the codebase explicitly expects:
- a mobile-specific `roundResult` takeover mode
- hidden HUD surfaces during that mode
- preserved `matchResult` contract

### Runtime verification

Run the relevant existing checks after the change. Minimum expected set:
- `npm run check:shellpresentation`
- `npm run check:dom`
- `npm run check:ui`
- `npm run preflight`

If one of these turns out to be irrelevant to the touched files, that should be stated explicitly during implementation.

### Visual verification

Because this is a first-class mobile UI change, final visual verification must use the trusted proxy-chain flow, not untrusted attached-browser screenshots.

Required acceptance route:
1. trusted proxy replay for `mobile`
2. confirm that `roundResult` now reads as a dedicated settlement panel
3. confirm that `matchResult` is not visually degraded
4. optionally rerun desktop replay if the implementation touches shared result styles

## Acceptance Criteria

This design is successful only if the resulting mobile portrait frame makes all of the following true:

- the user can instantly tell that battle interaction is paused and the round has ended
- the round-result panel is the dominant reading surface
- HUD rails and skill buttons are not competing for attention
- the arena remains only as subdued context
- `matchResult` still reads correctly
- desktop result presentation does not regress

## Explicit Non-Goals

This pass does not attempt to solve:
- mobile `Quick Battle` bottom-strip density
- broader result-screen redesign
- battle balance or controls
- desktop shell polish
- provider or monetization work

## Decision Summary

The correct next move is:
- implement a mobile portrait `roundResult takeover`
- hide HUD surfaces during that settlement state
- keep the change local and regression-first

The incorrect move would be:
- expanding this into a larger result-system rewrite
- or treating it as a light message-strip polish pass

## Approval Gate

If approved, the next document should be a short implementation plan that covers:
1. failing contract/test additions first
2. minimal runtime hook for takeover state
3. mobile portrait CSS takeover rules
4. replay-based visual verification
