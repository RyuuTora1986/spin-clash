# Launch Blockers

This document lists the remaining blockers between the current repository state and a true public commercial launch.

It is intentionally short and practical.

## 1. Live Provider Validation Is Still Open
Current state:
- provider-phase implementation proof is recorded in:
  - `docs/provider-phase-report-2026-04-18-partial.md`
- reward and analytics adapters are selected behind the existing service layer
- rewarded-prep hardening is now in place:
  - committed live placement allowlist
  - normalized `placement_not_enabled`
  - operator-readable reward adapter debug state
- PostHog is the chosen first remote analytics sink behind `analyticsService`
- local analytics buffering remains the fallback source of truth
- provider/debug regression checks now cover local-safe fallback and failure diagnostics
- a company-branded host route is now configured:
  - GitHub Pages custom domain: `play.hakurokudo.com`
  - WordPress DNS: `CNAME play -> ryuutora1986.github.io`
  - current state on `2026-04-19`:
    - `http://play.hakurokudo.com/` serves the live game
    - GitHub Pages HTTPS issuance is still pending

Blocker:
- real rewarded-ad validation has not happened yet on the target deployed host/browser with a production-capable configuration
- the public GitHub Pages host was recovered on `2026-04-18` and is now serving the provider-aware runtime package again
- fresh deployed-host verification after successful Pages workflow run `24606760465` confirmed:
  - `config-providers.js`
  - `config-providers-runtime.js`
  - `config-providers-override.js`
  - `provider-runtime-tools.js`
  all return `200` from the live site
- live PostHog forwarding was then validated on the deployed host later the same day:
  - repository Actions variables were configured for PostHog
  - deploy runs `24607190399` and `24607227795` completed successfully
  - runtime reached `adapter: "posthog"` with `forwardingEnabled: true`
  - validation progressed from `posthog_loading` to `ready: true`
  - a follow-up validation event returned `forwarded: true`
- this means host staleness and first-sink analytics forwarding are no longer blockers
- the remaining blocker is rewarded-ad live/manual validation
- rewarded prep itself is no longer the blocker; the blocker is external live validation on the deployed host/account/browser path
- fresh Ad Manager access check on `2026-04-19` narrowed the account-side blocker further:
  - `hakurokudo2024@gmail.com` currently lands on the public Ad Manager marketing page, and signup currently reports that an AdSense account is required first
  - `ryuushinyu0305@gmail.com` is blocked by a service-restricted supervised/age gate
  - `liuyinzg@gmail.com` has no confirmed usable Ad Manager workspace yet, but its signup path currently reports a pending AdSense review rather than a hard no-access result
- rewarded ad unit creation is therefore still blocked on obtaining real Ad Manager network/workspace access, not on any additional local prep
- latest AdSense site status provided by the user:
  - site:
    - `hakurokudo.com`
  - status:
    - `正在准备`
  - authorization:
    - `已授权`
  - observed at:
    - `2026-04-19 02:47 JST`
- practical interpretation:
  - site-side authorization appears complete
  - Google-side preparation/review is still not complete
  - rewarded live closeout should remain blocked on account/platform readiness rather than local code work
- browser recheck on `2026-04-20` confirmed no material status change:
  - AdSense site detail for `hakurokudo.com` still shows:
    - `正在准备`
    - `验证网站所有权`
    - `已请求审核`
  - Ad Manager signup on the strongest candidate path still returns:
    - `errorReason=uncheckedAdsenseAccount`
- practical interpretation remains unchanged:
  - the external platform review is still open
  - rewarded live closeout should remain blocked on external platform readiness
- exact browser-read follow-up from the same `2026-04-20` recheck:
  - AdSense site detail currently reads:
    - `正在准备`
    - `验证网站所有权`
    - `已请求审核`
  - Ad Manager direct `/home` still does not expose a workspace:
    - `authuser=0` -> public marketing page
    - `authuser=1` -> public marketing page
    - `authuser=2` -> public marketing page
  - Ad Manager signup paths still fail the same way:
    - `authuser=0` -> `errorReason=uncheckedAdsenseAccount`
    - `authuser=1` -> `errorReason=showLeadGenerationForm`
    - `authuser=2` -> `service-restricted`

Exit condition:
- complete the remaining rewarded-ad live/manual provider checks
- wait for the custom-domain DNS check / HTTPS certificate to finish if public launch messaging needs the company-branded HTTPS URL
- update the partial provider-phase report into final closeout evidence

Execution references:
- `docs/provider-phase-report-2026-04-18-partial.md`
- `docs/host-validation-report-2026-04-17-github-pages.md`
- `docs/admanager-access-check-2026-04-19.md`
- `docs/rewarded-live-cutover-runbook.md`

## What Is Not A Blocker
- adding more content
- adding more tops before analytics review
- image-card sharing polish
- framework migration
- build tooling overhaul
- limited external testing under the default safe provider config

## Practical Interpretation
Right now the project is:
- ready for continued implementation
- ready for local/manual iteration
- ready for provider-phase closeout and live validation
- ready for limited external testing with mock reward + local analytics buffer defaults
- ready on the analytics side for first real deployed-host observation
- not yet ready to be called a final monetized public release
