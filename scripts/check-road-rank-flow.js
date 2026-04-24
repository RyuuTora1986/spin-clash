const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');

function loadScript(relPath, context) {
  const absPath = path.join(repoRoot, relPath);
  const code = fs.readFileSync(absPath, 'utf8');
  vm.runInContext(code, context, { filename: relPath });
}

function createElement() {
  return {
    textContent: '',
    innerHTML: '',
    disabled: false,
    style: {},
    classList: {
      add() {},
      remove() {},
      contains() {
        return false;
      }
    }
  };
}

function createDocument() {
  const elements = new Map();
  return {
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, createElement());
      }
      return elements.get(id);
    }
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createBaseSave() {
  return {
    currency: 0,
    challenge: {
      unlockedNodeIndex: 9,
      checkpointNodeIndex: 5,
      completedNodes: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      lastNodeIndex: 8,
      unlockedRankIndex: 0,
      selectedRankIndex: 0,
      rankProgress: {
        0: {
          unlockedNodeIndex: 9,
          checkpointNodeIndex: 5,
          completedNodes: [0, 1, 2, 3, 4, 5, 6, 7, 8],
          lastNodeIndex: 8
        }
      }
    },
    unlocks: {
      arenas: ['circle_bowl', 'heart_bowl', 'hex_bowl'],
      tops: ['impact', 'armor']
    },
    analytics: []
  };
}

function createStorageStub(initialSave) {
  let current = JSON.parse(JSON.stringify(initialSave));
  return {
    get() {
      return current;
    },
    transact(mutator) {
      const draft = JSON.parse(JSON.stringify(current));
      current = mutator(draft) || draft;
      return current;
    }
  };
}

async function flushMicrotasks() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function setRankFinalReady(save, rankIndex) {
  save.challenge = save.challenge || {};
  save.challenge.rankProgress = save.challenge.rankProgress || {};
  save.challenge.rankProgress[rankIndex] = {
    unlockedNodeIndex: 9,
    checkpointNodeIndex: 5,
    completedNodes: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    lastNodeIndex: 8
  };
}

async function main() {
  const context = vm.createContext({
    console,
    document: createDocument(),
    window: {
      SpinClash: {
        config: {},
        services: {},
        state: {},
        debug: {}
      }
    },
    navigator: {},
    setTimeout(fn) {
      fn();
      return 1;
    },
    clearTimeout() {}
  });
  context.window.window = context.window;
  context.SpinClash = context.window.SpinClash;

  [
    'src/bootstrap-app-globals.js',
    'src/config-road-ranks.js',
    'src/progression-tools.js',
    'src/round-flow-tools.js',
    'src/match-flow-tools.js'
  ].forEach((relPath) => loadScript(relPath, context));

  const roadRanks = context.SpinClash.config.roadRanks;
  assert(Array.isArray(roadRanks) && roadRanks.length === 3, 'Expected exactly 3 road ranks.');
  assert(roadRanks[0].rewardTopId === 'trick', 'Expected Rank I to reward trick.');
  assert(roadRanks[1].rewardTopId === 'armor_bastion', 'Expected Rank II to reward armor_bastion.');
  assert(roadRanks[2].rewardTopId === 'impact_nova', 'Expected Rank III to reward impact_nova.');

  const storage = createStorageStub(createBaseSave());
  let lastActiveChallengeIndex = null;
  const progression = context.SpinClash.createProgressionTools({
    storageService: storage,
    challengeRoad: new Array(10).fill({}),
    roadRanks,
    refresh() {},
    getSessionTrialArenaIds() {
      return new Set();
    },
    setMode() {},
    setCurrentArena() {},
    setSelectedArenaIndex() {},
    setActiveChallengeIndex(index) {
      lastActiveChallengeIndex = index;
    },
    resetRuntimeFlags() {}
  });

  assert(progression.getUnlockedRoadRankIndex() === 0, 'Expected saves to start with Rank I unlocked.');
  assert(progression.getSelectedRoadRankIndex() === 0, 'Expected Rank I to be selected by default.');
  progression.setSelectedRoadRankIndex(2);
  assert(progression.getSelectedRoadRankIndex() === 0, 'Expected rank selection to clamp to unlocked ranks.');
  storage.transact((save) => {
    save.challenge.unlockedRankIndex = 1;
    return save;
  });
  progression.setSelectedRoadRankIndex(1);
  assert(progression.getSelectedRoadRankIndex() === 1, 'Expected newly unlocked rank to become selectable.');
  assert(progression.getRoadRankProgressIndex(1) === 0, 'Expected newly unlocked Rank II to start from node 1, not inherit Rank I final-node progress.');
  assert(lastActiveChallengeIndex === 0, 'Expected selecting Rank II to move the active node back to node 1.');

  const roundFlowTools = context.SpinClash.createRoundFlowTools({});
  const mergedEnemyScale = roundFlowTools.applyRankToSideConfig(
    { hpMul: 1.1, spinMul: 1.05, spdMul: 1.02, brate: 1.03 },
    roadRanks[1].enemy
  );
  assert(mergedEnemyScale.hpMul > 1.1, 'Expected rank scaling to increase enemy hp multiplier.');
  assert(mergedEnemyScale.spinMul > 1.05, 'Expected rank scaling to increase enemy spin multiplier.');

  const state = {
    score: [2, 0],
    round: 2,
    activeChallengeIndex: 9,
    currentMode: 'challenge',
    currentArena: 1,
    playerTopId: 0,
    enemyTopId: 1,
    activeModifier: { id: 'overclock' },
    lastRoundEndReason: 'spinout',
    matchStartedAt: Date.now() - 7000,
    challengeContinueUsed: false,
    roundRewardGranted: false,
    doubleRewardUsed: false,
    selectedRoadRankIndex: 0,
    save: storage.get()
  };
  state.save.challenge.unlockedRankIndex = 0;
  state.save.challenge.selectedRankIndex = 0;
  const analyticsEvents = [];

  const tools = context.SpinClash.createMatchFlowTools({
    uiText: {
      currencyLabel: 'SCRAP',
      rewardClaimed: 'DOUBLE CLAIMED',
      rewardDouble: 'DOUBLE REWARD',
      rewardDoubleFail: 'DOUBLE REWARD NOT GRANTED.',
      rewardContinueFail: 'CONTINUE NOT GRANTED.',
      rewardDeclined: 'NO REWARD WAS GRANTED.',
      rewardBusy: 'REWARD ALREADY IN PROGRESS.',
      rewardLoading: 'AD IS LOADING. TRY AGAIN.',
      rewardUnavailable: 'REWARD NOT AVAILABLE RIGHT NOW.',
      rewardError: 'REWARD FLOW FAILED.',
      replay: 'PLAY AGAIN',
      nextNode: 'NEXT NODE',
      retryNode: 'RETRY NODE',
      roadClear: 'ROAD CLEAR',
      shareResult: 'SHARE RESULT',
      unlockTopReward: 'ROAD REWARD UNLOCKED'
    },
    tops: [
      { id: 'impact', name: 'Impact' },
      { id: 'armor', name: 'Armor' },
      { id: 'trick', name: 'Trick' },
      { id: 'armor_bastion', name: 'Bastion' },
      { id: 'impact_nova', name: 'Nova' }
    ],
    challengeRoad: new Array(10).fill(null).map((_, index) => ({
      id: 'node-' + (index + 1),
      name: 'Node ' + (index + 1),
      reward: index === 9 ? 66 : 14
    })),
    roadRanks,
    economy: {
      rewards: { winBase: 16, lossBase: 6, challengeWinBase: 20, challengeLossBase: 10, doubleRewardMultiplier: 2 },
      runtime: { defaultRoundTimer: 30, challengeContinueEnabled: true, challengeContinueLimit: 1 }
    },
    rewardService: null,
    shareService: null,
    analyticsService: {
      track(name, payload) {
        analyticsEvents.push({ name, payload });
      }
    },
    getScore: () => state.score,
    getRound: () => state.round,
    setScore: (next) => { state.score = next; },
    setRound: (next) => { state.round = next; },
    getCurrentMode: () => state.currentMode,
    getActiveChallengeIndex: () => state.activeChallengeIndex,
    setActiveChallengeIndex: (next) => { state.activeChallengeIndex = next; },
    getCurrentArena: () => state.currentArena,
    getPlayerTopId: () => state.playerTopId,
    getEnemyTopId: () => state.enemyTopId,
    getCurrentEnemyPresetId: () => 'impact_blitz',
    getCurrentEnemyPresetLabel: () => 'IMPACT BLITZ',
    getActiveModifier: () => state.activeModifier,
    getCurrentChallengeNode: () => ({ id: 'node-10', name: 'Node 10', reward: 66 }),
    getArenaLabel: () => 'HEX BOWL',
    getArenaConfig: () => ({ id: 'hex_bowl', label: 'HEX BOWL' }),
    getSave: () => state.save,
    saveProgress(mutator) {
      state.save = mutator(state.save);
      return state.save;
    },
    getSelectedRoadRankIndex: () => state.selectedRoadRankIndex,
    getCurrentRoadRank: () => roadRanks[state.selectedRoadRankIndex],
    showMsg() {},
    updateCurrencyUI() {},
    updateModeUI() {},
    syncDebugPanel() {},
    initRound() {},
    getChallengeContinueUsed: () => state.challengeContinueUsed,
    setChallengeContinueUsed: (next) => { state.challengeContinueUsed = next; },
    getRoundRewardGranted: () => state.roundRewardGranted,
    setRoundRewardGranted: (next) => { state.roundRewardGranted = next; },
    getDoubleRewardUsed: () => state.doubleRewardUsed,
    setDoubleRewardUsed: (next) => { state.doubleRewardUsed = next; },
    getLastRoundEndReason: () => state.lastRoundEndReason,
    setLastRoundEndReason: (next) => { state.lastRoundEndReason = next; },
    getMatchStartedAt: () => state.matchStartedAt,
    setMatchStartedAt: (next) => { state.matchStartedAt = next; }
  });

  tools.showMatchResult();
  await flushMicrotasks();

  const rankUnlockI = analyticsEvents.find((event) => event.name === 'road_rank_unlock');
  const rankRewardUnlockI = analyticsEvents.find((event) => event.name === 'unlock_grant' && event.payload.kind === 'top');
  assert(state.save.currency === 86, 'Expected Rank I final-node reward to preserve the new championship payout baseline.');
  assert(state.save.challenge.unlockedRankIndex === 1, 'Expected clearing the final node to unlock the next road rank.');
  assert(state.save.challenge.rankProgress['0'].unlockedNodeIndex === 9, 'Expected Rank I progress to remain on the final node after Rank I clear.');
  assert(state.save.challenge.rankProgress['1'].unlockedNodeIndex === 0, 'Expected Rank II unlock to create a fresh node-1 progress entry.');
  assert(state.save.unlocks.tops.includes('trick'), 'Expected Rank I clear to unlock Trick as the reward top.');
  assert(rankUnlockI, 'Expected clearing the final node to emit road_rank_unlock analytics.');
  assert(rankRewardUnlockI, 'Expected Rank I clear to emit unlock_grant analytics for the reward top.');
  assert(rankRewardUnlockI.payload.topId === 'trick', 'Expected Rank I reward top unlock to preserve topId.');
  assert(rankRewardUnlockI.payload.source === 'challenge_road_rank', 'Expected Rank I reward top unlock to preserve rank reward source.');
  assert(rankUnlockI.payload.fromRankIndex === 0, 'Expected road_rank_unlock to preserve fromRankIndex.');
  assert(rankUnlockI.payload.fromRankId === 'rank_i', 'Expected road_rank_unlock to preserve fromRankId.');
  assert(rankUnlockI.payload.toRankIndex === 1, 'Expected road_rank_unlock to preserve toRankIndex.');
  assert(rankUnlockI.payload.toRankId === 'rank_ii', 'Expected road_rank_unlock to preserve toRankId.');
  assert(rankUnlockI.payload.challengeNode === 9, 'Expected road_rank_unlock to preserve challengeNode.');

  state.selectedRoadRankIndex = 1;
  state.activeChallengeIndex = 9;
  state.roundRewardGranted = false;
  state.save.currency = 0;
  state.save.challenge.unlockedRankIndex = 1;
  setRankFinalReady(state.save, 1);
  state.save.unlocks.tops = ['impact', 'armor', 'trick'];
  analyticsEvents.length = 0;
  tools.showMatchResult();
  await flushMicrotasks();

  const rankUnlockII = analyticsEvents.find((event) => event.name === 'road_rank_unlock');
  const rankRewardUnlockII = analyticsEvents.find((event) => event.name === 'unlock_grant' && event.payload.kind === 'top');
  assert(state.save.currency === 103, 'Expected Rank II multiplier to apply the new measured championship bonus.');
  assert(state.save.challenge.unlockedRankIndex === 2, 'Expected clearing the final node on Rank II to unlock Rank III.');
  assert(state.save.challenge.rankProgress['2'].unlockedNodeIndex === 0, 'Expected Rank III unlock to create a fresh node-1 progress entry.');
  assert(state.save.unlocks.tops.includes('armor_bastion'), 'Expected Rank II clear to unlock Bastion as the reward top.');
  assert(rankUnlockII, 'Expected clearing the final node on Rank II to emit road_rank_unlock analytics.');
  assert(rankRewardUnlockII, 'Expected Rank II clear to emit unlock_grant analytics for the reward top.');
  assert(rankRewardUnlockII.payload.topId === 'armor_bastion', 'Expected Rank II reward top unlock to preserve topId.');
  assert(rankUnlockII.payload.fromRankIndex === 1, 'Expected Rank II road_rank_unlock to preserve fromRankIndex.');
  assert(rankUnlockII.payload.fromRankId === 'rank_ii', 'Expected Rank II road_rank_unlock to preserve fromRankId.');
  assert(rankUnlockII.payload.toRankIndex === 2, 'Expected Rank II road_rank_unlock to preserve toRankIndex.');
  assert(rankUnlockII.payload.toRankId === 'rank_iii', 'Expected Rank II road_rank_unlock to preserve toRankId.');

  state.selectedRoadRankIndex = 2;
  state.activeChallengeIndex = 9;
  state.roundRewardGranted = false;
  state.save.currency = 0;
  state.save.challenge.unlockedRankIndex = 2;
  setRankFinalReady(state.save, 2);
  state.save.unlocks.tops = ['impact', 'armor', 'trick', 'armor_bastion'];
  analyticsEvents.length = 0;
  tools.showMatchResult();
  await flushMicrotasks();

  const rankUnlockIII = analyticsEvents.find((event) => event.name === 'road_rank_unlock');
  const rankRewardUnlockIII = analyticsEvents.find((event) => event.name === 'unlock_grant' && event.payload.kind === 'top');
  assert(state.save.currency === 119, 'Expected Rank III multiplier to apply the final championship bonus.');
  assert(state.save.challenge.unlockedRankIndex === 2, 'Expected Rank III clear to stay capped at Rank III unlock state.');
  assert(state.save.unlocks.tops.includes('impact_nova'), 'Expected Rank III clear to unlock Nova as the reward top.');
  assert(!rankUnlockIII, 'Expected Rank III clear not to emit a further road_rank_unlock event.');
  assert(rankRewardUnlockIII, 'Expected Rank III clear to emit unlock_grant analytics for the reward top.');
  assert(rankRewardUnlockIII.payload.topId === 'impact_nova', 'Expected Rank III reward top unlock to preserve topId.');

  console.log('Road rank flow check passed.');
}

main().catch((error) => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
