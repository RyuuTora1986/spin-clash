# Home Top Showcase Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `Home` screen's text-first top summary with a model-first top showcase that still preserves the existing Spin Clash shell style and selected-top flow.

**Architecture:** Keep the battle scene untouched. Add a dedicated lightweight home showcase renderer that reuses the existing top model factory, mount it inside the home shell, and keep left/right cycling bound to the same `playerTopId` already used by route and battle flow.

**Tech Stack:** Static HTML, CSS, vanilla JS, existing Three.js runtime

---

### Task 1: Home Showcase Layout

**Files:**
- Modify: `index.html`
- Modify: `css/game.css`

- [ ] Replace the current home text card with a model-stage-first layout that still includes arrows, name, type, and one short descriptor.
- [ ] Keep the panel inside the current `Home` shell and preserve the existing visual language.
- [ ] Ensure mobile layout still stacks cleanly.

### Task 2: Home Showcase Runtime

**Files:**
- Create: `src/home-top-showcase-tools.js`
- Modify: `index.html`
- Modify: `src/main.js`
- Modify: `src/ui-entry-tools.js`
- Modify: `src/loadout-ui-tools.js`

- [ ] Add a dedicated home showcase helper with its own small Three renderer, scene, camera, idle animation, and resize handling.
- [ ] Reuse `createTopRenderTools().mkTop(...)` so home models match battle models.
- [ ] Keep showcase visibility tied to `uiRoute === 'home'`.
- [ ] Reuse the existing unlocked-top cycling and selected-top state instead of introducing a second top-selection source.

### Task 3: Text, Checks, And Logging

**Files:**
- Modify: `src/config-text.js`
- Modify: `scripts/check-shell-presentation.js`
- Modify: `docs/change-records/2026-04-17-ui-flow-combat-rework-log.md`
- Modify: `progress.md`

- [ ] Reduce home copy to model-supporting text instead of the previous text-heavy presentation.
- [ ] Extend shell checks so the new home showcase DOM and bindings are covered.
- [ ] Record the slice and validations in the rollback/change logs.

### Task 4: Verification

**Files:**
- Test only

- [ ] Run `npm run check:syntax`
- [ ] Run `npm run check:ui`
- [ ] Run `npm run check:shellpresentation`
- [ ] Run `npm run preflight`
