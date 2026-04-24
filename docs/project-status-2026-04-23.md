# Project Status 2026-04-23

This document records the current `spin-clash` state after the battle-feel release and the `1.2.1` production packaging hotfix.

## Executive Summary

Current status:
- the project is no longer just a stable static shell, it is now a live-deployed playable build with a stronger combat presentation layer
- `main` is on release `1.2.1`
- `play.hakurokudo.com` is serving the current package, including authored FX textures and imported menu / battle mp3 assets

What materially changed since the older `2026-04-17` status snapshot:
- battle feel, commentary, and ring-out presentation moved from "needs a polish pass" to "real shipped runtime behavior"
- external BGM support is now live in runtime
- release governance is now explicit in-repo
- GitHub Pages packaging now correctly includes authored FX and audio assets instead of only `assets/vendor`

## What Is Already Done

### Runtime And Presentation
- stronger procedural drag guide replaced the earlier weak dashed launch line
- heavy-hit, wall-impact, and ring-out feedback now run through a more explicit battle-feel event path
- ring-out endings now hold on a dedicated cinematic beat before result takeover
- battle commentary now exists as an actual floating live-comment layer instead of only center-screen callouts
- external menu / battle BGM is integrated from `assets/audio/music/*.mp3`

### Authored Asset Pipeline
- authored FX resources are now checked in under:
  - `assets/fx/impact-burst-v1.png`
  - `assets/fx/ringout-flash-v1.png`
- audio staging folders and naming are established under:
  - `assets/audio/music/`
  - `assets/audio/sfx/`
  - `assets/audio/voice/`
- SUNO prompt pack is documented in:
  - `docs/suno-audio-pack-20260423.md`

### Release And Deployment Hygiene
- release version source is now formalized through:
  - `package.json`
  - `docs/release-governance.md`
- release packaging is validated through:
  - `npm run sync:staticversion`
  - `npm run verify:release`
- GitHub Pages workflow publishes `dist-static/`, not the whole repo
- the `1.2.1` hotfix closed the production packaging gap for `assets/fx` and `assets/audio`

## What Is Stable Right Now

### Current branch and deploy state
- recommended working branch for the next session: `main`
- use `main` as the recovery baseline, then run `git status --short --branch` before starting the next slice
- live deploy was last confirmed on:
  - GitHub Pages run `24815549699`

### Verified live-host facts
- `https://play.hakurokudo.com/` returned `200`
- `https://play.hakurokudo.com/assets/fx/ringout-flash-v1.png` returned `200`
- `https://play.hakurokudo.com/assets/audio/music/home_neon_grind_01.mp3` returned `200`
- deployed `index.html` is now serving `?v=1.2.1` asset labels

## What Is Not Done Yet

### Highest-value gameplay / UX follow-up
1. battle feel still needs one more human-tuned pass
   - heart arena opening tolerance is better, but not yet locked
   - commentary density / frequency / vertical placement can still be tuned from actual player feel
   - BGM mix is a first-pass balance, not final mastering
2. imported SFX and key voice lines are still missing from runtime
   - BGM is integrated
   - button / clash / finish / announcer voice assets are not yet live

### Launch blockers that still remain
1. rewarded-ad live/manual validation is still open on the real target host/account/browser path
2. final provider-side readiness is still external-platform dependent

Reference:
- `docs/launch-blockers.md`
- `docs/rewarded-live-cutover-runbook.md`

### Maintenance work that should not be forgotten
1. GitHub Actions Pages workflow is currently green, but the run now shows a Node 20 deprecation warning
2. the workflow should be revisited before GitHub forces JavaScript actions to Node 24 by default

## Recommended Next Execution Order

### Track A: Combat feel closeout
1. run another focused local human playtest on `main`
2. tune heart opening tolerance, commentary pacing, and any over/under-powered ring-out beats
3. keep the next feel pass narrow and verify with the existing `battleperf / roundflow / ui` gates

### Track B: Sound pass closeout
1. generate or import the remaining SFX and short announcer voice lines
2. wire them through the current runtime audio surface
3. re-check in-game balance so music does not mask hit readability

### Track C: Provider closeout
1. keep gameplay/runtime changes minimal
2. switch attention back to rewarded-ad live validation only after the current UX/audio pass feels stable enough

## Practical Recommendation

The project should now be treated as:
- ready for continued gameplay-feel iteration on top of a real deployed baseline
- ready for another local human playtest loop without structural refactor work first
- not yet ready to call fully launch-closed while provider validation and the remaining sound pass are still open

The best next session is not a broad rewrite.
It is a small, verified follow-up pass on either:
- combat feel tuning
- SFX / voice integration
