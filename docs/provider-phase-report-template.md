# Provider Phase Report Template

Use this template after starting real provider integration work.

## Summary
- Date:
- Integrator:
- Target host:
- Target browser/device:

## Reward Provider
- Provider selected:
- Supported environment:
- Adapter status before full implementation:
- Placements implemented:
  - `double_reward`
  - `continue_once`
  - `trial_unlock_arena`
- Fallback behavior when unavailable:
- Debug-visible failure fields:
  - `lastAvailabilityReason`
  - `lastRequestReason`
  - `activePlacement`

## Analytics Sink
- Sink selected:
- Adapter status before full implementation:
- Forwarded event families:
- Local buffering still enabled:
- Failure behavior:
- Debug-visible forwarding fields:
  - `lastForwardReason`
  - `initialized`
  - `queuedEvents`
- Secret-safe confirmation:
  - adapter/debug surfaces expose status only
  - provider credentials / ad unit paths are not shown in debug output

## Contract Preservation
- `rewardService.request(...)` callers unchanged:
- `analyticsService.track(...)` callers unchanged:
- gameplay code still provider-agnostic:

## Validation
- reward success path:
- reward decline path:
- reward timeout/error path:
- analytics forwarding success:
- analytics forwarding failure:
- gameplay unaffected by provider failure:
- local static mode safe without provider credentials/endpoints:
- debug tooling exposes diagnosable provider state without leaking secrets:
- commands run:
  - `npm run check:providers`
  - `npm run check:debugservice`
  - `npm run preflight`

## Outcome
- Status:
  - partial
  - complete
  - blocked

- Notes:

## Follow-Up Actions
1.
2.
3.
