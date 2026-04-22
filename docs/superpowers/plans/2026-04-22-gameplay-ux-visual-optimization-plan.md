# Gameplay UX Visual Optimization Implementation Plan

> **Execution note:** This plan is intentionally anti-mechanical. It is designed to prevent implementation drift by forcing every change to pass through UX intent, visual hierarchy review, and player-path validation before it is considered done.

## Goal

Implement the gameplay UX and visual optimization package defined in:

- `C:\Users\29940\spin-clash\docs\superpowers\specs\2026-04-22-gameplay-ux-visual-optimization-design.md`

without reducing the work to:
- bug fixing
- style cleanup
- direct design-to-code translation without judgment

The purpose of implementation is to realign each key screen with the player's real question in that moment.

## Non-Negotiable Execution Rules

These rules exist to prevent the implementation from drifting away from the approved design.

### Rule 1: Never optimize a surface without restating its player question

Before touching any screen, the worker must explicitly state:
- what question the player is trying to answer on this screen
- what the current screen is doing that blocks that answer
- what the revised visual/interaction hierarchy should prioritize

If this is not clear, implementation should pause.

### Rule 2: Do not "fix visibility" without checking information hierarchy

Increasing contrast, size, or spacing is not automatically a UX improvement.

Every visual adjustment must answer:
- is the screen now clearer
- or merely louder

### Rule 3: Do not treat text as the only fix

Many current problems are structural:
- wrong placement
- wrong grouping
- wrong primary action
- wrong pacing

Text rewrites are allowed only when they support a stronger structure.

### Rule 4: Every change must be judged in context, not in isolation

A button, title, or card may look correct in a static local screenshot and still fail in the player journey.

Each optimized screen must be checked inside its full flow:
- how the player arrived
- what emotional state they are in
- what they need to do next

### Rule 5: Visual polish cannot override readability

If a more atmospheric version is less readable, the readable version wins.

### Rule 6: Mobile is the primary truth for gameplay screens

Desktop fit matters, but gameplay comprehension decisions should be made against mobile-first play conditions.

### Rule 7: Each wave must stop for visual/interaction review before moving on

Do not complete a wave and immediately continue to the next one.

Each wave ends with:
- screenshot review
- flow verification
- explicit pass/fail judgment

## Implementation Structure

This work should be executed in three waves.

## Wave 1: Comprehension And Momentum Recovery

### Scope

- GX-001 battle opening guidance
- GX-002 round result readability and causality
- GX-006 match result CTA hierarchy and failure recovery flow

### Why This Wave Comes First

These three screens determine whether:
- a first-session player understands what to do
- a losing player understands what happened
- a frustrated player can continue without hesitation

This is the highest-value wave for clarity and retention.

### Desired Outcome

The player should experience:
- a more teachable battle opening
- a more understandable round result
- a more guided match result

### Work Package A: Battle Opening Guidance

#### Intent Lock

The battle opening must answer:

`What do I do first, and what should I pay attention to right now?`

#### Implementation Tasks

- [ ] Capture the current opening state in mobile portrait with visible top HUD, arena, and bottom controls
- [ ] Identify which current instruction is truly required in the first 3-5 seconds
- [ ] Design a pre-launch micro-brief structure
- [ ] Design a near-control reinforcement structure for the bottom action zone
- [ ] Validate that opening guidance feels instructional, not noisy

#### Drift Risks

- making the opening busier rather than clearer
- duplicating too much text in multiple places
- over-explaining advanced concepts too early

#### Review Gate

Pass only if:
- the opening state has one obvious instructional center
- the player can infer the first move without reading the whole HUD

### Work Package B: Round Result Causality

#### Intent Lock

The round result must answer:

`What just happened, and what should I adjust next round?`

#### Implementation Tasks

- [ ] Capture current round result in mobile portrait against a strong battle background
- [ ] Identify which result information is essential versus decorative
- [ ] Recompose the result surface into headline, cause, and next-step layers
- [ ] Reduce background competition during the result state
- [ ] Verify that the explanation reads like player-facing language, not system jargon

#### Drift Risks

- turning the result card into a large but still vague banner
- adding more text without improving explanation quality
- keeping the battle residue too active behind the result layer

#### Review Gate

Pass only if:
- result cause is legible within one glance
- the card feels authoritative enough to temporarily own the screen

### Work Package C: Match Result Decision Hierarchy

#### Intent Lock

The match result must answer:

`What is the best next action for me right now?`

#### Implementation Tasks

- [ ] Map all current CTAs by user intent: recovery, navigation, monetization, sharing
- [ ] Define the correct primary action for loss states
- [ ] Define the correct primary action for win states
- [ ] Reduce same-level visual competition among CTAs
- [ ] Ensure rewarded and continue actions feel optional but still visible

#### Drift Risks

- solving the issue only by hiding buttons
- making monetization feel deceptive or overly suppressed
- letting visual color rules override behavioral priority

#### Review Gate

Pass only if:
- one next step is clearly recommended
- the player is not forced into menu-style thinking after a result

## Wave 2: Decision Quality And Progression Readability

### Scope

- GX-003 home mode-entry hierarchy
- GX-004 champion path decision support
- GX-005 workshop decision support

### Why This Wave Comes Second

These are not as urgent as battle comprehension, but they shape:
- session start quality
- progression clarity
- spending confidence

### Desired Outcome

The player should:
- understand the play entry structure faster
- understand current route stakes faster
- make upgrade choices more confidently

### Work Package D: Home Entry Hierarchy

#### Intent Lock

The home screen must answer:

`Where should I tap to start the kind of session I want?`

#### Implementation Tasks

- [ ] Re-evaluate the vertical weight of hero showcase versus mode entries
- [ ] Clarify the difference between structured progression and quick session entry
- [ ] Protect atmosphere without delaying action clarity
- [ ] Check that the first-screen scan path now reaches the play decision faster

#### Drift Risks

- flattening the home into a generic menu
- over-correcting and losing the game's identity
- keeping hero scale high enough to preserve the same problem

#### Review Gate

Pass only if:
- mode entry is easier to understand than the decorative showcase block

### Work Package E: Champion Path Decision Support

#### Intent Lock

The path screen must answer:

`What am I fighting now, and what do I gain if I clear it?`

#### Implementation Tasks

- [ ] Separate current-node information from surrounding progression metadata
- [ ] Increase reward salience without creating visual clutter
- [ ] Re-stage current node, next reward, and supporting rank context
- [ ] Verify that the action path is visually dominant over supporting numbers

#### Drift Risks

- preserving the same density but moving labels around
- making the page cleaner while still slow to parse
- over-highlighting everything and recreating hierarchy collapse

#### Review Gate

Pass only if:
- current node and reward promise are understood before surrounding metadata

### Work Package F: Workshop Decision Support

#### Intent Lock

The workshop must answer:

`What should I upgrade next, and what will that do for me right away?`

#### Implementation Tasks

- [ ] Audit each upgrade card for current-vs-next readability
- [ ] Improve visibility of the delta between current state and next level
- [ ] Improve cost readability in relation to current scrap
- [ ] Ensure the page supports comparison, not just reading

#### Drift Risks

- adding recommendation badges without solving core comparison clarity
- making cards more decorative but no easier to compare
- relying on longer descriptions instead of better structure

#### Review Gate

Pass only if:
- a player with limited scrap can compare options quickly and explain their choice

## Wave 3: Trust Surface And Product Completeness

### Scope

- GX-007 desktop public info shell maturity
- GX-008 multilingual mobile info header stability

### Why This Wave Comes Third

These screens affect:
- perceived product completeness
- trust
- review-readiness

They matter, but they do not block gameplay comprehension directly.

### Desired Outcome

The product should feel more complete and deliberate across both gameplay and supporting pages.

### Work Package G: Desktop Public Info Shell

#### Intent Lock

Desktop info pages must answer:

`Am I reading a real product page or a temporary overlay?`

#### Implementation Tasks

- [ ] Re-evaluate shell width, header presence, and vertical rhythm on desktop
- [ ] Increase the visual authority of the reading frame
- [ ] Use desktop negative space deliberately rather than leaving it empty
- [ ] Preserve the game tone without making the page feel insubstantial

#### Drift Risks

- building a separate corporate style that breaks shell identity
- keeping the mobile card unchanged and only enlarging text
- filling space without improving trust or reading flow

#### Review Gate

Pass only if:
- the page reads as a deliberate site state rather than a popup

### Work Package H: Multilingual Mobile Info Header

#### Intent Lock

The mobile info header must answer:

`What page am I on, and how do I go back?`

#### Implementation Tasks

- [ ] Evaluate English, Chinese, and Japanese title behavior under the same narrow viewport
- [ ] Define one stable mobile header pattern that works for all languages
- [ ] Ensure return action, title, and first paragraph start share one reading axis
- [ ] Remove compressed fallback-looking title behavior

#### Drift Risks

- solving only one language
- improving header geometry but hurting body start rhythm
- allowing title treatments to feel inconsistent across locales

#### Review Gate

Pass only if:
- all three languages fit the same header logic without awkward compression

## Per-Step Validation Method

Every work package must use the same validation sequence.

### Step 1: Before Snapshot

Capture the current screen in the player flow.

Record:
- how the player got here
- what the player likely wants here
- what the current surface makes hard

### Step 2: Intent Statement

Write one sentence:

`This screen must help the player understand/do ______ first.`

If this sentence cannot be written clearly, do not implement yet.

### Step 3: Proposed Hierarchy

Before changing code, define:
- what should be primary
- what should be secondary
- what should be supporting
- what should be reduced or removed

### Step 4: Implementation

Apply the smallest cohesive change that improves structure.

Avoid mixed changes that touch unrelated surfaces.

### Step 5: Immediate Visual Review

Check:
- readability
- spacing
- hierarchy
- emotional tone
- whether the screen now answers the right question faster

### Step 6: Full-Flow Review

Re-enter the same screen through the real player flow.

Check:
- does it still make sense in sequence
- does it create a new conflict with prior or next screens
- did the visual language drift from the rest of the product

## Anti-Drift Checklist

This checklist must be asked after each meaningful change.

- [ ] Did this change improve comprehension, not just visibility?
- [ ] Did the dominant question of the screen become easier to answer?
- [ ] Did we improve placement and grouping, not only copy?
- [ ] Did we preserve the current product tone?
- [ ] Did the primary action become clearer than the alternatives?
- [ ] Did mobile readability improve first?
- [ ] Did this introduce a new hierarchy conflict elsewhere?
- [ ] Would a real player feel more guided, not more managed?

## Verification Deliverables

Each completed wave should leave behind:

- before/after screenshots
- a short note describing the player question solved
- a short note describing what was intentionally not changed
- pass/fail against the review gate

## Final Recommendation

Implementation should be managed like a sequence of UX realignments, not a style pass.

The correct test for success is not:

`Does the UI look more polished?`

The correct test is:

`At each critical moment, can the player answer the right question faster, with less hesitation, and without losing the game's tone?`
