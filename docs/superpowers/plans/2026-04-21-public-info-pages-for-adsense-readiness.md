# Public Info Pages For AdSense Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add truthful in-shell `About`, `Contact`, `Privacy`, and `Terms` pages for `Spin Clash`, exposed from Home and Settings, localized in English/Chinese/Japanese, and readable on mobile without leaving the current site.

**Architecture:** Extend the existing shell route system with a dedicated info-surface state instead of adding standalone HTML pages. Keep all public-page copy in the current localization/config layer, route entry through the existing UI entry tools, and render the reading surface as a formal overlay inside the main runtime. Verify the change through DOM-contract, settings-flow, localization, and UI-action checks so the new public pages are treated as first-class shell surfaces rather than ad hoc markup.

**Tech Stack:** Static HTML, plain browser JavaScript factories under `src/`, existing `config-text.js` localization system, existing shell route/UI wiring, repo-local Node validation scripts.

---

## File Structure

### Files To Modify
- `C:\Users\29940\spin-clash\index.html`
  - add the in-shell public-info container and Home/Settings entry buttons
- `C:\Users\29940\spin-clash\css\game.css`
  - add mobile-safe reading layout styles for the public-info shell
- `C:\Users\29940\spin-clash\src\config-text.js`
  - add localized titles, labels, and body copy for `About`, `Contact`, `Privacy`, and `Terms`
- `C:\Users\29940\spin-clash\src\ui-entry-tools.js`
  - extend shell routing and window action bindings for info-page open/close behavior
- `C:\Users\29940\spin-clash\src\loadout-ui-tools.js`
  - render the public-info shell state and wire labels/content updates into the existing mode/route refresh path
- `C:\Users\29940\spin-clash\src\localization-tools.js`
  - only if needed to ensure new info-page text keys participate in locale switching
- `C:\Users\29940\spin-clash\scripts\check-dom-contract.js`
  - require the new info-shell DOM ids
- `C:\Users\29940\spin-clash\scripts\check-settings-flow.js`
  - verify settings-view public-page entry labels and info-shell route presentation
- `C:\Users\29940\spin-clash\scripts\check-ui-actions.js`
  - verify the new window actions exist and remain wired
- `C:\Users\29940\spin-clash\scripts\check-localization.js`
  - verify the new text keys exist across `en/zh/ja`
- `C:\Users\29940\spin-clash\progress.md`
  - record the public-info readiness pass and why it was added

### Files To Create
- none required if the implementation stays inside current shell/runtime boundaries

### Responsibility Boundaries
- `config-text.js` owns factual copy only
- `ui-entry-tools.js` owns route transitions and actions only
- `loadout-ui-tools.js` owns shell presentation and DOM updates only
- `game.css` owns reading layout and visual behavior only
- validation scripts own regression gates only

---

### Task 1: Lock The Public Info Surface In Localization And DOM Contracts

**Files:**
- Modify: `C:\Users\29940\spin-clash\src\config-text.js`
- Modify: `C:\Users\29940\spin-clash\index.html`
- Test: `C:\Users\29940\spin-clash\scripts\check-dom-contract.js`
- Test: `C:\Users\29940\spin-clash\scripts\check-localization.js`

- [ ] **Step 1: Write the failing DOM/localization assertions**

Update `C:\Users\29940\spin-clash\scripts\check-dom-contract.js` required ids list to include the new public-info surface:

```js
  const requiredIds = [
    'locale-title-switcher',
    'locale-loadout-switcher',
    'locale-settings-switcher',
    'locale-title-en',
    'locale-title-zh',
    'locale-title-ja',
    'locale-loadout-en',
    'locale-loadout-zh',
    'locale-loadout-ja',
    'locale-settings-en',
    'locale-settings-zh',
    'locale-settings-ja',
    'btn-open-about-home',
    'btn-open-contact-home',
    'btn-open-privacy-home',
    'btn-open-terms-home',
    'btn-open-about-settings',
    'btn-open-contact-settings',
    'btn-open-privacy-settings',
    'btn-open-terms-settings',
    'ov-info',
    'info-shell-title',
    'info-shell-body',
    'btn-info-back'
  ];
```

Update `C:\Users\29940\spin-clash\scripts\check-localization.js` to assert these new keys exist in every locale:

```js
const requiredPublicInfoKeys = [
  'infoAboutLabel',
  'infoContactLabel',
  'infoPrivacyLabel',
  'infoTermsLabel',
  'infoBackButton',
  'infoAboutTitle',
  'infoContactTitle',
  'infoPrivacyTitle',
  'infoTermsTitle',
  'infoAboutBody',
  'infoContactBody',
  'infoPrivacyBody',
  'infoTermsBody'
];
```

- [ ] **Step 2: Run checks to verify they fail before implementation**

Run:

```powershell
node scripts/check-dom-contract.js
node scripts/check-localization.js
```

Expected:
- `check-dom-contract.js` fails on missing public-info DOM ids
- `check-localization.js` fails on missing public-info locale keys

- [ ] **Step 3: Add truthful localized copy to `config-text.js`**

Add these keys to `textEn` in `C:\Users\29940\spin-clash\src\config-text.js`:

```js
    infoAboutLabel:'ABOUT',
    infoContactLabel:'CONTACT',
    infoPrivacyLabel:'PRIVACY',
    infoTermsLabel:'TERMS',
    infoBackButton:'BACK',
    infoAboutTitle:'ABOUT SPIN CLASH',
    infoContactTitle:'CONTACT',
    infoPrivacyTitle:'PRIVACY',
    infoTermsTitle:'TERMS',
    infoAboutBody:[
      'Spin Clash is a browser-based arena battling game built for short, readable H5 matches.',
      'This game is publicly operated under the name HAKUROKUDO K.K.',
      'This page explains the game at a product level only. For support, privacy, and usage rules, use the other information pages in this shell.'
    ],
    infoContactBody:[
      'For support, feedback, or general inquiries about Spin Clash, contact:',
      'contact@hakurokudo.com'
    ],
    infoPrivacyBody:[
      'Spin Clash stores gameplay progress and settings in your browser so your local progression can persist on this device.',
      'The game also records gameplay and reward-related analytics events. Depending on the current deployment configuration, some analytics or ad-related event data may be processed by external service providers used to operate the game.',
      'Rewarded advertising and related ad delivery may involve third-party ad technology. Those services may process device, browser, and interaction data needed to deliver, measure, or protect advertising.',
      'If you contact us directly, we may receive the information you send in your message.'
    ],
    infoTermsBody:[
      'Spin Clash is provided as an online game experience in its current form.',
      'Gameplay balance, progression, rewards, and availability may change over time.',
      'You must not misuse, disrupt, automate against, or unfairly exploit the game or its services.',
      'If misuse or abuse is detected, access to some game features may be limited or removed.'
    ],
```

Then add equivalent `zh` and `ja` entries using the same meaning, without introducing extra legal claims:

```js
    infoAboutLabel:'关于',
    infoContactLabel:'联系',
    infoPrivacyLabel:'隐私',
    infoTermsLabel:'条款',
```

```js
    infoAboutLabel:'概要',
    infoContactLabel:'連絡先',
    infoPrivacyLabel:'プライバシー',
    infoTermsLabel:'利用規約',
```

For the body copy:
- use only confirmed facts:
  - `Spin Clash`
  - `HAKUROKUDO K.K.`
  - `contact@hakurokudo.com`
  - browser-local save/progression
  - gameplay/reward analytics
  - third-party ad technology in generic terms
- do not add address, phone, country, or legal promises

- [ ] **Step 4: Add the new shell and entry buttons to `index.html`**

Insert Home footer links inside the title shell metadata area:

```html
      <div class="title-build-meta" id="title-build-meta">
        <div class="title-build-line" id="title-build-version"></div>
        <div class="title-build-line" id="title-build-copyright"></div>
        <div class="title-info-links" id="title-info-links">
          <button class="info-link-btn" id="btn-open-about-home" type="button" onclick="return window.__spinClashInvoke('openInfo','about')"></button>
          <button class="info-link-btn" id="btn-open-contact-home" type="button" onclick="return window.__spinClashInvoke('openInfo','contact')"></button>
          <button class="info-link-btn" id="btn-open-privacy-home" type="button" onclick="return window.__spinClashInvoke('openInfo','privacy')"></button>
          <button class="info-link-btn" id="btn-open-terms-home" type="button" onclick="return window.__spinClashInvoke('openInfo','terms')"></button>
        </div>
      </div>
```

Insert Settings entry links inside the settings panel:

```html
    <div class="settings-info-links" id="settings-info-links">
      <button class="settings-link-btn" id="btn-open-about-settings" type="button" onclick="return window.__spinClashInvoke('openInfo','about')"></button>
      <button class="settings-link-btn" id="btn-open-contact-settings" type="button" onclick="return window.__spinClashInvoke('openInfo','contact')"></button>
      <button class="settings-link-btn" id="btn-open-privacy-settings" type="button" onclick="return window.__spinClashInvoke('openInfo','privacy')"></button>
      <button class="settings-link-btn" id="btn-open-terms-settings" type="button" onclick="return window.__spinClashInvoke('openInfo','terms')"></button>
    </div>
```

Add the shared info shell near the other overlays:

```html
<div class="ov hide" id="ov-info">
  <div class="info-shell">
    <div class="info-shell-head">
      <button class="route-back-btn" id="btn-info-back" type="button" onclick="return window.__spinClashInvoke('closeInfo')"></button>
      <div class="info-shell-title" id="info-shell-title"></div>
    </div>
    <div class="info-shell-body" id="info-shell-body"></div>
  </div>
</div>
```

- [ ] **Step 5: Run the DOM/localization checks to verify they pass**

Run:

```powershell
node scripts/check-dom-contract.js
node scripts/check-localization.js
```

Expected:
- both commands print pass messages

- [ ] **Step 6: Commit**

```bash
git add index.html src/config-text.js scripts/check-dom-contract.js scripts/check-localization.js
git commit -m "feat: add localized public info shell copy and DOM"
```

### Task 2: Extend Shell Routing And Window Actions For Public Info Pages

**Files:**
- Modify: `C:\Users\29940\spin-clash\src\ui-entry-tools.js`
- Test: `C:\Users\29940\spin-clash\scripts\check-ui-actions.js`

- [ ] **Step 1: Write the failing UI action assertions**

Update `C:\Users\29940\spin-clash\scripts\check-ui-actions.js` so the expected action set includes:

```js
  'openInfo',
  'closeInfo',
```

and ensure the UI binding checks allow:

```js
window.__spinClashInvoke('openInfo', 'about')
window.__spinClashInvoke('closeInfo')
```

- [ ] **Step 2: Run the UI action check to verify it fails**

Run:

```powershell
node scripts/check-ui-actions.js
```

Expected:
- fail because `openInfo` and `closeInfo` are not yet exposed

- [ ] **Step 3: Add route state helpers in `ui-entry-tools.js`**

Inside `C:\Users\29940\spin-clash\src\ui-entry-tools.js`, add info-route helpers near the other route actions:

```js
    const getInfoPage = typeof options.getInfoPage === 'function' ? options.getInfoPage : function(){ return 'about'; };
    const setInfoPage = typeof options.setInfoPage === 'function' ? options.setInfoPage : function(){};
```

Add the open/close handlers:

```js
    function openInfo(page){
      const nextPage = ['about', 'contact', 'privacy', 'terms'].includes(page) ? page : 'about';
      const currentRoute = getUiRoute();
      const origin = currentRoute && currentRoute !== 'info' ? currentRoute : (getUiRouteFrom() || 'home');
      setInfoPage(nextPage);
      applyRoute('info', { origin });
      return true;
    }

    function closeInfo(){
      applyRoute(getUiRouteFrom() || 'home', { origin:'home' });
      return true;
    }
```

Then register them into `window.__spinClashUI`:

```js
        openInfo,
        closeInfo,
```

and return them from the factory:

```js
      openInfo,
      closeInfo,
```

- [ ] **Step 4: Make `goBack()` understand the info route**

Replace the existing info-blind branch:

```js
    function goBack(){
      const currentRoute = getUiRoute();
      if(currentRoute === 'workshop' || currentRoute === 'settings'){
        applyRoute(getUiRouteFrom() || 'home', { origin:'home' });
        return;
      }
      goHome();
    }
```

with:

```js
    function goBack(){
      const currentRoute = getUiRoute();
      if(currentRoute === 'workshop' || currentRoute === 'settings' || currentRoute === 'info'){
        applyRoute(getUiRouteFrom() || 'home', { origin:'home' });
        return;
      }
      goHome();
    }
```

- [ ] **Step 5: Run the UI action check to verify it passes**

Run:

```powershell
node scripts/check-ui-actions.js
```

Expected:
- pass with the new `openInfo` / `closeInfo` bindings present

- [ ] **Step 6: Commit**

```bash
git add src/ui-entry-tools.js scripts/check-ui-actions.js
git commit -m "feat: add public info route actions"
```

### Task 3: Render The Public Info Shell Inside Existing Shell Presentation

**Files:**
- Modify: `C:\Users\29940\spin-clash\src\loadout-ui-tools.js`
- Modify: `C:\Users\29940\spin-clash\css\game.css`
- Test: `C:\Users\29940\spin-clash\scripts\check-settings-flow.js`

- [ ] **Step 1: Write the failing settings/info shell presentation assertions**

Update `C:\Users\29940\spin-clash\scripts\check-settings-flow.js` so `uiText` includes public-info labels:

```js
      infoAboutLabel: 'ABOUT',
      infoContactLabel: 'CONTACT',
      infoPrivacyLabel: 'PRIVACY',
      infoTermsLabel: 'TERMS',
      infoAboutTitle: 'ABOUT SPIN CLASH',
      infoBackButton: 'BACK',
      infoAboutBody: ['Line A', 'Line B']
```

Change the simulated route:

```js
    getUiRoute() {
      return 'info';
    },
```

and add assertions for info shell rendering:

```js
  assert(document.getElementById('info-shell-title').textContent === 'ABOUT SPIN CLASH', 'Expected info shell title to reflect the active info page.');
  assert(document.getElementById('info-shell-body').innerHTML.includes('Line A'), 'Expected info shell body to render localized public info copy.');
  assert(document.getElementById('btn-info-back').textContent === 'BACK', 'Expected info shell back button label to render.');
  assert(document.getElementById('btn-open-about-settings').textContent === 'ABOUT', 'Expected settings info entry to render the ABOUT label.');
```

- [ ] **Step 2: Run the settings-flow check to verify it fails**

Run:

```powershell
node scripts/check-settings-flow.js
```

Expected:
- fail because the info shell is not yet rendered by `loadout-ui-tools.js`

- [ ] **Step 3: Add public-info rendering support to `loadout-ui-tools.js`**

In `C:\Users\29940\spin-clash\src\loadout-ui-tools.js`, extend the factory options with route/info state:

```js
    const getInfoPage = typeof options.getInfoPage === 'function' ? options.getInfoPage : function(){ return 'about'; };
```

Add a local mapping helper near other text helpers:

```js
    function getInfoPageContent(page){
      const keyMap = {
        about: { title: 'infoAboutTitle', body: 'infoAboutBody' },
        contact: { title: 'infoContactTitle', body: 'infoContactBody' },
        privacy: { title: 'infoPrivacyTitle', body: 'infoPrivacyBody' },
        terms: { title: 'infoTermsTitle', body: 'infoTermsBody' }
      };
      return keyMap[page] || keyMap.about;
    }
```

Inside `updateModeUI()`, add label hydration for both home/settings entries:

```js
      document.getElementById('btn-open-about-home').textContent = uiText.infoAboutLabel || 'ABOUT';
      document.getElementById('btn-open-contact-home').textContent = uiText.infoContactLabel || 'CONTACT';
      document.getElementById('btn-open-privacy-home').textContent = uiText.infoPrivacyLabel || 'PRIVACY';
      document.getElementById('btn-open-terms-home').textContent = uiText.infoTermsLabel || 'TERMS';
      document.getElementById('btn-open-about-settings').textContent = uiText.infoAboutLabel || 'ABOUT';
      document.getElementById('btn-open-contact-settings').textContent = uiText.infoContactLabel || 'CONTACT';
      document.getElementById('btn-open-privacy-settings').textContent = uiText.infoPrivacyLabel || 'PRIVACY';
      document.getElementById('btn-open-terms-settings').textContent = uiText.infoTermsLabel || 'TERMS';
```

Then add info-shell state rendering:

```js
      const infoOverlay = document.getElementById('ov-info');
      const infoTitle = document.getElementById('info-shell-title');
      const infoBody = document.getElementById('info-shell-body');
      const infoBack = document.getElementById('btn-info-back');
      if (infoOverlay && infoTitle && infoBody && infoBack) {
        const infoRoute = getUiRoute() === 'info';
        const contentKeys = getInfoPageContent(getInfoPage());
        const bodyLines = Array.isArray(uiText[contentKeys.body]) ? uiText[contentKeys.body] : [];
        infoOverlay.classList.toggle('hide', !infoRoute);
        infoOverlay.style.display = infoRoute ? 'flex' : 'none';
        infoTitle.textContent = uiText[contentKeys.title] || '';
        infoBack.textContent = uiText.infoBackButton || uiText.backButton || 'BACK';
        infoBody.innerHTML = bodyLines.map(function(line){
          return '<p>' + String(line) + '</p>';
        }).join('');
      }
```

- [ ] **Step 4: Add mobile-safe info-shell styles to `game.css`**

Append a dedicated block in `C:\Users\29940\spin-clash\css\game.css`:

```css
.title-info-links,
.settings-info-links{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
}

.info-link-btn,
.settings-link-btn{
  border:1px solid rgba(255,255,255,0.18);
  background:rgba(255,255,255,0.04);
  color:var(--ink-1);
  padding:10px 14px;
  border-radius:999px;
  font:600 12px/1 var(--font-ui);
  letter-spacing:.08em;
}

#ov-info{
  align-items:stretch;
  justify-content:center;
  padding:calc(20px + env(safe-area-inset-top, 0px)) 16px calc(20px + env(safe-area-inset-bottom, 0px));
  background:rgba(7,10,18,0.92);
  backdrop-filter:blur(14px);
  z-index:135;
}

.info-shell{
  width:min(100%, 760px);
  min-height:0;
  display:flex;
  flex-direction:column;
  border:1px solid rgba(255,255,255,0.12);
  border-radius:28px;
  background:linear-gradient(180deg, rgba(15,20,33,0.96), rgba(10,14,24,0.98));
  box-shadow:0 22px 70px rgba(0,0,0,0.38);
}

.info-shell-head{
  display:flex;
  align-items:center;
  gap:12px;
  padding:18px 18px 12px;
}

.info-shell-title{
  font:700 18px/1.25 var(--font-display);
  letter-spacing:.04em;
  color:var(--ink-1);
}

.info-shell-body{
  overflow:auto;
  padding:6px 18px 22px;
  color:var(--ink-2);
}

.info-shell-body p{
  margin:0 0 14px;
  font:400 14px/1.7 var(--font-ui);
  text-align:left;
}

@media (max-width: 640px){
  .info-shell{
    border-radius:22px;
  }

  .info-shell-head{
    padding:16px 14px 10px;
  }

  .info-shell-body{
    padding:4px 14px 18px;
  }

  .info-shell-title{
    font-size:16px;
  }

  .info-shell-body p{
    font-size:13px;
    line-height:1.65;
  }
}
```

- [ ] **Step 5: Run the settings-flow check to verify it passes**

Run:

```powershell
node scripts/check-settings-flow.js
```

Expected:
- pass with info-shell labels and content rendered through `updateModeUI()`

- [ ] **Step 6: Commit**

```bash
git add src/loadout-ui-tools.js css/game.css scripts/check-settings-flow.js
git commit -m "feat: render in-shell public info pages"
```

### Task 4: Thread The New Info State Through Runtime Boot And Final Verification

**Files:**
- Modify: `C:\Users\29940\spin-clash\src\main.js`
- Modify: `C:\Users\29940\spin-clash\progress.md`
- Test: `C:\Users\\29940\\spin-clash\\scripts\\check-ui-actions.js`
- Test: `C:\Users\\29940\\spin-clash\\scripts\\check-settings-flow.js`
- Test: `C:\Users\\29940\\spin-clash\\scripts\\check-dom-contract.js`
- Test: `C:\Users\\29940\\spin-clash\\scripts\\check-localization.js`

- [ ] **Step 1: Add the minimal info-state runtime storage in `main.js`**

In `C:\Users\29940\spin-clash\src\main.js`, add the new shell state near the other route-level variables:

```js
let infoPage = 'about';
```

Expose accessors passed into the factories:

```js
  getInfoPage:()=>infoPage,
  setInfoPage:(value)=>{ infoPage = value; },
```

Pass these into both `createUiEntryTools(...)` and `createLoadoutUiTools(...)` where their options objects are assembled.

- [ ] **Step 2: Run the focused checks to verify the full info surface wiring passes**

Run:

```powershell
node scripts/check-ui-actions.js
node scripts/check-settings-flow.js
node scripts/check-dom-contract.js
node scripts/check-localization.js
```

Expected:
- all four checks pass

- [ ] **Step 3: Run the broader release-safe validation stack**

Run:

```powershell
npm run check:dom
npm run check:localization
npm run check:ui
npm run preflight
```

Expected:
- all commands pass

- [ ] **Step 4: Update `progress.md`**

Append a new dated note to `C:\Users\29940\spin-clash\progress.md`:

```md
- Public-info readiness pass:
  - added in-shell `About`, `Contact`, `Privacy`, and `Terms` views
  - exposed entry points from Home and Settings
  - kept all copy limited to confirmed product/entity/contact facts plus current implementation-truth privacy statements
  - added regression coverage for DOM ids, localization keys, settings-route rendering, and UI actions
```

- [ ] **Step 5: Commit**

```bash
git add src/main.js progress.md
git commit -m "docs: record public info readiness pass"
```

## Self-Review

### Spec coverage
- public page set:
  - covered by Task 1 copy keys and Task 3 rendering
- in-shell approach:
  - covered by Tasks 2 and 3
- Home + Settings entry points:
  - covered by Tasks 1 and 3
- mobile readability:
  - covered by Task 3 CSS
- truth-only copy constraints:
  - covered by Task 1 localized content instructions
- localization:
  - covered by Task 1 and Task 4 validation

No uncovered spec requirement remains.

### Placeholder scan
- no `TODO`
- no `TBD`
- no “add appropriate handling” style steps without concrete code

### Type consistency
- route id:
  - `info`
- page ids:
  - `about`
  - `contact`
  - `privacy`
  - `terms`
- actions:
  - `openInfo`
  - `closeInfo`

These names are used consistently across tasks.

## Execution Handoff
Plan complete and saved to `docs/superpowers/plans/2026-04-21-public-info-pages-for-adsense-readiness.md`. Two execution options:

1. Subagent-Driven (recommended) - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. Inline Execution - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
