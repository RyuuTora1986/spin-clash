const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(repoRoot, 'dist-static');
const includedPaths = [
  'index.html',
  'css',
  'src',
  path.join('assets', 'vendor')
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

function parseStringEnv(name) {
  const raw = process.env[name];
  if (typeof raw !== 'string') return undefined;
  const normalized = raw.trim();
  return normalized || undefined;
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
  setDeep(overrides, ['reward', 'adsense', 'enabled'], parseBooleanEnv('SPIN_CLASH_REWARD_ENABLED'));
  setDeep(overrides, ['reward', 'adsense', 'scriptUrl'], parseStringEnv('SPIN_CLASH_REWARD_SCRIPT_URL'));
  setDeep(overrides, ['reward', 'adsense', 'rewardedAdUnitPath'], parseStringEnv('SPIN_CLASH_REWARDED_AD_UNIT_PATH'));
  setDeep(overrides, ['reward', 'adsense', 'gamInterstitialAdUnitPath'], parseStringEnv('SPIN_CLASH_GAM_INTERSTITIAL_AD_UNIT_PATH'));

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
  const analytics = overrides.analytics || {};
  const posthog = analytics.posthog || {};

  if (reward.adapter === 'adsense_rewarded' && rewardAdsense.enabled === true && !rewardAdsense.rewardedAdUnitPath) {
    throw new Error('SPIN_CLASH_REWARDED_AD_UNIT_PATH is required when live rewarded ads are enabled for the release build.');
  }

  if (analytics.adapter === 'posthog' && analytics.enableForwarding === true && posthog.enabled === true && !posthog.projectApiKey) {
    throw new Error('SPIN_CLASH_POSTHOG_PROJECT_API_KEY is required when live PostHog forwarding is enabled for the release build.');
  }
}

function writeProviderOverrideFile(destRoot) {
  const overrides = buildProviderOverrides();
  validateProviderOverrides(overrides);

  const overrideFilePath = path.join(destRoot, 'src', 'config-providers-override.js');
  const hasOverrides = JSON.stringify(overrides) !== '{}';
  const body = hasOverrides
    ? JSON.stringify(overrides, null, 2)
    : 'null';
  const content = [
    '(function(){',
    `  window.__spinClashProviderOverrides = ${body};`,
    '})();',
    ''
  ].join('\n');

  fs.writeFileSync(overrideFilePath, content, 'utf8');
}

function removeDir(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function copyPath(srcPath, destPath) {
  const stats = fs.statSync(srcPath);
  if (stats.isDirectory()) {
    ensureDir(destPath);
    for (const name of fs.readdirSync(srcPath)) {
      copyPath(path.join(srcPath, name), path.join(destPath, name));
    }
    return;
  }
  ensureDir(path.dirname(destPath));
  fs.copyFileSync(srcPath, destPath);
}

function main() {
  removeDir(outputDir);
  ensureDir(outputDir);

  for (const relPath of includedPaths) {
    const srcPath = path.join(repoRoot, relPath);
    const destPath = path.join(outputDir, relPath);
    if (!fs.existsSync(srcPath)) {
      throw new Error(`Missing release path: ${relPath}`);
    }
    copyPath(srcPath, destPath);
  }

  writeProviderOverrideFile(outputDir);

  console.log(`Static release package created at ${outputDir}`);
}

main();
