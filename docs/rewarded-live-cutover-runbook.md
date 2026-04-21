# Rewarded Live Cutover Runbook

This runbook is the operator path for the final rewarded-ad closeout after the external blockers clear.

Use it only after:
- the relevant AdSense account is approved
- H5 game ads access is approved if the primary path is `AdSense H5`
- the game host is reachable on the intended production domain

This document is intentionally practical.

It is not another prep checklist.

It is the exact sequence to move from:
- rewarded prep already complete

to:
- one real live rewarded provider configuration applied
- one live deployment produced
- one manual rewarded validation run recorded

## 1. Preconditions

Do not start this runbook until all of the following are true:
- the intended Google account is not blocked by pending AdSense review
- the intended host is the production validation target:
  - `play.hakurokudo.com`
- the production target has stable HTTPS
- the current repository still passes:
  - `npm run check:providers`
  - `npm run preflight`

## 2. Choose The Live Provider Path

Primary path:
- `adsense_h5_rewarded`

Fallback path:
- `adsense_rewarded`

Use `adsense_h5_rewarded` unless:
- H5 access is not approved yet
- H5 live validation fails in a way that is clearly provider-side rather than integration-side

Use `adsense_rewarded` only if:
- Ad Manager access is working
- a real rewarded ad unit path exists

## 3. Prepare The Live Variables

In GitHub:
1. open repository `Settings`
2. open `Secrets and variables`
3. open `Actions`
4. open `Variables`

Canonical variable names:
- `SPIN_CLASH_REWARD_ADAPTER`
- `SPIN_CLASH_ADSENSE_ENABLED`
- `SPIN_CLASH_ADSENSE_H5_ENABLED`
- `SPIN_CLASH_ADSENSE_H5_PUBLISHER_ID`
- `SPIN_CLASH_ADSENSE_H5_DATA_AD_CLIENT`
- `SPIN_CLASH_ADSENSE_H5_TEST_MODE`
- `SPIN_CLASH_ADSENSE_H5_PRELOAD`
- `SPIN_CLASH_ADSENSE_H5_SOUND`
- `SPIN_CLASH_ADSENSE_GPT_REWARDED_AD_UNIT_PATH`

### A. AdSense H5 test pass

Set:
- `SPIN_CLASH_REWARD_ADAPTER=adsense_h5_rewarded`
- `SPIN_CLASH_ADSENSE_ENABLED=true`
- `SPIN_CLASH_ADSENSE_H5_ENABLED=true`
- `SPIN_CLASH_ADSENSE_H5_PUBLISHER_ID=<real ca-pub-...>`
- `SPIN_CLASH_ADSENSE_H5_DATA_AD_CLIENT=<same ca-pub-... unless operator setup requires otherwise>`
- `SPIN_CLASH_ADSENSE_H5_TEST_MODE=true`

Optional:
- `SPIN_CLASH_ADSENSE_H5_PRELOAD=auto`
- `SPIN_CLASH_ADSENSE_H5_SOUND=off`

### B. AdSense H5 production pass

Keep the same H5 variables but set:
- `SPIN_CLASH_ADSENSE_H5_TEST_MODE=false`

### C. GPT / Ad Manager fallback pass

Set:
- `SPIN_CLASH_REWARD_ADAPTER=adsense_rewarded`
- `SPIN_CLASH_ADSENSE_ENABLED=true`
- `SPIN_CLASH_ADSENSE_GPT_REWARDED_AD_UNIT_PATH=<exact copied full ad unit path>`

Only use this fallback if the Ad Manager prerequisites are actually satisfied.

## 4. Keep Live Scope Narrow

Do not widen placement scope during the first real cutover.

The current approved live rewarded placements remain:
- `double_reward`
- `continue_once`
- `trial_unlock_arena`

Anything else should still fail safely with:
- `placement_not_enabled`

Reference:
- `docs/rewarded-integration-prep-checklist.md`

## 5. Produce The Live Deployment

After the variable update:
1. trigger the Pages deployment path
2. wait for the workflow to finish successfully
3. hard refresh the browser tab before validating

Why the hard refresh matters:
- an already-open browser tab may still use cached provider files after the deploy

Before browser validation, confirm the live build is really in rewarded mode through the debug/runtime provider snapshot.

Expected rewarded state:
- `rewardAdapter: "adsense_h5_rewarded"` or `rewardAdapter: "adsense_rewarded"`
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
- confirm H5 test mode is off before any real production monetization pass
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
- which provider path was used:
  - `adsense_h5_rewarded`
  - `adsense_rewarded`
- exact publisher id or rewarded ad unit path used, whichever applies
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
- the configured live provider credentials are real and not placeholder values
- at least one approved placement completes correctly on the real host
- no non-approved placement leaks into live rewarded behavior
- failure and decline behavior still degrade safely

Treat the pass as `no-go` if:
- the H5 account path is still not approved
- the live credentials are still guessed rather than copied
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
