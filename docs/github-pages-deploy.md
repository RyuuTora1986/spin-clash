# GitHub Pages Deploy

This document defines the smallest safe GitHub Pages path for the current static build.

## Why GitHub Pages First
- already aligned with the existing GitHub repo
- cheap enough for repeated iteration
- good enough to validate static hosting, pathing, and persistence behavior
- no extra framework or deployment service is required

## Current Deploy Shape
The repository now includes:
- GitHub Actions workflow:
  - `.github/workflows/deploy-pages.yml`
- static release packaging script:
  - `scripts/build-static-release.js`

The workflow does not publish the whole repo.
It runs:
1. `npm ci`
2. `npm run verify:release`
3. uploads `dist-static/` to Pages

Published file set:
- `index.html`
- `css/`
- `src/`
- `assets/vendor/`

This keeps docs, originals, helper scripts, and local workflow files out of the live site.

## One-Time GitHub Setup
In the GitHub repository settings:
1. open `Settings`
2. open `Pages`
3. set `Source` to `GitHub Actions`

After that:
- every push to `main` can deploy
- `workflow_dispatch` can deploy manually from Actions

## Live Provider Setup Without Editing Code
The Pages workflow now supports deploy-time provider overrides through GitHub Actions repository variables.

Open:
1. `Settings`
2. `Secrets and variables`
3. `Actions`
4. `Variables`

For the smallest live reward validation pass, add:
- `SPIN_CLASH_REWARD_ADAPTER`
  - value: `adsense_rewarded`
- `SPIN_CLASH_REWARD_ENABLED`
  - value: `true`
- `SPIN_CLASH_REWARDED_AD_UNIT_PATH`
  - value: your real GPT rewarded ad unit path

Important:
- current rewarded placement allowlist is intentionally code-locked in `src/config-providers.js`
- approved live rewarded placements currently remain:
  - `double_reward`
  - `continue_once`
  - `trial_unlock_arena`
- there is no separate Pages variable for widening rewarded placement scope in this prep slice
- if you need to widen live rewarded placement scope later, treat that as a separate reviewed code change instead of a deploy toggle

Optional:
- `SPIN_CLASH_REWARD_SCRIPT_URL`
  - only set this if you need to override the default GPT script URL

For the smallest live PostHog forwarding pass, add:
- `SPIN_CLASH_ANALYTICS_ADAPTER`
  - value: `posthog`
- `SPIN_CLASH_ANALYTICS_ENABLE_FORWARDING`
  - value: `true`
- `SPIN_CLASH_POSTHOG_ENABLED`
  - value: `true`
- `SPIN_CLASH_POSTHOG_PROJECT_API_KEY`
  - value: your real PostHog project API key
- `SPIN_CLASH_POSTHOG_SCRIPT_URL`
  - value: `https://us-assets.i.posthog.com/static/array.js`

Optional:
- `SPIN_CLASH_POSTHOG_API_HOST`
  - default runtime target is `https://us.i.posthog.com`
- `SPIN_CLASH_POSTHOG_CAPTURE_PAGEVIEW`
- `SPIN_CLASH_POSTHOG_AUTOCAPTURE`
- `SPIN_CLASH_POSTHOG_DISABLE_SESSION_RECORDING`

Important:
- if these variables are absent, Pages deploy stays on the default safe mock config
- if live reward is enabled without `SPIN_CLASH_REWARDED_AD_UNIT_PATH`, the release build now fails instead of silently deploying a broken live setup
- if live PostHog forwarding is enabled without `SPIN_CLASH_POSTHOG_PROJECT_API_KEY`, the release build now fails instead of silently deploying a broken live setup
- in the current runtime implementation, live PostHog validation should also set `SPIN_CLASH_POSTHOG_SCRIPT_URL`; otherwise the adapter can switch to `posthog` mode while the SDK remains unavailable
- after changing provider variables, an already-open browser tab may need a hard refresh before it picks up the latest deployed provider override file

## Expected URL
For the current repo name:
- `https://ryuutora1986.github.io/spin-clash/`

Current company-branded alias path:
- `http://play.hakurokudo.com/`

Important:
- for GitHub Pages custom workflows, the effective custom-domain source of truth is the repository Pages setting, not a packaged `CNAME` file
- on `2026-04-19`, `play.hakurokudo.com` was configured in:
  - `Settings -> Pages -> Custom domain`
  - WordPress domain DNS as:
    - `CNAME`
    - host: `play`
    - target: `ryuutora1986.github.io`
- HTTP on the custom domain is already serving the live site
- HTTPS can remain temporarily unavailable while GitHub Pages finishes DNS verification and certificate issuance
- the repository now also ships the two basic AdSense ownership signals needed for the game host:
  - `index.html` includes:
    - `<meta name="google-adsense-account" content="ca-pub-4799303992679484">`
  - root `ads.txt` publishes:
    - `google.com, pub-4799303992679484, DIRECT, f08c47fec0942fa0`

Important:
- local asset references are already relative, so project-site subpath hosting should work

## Local Verification Before Push
Run:

```powershell
npm install
npm run verify:release
```

Then inspect:
- `dist-static/index.html`
- `dist-static/css/game.css`
- `dist-static/src/`
- `dist-static/assets/vendor/three.min.js`

## Host Validation After Deploy
Open:
- production URL
- production URL + `?debug=1`

Then run:
- `docs/manual-test-batches.md`
- `docs/host-validation-plan.md`

During rewarded-prep inspection, confirm the debug/runtime provider snapshot can explain:
- `rewardAdapter`
- `rewardEnabled`
- `rewardAllowedPlacements`
- `rewardedAdUnitConfigured`
- `rewardAvailabilityReason`
- `rewardRequestReason`
- `rewardActivePlacement`

Record the result in:
- `docs/host-validation-report-template.md`

## Pass Criteria For This Host
- site loads from the Pages URL without path issues
- `persistenceMode === local`
- main manual batches pass
- no blocking runtime error banner
- share fallback and reward mock flows still work

## Known Limits
- Pages deployment solves hosting validation, not monetization readiness
- the deployed repository defaults to the mock reward adapter unless live provider config is intentionally enabled
- the deployed repository defaults to local analytics buffering unless PostHog forwarding is intentionally enabled
- even with live provider overrides enabled, final launch readiness still depends on real deployed-host validation
- if the custom company domain was recently changed, GitHub Pages may serve only HTTP until DNS verification and HTTPS certificate issuance complete

## If Pages Fails
Use the failure report to decide the next host.
Do not add more gameplay scope before one real host is validated.
