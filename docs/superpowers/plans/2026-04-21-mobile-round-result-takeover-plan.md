# Mobile Round Result Takeover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make mobile portrait `roundResult` read as a dedicated settlement takeover by hiding battle HUD surfaces, strengthening the result panel, and preserving desktop plus `matchResult` behavior.

**Architecture:** Keep the existing overlay and round-flow timing intact. Add one small runtime-owned takeover class on `document.body` when the mobile round-result overlay is active, then let `css/game.css` own the mobile portrait hide/show and panel-strengthening rules. Extend the existing shell-presentation contract first so the implementation stays regression-first.

**Tech Stack:** Plain HTML/CSS, vanilla JavaScript runtime modules in `src/`, node-based repo validation scripts, trusted proxy replay workflow for final visual verification.

---

### File Map

**Existing files that this plan will touch**
- `scripts/check-shell-presentation.js`
  - Extend the current shell-presentation contract with a mobile `roundResult` takeover expectation.
- `src/round-flow-tools.js`
  - Own the takeover class lifecycle when the round-result overlay opens and closes.
- `css/game.css`
  - Add the mobile portrait takeover rules that hide HUD surfaces and strengthen the round-result card.
- `progress.md`
  - Record what changed, what was verified, and the latest artifact path.

**Existing files expected to remain unchanged**
- `index.html`
- `src/match-flow-tools.js`
- `package.json`

### Task 1: Lock the mobile round-result takeover contract first

**Files:**
- Modify: `scripts/check-shell-presentation.js`

- [ ] **Step 1: Add the failing contract assertions**

Add a new contract function in `scripts/check-shell-presentation.js` near the existing mobile HUD/result checks. The new function should assert all of the following against `css/game.css`:

```js
function checkMobileRoundResultTakeoverContract() {
  const css = fs.readFileSync(path.join(repoRoot, 'css', 'game.css'), 'utf8');
  const mobilePortraitMatch = css.match(/@media\(max-width:540px\) and \(orientation:portrait\)\{[\s\S]*?\n\}/);
  assert(mobilePortraitMatch, 'Expected game.css to define a mobile portrait result contract block.');
  const mobilePortraitBlock = mobilePortraitMatch[0];

  assert(
    css.includes('body.round-result-takeover'),
    'Expected game.css to define a body.round-result-takeover hook for mobile round settlement.'
  );
  assert(
    mobilePortraitBlock.includes('body.round-result-takeover #skill-panel')
      && mobilePortraitBlock.includes('display:none'),
    'Expected the mobile round-result takeover contract to hide the bottom skill cluster.'
  );
  assert(
    mobilePortraitBlock.includes('body.round-result-takeover #p-panel')
      && mobilePortraitBlock.includes('body.round-result-takeover #e-panel'),
    'Expected the mobile round-result takeover contract to hide both top status rails.'
  );
  assert(
    mobilePortraitBlock.includes('body.round-result-takeover #act-swap')
      && mobilePortraitBlock.includes('body.round-result-takeover #hint-bar'),
    'Expected the mobile round-result takeover contract to remove swap and hint surfaces during settlement.'
  );
  assert(
    mobilePortraitBlock.includes('body.round-result-takeover #ov-round.result-overlay'),
    'Expected the mobile round-result takeover contract to strengthen the round-result overlay background.'
  );
  assert(
    mobilePortraitBlock.includes('body.round-result-takeover .round-result-shell'),
    'Expected the mobile round-result takeover contract to strengthen the dedicated round-result shell.'
  );
}
```

- [ ] **Step 2: Register the new contract in the script entrypoint**

Call the new function in the existing execution tail:

```js
checkBattleHudPresentation();
checkMobileBattleHudTopRailContract();
checkResultPresentation();
checkMobileRoundResultTakeoverContract();
```

- [ ] **Step 3: Run the contract to confirm it fails for the right reason**

Run:

```bash
npm run check:shellpresentation
```

Expected:
- `FAIL`
- the failure should mention the missing `body.round-result-takeover` contract or one of the missing mobile takeover selectors
- the failure should not be a syntax error

- [ ] **Step 4: Commit the failing contract checkpoint**

Run:

```bash
git add scripts/check-shell-presentation.js
git commit -m "test: lock mobile round result takeover contract"
```

Expected:
- one commit that adds only the contract-first expectation

### Task 2: Add the smallest possible runtime takeover hook

**Files:**
- Modify: `src/round-flow-tools.js`

- [ ] **Step 1: Add a helper that toggles the body takeover class**

Add a tiny helper near the other local UI-side helpers inside `createRoundFlowTools(...)`:

```js
function setRoundResultTakeover(active){
  if(!document || !document.body || !document.body.classList) return;
  document.body.classList.toggle('round-result-takeover', !!active);
}
```

- [ ] **Step 2: Turn the takeover on when `roundResult` opens**

Inside `endRound(reason)`, activate the hook immediately before the overlay is shown:

```js
setRoundResultTakeover(true);
ovRound.classList.remove('hide');
```

- [ ] **Step 3: Turn the takeover off on both round-exit paths**

In both timeout branches inside `endRound(reason)`, clear the hook before leaving the round-result overlay:

```js
setTimeout(() => {
  setRoundResultTakeover(false);
  ovRound.classList.add('hide');
  showMatchResult();
}, 2200);
```

```js
setTimeout(() => {
  setRoundResultTakeover(false);
  ovRound.classList.add('hide');
  initRound();
}, 2400);
```

- [ ] **Step 4: Add a defensive reset when a round initializes**

At the start of `initRound()`, clear any stale takeover state:

```js
setRoundResultTakeover(false);
```

- [ ] **Step 5: Run syntax verification**

Run:

```bash
npm run check:syntax
```

Expected:
- `PASS`
- no new syntax errors in `src/round-flow-tools.js`

- [ ] **Step 6: Commit the runtime hook**

Run:

```bash
git add src/round-flow-tools.js
git commit -m "feat: add round result takeover state hook"
```

Expected:
- one small commit that adds only the runtime class lifecycle

### Task 3: Implement the mobile portrait takeover styles

**Files:**
- Modify: `css/game.css`

- [ ] **Step 1: Add the shared takeover selectors**

Add a small shared block near the existing result overlay rules so the CSS exposes the named hook the contract expects:

```css
body.round-result-takeover #p-panel,
body.round-result-takeover #e-panel,
body.round-result-takeover #skill-panel,
body.round-result-takeover #act-swap,
body.round-result-takeover #hint-bar,
body.round-result-takeover #msg-txt{
  pointer-events:none;
}
```

- [ ] **Step 2: Add the mobile portrait hide/show behavior**

Inside the existing `@media(max-width:540px) and (orientation:portrait)` block, add the takeover-specific visibility rules:

```css
  body.round-result-takeover #p-panel,
  body.round-result-takeover #e-panel,
  body.round-result-takeover #skill-panel,
  body.round-result-takeover #act-swap,
  body.round-result-takeover #hint-bar,
  body.round-result-takeover #msg-txt{
    opacity:0!important;
    visibility:hidden!important;
    display:none!important;
  }
```

- [ ] **Step 3: Strengthen the mobile round-result backdrop**

Inside the same mobile portrait block, make the overlay feel like a takeover rather than a light panel:

```css
  body.round-result-takeover #ov-round.result-overlay{
    justify-content:flex-start;
    padding:28px 14px 0;
    background:
      radial-gradient(circle at 50% 18%,rgba(0,255,200,.12),transparent 26%),
      linear-gradient(180deg,rgba(3,9,20,.86),rgba(2,4,12,.96));
  }
```

- [ ] **Step 4: Strengthen the mobile round-result shell**

Still inside the mobile portrait block, push the card into a stronger centered settlement surface:

```css
  body.round-result-takeover .round-result-shell{
    width:min(430px,92vw);
    margin-top:max(56px,calc(env(safe-area-inset-top,0px) + 44px));
    padding:28px 18px 24px;
    gap:12px;
    border-radius:28px;
    border:1px solid rgba(210,235,255,.12);
    background:
      linear-gradient(180deg,rgba(18,26,40,.96),rgba(9,14,26,.94)),
      radial-gradient(circle at top,rgba(0,255,200,.12),transparent 58%);
    box-shadow:0 22px 64px rgba(0,0,0,.48);
  }

  body.round-result-takeover #ov-round h2{
    font-size:46px;
    line-height:1.02;
    letter-spacing:2px;
  }

  body.round-result-takeover #ov-round .rd-detail{
    padding:16px 14px;
    border-radius:18px;
    font-size:12px;
    line-height:1.75;
    letter-spacing:1.6px;
    background:rgba(255,255,255,.05);
  }

  body.round-result-takeover #ov-round .rd-next{
    padding-top:6px;
    font-size:12px;
    line-height:1.6;
    letter-spacing:1.8px;
    color:rgba(190,255,240,.84);
  }
```

- [ ] **Step 5: Keep `matchResult` stable**

Do not add `body.round-result-takeover` selectors that touch `.match-result-shell` or `#ov-match`. The state hook must be strictly round-result-scoped.

- [ ] **Step 6: Run the now-green shell presentation check**

Run:

```bash
npm run check:shellpresentation
```

Expected:
- `PASS`
- the new mobile takeover contract is satisfied

- [ ] **Step 7: Run the broader UI regressions**

Run:

```bash
npm run check:dom
npm run check:ui
npm run preflight
```

Expected:
- all commands `PASS`
- no regression in existing DOM, UI action, or repo-wide validation checks

- [ ] **Step 8: Commit the CSS implementation**

Run:

```bash
git add css/game.css
git commit -m "feat: add mobile round result takeover styles"
```

Expected:
- one commit focused on the mobile portrait settlement styling

### Task 4: Revalidate visually and record the change

**Files:**
- Modify: `progress.md`

- [ ] **Step 1: Run the trusted mobile replay flow**

Run the existing trusted replay command used by this repo:

```bash
node scripts/proxy-visual-flow-capture.js --profile mobile
```

Expected:
- a new `output/proxy-visual-flow-video-mobile-.../` artifact directory
- a fresh `11-round-result.png` frame that shows the takeover result

- [ ] **Step 2: Review the new artifact against the spec**

Check the new mobile replay output and confirm all of the following:
- the round-result card is the first visual anchor
- top rails are gone during `roundResult`
- bottom skill buttons are gone during `roundResult`
- swap and hint surfaces are gone during `roundResult`
- the arena still reads as weak context only
- `12-match-result.png` still looks correct

- [ ] **Step 3: Update the engineering log**

Append a new `progress.md` entry with:
- what changed
- which files changed
- the validation commands that passed
- the trusted mobile replay artifact directory
- the visual conclusion in one short paragraph

Use this structure:

```md
2026-04-21 mobile round-result takeover pass completed
- Context:
  - mobile round settlement still read too much like battle HUD
- Main runtime files changed:
  - `scripts/check-shell-presentation.js`
  - `src/round-flow-tools.js`
  - `css/game.css`
- Main UI outcomes:
  - mobile portrait `roundResult` now activates a dedicated takeover state
  - top rails, skill cluster, swap, and hint/message surfaces are hidden during settlement
  - the round-result card now reads as the dominant settlement panel
- Verification:
  - `npm run check:shellpresentation`
  - `npm run check:dom`
  - `npm run check:ui`
  - `npm run preflight`
  - `node scripts/proxy-visual-flow-capture.js --profile mobile`
- Trusted visual evidence:
  - `output/proxy-visual-flow-video-mobile-.../`
```

- [ ] **Step 4: Commit the verification log update**

Run:

```bash
git add progress.md
git commit -m "docs: record mobile round result takeover verification"
```

Expected:
- one docs/log commit that captures the replay evidence path and verification result
