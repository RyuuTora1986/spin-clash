# Analytics Sink Evaluation Sheet

Use this sheet when choosing the first production analytics forwarding path.

## Candidate
- Sink:
- Target host:
- Target browser/device:

## Compatibility
- works in the chosen host/browser combination:
- acceptable browser-side integration complexity:
- acceptable privacy/compliance posture:

## Event Fit
- supports forwarding the current normalized event surface:
- supports custom payload fields:
- supports session and reward event analysis:

## Integration Fit
- can stay behind `analyticsService.track(...)`:
- local analytics buffering can remain available:
- gameplay code can stay unchanged:
- forwarding failure can be isolated from gameplay:

## Operational Fit
- acceptable setup cost:
- acceptable maintenance cost:
- acceptable debugging visibility:

## Final Judgment
- Outcome:
  - reject
  - research later
  - acceptable first integration candidate

- Notes:
