const path = require('path');
const { buildRelease } = require('./release-builder');

const repoRoot = path.resolve(__dirname, '..');
const outputDir = process.env.SPIN_CLASH_BUILD_OUTPUT_DIR
  ? path.resolve(process.env.SPIN_CLASH_BUILD_OUTPUT_DIR)
  : path.join(repoRoot, 'dist-static');
const runtimeProfile = {
  profile: 'production',
  channelId: 'direct_web_google',
  debugToolsEnabled: false,
  exposeUiBindings: false
};
const extraOmittedBundleScripts = [
  'src/platform-runtime-config.js',
  'src/crazygames-service.js',
  'src/shared-backend-status-ui.js'
];

function parseBooleanEnv(name) {
  const raw = process.env[name];
  if (typeof raw !== 'string') return undefined;
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return undefined;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  throw new Error(`Invalid boolean env for ${name}: ${raw}`);
}

function parseBooleanEnvAny(names) {
  for (const name of names) {
    const value = parseBooleanEnv(name);
    if (value !== undefined) {
      return value;
    }
  }
  return undefined;
}

function parseStringEnv(name) {
  const raw = process.env[name];
  if (typeof raw !== 'string') return undefined;
  const normalized = raw.trim();
  return normalized || undefined;
}

function parseStringEnvAny(names) {
  for (const name of names) {
    const value = parseStringEnv(name);
    if (value !== undefined) {
      return value;
    }
  }
  return undefined;
}

function setDeep(target, pathParts, value) {
  if (value === undefined) return;
  let cursor = target;
  for (let index = 0; index < pathParts.length - 1; index += 1) {
    const key = pathParts[index];
    if (!cursor[key] || typeof cursor[key] !== 'object' || Array.isArray(cursor[key])) {
      cursor[key] = {};
    }
    cursor = cursor[key];
  }
  cursor[pathParts[pathParts.length - 1]] = value;
}

function buildProviderOverrides() {
  const overrides = {};

  setDeep(overrides, ['reward', 'adapter'], parseStringEnv('SPIN_CLASH_REWARD_ADAPTER'));
  setDeep(overrides, ['reward', 'mockMode'], parseStringEnv('SPIN_CLASH_REWARD_MOCK_MODE'));
  setDeep(overrides, ['reward', 'adsense', 'enabled'], parseBooleanEnvAny(['SPIN_CLASH_ADSENSE_ENABLED', 'SPIN_CLASH_REWARD_ENABLED']));
  setDeep(overrides, ['reward', 'adsense', 'scriptUrl'], parseStringEnvAny(['SPIN_CLASH_ADSENSE_GPT_SCRIPT_URL', 'SPIN_CLASH_REWARD_SCRIPT_URL']));
  setDeep(overrides, ['reward', 'adsense', 'rewardedAdUnitPath'], parseStringEnvAny(['SPIN_CLASH_ADSENSE_GPT_REWARDED_AD_UNIT_PATH', 'SPIN_CLASH_REWARDED_AD_UNIT_PATH']));
  setDeep(overrides, ['reward', 'adsense', 'gamInterstitialAdUnitPath'], parseStringEnv('SPIN_CLASH_GAM_INTERSTITIAL_AD_UNIT_PATH'));
  setDeep(overrides, ['reward', 'adsense', 'h5', 'enabled'], parseBooleanEnv('SPIN_CLASH_ADSENSE_H5_ENABLED'));
  setDeep(overrides, ['reward', 'adsense', 'h5', 'scriptUrl'], parseStringEnv('SPIN_CLASH_ADSENSE_H5_SCRIPT_URL'));
  setDeep(overrides, ['reward', 'adsense', 'h5', 'publisherId'], parseStringEnv('SPIN_CLASH_ADSENSE_H5_PUBLISHER_ID'));
  setDeep(overrides, ['reward', 'adsense', 'h5', 'dataAdClient'], parseStringEnv('SPIN_CLASH_ADSENSE_H5_DATA_AD_CLIENT'));
  setDeep(overrides, ['reward', 'adsense', 'h5', 'testMode'], parseBooleanEnv('SPIN_CLASH_ADSENSE_H5_TEST_MODE'));
  setDeep(overrides, ['reward', 'adsense', 'h5', 'preloadHints', 'preload'], parseStringEnv('SPIN_CLASH_ADSENSE_H5_PRELOAD'));
  setDeep(overrides, ['reward', 'adsense', 'h5', 'preloadHints', 'sound'], parseStringEnv('SPIN_CLASH_ADSENSE_H5_SOUND'));

  setDeep(overrides, ['analytics', 'adapter'], parseStringEnv('SPIN_CLASH_ANALYTICS_ADAPTER'));
  setDeep(overrides, ['analytics', 'enableForwarding'], parseBooleanEnv('SPIN_CLASH_ANALYTICS_ENABLE_FORWARDING'));
  setDeep(overrides, ['analytics', 'posthog', 'enabled'], parseBooleanEnv('SPIN_CLASH_POSTHOG_ENABLED'));
  setDeep(overrides, ['analytics', 'posthog', 'projectApiKey'], parseStringEnv('SPIN_CLASH_POSTHOG_PROJECT_API_KEY'));
  setDeep(overrides, ['analytics', 'posthog', 'apiHost'], parseStringEnv('SPIN_CLASH_POSTHOG_API_HOST'));
  setDeep(overrides, ['analytics', 'posthog', 'scriptUrl'], parseStringEnv('SPIN_CLASH_POSTHOG_SCRIPT_URL'));
  setDeep(overrides, ['analytics', 'posthog', 'capturePageview'], parseBooleanEnv('SPIN_CLASH_POSTHOG_CAPTURE_PAGEVIEW'));
  setDeep(overrides, ['analytics', 'posthog', 'autocapture'], parseBooleanEnv('SPIN_CLASH_POSTHOG_AUTOCAPTURE'));
  setDeep(overrides, ['analytics', 'posthog', 'disableSessionRecording'], parseBooleanEnv('SPIN_CLASH_POSTHOG_DISABLE_SESSION_RECORDING'));

  return overrides;
}

function validateProviderOverrides(overrides) {
  const reward = overrides.reward || {};
  const rewardAdsense = reward.adsense || {};
  const rewardAdsenseH5 = rewardAdsense.h5 || {};
  const analytics = overrides.analytics || {};
  const posthog = analytics.posthog || {};

  if (reward.adapter === 'adsense_rewarded' && rewardAdsense.enabled === true && !rewardAdsense.rewardedAdUnitPath) {
    throw new Error('SPIN_CLASH_ADSENSE_GPT_REWARDED_AD_UNIT_PATH is required when the GPT rewarded adapter is enabled for the release build.');
  }

  if (
    reward.adapter === 'adsense_h5_rewarded'
    && rewardAdsense.enabled === true
    && rewardAdsenseH5.enabled === true
    && !rewardAdsenseH5.publisherId
    && !rewardAdsenseH5.dataAdClient
  ) {
    throw new Error('SPIN_CLASH_ADSENSE_H5_PUBLISHER_ID or SPIN_CLASH_ADSENSE_H5_DATA_AD_CLIENT is required when the H5 rewarded adapter is enabled for the release build.');
  }

  if (analytics.adapter === 'posthog' && analytics.enableForwarding === true && posthog.enabled === true && !posthog.projectApiKey) {
    throw new Error('SPIN_CLASH_POSTHOG_PROJECT_API_KEY is required when live PostHog forwarding is enabled for the release build.');
  }
}

function buildProviderOverrideScript(overrides) {
  const hasOverrides = JSON.stringify(overrides) !== '{}';
  const body = hasOverrides
    ? JSON.stringify(overrides, null, 2)
    : 'null';
  return [
    '(function(){',
    `  window.__spinClashProviderOverrides = ${body};`,
    '})();',
    ''
  ].join('\n');
}

function shouldInjectAdsenseH5HeadBootstrap(overrides) {
  const reward = overrides.reward || {};
  const adsense = reward.adsense || {};
  const h5 = adsense.h5 || {};
  return reward.adapter === 'adsense_h5_rewarded'
    && adsense.enabled === true
    && h5.enabled === true
    && !!(h5.dataAdClient || h5.publisherId);
}

function buildAdsenseH5HeadBootstrap(overrides) {
  const reward = overrides.reward || {};
  const adsense = reward.adsense || {};
  const h5 = adsense.h5 || {};
  const clientId = String(h5.dataAdClient || h5.publisherId || '').trim();
  const baseScriptUrl = String(
    h5.scriptUrl
    || adsense.scriptUrl
    || 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
  ).trim();
  const scriptUrl = /[?&]client=/.test(baseScriptUrl)
    ? baseScriptUrl
    : `${baseScriptUrl}${baseScriptUrl.includes('?') ? '&' : '?'}client=${encodeURIComponent(clientId)}`;
  const tagAttributes = [
    'async',
    `src="${scriptUrl}"`,
    'crossorigin="anonymous"',
    `data-ad-client="${clientId}"`
  ];
  if (h5.testMode === true) {
    tagAttributes.push('data-adbreak-test="on"');
  }
  return [
    '<script ' + tagAttributes.join(' ') + '></script>',
    '<script>',
    'window.adsbygoogle = window.adsbygoogle || [];',
    'window.adBreak = window.adBreak || function(o) { window.adsbygoogle.push(o); };',
    'window.adConfig = window.adConfig || function(o) { window.adsbygoogle.push(o); };',
    `window.__spinClashAdsenseH5Bootstrap = { clientId: ${JSON.stringify(clientId)}, preloadConfigured: true };`,
    `window.adConfig({ sound: ${JSON.stringify((h5.preloadHints && h5.preloadHints.sound) || 'off')}, preloadAdBreaks: ${JSON.stringify((h5.preloadHints && h5.preloadHints.preload) || 'auto')}, onReady: function() { if (window.__spinClashAdsenseH5Bootstrap) { window.__spinClashAdsenseH5Bootstrap.ready = true; window.__spinClashAdsenseH5Bootstrap.readyAt = Date.now(); } } });`,
    '</script>'
  ].join('\n');
}

function injectAdsenseH5HeadBootstrap(indexHtml, overrides) {
  if (!shouldInjectAdsenseH5HeadBootstrap(overrides)) {
    return indexHtml;
  }
  if (/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=/.test(indexHtml)) {
    return indexHtml;
  }
  if (!indexHtml.includes('</head>')) {
    throw new Error('Unable to inject AdSense H5 bootstrap because </head> is missing.');
  }
  const injection = `${buildAdsenseH5HeadBootstrap(overrides)}\n`;
  return indexHtml.replace('</head>', `${injection}</head>`);
}

async function main() {
  const providerOverrides = buildProviderOverrides();
  validateProviderOverrides(providerOverrides);

  const result = await buildRelease({
    repoRoot,
    outputDir,
    runtimeProfile,
    omittedBundleScripts: extraOmittedBundleScripts,
    scriptReplacements: {
      'src/config-providers-override.js': {
        kind: 'inline',
        content: buildProviderOverrideScript(providerOverrides)
      },
      'src/startup-tools.js': {
        kind: 'file',
        path: path.join('src', 'channel-runtime', 'startup-tools-production.js')
      }
    },
    transformOutputIndexHtml(indexHtml) {
      return injectAdsenseH5HeadBootstrap(indexHtml, providerOverrides);
    }
  });

  console.log(`Static release package created at ${result.outputDir} with bundles ${result.vendorBundleRelPath} and ${result.bundleRelPath}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error && error.message ? error.message : error);
    process.exit(1);
  });
}
