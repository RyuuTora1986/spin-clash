# Content Naming Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the approved top, arena, and type naming scheme into runtime content without changing stable content ids or combat families.

**Architecture:** Add a regression check that loads the live config files and asserts the approved naming map, then update the English base content plus Chinese/Japanese locale overlays and card type presentation strings to match. Keep `id`, `family`, and `variant` unchanged so unlock flow, save data, and combat behavior remain stable.

**Tech Stack:** Static browser runtime, plain JavaScript config files, Node-based config validation scripts

---

### Task 1: Lock naming expectations in a regression check

**Files:**
- Create: `scripts/check-content-naming.js`
- Modify: `package.json`

- [ ] Add a Node config check that loads `src/config-text.js`, `src/config-tops.js`, and `src/config-arenas.js`, then asserts the approved English/Chinese/Japanese top names, arena names, and family-level card type labels.
- [ ] Wire the new script into `package.json` as `check:naming`.
- [ ] Run `npm run check:naming` and confirm it fails before content changes because the current names still use placeholder wording.

### Task 2: Update runtime content names and type labels

**Files:**
- Modify: `src/config-tops.js`
- Modify: `src/config-arenas.js`
- Modify: `src/config-text.js`

- [ ] Replace the English base top names in `src/config-tops.js` with the approved gradient-aware machine names.
- [ ] Replace the English base arena labels in `src/config-arenas.js` with the approved arena names.
- [ ] Update `src/config-text.js` so:
  - `arenaOptions` and `quickArenaDescriptions` use the new arena names and flavor.
  - `cards[].type` becomes family-level type text instead of per-top variant names.
  - Chinese and Japanese locale overlays (`contentLocales`) use the approved localized top and arena names.
  - Chinese and Japanese `cards[].type` strings also map to the three shared families.

### Task 3: Verify naming integration

**Files:**
- Test: `scripts/check-content-naming.js`
- Test: `scripts/check-localization.js`
- Test: `scripts/check-loadout-flow.js`
- Test: `scripts/check-road-rank-ui.js`

- [ ] Run `npm run check:naming` and confirm the new expectations pass.
- [ ] Run `npm run check:localization` to verify locale tables and card labels still align.
- [ ] Run `npm run check:loadout` and `npm run check:roadrank` to verify name changes did not break unlock/loadout display flows.
