# Battle Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce battle-time hitching on low/mid-end mobile devices by fixing performance bugs, throttling unnecessary battle work, and adding battle-only mobile downgrade where needed without changing combat rules.

**Architecture:** Add battle-performance instrumentation and regression checks first, then optimize the battle loop in layers: correctness/perf bug fixes, HUD/DOM throttling, render-path cost control, and finally battle-only mobile downgrade. Keep gameplay formulas stable and treat visual downgrade as a fallback after logic-layer wins.

**Tech Stack:** Static browser runtime, plain JavaScript modules, Three.js renderer, Node-based regression scripts

---

### Task 1: Lock battle performance contracts with failing checks

**Files:**
- Create: `scripts/check-battle-performance.js`
- Modify: `package.json`

- [ ] **Step 1: Write the failing regression check**

Add a new Node-based check that loads the live battle modules and asserts these contracts:
- battle metrics summary fields exist
- battle HUD code avoids hot-path DOM querying during frame updates
- battle view code no longer depends on `Date.now()` for active battle animation
- battle-only performance mode hooks exist for renderer/shadow downgrade

Use source-text assertions plus minimal module harnesses where needed, similar to existing `scripts/check-*.js` style.

- [ ] **Step 2: Run the check to verify it fails**

Run: `npm run check:battleperf`

Expected: FAIL because the new script is not yet wired and the current code still uses `Date.now()`, hot-path DOM querying, and lacks explicit battle perf metrics.

- [ ] **Step 3: Wire the script into package.json**

Add:

```json
"check:battleperf": "node scripts/check-battle-performance.js"
```

Also add it to `preflight` next to the other runtime checks.

- [ ] **Step 4: Run the new check again**

Run: `npm run check:battleperf`

Expected: FAIL with battle perf contract errors, not with missing-script errors.

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/check-battle-performance.js
git commit -m "test: lock battle performance contracts"
```

### Task 2: Add battle metrics and fix correctness/perf hot-path bugs

**Files:**
- Modify: `src/main.js`
- Modify: `src/ui-shell-tools.js`
- Modify: `src/battle-sim-tools.js`
- Modify: `src/battle-view-tools.js`
- Test: `scripts/check-battle-performance.js`
- Test: `scripts/check-shell-presentation.js`

- [ ] **Step 1: Write/extend failing checks for hot-path bugs**

Extend `scripts/check-battle-performance.js` to assert:
- enemy spin percent uses `te.maxSpin`
- HUD caches battle DOM refs instead of querying per frame
- battle animation timing uses loop time / accumulated time rather than `Date.now()`
- battle metrics sampler records `physTick`, `updateHUD`, `updateFrame`, `render`

- [ ] **Step 2: Run the check to verify it fails**

Run: `npm run check:battleperf`

Expected: FAIL on the hot-path assertions above.

- [ ] **Step 3: Implement minimal metrics and bug fixes**

Make these changes:
- in `src/main.js`, add lightweight battle metrics sampling around `physTick`, `battleViewTools.updateFrame`, and `renderer.render`
- in `src/ui-shell-tools.js`, cache battle HUD element refs once and fix enemy spin percentage to use `te.maxSpin`
- in `src/battle-sim-tools.js`, replace active-battle `Date.now()`-based guard/shield/phantom pulses with deterministic loop-time inputs or cached state writes
- in `src/battle-view-tools.js`, replace `Date.now()`-driven wobble/crown pulse with accumulated battle time

- [ ] **Step 4: Run focused checks**

Run:

```bash
npm run check:battleperf
npm run check:shellpresentation
npm run check:syntax
```

Expected:
- `check:battleperf` PASS
- `check:shellpresentation` PASS
- `check:syntax` PASS

- [ ] **Step 5: Commit**

```bash
git add src/main.js src/ui-shell-tools.js src/battle-sim-tools.js src/battle-view-tools.js scripts/check-battle-performance.js
git commit -m "fix: instrument battle loop and remove hot-path perf bugs"
```

### Task 3: Throttle battle HUD, scratch, trails, and particle churn

**Files:**
- Modify: `src/ui-shell-tools.js`
- Modify: `src/scratch-layer-tools.js`
- Modify: `src/trail-render-tools.js`
- Modify: `src/battle-effects-tools.js`
- Modify: `src/main.js`
- Test: `scripts/check-battle-performance.js`
- Test: `scripts/check-loadout-flow.js`

- [ ] **Step 1: Extend the failing check for throttling contracts**

Add assertions for:
- HUD text refresh path is throttled or threshold-based
- scratch layer enforces a minimum texture upload interval
- trail sampling is distance/time gated instead of unconditional every frame
- particle creation is bounded by reuse or an active cap

- [ ] **Step 2: Run the check to verify it fails**

Run: `npm run check:battleperf`

Expected: FAIL on throttling/particle assertions.

- [ ] **Step 3: Implement minimal throttling**

Apply:
- HUD split refresh: bars may update faster, text/status at lower frequency or on value change
- scratch layer displacement + minimum interval gating before `texture.needsUpdate`
- trail point sampling by distance/time threshold
- bounded particle reuse or allocation cap in `battle-effects-tools.js`

- [ ] **Step 4: Run focused verification**

Run:

```bash
npm run check:battleperf
npm run check:loadout
npm run check:syntax
```

Expected:
- `check:battleperf` PASS
- `check:loadout` PASS
- `check:syntax` PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui-shell-tools.js src/scratch-layer-tools.js src/trail-render-tools.js src/battle-effects-tools.js src/main.js scripts/check-battle-performance.js
git commit -m "perf: throttle battle hud scratch trails and particles"
```

### Task 4: Add battle-only mobile downgrade and finish verification

**Files:**
- Modify: `src/main.js`
- Modify: `src/scene-shell-tools.js`
- Modify: `src/ui-shell-tools.js`
- Modify: `docs/manual-test-batches.md`
- Modify: `README.md`
- Test: `scripts/check-battle-performance.js`
- Test: `scripts/check-shell-presentation.js`
- Test: `scripts/check-config.js`
- Test: `scripts/check-localization.js`

- [ ] **Step 1: Extend the failing check for battle-only mobile downgrade**

Assert:
- battle performance mode only affects battle-time renderer/runtime paths
- shadow downgrade hook exists
- reduced renderer pixel ratio or equivalent battle-time downgrade hook exists
- non-battle shell content is unaffected

- [ ] **Step 2: Run the check to verify it fails**

Run: `npm run check:battleperf`

Expected: FAIL on battle-only mobile downgrade assertions.

- [ ] **Step 3: Implement the mobile battle downgrade**

Add:
- battle-only mobile performance mode detection
- battle-time shadow disable/reduction
- battle-time renderer pixel ratio ceiling reduction
- optional secondary reductions already supported by the throttled systems without touching gameplay logic

Document the manual validation expectations in `README.md` and `docs/manual-test-batches.md`.

- [ ] **Step 4: Run full verification**

Run:

```bash
npm run check:battleperf
npm run check:shellpresentation
npm run check:config
npm run check:localization
npm run check:loadout
npm run check:roadrank
npm run check:syntax
```

Expected:
- all commands PASS

- [ ] **Step 5: Commit**

```bash
git add src/main.js src/scene-shell-tools.js src/ui-shell-tools.js README.md docs/manual-test-batches.md scripts/check-battle-performance.js package.json
git commit -m "perf: add battle-only mobile downgrade"
```
