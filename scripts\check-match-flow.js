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

async function flushMicrotasks() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function testChallengeResultSnapshotAndShareMoment() {
  const document = createDocument();
  const context = vm.createContext({
    console,
    document,
    window: {},
    navigator: {},
    setTimeout(fn) {
      fn();
      return 1;
    },
    clearTimeout() {}
  });
  context.window = context;
  context.SpinClash = {};

  loadScript(path.join('src', 'match-flow-tools.js'), context);

  const tops = [
    { id: 'impact', name: 'Impact' },
    { id: 'armor', name: 'Armor' }
  ];
  const challengeRoad = [
    {
      id: 'node-1',
      name: 'Qualifier',
      chapterId: 'qualifier',
      chapterLabel: 'QUALIFIER',
      tier: 'normal',
      checkpointOnClear: false,
      reward: 20,
      firstClearBonus: 0
    },
    {
      id: 'node-2',
      name: 'Counter Spin',
      chapterId: 'championship',
      chapterLabel: 'CHAMPIONSHIP',
      tier: 'final',
      checkpointOnClear: false,
      reward: 50,
      firstClearBonus: 0
    }
  ];
  const arenas = [
    { id: 'circle_bowl', label: 'CIRCLE BOWL' },
    { id: 'hex_bowl', label: 'HEX BOWL' }
  ];
  const state = {
    score: [2, 0],
    round: 2,
    activeChallengeIndex: 0,
    currentMode: 'challenge',
    currentArena: 1,
    playerTopId: 0,
    enemyTopId: 1,
    activeModifier: { id: 'ironwall' },
    lastRoundEndReason: 'ringout',
    matchStartedAt: Date.now() - 9000,
    challengeContinueUsed: false,
    roundRewardGranted: false,
    doubleRewardUsed: false,
    save: {
      currency: 0,
      challenge: { unlockedNodeIndex: 0, completedNodes: [] },
      unlocks: { arenas: [], tops: [] }
    }
  };
  const sharePayloads = [];
  const rewardRequests = [];
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
      sharePrefix: 'Spin Clash result',
      unlockTopReward: 'ROAD REWARD UNLOCKED'
    },
    tops,
    challengeRoad,
    economy: {
      rewards: { winBase: 16, lossBase: 6, challengeWinBase: 24, challengeLossBase: 11, doubleRewardMultiplier: 2 },
      runtime: { defaultRoundTimer: 30, challengeContinueEnabled: true, challengeContinueLimit: 1 }
    },
    rewardService: {
      request(placement, payload) {
        rewardRequests.push({ placement, payload });
        return Promise.resolve({ granted: true });
      },
      wasGranted(result) {
        return !!(result && result.granted);
      },
      getFailureInfo() {
        return { category: 'error' };
      }
    },
    shareService: {
      share(payload) {
        sharePayloads.push(payload);
        return Promise.resolve();
      }
    },
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
    getCurrentEnemyPresetId: () => 'armor_standard',
    getCurrentEnemyPresetLabel: () => 'ARMOR STANDARD',
    getActiveModifier: () => state.activeModifier,
    getCurrentChallengeNode: () => challengeRoad[state.activeChallengeIndex],
    getArenaLabel: (index) => arenas[index].label,
    getArenaConfig: (index) => arenas[index],
    getSave: () => state.save,
    saveProgress(mutator) {
      state.save = mutator(state.save);
      return state.save;
    },
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
  const matchEndEvent = analyticsEvents.find((event) => event.name === 'match_end');
  const challengeClearEvent = analyticsEvents.find((event) => event.name === 'challenge_clear');
  assert(state.activeChallengeIndex === 1, 'Expected Challenge Road win to advance to the next node.');
  assert(state.save.currency === 44, 'Expected initial result payout to use the cleared challenge-specific base reward.');
  assert(matchEndEvent, 'Expected match_end analytics to fire.');
  assert(matchEndEvent.payload.enemyPresetId === 'armor_standard', 'Expected match_end to preserve enemyPresetId.');
  assert(matchEndEvent.payload.enemyPresetLabel === 'ARMOR STANDARD', 'Expected match_end to preserve enemyPresetLabel.');
  assert(matchEndEvent.payload.chapterId === 'qualifier', 'Expected match_end to preserve chapterId.');
  assert(matchEndEvent.payload.chapterLabel === 'QUALIFIER', 'Expected match_end to preserve chapterLabel.');
  assert(matchEndEvent.payload.tier === 'normal', 'Expected match_end to preserve node tier.');
  assert(challengeClearEvent, 'Expected challenge_clear analytics to fire.');
  assert(challengeClearEvent.payload.chapterId === 'qualifier', 'Expected challenge_clear to preserve chapterId.');
  assert(challengeClearEvent.payload.tier === 'normal', 'Expected challenge_clear to preserve node tier.');
  assert(challengeClearEvent.payload.checkpointReached === false, 'Expected non-checkpoint clear to preserve checkpointReached false.');
  assert(challengeClearEvent.payload.firstClear === true, 'Expected first clear to preserve firstClear true.');
  assert(challengeClearEvent.payload.rewardBase === 24, 'Expected challenge_clear to preserve challenge-specific rewardBase.');
  assert(challengeClearEvent.payload.rewardNode === 20, 'Expected challenge_clear to preserve rewardNode.');
  assert(challengeClearEvent.payload.rewardFirstClearBonus === 0, 'Expected challenge_clear to preserve rewardFirstClearBonus.');
  assert(challengeClearEvent.payload.rewardRankBonus === 0, 'Expected challenge_clear to preserve rewardRankBonus.');

  tools.handleDoubleReward();
  await flushMicrotasks();

  assert(rewardRequests.length === 1, 'Expected a double reward request after clicking the result CTA.');
  assert(rewardRequests[0].payload.challengeNode === 0, 'Expected double reward placement to preserve the cleared node index.');
  assert(state.save.currency === 88, 'Expected double reward bonus to use the cleared challenge-specific reward, not the next node.');

  tools.handleShare();
  await flushMicrotasks();

  assert(sharePayloads.length === 1, 'Expected one share payload.');
  assert(sharePayloads[0].challengeNode === 0, 'Expected share payload to preserve the cleared node index.');
  assert(sharePayloads[0].moment === 'ring_out', 'Expected ring-out win to classify as ring_out share moment.');
  assert(sharePayloads[0].enemyPreset === 'armor_standard', 'Expected share payload to preserve enemyPreset.');
  assert(sharePayloads[0].enemyPresetLabel === 'ARMOR STANDARD', 'Expected share payload to preserve enemyPresetLabel.');
}

async function testChallengeClearUnlockGrantAnalytics() {
  const document = createDocument();
  const context = vm.createContext({
    console,
    document,
    window: {},
    navigator: {},
    setTimeout(fn) {
      fn();
      return 1;
    },
    clearTimeout() {}
  });
  context.window = context;
  context.SpinClash = {};

  loadScript(path.join('src', 'match-flow-tools.js'), context);

  const tops = [
    { id: 'impact', name: 'Impact' },
    { id: 'armor', name: 'Armor' },
    { id: 'trick', name: 'Trick' }
  ];
  const challengeRoad = [
    {
      id: 'node-5',
      name: 'Tight Clock',
      chapterId: 'arena_circuit',
      chapterLabel: 'ARENA CIRCUIT',
      tier: 'boss',
      reward: 40,
      unlockTopId: 'trick',
      checkpointOnClear: true,
      firstClearBonus: 10
    },
    {
      id: 'node-6',
      name: 'Final Bowl',
      chapterId: 'championship',
      chapterLabel: 'CHAMPIONSHIP',
      tier: 'final',
      reward: 50
    }
  ];
  const arenas = [
    { id: 'circle_bowl', label: 'CIRCLE BOWL' },
    { id: 'hex_bowl', label: 'HEX BOWL' }
  ];
  const state = {
    score: [2, 0],
    round: 2,
    activeChallengeIndex: 0,
    currentMode: 'challenge',
    currentArena: 1,
    playerTopId: 0,
    enemyTopId: 1,
    activeModifier: { id: 'suddenDeath' },
    lastRoundEndReason: 'spinout',
    matchStartedAt: Date.now() - 6000,
    challengeContinueUsed: false,
    roundRewardGranted: false,
    doubleRewardUsed: false,
    save: {
      currency: 0,
      challenge: { unlockedNodeIndex: 0, checkpointNodeIndex: 0, completedNodes: [] },
      unlocks: { arenas: ['circle_bowl'], tops: ['impact', 'armor'] }
    }
  };
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
      sharePrefix: 'Spin Clash result',
      unlockTopReward: 'ROAD REWARD UNLOCKED'
    },
    tops,
    challengeRoad,
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
    getCurrentEnemyPresetId: () => 'armor_standard',
    getCurrentEnemyPresetLabel: () => 'ARMOR STANDARD',
    getActiveModifier: () => state.activeModifier,
    getCurrentChallengeNode: () => challengeRoad[state.activeChallengeIndex],
    getArenaLabel: (index) => arenas[index].label,
    getArenaConfig: (index) => arenas[index],
    getSave: () => state.save,
    saveProgress(mutator) {
      state.save = mutator(state.save);
      return state.save;
    },
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

  const unlockEvents = analyticsEvents.filter((event) => event.name === 'unlock_grant');
  const arenaUnlock = unlockEvents.find((event) => event.payload.kind === 'arena');
  const topUnlock = unlockEvents.find((event) => event.payload.kind === 'top');
  const challengeClearEvent = analyticsEvents.find((event) => event.name === 'challenge_clear');
  const checkpointEvent = analyticsEvents.find((event) => event.name === 'championship_checkpoint');

  assert(state.save.unlocks.arenas.includes('hex_bowl'), 'Expected challenge clear to permanently unlock the cleared arena.');
  assert(state.save.unlocks.tops.includes('trick'), 'Expected challenge clear to permanently unlock the configured reward top.');
  assert(arenaUnlock, 'Expected challenge clear to emit unlock_grant for the newly cleared arena.');
  assert(topUnlock, 'Expected challenge clear to emit unlock_grant for the newly unlocked top.');
  assert(arenaUnlock.payload.grantType === 'challenge_clear', 'Expected arena unlock_grant to preserve challenge_clear grantType.');
  assert(arenaUnlock.payload.source === 'challenge_road', 'Expected arena unlock_grant to preserve source challenge_road.');
  assert(arenaUnlock.payload.mode === 'challenge', 'Expected arena unlock_grant to preserve mode challenge.');
  assert(arenaUnlock.payload.arenaId === 'hex_bowl', 'Expected arena unlock_grant to preserve the cleared arena id.');
  assert(arenaUnlock.payload.nodeIndex === 0, 'Expected arena unlock_grant to preserve the cleared node index.');
  assert(arenaUnlock.payload.nodeId === 'node-5', 'Expected arena unlock_grant to preserve the cleared node id.');
  assert(topUnlock.payload.grantType === 'challenge_clear', 'Expected top unlock_grant to preserve challenge_clear grantType.');
  assert(topUnlock.payload.source === 'challenge_road', 'Expected top unlock_grant to preserve source challenge_road.');
  assert(topUnlock.payload.mode === 'challenge', 'Expected top unlock_grant to preserve mode challenge.');
  assert(topUnlock.payload.topId === 'trick', 'Expected top unlock_grant to preserve topId.');
  assert(topUnlock.payload.topLabel === 'Trick', 'Expected top unlock_grant to preserve topLabel.');
  assert(topUnlock.payload.nodeIndex === 0, 'Expected top unlock_grant to preserve the cleared node index.');
  assert(topUnlock.payload.nodeId === 'node-5', 'Expected top unlock_grant to preserve the cleared node id.');
  assert(state.save.challenge.checkpointNodeIndex === 1, 'Expected checkpoint node clear to advance checkpointNodeIndex to the next node.');
  assert(challengeClearEvent, 'Expected checkpoint clear to emit challenge_clear analytics.');
  assert(challengeClearEvent.payload.chapterId === 'arena_circuit', 'Expected checkpoint clear to preserve chapterId.');
  assert(challengeClearEvent.payload.chapterLabel === 'ARENA CIRCUIT', 'Expected checkpoint clear to preserve chapterLabel.');
  assert(challengeClearEvent.payload.tier === 'boss', 'Expected checkpoint clear to preserve tier.');
  assert(challengeClearEvent.payload.checkpointReached === true, 'Expected checkpoint clear to preserve checkpointReached true.');
  assert(challengeClearEvent.payload.resumeNodeIndex === 1, 'Expected checkpoint clear to preserve resumeNodeIndex.');
  assert(challengeClearEvent.payload.firstClear === true, 'Expected checkpoint clear to preserve firstClear true.');
  assert(challengeClearEvent.payload.rewardFirstClearBonus === 10, 'Expected checkpoint clear to preserve rewardFirstClearBonus.');
  assert(challengeClearEvent.payload.rewardRankBonus === 0, 'Expected checkpoint clear to preserve rewardRankBonus.');
  assert(checkpointEvent, 'Expected checkpoint node clear to emit championship_checkpoint analytics.');
  assert(checkpointEvent.payload.nodeIndex === 0, 'Expected championship_checkpoint to preserve nodeIndex.');
  assert(checkpointEvent.payload.nodeId === 'node-5', 'Expected championship_checkpoint to preserve nodeId.');
  assert(checkpointEvent.payload.chapterId === 'arena_circuit', 'Expected championship_checkpoint to preserve chapterId.');
  assert(checkpointEvent.payload.resumeNodeIndex === 1, 'Expected championship_checkpoint to preserve resumeNodeIndex.');
}

async function testQuickModeKeepsQuickRewardBase() {
  const document = createDocument();
  const context = vm.createContext({
    console,
    document,
    window: {},
    navigator: {},
    setTimeout(fn) {
      fn();
      return 1;
    },
    clearTimeout() {}
  });
  context.window = context;
  context.SpinClash = {};

  loadScript(path.join('src', 'match-flow-tools.js'), context);

  const state = {
    score: [2, 1],
    round: 3,
    currentMode: 'quick',
    currentArena: 0,
    playerTopId: 0,
    enemyTopId: 1,
    activeModifier: { id: 'standard' },
    lastRoundEndReason: 'spinout',
    matchStartedAt: Date.now() - 5000,
    challengeContinueUsed: false,
    roundRewardGranted: false,
    doubleRewardUsed: false,
    save: {
      currency: 0,
      challenge: { unlockedNodeIndex: 0, completedNodes: [] },
      unlocks: { arenas: [], tops: [] }
    }
  };

  const tools = context.SpinClash.createMatchFlowTools({
    uiText: {
      currencyLabel: 'SCRAP',
      rewardClaimed: 'DOUBLE CLAIMED',
      rewardDouble: 'DOUBLE REWARD',
      replay: 'PLAY AGAIN',
      shareResult: 'SHARE RESULT'
    },
    tops: [
      { id: 'impact', name: 'Impact' },
      { id: 'armor', name: 'Armor' }
    ],
    challengeRoad: [],
    economy: {
      rewards: { winBase: 16, lossBase: 6, challengeWinBase: 20, challengeLossBase: 10, doubleRewardMultiplier: 2 },
      runtime: { defaultRoundTimer: 30, challengeContinueEnabled: true, challengeContinueLimit: 1 }
    },
    rewardService: null,
    shareService: null,
    analyticsService: null,
    getScore: () => state.score,
    getRound: () => state.round,
    setScore: (next) => { state.score = next; },
    setRound: (next) => { state.round = next; },
    getCurrentMode: () => state.currentMode,
    getActiveChallengeIndex: () => 0,
    setActiveChallengeIndex() {},
    getCurrentArena: () => state.currentArena,
    getPlayerTopId: () => state.playerTopId,
    getEnemyTopId: () => state.enemyTopId,
    getCurrentEnemyPresetId: () => null,
    getCurrentEnemyPresetLabel: () => null,
    getActiveModifier: () => state.activeModifier,
    getCurrentChallengeNode: () => null,
    getArenaLabel: () => 'CIRCLE BOWL',
    getArenaConfig: () => ({ id: 'circle_bowl', label: 'CIRCLE BOWL' }),
    getSave: () => state.save,
    saveProgress(mutator) {
      state.save = mutator(state.save);
      return state.save;
    },
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
  assert(state.save.currency === 16, 'Expected quick mode wins to keep the lower quick reward base.');
}

async function main() {
  await testChallengeResultSnapshotAndShareMoment();
  await testChallengeClearUnlockGrantAnalytics();
  await testQuickModeKeepsQuickRewardBase();
  console.log('Match flow check passed.');
}

main().catch((error) => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
