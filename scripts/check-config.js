const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const failures = [];

function loadConfigScript(relPath, root) {
  const absPath = path.join(repoRoot, relPath);
  const code = fs.readFileSync(absPath, 'utf8');
  const context = {
    window: { SpinClash: root },
    console
  };
  vm.createContext(context);
  vm.runInContext(code, context, { filename: absPath });
}

function fail(message) {
  failures.push(message);
}

function main() {
  const root = { config: {}, services: {}, state: {}, debug: {} };

  [
    'src/bootstrap-app-globals.js',
    'src/config-text.js',
    'src/config-tops.js',
    'src/config-arenas.js',
    'src/config-modifiers.js',
    'src/config-enemy-presets.js',
    'src/config-economy.js',
    'src/config-challenge-road.js',
    'src/config-providers.js'
  ].forEach((relPath) => loadConfigScript(relPath, root));

  const text = root.config.text || {};
  const tops = root.config.tops || [];
  const arenas = root.config.arenas || [];
  const modifiers = root.config.modifiers || {};
  const enemyPresets = root.config.enemyPresets || {};
  const economy = root.config.economy || {};
  const challengeRoad = root.config.challengeRoad || [];
  const providers = root.config.providers || {};
  const rewardProvider = providers.reward || {};
  const analyticsProvider = providers.analytics || {};
  const adsense = rewardProvider.adsense || {};
  const adsenseH5 = adsense.h5 || {};
  const livePlacements = rewardProvider.livePlacements || {};
  const posthog = analyticsProvider.posthog || {};

  if (!Array.isArray(tops) || tops.length === 0) {
    fail('config.tops is missing or empty');
  }

  if (!Array.isArray(arenas) || arenas.length === 0) {
    fail('config.arenas is missing or empty');
  }

  if (!Array.isArray(challengeRoad) || challengeRoad.length === 0) {
    fail('config.challengeRoad is missing or empty');
  }

  if (!enemyPresets || typeof enemyPresets !== 'object' || Array.isArray(enemyPresets) || Object.keys(enemyPresets).length === 0) {
    fail('config.enemyPresets is missing or empty');
  }

  if (!economy || typeof economy !== 'object' || Array.isArray(economy)) {
    fail('config.economy is missing');
  } else {
    const rewards = economy.rewards || {};
    const runtime = economy.runtime || {};
    if (typeof rewards.winBase !== 'number' || !Number.isFinite(rewards.winBase) || rewards.winBase < 0) {
      fail(`config.economy.rewards.winBase is invalid: ${rewards.winBase}`);
    }
    if (typeof rewards.lossBase !== 'number' || !Number.isFinite(rewards.lossBase) || rewards.lossBase < 0) {
      fail(`config.economy.rewards.lossBase is invalid: ${rewards.lossBase}`);
    }
    if (
      'challengeWinBase' in rewards
      && (typeof rewards.challengeWinBase !== 'number' || !Number.isFinite(rewards.challengeWinBase) || rewards.challengeWinBase < 0)
    ) {
      fail(`config.economy.rewards.challengeWinBase is invalid: ${rewards.challengeWinBase}`);
    }
    if (
      'challengeLossBase' in rewards
      && (typeof rewards.challengeLossBase !== 'number' || !Number.isFinite(rewards.challengeLossBase) || rewards.challengeLossBase < 0)
    ) {
      fail(`config.economy.rewards.challengeLossBase is invalid: ${rewards.challengeLossBase}`);
    }
    if (
      typeof rewards.doubleRewardMultiplier !== 'number'
      || !Number.isFinite(rewards.doubleRewardMultiplier)
      || rewards.doubleRewardMultiplier <= 1
    ) {
      fail(`config.economy.rewards.doubleRewardMultiplier is invalid: ${rewards.doubleRewardMultiplier}`);
    }
    if (
      typeof runtime.defaultRoundTimer !== 'number'
      || !Number.isFinite(runtime.defaultRoundTimer)
      || runtime.defaultRoundTimer <= 0
    ) {
      fail(`config.economy.runtime.defaultRoundTimer is invalid: ${runtime.defaultRoundTimer}`);
    }
    if (typeof runtime.challengeContinueEnabled !== 'boolean') {
      fail(`config.economy.runtime.challengeContinueEnabled is invalid: ${runtime.challengeContinueEnabled}`);
    }
    if (
      typeof runtime.challengeContinueLimit !== 'number'
      || !Number.isInteger(runtime.challengeContinueLimit)
      || runtime.challengeContinueLimit < 0
      || runtime.challengeContinueLimit > 1
    ) {
      fail(`config.economy.runtime.challengeContinueLimit is invalid: ${runtime.challengeContinueLimit}`);
    }
  }

  if (!Array.isArray(text.cards)) {
    fail('config.text.cards is missing');
  } else if (text.cards.length !== tops.length) {
    fail(`config.text.cards length (${text.cards.length}) does not match config.tops length (${tops.length})`);
  }

  if (!Array.isArray(text.arenaOptions)) {
    fail('config.text.arenaOptions is missing');
  } else if (text.arenaOptions.length !== arenas.length) {
    fail(`config.text.arenaOptions length (${text.arenaOptions.length}) does not match config.arenas length (${arenas.length})`);
  }

  const topIds = new Set();
  tops.forEach((top, index) => {
    if (!top || !top.id) fail(`top at index ${index} is missing id`);
    if (top && top.id) {
      if (topIds.has(top.id)) fail(`duplicate top id: ${top.id}`);
      topIds.add(top.id);
    }
  });

  const arenaIds = new Set();
  arenas.forEach((arena, index) => {
    if (!arena || !arena.id) fail(`arena at index ${index} is missing id`);
    if (arena && arena.id) {
      if (arenaIds.has(arena.id)) fail(`duplicate arena id: ${arena.id}`);
      arenaIds.add(arena.id);
    }
  });

  const enemyPresetIds = new Set();
  const enemyAiSignatures = new Set();
  Object.keys(enemyPresets).forEach((presetKey) => {
    const preset = enemyPresets[presetKey];
    if (!preset || !preset.id) {
      fail(`enemy preset ${presetKey} is missing id`);
      return;
    }
    if (preset.id !== presetKey) {
      fail(`enemy preset key/id mismatch: ${presetKey} !== ${preset.id}`);
    }
    if (enemyPresetIds.has(preset.id)) {
      fail(`duplicate enemy preset id: ${preset.id}`);
    }
    enemyPresetIds.add(preset.id);
    if (!preset.topId || !tops.find((top) => top.id === preset.topId)) {
      fail(`enemy preset ${preset.id} references missing topId: ${preset.topId}`);
    }
    if (!preset.ai || typeof preset.ai !== 'object') {
      fail(`enemy preset ${preset.id} is missing ai config`);
      return;
    }
    [
      'seekForce',
      'speedCapScale',
      'inwardBiasRadius',
      'inwardBiasForce',
      'dashRange',
      'dashScale',
      'dashCooldownScaleMin',
      'dashCooldownScaleMax'
    ].forEach((field) => {
      if (typeof preset.ai[field] !== 'number' || !Number.isFinite(preset.ai[field])) {
        fail(`enemy preset ${preset.id} has invalid ai.${field}: ${preset.ai[field]}`);
      }
    });
    if (typeof preset.ai.useSkillOnBurstReady !== 'boolean') {
      fail(`enemy preset ${preset.id} has invalid ai.useSkillOnBurstReady: ${preset.ai.useSkillOnBurstReady}`);
    }
    if (
      typeof preset.ai.dashCooldownScaleMin === 'number'
      && typeof preset.ai.dashCooldownScaleMax === 'number'
      && preset.ai.dashCooldownScaleMax < preset.ai.dashCooldownScaleMin
    ) {
      fail(`enemy preset ${preset.id} has dash cooldown scale max below min`);
    }
    enemyAiSignatures.add(JSON.stringify(preset.ai));
  });

  if (enemyAiSignatures.size < 2) {
    fail('config.enemyPresets currently has no meaningful AI variation');
  }

  challengeRoad.forEach((node, index) => {
    if (typeof node.arenaIndex !== 'number' || !arenas[node.arenaIndex]) {
      fail(`challengeRoad node ${index} has invalid arenaIndex: ${node.arenaIndex}`);
    }
    const nodeArena = arenas[node.arenaIndex] || null;
    if (nodeArena && nodeArena.type === 'heart') {
      fail(`challengeRoad node ${index} (${node.id || 'unknown'}) must not use heart arena ${nodeArena.id}`);
    }
    if ('enemyTopId' in node) {
      fail(`challengeRoad node ${index} still uses legacy enemyTopId: ${node.enemyTopId}`);
    }
    if (!node.enemyPresetId || !enemyPresets[node.enemyPresetId]) {
      fail(`challengeRoad node ${index} has invalid enemyPresetId: ${node.enemyPresetId}`);
    }
    if (!node.modifierId || !modifiers[node.modifierId]) {
      fail(`challengeRoad node ${index} has invalid modifierId: ${node.modifierId}`);
    }
    if (node.unlockTopId && !tops.find((top) => top.id === node.unlockTopId)) {
      fail(`challengeRoad node ${index} references missing unlockTopId: ${node.unlockTopId}`);
    }
  });

  if (!['mock', 'adsense_h5_rewarded', 'adsense_rewarded'].includes(rewardProvider.adapter)) {
    fail(`config.providers.reward.adapter is invalid: ${rewardProvider.adapter}`);
  }

  if (!adsenseH5 || typeof adsenseH5 !== 'object' || Array.isArray(adsenseH5)) {
    fail('config.providers.reward.adsense.h5 is missing');
  }

  if (!livePlacements || typeof livePlacements !== 'object' || Array.isArray(livePlacements)) {
    fail('config.providers.reward.livePlacements is missing');
  } else {
    ['double_reward', 'continue_once', 'trial_unlock_arena'].forEach((placementId) => {
      if (livePlacements[placementId] !== true) {
        fail(`config.providers.reward.livePlacements.${placementId} must default to true`);
      }
    });
  }

  if (!['local_buffer', 'posthog'].includes(analyticsProvider.adapter)) {
    fail(`config.providers.analytics.adapter is invalid: ${analyticsProvider.adapter}`);
  }

  if (rewardProvider.adapter === 'adsense_rewarded' && adsense.enabled === true) {
    if (!adsense.scriptUrl) fail('config.providers.reward.adsense.scriptUrl is required when adsense reward adapter is enabled');
    if (!adsense.rewardedAdUnitPath) fail('config.providers.reward.adsense.rewardedAdUnitPath is required when adsense reward adapter is enabled');
  }

  if (rewardProvider.adapter === 'adsense_h5_rewarded') {
    if (adsense.enabled !== true) fail('config.providers.reward.adsense.enabled is required when adsense_h5_rewarded is enabled');
    if (adsenseH5.enabled !== true) fail('config.providers.reward.adsense.h5.enabled is required when adsense_h5_rewarded is enabled');
    if (!adsenseH5.scriptUrl) fail('config.providers.reward.adsense.h5.scriptUrl is required when adsense_h5_rewarded is enabled');
    if (!adsenseH5.publisherId && !adsenseH5.dataAdClient) {
      fail('config.providers.reward.adsense.h5.publisherId or dataAdClient is required when adsense_h5_rewarded is enabled');
    }
  }

  if (analyticsProvider.adapter === 'posthog' && analyticsProvider.enableForwarding === true && posthog.enabled === true) {
    if (!posthog.projectApiKey) fail('config.providers.analytics.posthog.projectApiKey is required when PostHog forwarding is enabled');
    if (!posthog.apiHost) fail('config.providers.analytics.posthog.apiHost is required when PostHog forwarding is enabled');
  }

  const overrideRoot = { config: {}, services: {}, state: {}, debug: {} };
  loadConfigScript('src/config-providers.js', overrideRoot);
  const baseRewardPath = overrideRoot.config.providers.reward.adsense.rewardedAdUnitPath;
  const baseAdsenseH5PublisherId = (
    overrideRoot.config.providers.reward.adsense.h5
    && overrideRoot.config.providers.reward.adsense.h5.publisherId
  ) || '';
  const baseAnalyticsAdapter = overrideRoot.config.providers.analytics.adapter;

  const overrideContext = {
    window: {
      SpinClash: overrideRoot,
      __spinClashProviderOverrides: {
        reward: {
          adapter: 'adsense_h5_rewarded',
          adsense: {
            enabled: true,
            h5: {
              enabled: true,
              publisherId: 'ca-pub-1234567890123456',
              dataAdClient: 'ca-pub-1234567890123456'
            }
          }
        },
        analytics: {
          adapter: 'posthog',
          enableForwarding: true,
          posthog: {
            enabled: true,
            projectApiKey: 'phc_test_key',
            scriptUrl: 'https://us-assets.i.posthog.com/static/array.js'
          }
        }
      }
    },
    console
  };
  vm.createContext(overrideContext);
  vm.runInContext(fs.readFileSync(path.join(repoRoot, 'src', 'config-providers-runtime.js'), 'utf8'), overrideContext, {
    filename: path.join(repoRoot, 'src', 'config-providers-runtime.js')
  });

  const mergedProviders = overrideRoot.config.providers || {};
  if (mergedProviders.reward.adapter !== 'adsense_h5_rewarded') {
    fail('config-providers-runtime.js failed to override reward.adapter');
  }
  if (mergedProviders.reward.adsense.enabled !== true) {
    fail('config-providers-runtime.js failed to override reward.adsense.enabled');
  }
  if (mergedProviders.reward.adsense.h5.enabled !== true) {
    fail('config-providers-runtime.js failed to override reward.adsense.h5.enabled');
  }
  if (mergedProviders.reward.adsense.h5.publisherId !== 'ca-pub-1234567890123456') {
    fail('config-providers-runtime.js failed to override reward.adsense.h5.publisherId');
  }
  if (mergedProviders.analytics.adapter !== 'posthog') {
    fail('config-providers-runtime.js failed to override analytics.adapter');
  }
  if (mergedProviders.analytics.enableForwarding !== true) {
    fail('config-providers-runtime.js failed to override analytics.enableForwarding');
  }
  if (mergedProviders.analytics.posthog.projectApiKey !== 'phc_test_key') {
    fail('config-providers-runtime.js failed to override analytics.posthog.projectApiKey');
  }
  if (mergedProviders.analytics.posthog.apiHost !== posthog.apiHost) {
    fail('config-providers-runtime.js should preserve analytics.posthog.apiHost when not overridden');
  }
  if (baseRewardPath !== '' || baseAdsenseH5PublisherId !== '' || baseAnalyticsAdapter !== 'local_buffer') {
    fail('config-providers.js defaults changed unexpectedly during override test setup');
  }

  if (failures.length) {
    console.error('Config consistency check failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('Config consistency check passed.');
}

main();
