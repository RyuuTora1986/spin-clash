# Shell Route Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** split the current overloaded shell into explicit player-facing routes for `Home`, `Championship Path`, `Quick Battle`, `Workshop`, and `Settings` without changing the current visual style or static architecture.

**Architecture:** keep the existing plain-script factory layout and treat the route split as shell-state work, not a framework rewrite. Introduce explicit route identifiers plus route-origin metadata, then drive DOM visibility and button behavior from that route state while preserving the existing battle and overlay stack.

**Tech Stack:** plain HTML, CSS, JavaScript, existing `src/*-tools.js` factories, static hosting, local storage, existing Node-based regression scripts.

---

## Authoritative Scope
- This plan implements `Phase 1: Shell Route Refactor` only.
- Preserve the current visual language and existing static architecture.
- Do not mix collision, durability, or skill-structure combat changes into this batch.
- Leave rollback records in `docs/change-records/2026-04-17-ui-flow-combat-rework-log.md`.

## File Structure Map

### Existing Files Likely To Change
- `index.html`
  - add route header/back/settings DOM and route-specific shell sections while preserving the current overlays
- `css/game.css`
  - add route-state layout rules that reuse the current chrome, typography, spacing, and button family
- `src/main.js`
  - hold the authoritative shell route state and pass it into helper modules
- `src/ui-entry-tools.js`
  - replace the current `openLoadout(...)` entry shortcuts with explicit route transitions and back behavior
- `src/loadout-ui-tools.js`
  - render route-aware shell titles, context strips, visible panels, and primary-action labels
- `src/match-flow-tools.js`
  - keep result flow stable while accepting route-origin groundwork for the next checkpoint
- `src/localization-tools.js`
  - no architecture change expected, but new player-facing route strings must remain locale-safe
- `src/config-text.js`
  - add route labels, route subtitles, back labels, and settings copy
- `progress.md`
  - log the plan, checkpoints, validation, and handoff notes

### New Files Recommended
- `docs/change-records/2026-04-17-ui-flow-combat-rework-log.md`
  - rollback/checkpoint log for Phase 1 and later combat phases
- `scripts/check-shell-routes.js`
  - regression check for route IDs, route actions, route DOM, and basic route transitions

## Task 1: Lock The Rollback Base And Route Contract

**Files:**
- Create: `docs/change-records/2026-04-17-ui-flow-combat-rework-log.md`
- Create: `scripts/check-shell-routes.js`
- Modify: `package.json`
- Modify: `progress.md`

- [ ] **Step 1: Write the failing route contract check**

```js
const requiredRouteIds = ['home', 'path', 'quick', 'workshop', 'settings', 'battle', 'result'];
const requiredActions = ['goHome', 'goPath', 'goQuick', 'goWorkshop', 'goSettings', 'goBack'];
```

- [ ] **Step 2: Run the new check and confirm it fails for the expected reason**

Run: `node scripts/check-shell-routes.js`
Expected: FAIL because the current shell still exposes only the title/loadout flow and does not expose the new route contract.

- [ ] **Step 3: Create the rollback log before production edits**

```md
## Baseline
- local commit base: `dc241d2`
- worktree state: intentionally dirty, do not revert unrelated files
- planned checkpoints:
  - `before_ui_route_refactor`
  - `after_route_state_contract`
  - `after_route_surface_split`
  - `after_route_back_navigation`
```

- [ ] **Step 4: Add the check script to package scripts**

```json
"check:routes": "node scripts/check-shell-routes.js"
```

- [ ] **Step 5: Record the start of Phase 1 in `progress.md`**

```md
- Phase 1 shell route refactor started:
  - implementation plan written
  - rollback/change-log scaffold created
  - route contract check added before runtime edits
```

## Task 2: Add Explicit Shell Route State

**Files:**
- Modify: `src/main.js`
- Modify: `src/ui-entry-tools.js`

- [ ] **Step 1: Write the failing transition test for route state**

```js
const state = createHarness();
state.actions.goQuick();
assert(state.route === 'quick', 'Expected quick entry to switch route to quick.');
```

- [ ] **Step 2: Run the route check and confirm it fails because route state is missing**

Run: `node scripts/check-shell-routes.js`
Expected: FAIL with missing route state or missing route actions.

- [ ] **Step 3: Add minimal authoritative route state in `src/main.js`**

```js
let uiRoute = 'home';
let uiRouteFrom = 'home';
let battleReturnRoute = 'home';
```

- [ ] **Step 4: Thread the route getters/setters into `createUiEntryTools(...)` and other shell helpers**

```js
getUiRoute:()=>uiRoute,
setUiRoute:(next)=>{ uiRoute = next; },
getUiRouteFrom:()=>uiRouteFrom,
setUiRouteFrom:(next)=>{ uiRouteFrom = next; },
getBattleReturnRoute:()=>battleReturnRoute,
setBattleReturnRoute:(next)=>{ battleReturnRoute = next; },
```

- [ ] **Step 5: Replace title entry helpers with explicit route actions**

```js
function goPath(){ setUiRoute('path'); }
function goQuick(){ setUiRoute('quick'); }
function goWorkshop(){ setUiRouteFrom(getUiRoute()); setUiRoute('workshop'); }
function goSettings(){ setUiRouteFrom(getUiRoute()); setUiRoute('settings'); }
function goBack(){ setUiRoute(getUiRouteFrom() || 'home'); }
```

- [ ] **Step 6: Re-run the route check**

Run: `node scripts/check-shell-routes.js`
Expected: PASS for route state/action exposure, while DOM/layout assertions may still fail.

## Task 3: Split The Shell Surface Into Real Routes

**Files:**
- Modify: `index.html`
- Modify: `css/game.css`
- Modify: `src/loadout-ui-tools.js`

- [ ] **Step 1: Write the failing DOM/layout assertions for route surfaces**

```js
assert(html.includes('id="shell-route-title"'));
assert(html.includes('id="btn-route-back"'));
assert(html.includes('id="settings-panel"'));
```

- [ ] **Step 2: Run the route check and confirm it fails on missing route DOM**

Run: `node scripts/check-shell-routes.js`
Expected: FAIL because the route header/back/settings surface does not exist yet.

- [ ] **Step 3: Add shared route header and route-specific panels in `index.html`**

```html
<div class="shell-route-bar">
  <button id="btn-route-back" ...></button>
  <div id="shell-route-title"></div>
  <div id="shell-route-context"></div>
</div>
```

- [ ] **Step 4: Add route-preserving CSS only**

```css
.shell-route-bar{...}
.route-panel.hide{display:none}
.settings-panel{...}
```

- [ ] **Step 5: Make `src/loadout-ui-tools.js` drive panel visibility by `uiRoute` instead of only `currentMode` plus `workshopOpen`**

```js
const route = getUiRoute();
const isPathRoute = route === 'path';
const isQuickRoute = route === 'quick';
const isWorkshopRoute = route === 'workshop';
const isSettingsRoute = route === 'settings';
```

- [ ] **Step 6: Re-run targeted shell checks**

Run: `node scripts/check-shell-routes.js`
Expected: PASS

Run: `node scripts/check-shell-presentation.js`
Expected: PASS after route-header expectations are updated.

## Task 4: Back Navigation And Origin Groundwork

**Files:**
- Modify: `src/ui-entry-tools.js`
- Modify: `src/loadout-ui-tools.js`
- Modify: `src/match-flow-tools.js`

- [ ] **Step 1: Write the failing check for workshop/settings back behavior**

```js
state.actions.goQuick();
state.actions.goWorkshop();
state.actions.goBack();
assert(state.route === 'quick');
```

- [ ] **Step 2: Run the route check and confirm it fails for back/origin logic**

Run: `node scripts/check-shell-routes.js`
Expected: FAIL because `goBack()` still lacks origin-aware behavior.

- [ ] **Step 3: Add explicit route-origin tracking for subroutes**

```js
function openSubroute(routeId){
  setUiRouteFrom(getUiRoute());
  setUiRoute(routeId);
}
```

- [ ] **Step 4: Add battle-launch origin scaffolding without mixing in the full result rewrite**

```js
function startFight(){
  setBattleReturnRoute(getUiRoute());
  beginFight();
}
```

- [ ] **Step 5: Keep result CTAs stable for now, but preserve the captured origin for Phase 2**

```js
battleReturnRoute: getBattleReturnRoute()
```

- [ ] **Step 6: Re-run targeted checks**

Run: `node scripts/check-shell-routes.js`
Expected: PASS

Run: `node scripts/check-ui-actions.js`
Expected: PASS with new route actions exposed through `window.__spinClashUI`.

## Task 5: Settings MVP Surface Without A Visual Redesign

**Files:**
- Modify: `index.html`
- Modify: `css/game.css`
- Modify: `src/config-text.js`
- Modify: `src/loadout-ui-tools.js`

- [ ] **Step 1: Write the failing settings-surface check**

```js
assert(text.includes('settingsTitle'));
assert(html.includes('id="settings-panel"'));
```

- [ ] **Step 2: Run the route check and confirm it fails because the settings route has no player-facing surface**

Run: `node scripts/check-shell-routes.js`
Expected: FAIL on missing settings copy or settings DOM.

- [ ] **Step 3: Add minimal settings UI that fits the current architecture**

```html
<div class="route-panel settings-panel hide" id="settings-panel">
  <div id="settings-title"></div>
  <div id="settings-copy"></div>
</div>
```

- [ ] **Step 4: Reuse existing locale controls on the settings route and add conservative text for audio-state follow-up**

```js
setText('settings-title', uiText.settingsTitle || 'SETTINGS');
setText('settings-copy', uiText.settingsHint || 'Language and audio controls.');
```

- [ ] **Step 5: Re-run route and DOM checks**

Run: `node scripts/check-shell-routes.js`
Expected: PASS

Run: `node scripts/check-dom-contract.js`
Expected: PASS

## Task 6: Verification And Handoff

**Files:**
- Modify: `progress.md`
- Modify: `docs/change-records/2026-04-17-ui-flow-combat-rework-log.md`

- [ ] **Step 1: Run targeted verification after each small route slice**

Run: `npm run check:routes`
Expected: PASS

Run: `npm run check:shellpresentation`
Expected: PASS

Run: `npm run check:ui`
Expected: PASS

- [ ] **Step 2: Run the broader static verification once the slice is stable**

Run: `npm run check:syntax`
Expected: PASS

- [ ] **Step 3: Append the exact changed files, validations, and rollback note to the change log**

```md
## after_route_state_contract
- files:
  - `src/main.js`
  - `src/ui-entry-tools.js`
- checks:
  - `node scripts/check-shell-routes.js`
```

- [ ] **Step 4: Record remaining Phase 1 TODOs in `progress.md`**

```md
- Remaining Phase 1 TODOs:
  - finish settings route controls if audio toggles are deferred
  - connect battle/result return-path behavior in the next isolated checkpoint
```

## Acceptance Criteria
- The shell exposes explicit route IDs for `home`, `path`, `quick`, `workshop`, `settings`, `battle`, and `result`.
- Title actions no longer all collapse into one overloaded loadout mental model.
- Workshop is an actual route with predictable back behavior.
- Settings has its own player-facing route surface.
- The current visual style remains recognizably intact.
- Route work is isolated from combat-rule work.
- Rollback/change-log records exist before and after code edits.

## Main Risks
- The current title/loadout/result overlay split can hide implicit dependencies that only show up when route state replaces mode flags.
- `src/loadout-ui-tools.js` currently mixes text rendering, mode rendering, workshop toggling, and path rendering; route logic can sprawl if not kept explicit.
- `window.__spinClashUI` action bindings can drift from `index.html` if route actions are added without contract checks.
- Settings can expand scope if audio toggles become a deeper runtime/settings system instead of a shell route slice.

## Explicit Non-Goals
- collision or durability changes
- `Dash + Guard + Signature` skill work
- framework migration
- visual redesign
- full provider/release work

## Execution Order
1. rollback log + failing route check
2. route-state plumbing
3. route-specific shell UI
4. back/origin behavior
5. settings route surface
6. verification + updated rollback log
