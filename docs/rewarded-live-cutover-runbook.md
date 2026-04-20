# Rewarded Live Cutover Runbook

This runbook is the operator path for the final rewarded-ad closeout after the external blockers clear.

Use it only after:
- the relevant AdSense account is approved
- a real Google Ad Manager workspace opens successfully
- the game host is reachable on the intended production domain

This document is intentionally practical.

It is not another prep checklist.

It is the exact sequence to move from:
- rewarded prep already complete

to:
- one real rewarded ad unit configured
- one live deployment produced
- one manual rewarded validation run recorded

## 1. Preconditions

Do not start this runbook until all of the following are true:
- the intended Google account can enter Ad Manager without falling back to the public marketing page
- the intended Google account is not blocked by pending AdSense review
- the intended host is the production validation target:
  - `play.hakurokudo.com`
- the production target has stable HTTPS
- the current repository still passes:
  - `npm run check:providers`
  - `npm run preflight`

Current strongest account path from the latest investigation:
- retry first on the current `authuser=0` path after AdSense approval

Reference:
- `docs/admanager-access-check-2026-04-19.md`

## 2. Create The Rewarded Ad Unit In Ad Manager

In Ad Manager:
1. sign in with the approved account
2. open:
   - `Inventory`
   - `Ad units`
3. create:
   - `New ad unit`

Recommended project convention:
- name:
  - `Spin Clash Rewarded Web`
- code:
  - `spin_clash_rewarded_web`

Important:
- copy the exact full ad unit path shown by Ad Manager after creation
- do not guess the final network code
- do not shorten parent segments if Ad Manager nests the unit under a parent path

Expected final shape:
- `/NETWORK_CODE/spin_clash_rewarded_web`

but the real value must be copied from the UI, not inferred from this example

## 3. Keep Live Scope Narrow

Do not widen placement scope during the first real cutover.

The current approved live rewarded placements remain:
- `double_reward`
- `continue_once`
- `trial_unlock_arena`

Anything else should still fail safely with:
- `placement_not_enabled`

Reference:
- `docs/rewarded-integration-prep-checklist.md`

## 4. Set Deployment Variables

In GitHub:
1. open repository `Settings`
2. open `Secrets and variables`
3. open `Actions`
4. open `Variables`

For the rewarded live pass, set:
- `SPIN_CLASH_REWARD_ADAPTER=adsense_rewarded`
- `SPIN_CLASH_REWARD_ENABLED=true`
- `SPIN_CLASH_REWARDED_AD_UNIT_PATH=<exact copied full ad unit path>`

Optional:
- `SPIN_CLASH_REWARD_SCRIPT_URL`
  - use only if the default GPT script URL must be overridden

Do not change:
- committed source defaults
- rewarded placement allowlist in source

Reference:
- `docs/github-pages-deploy.md`

## 5. Produce The Live Deployment

After the variable update:
1. trigger the Pages deployment path
2. wait for the workflow to finish successfully
3. hard refresh the browser tab before validating

Why the hard refresh matters:
- an already-open browser tab may still use cached provider files after the deploy

Before browser validation, confirm the live build is really in rewarded mode through the debug/runtime provider snapshot.

Expected rewarded state:
- `rewardAdapter: "adsense_rewarded"`
- `rewardEnabled: true`
- `rewardedAdUnitConfigured: true`
- `rewardAllowedPlacements` contains exactly the approved live placements

## 6. Manual Validation Flow

Validate on:
- `https://play.hakurokudo.com/`
- `https://play.hakurokudo.com/?debug=1`

Run one real manual pass for each of these:

### A. Double Reward
- finish a match
- trigger the result-screen rewarded path
- confirm the rewarded flow settles cleanly
- confirm the reward result is reflected correctly in UI/state

### B. Continue Once
- lose in the relevant path
- trigger the continue rewarded path
- confirm the same node/match resumes correctly

### C. Trial Unlock Arena
- enter the locked arena trial path
- trigger rewarded unlock
- confirm the temporary arena access behaves as intended

### D. Negative / fallback observations
- confirm no unrelated placement suddenly uses live rewarded
- confirm a missing or denied reward does not corrupt the flow
- record whether the provider behavior looked like:
  - granted
  - declined / closed
  - timeout
  - unavailable

## 7. Record The Validation Evidence

At minimum, record:
- date
- host URL
- Google account / auth path used
- exact rewarded ad unit path used
- deployment run identifier
- which placements were tested
- what each placement did
- any failure reason visible in debug state
- whether the result was:
  - granted
  - declined
  - timeout
  - unavailable

Update:
- `docs/provider-phase-report-2026-04-18-partial.md`

If the run is successful, upgrade that partial report into final rewarded closeout evidence.

If the run fails, record:
- exact observed behavior
- whether the issue is:
  - account eligibility
  - ad unit setup
  - host/HTTPS
  - provider runtime behavior
  - game integration behavior

## 8. Go / No-Go Decision

Treat the pass as `go` only if all of the following are true:
- live rewarded mode is actually enabled in the deployed runtime
- the configured rewarded ad unit path is real and copied from Ad Manager
- at least one approved placement completes correctly on the real host
- no non-approved placement leaks into live rewarded behavior
- failure and decline behavior still degrade safely

Treat the pass as `no-go` if:
- the account still cannot reach a usable Ad Manager workspace
- the ad unit path is still guessed rather than copied
- the host still lacks stable HTTPS
- the deployment still shows mock mode
- the real rewarded flow cannot settle cleanly on the live host

## 9. If The Run Is Still Blocked

If you are blocked before the live browser pass:
- stop changing code
- update the blocker note
- record the exact missing prerequisite
- preserve the re-entry order

Usual blockers at this stage:
- AdSense approval not finished
- Ad Manager workspace still unavailable
- rewarded ad unit not created yet
- production HTTPS still unstable

## Official References

- Sign up for Ad Manager:
  - `https://support.google.com/admanager/answer/7084151?hl=en-AU`
- What to do if Ad Manager can't activate your account:
  - `https://support.google.com/admanager/answer/9824633?hl=en`
- Ad unit creation:
  - `https://support.google.com/admanager/answer/10477477?hl=en`
- Rewarded ads for web:
  - `https://support.google.com/admanager/answer/9116812?hl=en`
