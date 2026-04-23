# Changelog

## 1.2.1 - 2026-04-23

### Summary
- Shipped a production hotfix for the GitHub Pages package so authored FX textures and external MP3 music are actually present in the deployed static build.

### User-visible changes
- The deployed site no longer throws the red runtime banner for missing `assets/fx/ringout-flash-v1.png`.
- Homepage and battle music files are now included in the production package instead of only existing in the repo workspace.

### Technical changes
- Expanded the static release packaging allowlist to include `assets/fx` and `assets/audio`, not just `assets/vendor`.
- Hardened the static package check so release validation now fails if the required FX textures or music files are missing from `dist-static`.

### Verification
- `npm run sync:staticversion`
- `npm run verify:release`
- Local static-host probe: `http://127.0.0.1:4175/assets/fx/ringout-flash-v1.png` returned `200`
- Deployed-host probe: `https://play.hakurokudo.com/assets/fx/ringout-flash-v1.png` returned `200` after Pages run `24815429546`

## 1.2.0 - 2026-04-23

### Summary
- Rebuilt the battle presentation layer into a louder, more readable release: stronger launch guidance, heavier clash/ring-out beats, floating live commentary, and the first external BGM line.

### User-visible changes
- Drag aiming now reads as a stronger procedural launch guide instead of the earlier weak dashed line or deformed stretched sprite.
- Battle finishes now hold their impact longer, especially ring-outs, with more pronounced flash, slow-motion, and result timing.
- The old fixed commentary bar is gone; combat reactions now appear as short live-chat style floating comments above the arena.
- The game now plays external homepage and battle MP3 music, with menu and round-based battle switching.

### Technical changes
- Added a battle-feel event layer that ties collisions, wall hits, ring-out beats, commentary, and screen effects into one runtime path.
- Integrated authored FX textures for impact / ring-out layering and prepared the audio asset folder structure plus SUNO prompt pack for the next sound pass.
- Reworked runtime audio to support external MP3 BGM with scene-aware switching, fade handling, autoplay attempts, and procedural fallback behavior.
- Synced release-facing asset query params and build-version labels to `1.2.0`.

### Verification
- `npm run sync:staticversion`
- `npm run verify:release`
- Local browser verification against `http://127.0.0.1:4174/`
- Mobile battle screenshots and runtime-state checks for menu BGM, battle A/B/C routing, and commentary behavior

## 1.1.2 - 2026-04-21

### Summary
- Added in-shell public information pages and tightened their mobile presentation so the site reads as a more complete, reviewable product surface.

### User-visible changes
- Home and Settings now expose `About`, `Contact`, `Privacy`, and `Terms` inside the game shell.
- The public info pages now switch with the current `English / 中文 / 日本語` locale.
- Mobile info-page headers no longer collapse into a broken back-button/title layout.

### Technical changes
- Threaded the new `info` route and `infoPage` state through the runtime shell.
- Added regression coverage for public-info DOM ids, localization keys, route actions, settings/info shell presentation, and info-route return behavior.
- Kept copy constrained to confirmed operator/contact/product facts without adding invented legal or corporate details.

### Verification
- `npm run preflight`
- Local browser QA against `http://127.0.0.1:4173/index.html`
- Desktop verification of Home/Settings public-info entry and return flow
- Mobile verification of info-page readability and header layout
## 1.1.1 - 2026-04-21

### Summary
- Hardened the AdSense H5 rewarded runtime so it no longer requests ads before the API is truly ready or after the original click gesture has already been lost.

### User-visible changes
- Reward CTAs no longer spend a long hidden timeout trying to request an H5 ad before the Google runtime is ready.
- Once the H5 API reports ready, rewarded requests now fire from the original click path instead of a later Promise callback.

### Technical changes
- Tightened H5 reward availability gating from `configured` to `ready`, matching the official `onReady()` sequencing contract.
- Added a synchronous request fast-path for already-ready H5 ads so `adBreak()` stays inside the original user gesture.
- Taught provider runtime init to reuse an existing head bootstrap without injecting duplicate H5 scripts.

### Verification
- `npm run check:providers`
- `npm run check:matchflow`
- `npm run check:loadout`
- `npm run verify:release`
- Live production probe against `https://play.hakurokudo.com/` confirming Google currently returns an empty preloaded ad response while runtime stays `ready=false`

## 1.1.0 - 2026-04-21

### Summary
- Promoted rewarded ads from a test-only integration project into the first real monetization-capable release line.

### User-visible changes
- Rewarded ad entry points now run through the live AdSense H5 path instead of the old mock-grant behavior.
- Reward CTA failures now surface as clear, placement-specific guidance instead of silent or easily missed feedback.
- Release-visible versioning is now aligned across runtime asset cache-busting, packaged output, and the in-game build label.

### Technical changes
- Hardened the AdSense H5 bootstrap, head injection, and ready-state wiring so real user-gesture requests can advance into the Google placement display stage.
- Locked `preloadAdBreaks=on` into the live release path used for the current production rollout.
- Finalized rewarded-ops monitoring and provider closeout documentation for post-launch observation.

### Verification
- `npm run sync:staticversion`
- `npm run verify:release`
- Live browser verification against `https://play.hakurokudo.com/`
- Real-device validation on iPhone 15 Pro Max Chrome with no visible CTA flow issues

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
