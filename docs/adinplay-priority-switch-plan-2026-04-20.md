# AdinPlay Priority Switch Plan 2026-04-20

This note is the concrete operator plan for making `AdinPlay` the first non-Google monetization path while preserving a clean return path back to Google later.

It is intentionally narrow:
- what to submit to AdinPlay now
- what must stay locked in the repo before approval
- what to implement only after AdinPlay confirms a real web integration path
- how to switch back to Google with the smallest possible surface later

## 1. Current Decision

As of `2026-04-20 JST`:
- Google AdSense / Ad Manager approval is still externally blocked
- the repo is not blocked on local rewarded prep
- `AdinPlay` is now the first-priority alternative path

Practical meaning:
- stop waiting on Google as the only route
- do not reopen gameplay/runtime code before an approved alternative platform provides real integration details
- prepare the external application and the internal adapter boundary now

## 2. Why AdinPlay First

Official AdinPlay pages currently state:
- they specialize in browser game monetization
- they support:
  - `Rewarded video`
  - `Video ads`
  - `Display banners`
  - `Interstitial ads`
- they position their stack around:
  - gaming-focused monetization
  - header bidding
  - direct demand through Venatus

Official references:
- `https://adinplay.com/publishers`
- `https://adinplay.com/platform/solutions/header-bidding`
- `https://adinplay.com/about`

Project interpretation:
- this is a much closer fit for `spin-clash` than a generic broad-market ad network
- if AdinPlay can support browser-web rewarded or a close equivalent, it is the strongest temporary replacement for the current Google rewarded path

## 3. What Must Stay Locked Before Approval

Before AdinPlay explicitly confirms a usable web integration path, keep all of the following true:
- committed base reward config still defaults to `mock`
- gameplay callers still use:
  - `rewardService.request(placement, context)`
- gameplay callers do not import any provider globals directly
- approved rewarded placement scope remains:
  - `double_reward`
  - `continue_once`
  - `trial_unlock_arena`
- Google-specific runtime code is not deleted
- no code assumes AdinPlay will expose the same event model as GPT

Current repo boundary that must remain the source of truth:
- `src/config-providers.js`
- `src/reward-service.js`
- `src/config-providers-runtime.js`
- `src/config-providers-override.js`
- `docs/provider-integration-notes.md`
- `docs/reward-live-adapter-status.md`

## 4. AdinPlay Contact Form Fields Confirmed

The current `For Publishers` contact page renders a same-origin embedded form.

Confirmed required fields on `2026-04-20`:
- `First name*`
- `Last name*`
- `Email*`
- `Phone number*`
- `Website URL*`
- `How many pageviews do you have per month?*`
- `What is the content of your site?*`
- `Reason for Submission*`

Confirmed selectable categories:
- content:
  - `Gaming`
  - `Entertainment`
  - `Tech`
  - `H5 / HTML5`
  - `Other`
- reason:
  - `Sign Up`
  - `Customer Support`
  - `User Issue`

Confirmed optional interest checkboxes:
- `Display Ads`
- `Video Ads`
- `Rewarded Ads`
- `Interstitial Ads`
- `Audio Ads`

Confirmed optional free-text field:
- `Message`

Official page:
- `https://adinplay.com/contact/for-publishers`

## 5. Recommended AdinPlay Submission Values

These are the recommended values for the first submission.

### Locked project values
- Website URL:
  - `https://play.hakurokudo.com/`
- Reason for Submission:
  - `Sign Up`
- Content:
  - `H5 / HTML5`
- Interested in:
  - `Rewarded Ads`
  - `Video Ads`
  - `Interstitial Ads`
  - `Display Ads`

Why `H5 / HTML5` instead of `Gaming`:
- the site is obviously a game either way
- `H5 / HTML5` highlights the exact browser-runtime form factor and should reduce ambiguity around platform support

### Required user-supplied values
- first name
- last name
- contact email
- phone number
- honest monthly pageview estimate for the last 30 days

Do not guess monthly pageviews.
If exact GA4 data is not ready, use the best honest last-30-day estimate and say it is an early-stage live deployment.

## 6. Recommended First Submission Message

Use this message as the default first contact:

```text
Hi AdinPlay team,

We are looking to monetize Spin Clash, a static browser-based H5 / HTML5 game currently deployed at https://play.hakurokudo.com/.

The game already has a clean rewarded-flow service boundary in place and is prepared for the following rewarded placements:
- double_reward
- continue_once
- trial_unlock_arena

We are specifically interested in:
- rewarded ads for browser web / HTML5 gameplay
- video ads
- interstitials
- display as a supplemental revenue layer

The current priority is to launch a real browser-web monetization path quickly with a setup that can later be optimized further.

If rewarded is supported for our traffic profile and site shape, we would like the fastest path to go live.
If a different initial browser-web format mix is recommended first, please advise the smallest practical integration path.

Thanks.
```

## 7. What To Ask AdinPlay Immediately

The first reply from AdinPlay needs to answer these exact questions:
- do they support true browser-web rewarded for a standalone H5 game site
- if yes, what is the actual integration model:
  - managed tag
  - JS SDK
  - iframe/video unit
  - custom player callback
  - mediation wrapper
- what event contract is available for reward grant vs close vs fail
- whether desktop web and mobile web are both supported
- whether there are minimum traffic requirements for going live
- whether they recommend rewarded first, or display/video first
- whether the site can run on `play.hakurokudo.com` directly
- what review/approval materials they need beyond the form

Until those questions are answered, do not implement an AdinPlay runtime adapter.

## 8. Internal Technical Plan After Approval

Only start code work after AdinPlay confirms a real supported integration path.

### Phase 1: preserve existing runtime contract
- keep `rewardService.request(placement, context)` unchanged
- add a new adapter id:
  - `adinplay_rewarded`
  - or a differently named adapter only if AdinPlay's actual format requires it
- do not remove `adsense_rewarded`
- do not widen placement scope during first cutover

### Phase 2: keep provider selection deploy-time only
- committed base config should still stay:
  - `reward.adapter = 'mock'`
- first AdinPlay live rollout should happen through deploy-time override only
- Google return should also remain deploy-time only

### Phase 3: use the same operator model as Google
- provider-specific keys/script URLs stay in deploy-time config
- debug snapshot must expose:
  - adapter id
  - ready/loading state
  - placement availability state
  - last request reason
- gameplay code should continue to see only:
  - granted
  - declined
  - unavailable
  - loading
  - error

## 9. Proposed Future Config Direction

Do not implement this blindly before AdinPlay docs exist.
This is only the desired shape.

```js
reward: {
  adapter: 'mock',
  mockMode: 'grant',
  livePlacements: {
    double_reward: true,
    continue_once: true,
    trial_unlock_arena: true
  },
  adsense: {
    enabled: false,
    scriptUrl: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
    rewardedAdUnitPath: '',
    gamInterstitialAdUnitPath: ''
  },
  adinplay: {
    enabled: false,
    scriptUrl: '',
    rewardedPlacementId: '',
    videoPlacementId: '',
    interstitialPlacementId: ''
  }
}
```

Deploy-time switch goal:
- temporary AdinPlay live:
  - `SPIN_CLASH_REWARD_ADAPTER=adinplay_rewarded`
- later Google return:
  - `SPIN_CLASH_REWARD_ADAPTER=adsense_rewarded`

The exact AdinPlay variable names must wait for real integration docs.

## 10. Return Path Back To Google

The return path must stay simple:
- do not delete the existing Google rewarded adapter
- do not entangle gameplay logic with provider-specific code
- do not hardcode AdinPlay IDs into committed source
- keep Google and AdinPlay as peer adapters behind the same service layer

Practical rollback / return sequence later:
1. switch deploy-time reward adapter back to `adsense_rewarded`
2. restore Google live enable flags and ad unit path
3. redeploy
4. validate the same three approved placements on the live host

If the runtime contract is preserved, this should be a provider toggle, not a gameplay rewrite.

## 11. Immediate Execution Checklist

Do now:
1. collect the user-only contact fields for the AdinPlay form
2. submit the first AdinPlay publisher application
3. request confirmation specifically about browser-web rewarded support
4. wait for their actual integration guidance
5. only then decide whether the first cutover should be:
   - rewarded-first
   - or display/video-first

Do not do now:
- do not invent an AdinPlay adapter before docs arrive
- do not remove Google prep code
- do not widen rewarded placement scope
- do not claim that AdinPlay can replace Google rewarded one-for-one until they confirm it

## 12. Minimal Missing Inputs From The User

To submit the first AdinPlay form, only these values are still missing:
- contact first name
- contact last name
- contact email
- contact phone
- monthly pageview estimate for the live site

Everything else is already determined.
