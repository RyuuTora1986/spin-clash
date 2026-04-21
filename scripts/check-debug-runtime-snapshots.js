const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');

function loadScript(relPath, context) {
  const absPath = path.join(repoRoot, relPath);
  const code = fs.readFileSync(absPath, 'utf8');
  vm.runInContext(code, context, { filename: relPath });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const captured = {
    actions: null,
    panelInfo: null
  };

  const context = vm.createContext({
    console,
    window: {},
    document: {
      getElementById() {
        return {
          textContent: '',
          classList: {
            contains() {
              return false;
            }
          }
        };
      }
    },
    addEventListener() {},
    navigator: {},
    Blob,
    URL: {
      createObjectURL() {
        return 'blob:test';
      },
      revokeObjectURL() {}
    }
  });
  context.window = context;
  context.SpinClash = {};

  loadScript(path.join('src', 'debug-runtime-tools.js'), context);

  const save = {
    currency: 220,
    challenge: {
      unlockedNodeIndex: 6,
      checkpointNodeIndex: 3,
      unlockedRankIndex: 1,
      selectedRankIndex: 1
    },
    unlocks: {
      arenas: ['circle_bowl', 'heart_bowl', 'hex_bowl'],
      tops: ['impact', 'armor', 'trick']
    },
    research: {
      levels: {
        spin_core: 1,
        guard_frame: 2
      }
    }
  };

  const tools = context.SpinClash.createDebugRuntimeTools({
    debugService: {
      enabled: true,
      mount(infoProvider, actions) {
        captured.actions = actions;
        captured.panelInfo = infoProvider();
        return {
          render() {
            captured.panelInfo = infoProvider();
            return captured.panelInfo;
          }
        };
      }
    },
    storageService: {
      version: 3,
      isPersistent() {
        return true;
      },
      getPersistenceMode() {
        return 'local';
      },
      getDiagnostics() {
        return { ok: true };
      },
      export() {
        return JSON.stringify(save, null, 2);
      }
    },
    analyticsService: {
      track() {},
      list() {
        return [];
      },
      getAdapterInfo() {
        return {
          adapter: 'posthog',
          forwardingEnabled: true,
          ready: false,
          loading: false,
          lastForwardReason: 'posthog_unavailable',
          initialized: true,
          queuedEvents: 2
        };
      }
    },
    rewardService: {
      getMockMode() {
        return 'deny';
      },
      getAdapterInfo() {
        return {
          adapter: 'adsense_h5_rewarded',
          rewardEnabled: true,
          ready: false,
          loading: false,
          lastAvailabilityReason: 'provider_loading',
          lastRequestReason: 'provider_timeout',
          activePlacement: 'continue_once',
          allowedPlacements: ['double_reward', 'continue_once', 'trial_unlock_arena'],
          rewardedAdUnitConfigured: true
        };
      }
    },
    shareService: {},
    economy: {
      rewards: { winBase: 16, lossBase: 6, challengeWinBase: 20, challengeLossBase: 10, doubleRewardMultiplier: 2 },
      runtime: { defaultRoundTimer: 30, challengeContinueEnabled: true, challengeContinueLimit: 1 }
    },
    tops: [
      { id: 'impact', name: 'Impact', unlockCost: 0 },
      { id: 'armor', name: 'Armor', unlockCost: 0 },
      { id: 'trick', name: 'Trick', unlockCost: 90 },
      { id: 'impact_breaker', name: 'Breaker', unlockCost: 250 },
      { id: 'trick_raider', name: 'Raider', unlockCost: 320 }
    ],
    arenas: [
      { id: 'circle_bowl', label: 'CIRCLE BOWL', unlockCost: 0 },
      { id: 'hex_bowl', label: 'HEX BOWL', unlockCost: 120 }
    ],
    researchTracks: [
      {
        id: 'spin_core',
        label: 'SPIN CORE',
        levels: [
          { cost: 40, preview: '+4% MAX SPIN' }
        ]
      }
    ],
    roadRanks: [
      { id: 'rank_i', label: 'RANK I', rewardMul: 1 },
      { id: 'rank_ii', label: 'RANK II', rewardMul: 1.2 }
    ],
    challengeRoad: [
      { id: 'node-1', reward: 14, firstClearBonus: 0 }
    ],
    enemyPresets: {
      armor_standard: {
        id: 'armor_standard',
        label: 'ARMOR STANDARD',
        ai: { seekForce: 6.2 }
      }
    },
    getSave() {
      return save;
    },
    saveProgress(mutator) {
      return mutator(save);
    },
    getResearchBonuses() {
      return { hpMul: 1.05, maxSpinMul: 1.04, brateMul: 1.03 };
    },
    getUnlockedRoadRankIndex() {
      return 1;
    },
    getSelectedRoadRankIndex() {
      return 1;
    },
    getCurrentRoadRank() {
      return { id: 'rank_ii', label: 'RANK II' };
    },
    getArenaLabel(index) {
      return index === 1 ? 'HEX BOWL' : 'CIRCLE BOWL';
    },
    getCurrentChallengeNode() {
      return { id: 'node-7' };
    },
    getCurrentMode() {
      return 'challenge';
    },
    getCurrentArena() {
      return 1;
    },
    getPlayerTopId() {
      return 0;
    },
    getEnemyTopId() {
      return 1;
    },
    getCurrentEnemyPresetId() {
      return 'armor_standard';
    },
    getCurrentEnemyPresetLabel() {
      return 'ARMOR STANDARD';
    },
    getCurrentEnemyAiConfig() {
      return { seekForce: 6.2 };
    },
    getActiveChallengeIndex() {
      return 6;
    },
    getChallengeContinueUsed() {
      return false;
    },
    getActiveModifier() {
      return { id: 'grindCore' };
    },
    getScore() {
      return [2, 1];
    },
    getRound() {
      return 3;
    },
    getRoundTimer() {
      return 18;
    },
    getGameState() {
      return 'active';
    },
    getTimeScale() {
      return 1;
    },
    getTp() {
      return null;
    },
    getTe() {
      return null;
    },
    getOrbObjects() {
      return [];
    },
    getSessionTrialArenaIds() {
      return new Set(['hex_bowl']);
    },
    getHintText() {
      return 'Hint text';
    },
    getMessageText() {
      return 'Message text';
    },
    syncAfterReset() {}
  });

  assert(typeof tools.buildProgressionSnapshot === 'function', 'Expected debug runtime tools to expose buildProgressionSnapshot.');
  assert(typeof tools.buildRuntimeSnapshot === 'function', 'Expected debug runtime tools to expose buildRuntimeSnapshot.');

  const progressionSnapshot = tools.buildProgressionSnapshot();
  const runtimeSnapshot = tools.buildRuntimeSnapshot();

  assert(progressionSnapshot.currency === 220, 'Expected progression snapshot to preserve currency.');
  assert(progressionSnapshot.challengeCheckpointNodeIndex === 3, 'Expected progression snapshot to preserve checkpoint progress.');
  assert(progressionSnapshot.challengeSelectedRankLabel === 'RANK II', 'Expected progression snapshot to preserve selected rank label.');
  assert(Array.isArray(progressionSnapshot.unlockedArenas) && progressionSnapshot.unlockedArenas.includes('hex_bowl'), 'Expected progression snapshot to preserve unlocked arenas.');
  assert(runtimeSnapshot.mode === 'challenge', 'Expected runtime snapshot to preserve mode.');
  assert(runtimeSnapshot.gameState === 'active', 'Expected runtime snapshot to preserve gameState.');
  assert(runtimeSnapshot.arenaId === 'hex_bowl', 'Expected runtime snapshot to preserve arenaId.');
  assert(runtimeSnapshot.enemyPresetId === 'armor_standard', 'Expected runtime snapshot to preserve enemyPresetId.');
  assert(runtimeSnapshot.modifierId === 'grindCore', 'Expected runtime snapshot to preserve modifierId.');

  tools.initRuntimeDebug();

  assert(Array.isArray(captured.actions), 'Expected initRuntimeDebug to mount debug actions.');
  const labels = captured.actions.map((action) => action.label);
  assert(labels.includes('COPY PROGRESSION'), 'Expected debug panel to expose COPY PROGRESSION.');
  assert(labels.includes('COPY RUNTIME'), 'Expected debug panel to expose COPY RUNTIME.');
  assert(captured.panelInfo && captured.panelInfo.rewardAdapter === 'adsense_h5_rewarded', 'Expected debug panel info to preserve the H5 reward adapter id under failure conditions.');
  assert(captured.panelInfo && captured.panelInfo.rewardReady === false, 'Expected debug panel info to show the reward adapter not ready during failure-state inspection.');
  assert(captured.panelInfo && captured.panelInfo.rewardEnabled === true, 'Expected debug panel info to expose whether live reward is enabled.');
  assert(captured.panelInfo && captured.panelInfo.rewardAvailabilityReason === 'provider_loading', 'Expected debug panel info to expose reward availability failure reason.');
  assert(captured.panelInfo && captured.panelInfo.rewardRequestReason === 'provider_timeout', 'Expected debug panel info to expose reward request failure reason.');
  assert(captured.panelInfo && captured.panelInfo.rewardActivePlacement === 'continue_once', 'Expected debug panel info to expose the active reward placement during failure-state inspection.');
  assert(Array.isArray(captured.panelInfo && captured.panelInfo.rewardAllowedPlacements), 'Expected debug panel info to expose reward allowedPlacements.');
  assert(captured.panelInfo.rewardAllowedPlacements.includes('double_reward'), 'Expected debug panel info to preserve double_reward in rewardAllowedPlacements.');
  assert(captured.panelInfo.rewardAllowedPlacements.includes('continue_once'), 'Expected debug panel info to preserve continue_once in rewardAllowedPlacements.');
  assert(captured.panelInfo.rewardAllowedPlacements.includes('trial_unlock_arena'), 'Expected debug panel info to preserve trial_unlock_arena in rewardAllowedPlacements.');
  assert(captured.panelInfo && captured.panelInfo.rewardedAdUnitConfigured === true, 'Expected debug panel info to expose whether a rewarded ad unit is configured.');
  assert(captured.panelInfo && captured.panelInfo.analyticsAdapter === 'posthog', 'Expected debug panel info to preserve the configured analytics adapter during forwarding failure.');
  assert(captured.panelInfo && captured.panelInfo.analyticsForwardingEnabled === true, 'Expected debug panel info to show analytics forwarding remained enabled during failure-state inspection.');
  assert(captured.panelInfo && captured.panelInfo.analyticsForwardReason === 'posthog_unavailable', 'Expected debug panel info to expose analytics forwarding failure reason.');
  assert(captured.panelInfo && captured.panelInfo.analyticsInitialized === true, 'Expected debug panel info to preserve analytics initialization state during forwarding failure.');
  assert(captured.panelInfo && captured.panelInfo.analyticsQueuedEvents === 2, 'Expected debug panel info to expose queued analytics events during forwarding failure.');
  assert(!('projectApiKey' in captured.panelInfo), 'Expected debug panel info to avoid exposing analytics credentials.');
  assert(!('rewardedAdUnitPath' in captured.panelInfo), 'Expected debug panel info to avoid exposing reward placement config.');
  assert(!('publisherId' in captured.panelInfo), 'Expected debug panel info to avoid exposing H5 publisher config.');
  assert(labels.includes('COPY PROVIDERS'), 'Expected debug panel to expose COPY PROVIDERS.');
  const panelSnapshot = captured.actions ? tools.buildTuningSnapshot() : null;
  assert(panelSnapshot.economy.rewards.challengeWinBase === 20, 'Expected tuning snapshot to preserve challenge win base tuning.');
  assert(panelSnapshot.challengeRoad[0].reward === 14, 'Expected tuning snapshot to preserve challenge road tuning.');
  assert(panelSnapshot.research[0].levels[0].cost === 40, 'Expected tuning snapshot to preserve research tuning.');

  console.log('Debug runtime snapshot check passed.');
}

try {
  main();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
