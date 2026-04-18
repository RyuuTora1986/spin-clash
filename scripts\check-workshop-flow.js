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
    window: {
      SpinClash: {
        config: {},
        services: {},
        state: {},
        debug: {}
      }
    },
    document: {
      getElementById() {
        return null;
      },
      querySelectorAll() {
        return [];
      }
    }
  });
  context.window.window = context.window;
  context.SpinClash = context.window.SpinClash;
  return context;
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
    lockedTop: 'LOCKED',
    workshopTitle: 'WORKSHOP RESEARCH',
    workshopOpen: 'OPEN WORKSHOP',
    workshopClose: 'CLOSE WORKSHOP',
    workshopBuy: 'UPGRADE',
    workshopMaxed: 'MAXED',
    workshopLocked: 'NOT ENOUGH SCRAP',
    workshopUnlocked: 'RESEARCH UPGRADED'
  };
}

function createBaseSave(currency) {
  return {
    version: 1,
    currency,
    challenge: {
      unlockedNodeIndex: 0,
      checkpointNodeIndex: 0,
      completedNodes: [],
      lastNodeIndex: null
    },
    unlocks: {
      arenas: ['circle_bowl', 'heart_bowl'],
      tops: ['impact', 'armor']
    },
    research: {
      levels: {
        spin_core: 0,
        guard_frame: 0,
        burst_relay: 0
      }
    },
    analytics: []
  };
}

async function testResearchConfigAndPurchaseFlow() {
  const context = createContext();
  [
    'src/bootstrap-app-globals.js',
    'src/config-research.js',
    'src/progression-tools.js',
    'src/loadout-ui-tools.js'
  ].forEach((relPath) => loadScript(relPath, context));

  const researchTracks = context.SpinClash.config.research;
  assert(Array.isArray(researchTracks), 'Expected config.research to exist.');
  assert(researchTracks.length === 3, 'Expected exactly 3 research tracks.');
  researchTracks.forEach((track) => {
    assert(Array.isArray(track.levels) && track.levels.length === 4, `Expected ${track.id} to have 4 levels.`);
  });

  const storage = createStorageStub(createBaseSave(200));
  const progression = context.SpinClash.createProgressionTools({
    storageService: storage,
    challengeRoad: [],
    researchTracks,
    refresh() {},
    getSessionTrialArenaIds() {
      return new Set();
    },
    setMode() {},
    setCurrentArena() {},
    setSelectedArenaIndex() {},
    setActiveChallengeIndex() {},
    resetRuntimeFlags() {}
  });

  assert(progression.getResearchLevel('spin_core') === 0, 'Expected new saves to start at spin_core level 0.');
  assert(progression.getResearchBonuses().maxSpinMul === 1, 'Expected max spin bonus to start neutral.');

  const purchase = progression.buyResearchLevel('spin_core');
  assert(purchase && purchase.ok === true, 'Expected spin_core research purchase to succeed.');
  assert(storage.get().currency < 200, 'Expected research purchase to spend SCRAP.');
  assert(progression.getResearchLevel('spin_core') === 1, 'Expected spin_core level to increase after purchase.');
  assert(progression.getResearchBonuses().maxSpinMul > 1, 'Expected research bonus to increase max spin after purchase.');

  const analyticsEvents = [];
  const messages = [];
  let refreshCount = 0;
  let uiRoute = 'quick';
  let uiRouteFrom = 'home';
  const loadoutTools = context.SpinClash.createLoadoutUiTools({
    uiText: createUiText(),
    tops: [
      { id: 'impact', name: 'Impact', unlockCost: 0 },
      { id: 'armor', name: 'Armor', unlockCost: 0 }
    ],
    arenas: [
      { id: 'circle_bowl', label: 'CIRCLE BOWL', unlockCost: 0 }
    ],
    researchTracks,
    getSave() {
      return storage.get();
    },
    saveProgress(mutator) {
      return storage.transact(mutator);
    },
    getCurrentMode() {
      return 'quick';
    },
    getUiRoute() {
      return uiRoute;
    },
    getUiRouteFrom() {
      return uiRouteFrom;
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
    },
    getResearchLevel(trackId) {
      return progression.getResearchLevel(trackId);
    },
    getResearchBonuses() {
      return progression.getResearchBonuses();
    },
    buyResearchLevel(trackId) {
      return progression.buyResearchLevel(trackId);
    }
  });

  assert(typeof loadoutTools.toggleWorkshopOpen === 'function', 'Expected loadout UI to expose workshop toggle control.');
  assert(typeof loadoutTools.attemptResearchPurchase === 'function', 'Expected loadout UI to expose research purchase control.');
  assert(loadoutTools.isWorkshopOpen() === false, 'Expected workshop route to start closed while on quick route.');
  assert(loadoutTools.toggleWorkshopOpen() === false, 'Expected workshop toggle helper to reflect the current non-workshop route.');
  uiRouteFrom = 'quick';
  uiRoute = 'workshop';
  assert(loadoutTools.setWorkshopOpen(true) === true, 'Expected workshop route helper to acknowledge workshop visibility.');
  assert(loadoutTools.isWorkshopOpen() === true, 'Expected workshop route to read as open when uiRoute=workshop.');

  const granted = await loadoutTools.attemptResearchPurchase(1);
  const researchPurchaseEvent = analyticsEvents.find((event) => event.name === 'research_purchase');

  assert(granted === true, 'Expected guard_frame research purchase to resolve true.');
  assert(storage.get().research.levels.guard_frame === 1, 'Expected guard_frame level to increase after UI purchase.');
  assert(refreshCount > 0, 'Expected workshop UI purchase to trigger refresh.');
  assert(messages.some((text) => text.indexOf('RESEARCH') >= 0), 'Expected workshop UI purchase to show a research message.');
  assert(researchPurchaseEvent, 'Expected workshop UI purchase to emit research_purchase analytics.');
  assert(researchPurchaseEvent.payload.trackId === 'guard_frame', 'Expected research_purchase payload to preserve trackId.');
  assert(researchPurchaseEvent.payload.levelAfter === 1, 'Expected research_purchase payload to preserve levelAfter.');
  assert(researchPurchaseEvent.payload.maxLevel === 4, 'Expected research_purchase payload to preserve maxLevel.');
  assert(researchPurchaseEvent.payload.remainingLevels === 3, 'Expected research_purchase payload to preserve remainingLevels.');
  assert(researchPurchaseEvent.payload.mode === 'quick', 'Expected research_purchase payload to preserve mode.');
}

async function main() {
  await testResearchConfigAndPurchaseFlow();
  console.log('Workshop flow check passed.');
}

main().catch((error) => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
