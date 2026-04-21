const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function loadScript(relPath, context) {
  const absPath = path.join(repoRoot, relPath);
  const code = fs.readFileSync(absPath, 'utf8');
  vm.runInContext(code, context, { filename: relPath });
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

function createElement(id) {
  return {
    id,
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
  const selectorMap = new Map();

  function getElement(id) {
    if (!elements.has(id)) {
      elements.set(id, createElement(id));
    }
    return elements.get(id);
  }

  return {
    getElementById(id) {
      return getElement(id);
    },
    querySelector(selector) {
      if (!selectorMap.has(selector)) {
        selectorMap.set(selector, createElement(selector));
      }
      return selectorMap.get(selector);
    },
    querySelectorAll() {
      return [];
    }
  };
}

function testRuntimeAudioSettingsReadThrough() {
  const storageState = {
    settings: {
      locale: 'en',
      musicEnabled: true,
      sfxEnabled: false
    }
  };
  const context = vm.createContext({
    console,
    window: { SpinClash: {} },
    document: {},
    URL,
    navigator: {}
  });
  context.window.window = context.window;
  context.SpinClash = context.window.SpinClash;

  loadScript(path.join('src', 'runtime-audio-tools.js'), context);

  const tools = context.SpinClash.createRuntimeAudioTools({
    storageService: {
      get() {
        return storageState;
      }
    }
  });

  assert(tools.isMusicEnabled() === true, 'Expected runtime audio tools to read saved musicEnabled=true.');
  assert(tools.isSfxEnabled() === false, 'Expected runtime audio tools to read saved sfxEnabled=false.');

  storageState.settings.musicEnabled = false;
  storageState.settings.sfxEnabled = true;

  assert(tools.isMusicEnabled() === false, 'Expected runtime audio tools to reflect updated musicEnabled=false.');
  assert(tools.isSfxEnabled() === true, 'Expected runtime audio tools to reflect updated sfxEnabled=true.');
}

function testSettingsPanelPresentation() {
  const document = createDocument();
  const context = vm.createContext({
    console,
    window: {},
    document
  });
  context.window = context;
  context.SpinClash = {};

  loadScript(path.join('src', 'loadout-ui-tools.js'), context);

  let musicEnabled = false;
  let sfxEnabled = true;

  const tools = context.SpinClash.createLoadoutUiTools({
    uiText: {
      settingsLanguageLabel: 'LANGUAGE',
      settingsMusicLabel: 'MUSIC',
      settingsSfxLabel: 'SFX',
      settingsToggleOn: 'ON',
      settingsToggleOff: 'OFF',
      infoAboutLabel: 'ABOUT',
      infoContactLabel: 'CONTACT',
      infoPrivacyLabel: 'PRIVACY',
      infoTermsLabel: 'TERMS',
      infoBackButton: 'BACK',
      infoAboutTitle: 'ABOUT SPIN CLASH',
      infoContactTitle: 'CONTACT',
      infoPrivacyTitle: 'PRIVACY',
      infoTermsTitle: 'TERMS',
      infoAboutBody: ['Line A', 'Line B'],
      fightButton: 'START MATCH',
      challengeButton: 'ENTER PATH',
      loadoutHintChallenge: 'Path hint',
      loadoutHintQuick: 'Quick hint',
      quickMode: 'QUICK BATTLE',
      challengeMode: 'CHAMPIONSHIP PATH',
      featuredTopTitle: 'SELECTED TOP',
      featuredTraitsTitle: 'TRACK TRAITS',
      currencyLabel: 'SCRAP'
    },
    tops: [],
    arenas: [],
    researchTracks: [],
    modifiers: {},
    enemyPresets: {},
    challengeRoad: [],
    roadRanks: [],
    getSave() {
      return {
        currency: 0,
        unlocks: { arenas: [], tops: [] },
        challenge: { unlockedNodeIndex: 0, checkpointNodeIndex: 0 }
      };
    },
    saveProgress(mutator) {
      return mutator(this.getSave ? this.getSave() : {});
    },
    getCurrentMode() {
      return 'quick';
    },
    getUiRoute() {
      return 'info';
    },
    getUiRouteFrom() {
      return 'quick';
    },
    getInfoPage() {
      return 'about';
    },
    getCurrentLocale() {
      return 'en';
    },
    getMusicEnabled() {
      return musicEnabled;
    },
    getSfxEnabled() {
      return sfxEnabled;
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
    getUnlockedRoadRankIndex() {
      return 0;
    },
    getSelectedRoadRankIndex() {
      return 0;
    },
    setSelectedRoadRankIndex(index) {
      return index;
    },
    setCurrentArena() {},
    rewardService: null,
    showMsg() {},
    refresh() {}
  });

  tools.updateModeUI();

  assert(document.getElementById('settings-language-label').textContent === 'LANGUAGE', 'Expected settings panel to surface a formal language label.');
  assert(document.getElementById('settings-music-label').textContent === 'MUSIC', 'Expected settings panel to surface a formal music label.');
  assert(document.getElementById('settings-sfx-label').textContent === 'SFX', 'Expected settings panel to surface a formal SFX label.');
  assert(document.getElementById('btn-open-about-home').textContent === 'ABOUT', 'Expected home info entry to render the ABOUT label.');
  assert(document.getElementById('btn-open-contact-home').textContent === 'CONTACT', 'Expected home info entry to render the CONTACT label.');
  assert(document.getElementById('btn-open-privacy-home').textContent === 'PRIVACY', 'Expected home info entry to render the PRIVACY label.');
  assert(document.getElementById('btn-open-terms-home').textContent === 'TERMS', 'Expected home info entry to render the TERMS label.');
  assert(document.getElementById('btn-open-about-settings').textContent === 'ABOUT', 'Expected settings info entry to render the ABOUT label.');
  assert(document.getElementById('btn-open-contact-settings').textContent === 'CONTACT', 'Expected settings info entry to render the CONTACT label.');
  assert(document.getElementById('btn-open-privacy-settings').textContent === 'PRIVACY', 'Expected settings info entry to render the PRIVACY label.');
  assert(document.getElementById('btn-open-terms-settings').textContent === 'TERMS', 'Expected settings info entry to render the TERMS label.');
  assert(document.getElementById('info-shell-title').textContent === 'ABOUT SPIN CLASH', 'Expected info shell title to reflect the active info page.');
  assert(document.getElementById('info-shell-body').innerHTML.includes('Line A'), 'Expected info shell body to render localized public info copy.');
  assert(document.getElementById('btn-info-back').textContent === 'BACK', 'Expected info shell back button label to render.');
  assert(document.getElementById('btn-settings-music').textContent === 'OFF', 'Expected music toggle button to render OFF label.');
  assert(document.getElementById('btn-settings-sfx').textContent === 'ON', 'Expected SFX toggle button to render ON label.');
  assert(document.getElementById('btn-settings-music').classList.contains('off'), 'Expected disabled music toggle to carry .off state.');
  assert(document.getElementById('btn-settings-sfx').classList.contains('off') === false, 'Expected enabled SFX toggle to avoid .off state.');

  musicEnabled = true;
  sfxEnabled = false;
  tools.updateModeUI();

  assert(document.getElementById('btn-settings-music').textContent === 'ON', 'Expected music toggle button to update to ON.');
  assert(document.getElementById('btn-settings-sfx').textContent === 'OFF', 'Expected SFX toggle button to update to OFF.');
}

function main() {
  testRuntimeAudioSettingsReadThrough();
  testSettingsPanelPresentation();
  console.log('Settings flow check passed.');
}

try {
  main();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
