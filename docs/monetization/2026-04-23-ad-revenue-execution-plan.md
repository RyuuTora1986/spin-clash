# Ad Revenue Execution Plan 2026-04-23

This note is the current operator-facing execution plan for getting the first real ad revenue from the live web build as fast as possible.

It supersedes one earlier working assumption:
- the live H5 path is not still stuck in Google test mode

## 1. Verified Live State On 2026-04-23

The following were re-verified directly against the live host:
- host:
  - `https://play.hakurokudo.com/`
- live root HTML includes:
  - `meta name="google-adsense-account"`
  - AdSense H5 script in `<head>`
  - `window.__spinClashAdsenseH5Bootstrap`
  - `window.adConfig({ sound: "off", preloadAdBreaks: "on", ... })`
- live `src/config-providers-override.js?v=1.2.1` currently shows:
  - `reward.adapter = "adsense_h5_rewarded"`
  - `reward.adsense.enabled = true`
  - `reward.adsense.h5.enabled = true`
  - `reward.adsense.h5.testMode = false`
  - `reward.adsense.h5.preloadHints.preload = "on"`
  - `analytics.adapter = "posthog"`
  - `analytics.enableForwarding = true`
- live `ads.txt` resolves and returns:
  - `google.com, pub-4799303992679484, DIRECT, f08c47fec0942fa0`
- live shell visibly includes:
  - privacy
  - terms
  - contact
  - about
- live `robots.txt` was missing at the time of verification

Practical meaning:
- the current live Google H5 path is already a production-configured path
- the primary blocker is no longer "test mode still on"
- the next blocker is real yield and real approval economics, not another generic reward-adapter rewrite

## 2. Current Commercial Interpretation

### What is already true
- rewarded runtime integration is live
- rewarded completion events can already be tracked through the current analytics boundary
- the site now has the minimum visible policy pages and `ads.txt` needed for a legitimate public host
- external non-Google monetization applications were already submitted:
  - `AdinPlay`
  - `Nitro`
  - `Playwire`

### What is not yet proven
- actual Google H5 fill quality at production scale
- actual reward completion rate by placement under real traffic
- whether Google alone can produce meaningful near-term revenue on current traffic
- whether a gaming-focused partner will approve this site shape quickly

### What is already ruled out
- do not treat "buy traffic now" as the next move
- the current rewarded-only revenue model does not justify paid UA at this stage

Reference:
- `docs/monetization/2026-04-21-adsense-h5-rewarded-baseline-model.md`
- `docs/monetization/2026-04-21-rewarded-ops-monitoring.md`

## 3. Priority Order From Here

### P0. Measure real live reward health

Do this before reopening provider code.

Watch these events in PostHog first:
- `reward_offer_show`
- `reward_request_start`
- `reward_complete`
- `reward_decline`
- `continue_used`
- `trial_unlock_complete`

Read them by placement:
- `double_reward`
- `continue_once`
- `trial_unlock_arena`

First dashboard cuts:
- `reward_request_start / reward_offer_show`
- `reward_complete / reward_request_start`
- `reward_decline` grouped by `reason`

What would justify more engineering:
- `provider_loading` dominating live failures
- `provider_timeout` dominating live failures
- healthy CTA request rate but weak reward completion rate

What would not justify more engineering:
- low traffic volume alone
- weak player click-through with healthy provider completion

### P1. Push the external review queue

This is now the fastest path to a second real revenue option.

Rank order:
1. `AdinPlay`
2. `Playwire`
3. `Nitro`

Why:
- `AdinPlay` is the closest fit to standalone browser-web HTML5 rewarded monetization
- `Playwire` already received a completed application with traffic proof
- `Nitro` should stay active, but is less obviously tailored to a single live game page than `AdinPlay`

### P2. Start CrazyGames as a traffic path, not a same-day cash path

CrazyGames matters because current monetization is likely traffic-constrained.

Official launch model:
- Basic Launch:
  - SDK optional
  - no monetization
- Full Launch:
  - SDK required
  - monetization enabled after acceptance

Project implication:
- submit to CrazyGames for player acquisition and future monetization
- do not confuse CrazyGames submission with an immediate replacement for self-hosted revenue

Official references:
- `https://docs.crazygames.com/`
- `https://docs.crazygames.com/requirements/intro`
- `https://docs.crazygames.com/requirements/technical/`
- `https://docs.crazygames.com/requirements/gameplay/`
- `https://docs.crazygames.com/requirements/ads/`
- `https://docs.crazygames.com/requirements/game-covers/`
- `https://docs.crazygames.com/faq/`

## 4. External Follow-Up Templates

These are the current recommended follow-up drafts.

### A. AdinPlay follow-up

Suggested subject:

```text
Follow-up: browser-web rewarded monetization for Spin Clash
```

Suggested body:

```text
Hi AdinPlay team,

Following up on our publisher application for Spin Clash:
https://play.hakurokudo.com/

Spin Clash is a live browser-based H5 / HTML5 game. Our rewarded flow is already normalized behind a single reward service and we are specifically evaluating the fastest supported browser-web monetization path for:
- rewarded ads
- video ads
- interstitials
- display

Could you please confirm:
1. whether true rewarded ads are supported for a standalone browser-web HTML5 game site
2. whether desktop web and mobile web are both supported
3. the actual integration model you require
4. any minimum traffic threshold for approval or go-live
5. the fastest practical path to start monetizing this site

If rewarded is not the best first step for our current traffic shape, please advise the smallest supported format mix to go live quickly.

Thanks.
```

### B. Playwire follow-up

Suggested subject:

```text
Follow-up on submitted gaming publisher application for Spin Clash
```

Suggested body:

```text
Hi Playwire team,

Following up on our submitted publisher application for Spin Clash:
https://play.hakurokudo.com/

We are an actively deployed browser game and have already prepared a clean rewarded-ad service boundary on the site. We wanted to check:
1. whether our current site and traffic profile are sufficient for review
2. whether rewarded or video formats are available for our browser-game setup
3. whether any additional materials are needed from us to move the review forward

If there is a preferred first-step integration path for a live HTML5 game site, please let us know.

Thanks.
```

### C. Nitro follow-up

Suggested subject:

```text
Follow-up on Nitro publisher application for Spin Clash
```

Suggested body:

```text
Hi Nitro team,

Following up on our publisher submission for Spin Clash:
https://play.hakurokudo.com/

Spin Clash is a live browser-based game hosted on its own domain. We are looking for the fastest legitimate monetization path for the current live site and wanted to confirm:
1. whether our site shape is a fit for Nitro approval
2. which ad formats are available for a standalone browser-game website
3. whether there are any minimum traffic requirements we should be aware of
4. whether you need any additional analytics or review materials from us

Thanks.
```

## 5. CrazyGames Submission Checklist

Use this as the first-pass checklist before opening a dedicated CrazyGames submission track.

### Required packaging and metadata
- a stable hosted build or uploadable build bundle
- 3 cover images:
  - landscape
  - portrait
  - square
- preview video
- English support
- declared supported orientation

### Technical checks
- use relative paths only
- initial download size within CrazyGames limits
- total build size within CrazyGames limits
- desktop compatibility on Chrome / Edge
- mobile behavior reviewed if mobile support is claimed

### Gameplay checks
- readable at embedded iframe sizes
- no custom fullscreen button
- no cross-promotion flow inside the game
- no disruptive adblock gate behavior
- no minors-inappropriate content

### Project-specific risk notes for Spin Clash
- current self-hosted web build still exposes many source modules directly
  - this is not a CrazyGames rejection criterion by itself
  - but it is not ideal for long-term platform distribution
- the current user path to live gameplay is not yet optimized for the strictest "start quickly" expectation
  - for Basic Launch this may still be acceptable
  - for later Full Launch polish, faster first-play flow is likely worth doing
- a dedicated CrazyGames build should be treated as a separate distribution target
  - do not mix self-hosted Google monetization assumptions into the CrazyGames build

## 6. Immediate User-Assist Items

These are the only items that currently need direct user help.

### Needed from the user
- access to the inboxes used for:
  - `AdinPlay`
  - `Playwire`
  - `Nitro`
- honest last-30-day traffic numbers if any partner asks again
- approval to create a dedicated CrazyGames distribution track when ready

### Not needed yet
- no backend work for monetization itself
- no new reward adapter implementation
- no paid traffic budget

## 7. Immediate Next Action

The next best move is:
1. send the three follow-ups
2. watch real PostHog reward completion data for a few days
3. prepare a separate CrazyGames submission build instead of waiting for all partner replies first
