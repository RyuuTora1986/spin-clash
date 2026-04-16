# Deployment Preflight

Run this before uploading the current build to a real static host.

Optional repo-root helper:
- `run-preflight.cmd`

## Goal
- reduce avoidable host-validation noise
- ensure deployment testing focuses on host/runtime differences instead of local repo mistakes

## Preflight Checklist

### 1. Local Syntax Check
Run:

```powershell
npm run preflight
```

Equivalent expanded stack:

```powershell
npm run check:syntax
npm run check:repo
npm run check:docs
npm run check:dom
npm run check:config
npm run check:analytics
npm run check:ui
```

Pass condition:
- no parse failures in `src/`
- no missing runtime/doc/reference files reported by `check:repo`
- no broken local Markdown links reported by `check:docs`
- no broken `getElementById(...)` to `index.html` contracts reported by `check:dom`
- no cross-file config mismatches reported by `check:config`
- no undocumented tracked analytics events reported by `check:analytics`
- no broken `__spinClashInvoke(...)` to exposed UI action contracts reported by `check:ui`

### 2. Static Local Run
Run:

```powershell
npm run serve
```

Open:
- `http://127.0.0.1:8000/index.html`
- `http://127.0.0.1:8000/index.html?debug=1`

Pass condition:
- title screen loads
- debug panel loads
- no obvious red runtime error banner

### 3. Minimal Local Regression
Before host upload, verify at least:
- `ENTER BATTLE` works
- one Quick Battle match can start and finish
- debug panel opens in `?debug=1`
- `COPY SAVE` works
- `MOCK REWARD` works

Reference:
- `docs/manual-test-batches.md`

### 4. Confirm Deployment File Set
The host must receive at least:
- `index.html`
- `css/game.css`
- `src/`
- `assets/vendor/three.min.js`
- any other runtime assets referenced by the current build

Practical rule:
- deploy the repo root as a static site
- do not try to upload only `index.html`

### 5. Confirm Current Known External Dependencies
Before host validation, remember:
- Three.js is local and should not be a host blocker
- runtime entry files should stay free of remote font requests
- `npm run check:repo` now fails if Google Fonts are reintroduced into `index.html` or `css/game.css`

### 6. Confirm Current Release Interpretation
Do not treat host upload as final public launch yet.

At this stage, deployment is for:
- host validation
- persistence verification
- asset/runtime verification
- later provider-phase preparation

Not yet for:
- final monetized release
- public traffic scaling
- production analytics reporting

## What To Do Next
After this preflight passes:
- use `docs/host-validation-plan.md`
- record the result with `docs/host-validation-report-template.md`
