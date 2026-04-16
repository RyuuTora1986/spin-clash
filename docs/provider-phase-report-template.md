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
- Placements implemented:
  - `double_reward`
  - `continue_once`
  - `trial_unlock_arena`
- Fallback behavior when unavailable:

## Analytics Sink
- Sink selected:
- Forwarded event families:
- Local buffering still enabled:
- Failure behavior:

## Contract Preservation
- `rewardService.request(...)` callers unchanged:
- `analyticsService.track(...)` callers unchanged:
- gameplay code still provider-agnostic:

## Validation
- reward success path:
- reward decline path:
- reward error path:
- analytics forwarding success:
- analytics forwarding failure:
- gameplay unaffected by provider failure:

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
