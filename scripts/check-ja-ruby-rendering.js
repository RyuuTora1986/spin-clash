const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const failures = [];

function fail(message) {
  failures.push(message);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function loadScript(relPath, context) {
  const absPath = path.join(repoRoot, relPath);
  const code = fs.readFileSync(absPath, 'utf8');
  vm.runInContext(code, context, { filename: absPath });
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
        if (force) {
          classes.add(name);
        } else {
          classes.delete(name);
        }
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

function stripTags(value) {
  return String(value == null ? '' : value).replace(/<[^>]*>/g, '');
}

function createElement() {
  const element = {
    disabled: false,
    style: {},
    dataset: {},
    className: '',
    classList: createClassList()
  };
  let textContent = '';
  let innerHTML = '';
  Object.defineProperty(element, 'textContent', {
    get() {
      return textContent;
    },
    set(value) {
      textContent = String(value == null ? '' : value);
      innerHTML = textContent;
    }
  });
  Object.defineProperty(element, 'innerHTML', {
    get() {
      return innerHTML;
    },
    set(value) {
      innerHTML = String(value == null ? '' : value);
      textContent = stripTags(innerHTML);
    }
  });
  return element;
}

function createDocument() {
  const elements = new Map();
  const selectors = new Map();
  return {
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, createElement());
      }
      return elements.get(id);
    },
    querySelectorAll(selector) {
      if (selector === '.card' || selector === '.arena-opt' || selector === '[data-locale-target]') {
        return [];
      }
      return [];
    },
    querySelector(selector) {
      if (!selectors.has(selector)) {
        selectors.set(selector, createElement());
      }
      return selectors.get(selector);
    }
  };
}

function createContext() {
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
  return { context, document };
}

function checkJapaneseContentReadings() {
  const root = { config: {}, state: {}, services: {}, debug: {} };
  const context = vm.createContext({
    console,
    window: { SpinClash: root }
  });
  loadScript('src/bootstrap-app-globals.js', context);
  loadScript('src/config-text.js', context);

  const localeContent = root.config.contentLocales || {};
  const ja = localeContent.ja || {};
  const tops = ja.tops || {};
  const arenas = ja.arenas || {};

  assert(tops.impact && tops.impact.reading === 'せきしょうほう', 'Expected ja top impact to define reading せきしょうほう.');
  assert(tops.armor && tops.armor.reading === 'そうこうえん', 'Expected ja top armor to define reading そうこうえん.');
  assert(tops.armor_bastion && tops.armor_bastion.reading === 'ふどうあまぎ', 'Expected ja top armor_bastion to define reading ふどうあまぎ.');
  assert(tops.armor_mammoth && tops.armor_mammoth.name === '磐象鎮塁', 'Expected ja top armor_mammoth to use the more natural Japanese display name 磐象鎮塁.');
  assert(tops.armor_mammoth && tops.armor_mammoth.reading === 'ばんしょうちんるい', 'Expected ja top armor_mammoth to define reading ばんしょうちんるい.');
  assert(tops.trick_glitch && tops.trick_glitch.reading === 'きつねびだんかい', 'Expected ja top trick_glitch to define reading きつねびだんかい.');
  assert(arenas.rose_bowl && arenas.rose_bowl.name === undefined, 'Expected ja arena localization to keep using label fields only.');
  assert(arenas.rose_bowl && arenas.rose_bowl.label === '棘華幽檻', 'Expected ja arena rose_bowl to use the more natural Japanese display name 棘華幽檻.');
  assert(arenas.rose_bowl && arenas.rose_bowl.reading === 'きょくかゆうかん', 'Expected ja arena rose_bowl to define reading きょくかゆうかん.');
  assert(arenas.circle_bowl && arenas.circle_bowl.reading === 'そうりんとうてい', 'Expected ja arena circle_bowl to define reading そうりんとうてい.');
}

function createRubyTools(route) {
  const { context, document } = createContext();
  loadScript('src/loadout-ui-tools.js', context);
  const tops = [
    { id: 'impact', name: '赤霄鋒', reading: 'せきしょうほう', family: 'impact', unlockCost: 0, skill: 'Fly Charge' },
    { id: 'armor_bastion', name: '不動天城', reading: 'ふどうあまぎ', family: 'armor', unlockCost: 0, skill: 'Fortress Pulse' }
  ];
  const arenas = [
    { id: 'circle_bowl', label: '蒼輪闘庭', reading: 'そうりんとうてい', unlockCost: 0, type: 'circle' }
  ];

  const tools = context.SpinClash.createLoadoutUiTools({
    uiText: {
      quickMode: 'QUICK BATTLE',
      challengeMode: 'CHAMPIONSHIP PATH',
      fightButton: 'START MATCH',
      challengeButton: 'ENTER PATH',
      loadoutHintQuick: 'Choose an arena.',
      loadoutHintChallenge: 'Path hint',
      featuredTopTitle: 'SELECTED TOP',
      featuredTraitsTitle: 'TRACK TRAITS',
      currencyLabel: 'SCRAP',
      quickArenaTitle: 'SELECTED ARENA',
      quickArenaUnlocked: 'UNLOCKED',
      quickTopTitle: 'DEPLOYED TOP',
      quickTopReady: 'READY',
      homeTopTitle: 'CURRENT TOP',
      homeTopUnlocked: 'UNLOCKED',
      homeTopLocked: 'LOCKED',
      homeTopLockedSkill: 'Silhouette only.',
      homeTopLockedHint: 'Unlock this top later.',
      homeTopPrev: '<',
      homeTopNext: '>',
      homeTopEmpty: 'Choose an unlocked top to preview its strengths.',
      challengeCurrentTopTitle: 'CURRENT LOADOUT',
      cards: [
        { type: '強攻型', stats: 'HP 85', skill: 'Fly Charge', pitch: 'Aggressive line breaker.', traits: ['Burst opener'] },
        { type: '守御型', stats: 'HP 120', skill: 'Fortress Pulse', pitch: 'Fortified center hold.', traits: ['Center anchor'] }
      ]
    },
    tops,
    arenas,
    researchTracks: [],
    roadRanks: [
      { id: 'rank_i', label: 'RANK I', description: 'Road reward line.', rewardMul: 1, rewardTopId: 'armor_bastion' }
    ],
    modifiers: {},
    enemyPresets: {},
    challengeRoad: [
      { id: 'node-1', name: 'Node 1', arenaIndex: 0, enemyId: '', modifierId: '', reward: 30, firstClearBonus: 0, checkpointOnClear: false }
    ],
    getSave() {
      return {
        currency: 0,
        unlocks: { arenas: ['circle_bowl'], tops: ['impact', 'armor_bastion'] },
        challenge: { unlockedNodeIndex: 0, checkpointNodeIndex: 0, completedNodes: [] }
      };
    },
    saveProgress(mutator) {
      const save = this.getSave ? this.getSave() : {};
      return mutator(save);
    },
    getCurrentMode() {
      return route === 'path' ? 'challenge' : 'quick';
    },
    getUiRoute() {
      return route;
    },
    getUiRouteFrom() {
      return 'home';
    },
    getCurrentLocale() {
      return 'ja';
    },
    getMusicEnabled() {
      return true;
    },
    getSfxEnabled() {
      return true;
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
    getHomePreviewTopId() {
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

  return { tools, document };
}

function checkRubyRendering() {
  const quickScenario = createRubyTools('quick');
  quickScenario.tools.updateModeUI();

  assert(quickScenario.document.getElementById('featured-top-name').innerHTML.indexOf('<ruby') >= 0, 'Expected featured top name to render ruby markup in ja.');
  assert(quickScenario.document.getElementById('featured-top-name').innerHTML.indexOf('せきしょうほう') >= 0, 'Expected featured top name ruby to include the top reading.');
  assert(quickScenario.document.getElementById('home-top-name').innerHTML.indexOf('<ruby') >= 0, 'Expected home top name to render ruby markup in ja.');
  assert(quickScenario.document.getElementById('quick-selected-top-name').innerHTML.indexOf('<ruby') >= 0, 'Expected quick selected top name to render ruby markup in ja.');
  assert(quickScenario.document.getElementById('quick-arena-name').innerHTML.indexOf('<ruby') >= 0, 'Expected quick arena name to render ruby markup in ja.');

  const pathScenario = createRubyTools('path');
  pathScenario.tools.updateModeUI();

  assert(pathScenario.document.getElementById('challenge-rank-note').innerHTML.indexOf('<ruby') >= 0, 'Expected road-rank reward note to render ruby markup for reward top names in ja.');
  assert(pathScenario.document.getElementById('challenge-current-top-name').innerHTML.indexOf('<ruby') >= 0, 'Expected challenge current top name to render ruby markup in ja.');
}

function main() {
  checkJapaneseContentReadings();
  checkRubyRendering();

  if (failures.length) {
    console.error('Japanese ruby check failed:');
    failures.forEach((message) => console.error(`- ${message}`));
    process.exit(1);
  }

  console.log('Japanese ruby check passed.');
}

main();
