# Host Evaluation Sheet

Use this sheet to compare candidate static hosts before or during host validation.

This is intentionally vendor-neutral.

## Candidate
- Host name:
- Planned URL:
- Deployment method:
  - upload
  - git-based auto deploy
  - other

## Static Delivery Checks
- serves `index.html` correctly:
- serves `css/game.css` correctly:
- serves `src/*.js` correctly:
- serves `assets/vendor/three.min.js` correctly:
- any path rewrite issue:
- any MIME-type issue:

## Runtime Checks
- title screen loads:
- debug mode loads:
- no blocking runtime error banner:
- battle scene loads:
- share fallback behaves acceptably:

## Persistence Checks
- `storagePersistent`:
- `persistenceMode`:
- `persistenceDiagnostic.reason`:
- durable progression acceptable:

Pass rule:
- only `local` should be treated as release-quality persistence

## Delivery And Policy Checks
- relative paths behave correctly:
- any cross-origin issue:
- any CSP/security-header issue:
- any browser storage restriction:

## Developer Workflow Checks
- deployment turnaround acceptable:
- rollback/update workflow acceptable:
- easy enough for repeated iteration:

## Commercialization Readiness Checks
- acceptable environment for later reward provider integration:
- acceptable environment for later analytics forwarding:
- acceptable environment for public release:

## Final Judgment
- Outcome:
  - reject
  - usable for validation only
  - usable for provider phase
  - usable for public release later

- Notes:
