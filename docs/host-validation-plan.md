# Host Validation Plan

Use this document when moving from local validation to a real static host.

Preflight reference:
- `docs/deployment-preflight.md`

Evaluation reference:
- `docs/host-evaluation-sheet.md`

## Goal
- verify that the current build behaves correctly on the actual deployment target
- close the biggest remaining uncertainty before real provider work

## Host Validation Order

### Step 1: Deploy Current Static Build
Target:
- one real static host

Minimum acceptable host:
- serves `index.html`
- serves `assets/vendor/three.min.js`
- serves `src/*.js` and `css/game.css` without path rewriting problems

## Step 2: Validate Persistence Mode
Open:
- `index.html?debug=1`

Record:
- `storagePersistent`
- `persistenceMode`
- `persistenceDiagnostic`

Pass condition:
- `persistenceMode` is `local`

Fail condition:
- `session`
- `window_name`
- `memory`

If failed:
- do not treat that host/browser combination as release-ready yet

## Step 3: Run Manual Test Batches
Run:
- Batch 1
- Batch 2
- Batch 3
- Batch 4

Reference:
- `docs/manual-test-batches.md`

## Step 4: Verify Runtime Delivery
Check:
- arena and top assets load normally
- no blocking console/runtime failure
- Pages or other host does not break relative paths

Important:
- runtime Google Fonts have already been removed
- current host focus is pathing, script delivery, and browser storage behavior

## Step 5: Record Outcome
Capture:
- host name
- browser/device
- persistence mode
- whether warning banner appears
- whether share fallback works
- whether reward mock flows still work
- any asset/path/CORS issues

Template:
- `docs/host-validation-report-template.md`

## Recommended Outcome Labels

### `host-ready-for-provider-phase`
Use when:
- persistence is `local`
- manual batches pass
- no material asset/runtime problems remain

### `host-needs-hardening`
Use when:
- persistence is not `local`, or
- fonts/assets/pathing fail, or
- share/runtime behavior differs materially

## What Comes After This

Only after one host reaches `host-ready-for-provider-phase` should the next phase begin:
- real reward provider decision
- remote analytics sink decision
- provider adapter integration
