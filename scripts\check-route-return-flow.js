const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const uiEntryToolsPath = path.join(repoRoot, 'src', 'ui-entry-tools.js');
const matchFlowToolsPath = path.join(repoRoot, 'src', 'match-flow-tools.js');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createClassList() {
  const classes = new Set();
  return {
    add(name) {
      classes.add(name);
    },
    remove(name) {
      classes.delete(name);
    },
    toggle(name, force) {
      if (typeof force === 'boolean') {
        if (force) classes.add(name);
        else classes.delete(name);
        return force;
      }
      if (classes.has(name)) {
        classes.delete(name);
        return false;
      }
      classes.add(name);
      return true;
    },
    contains(name) {
      return classes.has(name);
    }
  };
}

function createElement() {
  return {
    textContent: '',
    innerHTML: '',
    disabled: false,
    style: {},
    dataset: {},
    className: '',
    classList: createClassList()
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
    },
    querySelectorAll() {
      return [];
    },
    querySelector() {
      return createElement();
    }
  };
}

function loadScript(absPath, context, label) {
  const code = fs.readFileSync(absPath, 'utf8');
  vm.runInContext(code, context, { filename: label });
}

function createHarness() {
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

  loadScript(uiEntryToolsPath, context, 'src/ui-entry-tools.js');
  loadScript(matchFlowToolsPath, context, 'src/match-flow-tools.js');

  const state = {
    uiRoute: 'home',
    uiRouteFrom: 'home',
    battleReturnRoute: 'home',
    currentMode: 'quick',
    activeChallengeIndex: 0,
    score: [2, 1],
    round: 3,
    currentArena: 0,
    selectedArenaIndex: 0,
    playerTopId: 0,
    enemyTopId: 1,
    save: {
      currency: 0,
      challenge: {
        unlockedNodeIndex: 0,
        checkpointNodeIndex: 0,
        completedNodes: [],
        unlockedRankIndex: 0,
        selectedRankIndex: 0
      },
      unlocks: {
        arenas: ['circle_bowl', 'heart_bowl'],
        tops: ['impact', 'armor']
      }
    },
    beginFightCalls: 0,
    initRoundCalls: 0,
    resetMatchCalls: 0,
    lastResetOptions: null,
    updateModeCalls: 0
  };

  const loadoutOverlay = document.getElementById('ov-loadout');
  const titleOverlay = document.getElementById('ov-title');
  const matchOverlay = document.getElementById('ov-match');
  loadoutOverlay.classList.add('hide');

  const uiText = {
    nodeLocked: 'Node locked.',
    quickMode: 'QUICK BATTLE',
    challengeMode: 'CHAMPIONSHIP PATH',
    resultReturnToPath: 'RETURN TO PATH',
    resultReturnToQuick: 'RETURN TO QUICK',
    resultReturnToHome: 'RETURN HOME',
    resultAdjustPath: 'ADJUST PATH LOADOUT',
    resultAdjustQuick: 'ADJUST QUICK LOADOUT',
    resultAdjustHome: 'CHANGE TOP',
    rewardDouble: 'DOUBLE REWARD',
    rewardClaimed: 'DOUBLE CLAIMED',
    currencyLabel: 'SCRAP',
    shareCardVictory: 'VICTORY',
    shareCardDefeat: 'DEFEAT',
    resultArenaLabel: 'Arena',
    resultReasonLabel: 'Finish',
    resultBreakdownBase: 'BASE',
    resultBreakdownNode: 'NODE',
    resultBreakdownFirstClear: 'FIRST CLEAR',
    resultBreakdownRank: 'RANK BONUS',
    resultNextNodeLabel: 'Next',
    resultRetryLabel: 'Retry',
    resultRoadLabel: 'Road',
    roadClear: 'ROAD CLEAR',
    roundReasonRingOut: 'RING OUT',
    replay: 'PLAY AGAIN'
  };

  const tops = [
    { id: 'impact', name: 'Impact' },
    { id: 'armor', name: 'Armor' }
  ];

  const challengeRoad = [
    { id: 'node-1', name: 'Node 1', reward: 20, firstClearBonus: 10 },
    { id: 'node-2', name: 'Node 2', reward: 25, firstClearBonus: 0 }
  ];

  const commonOptions = {
    uiText,
    tops,
    challengeRoad,
    roadRanks: [
      { id: 'rank_i', label: 'RANK I', rewardMul: 1, enemy: {} }
    ],
    economy: {
      rewards: {
        winBase: 20,
        lossBase: 8,
        challengeWinBase: 30,
        challengeLossBase: 10,
        doubleRewardMultiplier: 2
      },
      runtime: {
        challengeContinueEnabled: true,
        challengeContinueLimit: 1
      }
    }
  };

  const matchFlowTools = context.SpinClash.createMatchFlowTools({
    ...commonOptions,
    getScore() {
      return state.score;
    },
    getRound() {
      return state.round;
    },
    setScore(next) {
      state.score = next;
    },
    setRound(next) {
      state.round = next;
    },
    getCurrentMode() {
      return state.currentMode;
    },
    getBattleReturnRoute() {
      return state.battleReturnRoute;
    },
    getActiveChallengeIndex() {
      return state.activeChallengeIndex;
    },
    setActiveChallengeIndex(next) {
      state.activeChallengeIndex = next;
    },
    getCurrentArena() {
      return state.currentArena;
    },
    getPlayerTopId() {
      return state.playerTopId;
    },
    getEnemyTopId() {
      return state.enemyTopId;
    },
    getCurrentEnemyPresetId() {
      return 'impact_blitz';
    },
    getCurrentEnemyPresetLabel() {
      return 'IMPACT BLITZ';
    },
    getActiveModifier() {
      return { id: 'standard' };
    },
    getCurrentChallengeNode() {
      return challengeRoad[state.activeChallengeIndex] || challengeRoad[0];
    },
    getArenaLabel() {
      return 'CIRCLE BOWL';
    },
    getArenaConfig() {
      return { id: 'circle_bowl', label: 'CIRCLE BOWL' };
    },
    getSave() {
      return state.save;
    },
    saveProgress(mutator) {
      state.save = mutator(state.save);
      return state.save;
    },
    getSelectedRoadRankIndex() {
      return 0;
    },
    getCurrentRoadRank() {
      return { id: 'rank_i', label: 'RANK I', rewardMul: 1, enemy: {} };
    },
    showMsg() {},
    updateCurrencyUI() {},
    updateModeUI() {
      state.updateModeCalls += 1;
      document.getElementById('btn-replay').textContent = uiText.replay;
    },
    syncDebugPanel() {},
    initRound() {
      state.initRoundCalls += 1;
    },
    getChallengeContinueUsed() {
      return false;
    },
    setChallengeContinueUsed() {},
    getRoundRewardGranted() {
      return false;
    },
    setRoundRewardGranted() {},
    getDoubleRewardUsed() {
      return false;
    },
    setDoubleRewardUsed() {},
    getLastRoundEndReason() {
      return 'ringout';
    },
    setLastRoundEndReason() {},
    getMatchStartedAt() {
      return null;
    },
    setMatchStartedAt() {}
  });

  const uiEntryTools = context.SpinClash.createUiEntryTools({
    ...commonOptions,
    getCurrentMode() {
      return state.currentMode;
    },
    setCurrentMode(next) {
      state.currentMode = next;
    },
    getUiRoute() {
      return state.uiRoute;
    },
    setUiRoute(next) {
      state.uiRoute = next;
    },
    getUiRouteFrom() {
      return state.uiRouteFrom;
    },
    setUiRouteFrom(next) {
      state.uiRouteFrom = next;
    },
    getBattleReturnRoute() {
      return state.battleReturnRoute;
    },
    setBattleReturnRoute(next) {
      state.battleReturnRoute = next;
    },
    getActiveChallengeIndex() {
      return state.activeChallengeIndex;
    },
    setActiveChallengeIndex(next) {
      state.activeChallengeIndex = next;
    },
    getCurrentArena() {
      return state.currentArena;
    },
    setCurrentArena(next) {
      state.currentArena = next;
    },
    getSelectedArenaIndex() {
      return state.selectedArenaIndex;
    },
    setSelectedArenaIndex(next) {
      state.selectedArenaIndex = next;
    },
    getPlayerTopId() {
      return state.playerTopId;
    },
    setPlayerTopId(next) {
      state.playerTopId = next;
    },
    resetScoreRound() {
      state.score = [0, 0];
      state.round = 1;
    },
    setChallengeContinueUsed() {},
    getSave() {
      return state.save;
    },
    getLoadoutOverlay() {
      return loadoutOverlay;
    },
    showLoadoutOverlay() {
      loadoutOverlay.classList.remove('hide');
    },
    hideLoadoutOverlay() {
      loadoutOverlay.classList.add('hide');
    },
    syncArenaSelectionUI() {},
    updateModeUI() {
      state.updateModeCalls += 1;
    },
    syncDebugPanel() {},
    initAudioSafely() {},
    showRuntimeError(error) {
      throw new Error(error);
    },
    updateSkillIcon() {},
    attemptArenaAccess() {
      return Promise.resolve(true);
    },
    attemptTopAccess() {
      return Promise.resolve(true);
    },
    selectRoadRank(index) {
      return index;
    },
    setLocale(locale) {
      return locale;
    },
    showMsg() {},
    beginFight() {
      state.beginFightCalls += 1;
      loadoutOverlay.classList.add('hide');
    },
    toggleWorkshop() {},
    setWorkshopOpen() {},
    attemptResearchPurchase() {
      return Promise.resolve(true);
    },
    doSwap() {},
    doPlayerDash() {},
    doPlayerSkill() {},
    resetMatch(options) {
      state.resetMatchCalls += 1;
      state.lastResetOptions = options || null;
      matchFlowTools.resetMatch(options);
    },
    handleDoubleReward() {},
    handleContinueReward() {},
    handleShare() {}
  });

  uiEntryTools.installWindowBindings();

  return {
    state,
    document,
    actions: context.__spinClashUI,
    showMatchResult() {
      matchFlowTools.showMatchResult();
    }
  };
}

async function flushAsync() {
  await Promise.resolve();
  await Promise.resolve();
}

async function checkPathResultReturn() {
  const harness = createHarness();
  harness.actions.goPath();
  assert(harness.state.uiRoute === 'path', 'Expected goPath() to enter the path route.');

  harness.actions.startFight();
  await flushAsync();
  assert(harness.state.beginFightCalls === 1, 'Expected path startFight() to begin a fight.');
  assert(harness.state.battleReturnRoute === 'path', 'Expected path fight to capture battleReturnRoute=path.');

  harness.showMatchResult();
  assert(harness.document.getElementById('btn-replay').textContent === 'RETURN TO PATH', 'Expected path result CTA to say RETURN TO PATH.');
  assert(!harness.document.getElementById('ov-match').classList.contains('hide'), 'Expected result overlay visible for path flow.');

  harness.actions.replay();
  assert(harness.state.resetMatchCalls === 1, 'Expected path replay() to reset match state once.');
  assert(harness.state.lastResetOptions && harness.state.lastResetOptions.skipInitRound === true, 'Expected path replay() to skip round re-init.');
  assert(harness.state.uiRoute === 'path', 'Expected path replay() to return to the path route.');
  assert(harness.document.getElementById('ov-match').classList.contains('hide'), 'Expected path replay() to hide the result overlay.');
  assert(!harness.document.getElementById('ov-loadout').classList.contains('hide'), 'Expected path replay() to show the shell overlay.');
}

async function checkQuickResultReturn() {
  const harness = createHarness();
  harness.actions.goQuick();
  assert(harness.state.uiRoute === 'quick', 'Expected goQuick() to enter the quick route.');

  harness.state.score = [1, 2];
  harness.actions.startFight();
  await flushAsync();
  assert(harness.state.beginFightCalls === 1, 'Expected quick startFight() to begin a fight.');
  assert(harness.state.battleReturnRoute === 'quick', 'Expected quick fight to capture battleReturnRoute=quick.');

  harness.showMatchResult();
  assert(harness.document.getElementById('btn-replay').textContent === 'RETURN TO QUICK', 'Expected quick result CTA to say RETURN TO QUICK.');
  assert(harness.document.getElementById('btn-swap-rematch').textContent === 'ADJUST QUICK LOADOUT', 'Expected quick result adjust CTA to say ADJUST QUICK LOADOUT.');

  harness.actions.replay();
  assert(harness.state.uiRoute === 'quick', 'Expected quick replay() to return to the quick route.');
  assert(harness.state.lastResetOptions && harness.state.lastResetOptions.skipInitRound === true, 'Expected quick replay() to skip round re-init.');
}

async function checkSwapRematchReturn() {
  const harness = createHarness();
  harness.actions.goQuick();
  harness.actions.startFight();
  await flushAsync();
  harness.showMatchResult();

  harness.actions.swapRematch();
  assert(harness.state.resetMatchCalls === 1, 'Expected swapRematch() to reset match state once.');
  assert(harness.state.uiRoute === 'quick', 'Expected swapRematch() to return to the quick route.');
  assert(harness.state.lastResetOptions && harness.state.lastResetOptions.skipInitRound === true, 'Expected swapRematch() to skip round re-init.');
}

async function checkHomeFallbackReturn() {
  const harness = createHarness();
  harness.state.battleReturnRoute = 'home';
  harness.showMatchResult();
  assert(harness.document.getElementById('btn-replay').textContent === 'RETURN HOME', 'Expected home fallback CTA to say RETURN HOME.');
}

async function main() {
  await checkPathResultReturn();
  await checkQuickResultReturn();
  await checkSwapRematchReturn();
  await checkHomeFallbackReturn();
  console.log('Route return flow check passed.');
}

main().catch((error) => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
