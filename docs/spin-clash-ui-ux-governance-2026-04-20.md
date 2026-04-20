# Spin Clash UI/UX Governance 2026-04-20

This document defines a project-specific UI/UX governance layer for `spin-clash`.

It is not a generic frontend manifesto.

It is the narrowed design source of truth for this game shell, built by combining the strongest parts of the already-installed local skills:
- `frontend-skill`
- `animejs-front-end-skill`
- `develop-web-game`

It also reflects the approved project direction already recorded in:
- `docs/superpowers/specs/2026-04-17-ui-flow-combat-feedback-design.md`
- `docs/unlock-source-ui-design-2026-04-20.md`
- `docs/focused-human-playtest-2026-04-20.md`

The goal is to define:
- what this game's shell should feel like
- what each screen is responsible for
- how player-facing information should be expressed
- how UI changes should be judged before implementation

## 1. Why This Exists

The current project does not mainly suffer from missing features.

The bigger risk is drift:
- pages slowly accumulate mixed responsibilities
- player-facing text slips back into dev-facing explanation
- preview surfaces and action surfaces blur together
- progression and unlock logic become stronger than their presentation
- mobile interactions remain technically functional but not legible enough as a finished game product

This governance layer exists to stop that drift.

## 2. Source Skill Extraction

## `frontend-skill`

What it contributes:
- strong visual thesis before page work
- one dominant idea per section
- anti-clutter bias
- composition before components
- game UI should feel deliberate, not like stacked utility cards

What is retained for Spin Clash:
- every screen needs one dominant purpose
- no filler copy
- no section should require many tiny devices to explain itself
- premium feel comes from hierarchy, restraint, and signature composition

## `animejs-front-end-skill`

What it contributes:
- motion must justify itself
- motion is for hierarchy, confirmation, reward, and tactile feel
- one coherent beat should use one coherent motion language
- reduced-motion and readability still matter

What is retained for Spin Clash:
- motion should reinforce battle readiness, unlock moments, reward beats, and route transitions
- motion must not become decorative shell noise
- game shell animation is allowed to be expressive, but only around meaningful beats

## `develop-web-game`

What it contributes:
- verify through real interaction, not only code confidence
- gameplay UI must be judged by what the player can actually perceive and operate
- text state and screen state must agree
- iterate in small steps and validate after each meaningful change

What is retained for Spin Clash:
- a shell change is not successful because the code is cleaner
- it is successful only if a player can understand and operate it faster
- visual clarity, tap clarity, and progression clarity are all part of correctness

## 3. Core Product Definition

Spin Clash is not a SaaS shell with game colors.

It is a fast single-player web game with:
- short sessions
- strong object identity
- lightweight progression
- repeatable challenge runs
- clear unlock, spend, and battle loops

That means the shell must feel like:
- an arcade decision surface
- a tournament progression surface
- a tuning and ownership surface

It must not feel like:
- a developer control panel
- an over-explained prototype
- a content dashboard

## 4. Visual And Tonal Direction

The shell direction should be treated as:

`Arcade precision + energy-tech atmosphere + restrained tournament framing`

Practical implications:
- the game may be bold, but not noisy
- typography should feel intentional and machine-sharp, not generic admin UI
- information should feel staged like a competitive interface, not a settings-heavy product tool
- action color, warning color, reward color, and neutral shell color must each have a distinct job
- spectacle belongs to the battle, featured top, unlock, reward, and route-entry beats
- routine navigation should stay calm

## 5. Hard Governance Rules

## Rule 1: One Screen, One Job

Every player-facing screen must have one dominant purpose.

Allowed primary purposes:
- `Home`: orient and route
- `Championship Path`: progress and commit to the next challenge
- `Quick Battle`: choose and launch a fast match
- `Workshop`: spend on permanent upgrades
- `Settings`: adjust preferences

If a screen starts solving two of those jobs at once, it must be redesigned.

## Rule 2: Every Screen Must Close Four Questions

A successful screen answers, at a glance:
- where am I
- what can I do here
- what do I get here
- how do I leave or continue

If any one of those requires reading a paragraph, the screen is not closed.

## Rule 3: Preview And Action Must Not Be Confused

Preview surfaces may show:
- identity
- aspiration
- state
- short next-step hints

Action surfaces must show:
- exact available action
- cost or requirement
- immediate result of acting

If a player sees a locked top in a preview area, they should not have to guess whether it can be bought there.

## Rule 4: Formal Game Copy Only

Player-facing copy may describe:
- what this thing is
- what this action does
- what this reward gives
- what this requirement is

Player-facing copy must not:
- explain system internals
- sound like design notes
- sound like QA hints
- instruct the player like a tutorial unless the game has explicitly entered tutorial mode

The default voice is:
- formal
- short
- game-facing
- object/action/reward oriented

## Rule 5: Mobile First Means Tap Clarity First

For this project, mobile-first does not mainly mean breakpoint correctness.

It means:
- the correct target is obvious
- the correct target is easy to hit
- locked vs available vs selected vs purchasable states are clearly distinct
- no critical action depends on hover logic
- confirmation and failure states are explicit

## Rule 6: One Primary Action Per Screen

Each screen may have several actions, but only one should feel primary.

Examples:
- Home: `Continue Path`
- Championship Path: `Continue` or `Start`
- Quick Battle: `Quick Start`
- Workshop: purchase upgrade
- Settings: there may be no dominant CTA at all

If two calls to action compete visually, the screen loses clarity.

## Rule 7: Progression Must Be Legible Before It Is Deep

The player should understand:
- what is already owned
- what is earned by rank progression
- what is bought with SCRAP
- what is unavailable right now

before they are expected to care about the deeper meta.

Depth without legibility reads as randomness.

## Rule 8: Motion Must Pay Rent

Motion is justified when it improves:
- route transition readability
- battle readiness
- unlock excitement
- reward confirmation
- tactile response

Motion is not justified when it merely decorates a stable information surface.

## Rule 9: Information Density Must Follow Player Intent

When the player is routing:
- low density

When the player is choosing loadout:
- medium density

When the player is evaluating a challenge:
- medium density with tactical focus

When the player is spending:
- medium density with clear before/after value

When the player is fighting:
- only combat-critical information

## Rule 10: A Finished Shell Must Be Self-Consistent

The same state model must appear consistently across screens:
- unlocked
- locked
- purchasable
- rank reward
- selected
- equipped
- current
- cleared
- boss/final

If the same state reads differently on two screens, one of them is wrong.

## 6. Screen-Specific Governance

## Home

Purpose:
- identity hub
- route entry
- lightweight progress reminder

Must show:
- current featured top
- one short progress line near the main CTA
- the primary route actions

Must not become:
- a tutorial wall
- a status dashboard
- a shopping screen

Design reading:
- this is where the player regains orientation
- this is not where the player resolves detailed progression questions

## Championship Path

Purpose:
- communicate the next challenge
- communicate route progression
- communicate what the player wins by pushing forward

Must show:
- current node identity
- current rank
- route state
- battle-relevant summary
- reward summary

Must not show:
- large explanatory prose about what the mode is
- scattered map-adjacent commentary
- duplicate route descriptions

Design reading:
- this screen should feel like a tournament bracket / route board, not a documentation panel

## Quick Battle

Purpose:
- fast setup and immediate launch

Must show:
- top identity
- arena choice
- lock or unlock state
- if locked, the exact acquisition path

Must not force the player to infer:
- where to buy the top
- whether the top is a rank reward
- whether the surface is preview-only or action-capable

Design reading:
- this is the highest-risk screen for action ambiguity and should be treated as an operation surface, not a showcase surface

## Workshop

Purpose:
- permanent upgrade spending

Must show:
- current upgrade track
- next level value
- cost
- current balance if needed for the purchase decision

Must not become:
- a top store
- a mode explanation page

Design reading:
- Workshop is for meta investment, not for general unlock discovery

## Settings

Purpose:
- low-frequency preference adjustment

Must show:
- language
- music
- SFX

Must not show:
- tutorial copy
- dev-facing explanation
- route narration

Design reading:
- this screen should feel almost silent

## 7. Unified State Language

The game should converge on a stable source language for unlock and progression states.

Recommended state vocabulary:
- `Unlocked`
- `Selected`
- `Starter`
- `Road Reward`
- `SCRAP Unlock`
- `Clear RANK I to unlock`
- `Clear RANK II to unlock`
- `Clear RANK III to unlock`
- `Buy for {cost} SCRAP`
- `Current Node`
- `Cleared`
- `Boss`
- `Final`

Avoid:
- vague `Locked`
- vague `Available in Workshop`
- mode-describing copy where state-describing copy is needed

## 8. Visual Validation Evidence Hierarchy

This project now has an explicit evidence hierarchy for visual review.

Not all screenshots are trustworthy enough to judge layout, hierarchy, or polish.

The order is:

1. `Highest trust`: user-supplied real browser screenshots from the actual visible window
2. trusted proxy / clean-profile browser screenshots where the capture chain is known to map correctly to the visible viewport
3. local automated screenshots used only for structural debugging, never as sole evidence for final visual judgement

Project rule:
- no final UI/UX judgement may be made from an attached-browser screenshot chain that has already shown viewport mismatch, crop drift, or coordinate inconsistency
- if automated screenshots show partial capture, wrong anchoring, or mismatched center/corner markers, they become invalid evidence for design review immediately
- once a screenshot chain is invalidated, it may still be used to detect obvious runtime bugs, but not to approve layout or aesthetic quality

Practical enforcement:
- for `spin-clash`, direct CDP attachment to a live user Chrome session must not be treated as trustworthy visual evidence unless it has been revalidated
- if there is any doubt, the review must fall back to real user-window screenshots
- no agent should ask for a human playtest on the basis of questionable screenshots

This is not optional process overhead.

For this project, visual evidence quality is part of correctness.

## 9. The Hypothetical Skill: How It Would Judge This Game

If a dedicated Spin Clash shell-design skill existed, it would not start from color palettes.

It would start from this audit order:

1. identify the surface type
   - route / choose / spend / commit / result / fight
2. identify the dominant player intent
3. run the four-question closure check
4. identify mixed responsibilities
5. identify state ambiguity
6. identify action discoverability failures
7. identify copy-tone drift
8. identify unnecessary motion or missing motion
9. propose the smallest structural correction that restores clarity

That means the skill would behave more like a shell governor than a visual style generator.

## 9. Re-Analysis Of Spin Clash Using This Governance

## Summary Judgment

Using this governance layer, the current game direction is viable.

The main problem is no longer "the game lacks a UI style."

The main problem is:
- some high-value surfaces still mix preview and action
- progression clarity is stronger in logic than in presentation
- some text still explains too much or explains the wrong thing
- some route surfaces are clear in code but not yet equally clear in player perception

This is a solvable shell-governance problem, not a foundation problem.

## Home: Current Judgment

Recent cleanup moved Home in the right direction.

What is now structurally correct:
- the top area is lighter
- language has been moved into Settings
- the main CTA area is simpler
- the progress reminder is shorter

What still needs guarding:
- the featured top area must remain preview-first, not silently turn into a purchase surface
- if a locked top is shown here, the next step hint must stay short and route the player elsewhere
- Home must not re-accumulate secondary system information

Final standard:
- the player should understand identity and direction here, not manage progression here

## Championship Path: Current Judgment

This screen is the most important shell surface after Home.

What it must become:
- a route board with one tactical summary

What currently tends to go wrong in this type of screen:
- map text, node text, mode text, and progression text all compete
- the player reads mechanics explanation instead of challenge context

Final standard:
- at one glance, the player should know:
  - what the next node is
  - what arena they are entering
  - what opponent or modifier matters
  - what reward they are chasing

If the player instead reads a paragraph about the mode, the screen has failed.

## Quick Battle: Current Judgment

This is currently the most fragile UX surface.

Why:
- it combines model showcase, top identity, and acquisition logic
- the player can see a locked top before they know where purchase happens
- the current shell moved away from card-heavy lists, which improved visual focus, but also reduced direct acquisition discoverability

What this governance layer says:
- Quick Battle should keep the model-centric presentation
- but the action path beside the model must explicitly declare:
  - source
  - requirement
  - action

Recommended target:
- model area explains `what it is`
- adjacent action area explains `how to get it`

This is the clearest example of why the game now needs governance more than more features.

## Workshop: Current Judgment

Workshop should remain a strict permanent-upgrade surface.

This means:
- do not move top purchasing into Workshop just to compensate for confusing copy elsewhere
- do not let Workshop become a generic "everything progression" page

What Workshop should communicate:
- this is where you improve your long-term machine

What it should not communicate:
- this is where every locked thing in the game is handled

## Settings: Current Judgment

Recent cleanup direction is correct.

This screen should stay nearly contentless:
- preference labels
- toggles
- back

If explanatory copy creeps back in, it should be treated as regression.

## Unlock And Purchase System: Current Judgment

The underlying progression categories are now stronger than before:
- starter
- road reward
- purchasable

The remaining risk is not system design.

It is acquisition discoverability.

The game should converge on this rule:
- every locked top must tell the player, on the current screen, whether it is:
  - not available here
  - preview-only here
  - purchasable here
  - earned elsewhere

This is more important than adding more tops right now.

## Copy System: Current Judgment

Copy should continue moving toward:
- nouns
- states
- action labels
- reward labels

and away from:
- system explanation
- internal rationale
- tutorial tone outside tutorial mode

The right question for every line is:
- is this telling the player what this thing is
- or is it explaining the design of the system

If it is the second, cut or rewrite it.

## Motion System: Current Judgment

This game should not become animation-heavy by default.

It should reserve stronger motion for:
- featured top transitions
- challenge-entry emphasis
- unlock grant
- purchase confirmation
- reward collection
- result return

Routine browsing motion should stay restrained.

The shell should feel alive, not busy.

## 10. What "Good Enough" Looks Like

The shell can be treated as good enough when:
- every major screen has one obvious job
- every major screen closes the four player questions
- locked and unlocked states are unmistakable
- Road reward and SCRAP purchase are never confused
- Home, Path, Quick Battle, Workshop, and Settings each feel like distinct places
- player-facing copy reads like a finished game, not a prototype explanation
- the player can discover the next correct action without guessing

## 11. Recommended Next Use

Use this document as the gate before future shell/UI work.

Any future page or shell change should be checked against:
- screen job
- four-question closure
- preview vs action separation
- state vocabulary consistency
- action discoverability
- copy-tone discipline
- motion justification

Only after this governance layer proves useful through real iterations should it be generalized into a reusable system skill.
