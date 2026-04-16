# Reward Provider Evaluation Sheet

Use this sheet when choosing the first real rewarded-ad integration path.

## Candidate
- Provider or platform path:
- Target host:
- Target browser/device:

## Compatibility
- works in the chosen host/browser combination:
- supports rewarded flow in the target environment:
- acceptable setup complexity:
- acceptable policy/compliance risk:

## Product Fit
- supports `double_reward`:
- supports `continue_once`:
- supports `trial_unlock_arena`:
- acceptable latency/UX for short sessions:

## Integration Fit
- can stay behind `rewardService.request(...)`:
- does not require gameplay caller rewrites:
- supports graceful unavailable/decline/error handling:
- mock fallback can remain available:

## Measurement Fit
- can expose completion vs decline clearly:
- supports enough result metadata for local analytics normalization:

## Operational Fit
- acceptable maintenance cost:
- acceptable documentation quality:
- acceptable release risk for a small static project:

## Final Judgment
- Outcome:
  - reject
  - research later
  - acceptable first integration candidate

- Notes:
