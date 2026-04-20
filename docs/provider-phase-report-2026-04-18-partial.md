# Provider Phase Report 2026-04-18 Partial

This is the current provider-phase outcome artifact for the repository as of `2026-04-18`.

It remains intentionally partial. It records what is already proven by local automation and current host validation, and it does not claim reward-provider validation that has not happened yet.

## Summary
- Date: `2026-04-18`
- Integrator: Codex
- Target host baseline: GitHub Pages
- Target browser/device baseline: Windows desktop browser
- Company-branded host alias prepared on `2026-04-19`:
  - `play.hakurokudo.com`
  - `http://play.hakurokudo.com/` already serves the live site
  - GitHub Pages DNS verification / HTTPS issuance is still pending
- Evidence sources:
  - `docs/host-validation-report-2026-04-17-github-pages.md`
  - `docs/reward-live-adapter-status.md`
  - `scripts/check-provider-services.js`
  - `scripts/check-debug-service.js`
  - `scripts/check-debug-runtime-snapshots.js`
  - `npm run preflight`

## Reward Provider
- Provider selected:
  - Google Publisher Tag rewarded web path through the `adsense_rewarded` adapter
- Supported environment:
  - intended for a GPT/AdSense-supported browser environment
  - GitHub Pages is the validated deployment baseline for provider-phase work
  - a real production-capable ad unit and account have not been validated yet
- Adapter status before full live validation:
  - implemented behind `rewardService`
  - committed base config still defaults to `mock`
  - live enablement remains config/override driven
- Placements implemented:
  - `double_reward`
  - `continue_once`
  - `trial_unlock_arena`
- Fallback behavior when unavailable:
  - disabled or missing config reports unavailable safely
  - unsupported adapter ids reject with `provider_misconfigured`
  - GPT bootstrap/setup failure rejects with `provider_unavailable`
  - timeout rejects with `provider_timeout`
  - gameplay callers stay on `rewardService.request(...)`
- Debug-visible failure fields:
  - `lastAvailabilityReason`
  - `lastRequestReason`
  - `activePlacement`

## Analytics Sink
- Sink selected:
  - PostHog JavaScript SDK behind `analyticsService`
- Adapter status after live validation:
  - selected and integrated
  - committed base config still defaults to `local_buffer`
  - remote forwarding remains config-driven and optional
- Forwarded event families:
  - current gameplay/service events emitted through `analyticsService.track(...)`
  - automation proves PostHog queueing/flush/failure handling at the service layer
  - deployed-host validation on `2026-04-18` confirmed real credentialed forwarding on GitHub Pages after provider override deployment
- Local buffering still enabled:
  - yes, and it remains the fallback source of truth
- Failure behavior:
  - no-forwarding base mode reports `local_only`
  - SDK loading reports `posthog_loading`
  - config missing reports `posthog_config_missing`
  - load/init failure reports `posthog_unavailable`
  - local buffering remains intact during remote failure
- Debug-visible forwarding fields:
  - `lastForwardReason`
  - `initialized`
  - `queuedEvents`
- Secret-safe confirmation:
  - adapter/debug surfaces expose state and normalized reasons only
  - current debug automation does not expose provider credentials or rewarded ad unit paths

### Live PostHog Validation On 2026-04-18
- Repository Actions variables created for live PostHog forwarding:
  - `SPIN_CLASH_ANALYTICS_ADAPTER=posthog`
  - `SPIN_CLASH_ANALYTICS_ENABLE_FORWARDING=true`
  - `SPIN_CLASH_POSTHOG_ENABLED=true`
  - `SPIN_CLASH_POSTHOG_PROJECT_API_KEY=<configured in repo variables>`
  - `SPIN_CLASH_POSTHOG_API_HOST=https://us.i.posthog.com`
  - `SPIN_CLASH_POSTHOG_SCRIPT_URL=https://us-assets.i.posthog.com/static/array.js`
- Deploy runs used during closeout:
  - `24607190399`
  - `24607227795`
- Live host validation target:
  - `https://ryuutora1986.github.io/spin-clash/?debug=1`
- Proven results:
  - the deployed `config-providers-override.js` served the expected live PostHog override payload
  - runtime adapter state switched to:
    - `adapter: "posthog"`
    - `forwardingEnabled: true`
  - first validation event hit the expected transitional state:
    - `forwarded: false`
    - `reason: "posthog_loading"`
  - after SDK bootstrap, runtime state became:
    - `ready: true`
    - `initialized: true`
    - `queuedEvents: 0`
    - `lastForwardReason: null`
  - second validation event returned:
    - `forwarded: true`
- Validation note:
  - the current implementation effectively requires `SPIN_CLASH_POSTHOG_SCRIPT_URL` for deployed live validation
  - without that variable, the adapter can switch to `posthog` mode while remaining runtime-unavailable
  - a browser tab that already cached older provider scripts may require a hard refresh before it reflects the newly deployed override file

## Contract Preservation
- `rewardService.request(...)` callers unchanged:
  - yes
- `analyticsService.track(...)` callers unchanged:
  - yes
- gameplay code still provider-agnostic:
  - yes, based on current service-layer structure and passing checks

## Validation

## Provider Validation Matrix

| Row | Current status | Evidence | Live/manual still needed |
| --- | --- | --- | --- |
| reward success | local automation proven | `scripts/check-provider-services.js` covers mock grant and live rewarded grant mapping; `npm run check:providers` passed on `2026-04-18` | real rewarded completion on the deployed target host/browser with an eligible GPT/AdSense setup |
| reward deny | local automation proven | `scripts/check-provider-services.js` covers mock deny and live slot-close-without-grant mapping; `npm run check:providers` passed on `2026-04-18` | real user-visible deny/close behavior on the deployed target host/browser |
| reward timeout/error | local automation proven | `scripts/check-provider-services.js` covers timeout, disabled/misconfigured provider, GPT bootstrap failure, and synchronous provider/setup failures; `npm run check:providers` passed on `2026-04-18` | real environment confirmation for provider timeout/unavailable handling on the deployed target host/browser |
| analytics send success | live deployed-host proven | deployed GitHub Pages validation on `2026-04-18` confirmed SDK bootstrap and forwarded validation event after runtime readiness; service-layer automation also passed via `scripts/check-provider-services.js` | no additional blocker for first PostHog sink validation |
| analytics send fail | local automation proven | `scripts/check-provider-services.js` covers config-missing, script-failure, and top-level runtime fallback to local buffer; deployed-host validation also surfaced the missing-script-url failure mode before the fix | optional additional hostile-network validation only |

### Proven By Local Automation / Repo Verification
- reward success path:
  - proven in service-layer automation for mock success and live rewarded grant mapping
- reward decline path:
  - proven in service-layer automation for mock deny and live slot-close-without-grant mapping
- reward timeout/error path:
  - proven in service-layer automation for timeout, unsupported adapter, disabled/misconfigured provider, GPT bootstrap failure, and synchronous setup failures
- analytics forwarding success:
  - proven in service-layer automation for queued PostHog event flush after SDK readiness
- analytics forwarding failure:
  - proven in service-layer automation for config-missing, script failure, and top-level runtime failure fallback to local buffer
- gameplay unaffected by provider failure:
  - indirectly proven by preserving service contracts and by passing `npm run preflight` after provider/debug checks
- local static mode safe without provider credentials/endpoints:
  - proven by default config remaining `mock` + `local_buffer`
  - proven by `check:providers` assertions for safe behavior when remote credentials/endpoints are absent or unusable
- debug tooling exposes diagnosable provider state without leaking secrets:
  - proven by `check:debugruntime` assertions that mounted debug info exposes adapter/failure state and does not expose `projectApiKey` or `rewardedAdUnitPath`

### Proven By Current Host Validation
- GitHub Pages is acceptable for provider-phase work:
  - yes, per `docs/host-validation-report-2026-04-17-github-pages.md`
- persistence mode on that host:
  - confirmed as `local`
- deployed config used during host validation:
  - mock reward path / non-live provider scope

### Deployed-Host Recovery On 2026-04-18
- Earlier on `2026-04-18`, a fresh inspection of the public Pages URL showed the deployed site was still serving an older package.
- Recovery actions completed later the same day:
  - synced the current release/runtime/workflow files to remote `main`
  - resolved the failing Pages workflow gates caused by partial remote sync and stale analytics event docs
  - GitHub Actions run `24606760465` completed successfully for commit `2112a971bba669594d60db2109887d3001450aaa`
- Fresh deployed-host verification after the successful Pages run:
  - attached-browser check against `https://ryuutora1986.github.io/spin-clash/?debug=1`
  - deployed script list now includes:
    - `src/config-providers.js`
    - `src/config-providers-override.js`
    - `src/config-providers-runtime.js`
    - `src/provider-runtime-tools.js`
  - direct in-page fetch checks for those files returned `200`
  - `?debug=1` mounted the debug panel successfully
  - no visible runtime error banner was present in that fresh deployed check
- Practical meaning:
  - the public GitHub Pages URL is now back to being a valid provider-closeout baseline under the default safe config
  - the remaining provider-phase gap is no longer redeploying the package; it is the still-open live/manual rewarded-ad and PostHog validation work

### Not Yet Proven Live
- rewarded flow against a real production-capable ad unit on the target deployed host/browser:
  - not yet validated
- provider policy/account eligibility and placement-fit for the actual monetization account:
  - not yet validated
- fresh account-access detail on `2026-04-19`:
  - `hakurokudo2024@gmail.com` currently lands on the public Ad Manager marketing page rather than an inventory workspace, and signup currently reports that an AdSense account is required first
  - `ryuushinyu0305@gmail.com` is blocked by a supervised/age-restricted service gate
  - `liuyinzg@gmail.com` did not produce a confirmed usable Ad Manager workspace yet, but its signup path currently reports a pending AdSense review rather than a hard ineligible-state error
  - details recorded in:
    - `docs/admanager-access-check-2026-04-19.md`

## Commands Run For This Report
- `npm run check:providers`
- `npm run check:debugservice`
- `npm run preflight`

## Outcome
- Status:
  - partial

- Notes:
  - provider-phase implementation proof exists locally and is now recorded
  - the public Pages host is now serving the current provider-aware runtime package again
- live PostHog forwarding validation is now complete on the deployed GitHub Pages host
- the remaining unresolved work is rewarded-ad live validation, not missing reporting or host staleness
- the remaining unresolved work also still includes obtaining a real usable Ad Manager workspace/ad unit path for the intended publisher account
- this repository now has a concrete provider-phase outcome artifact, but it is not the final launch signoff

## Follow-Up Actions
1. Run manual rewarded-ad validation on the deployed host/browser with a real eligible GPT/AdSense configuration.
2. Record the real rewarded-ad result and any account/policy constraints.
3. Upgrade this partial report to a final provider-phase closeout report once reward validation is complete.
