# Gameplay UX Visual Optimization Checklist

## Purpose

This checklist is the execution-side guardrail for the gameplay UX visual optimization work.

It should be used:
- before implementation
- during implementation
- after each screen-level change
- at the end of each wave

This checklist exists to prevent a common failure mode:

problem found -> solution described -> implementation drifts into superficial polish

## A. Pre-Implementation Screen Brief

Before touching any target screen, answer all of these.

- [ ] What screen is being changed?
- [ ] What player flow leads into this screen?
- [ ] What emotional state is the player likely in here?
- [ ] What is the one dominant question the player is trying to answer?
- [ ] What current element blocks that answer?
- [ ] What should become primary after optimization?
- [ ] What should become secondary?
- [ ] What should become less visible or less dominant?

If any answer is unclear, do not implement yet.

## B. Visual Hierarchy Checklist

Use this to verify that a screen is structurally improving, not merely becoming louder.

- [ ] Is there one clearly dominant visual entry point?
- [ ] Does the first scan path match the intended player question?
- [ ] Are primary, secondary, and supporting elements visually separated?
- [ ] Are decorative elements subordinate to decision or comprehension elements?
- [ ] Is the screen clearer, not just brighter, bigger, or denser?
- [ ] Does contrast support hierarchy rather than flatten everything into equal emphasis?

## C. Interaction Logic Checklist

Use this to verify action design quality.

- [ ] Is the primary action obvious?
- [ ] Is the primary action placed where the eye naturally arrives?
- [ ] Are optional actions visibly optional?
- [ ] Is the player being asked to make too many same-level decisions at once?
- [ ] Is any guidance close to the control or timing where it is needed?
- [ ] After taking the likely next action, does the flow still make sense?

## D. Feedback Quality Checklist

Use this especially for battle, round result, and match result states.

- [ ] Does the screen communicate state before expecting interpretation?
- [ ] Does it explain cause, not only outcome?
- [ ] Does it tell the player what changed?
- [ ] Does it imply what the player should do next?
- [ ] Is any failure state guiding the player back into momentum instead of stalling them?

## E. Mobile-First Readability Checklist

Use this for all gameplay-facing screens.

- [ ] Is the layout readable in mobile portrait first?
- [ ] Is the main information readable without strain?
- [ ] Are instruction, action, and result elements still visible under mobile density?
- [ ] Does any element feel too far from the control it describes?
- [ ] Does the screen still feel composed instead of crowded?

## F. Multilingual And Reading-Surface Checklist

Use this for info pages, text-heavy screens, and any header-level changes.

- [ ] Does English fit naturally?
- [ ] Does Chinese fit naturally?
- [ ] Does Japanese fit naturally?
- [ ] Do all three languages preserve the same reading logic?
- [ ] On mobile, do back button, title, and body start align into one reading axis?
- [ ] On desktop, does the page feel intentional rather than floating or undersized?

## G. Anti-Drift Questions

Ask these after every meaningful change.

- [ ] Did we solve the underlying structure, not just the symptom?
- [ ] Did we change the screen in a way that matches the approved design intent?
- [ ] Did we accidentally introduce a new ambiguity while solving the old one?
- [ ] Did we preserve product tone?
- [ ] Did we avoid generic app-like solutions that weaken the game's identity?
- [ ] Did we avoid solving a visual issue with copy alone?
- [ ] Did we avoid making the screen more complex while trying to clarify it?

## H. Wave-End Acceptance

A wave should not be marked complete until all are true.

- [ ] Before/after evidence exists
- [ ] The dominant player question for each changed screen is easier to answer
- [ ] The main next action is clearer than before
- [ ] The overall screen tone still belongs to Spin Clash
- [ ] No new obvious visual hierarchy regression was introduced
- [ ] No new interaction confusion was introduced in adjacent screens

## I. Deliverable Record

For each work package, record:

- [ ] target screen
- [ ] player question
- [ ] root cause addressed
- [ ] what changed
- [ ] what intentionally stayed unchanged
- [ ] validation result

## Final Rule

If a change looks cleaner but does not make the player's question easier to answer, it does not count as a successful optimization.
