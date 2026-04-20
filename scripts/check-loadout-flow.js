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

function createContext() {
  const context = vm.createContext({
    console,
    window: {},
    document: {
      getElementById() {
        return null;
      },
      querySelectorAll() {
        return [];
      }
    }
  });
  context.window = context;
  context.SpinClash = {};
  return context;
}

function createUiText() {
  return {
    currencyLabel: 'SCRAP',
    unlockArena: 'UNLOCKED',
    unlockTop: 'TOP UNLOCKED',
    trialArena: 'TRIAL ACTIVE',
    rewardError: 'REWARD FLOW FAILED.',
    rewardBusy: 'REWARD ALREADY IN PROGRESS.',
    rewardLoading: 'AD IS LOADING. TRY AGAIN.',
    rewardUnavailable: 'REWARD NOT AVAILABLE RIGHT NOW.',
    rewardTrialFail: 'TRIAL NOT GRANTED.',
    lockedTop: 'LOCKED'
  };
}

function createContent() {
  return {
    tops: [
      { id: 'impact', name: 'Impact', unlockCost: 0, unlockSource: 'starter' },
      { id: 'armor', name: 'Armor', unlockCost: 0, unlockSource: 'starter' },
      { id: 'trick', name: 'Trick', unlockCost: 0, unlockSource: 'road' },
      { id: 'breaker', name: 'Breaker', unlockCost: 80, unlockSource: 'shop' }
    ],
    arenas: [
      { id: 'circle_bowl', label: 'CIRCLE BOWL', unlockCost: 0 },
      { id: 'heart_bowl', label: 'HEART BOWL', unlockCost: 0 },
      { id: 'hex_bowl', label: 'HEX BOWL', unlockCost: 120 }
    ]
  };
}

function createSave(currency) {
  return {
    currency,
    unlocks: {
      arenas: ['circle_bowl', 'heart_bowl'],
      tops: ['impact', 'armor']
    },
    challenge: {
      unlockedNodeIndex: 0
    }
  };
}

function instantiateTools(options) {
  const context = createContext();
  loadScript(path.join('src', 'loadout-ui-tools.js'), context);
  return context.SpinClash.createLoadoutUiTools(options);
}

async function testArenaPurchaseAnalytics() {
  const { tops, arenas } = createContent();
  const save = createSave(150);
  const analyticsEvents = [];
  const messages = [];
  const currentArenaCalls = [];
  const rootState = {};
  let refreshCount = 0;

  const tools = instantiateTools({
    uiText: createUiText(),
    tops,
    arenas,
    getSave() {
      return save;
    },
    saveProgress(mutator) {
      return mutator(save);
    },
    getCurrentMode() {
      return 'quick';
    },
    getActiveChallengeIndex() {
      return 0;
    },
    getSelectedArenaIndex() {
      return 2;
    },
    getPlayerTopId() {
      return 0;
    },
    getSessionTrialArenaIds() {
      return new Set();
    },
    state: rootState,
    analyticsService: {
      track(name, payload) {
        analyticsEvents.push({ name, payload });
      }
    },
    setCurrentArena(index) {
      currentArenaCalls.push(index);
    },
    rewardService: null,
    showMsg(text) {
      messages.push(text);
    },
    refresh() {
      refreshCount += 1;
    }
  });

  const granted = await tools.attemptArenaAccess(2);
  const unlockGrant = analyticsEvents.find((event) => event.name === 'unlock_grant');
  const unlockPurchase = analyticsEvents.find((event) => event.name === 'unlock_purchase');

  assert(granted === true, 'Expected arena purchase flow to resolve true.');
  assert(save.currency === 30, 'Expected arena purchase to deduct unlock cost from SCRAP.');
  assert(save.unlocks.arenas.includes('hex_bowl'), 'Expected arena purchase to persist the unlocked arena.');
  assert(currentArenaCalls.length === 1 && currentArenaCalls[0] === 2, 'Expected arena purchase to set the selected arena as active.');
  assert(rootState.currentArenaIndex === 2, 'Expected arena purchase to sync currentArenaIndex onto the shared root state.');
  assert(rootState.currentArenaId === 'hex_bowl', 'Expected arena purchase to sync currentArenaId onto the shared root state.');
  assert(refreshCount === 1, 'Expected arena purchase flow to trigger one refresh.');
  assert(messages.length === 1 && messages[0].indexOf('HEX BOWL') >= 0, 'Expected arena purchase flow to show an unlock message.');
  assert(unlockGrant, 'Expected arena purchase to emit unlock_grant analytics.');
  assert(unlockPurchase, 'Expected arena purchase to emit unlock_purchase analytics.');
  assert(unlockGrant.payload.kind === 'arena', 'Expected arena purchase unlock_grant to classify kind as arena.');
  assert(unlockGrant.payload.grantType === 'purchase', 'Expected arena purchase unlock_grant to preserve grantType purchase.');
  assert(unlockGrant.payload.source === 'quick_battle_shop', 'Expected arena purchase unlock_grant to preserve source.');
  assert(unlockGrant.payload.mode === 'quick', 'Expected arena purchase unlock_grant to preserve mode.');
  assert(unlockGrant.payload.arenaId === 'hex_bowl', 'Expected arena purchase unlock_grant to preserve arenaId.');
  assert(unlockGrant.payload.cost === 120, 'Expected arena purchase unlock_grant to preserve cost.');
  assert(unlockGrant.payload.currencyBefore === 150, 'Expected arena purchase unlock_grant to preserve currencyBefore.');
  assert(unlockGrant.payload.currencyAfter === 30, 'Expected arena purchase unlock_grant to preserve currencyAfter.');
  assert(unlockPurchase.payload.kind === 'arena', 'Expected arena purchase unlock_purchase to classify kind as arena.');
  assert(unlockPurchase.payload.arenaId === 'hex_bowl', 'Expected arena purchase unlock_purchase to preserve arenaId.');
  assert(unlockPurchase.payload.currencyAfter === 30, 'Expected arena purchase unlock_purchase to preserve currencyAfter.');
}

async function testArenaTrialAnalytics() {
  const { tops, arenas } = createContent();
  const save = createSave(10);
  const analyticsEvents = [];
  const sessionTrialArenaIds = new Set();
  const currentArenaCalls = [];
  const rootState = {};
  let rewardRequests = 0;

  const tools = instantiateTools({
    uiText: createUiText(),
    tops,
    arenas,
    getSave() {
      return save;
    },
    saveProgress(mutator) {
      return mutator(save);
    },
    getCurrentMode() {
      return 'quick';
    },
    getActiveChallengeIndex() {
      return 0;
    },
    getSelectedArenaIndex() {
      return 2;
    },
    getPlayerTopId() {
      return 0;
    },
    getSessionTrialArenaIds() {
      return sessionTrialArenaIds;
    },
    state: rootState,
    analyticsService: {
      track(name, payload) {
        analyticsEvents.push({ name, payload });
      }
    },
    setCurrentArena(index) {
      currentArenaCalls.push(index);
    },
    rewardService: {
      request(placement, payload) {
        rewardRequests += 1;
        assert(placement === 'trial_unlock_arena', 'Expected arena trial flow to use the trial_unlock_arena placement.');
        assert(payload.arenaId === 'hex_bowl', 'Expected arena trial request payload to preserve arenaId.');
        return Promise.resolve({ granted: true });
      },
      wasGranted(result) {
        return !!(result && result.granted);
      },
      getFailureInfo() {
        return { category: 'error' };
      }
    },
    showMsg() {},
    refresh() {}
  });

  const granted = await tools.attemptArenaAccess(2);
  const trialStart = analyticsEvents.find((event) => event.name === 'trial_unlock_start');
  const trialComplete = analyticsEvents.find((event) => event.name === 'trial_unlock_complete');

  assert(granted === true, 'Expected arena trial flow to resolve true when the mock reward grants access.');
  assert(rewardRequests === 1, 'Expected arena trial flow to issue one reward request.');
  assert(sessionTrialArenaIds.has('hex_bowl'), 'Expected granted arena trial to mark the arena as trial-unlocked for the session.');
  assert(currentArenaCalls.length === 1 && currentArenaCalls[0] === 2, 'Expected granted arena trial to activate the requested arena.');
  assert(rootState.currentArenaIndex === 2, 'Expected granted arena trial to sync currentArenaIndex onto the shared root state.');
  assert(rootState.currentArenaId === 'hex_bowl', 'Expected granted arena trial to sync currentArenaId onto the shared root state.');
  assert(trialStart, 'Expected arena trial flow to emit trial_unlock_start analytics.');
  assert(trialComplete, 'Expected arena trial flow to emit trial_unlock_complete analytics.');
  assert(trialStart.payload.kind === 'arena', 'Expected trial_unlock_start to classify kind as arena.');
  assert(trialStart.payload.mode === 'quick', 'Expected trial_unlock_start to preserve mode.');
  assert(trialStart.payload.arenaId === 'hex_bowl', 'Expected trial_unlock_start to preserve arenaId.');
  assert(trialComplete.payload.kind === 'arena', 'Expected trial_unlock_complete to classify kind as arena.');
  assert(trialComplete.payload.mode === 'quick', 'Expected trial_unlock_complete to preserve mode.');
  assert(trialComplete.payload.arenaId === 'hex_bowl', 'Expected trial_unlock_complete to preserve arenaId.');
}

async function testTopPurchaseAnalytics() {
  const { tops, arenas } = createContent();
  const save = createSave(100);
  const analyticsEvents = [];
  const messages = [];
  let refreshCount = 0;

  const tools = instantiateTools({
    uiText: createUiText(),
    tops,
    arenas,
    getSave() {
      return save;
    },
    saveProgress(mutator) {
      return mutator(save);
    },
    getCurrentMode() {
      return 'quick';
    },
    getActiveChallengeIndex() {
      return 0;
    },
    getSelectedArenaIndex() {
      return 0;
    },
    getPlayerTopId() {
      return 0;
    },
    getSessionTrialArenaIds() {
      return new Set();
    },
    analyticsService: {
      track(name, payload) {
        analyticsEvents.push({ name, payload });
      }
    },
    setCurrentArena() {},
    rewardService: null,
    showMsg(text) {
      messages.push(text);
    },
    refresh() {
      refreshCount += 1;
    }
  });

  const granted = await tools.attemptTopAccess(3);
  const unlockGrant = analyticsEvents.find((event) => event.name === 'unlock_grant');
  const unlockPurchase = analyticsEvents.find((event) => event.name === 'unlock_purchase');

  assert(granted === true, 'Expected top purchase flow to resolve true.');
  assert(save.currency === 20, 'Expected top purchase to deduct unlock cost from SCRAP.');
  assert(save.unlocks.tops.includes('breaker'), 'Expected top purchase to persist the unlocked top.');
  assert(refreshCount === 1, 'Expected top purchase flow to trigger one refresh.');
  assert(messages.length === 1 && messages[0].indexOf('Breaker') >= 0, 'Expected top purchase flow to show an unlock message.');
  assert(unlockGrant, 'Expected top purchase to emit unlock_grant analytics.');
  assert(unlockPurchase, 'Expected top purchase to emit unlock_purchase analytics.');
  assert(unlockGrant.payload.kind === 'top', 'Expected top purchase unlock_grant to classify kind as top.');
  assert(unlockGrant.payload.grantType === 'purchase', 'Expected top purchase unlock_grant to preserve grantType purchase.');
  assert(unlockGrant.payload.source === 'loadout_shop', 'Expected top purchase unlock_grant to preserve source.');
  assert(unlockGrant.payload.mode === 'quick', 'Expected top purchase unlock_grant to preserve mode.');
  assert(unlockGrant.payload.topId === 'breaker', 'Expected top purchase unlock_grant to preserve topId.');
  assert(unlockGrant.payload.topLabel === 'Breaker', 'Expected top purchase unlock_grant to preserve topLabel.');
  assert(unlockGrant.payload.currencyBefore === 100, 'Expected top purchase unlock_grant to preserve currencyBefore.');
  assert(unlockGrant.payload.currencyAfter === 20, 'Expected top purchase unlock_grant to preserve currencyAfter.');
  assert(unlockPurchase.payload.kind === 'top', 'Expected top purchase unlock_purchase to classify kind as top.');
  assert(unlockPurchase.payload.topId === 'breaker', 'Expected top purchase unlock_purchase to preserve topId.');
  assert(unlockPurchase.payload.currencyAfter === 20, 'Expected top purchase unlock_purchase to preserve currencyAfter.');
}

async function testRoadRewardTopCannotBePurchased() {
  const { tops, arenas } = createContent();
  const save = createSave(100);
  const analyticsEvents = [];
  const messages = [];
  let refreshCount = 0;

  const tools = instantiateTools({
    uiText: createUiText(),
    tops,
    arenas,
    getSave() {
      return save;
    },
    saveProgress(mutator) {
      return mutator(save);
    },
    getCurrentMode() {
      return 'challenge';
    },
    getActiveChallengeIndex() {
      return 0;
    },
    getSelectedArenaIndex() {
      return 0;
    },
    getPlayerTopId() {
      return 0;
    },
    getSessionTrialArenaIds() {
      return new Set();
    },
    analyticsService: {
      track(name, payload) {
        analyticsEvents.push({ name, payload });
      }
    },
    setCurrentArena() {},
    rewardService: null,
    showMsg(text) {
      messages.push(text);
    },
    refresh() {
      refreshCount += 1;
    }
  });

  assert(tools.isTopUnlocked(2) === false, 'Expected road reward top with zero price to stay locked before grant.');
  const granted = await tools.attemptTopAccess(2);
  assert(granted === false, 'Expected road reward top purchase flow to refuse direct purchase.');
  assert(save.currency === 100, 'Expected road reward top refusal not to spend SCRAP.');
  assert(!save.unlocks.tops.includes('trick'), 'Expected road reward top refusal not to unlock the top.');
  assert(refreshCount === 1, 'Expected road reward top refusal to trigger one refresh.');
  assert(messages.length === 1, 'Expected road reward top refusal to show one message.');
  assert(analyticsEvents.length === 0, 'Expected road reward top refusal not to emit purchase analytics.');
}

async function main() {
  await testArenaPurchaseAnalytics();
  await testArenaTrialAnalytics();
  await testTopPurchaseAnalytics();
  await testRoadRewardTopCannotBePurchased();
  console.log('Loadout flow check passed.');
}

main().catch((error) => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
