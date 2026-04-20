# Next-Phase Gameplay Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** implement the approved next gameplay/content/progression/UI phase for `spin-clash` without breaking the current static duel shell.

**Architecture:** extend the current project through config-first content tables and focused shell/runtime modules. Keep `src/main.js` as the orchestrator while pushing new content, progression, and presentation logic into adjacent config and helper modules that match the existing repository layout.

**Tech Stack:** plain HTML, CSS, JavaScript, ES modules/factories, local storage, existing debug/reward/share/analytics services, static hosting via GitHub Pages.

---

## Authoritative Scope
- This plan implements the approved merged direction in `docs/superpowers/specs/2026-04-17-next-phase-gameplay-expansion-design.md`.
- If a task idea conflicts with that design doc, the design doc wins.
- Do not enlarge scope while executing this plan.

## File Structure Map

### Existing Files Likely To Change
- `src/config-challenge-road.js`
  - expand node structure from current road into `Championship Path`
- `src/config-enemy-presets.js`
  - add elite presets and preview metadata
- `src/config-modifiers.js`
  - add new modifiers for encounter depth
- `src/config-tops.js`
  - add derived player tops and unlock metadata
- `src/config-text.js`
  - add new labels, chapter names, preview copy, and workshop/rank UI copy
- `src/loadout-ui-tools.js`
  - support championship previews, workshop entry points, and richer top presentation
- `src/match-flow-tools.js`
  - handle new progression rewards, checkpoints, and result presentation payloads
- `src/round-flow-tools.js`
  - thread new top/preset/modifier metadata into match setup
- `src/progression-tools.js`
  - extend save-facing progression logic for path, research, rank, and unlocks
- `src/debug-runtime-tools.js`
  - expose new progression values and add debug actions for faster manual validation
- `src/storage-service.js`
  - migrate save schema to include research and rank state safely
- `src/analytics-service.js`
  - no architecture change expected, but event payload additions may be needed
- `src/share-service.js`
  - optionally enrich share text/payload with championship/rank/result details
- `src/main.js`
  - keep orchestration only; add minimal glue where no existing helper owns the path
- `index.html`
  - add any new shell panels or buttons required by title/workshop/path/result changes
- `css/game.css`
  - visual hierarchy, layout, and responsive updates for the new shell package

### New Files Recommended
- `src/config-research.js`
  - workshop track definitions and prices
- `src/config-road-ranks.js`
  - difficulty tiers and reward multipliers
- `scripts/check-next-phase-config.js`
  - validate new config relationships for path, research, and ranks
- `scripts/check-workshop-flow.js`
  - regression check for purchases and save persistence
- `scripts/check-road-rank-flow.js`
  - regression check for rank unlock and reward flow

## Milestone 1: Championship Path Foundation

**Goal**
- Replace the current flat `Challenge Road` pacing with a structured `Championship Path` while preserving one-mode progression architecture.

**Files**
- Modify: `src/config-challenge-road.js`
- Modify: `src/config-text.js`
- Modify: `src/progression-tools.js`
- Modify: `src/loadout-ui-tools.js`
- Modify: `src/match-flow-tools.js`
- Modify: `src/debug-runtime-tools.js`
- Test: existing challenge-related scripts plus one new config/path check

**Work**
- [ ] Expand the node table from `6` to `10` nodes.
- [ ] Add chapter metadata, boss/final tier metadata, checkpoint flags, and preview copy fields.
- [ ] Move `Trick` unlock to the approved earlier node.
- [ ] Update progression logic so checkpoints and deeper node state persist correctly.
- [ ] Update path UI to show node tier and current chapter intent.
- [ ] Add debug visibility for current chapter, current node, and checkpoint state.

**Validation**
- Run: `npm run preflight`
- Run: `node scripts/check-match-flow.js`
- Run: `node scripts/check-next-phase-config.js`
- Manual:
  - enter `Championship Path`
  - verify all `10` nodes resolve valid arena/preset/modifier combos
  - clear a boss node and reload the page
  - confirm checkpoint progression persists

**Acceptance Criteria**
- A full `10`-node path exists and loads from config.
- Checkpoints work without creating a second campaign system.
- `Quick Battle` behavior is unchanged.
- Existing reward/continue flow still works on the new path.

## Milestone 2: Encounter Depth Pack Alpha

**Goal**
- Make encounters feel more authored through presets, modifiers, and derived tops before adding more systems.

**Files**
- Modify: `src/config-enemy-presets.js`
- Modify: `src/config-modifiers.js`
- Modify: `src/config-tops.js`
- Modify: `src/round-flow-tools.js`
- Modify: `src/loadout-ui-tools.js`
- Modify: `src/config-text.js`
- Test: `scripts/check-config.js`
- Test: `scripts/check-next-phase-config.js`

**Work**
- [ ] Add at least `3` new elite enemy presets with distinct readable personalities.
- [ ] Add `3` new lightweight modifiers that stay scalar and readable.
- [ ] Add `2` new derived player tops with reuse of existing skill families.
- [ ] Remove any hard-coded `3`-top assumptions from loadout HTML, UI state, and selection helpers before exposing the new tops.
- [ ] Add any minimum metadata needed for top identity, preview labels, and unlock presentation.
- [ ] Ensure new content is routed through existing config-driven loadout and round setup logic.

**Validation**
- Run: `npm run preflight`
- Run: `node scripts/check-config.js`
- Run: `node scripts/check-round-flow.js`
- Manual:
  - inspect each new top in loadout
  - start matches against at least one new preset in each relevant arena
  - confirm no missing text labels or selection regressions

**Acceptance Criteria**
- New encounter content is loaded entirely from config tables.
- No new combat family behavior is introduced.
- Content additions materially increase matchup variety without destabilizing the current shell.

## Milestone 3: Workshop Research

**Goal**
- Add the first real long-term `SCRAP` sink after basic unlocks.

**Files**
- Create: `src/config-research.js`
- Modify: `src/progression-tools.js`
- Modify: `src/storage-service.js`
- Modify: `src/loadout-ui-tools.js`
- Modify: `src/debug-runtime-tools.js`
- Modify: `src/config-text.js`
- Possibly modify: `src/round-flow-tools.js` or `src/main.js` glue points where research bonuses are read
- Test: `scripts/check-storage-service.js`
- Test: `scripts/check-workshop-flow.js`

**Work**
- [ ] Create three research tracks with four levels each.
- [ ] Extend save schema and migrations for persistent research state.
- [ ] Add workshop purchase UI and affordability/locked state handling.
- [ ] Apply research bonuses through existing combat/stat shaping code, not one-off hacks.
- [ ] Expose current research state in debug tools.

**Validation**
- Run: `npm run preflight`
- Run: `node scripts/check-storage-service.js`
- Run: `node scripts/check-workshop-flow.js`
- Manual:
  - buy a research level
  - reload the page
  - verify the purchase persists
  - verify the expected stat impact appears in debug/runtime inspection

**Acceptance Criteria**
- `SCRAP` has a meaningful permanent spend beyond unlocks.
- Save migration remains backward-safe.
- Research bonuses are inspectable and reversible through debug tools.

## Milestone 4: Road Rank

**Goal**
- Add replayable difficulty tiers to extend the life of `Championship Path` without adding a new mode.

**Files**
- Create: `src/config-road-ranks.js`
- Modify: `src/progression-tools.js`
- Modify: `src/loadout-ui-tools.js`
- Modify: `src/match-flow-tools.js`
- Modify: `src/storage-service.js`
- Modify: `src/debug-runtime-tools.js`
- Modify: `src/config-text.js`
- Test: `scripts/check-road-rank-flow.js`

**Work**
- [ ] Define three ranks with enemy and reward multipliers.
- [ ] Track highest unlocked rank in save state.
- [ ] Add rank selection or display in the path entry flow.
- [ ] Apply rank scaling without forking battle logic.
- [ ] Ensure clear rewards and unlock messaging are visible in result flow.

**Validation**
- Run: `npm run preflight`
- Run: `node scripts/check-road-rank-flow.js`
- Run: `node scripts/check-match-flow.js`
- Manual:
  - clear Rank I
  - verify Rank II unlocks
  - verify reward multipliers and current rank labels appear correctly

**Acceptance Criteria**
- Rank progression extends replayability through existing path content.
- Rank state persists locally and is debug-visible.
- Rank scaling does not require a separate ruleset or new mode.

## Milestone 5: Shell Presentation Upgrade

**Goal**
- Improve perceived product quality and battle readability across title, loadout, path, HUD, and result screens.

**Files**
- Modify: `index.html`
- Modify: `css/game.css`
- Modify: `src/loadout-ui-tools.js`
- Modify: `src/ui-shell-tools.js`
- Modify: `src/message-ui-tools.js`
- Modify: `src/match-flow-tools.js`
- Modify: `src/config-text.js`

**Work**
- [ ] Rework title entry points around `Continue Path`, `Quick Battle`, and `Workshop`.
- [ ] Promote selected-top presentation in loadout.
- [ ] Add a clearer path/node preview treatment.
- [ ] Upgrade HUD readability around match intro, danger signaling, and heavy-event messaging.
- [ ] Upgrade result screen layout so reward breakdown and next action are clearer and more shareable.

**Validation**
- Run: `npm run preflight`
- Run: `node scripts/check-ui-actions.js`
- Run: `node scripts/check-dom-contract.js`
- Manual:
  - verify all title, loadout, and result buttons remain clickable
  - verify no overlay blocks battle start or result progression
  - verify mobile-width layout stays readable

**Acceptance Criteria**
- The shell feels more intentional without changing the core duel rules.
- The new UI does not regress the current interaction flow.
- Key states remain understandable on both desktop and mobile.

## Milestone 6: Analytics And Debug Closeout For The New Phase

**Goal**
- Keep the expanded game measurable and inspectable as content/progression complexity increases.

**Files**
- Modify: `docs/analytics-events.md`
- Modify: `src/analytics-service.js`
- Modify: `src/debug-runtime-tools.js`
- Modify: any flow modules that emit new event payloads
- Test: `scripts/check-analytics-events.js`
- Test: update relevant flow checks

**Work**
- [ ] Add analytics payloads for championship progression, workshop purchases, and road rank progression.
- [ ] Expose new progression state in debug snapshots and copy/export actions where useful.
- [ ] Update analytics docs so emitted events and documented events remain aligned.

**Validation**
- Run: `npm run preflight`
- Run: `node scripts/check-analytics-events.js`
- Manual:
  - trigger at least one workshop purchase
  - clear at least one championship checkpoint
  - inspect analytics buffer and debug state

**Acceptance Criteria**
- New progression systems are measurable without backend dependency.
- Debug mode remains sufficient for local tuning and save inspection.

## Milestone 7: Manual QA And Balance Pass

**Goal**
- Confirm the new phase is playable, readable, and economically stable before adding any deferred systems.

**Files**
- Modify: relevant config files only as needed
- Modify: `docs/manual-test-batches.md`
- Modify: `progress.md`
- Optionally modify: `docs/project-status-2026-04-17.md` or create a follow-up status note

**Work**
- [ ] Add one grouped manual batch for `Championship Path`, `Workshop`, and `Road Rank`.
- [ ] Run a focused balance pass on rewards, prices, and top unlock pacing.
- [ ] Record shipped state and unresolved follow-ups in `progress.md`.

**Validation**
- Manual:
  - play through the new path
  - verify checkpoint reload behavior
  - verify workshop and rank progression over reload
  - verify result, share, and reward flows still function

**Acceptance Criteria**
- The next phase is stable enough for broader playtest iteration.
- Deferred systems remain deferred.
- The repo reflects the new state in docs and progress logs.

## Main Risks
- `src/main.js` orchestration may pick up too much new glue if helper boundaries are not kept disciplined.
- Save migration mistakes could downgrade persistence or corrupt older local saves.
- Internal renaming churn can leak into save/debug/analytics paths if `Championship Path` is treated as a whole-codebase rename instead of a player-facing label upgrade.
- Loadout and shell code may still assume a `3`-top layout in subtle ways, causing selection or rendering regressions when the fourth and fifth tops are added.
- UI expansion could reintroduce old overlay/input regressions.
- New tops and presets can feel different numerically but not meaningfully if tuning is too timid.
- `SCRAP` sinks can overcorrect and feel grindy if workshop prices are too aggressive.

## Deferred Work
- `Top Mastery`
- `Road Tuning Picks`
- arena remix variants
- any fourth combat family
- any inventory or loot layer

## Execution Order Recommendation
1. `Championship Path`
2. encounter depth pack
3. `Workshop Research`
4. `Road Rank`
5. shell presentation upgrade
6. analytics/debug closeout
7. QA and balance pass

## Final Rule
- If a task tries to solve weak replayability by adding a big new system, reject it.
- The approved route is sharper authored depth, not broader scope.
