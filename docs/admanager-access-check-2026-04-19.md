# Ad Manager Access Check 2026-04-19

This note records the current Google Ad Manager access status for the `spin-clash` rewarded-ad closeout path.

It is intentionally narrow:
- which signed-in Google accounts were checked
- what each account currently does when sent to Ad Manager
- what rewarded ad unit preparation is still blocked on

## Browser Session Baseline
- date checked:
  - `2026-04-19`
- browser path:
  - attached Chrome session through local CDP proxy
- starting URL:
  - `https://accounts.google.com/AccountChooser?continue=https%3A%2F%2Fadmanager.google.com%2F&service=gam`

## Account Results

### `liuyinzg@gmail.com`
- present in the current signed-in Chrome account chooser:
  - yes
- direct Ad Manager landing tested with:
  - `https://admanager.google.com/home/?authuser=0`
- current result:
  - lands on the public Ad Manager marketing page
  - no Ad Manager workspace or inventory UI was exposed
- chooser-click follow-up:
  - did not produce a confirmed workspace
  - the flow returned to the account chooser instead of surfacing Inventory / Ad units
- signup-start follow-up:
  - `https://admanager.google.com/settings/signup/start?authuser=0`
  - current result:
    - `errorReason=uncheckedAdsenseAccount`
    - visible message says Google is still reviewing the AdSense account application
    - Ad Manager login should work only after the confirmation email is received
- practical interpretation:
  - no confirmed usable Ad Manager workspace yet
  - this is currently the closest viable Ad Manager path, but it is blocked on AdSense approval first

### `hakurokudo2024@gmail.com`
- present in the current signed-in Chrome account chooser:
  - yes
- direct Ad Manager landing tested with:
  - `https://admanager.google.com/home/?authuser=1`
- chooser-click result:
  - also lands on the public Ad Manager marketing page
- signup-start follow-up:
  - `https://admanager.google.com/settings/signup/start?authuser=1`
  - current result:
    - `errorReason=showLeadGenerationForm`
    - visible message says an AdSense account is required before using Google Ad Manager
- current result:
  - no Ad Manager workspace or inventory UI was exposed
- practical interpretation:
  - this may still be the desired business identity, but it does not currently have a usable AdSense-linked Ad Manager signup path in this browser session

### `ryuushinyu0305@gmail.com`
- present in the current signed-in Chrome account chooser:
  - yes
- direct Ad Manager landing tested with:
  - `https://admanager.google.com/home/?authuser=2`
- chooser-click result:
  - redirected to:
    - `https://families.google.com/.../service-restricted?...continue=https://admanager.google.com/...`
- visible page result:
  - `service-restricted`
  - age / supervised-account restriction message
- practical interpretation:
  - this account cannot be used for Ad Manager access

## Current Conclusion
- no currently signed-in account has produced a confirmed usable Ad Manager workspace in the checked browser session
- this means the remaining rewarded blocker is no longer code prep
- the blocker is account/network access plus creation of one real rewarded-capable ad unit
- the strongest current path is:
  - wait for the `authuser=0` AdSense review to finish
  - then retry Ad Manager signup/login on that same account

## Recheck On 2026-04-20

The same account path was rechecked on:
- `2026-04-20`

Current AdSense site detail for `hakurokudo.com` still shows:
- `正在准备`
- `验证网站所有权`
- `已请求审核`

Current direct Ad Manager home results are still:
- `authuser=0`
  - lands on the public Ad Manager marketing page
  - no workspace UI was exposed
- `authuser=1`
  - lands on the public Ad Manager marketing page
  - no workspace UI was exposed
- `authuser=2`
  - also lands on the public Ad Manager marketing page on direct `/home`
  - but this still does not expose a usable workspace

Current signup-path results are still:
- `authuser=0`
  - `errorReason=uncheckedAdsenseAccount`
  - visible message says Google is still reviewing the AdSense account application
- `authuser=1`
  - `errorReason=showLeadGenerationForm`
  - visible message says an AdSense account is required before using Google Ad Manager
- `authuser=2`
  - redirects to `families.google.com/.../service-restricted`
  - visible message says the account cannot use the service because it is under the required age / supervised

Practical meaning:
- there is still no confirmed Ad Manager workspace access on the strongest candidate path
- the blocker remains external review state, not missing local code prep

## Strongest Current Path
- based on the account chooser order, the current browser session strongly suggests:
  - `authuser=0` corresponds to `liuyinzg@gmail.com`
  - `authuser=1` corresponds to `hakurokudo2024@gmail.com`
- this mapping is an inference from the checked browser session, not a direct Google account-identity export
- practical meaning:
  - if the active AdSense application really belongs to the `authuser=0` account, that account should be retried first after approval
  - if the project ultimately needs Ad Manager under `hakurokudo2024@gmail.com`, that account will first need its own valid AdSense account because Ad Manager signup is permanently linked to an AdSense account

## What Rewarded Ad Unit Prep Means From Here
Official Ad Manager help currently says:
- rewarded web setup is done in:
  - `Inventory -> Ad units`
- ad unit creation starts with:
  - `New ad unit`
- rewarded configuration is part of the ad unit settings:
  - `Reward`
- the final runtime integration still only needs one thing from Ad Manager:
  - the exact rewarded ad unit path

Project-specific prep recommendation:
- keep using one dedicated rewarded web ad unit for the current repo
- suggested human-readable name:
  - `Spin Clash Rewarded Web`
- suggested code:
  - `spin_clash_rewarded_web`
- final deployment variable should use the exact full path shown by Ad Manager after creation, for example:
  - `SPIN_CLASH_REWARDED_AD_UNIT_PATH=/NETWORK_CODE/spin_clash_rewarded_web`

Important:
- the exact path must be copied from Ad Manager after the ad unit exists
- if the ad unit is created as a child unit, the actual full path may include parent segments
- do not guess the final network code or path before the UI shows it

## Next Practical Step
1. Wait for the pending AdSense review on the current `authuser=0` path to finish.
2. After the approval email arrives, retry:
   - `https://admanager.google.com/settings/signup/start?authuser=0`
   - or normal sign-in at `https://admanager.google.com/`
3. If the project must use `hakurokudo2024@gmail.com` instead, create or link a valid AdSense account for that same Google account first.
4. Once a real Ad Manager workspace opens, create one rewarded web ad unit under `Inventory -> Ad units`.
5. Copy the exact ad unit path from Ad Manager into:
   - `SPIN_CLASH_REWARDED_AD_UNIT_PATH`
6. Redeploy and run the real rewarded validation pass on `play.hakurokudo.com`.

## Official References
- Sign up for Ad Manager:
  - `https://support.google.com/admanager/answer/7084151?hl=en-AU`
- What to do if Ad Manager can't activate your account:
  - `https://support.google.com/admanager/answer/9824633?hl=en`
- Ad unit creation:
  - `https://support.google.com/admanager/answer/10477477?hl=en`
- Rewarded ads for web:
  - `https://support.google.com/admanager/answer/9116812?hl=en`
