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

function createStorage(initialValue, shouldThrow) {
  const store = new Map();
  if (initialValue != null) {
    store.set('spin-clash-save', initialValue);
  }
  return {
    getItem(key) {
      if (shouldThrow) throw new Error('blocked');
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      if (shouldThrow) throw new Error('blocked');
      store.set(key, String(value));
    },
    removeItem(key) {
      if (shouldThrow) throw new Error('blocked');
      store.delete(key);
    }
  };
}

function createContext(initialLocalValue) {
  const localStorage = createStorage(initialLocalValue, false);
  const sessionStorage = createStorage(null, false);
  const context = vm.createContext({
    console,
    window: {
      localStorage,
      sessionStorage,
      name: ''
    },
    Date
  });
  context.window = context.window;
  context.window.window = context.window;
  context.window.SpinClash = {
    services: {}
  };
  context.SpinClash = context.window.SpinClash;
  return { context, localStorage, sessionStorage };
}

function testLegacyMigrationAndNormalization() {
  const legacySave = {
    version: 0,
    sessions: 4,
    currency: 35,
    challengeUnlockedNodeIndex: 3,
    unlockedArenas: ['hex_bowl', 'hex_bowl'],
    unlockedTops: ['trick', 'trick'],
    challenge: {
      unlockedNodeIndex: -2,
      checkpointNodeIndex: -4,
      completedNodes: [0, 0, 1, -1, '2'],
      lastNodeIndex: 'bad'
    },
    unlocks: {
      arenas: ['circle_bowl', 'hex_bowl', 7],
      tops: ['impact', 'trick', null]
    },
    analytics: Array.from({ length: 205 }, (_, index) => {
      return index % 2 === 0
        ? { name: 'event_' + index, payload: {}, at: '2026-04-17T00:00:00.000Z' }
        : 'bad_event_' + index;
    })
  };

  const { context } = createContext(JSON.stringify(legacySave));
  loadScript(path.join('src', 'storage-service.js'), context);

  const service = context.SpinClash.services.storage;
  const save = service.get();

  assert(save.version === 1, 'Expected legacy save to be migrated to the current version.');
  assert(
    save.settings
      && save.settings.locale === 'en'
      && save.settings.musicEnabled === true
      && save.settings.sfxEnabled === true,
    'Expected legacy save to gain default locale and audio settings.'
  );
  assert(
    save.research
      && save.research.levels
      && save.research.levels.spin_core === 0
      && save.research.levels.guard_frame === 0
      && save.research.levels.burst_relay === 0,
    'Expected legacy save to gain default Workshop Research levels.'
  );
  assert(save.challenge.unlockedNodeIndex === 3, 'Expected legacy challengeUnlockedNodeIndex to migrate into challenge.unlockedNodeIndex.');
  assert(save.challenge.checkpointNodeIndex === 0, 'Expected invalid challenge.checkpointNodeIndex to normalize to 0.');
  assert(
    Array.isArray(save.challenge.completedNodes)
      && save.challenge.completedNodes.length === 2
      && save.challenge.completedNodes[0] === 0
      && save.challenge.completedNodes[1] === 1,
    'Expected challenge.completedNodes to be normalized to unique non-negative integers.'
  );
  assert(save.challenge.lastNodeIndex === null, 'Expected invalid challenge.lastNodeIndex to normalize to null.');
  assert(save.challenge.unlockedRankIndex === 0, 'Expected legacy save to gain default unlockedRankIndex 0.');
  assert(save.challenge.selectedRankIndex === 0, 'Expected legacy save to gain default selectedRankIndex 0.');
  assert(
    save.challenge.rankProgress
      && save.challenge.rankProgress[0]
      && save.challenge.rankProgress[0].unlockedNodeIndex === 3
      && save.challenge.rankProgress[0].completedNodes.join(',') === '0,1',
    'Expected legacy Rank I challenge progress to migrate into rankProgress[0].'
  );
  assert(
    Array.isArray(save.unlocks.arenas)
      && save.unlocks.arenas.join(',') === 'circle_bowl,heart_bowl,hex_bowl',
    'Expected arena unlocks to preserve defaults, migrate legacy arrays, and remove invalid entries.'
  );
  assert(
    Array.isArray(save.unlocks.tops)
      && save.unlocks.tops.join(',') === 'impact,armor,trick',
    'Expected top unlocks to preserve defaults, migrate legacy arrays, and remove invalid entries.'
  );
  assert(
    Array.isArray(save.analytics) && save.analytics.length === 103,
    'Expected analytics log to discard invalid entries while preserving valid objects.'
  );
}

function testLocaleSettingsNormalization() {
  const initialSave = {
    version: 1,
    currency: 12,
    settings: {
      locale: 'ja-JP'
    }
  };
  const { context } = createContext(JSON.stringify(initialSave));
  loadScript(path.join('src', 'storage-service.js'), context);

  const service = context.SpinClash.services.storage;
  const save = service.get();

  assert(save.settings.locale === 'ja', 'Expected locale settings to normalize browser-style language tags.');
  assert(save.settings.musicEnabled === true, 'Expected missing musicEnabled to default true.');
  assert(save.settings.sfxEnabled === true, 'Expected missing sfxEnabled to default true.');

  const patched = service.patch({
    settings: {
      locale: 'fr-FR',
      musicEnabled: false,
      sfxEnabled: false
    }
  });

  assert(
    patched.settings
      && patched.settings.locale === 'en'
      && patched.settings.musicEnabled === false
      && patched.settings.sfxEnabled === false,
    'Expected settings patch to normalize locale while preserving explicit audio toggles.'
  );
}

try {
  testLegacyMigrationAndNormalization();
  testLocaleSettingsNormalization();
  console.log('Storage service check passed.');
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
