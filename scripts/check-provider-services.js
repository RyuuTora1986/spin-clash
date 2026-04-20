const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');

function loadScript(relPath, context) {
  const absPath = path.join(repoRoot, relPath);
  const code = fs.readFileSync(absPath, 'utf8');
  vm.runInContext(code, context, { filename: relPath });
}

function createBaseContext() {
  const save = { analytics: [] };
  const head = {
    appended: [],
    appendChild(node) {
      this.appended.push(node);
      return node;
    }
  };
  const context = vm.createContext({
    console,
    window: {},
    document: {
      head,
      querySelector() {
        return null;
      },
      createElement(tag) {
        return {
          tagName: String(tag).toUpperCase(),
          async: false,
          src: '',
          dataset: {},
          onload: null,
          onerror: null
        };
      }
    },
    Date,
    setTimeout,
    clearTimeout
  });
  context.window = context;
  context.SpinClash = {
    config: {},
    services: {
      storage: {
        get() {
          return save;
        },
        transact(mutator) {
          return mutator(save);
        }
      }
    },
    debug: { enabled: false }
  };
  return { context, save, head };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function testLocalBufferMode() {
  const { context, save } = createBaseContext();
  loadScript(path.join('src', 'config-providers.js'), context);
  loadScript(path.join('src', 'provider-runtime-tools.js'), context);
  loadScript(path.join('src', 'analytics-service.js'), context);
  loadScript(path.join('src', 'reward-service.js'), context);
  const service = context.SpinClash.services.analytics;
  const reward = context.SpinClash.services.reward;
  const event = service.track('session_start', { mode: 'quick' });
  const info = service.getAdapterInfo();
  const rewardInfo = reward.getAdapterInfo();

  assert(info.adapter === 'local_buffer', 'Expected local_buffer adapter by default.');
  assert(info.forwardingEnabled === false, 'Expected forwarding disabled by default.');
  assert(info.ready === false, 'Expected local analytics adapter to report not ready for remote forwarding.');
  assert(info.loading === false, 'Expected local analytics adapter to report not loading.');
  assert(info.lastForwardReason === 'local_only', 'Expected local analytics adapter to expose local_only state.');
  assert(info.initialized === false, 'Expected local analytics adapter to report not initialized.');
  assert(info.queuedEvents === 0, 'Expected local analytics adapter to report zero queued events.');
  assert(event.forwarding && event.forwarding.reason === 'local_only', 'Expected local_only forwarding result by default.');
  assert(Array.isArray(save.analytics) && save.analytics.length === 1, 'Expected one locally buffered analytics event.');

  assert(rewardInfo.adapter === 'mock', 'Expected mock reward adapter by default.');
  assert(rewardInfo.ready === true, 'Expected mock reward adapter to report ready.');
  assert(reward.wasGranted({ granted:true }) === true, 'Expected reward.wasGranted(true) helper to return true.');
  assert(reward.wasGranted({ granted:false }) === false, 'Expected reward.wasGranted(false) helper to return false.');
}

async function testMockRewardModes() {
  const { context } = createBaseContext();
  loadScript(path.join('src', 'config-providers.js'), context);
  loadScript(path.join('src', 'analytics-service.js'), context);
  loadScript(path.join('src', 'reward-service.js'), context);
  const reward = context.SpinClash.services.reward;

  reward.setMockMode('deny');
  const denied = await reward.request('double_reward', { source: 'test' });
  assert(denied && denied.granted === false, 'Expected mock deny mode to resolve with granted:false.');
  assert(reward.wasGranted(denied) === false, 'Expected reward.wasGranted to reject mock deny results.');

  reward.setMockMode('error');
  let errorRejected = false;
  try {
    await reward.request('double_reward', { source: 'test' });
  } catch (error) {
    errorRejected = true;
    assert(error && error.message === 'mock_error', 'Expected mock error mode to reject with mock_error.');
  }
  assert(errorRejected, 'Expected mock error mode to reject.');
}

function testRewardFailureClassification() {
  const { context } = createBaseContext();
  loadScript(path.join('src', 'config-providers.js'), context);
  loadScript(path.join('src', 'analytics-service.js'), context);
  loadScript(path.join('src', 'reward-service.js'), context);
  const reward = context.SpinClash.services.reward;

  const declined = reward.getFailureInfo({ granted: false, reason: 'mock_decline' });
  const loading = reward.getFailureInfo(new Error('provider_loading'));
  const busy = reward.getFailureInfo(new Error('request_in_flight'));
  const timeout = reward.getFailureInfo(new Error('provider_timeout'));
  const unavailable = reward.getFailureInfo(new Error('provider_unavailable'));
  const misconfigured = reward.getFailureInfo(new Error('provider_misconfigured'));
  const placementDisabled = reward.getFailureInfo(new Error('placement_not_enabled'));
  const generic = reward.getFailureInfo(new Error('mock_error'));
  const granted = reward.getFailureInfo({ granted: true });

  assert(declined.category === 'declined', 'Expected granted:false result to classify as declined.');
  assert(declined.reason === 'mock_decline', 'Expected declined result to preserve original reason.');
  assert(loading.category === 'loading', 'Expected provider_loading to classify as loading.');
  assert(busy.category === 'busy', 'Expected request_in_flight to classify as busy.');
  assert(timeout.category === 'error', 'Expected provider_timeout to classify as generic error.');
  assert(unavailable.category === 'unavailable', 'Expected provider_unavailable to classify as unavailable.');
  assert(misconfigured.category === 'unavailable', 'Expected provider_misconfigured to classify as unavailable.');
  assert(placementDisabled.category === 'unavailable', 'Expected placement_not_enabled to classify as unavailable.');
  assert(generic.category === 'error', 'Expected unknown error reason to classify as generic error.');
  assert(granted.category === 'granted', 'Expected granted result to classify as granted.');
}

function testPosthogConfiguredMode() {
  const { context, head } = createBaseContext();
  loadScript(path.join('src', 'config-providers.js'), context);
  loadScript(path.join('src', 'provider-runtime-tools.js'), context);
  context.SpinClash.config.providers.analytics.adapter = 'posthog';
  context.SpinClash.config.providers.analytics.enableForwarding = true;
  context.SpinClash.config.providers.analytics.posthog.enabled = true;
  context.SpinClash.config.providers.analytics.posthog.projectApiKey = 'phc_test_key';
  context.SpinClash.config.providers.analytics.posthog.apiHost = 'https://us.i.posthog.com';
  context.SpinClash.config.providers.analytics.posthog.scriptUrl = 'https://cdn.example.test/posthog.js';
  loadScript(path.join('src', 'analytics-service.js'), context);
  const service = context.SpinClash.services.analytics;
  const event = service.track('match_start', { arenaId: 'neo_dome' });
  const info = service.getAdapterInfo();

  assert(info.adapter === 'posthog', 'Expected posthog adapter when configured.');
  assert(info.forwardingEnabled === true, 'Expected forwarding enabled when posthog is configured.');
  assert(info.ready === false, 'Expected posthog adapter to report not ready before SDK load.');
  assert(info.loading === true, 'Expected posthog adapter to report loading after script injection.');
  assert(info.lastForwardReason === 'posthog_loading', 'Expected posthog adapter to expose loading reason.');
  assert(info.initialized === false, 'Expected posthog adapter to report not initialized before SDK load.');
  assert(info.queuedEvents === 1, 'Expected posthog adapter to report one queued event before SDK load.');
  assert(event.forwarding && event.forwarding.reason === 'posthog_loading', 'Expected loading state before SDK becomes available.');
  assert(head.appended.length === 1, 'Expected one PostHog script tag append.');
}

async function testPosthogFlushesQueuedEventAfterScriptReady() {
  const { context, head } = createBaseContext();
  let initCalls = 0;
  const captures = [];

  loadScript(path.join('src', 'config-providers.js'), context);
  loadScript(path.join('src', 'provider-runtime-tools.js'), context);
  context.SpinClash.config.providers.analytics.adapter = 'posthog';
  context.SpinClash.config.providers.analytics.enableForwarding = true;
  context.SpinClash.config.providers.analytics.posthog.enabled = true;
  context.SpinClash.config.providers.analytics.posthog.projectApiKey = 'phc_test_key';
  context.SpinClash.config.providers.analytics.posthog.apiHost = 'https://us.i.posthog.com';
  context.SpinClash.config.providers.analytics.posthog.scriptUrl = 'https://cdn.example.test/posthog.js';
  loadScript(path.join('src', 'analytics-service.js'), context);

  const service = context.SpinClash.services.analytics;
  service.track('session_start', { source: 'provider-check' });

  assert(head.appended.length === 1, 'Expected PostHog script injection before script-ready flush test.');

  context.posthog = {
    init(projectApiKey, options) {
      initCalls += 1;
      this.projectApiKey = projectApiKey;
      this.options = options;
    },
    capture(name, payload) {
      captures.push({ name, payload });
    }
  };

  assert(typeof head.appended[0].onload === 'function', 'Expected injected PostHog script to expose onload handler.');
  head.appended[0].onload();
  await new Promise((resolve) => setTimeout(resolve, 0));

  const info = service.getAdapterInfo();
  assert(initCalls === 1, 'Expected queued PostHog flush to initialize the SDK after script load.');
  assert(captures.length === 1, 'Expected queued analytics event to flush after script load without a second track call.');
  assert(captures[0].name === 'session_start', 'Expected the flushed queued event to preserve its original name.');
  assert(info.ready === true, 'Expected PostHog adapter to report ready after script load and init.');
  assert(info.loading === false, 'Expected PostHog adapter to stop reporting loading after script load.');
  assert(info.lastForwardReason === null, 'Expected PostHog adapter to clear its last forward reason after a successful flush.');
  assert(info.initialized === true, 'Expected PostHog adapter to report initialized after script load and flush.');
  assert(info.queuedEvents === 0, 'Expected PostHog adapter to report zero queued events after a successful flush.');
}

async function testPosthogScriptFailureFallsBackToLocalBuffer() {
  const { context, head, save } = createBaseContext();

  loadScript(path.join('src', 'config-providers.js'), context);
  loadScript(path.join('src', 'provider-runtime-tools.js'), context);
  context.SpinClash.config.providers.analytics.adapter = 'posthog';
  context.SpinClash.config.providers.analytics.enableForwarding = true;
  context.SpinClash.config.providers.analytics.posthog.enabled = true;
  context.SpinClash.config.providers.analytics.posthog.projectApiKey = 'phc_test_key';
  context.SpinClash.config.providers.analytics.posthog.apiHost = 'https://us.i.posthog.com';
  context.SpinClash.config.providers.analytics.posthog.scriptUrl = 'https://cdn.example.test/posthog.js';
  loadScript(path.join('src', 'analytics-service.js'), context);

  const service = context.SpinClash.services.analytics;
  const event = service.track('session_start', { source: 'provider-check' });

  assert(head.appended.length === 1, 'Expected PostHog script injection before the failure fallback test.');
  assert(event.forwarding && event.forwarding.reason === 'posthog_loading', 'Expected PostHog forwarding to start in loading state before script failure.');
  assert(typeof head.appended[0].onerror === 'function', 'Expected injected PostHog script to expose an onerror handler.');

  head.appended[0].onerror();
  await new Promise((resolve) => setTimeout(resolve, 0));

  const info = service.getAdapterInfo();
  assert(Array.isArray(save.analytics) && save.analytics.length === 1, 'Expected local analytics buffering to preserve the original event after PostHog failure.');
  assert(info.ready === false, 'Expected PostHog adapter to stay not ready after script failure.');
  assert(info.loading === false, 'Expected PostHog adapter to clear loading state after script failure.');
  assert(info.lastForwardReason === 'posthog_unavailable', 'Expected PostHog adapter to normalize script failure to posthog_unavailable.');
  assert(info.initialized === false, 'Expected PostHog adapter to remain uninitialized after script failure.');
  assert(info.queuedEvents === 0, 'Expected PostHog adapter to clear queued remote events after falling back to the local buffer.');
}

function testPosthogTopLevelFallbackNormalizesUnexpectedFailureReason() {
  const { context, save } = createBaseContext();

  loadScript(path.join('src', 'config-providers.js'), context);
  loadScript(path.join('src', 'provider-runtime-tools.js'), context);
  context.SpinClash.config.providers.analytics.adapter = 'posthog';
  context.SpinClash.config.providers.analytics.enableForwarding = true;
  context.SpinClash.config.providers.analytics.posthog.enabled = true;
  context.SpinClash.config.providers.analytics.posthog.projectApiKey = 'phc_test_key';
  context.SpinClash.config.providers.analytics.posthog.apiHost = 'https://us.i.posthog.com';
  context.SpinClash.config.providers.analytics.posthog.scriptUrl = 'https://cdn.example.test/posthog.js';
  loadScript(path.join('src', 'analytics-service.js'), context);

  context.SpinClash.services.providerRuntime.hasPosthogApi = function() {
    throw new Error('unexpected_provider_runtime_failure');
  };

  const service = context.SpinClash.services.analytics;
  const event = service.track('match_start', { arenaId: 'neo_dome' });

  assert(Array.isArray(save.analytics) && save.analytics.length === 1, 'Expected top-level fallback test to keep the event in the local analytics buffer.');
  assert(event.forwarding && event.forwarding.forwarded === false, 'Expected top-level fallback test to preserve a failed forwarding result.');
  assert(event.forwarding && event.forwarding.reason === 'posthog_unavailable', 'Expected top-level fallback test to normalize unexpected throw reasons to posthog_unavailable.');
}

function testPosthogSdkPresentButConfigMissingStaysMisconfigured() {
  const { context } = createBaseContext();

  loadScript(path.join('src', 'config-providers.js'), context);
  loadScript(path.join('src', 'provider-runtime-tools.js'), context);
  context.SpinClash.config.providers.analytics.adapter = 'posthog';
  context.SpinClash.config.providers.analytics.enableForwarding = true;
  context.SpinClash.config.providers.analytics.posthog.enabled = true;
  context.posthog = {
    init() {
      throw new Error('posthog_init_should_not_run_without_config');
    },
    capture() {
      throw new Error('posthog_capture_should_not_run_without_config');
    }
  };
  loadScript(path.join('src', 'analytics-service.js'), context);

  const service = context.SpinClash.services.analytics;
  const event = service.track('match_start', { arenaId: 'neo_dome' });
  const info = service.getAdapterInfo();

  assert(event.forwarding && event.forwarding.forwarded === false, 'Expected config-missing PostHog path to report a forwarding failure.');
  assert(event.forwarding && event.forwarding.reason === 'posthog_config_missing', 'Expected config-missing PostHog path to normalize to posthog_config_missing even when the SDK global already exists.');
  assert(info.adapter === 'posthog', 'Expected config-missing PostHog path to preserve the configured adapter.');
  assert(info.forwardingEnabled === true, 'Expected config-missing PostHog path to preserve forwardingEnabled.');
  assert(info.ready === false, 'Expected config-missing PostHog path to report not ready because forwarding is not actually usable.');
  assert(info.loading === false, 'Expected config-missing PostHog path to report not loading.');
  assert(info.lastForwardReason === 'posthog_config_missing', 'Expected config-missing PostHog path to preserve posthog_config_missing in adapter info.');
  assert(info.initialized === false, 'Expected config-missing PostHog path to remain uninitialized.');
  assert(info.queuedEvents === 0, 'Expected config-missing PostHog path to keep zero queued events.');
}

function testAdsenseDisabledRewardFallback() {
  const { context } = createBaseContext();
  loadScript(path.join('src', 'config-providers.js'), context);
  loadScript(path.join('src', 'provider-runtime-tools.js'), context);
  loadScript(path.join('src', 'analytics-service.js'), context);
  context.SpinClash.config.providers.reward.adapter = 'adsense_rewarded';
  context.SpinClash.config.providers.reward.adsense.enabled = false;
  loadScript(path.join('src', 'reward-service.js'), context);
  const reward = context.SpinClash.services.reward;
  const info = reward.getAdapterInfo();
  const availability = reward.isRewardAvailable('double_reward');

  assert(info.adapter === 'adsense_rewarded', 'Expected adsense_rewarded adapter when configured.');
  assert(info.ready === false, 'Expected adsense adapter to report not ready without GPT.');
  assert(info.rewardEnabled === false, 'Expected disabled adsense adapter to report rewardEnabled:false.');
  assert(info.rewardedAdUnitConfigured === false, 'Expected disabled adsense adapter to report rewardedAdUnitConfigured:false.');
  assert(Array.isArray(info.allowedPlacements), 'Expected disabled adsense adapter to expose allowedPlacements.');
  assert(info.allowedPlacements.includes('double_reward'), 'Expected disabled adsense adapter to allow double_reward by config.');
  assert(info.allowedPlacements.includes('continue_once'), 'Expected disabled adsense adapter to allow continue_once by config.');
  assert(info.allowedPlacements.includes('trial_unlock_arena'), 'Expected disabled adsense adapter to allow trial_unlock_arena by config.');
  assert(availability.available === false, 'Expected disabled live reward adapter to report unavailable.');
  assert(availability.reason === 'provider_disabled', 'Expected provider_disabled reason when adsense adapter is disabled.');
}

async function testAdsensePlacementAllowlistRejectsUnknownPlacement() {
  const { context, save } = createBaseContext();
  loadScript(path.join('src', 'config-providers.js'), context);
  loadScript(path.join('src', 'provider-runtime-tools.js'), context);
  loadScript(path.join('src', 'analytics-service.js'), context);
  context.SpinClash.config.providers.reward.adapter = 'adsense_rewarded';
  context.SpinClash.config.providers.reward.adsense.enabled = true;
  context.SpinClash.config.providers.reward.adsense.rewardedAdUnitPath = '/1234567/spin_clash_rewarded';
  loadScript(path.join('src', 'reward-service.js'), context);

  const reward = context.SpinClash.services.reward;
  const info = reward.getAdapterInfo();
  const availability = reward.isRewardAvailable('boss_retry');

  assert(info.adapter === 'adsense_rewarded', 'Expected adsense_rewarded adapter during placement allowlist validation.');
  assert(info.rewardEnabled === true, 'Expected configured live reward adapter to report rewardEnabled:true.');
  assert(info.rewardedAdUnitConfigured === true, 'Expected configured live reward adapter to report rewardedAdUnitConfigured:true.');
  assert(Array.isArray(info.allowedPlacements), 'Expected live reward adapter to expose allowedPlacements.');
  assert(info.allowedPlacements.includes('double_reward'), 'Expected live reward adapter to preserve double_reward in allowedPlacements.');
  assert(info.allowedPlacements.includes('continue_once'), 'Expected live reward adapter to preserve continue_once in allowedPlacements.');
  assert(info.allowedPlacements.includes('trial_unlock_arena'), 'Expected live reward adapter to preserve trial_unlock_arena in allowedPlacements.');
  assert(availability.available === false, 'Expected non-allowlisted live reward placement to report unavailable.');
  assert(availability.reason === 'placement_not_enabled', 'Expected non-allowlisted live reward placement to report placement_not_enabled.');

  let rejected = false;
  try {
    await reward.request('boss_retry', { source: 'placement-allowlist' });
  } catch (error) {
    rejected = true;
    assert(error && error.message === 'placement_not_enabled', 'Expected non-allowlisted live reward placement to reject with placement_not_enabled.');
  }
  assert(rejected, 'Expected non-allowlisted live reward placement to reject.');
  assert(reward.getAdapterInfo().lastRequestReason === 'placement_not_enabled', 'Expected non-allowlisted live reward placement to preserve placement_not_enabled after rejection.');

  const rewardDeclineEvent = save.analytics.find((event) => event.name === 'reward_decline');
  assert(rewardDeclineEvent, 'Expected reward_decline analytics after a non-allowlisted live reward request.');
  assert(rewardDeclineEvent.payload && rewardDeclineEvent.payload.reason === 'placement_not_enabled', 'Expected reward_decline analytics to preserve placement_not_enabled.');
}

async function testUnknownRewardAdapterDoesNotFallbackToMock() {
  const { context, save } = createBaseContext();
  loadScript(path.join('src', 'config-providers.js'), context);
  loadScript(path.join('src', 'analytics-service.js'), context);
  context.SpinClash.config.providers.reward.adapter = 'broken_live_adapter';
  loadScript(path.join('src', 'reward-service.js'), context);
  const reward = context.SpinClash.services.reward;
  const info = reward.getAdapterInfo();
  const availability = reward.isRewardAvailable('double_reward');

  assert(info.adapter === 'broken_live_adapter', 'Expected reward adapter info to preserve the configured adapter id when it is unsupported.');
  assert(info.ready === false, 'Expected unsupported reward adapter to report not ready.');
  assert(info.lastRequestReason === null, 'Expected unsupported reward adapter to report no request failure before the first request.');
  assert(availability.available === false, 'Expected unsupported reward adapter to report unavailable instead of falling back to mock.');
  assert(availability.reason === 'provider_misconfigured', 'Expected unsupported reward adapter to expose provider_misconfigured.');

  let rejected = false;
  try {
    await reward.request('double_reward', { source: 'misconfigured-adapter' });
  } catch (error) {
    rejected = true;
    assert(error && error.message === 'provider_misconfigured', 'Expected unsupported reward adapter to reject with provider_misconfigured.');
  }

  assert(rejected, 'Expected unsupported reward adapter request to reject.');

  const rewardDeclineEvent = save.analytics.find((event) => event.name === 'reward_decline');
  assert(rewardDeclineEvent, 'Expected reward_decline analytics for unsupported reward adapter requests.');
  assert(rewardDeclineEvent.payload && rewardDeclineEvent.payload.adapter === 'broken_live_adapter', 'Expected reward_decline analytics to preserve the unsupported configured adapter id.');
  assert(rewardDeclineEvent.payload && rewardDeclineEvent.payload.reason === 'provider_misconfigured', 'Expected reward_decline analytics to preserve the provider_misconfigured reason.');
  assert(reward.getAdapterInfo().lastRequestReason === 'provider_misconfigured', 'Expected unsupported reward adapter to preserve provider_misconfigured after a failed request.');
}

async function testAdsenseConfiguredRewardFallback() {
  const { context, head } = createBaseContext();
  loadScript(path.join('src', 'config-providers.js'), context);
  loadScript(path.join('src', 'provider-runtime-tools.js'), context);
  loadScript(path.join('src', 'analytics-service.js'), context);
  context.SpinClash.config.providers.reward.adapter = 'adsense_rewarded';
  context.SpinClash.config.providers.reward.adsense.enabled = true;
  context.SpinClash.config.providers.reward.adsense.rewardedAdUnitPath = '/1234567/spin_clash_rewarded';
  loadScript(path.join('src', 'reward-service.js'), context);
  const reward = context.SpinClash.services.reward;
  const info = reward.getAdapterInfo();
  const availability = reward.isRewardAvailable('double_reward');

  assert(info.adapter === 'adsense_rewarded', 'Expected adsense_rewarded adapter when configured.');
  assert(info.ready === false, 'Expected adsense adapter to report not ready without GPT.');
  assert(availability.available === false, 'Expected live reward adapter to remain unavailable without GPT loaded.');
  assert(availability.reason === 'provider_loading' || availability.reason === 'provider_unavailable', 'Expected live reward adapter to report loading or unavailable.');
  assert(head.appended.length === 1, 'Expected GPT script injection attempt for rewarded adapter.');

  let rejected = false;
  try {
    const pending = reward.request('double_reward', { source: 'test' });
    assert(typeof head.appended[0].onerror === 'function', 'Expected injected GPT script to expose onerror handler.');
    head.appended[0].onerror();
    await pending;
  } catch (error) {
    rejected = true;
    assert(
      error && (
        error.message === 'provider_unavailable'
        || error.message === 'provider_not_implemented'
      ),
      'Expected safe live reward fallback reason.'
    );
  }
  assert(rejected, 'Expected adsense reward request to reject while provider is unavailable.');
}

async function testAdsenseRequestWaitsForScriptLoad() {
  const { context, head } = createBaseContext();
  let settled = false;
  const listeners = {};
  const slot = {
    addService() {
      return this;
    }
  };
  let displayTarget = null;
  let result = null;

  loadScript(path.join('src', 'config-providers.js'), context);
  loadScript(path.join('src', 'provider-runtime-tools.js'), context);
  loadScript(path.join('src', 'analytics-service.js'), context);
  context.SpinClash.config.providers.reward.adapter = 'adsense_rewarded';
  context.SpinClash.config.providers.reward.adsense.enabled = true;
  context.SpinClash.config.providers.reward.adsense.scriptUrl = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
  context.SpinClash.config.providers.reward.adsense.rewardedAdUnitPath = '/1234567/spin_clash_rewarded';
  loadScript(path.join('src', 'reward-service.js'), context);

  const reward = context.SpinClash.services.reward;
  const pending = reward.request('double_reward', { source: 'test' }).then((value) => {
    result = value;
    settled = true;
  });

  await new Promise((resolve) => setTimeout(resolve, 0));
  assert(head.appended.length === 1, 'Expected GPT script injection during first reward request.');
  assert(settled === false, 'Expected first reward request to wait for GPT script load instead of rejecting immediately.');

  context.googletag = {
    cmd: [],
    display() {},
    enableServices() {},
    enums: {
      OutOfPageFormat: {
        REWARDED: 'rewarded'
      }
    },
    defineOutOfPageSlot() {
      return slot;
    },
    pubads() {
      return {
        addEventListener(name, handler) {
          listeners[name] = handler;
        },
        removeEventListener(name, handler) {
          if (listeners[name] === handler) delete listeners[name];
        }
      };
    },
    display(targetSlot) {
      displayTarget = targetSlot;
    }
  };

  assert(typeof head.appended[0].onload === 'function', 'Expected injected GPT script to expose onload handler.');
  head.appended[0].onload();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert(displayTarget === slot, 'Expected first reward request to proceed into a real slot request after GPT load.');
  assert(typeof listeners.rewardedSlotReady === 'function', 'Expected first reward request to register rewarded listeners after GPT load.');
  listeners.rewardedSlotReady({
    slot,
    makeRewardedVisible() {}
  });
  listeners.rewardedSlotClosed({ slot });
  await pending;

  assert(settled === true, 'Expected reward request to settle after GPT script load.');
  assert(result && result.granted === false, 'Expected first reward request to complete the live flow after GPT load.');
  assert(result.reason === 'slot_closed', 'Expected first reward request to preserve the post-load close reason.');
}

async function testAdsenseRewardGrantFlow() {
  const { context, head, save } = createBaseContext();
  const listeners = {};
  const slot = {
    addService() {
      return this;
    }
  };
  let displayTarget = null;
  let makeVisibleCalls = 0;
  let destroyedSlots = null;

  loadScript(path.join('src', 'config-providers.js'), context);
  loadScript(path.join('src', 'provider-runtime-tools.js'), context);
  loadScript(path.join('src', 'analytics-service.js'), context);
  context.SpinClash.config.providers.reward.adapter = 'adsense_rewarded';
  context.SpinClash.config.providers.reward.adsense.enabled = true;
  context.SpinClash.config.providers.reward.adsense.rewardedAdUnitPath = '/1234567/spin_clash_rewarded';
  loadScript(path.join('src', 'reward-service.js'), context);

  const reward = context.SpinClash.services.reward;
  const pending = reward.request('double_reward', { source: 'grant-flow' });

  context.googletag = {
    cmd: [],
    display(targetSlot) {
      displayTarget = targetSlot;
    },
    destroySlots(slots) {
      destroyedSlots = slots;
      return true;
    },
    enableServices() {},
    enums: {
      OutOfPageFormat: {
        REWARDED: 'rewarded'
      }
    },
    defineOutOfPageSlot(adUnitPath, format) {
      assert(adUnitPath === '/1234567/spin_clash_rewarded', 'Expected rewarded slot to use configured ad unit path.');
      assert(format === 'rewarded', 'Expected rewarded slot to request REWARDED out-of-page format.');
      return slot;
    },
    pubads() {
      return {
        addEventListener(name, handler) {
          listeners[name] = handler;
        },
        removeEventListener(name, handler) {
          if (listeners[name] === handler) delete listeners[name];
        }
      };
    }
  };

  head.appended[0].onload();
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert(displayTarget === slot, 'Expected rewarded request to display the created slot.');
  assert(typeof listeners.rewardedSlotReady === 'function', 'Expected rewardedSlotReady listener registration.');
  assert(typeof listeners.rewardedSlotGranted === 'function', 'Expected rewardedSlotGranted listener registration.');
  assert(typeof listeners.rewardedSlotClosed === 'function', 'Expected rewardedSlotClosed listener registration.');

  listeners.rewardedSlotReady({
    slot,
    makeRewardedVisible() {
      makeVisibleCalls += 1;
    }
  });
  assert(makeVisibleCalls === 1, 'Expected rewarded request to make the rewarded slot visible after readiness.');

  listeners.rewardedSlotGranted({
    slot,
    payload: {
      amount: 1,
      type: 'bonus'
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert(destroyedSlots === null, 'Expected rewarded grant flow to wait for slot close before cleanup.');
  listeners.rewardedSlotClosed({ slot });

  const result = await pending;
  assert(result && result.granted === true, 'Expected rewarded grant flow to resolve with granted:true.');
  assert(result.adapter === 'adsense_rewarded', 'Expected live rewarded grant flow to report the live adapter.');
  assert(result.reward && result.reward.amount === 1, 'Expected rewarded grant payload to be forwarded in the result.');
  assert(Array.isArray(destroyedSlots) && destroyedSlots[0] === slot, 'Expected rewarded slot cleanup after a granted reward flow.');

  const rewardCompleteEvent = save.analytics.find((event) => event.name === 'reward_complete');
  assert(rewardCompleteEvent, 'Expected reward_complete analytics after a granted live reward.');
  assert(rewardCompleteEvent.payload && rewardCompleteEvent.payload.adapter === 'adsense_rewarded', 'Expected reward_complete analytics to preserve the live adapter.');
}

async function testAdsenseRewardDeclineOnCloseWithoutGrant() {
  const { context, head, save } = createBaseContext();
  const listeners = {};
  const slot = {
    addService() {
      return this;
    }
  };
  let destroyedSlots = null;

  loadScript(path.join('src', 'config-providers.js'), context);
  loadScript(path.join('src', 'provider-runtime-tools.js'), context);
  loadScript(path.join('src', 'analytics-service.js'), context);
  context.SpinClash.config.providers.reward.adapter = 'adsense_rewarded';
  context.SpinClash.config.providers.reward.adsense.enabled = true;
  context.SpinClash.config.providers.reward.adsense.rewardedAdUnitPath = '/1234567/spin_clash_rewarded';
  loadScript(path.join('src', 'reward-service.js'), context);

  const reward = context.SpinClash.services.reward;
  const pending = reward.request('continue_once', { source: 'close-without-grant' });

  context.googletag = {
    cmd: [],
    display() {},
    destroySlots(slots) {
      destroyedSlots = slots;
      return true;
    },
    enableServices() {},
    enums: {
      OutOfPageFormat: {
        REWARDED: 'rewarded'
      }
    },
    defineOutOfPageSlot() {
      return slot;
    },
    pubads() {
      return {
        addEventListener(name, handler) {
          listeners[name] = handler;
        },
        removeEventListener(name, handler) {
          if (listeners[name] === handler) delete listeners[name];
        }
      };
    }
  };

  head.appended[0].onload();
  await new Promise((resolve) => setTimeout(resolve, 0));
  listeners.rewardedSlotReady({
    slot,
    makeRewardedVisible() {}
  });
  listeners.rewardedSlotClosed({ slot });

  const result = await pending;
  assert(result && result.granted === false, 'Expected rewarded close without grant to resolve with granted:false.');
  assert(result.reason === 'slot_closed', 'Expected rewarded close without grant to report slot_closed.');
  assert(Array.isArray(destroyedSlots) && destroyedSlots[0] === slot, 'Expected rewarded slot cleanup after close without grant.');

  const rewardDeclineEvent = save.analytics.find((event) => event.name === 'reward_decline');
  assert(rewardDeclineEvent, 'Expected reward_decline analytics after close without grant.');
  assert(rewardDeclineEvent.payload && rewardDeclineEvent.payload.reason === 'slot_closed', 'Expected reward_decline analytics to preserve slot_closed reason.');
}

async function testAdsenseRewardTimeoutPath() {
  const { context, head, save } = createBaseContext();
  const listeners = {};
  const slot = {
    addService() {
      return this;
    }
  };
  const scheduledTimers = new Map();
  let nextTimerId = 1;

  context.setTimeout = function(callback) {
    const timerId = nextTimerId++;
    scheduledTimers.set(timerId, callback);
    return timerId;
  };
  context.clearTimeout = function(timerId) {
    scheduledTimers.delete(timerId);
  };

  loadScript(path.join('src', 'config-providers.js'), context);
  loadScript(path.join('src', 'provider-runtime-tools.js'), context);
  loadScript(path.join('src', 'analytics-service.js'), context);
  context.SpinClash.config.providers.reward.adapter = 'adsense_rewarded';
  context.SpinClash.config.providers.reward.adsense.enabled = true;
  context.SpinClash.config.providers.reward.adsense.rewardedAdUnitPath = '/1234567/spin_clash_rewarded';
  loadScript(path.join('src', 'reward-service.js'), context);

  const reward = context.SpinClash.services.reward;
  const pending = reward.request('double_reward', { source: 'timeout-path' });

  context.googletag = {
    cmd: [],
    display() {},
    destroySlots() {
      return true;
    },
    enableServices() {},
    enums: {
      OutOfPageFormat: {
        REWARDED: 'rewarded'
      }
    },
    defineOutOfPageSlot() {
      return slot;
    },
    pubads() {
      return {
        addEventListener(name, handler) {
          listeners[name] = handler;
        },
        removeEventListener(name, handler) {
          if (listeners[name] === handler) delete listeners[name];
        }
      };
    }
  };

  head.appended[0].onload();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert(typeof listeners.rewardedSlotReady === 'function', 'Expected rewarded timeout flow to reach listener registration before timeout.');
  assert(scheduledTimers.size >= 1, 'Expected rewarded timeout flow to register a request timeout.');

  const [timeoutId, timeoutCallback] = scheduledTimers.entries().next().value;
  timeoutCallback();
  scheduledTimers.delete(timeoutId);

  let rejected = false;
  try {
    await pending;
  } catch (error) {
    rejected = true;
    assert(error && error.message === 'provider_timeout', 'Expected rewarded timeout flow to reject with provider_timeout.');
  }
  assert(rejected, 'Expected rewarded timeout flow to reject.');
  assert(reward.getAdapterInfo().lastRequestReason === 'provider_timeout', 'Expected reward adapter info to preserve provider_timeout after a timed-out request.');

  const rewardDeclineEvent = save.analytics.find((event) => event.name === 'reward_decline');
  assert(rewardDeclineEvent, 'Expected reward_decline analytics after a timed-out reward request.');
  assert(rewardDeclineEvent.payload && rewardDeclineEvent.payload.reason === 'provider_timeout', 'Expected reward_decline analytics to preserve provider_timeout.');
}

async function testAdsenseSyncProviderFailureCleansBusyState() {
  const { context, head, save } = createBaseContext();
  const slot = {
    addService() {
      throw new Error('slot_add_service_failed');
    }
  };

  loadScript(path.join('src', 'config-providers.js'), context);
  loadScript(path.join('src', 'provider-runtime-tools.js'), context);
  loadScript(path.join('src', 'analytics-service.js'), context);
  context.SpinClash.config.providers.reward.adapter = 'adsense_rewarded';
  context.SpinClash.config.providers.reward.adsense.enabled = true;
  context.SpinClash.config.providers.reward.adsense.rewardedAdUnitPath = '/1234567/spin_clash_rewarded';
  loadScript(path.join('src', 'reward-service.js'), context);

  const reward = context.SpinClash.services.reward;
  const pending = reward.request('double_reward', { source: 'sync-provider-failure' });

  context.googletag = {
    cmd: [],
    display() {},
    destroySlots() {
      return true;
    },
    enableServices() {},
    enums: {
      OutOfPageFormat: {
        REWARDED: 'rewarded'
      }
    },
    defineOutOfPageSlot() {
      return slot;
    },
    pubads() {
      return {
        addEventListener() {},
        removeEventListener() {}
      };
    }
  };

  head.appended[0].onload();

  let rejected = false;
  try {
    await pending;
  } catch (error) {
    rejected = true;
    assert(error && error.message === 'provider_unavailable', 'Expected synchronous provider setup throws to normalize to provider_unavailable.');
  }
  assert(rejected, 'Expected synchronous provider setup failure to reject the request.');

  const info = reward.getAdapterInfo();
  assert(info.loading === false, 'Expected synchronous provider setup failure to clear loading state.');
  assert(info.activePlacement === null, 'Expected synchronous provider setup failure to clear active placement.');
  assert(info.lastRequestReason === 'provider_unavailable', 'Expected synchronous provider setup failure to preserve provider_unavailable.');

  const rewardDeclineEvent = save.analytics.find((event) => event.name === 'reward_decline');
  assert(rewardDeclineEvent, 'Expected reward_decline analytics after a synchronous provider setup failure.');
  assert(rewardDeclineEvent.payload && rewardDeclineEvent.payload.reason === 'provider_unavailable', 'Expected reward_decline analytics to preserve provider_unavailable after a synchronous provider setup failure.');
}

async function testAdsenseSyncWaitForScriptThrowClearsWaitState() {
  const { context, save } = createBaseContext();

  loadScript(path.join('src', 'config-providers.js'), context);
  loadScript(path.join('src', 'provider-runtime-tools.js'), context);
  loadScript(path.join('src', 'analytics-service.js'), context);
  context.SpinClash.config.providers.reward.adapter = 'adsense_rewarded';
  context.SpinClash.config.providers.reward.adsense.enabled = true;
  context.SpinClash.config.providers.reward.adsense.rewardedAdUnitPath = '/1234567/spin_clash_rewarded';
  loadScript(path.join('src', 'reward-service.js'), context);

  const providerRuntime = context.SpinClash.services.providerRuntime;
  providerRuntime.waitForScript = function() {
    throw new Error('wait_for_script_sync_throw');
  };

  const reward = context.SpinClash.services.reward;

  let rejected = false;
  try {
    await reward.request('double_reward', { source: 'sync-wait-throw' });
  } catch (error) {
    rejected = true;
    assert(error && error.message === 'provider_unavailable', 'Expected synchronous waitForScript throws to normalize to provider_unavailable.');
  }
  assert(rejected, 'Expected synchronous waitForScript throw to reject the request.');

  const info = reward.getAdapterInfo();
  const scriptState = providerRuntime.getScriptState('reward-gpt');
  assert(info.loading === false, 'Expected synchronous waitForScript throw to clear loading state.');
  assert(info.activePlacement === null, 'Expected synchronous waitForScript throw to leave active placement clear.');
  assert(info.lastRequestReason === 'provider_unavailable', 'Expected synchronous waitForScript throw to preserve provider_unavailable.');
  assert(scriptState && scriptState.loading === false, 'Expected synchronous waitForScript throw to clear provider-runtime script loading state.');
  assert(scriptState && scriptState.error === true, 'Expected synchronous waitForScript throw to mark the provider-runtime script entry as failed.');

  const rewardDeclineEvent = save.analytics.find((event) => event.name === 'reward_decline');
  assert(rewardDeclineEvent, 'Expected reward_decline analytics after a synchronous waitForScript throw.');
  assert(rewardDeclineEvent.payload && rewardDeclineEvent.payload.reason === 'provider_unavailable', 'Expected reward_decline analytics to preserve provider_unavailable after a synchronous waitForScript throw.');
}

async function main() {
  testLocalBufferMode();
  await testMockRewardModes();
  testRewardFailureClassification();
  testPosthogConfiguredMode();
  await testPosthogFlushesQueuedEventAfterScriptReady();
  await testPosthogScriptFailureFallsBackToLocalBuffer();
  testPosthogTopLevelFallbackNormalizesUnexpectedFailureReason();
  testPosthogSdkPresentButConfigMissingStaysMisconfigured();
  testAdsenseDisabledRewardFallback();
  await testAdsensePlacementAllowlistRejectsUnknownPlacement();
  await testUnknownRewardAdapterDoesNotFallbackToMock();
  await testAdsenseConfiguredRewardFallback();
  await testAdsenseRequestWaitsForScriptLoad();
  await testAdsenseRewardGrantFlow();
  await testAdsenseRewardDeclineOnCloseWithoutGrant();
  await testAdsenseRewardTimeoutPath();
  await testAdsenseSyncProviderFailureCleansBusyState();
  await testAdsenseSyncWaitForScriptThrowClearsWaitState();
  console.log('Provider service check passed.');
}

main().catch((error)=>{
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
