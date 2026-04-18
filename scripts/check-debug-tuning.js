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

  const economy = {
    rewards: { winBase: 16, lossBase: 6, challengeWinBase: 20, challengeLossBase: 10, doubleRewardMultiplier: 2 },
    runtime: { defaultRoundTimer: 30, challengeContinueEnabled: true, challengeContinueLimit: 1 }
  };
  const enemyPresets = {
    armor_standard: {
      id: 'armor_standard',
      label: 'ARMOR ANCHOR',
      topId: 'armor',
      ai: { seekForce: 5.9 }
    }
  };
  const arenas = [
    { id: 'circle_bowl', label: 'CIRCLE BOWL', unlockCost: 0 },
    { id: 'hex_bowl', label: 'HEX BOWL', unlockCost: 120 }
  ];
  const tops = [
    { id: 'impact', name: 'Impact', unlockCost: 0 },
    { id: 'trick', name: 'Trick', unlockCost: 90 }
  ];
  const researchTracks = [
    {
      id: 'spin_core',
      label: 'SPIN CORE',
      levels: [
        { cost: 40, preview: '+4% MAX SPIN' }
      ]
    }
  ];
  const roadRanks = [
    { id: 'rank_i', label: 'RANK I', rewardMul: 1 },
    { id: 'rank_ii', label: 'RANK II', rewardMul: 1.2 }
  ];
  const challengeRoad = [
    { id: 'node-1', reward: 14, firstClearBonus: 0 }
  ];

  const tools = context.SpinClash.createDebugRuntimeTools({
    economy,
    enemyPresets,
    arenas,
    tops,
    researchTracks,
    roadRanks,
    challengeRoad,
    getSave() {
      return { currency: 0, challenge: { unlockedNodeIndex: 0 }, unlocks: { arenas: [], tops: [] } };
    },
    saveProgress(mutator) {
      return mutator(this.getSave ? this.getSave() : {});
    },
    getArenaLabel() {
      return 'ARENA';
    },
    getCurrentMode() {
      return 'quick';
    },
    getCurrentArena() {
      return 0;
    },
    getPlayerTopId() {
      return 0;
    },
    getEnemyTopId() {
      return 0;
    },
    getCurrentEnemyPresetId() {
      return 'armor_standard';
    },
    getCurrentEnemyPresetLabel() {
      return 'ARMOR ANCHOR';
    },
    getCurrentEnemyAiConfig() {
      return enemyPresets.armor_standard.ai;
    },
    getActiveChallengeIndex() {
      return 0;
    },
    getChallengeContinueUsed() {
      return false;
    },
    getActiveModifier() {
      return { id: 'standard' };
    },
    getScore() {
      return [0, 0];
    },
    getRound() {
      return 1;
    },
    getRoundTimer() {
      return 30;
    },
    getGameState() {
      return 'title';
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
      return new Set();
    },
    getHintText() {
      return '';
    },
    getMessageText() {
      return '';
    }
  });

  const initial = tools.buildTuningSnapshot();
  assert(initial.economy.rewards.winBase === 16, 'Expected initial tuning snapshot to include economy values.');
  assert(initial.economy.rewards.challengeWinBase === 20, 'Expected initial tuning snapshot to include challenge economy values.');
  assert(initial.enemyPresets.armor_standard.ai.seekForce === 5.9, 'Expected initial tuning snapshot to include enemy preset values.');
  assert(initial.arenas[1].unlockCost === 120, 'Expected initial tuning snapshot to include arena values.');
  assert(initial.tops[1].unlockCost === 90, 'Expected initial tuning snapshot to include top values.');
  assert(initial.research[0].levels[0].cost === 40, 'Expected initial tuning snapshot to include research values.');
  assert(initial.roadRanks[1].rewardMul === 1.2, 'Expected initial tuning snapshot to include road rank values.');
  assert(initial.challengeRoad[0].reward === 14, 'Expected initial tuning snapshot to include challenge road values.');

  tools.applyTuningPatch(JSON.stringify({
    economy: {
      rewards: { winBase: 25, challengeWinBase: 28 },
      runtime: { defaultRoundTimer: 24 }
    },
    enemyPresets: {
      armor_standard: {
        ai: { seekForce: 6.7 }
      }
    },
    arenas: [
      { id: 'circle_bowl', label: 'CIRCLE BOWL', unlockCost: 0 },
      { id: 'hex_bowl', label: 'HEX BOWL', unlockCost: 110 }
    ],
    tops: [
      { id: 'impact', name: 'Impact', unlockCost: 0 },
      { id: 'trick', name: 'Trick', unlockCost: 70 }
    ],
    research: [
      {
        id: 'spin_core',
        label: 'SPIN CORE',
        levels: [
          { cost: 35, preview: '+4% MAX SPIN' }
        ]
      }
    ],
    roadRanks: [
      { id: 'rank_i', label: 'RANK I', rewardMul: 1 },
      { id: 'rank_ii', label: 'RANK II', rewardMul: 1.35 }
    ],
    challengeRoad: [
      { id: 'node-1', reward: 28, firstClearBonus: 6 }
    ]
  }));

  assert(economy.rewards.winBase === 25, 'Expected tuning patch to update economy rewards.');
  assert(economy.rewards.challengeWinBase === 28, 'Expected tuning patch to update challenge economy rewards.');
  assert(economy.runtime.defaultRoundTimer === 24, 'Expected tuning patch to update runtime timer.');
  assert(enemyPresets.armor_standard.ai.seekForce === 6.7, 'Expected tuning patch to update enemy preset AI.');
  assert(arenas[1].unlockCost === 110, 'Expected tuning patch to replace arena tuning values.');
  assert(tops[1].unlockCost === 70, 'Expected tuning patch to replace top tuning values.');
  assert(researchTracks[0].levels[0].cost === 35, 'Expected tuning patch to replace research tuning values.');
  assert(roadRanks[1].rewardMul === 1.35, 'Expected tuning patch to replace road rank tuning values.');
  assert(challengeRoad[0].firstClearBonus === 6, 'Expected tuning patch to replace challenge road tuning values.');

  tools.resetTuning();

  assert(economy.rewards.winBase === 16, 'Expected resetTuning to restore baseline economy values.');
  assert(economy.rewards.challengeWinBase === 20, 'Expected resetTuning to restore baseline challenge economy values.');
  assert(economy.runtime.defaultRoundTimer === 30, 'Expected resetTuning to restore baseline runtime values.');
  assert(enemyPresets.armor_standard.ai.seekForce === 5.9, 'Expected resetTuning to restore baseline enemy preset values.');
  assert(arenas[1].unlockCost === 120, 'Expected resetTuning to restore baseline arena values.');
  assert(tops[1].unlockCost === 90, 'Expected resetTuning to restore baseline top values.');
  assert(researchTracks[0].levels[0].cost === 40, 'Expected resetTuning to restore baseline research values.');
  assert(roadRanks[1].rewardMul === 1.2, 'Expected resetTuning to restore baseline road rank values.');
  assert(challengeRoad[0].reward === 14, 'Expected resetTuning to restore baseline challenge road values.');

  let invalidRejected = false;
  try {
    tools.applyTuningPatch(JSON.stringify({ unsupportedRoot: true }));
  } catch (error) {
    invalidRejected = error && error.message === 'tuning_patch_empty';
  }
  assert(invalidRejected, 'Expected unsupported tuning roots to be rejected.');

  console.log('Debug tuning check passed.');
}

try {
  main();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
