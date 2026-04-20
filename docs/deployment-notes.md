# Deployment Notes

This document describes the actual deployment constraints of the current static build.

## Hosting Model
- Static hosting only
- No backend required
- No server session, login, or remote database dependency

Suitable hosts:
- GitHub Pages
- Netlify
- Cloudflare Pages
- Vercel static hosting
- any plain static CDN host

## Required Runtime Capabilities

### Browser Features
Recommended minimum assumptions:
- WebGL available
- modern ES5+ browser support
- `localStorage` available for durable progression

Graceful degradation already in place:
- reward flow works through mock adapters
- share flow falls back to copy/prompt behavior
- storage falls back through:
  - `local`
  - `session`
  - `window_name`
  - `memory`

Important:
- only `local` should be treated as durable long-term save behavior
- `session` and `window_name` are survivability fallbacks, not true release-quality persistence
- `memory` means the current environment is not suitable for normal player progression

## Current External Dependency Risk

### Three.js
- Current runtime uses vendored local file:
  - `assets/vendor/three.min.js`
- No CDN dependency at runtime

### Fonts
- runtime Google Fonts have been removed from `index.html`
- the current build relies on local system font stacks only
- `scripts/check-repo.js` now fails if runtime entry files reintroduce remote Google Fonts

## Save Behavior Expectations

Release target expectation:
- browser runs in `local` persistence mode

If deployment testing shows `session`, `window_name`, or `memory`:
- do not treat that environment as a normal production target without an explicit decision
- use the runtime warning banner and debug diagnostics to confirm the fallback reason

## Reward And Provider Expectations

Current state:
- mock reward abstraction remains the default repository config
- a live GPT rewarded adapter path now exists behind `RewardService`

That means:
- the build is no longer mock-only at the service layer
- production monetization still requires:
  - a real eligible provider/account configuration
  - host/browser validation of the live rewarded path
  - policy-fit confirmation for the chosen platform

## Analytics Expectations

Current state:
- analytics are stored locally in save data
- a PostHog forwarding adapter now exists behind `analyticsService`
- committed base config still defaults to local-only buffering

That means:
- funnel surface and event schema can be validated now
- deploy-time remote forwarding is possible through provider overrides
- production reporting still requires final deployed-host validation with a real configured PostHog project

## Share Expectations

Current state:
- browser-native share if supported
- clipboard/prompt fallback otherwise

That means:
- result sharing is already structurally usable
- polished image-card sharing remains a later enhancement, not a current dependency

## Release Recommendation

Treat the current build as:
- structurally ready for continued static-web iteration
- suitable for closed/manual testing
- suitable for host validation
- suitable for limited external testing with default safe provider config
- not yet a final monetized release until:
  - durable `local` persistence is confirmed on the target host/browser
  - live rewarded-ad validation is completed on the target host/browser
  - live PostHog forwarding is validated on the target host/browser

See also:
- `docs/deployment-preflight.md`
- `docs/host-evaluation-sheet.md`
- `docs/host-validation-plan.md`
- `docs/host-validation-report-template.md`
- `docs/launch-blockers.md`
