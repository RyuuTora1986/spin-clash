# PostHog Setup

This document defines the smallest safe way to enable PostHog forwarding in the current static build.

## Goal
- forward existing gameplay analytics events to PostHog
- keep local buffering and debug export intact
- avoid changing gameplay callers
- keep local/default runs explicitly safe when network forwarding is unavailable

## Current Runtime Entry
- `src/config-providers.js`
- `src/analytics-service.js`

## Current Default
The default repository state does **not** send analytics to PostHog.

Default config:
- `adapter: 'local_buffer'`
- `enableForwarding: false`
- `posthog.enabled: false`

That means:
- gameplay remains offline-safe
- analytics still buffer locally in save data
- no external analytics script is requested by default

## Minimal Enablement Steps

Edit `src/config-providers.js`:

```js
analytics: {
  adapter: 'posthog',
  enableForwarding: true,
  posthog: {
    enabled: true,
    projectApiKey: 'YOUR_POSTHOG_PROJECT_API_KEY',
    apiHost: 'https://us.i.posthog.com',
    scriptUrl: 'https://us-assets.i.posthog.com/static/array.js',
    capturePageview: false,
    autocapture: false,
    disableSessionRecording: true
  }
}
```

## Why These Defaults
- `capturePageview: false`
  - this project already has gameplay event instrumentation
  - avoid mixing automatic pageview semantics into the first integration pass
- `autocapture: false`
  - keep event flow inspectable and intentional
- `disableSessionRecording: true`
  - keep the first analytics integration narrow and lower-risk

## Current Runtime Behavior
When PostHog is enabled:
- `analyticsService.track(...)` still writes locally first
- the adapter then tries to forward the same event
- the saved event also gets a normalized `forwarding` result:
  - local/default mode:
    - `{ forwarded:false, reason:'local_only' }`
  - PostHog while the SDK is still loading:
    - `{ forwarded:false, reason:'posthog_loading' }`
  - PostHog when config is incomplete:
    - `{ forwarded:false, reason:'posthog_config_missing' }`
  - PostHog when the SDK load/init path cannot become usable:
    - `{ forwarded:false, reason:'posthog_unavailable' }`
  - PostHog success:
    - `{ forwarded:true }`
- if the SDK is not present yet:
  - the event stays locally buffered
  - the forward adapter may queue the event in memory temporarily
  - the queue auto-flushes after the script loads and `posthog.init(...)` succeeds
  - if load/init fails, gameplay continues and the adapter clears the transient remote queue back to the local-buffer fallback
- debug/runtime inspection also exposes:
  - `analyticsInitialized`
  - `analyticsQueuedEvents`

## Frozen Integration Contract
- Chosen first sink: PostHog Cloud JavaScript SDK
- Gameplay and UI modules continue to emit only `analyticsService.track(eventName, payload)`
- Event-name and payload normalization stay inside `src/analytics-service.js`
- Gameplay callers do not branch on provider state and do not call `window.posthog.*`

## Local Run Safety
- repository defaults remain:
  - `adapter: 'local_buffer'`
  - `enableForwarding: false`
  - `posthog.enabled: false`
- that means local runs do not request the PostHog script unless a developer explicitly enables forwarding
- if forwarding is enabled but the script cannot load, events still remain available through the local analytics buffer and debug export

## Current Limits
- this is a client-only forwarding path
- no identity stitching is implemented yet
- no consent UI is implemented yet
- no session replay or autocapture is enabled

## Validation
Before treating the setup as usable:

```powershell
npm run check:providers
npm run verify:release
```

Then validate in browser:
1. open `?debug=1`
2. confirm `analyticsAdapter` becomes `posthog`
3. confirm `analyticsForwardingEnabled` becomes `true`
4. confirm `analyticsReady` reflects whether the SDK is actually available
5. confirm `analyticsLoading` / `analyticsForwardReason` explain the current forwarding state
6. confirm `analyticsQueuedEvents` drops back to `0` after the script finishes loading
7. trigger normal gameplay events
8. confirm gameplay still works even if PostHog fails to load

## Do Not Do
- do not call `window.posthog.capture(...)` from gameplay code
- do not disable local buffering just because forwarding is enabled
- do not enable session replay in the first pass unless there is a concrete product reason
