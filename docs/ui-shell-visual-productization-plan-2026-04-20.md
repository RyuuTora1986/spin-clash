# Spin Clash UI Shell Visual Productization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current shell from a logic-complete prototype into a clearer product-grade game UI across `Home`, `Championship Path`, `Quick Battle`, `Workshop`, and `Settings`.

**Architecture:** Keep the current static runtime and route model. Improve the shell through layout re-weighting, route-specific visibility rules, stronger state language, and a small number of new action surfaces instead of rewriting core flow. `Championship Path` becomes a real route page, `Quick Battle` becomes a real pre-fight page, and `Home`/`Workshop`/`Settings` are visually rebalanced without touching gameplay or ad-provider boundaries.

**Tech Stack:** Static HTML, plain JS runtime factories under `src/`, CSS in `css/game.css`, existing local validation scripts, CDP-attached Playwright screenshot review.

---

## File Map

**Modify**
- `C:\Users\29940\spin-clash\index.html`
- `C:\Users\29940\spin-clash\css\game.css`
- `C:\Users\29940\spin-clash\src\loadout-ui-tools.js`
- `C:\Users\29940\spin-clash\src\ui-entry-tools.js`
- `C:\Users\29940\spin-clash\src\config-text.js`
- `C:\Users\29940\spin-clash\docs\docs-index.md`
- `C:\Users\29940\spin-clash\progress.md`

**Verify**
- `npm run check:syntax`
- `npm run check:dom`
- `npm run check:localization`
- `npm run check:settings`
- `npm run check:loadout`
- `npm run check:routes`
- `npm run check:ui`
- `npm run check:shellpresentation`
- `npm run preflight`

## Task 1: Lock The Route-Specific Visual Hierarchy

**Files:**
- Modify: `C:\Users\29940\spin-clash\src\loadout-ui-tools.js`
- Modify: `C:\Users\29940\spin-clash\css\game.css`

- [ ] Add route-specific shell classes so `home`, `path`, `quick`, `workshop`, and `settings` can each have distinct visual ordering and visibility rules without introducing a new router.
- [ ] Remove the current `Championship Path` dependency on the full top-card wall as the main visual surface.
- [ ] Restrict the currency bar to the surfaces where spending context matters, instead of showing it everywhere.
- [ ] Reorder the `Championship Path` shell so route information and the primary action dominate the page.
- [ ] Verify route transitions still render the correct panels after the class/visibility changes.

## Task 2: Rebuild Championship Path As A Route Page

**Files:**
- Modify: `C:\Users\29940\spin-clash\index.html`
- Modify: `C:\Users\29940\spin-clash\css\game.css`
- Modify: `C:\Users\29940\spin-clash\src\loadout-ui-tools.js`
- Modify: `C:\Users\29940\spin-clash\src\config-text.js`

- [ ] Add a stronger challenge-summary structure so the page reads as:
  - current challenge
  - route strip
  - current loadout
  - continue/start
- [ ] Rewrite the summary text model so `node`, `arena`, `enemy`, `rule`, and `reward` are concise and visually separated.
- [ ] Keep rank selection, but reduce its ability to visually compete with the main next-fight summary.
- [ ] Keep current-top context visible on this page without reverting to the full roster wall.
- [ ] Verify the route page no longer reads like a roster-selection page in desktop and mobile screenshots.

## Task 3: Rebuild Quick Battle As A Pre-Fight Page

**Files:**
- Modify: `C:\Users\29940\spin-clash\index.html`
- Modify: `C:\Users\29940\spin-clash\css\game.css`
- Modify: `C:\Users\29940\spin-clash\src\loadout-ui-tools.js`
- Modify: `C:\Users\29940\spin-clash\src\ui-entry-tools.js`
- Modify: `C:\Users\29940\spin-clash\src\config-text.js`

- [ ] Add a compact acquisition/info block beside the selected top model.
- [ ] Separate `what this top is` from `how to get it`.
- [ ] Show explicit source and requirement state for the selected top.
- [ ] Add a dedicated quick-page top action button for non-ready states, instead of forcing the player to guess the next path.
- [ ] Keep the main `Start` button focused on battle launch only.
- [ ] Verify mobile layout stacks correctly and the quick page no longer feels visually empty.

## Task 4: Rebalance Home, Workshop, And Settings For Desktop

**Files:**
- Modify: `C:\Users\29940\spin-clash\css\game.css`
- Modify: `C:\Users\29940\spin-clash\src\loadout-ui-tools.js`
- Modify: `C:\Users\29940\spin-clash\src\config-text.js`

- [ ] Enlarge the desktop `Home` composition so it reads like a hero/poster instead of a small centered widget.
- [ ] Keep the one-line route progress cue, but move visual weight back to the showcase and CTA cluster.
- [ ] Widen and deepen `Workshop` and `Settings` so they read like real pages on desktop, not floating subpanels.
- [ ] Remove non-essential wallet display from `Settings`.
- [ ] Verify desktop screenshots show stronger page ownership and less dead negative space.

## Task 5: Unify State Language And Purchase Feedback

**Files:**
- Modify: `C:\Users\29940\spin-clash\src\config-text.js`
- Modify: `C:\Users\29940\spin-clash\src\loadout-ui-tools.js`

- [ ] Tighten the lock/source/acquisition copy to project-approved categories only:
  - `Starter`
  - `Road Reward`
  - `SCRAP Unlock`
- [ ] Remove remaining design-note/dev-note tone from shell-level copy.
- [ ] Improve purchase and insufficient-funds dialog actions so the player gets a meaningful next step instead of a dead-end acknowledgment.
- [ ] Keep copy formal and object/action-oriented rather than tutorial-like.

## Task 6: Verify And Re-Shoot The Shell

**Files:**
- No new repo files required unless a short validation note is needed

- [ ] Run the relevant static validation stack.
- [ ] Run `preflight`.
- [ ] Re-open the live shell in a real browser.
- [ ] Capture updated desktop and mobile screenshots for:
  - `Home`
  - `Championship Path`
  - `Quick Battle`
  - `Workshop`
  - `Settings`
  - purchase dialog
- [ ] Check that the new layouts match the intended page jobs before handing back to the user for human playtest.
