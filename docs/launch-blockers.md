# Launch Blockers

This document lists the remaining blockers between the current repository state and a true public commercial launch.

It is intentionally short and practical.

## 1. Durable Save Must Be Confirmed On Target Host
Current state:
- storage service is robust
- fallback modes are visible
- non-`local` modes degrade gracefully

Blocker:
- public launch should not rely on `session`, `window_name`, or `memory`

Exit condition:
- target host/browser combination is verified to run in `local` persistence mode

## 2. Reward Provider Strategy Is Still Mock-Only
Current state:
- reward abstraction exists
- UX and analytics flow can be validated with mock modes

Blocker:
- there is no real rewarded-ad provider integrated yet

Exit condition:
- one concrete provider/platform path is selected
- provider adapter is implemented without changing gameplay callers

## 3. Remote Analytics Sink Is Not Chosen
Current state:
- local analytics schema and event surfaces are in place
- debug/export flows exist

Blocker:
- there is no production reporting destination yet

Exit condition:
- one forwarding path is chosen and integrated behind `analyticsService`

Execution references:
- `docs/provider-preflight.md`
- `docs/provider-phase-plan.md`

## 4. Release Host Validation Has Not Been Run
Current state:
- gameplay runtime is local-first
- Three.js is vendored locally
- remote Google Fonts dependency has been removed from `index.html`

Blocker:
- actual release-host validation has not yet been closed out

Exit condition:
- run the manual batches on the chosen host
- confirm persistence, share fallback, and asset loading there

## What Is Not A Blocker
- adding more content
- adding more tops before analytics review
- image-card sharing polish
- framework migration
- build tooling overhaul

## Practical Interpretation
Right now the project is:
- ready for continued implementation
- ready for local/manual iteration
- ready for host validation
- not yet ready to be called a final monetized public release
