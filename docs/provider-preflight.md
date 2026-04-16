# Provider Preflight

Run this before implementing any real provider adapters.

## Goal
- avoid starting provider work while the environment is still unstable

## Checklist

### 1. Host Validation Must Already Pass
Required:
- one host/browser combination marked `host-ready-for-provider-phase`

### 2. Existing Mock Flows Must Still Pass
Confirm locally and on target host:
- reward `grant`
- reward `deny`
- reward `error`
- share fallback
- analytics export/clear

### 3. Current Service Boundaries Must Remain Intact
Confirm no gameplay caller is bypassing service layers:
- `rewardService.request(...)`
- `analyticsService.track(...)`
- `shareService.share(...)`

### 4. Decide The Narrowest First Integration
Do not integrate everything at once.

Preferred order:
1. one reward provider path
2. one analytics sink
3. optional share enhancement later

### 5. Keep Mock Adapters Available
Even during real integration:
- mock reward mode should stay available
- local analytics inspection should stay available

## What Comes Next
- `docs/provider-phase-plan.md`
- `docs/provider-phase-report-template.md`
- `docs/reward-provider-evaluation-sheet.md`
- `docs/analytics-sink-evaluation-sheet.md`
