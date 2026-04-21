# Changelog

## 1.0.8 - 2026-04-21

### Summary
- Rewrote rewarded-failure feedback into scenario-specific guidance and retuned the message card for mobile readability.

### User-visible changes
- `double_reward`, `continue_once`, and `trial_unlock_arena` now tell players exactly what did not happen and what they can do next.
- Long Chinese, Japanese, and English guidance now renders in a wider, calmer message card that stays readable on mobile.

### Technical changes
- Split reward failure copy by placement and failure category instead of reusing one generic reward message.
- Rebalanced the `tone-major` message layer into a fixed-width guidance card with mobile-specific typography.
- Kept the existing reward-provider flow untouched; only player-facing copy and presentation rules changed.

### Verification
- `npm run check:matchflow`
- `npm run check:loadout`
- `npm run check:localization`
- `npm run preflight`
- Mobile viewport browser validation for the longest Chinese continue-failure copy

## 1.0.7 - 2026-04-21

### Summary
- Lift the runtime message layer out of the HUD stacking context so rewarded failure feedback stays visible above result overlays.

### User-visible changes
- `double_reward` failure feedback now renders over the match-result card instead of being trapped behind it.
- Reward availability failures keep the same copy, but the layer now sits in the real viewport stack instead of the HUD stack.

### Technical changes
- Moved `#msg-txt` out of `#hud` in `index.html`.
- Switched `#msg-txt` from `position:absolute` to `position:fixed` for overlay-safe placement.
- Added a DOM contract check to ensure the message layer stays outside the HUD in future releases.

### Verification
- `npm run check:dom`
- `npm run check:matchflow`
- `npm run preflight`
- Live browser validation against `https://play.hakurokudo.com/?debug=1`

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
