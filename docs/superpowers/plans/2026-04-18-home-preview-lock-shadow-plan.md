# Home Preview Lock Shadow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the `Home` top showcase into a lightweight roster preview that can browse unlocked and locked tops, replaces `X/N` counting with lock state messaging, and renders locked tops as shadowed teaser models.

**Architecture:** Keep the static HTML/CSS/JS shell intact and preserve the current visual style. Separate `Home` preview state from the equipped `playerTopId`, let `ui-entry-tools` own preview cycling, let `loadout-ui-tools` own status/copy rendering, and let `home-top-showcase-tools` apply a locked shadow material pass without touching battle rendering.

**Tech Stack:** Plain HTML, CSS, vanilla JavaScript modules in `src/`, existing node-based repo checks, existing Chrome CDP bridge for browser verification.

---

### Task 1: Lock the expected Home preview behavior in checks

**Files:**
- Modify: `scripts/check-shell-presentation.js`
- Modify: `package.json` only if a new script is needed

- [ ] Add a failing assertion that `Home` preview status no longer renders an `X/N` string and that locked preview copy downgrades to lock-state guidance.
- [ ] Run: `npm run check:shellpresentation`
- [ ] Confirm the check fails for the missing behavior, not for a syntax error.

### Task 2: Split Home preview state from equipped top state

**Files:**
- Modify: `src/main.js`
- Modify: `src/ui-entry-tools.js`

- [ ] Add `homePreviewTopId` state in `main.js`, initialize it from `playerTopId`, and pass `get/setHomePreviewTopId` into the relevant tools.
- [ ] Update `ui-entry-tools.js` so `prevHomeTop` / `nextHomeTop` cycle across the full top roster instead of only unlocked tops.
- [ ] Preserve battle/loadout behavior so route entry and battle start still use unlocked `playerTopId`, not a locked preview target.
- [ ] Run: `npm run check:syntax`

### Task 3: Render Home copy as status + teaser guidance

**Files:**
- Modify: `src/loadout-ui-tools.js`
- Modify: `src/config-text.js`

- [ ] Replace the `home-top-count` `X/N` output with a compact status label: unlocked vs locked.
- [ ] Keep `name` and `type` visible for locked tops.
- [ ] For locked tops, suppress full skill/trait disclosure and show teaser copy plus unlock-source guidance.
- [ ] For unlocked tops, keep the normal descriptive copy path.
- [ ] Run: `npm run check:shellpresentation`

### Task 4: Add locked shadow rendering for Home preview

**Files:**
- Modify: `src/home-top-showcase-tools.js`

- [ ] Teach the Home-only showcase renderer to detect whether the preview top is locked.
- [ ] Apply a shadow teaser presentation for locked tops: darkened materials, reduced emissive color, faint edge/highlight feel, and a restrained lock/signal accent that stays within the current style.
- [ ] Leave battle rendering and loadout card rendering unchanged.
- [ ] Run: `npm run check:syntax`

### Task 5: Verify in the attached Chrome session and document rollback

**Files:**
- Modify: `docs/change-records/2026-04-17-ui-flow-combat-rework-log.md`
- Modify: `progress.md`

- [ ] Reload the current `http://127.0.0.1:4173/index.html` tab through the local CDP bridge.
- [ ] Capture one screenshot showing unlocked preview behavior and one showing locked shadow preview behavior.
- [ ] Run: `npm run preflight`
- [ ] Record the change, validation commands, screenshot paths, and rollback scope in both logs.
