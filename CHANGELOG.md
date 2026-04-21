# Changelog

## 1.0.6 - 2026-04-21

### Summary
- Improve rewarded-ad failure visibility and relax the AdSense H5 bootstrap gate so reward clicks no longer feel inert.

### User-visible changes
- Rewarded failure states now surface as larger, longer-lived on-screen messages instead of brief, easy-to-miss toasts.
- `double_reward` and `trial_unlock_arena` now map timeout/unavailable failures to clearer "not available right now" messaging.

### Technical changes
- Extended `msg-txt` presentation for multi-line, higher-priority reward feedback.
- Updated match/loadout reward failure handlers to use a stronger message beat.
- Relaxed `adsense_h5_rewarded` bootstrap so `adConfig().onReady()` is no longer treated as the only readiness gate.
- Reclassified `provider_timeout` into the unavailable family for player-facing messaging.
- Added regression checks for reward failure feedback and H5 bootstrap behavior.

### Verification
- `node scripts/check-provider-services.js`
- `node scripts/check-match-flow.js`
- `node scripts/check-loadout-flow.js`
- `npm run preflight`
- Local browser validation against `http://127.0.0.1:4173/index.html?debug=1` with H5 reward overrides
