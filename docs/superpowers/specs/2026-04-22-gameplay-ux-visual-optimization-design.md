# Gameplay UX Visual Optimization Design

## Purpose

This document turns the latest player-path visual and interaction review into a concrete optimization design package.

This is a design-only document.

It does not change code.

Goals:
- deepen root-cause analysis for each UX issue
- translate each issue into visual and interaction design principles
- propose focused optimization directions instead of vague polish notes
- define validation standards before any implementation starts

Hard constraints:
- preserve the current art direction and tone
- do not flatten the game into a generic app UI
- optimize for real mobile play first, then desktop fit
- keep changes scoped to player comprehension, feedback, and decision flow

## Review Basis

This design is based on two evidence sets:

1. Trusted mobile player-flow captures covering:
   - Home
   - Champion Path
   - Workshop
   - Settings
   - Quick Battle
   - Battle
   - Round Result
   - Match Result

2. Current-build public info page captures covering:
   - About
   - Privacy
   - Contact

This means the plan is grounded in real player-facing surfaces, not only code inspection.

## Design Principles

All optimization decisions in this package follow these principles.

### 1. One Screen, One Dominant Question

Every screen should help the player answer one main question quickly.

Examples:
- Home: what should I play now
- Battle opening: what do I do first
- Round result: what just happened
- Match result: what should I do next

If a screen tries to answer too many questions at once, the player slows down and confidence drops.

### 2. State Must Be Visible Before It Is Understandable

Players do not infer system state from subtlety.

They need to see:
- where they are
- what state they are in
- what changed
- what action is currently primary

Weak contrast, overloaded panels, or distant explanations all reduce state visibility.

### 3. Action Guidance Must Stay Near Action Controls

Instructions are only useful if they appear close to the controls or timing where the action is needed.

A correct sentence in the wrong place is still bad UX.

### 4. Results Must Explain Cause, Not Only Outcome

Players should not only see win or loss.

They should quickly understand:
- why this outcome happened
- whether it was skill, attrition, timing, or resource use
- what can be improved next attempt

### 5. Failure Screens Must Restore Momentum

After a loss, the player is in a fragile emotional state.

The interface should reduce recovery cost by:
- keeping the main next step clear
- lowering decision burden
- avoiding equal-weight button clusters

### 6. Reading Mode Must Match Device Mode

Mobile reading surfaces and desktop reading surfaces cannot share the same scale assumptions.

Public information, long-form explanation, and dense decision text all need separate presentation logic from combat HUD surfaces.

## Root Cause Map

The review findings reduce to five structural causes:

1. `Instruction-placement mismatch`
   - key guidance exists, but sits too far from the action moment

2. `Weak result framing`
   - result surfaces show a headline, but do not clearly frame cause and next step

3. `Over-equalized hierarchy`
   - too many panels and buttons visually compete at the same level

4. `Decision support is under-designed`
   - upgrade and route screens show information, but do not help the player choose

5. `Reading shells are mobile-derived and desktop-underfit`
   - legal/info pages work functionally but do not yet feel like first-class product surfaces

## Issue-by-Issue Optimization Design

## GX-001 Battle Opening Guidance Is Too Dark And Too Distant

### Current Symptom

At battle start, the player sees the arena, the tops, the scoreboard, and the skill deck.

But the actual input explanation is weak and physically detached from the bottom action zone.

### Deep Root Cause

This is not only a contrast problem.

It is a three-layer design failure:

1. `Timing failure`
   - the game asks the player to act before ensuring the action model has landed

2. `Proximity failure`
   - the explanation sits near the HUD, but the actual affordances live near the bottom skill/action zone

3. `Priority failure`
   - the battle spectacle and scoreboard visually outrank the learning instruction

### Design Principles Being Violated

- Action Guidance Must Stay Near Action Controls
- One Screen, One Dominant Question
- State Must Be Visible Before It Is Understandable

### Optimization Objective

Make the first 3-5 seconds of battle answer one clear player question:

`What should I do right now to start correctly?`

### Recommended Optimization Direction

Use a `two-step opening guidance model`.

Step A: `pre-launch micro-brief`
- before the duel fully begins, show one short, high-contrast line that states the immediate action goal
- example structure:
  - action
  - defensive fallback
  - special meter expectation

Step B: `near-control guidance`
- mirror the same logic near the bottom controls
- each action card should reinforce its role through label hierarchy and readiness wording

Supporting rules:
- the top HUD should stop carrying the full burden of instruction
- the opening state should visually feel like a guided readiness state, not a fully live competitive state from frame one
- the first actionable control should visually anchor the scene

### UX Outcome Target

The player should understand within one glance:
- how to begin
- what each ready action means in broad terms
- what not to worry about yet

### Validation Standard

A fresh player should be able to describe the opening action model after one battle start without trial-and-error tapping.

## GX-002 Round Result Explains Too Little And Feels Too Weak

### Current Symptom

Round result overlays communicate that the round ended, but do not strongly explain why or what the player should take away.

The background remains visually assertive enough that the result card loses authority.

### Deep Root Cause

This issue sits at the intersection of perception and learning.

1. `Outcome-only framing`
   - the screen tells the player who won, but not what the meaningful cause was

2. `Visual authority gap`
   - the result layer does not sufficiently dominate the previous combat layer

3. `Feedback compression`
   - the screen compresses result, explanation, and transition into a single weakly differentiated block

### Design Principles Being Violated

- Results Must Explain Cause, Not Only Outcome
- State Must Be Visible Before It Is Understandable
- Failure Screens Must Restore Momentum

### Optimization Objective

Turn round result from a pass-through overlay into a readable learning checkpoint.

### Recommended Optimization Direction

Use a `three-band result card`:

Band 1: `headline result`
- who took the round
- whether the result came from ring-out, durability, time, or burst timing

Band 2: `cause summary`
- one sentence that explains the deciding factor in player language
- not a raw system phrase

Band 3: `next-step cue`
- whether the next round auto-starts
- whether the player should adjust pacing, defense, or timing

Visual rules:
- result card must clearly overpower battle residue
- background trails should be suppressed harder during result state
- body text should move from decorative low-contrast style to a more legible result-reading mode

### UX Outcome Target

The player should leave the round result screen with a concrete learning impression, not only a memory of the headline color.

### Validation Standard

After a round loss, a player should be able to answer:
- who won
- why
- what to watch next round

without replaying the moment in their head.

## GX-003 Home Prioritizes Showcase Over Immediate Play Start

### Current Symptom

The home screen looks polished, but the top showcase area consumes a large share of attention and vertical space.

The actual mode-entry decisions arrive later than they should.

### Deep Root Cause

This is a conversion-hierarchy issue.

1. `Hero-first composition`
   - the screen is composed like a product teaser before it is composed like a play launcher

2. `Entry compression`
   - mode choices are grouped below the visual centerpiece and inherit secondary priority

3. `Intent ambiguity`
   - the player must interpret whether the screen wants them to inspect, browse, or start

### Design Principles Being Violated

- One Screen, One Dominant Question
- State Must Be Visible Before It Is Understandable

### Optimization Objective

Make the home screen answer:

`What is the fastest, clearest way for me to start playing?`

while preserving current brand tone.

### Recommended Optimization Direction

Shift from `showcase-led home` to `play-start-led home`.

This does not mean removing the hero card.

It means:
- compress hero height
- reduce explanatory text burden in the showcase area
- promote primary play entries higher in the scan path
- give the top route and quick route a clearer difference in promise

Structural recommendation:
- treat showcase as context
- treat mode entry as the true primary block

### UX Outcome Target

A new player should know within two seconds:
- what the game is broadly about
- which button starts a structured run
- which button starts a short session

### Validation Standard

In first-view tests, players should identify the intended primary play entry without needing to scroll their attention down the entire screen.

## GX-004 Champion Path Is Informative But Not Decisive Enough

### Current Symptom

The path screen exposes useful data, but it asks the player to decode too many parallel signals:
- node number
- rank
- reward
- lock state
- current loadout
- entry CTA

### Deep Root Cause

This is a decision-support gap, not a missing-data problem.

1. `Metadata parity`
   - too many informational elements are given similar visual weight

2. `Weak progression framing`
   - current node, next node, and long-term rank context are present but not strongly staged

3. `Reward salience mismatch`
   - rewards are visible, but not framed as a motivating forward promise

### Design Principles Being Violated

- One Screen, One Dominant Question
- State Must Be Visible Before It Is Understandable

### Optimization Objective

Make the path screen answer:

`What am I about to fight, and why should I care?`

### Recommended Optimization Direction

Rebuild the page around a `progression stack`.

Top level:
- current run context
- current node status

Middle level:
- next challenge promise
- reward value

Lower level:
- supporting metadata such as rank lane and surrounding nodes

Key rule:
- current actionable node must dominate
- surrounding progression should support anticipation, not compete with the present decision

### UX Outcome Target

The player should be able to identify the current challenge and its reward faster than they identify supporting metadata.

### Validation Standard

A player should correctly answer:
- what node they are on
- what they get if they clear it
- whether they are locked or ready

after one fast glance.

## GX-005 Workshop Supports Reading Better Than Choosing

### Current Symptom

Workshop cards explain upgrades, but they do not strongly help the player choose where to spend scrap next.

### Deep Root Cause

This is a strategy-surface design issue.

1. `Explanation-first layout`
   - cards prioritize descriptive completeness over comparative decision support

2. `Weak delta emphasis`
   - the jump from current state to next state is not visually memorable enough

3. `Low recommendation energy`
   - the screen never helps the player feel which option is the better immediate spend

### Design Principles Being Violated

- One Screen, One Dominant Question
- State Must Be Visible Before It Is Understandable

### Optimization Objective

Make workshop answer:

`What should I upgrade next, and what will it do for me right away?`

### Recommended Optimization Direction

Convert each workshop card from `specification card` to `decision card`.

Each card should highlight:
- current level
- next upgrade effect
- immediate gameplay meaning
- cost in relation to current scrap

Recommended support patterns:
- stronger current-vs-next comparison
- clearer affordability read
- if desired later, lightweight recommendation language based on playstyle

Key caution:
- do not turn this into over-automated hand-holding
- the system should clarify trade-offs, not make the decision for the player

### UX Outcome Target

The player should compare upgrade options in seconds rather than reading each card like a manual.

### Validation Standard

A player with limited scrap should be able to explain why they chose one upgrade over another without rereading every line.

## GX-006 Match Result Has Too Many Equal-Weight CTAs

### Current Symptom

The match result screen exposes many valid next actions, but too many of them feel visually primary:
- return
- adjust build
- double reward
- continue via ad
- share

### Deep Root Cause

This is the clearest momentum-recovery issue in the current shell.

1. `Emotional-state mismatch`
   - after a loss, the player is in a low-confidence state, but the UI asks for a high-effort decision

2. `Action hierarchy collapse`
   - monetization, navigation, recovery, and sharing all sit too close together in perceived priority

3. `Context-blind CTA ordering`
   - the screen does not adapt strongly enough to whether the player most likely wants recovery, learning, or exit

### Design Principles Being Violated

- Failure Screens Must Restore Momentum
- One Screen, One Dominant Question
- Results Must Explain Cause, Not Only Outcome

### Optimization Objective

Make match result answer:

`What is my best next move right now?`

### Recommended Optimization Direction

Move from a `CTA stack` to a `recovery model`.

Primary layer:
- one recommended next action based on context

Secondary layer:
- one alternative recovery or reward action

Tertiary layer:
- low-priority utility actions such as share

The main principle is not fewer buttons at all costs.

It is clearer decision staging.

For loss states, the likely order should be:
- recover or re-enter
- then reward-related optionality
- then navigation
- then share

For win states, the order can change toward progression and reward celebration.

### UX Outcome Target

The player should be gently pushed toward the most likely next action instead of asked to evaluate a menu.

### Validation Standard

After a result, players should choose the intended primary next step quickly and with low hesitation.

## GX-007 Desktop Public Info Pages Feel Too Light To Carry Trust

### Current Symptom

Public info pages technically work, but on desktop they appear as small floating cards inside a large dark field.

They read more like temporary overlays than stable product pages.

### Deep Root Cause

This is a trust-surface maturity problem.

1. `Mobile shell directly upscaled`
   - the layout inherits a compact mobile logic instead of a desktop reading logic

2. `Insufficient page authority`
   - the content shell does not claim enough space to feel official

3. `Context vacuum`
   - too much unused empty space makes the surface feel detached from the product frame

### Design Principles Being Violated

- Reading Mode Must Match Device Mode
- State Must Be Visible Before It Is Understandable

### Optimization Objective

Make desktop public info pages feel like legitimate product surfaces rather than emergency compliance add-ons.

### Recommended Optimization Direction

Adopt a `desktop reading shell`.

This should include:
- larger content width
- stronger structural header presence
- clearer vertical rhythm
- a balanced frame that uses desktop space intentionally

The goal is not to build a corporate microsite.

The goal is to make the information feel native, stable, and deliberate.

### UX Outcome Target

A desktop visitor should feel that the site has complete, trustworthy supporting pages.

### Validation Standard

In screenshots and live use, the info page should read as an intentional page state, not a small centered popup.

## GX-008 Mobile Chinese Public Info Header Wastes Horizontal Reading Space

### Current Symptom

The Chinese contact page header reads awkwardly, with the title pushed into a narrow vertical-feeling edge treatment.

### Deep Root Cause

This is a multilingual layout issue.

1. `Header logic not language-aware`
   - the same header structure does not adapt to CJK title shape

2. `Over-compressed title zone`
   - the return control and title compete for the same narrow horizontal band

3. `Reading-flow interruption`
   - the title is no longer part of a clean top-down reading rhythm

### Design Principles Being Violated

- Reading Mode Must Match Device Mode
- State Must Be Visible Before It Is Understandable

### Optimization Objective

Make mobile public info headers feel stable and natural across English, Chinese, and Japanese.

### Recommended Optimization Direction

Use a `single reading axis header` on mobile.

That means:
- back control
- page title
- body start

should all sit inside one top-down reading rhythm.

Do not force Chinese titles into edge-aligned compressed treatments that feel like fallback behavior.

### UX Outcome Target

The player should identify page title and return path instantly, regardless of language.

### Validation Standard

Each supported language should render into the same stable header pattern on a narrow mobile viewport without awkward compression.

## Sequencing Recommendation

This package should be implemented in three waves.

### Wave 1: Comprehension-Critical

Ship first:
- GX-001 battle opening guidance
- GX-002 round result readability
- GX-006 match result CTA hierarchy

Reason:
- these are the highest-impact moments for first-session comprehension and post-failure retention

### Wave 2: Decision Quality

Ship second:
- GX-003 home entry hierarchy
- GX-004 champion path decision support
- GX-005 workshop decision support

Reason:
- these improve session flow, perceived clarity, and long-term engagement quality

### Wave 3: Trust And Product Completeness

Ship third:
- GX-007 desktop info shell
- GX-008 multilingual mobile info header

Reason:
- these matter for trust and product finish, but do not block core play comprehension

## Validation Framework

Implementation should not be judged by visual preference alone.

Each wave should be checked against these questions:

### Comprehension Checks
- can a first-session player explain what to do
- can a losing player explain what happened
- can a result-state player identify the main next step instantly

### Decision Checks
- can the player identify the current challenge quickly
- can the player compare upgrades without rereading everything
- can the player distinguish structured run vs short battle on home

### Trust And Reading Checks
- do public info pages feel like product pages, not patches
- do all three languages fit the same shell naturally
- does desktop reading mode look intentionally designed

## Final Recommendation

Do not treat this as a generic polish pass.

The right implementation mindset is:

- `Wave 1` solves comprehension and momentum
- `Wave 2` solves decision support
- `Wave 3` solves trust-surface maturity

The most important strategic takeaway is this:

The game does not mainly suffer from weak styling.

It suffers from several moments where visual hierarchy and interaction hierarchy do not align with the player's question in that moment.

The optimization work should therefore focus on realignment, not decoration.
