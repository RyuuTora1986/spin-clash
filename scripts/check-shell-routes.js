const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const indexHtmlPath = path.join(repoRoot, 'index.html');
const uiEntryToolsPath = path.join(repoRoot, 'src', 'ui-entry-tools.js');

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
    }
  };
}

function loadUiEntryTools(context) {
  const code = fs.readFileSync(uiEntryToolsPath, 'utf8');
  vm.runInContext(code, context, { filename: 'src/ui-entry-tools.js' });
}

function checkIndexHtmlContract() {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  const requiredIds = [
    'btn-enter',
    'btn-enter-quick',
    'btn-enter-workshop',
    'btn-enter-settings',
    'btn-route-back',
    'shell-route-title',
    'shell-route-context',
    'settings-panel',
    'btn-settings-music',
    'btn-settings-sfx'
  ];

  requiredIds.forEach((id) => {
    assert(html.includes(`id="${id}"`), `Expected index.html to define #${id}.`);
  });

  const requiredInvokes = [
    "__spinClashInvoke('goPath')",
    "__spinClashInvoke('goQuick')",
    "__spinClashInvoke('goWorkshop')",
    "__spinClashInvoke('goSettings')",
    "__spinClashInvoke('goBack')",
    "__spinClashInvoke('toggleMusic')",
    "__spinClashInvoke('toggleSfx')"
  ];

  requiredInvokes.forEach((snippet) => {
    assert(html.includes(snippet), `Expected index.html to invoke ${snippet}.`);
  });
}

async function checkUiEntryRouteActions() {
  const document = createDocument();
  const state = {
    uiRoute: 'home',
    uiRouteFrom: 'home',
    battleReturnRoute: 'home',
    currentMode: 'quick',
    playerTopId: 0,
    homePreviewTopId: 1,
    beginFightCalls: 0,
    resetMatchCalls: 0,
    lastResetOptions: null,
    updateModeCalls: 0,
    showLoadoutCalls: 0,
    hideLoadoutCalls: 0,
    setWorkshopOpenCalls: [],
    musicEnabled: true,
    sfxEnabled: true
  };
  const loadoutOverlay = document.getElementById('ov-loadout');
  const titleOverlay = document.getElementById('ov-title');
  const matchOverlay = document.getElementById('ov-match');
  const hud = document.getElementById('hud');
  loadoutOverlay.classList.add('hide');

  const context = vm.createContext({
    console,
    document,
    window: {}
  });
  context.window = context;
  context.SpinClash = {};

  loadUiEntryTools(context);

  const tools = context.SpinClash.createUiEntryTools({
    uiText: { nodeLocked: 'Node locked.' },
    tops: [{ id: 'impact' }, { id: 'armor' }],
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
      return 0;
    },
    setActiveChallengeIndex() {},
    getCurrentArena() {
      return 0;
    },
    setCurrentArena() {},
    getSelectedArenaIndex() {
      return 0;
    },
    setSelectedArenaIndex() {},
    getPlayerTopId() {
      return state.playerTopId;
    },
    setPlayerTopId(next) {
      state.playerTopId = next;
    },
    getHomePreviewTopId() {
      return state.homePreviewTopId;
    },
    setHomePreviewTopId(next) {
      state.homePreviewTopId = next;
    },
    resetScoreRound() {},
    setChallengeContinueUsed() {},
    getSave() {
      return { challenge: { unlockedNodeIndex: 0 } };
    },
    getLoadoutOverlay() {
      return loadoutOverlay;
    },
    showLoadoutOverlay() {
      state.showLoadoutCalls += 1;
      loadoutOverlay.classList.remove('hide');
    },
    hideLoadoutOverlay() {
      state.hideLoadoutCalls += 1;
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
    isTopUnlocked(index) {
      return index === 0;
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
    },
    toggleWorkshop() {},
    setWorkshopOpen(next) {
      state.setWorkshopOpenCalls.push(next);
      return !!next;
    },
    attemptResearchPurchase() {
      return Promise.resolve(true);
    },
    doSwap() {},
    doPlayerDash() {},
    doPlayerGuard() {},
    doPlayerSkill() {},
    resetMatch(options) {
      state.resetMatchCalls += 1;
      state.lastResetOptions = options || null;
      matchOverlay.classList.add('hide');
    },
    handleDoubleReward() {},
    handleContinueReward() {},
    handleShare() {},
    toggleMusicPreference() {
      state.musicEnabled = !state.musicEnabled;
      return state.musicEnabled;
    },
    toggleSfxPreference() {
      state.sfxEnabled = !state.sfxEnabled;
      return state.sfxEnabled;
    }
  });

  tools.installWindowBindings();
  const actions = context.__spinClashUI;

  ['goHome', 'goPath', 'goQuick', 'goWorkshop', 'goSettings', 'goBack', 'toggleMusic', 'toggleSfx', 'guard'].forEach((action) => {
    assert(typeof actions[action] === 'function', `Expected window.__spinClashUI.${action} to exist.`);
  });

  actions.goQuick();
  assert(state.uiRoute === 'home', 'Expected goQuick() to stay on home when the previewed top is locked.');

  actions.goPath();
  assert(state.uiRoute === 'home', 'Expected goPath() to stay on home when the previewed top is locked.');

  state.homePreviewTopId = 0;
  actions.goPath();
  assert(state.uiRoute === 'path', 'Expected goPath() to enter the path route.');
  assert(state.currentMode === 'challenge', 'Expected goPath() to switch current mode to challenge.');
  assert(titleOverlay.classList.contains('hide'), 'Expected goPath() to hide the title overlay.');
  assert(!loadoutOverlay.classList.contains('hide'), 'Expected goPath() to show the shell overlay.');

  actions.goWorkshop();
  assert(state.uiRoute === 'workshop', 'Expected goWorkshop() to enter the workshop route.');
  assert(state.uiRouteFrom === 'path', 'Expected goWorkshop() to remember the previous route as origin.');

  actions.goBack();
  assert(state.uiRoute === 'path', 'Expected goBack() to return workshop to its origin route.');

  actions.goQuick();
  assert(state.uiRoute === 'quick', 'Expected goQuick() to enter the quick route.');
  assert(state.currentMode === 'quick', 'Expected goQuick() to switch current mode to quick.');

  actions.goSettings();
  assert(state.uiRoute === 'settings', 'Expected goSettings() to enter the settings route.');
  assert(state.uiRouteFrom === 'quick', 'Expected goSettings() to remember the quick route as origin.');

  const musicBefore = state.musicEnabled;
  actions.toggleMusic();
  assert(state.musicEnabled !== musicBefore, 'Expected toggleMusic() to flip the stored music preference.');

  const sfxBefore = state.sfxEnabled;
  actions.toggleSfx();
  assert(state.sfxEnabled !== sfxBefore, 'Expected toggleSfx() to flip the stored SFX preference.');

  actions.goBack();
  assert(state.uiRoute === 'quick', 'Expected goBack() to return settings to its origin route.');

  await actions.startFight();
  assert(state.beginFightCalls === 1, 'Expected startFight() to still begin a fight.');
  assert(state.battleReturnRoute === 'quick', 'Expected startFight() to capture the current route as the battle return route.');

  state.uiRoute = 'result';
  matchOverlay.classList.remove('hide');
  hud.style.display = '';
  actions.replay();
  assert(state.resetMatchCalls === 1, 'Expected replay() to clear the current match state before returning.');
  assert(state.lastResetOptions && state.lastResetOptions.skipInitRound === true, 'Expected replay() to skip immediate round re-init when returning to a shell route.');
  assert(state.uiRoute === 'quick', 'Expected replay() from a quick battle result to return to the quick route.');
  assert(matchOverlay.classList.contains('hide'), 'Expected replay() to hide the result overlay.');
  assert(!loadoutOverlay.classList.contains('hide'), 'Expected replay() to show the shell overlay after returning.');

  actions.goHome();
  assert(state.uiRoute === 'home', 'Expected goHome() to return to the home route.');
  assert(!titleOverlay.classList.contains('hide'), 'Expected goHome() to show the title overlay again.');
}

async function main() {
  checkIndexHtmlContract();
  await checkUiEntryRouteActions();
  console.log('Shell route check passed.');
}

main().catch((error) => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
