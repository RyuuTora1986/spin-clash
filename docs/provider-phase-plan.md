# Provider Phase Plan

Use this document after one host reaches `host-ready-for-provider-phase`.

## Goal
- move from mock-only commercialization surfaces to real provider-backed integrations
- keep gameplay callers unchanged
- keep the static build playable when providers are unavailable

## Preconditions
Do not start this phase until:
1. one target host/browser combination passes host validation
2. persistence is confirmed as `local` on that target
3. current manual test batches pass there

Reference:
- `docs/host-validation-plan.md`
- `docs/host-validation-report-template.md`

## Work Order

### Step 1: Choose Reward Provider Path
Decide:
- target platform
- supported browser environment
- rewarded format availability

Output:
- one concrete reward integration path

Evaluation reference:
- `docs/reward-provider-evaluation-sheet.md`

### Step 2: Choose Analytics Sink
Decide:
- where production analytics should go
- minimum required event forwarding behavior
- whether local buffering remains enabled in production

Output:
- one concrete analytics forwarding path

Evaluation reference:
- `docs/analytics-sink-evaluation-sheet.md`

### Step 3: Preserve Existing Contracts
Do not change gameplay callers.

Reward callers must still use:
```js
rewardService.request(placement, context)
```

Analytics callers must still use:
```js
analyticsService.track(eventName, payload)
```

### Step 4: Add Adapters
Implement:
- reward provider adapter
- analytics forwarding adapter

Keep:
- mock adapters available
- safe fallback behavior when providers are unavailable

### Step 5: Validate Failure Behavior
Confirm:
- gameplay does not break if provider is unavailable
- reward declines/errors still resolve gracefully
- analytics forwarding failure does not block gameplay

### Step 6: Record Outcome
Use a report document so the integration result is inspectable.

Reference:
- `docs/provider-phase-report-template.md`

## Non-Goals
- do not add backend gameplay dependencies
- do not add accounts
- do not let SDK globals leak into UI or battle code
- do not rebuild the service layer

## Exit Condition
This phase is complete when:
- one reward provider path is integrated behind `RewardService`
- one analytics forwarding path is integrated behind `AnalyticsService`
- mock fallbacks still work
- normal gameplay flows still pass manual regression
