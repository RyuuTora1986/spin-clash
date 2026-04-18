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

function createBaseSave(overrides) {
  const save = {
    version: 1,
    sessions: 0,
    currency: 0,
    challenge: {
      unlockedNodeIndex: 0
    },
    unlocks: {
      arenas: ['circle_bowl', 'heart_bowl'],
      tops: ['impact', 'armor']
    },
    analytics: []
  };
  return Object.assign(save, overrides || {});
}

function createContext(initialSave) {
  const listeners = {};
  const save = initialSave;
  const analyticsEvents = [];
  const context = vm.createContext({
    console,
    window: {
      addEventListener(name, handler) {
        listeners[name] = handler;
      }
    },
    document: {
      getElementById() {
        return {
          classList: {
            contains() {
              return false;
            }
          },
          textContent: ''
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
    },
    Date
  });
  context.window = context.window;
  context.window.window = context.window;
  context.window.document = context.document;
  context.window.SpinClash = {};
  context.SpinClash = context.window.SpinClash;
  loadScript(path.join('src', 'debug-runtime-tools.js'), context);

  const tools = context.SpinClash.createDebugRuntimeTools({
    storageService: {
      version: 1,
      getPersistenceMode() {
        return 'local';
      },
      isPersistent() {
        return true;
      }
    },
    analyticsService: {
      track(name, payload) {
        analyticsEvents.push({ name, payload });
      },
      list() {
        return analyticsEvents;
      }
    },
    debugService: {
      enabled: false
    },
    getSave() {
      return save;
    },
    saveProgress(mutator) {
      return mutator(save);
    },
    tops: [],
    arenas: [
      { id: 'circle_bowl' },
      { id: 'heart_bowl' },
      { id: 'hex_bowl' }
    ],
    enemyPresets: {},
    getArenaLabel(index) {
      return ['CIRCLE BOWL', 'HEART BOWL', 'HEX BOWL'][index] || 'ARENA';
    },
    getCurrentMode() {
      return 'challenge';
    },
    getCurrentArena() {
      return 2;
    },
    getPlayerTopId() {
      return 0;
    },
    getEnemyTopId() {
      return 0;
    },
    getCurrentEnemyPresetId() {
      return null;
    },
    getCurrentEnemyPresetLabel() {
      return null;
    },
    getCurrentEnemyAiConfig() {
      return null;
    },
    getCurrentChallengeNode() {
      return null;
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

  return {
    tools,
    save,
    listeners,
    analyticsEvents
  };
}

function testFirstSessionStart() {
  const state = createContext(createBaseSave());
  state.tools.initRuntimeDebug();

  assert(state.save.sessions === 1, 'Expected first boot to increment saved session count.');
  assert(state.analyticsEvents.length === 1, 'Expected first boot to emit one analytics event.');
  assert(state.analyticsEvents[0].name === 'session_start', 'Expected first boot to emit session_start.');
  assert(state.analyticsEvents[0].payload.sessions === 1, 'Expected session_start payload to preserve incremented sessions count.');
  assert(state.analyticsEvents[0].payload.hasProgress === false, 'Expected clean save to report hasProgress false.');
  assert(state.analyticsEvents[0].payload.unlockedArenaCount === 2, 'Expected session_start payload to preserve unlockedArenaCount.');
  assert(typeof state.listeners.pagehide === 'function', 'Expected initRuntimeDebug to register pagehide lifecycle listener.');
  assert(typeof state.listeners.beforeunload === 'function', 'Expected initRuntimeDebug to register beforeunload lifecycle listener.');
}

function testReturnSessionAndOnceOnlyEndTracking() {
  const state = createContext(createBaseSave({
    sessions: 2,
    currency: 80,
    challenge: {
      unlockedNodeIndex: 3
    },
    unlocks: {
      arenas: ['circle_bowl', 'heart_bowl', 'hex_bowl'],
      tops: ['impact', 'armor', 'trick']
    }
  }));

  state.tools.initRuntimeDebug();
  state.listeners.pagehide();
  state.listeners.beforeunload();

  assert(state.save.sessions === 3, 'Expected return session boot to increment saved session count.');
  assert(state.analyticsEvents.length === 2, 'Expected return session plus one session_end event.');
  assert(state.analyticsEvents[0].name === 'return_session', 'Expected existing save to emit return_session.');
  assert(state.analyticsEvents[0].payload.sessions === 3, 'Expected return_session payload to preserve incremented sessions count.');
  assert(state.analyticsEvents[0].payload.hasProgress === true, 'Expected progressed save to report hasProgress true.');
  assert(state.analyticsEvents[0].payload.challengeUnlockedNodeIndex === 3, 'Expected return_session payload to preserve challenge progress.');
  assert(state.analyticsEvents[1].name === 'session_end', 'Expected lifecycle callback to emit session_end.');
  assert(state.analyticsEvents[1].payload.reason === 'pagehide', 'Expected first lifecycle end reason to win once-only tracking.');
  assert(state.analyticsEvents[1].payload.persistenceMode === 'local', 'Expected session_end payload to preserve persistenceMode.');
  assert(state.analyticsEvents[1].payload.lastMode === 'challenge', 'Expected session_end payload to preserve the last mode.');
  assert(state.analyticsEvents[1].payload.lastArenaId === 'hex_bowl', 'Expected session_end payload to preserve the last arena id.');
}

try {
  testFirstSessionStart();
  testReturnSessionAndOnceOnlyEndTracking();
  console.log('Session analytics check passed.');
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
