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

function createElement() {
  const classes = new Set();
  const element = {
    disabled: false,
    style: {},
    dataset: {},
    classList: {
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
    }
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
      textContent = innerHTML.replace(/<[^>]*>/g, '');
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
    querySelector(selector) {
      if (!selectors.has(selector)) {
        selectors.set(selector, createElement());
      }
      return selectors.get(selector);
    },
    querySelectorAll() {
      return [];
    }
  };
}

function checkIndexHtml() {
  const html = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
  assert(
    html.includes('./src/config-road-ranks.js'),
    'Expected index.html to load src/config-road-ranks.js.'
  );
  ['challenge-rank-title', 'challenge-rank-0', 'challenge-rank-1', 'challenge-rank-2', 'challenge-rank-note'].forEach((id) => {
    assert(html.includes(`id="${id}"`), `Expected index.html to define #${id}.`);
  });
  assert(
    html.includes("__spinClashInvoke('setRoadRank',0)")
      && html.includes("__spinClashInvoke('setRoadRank',1)")
      && html.includes("__spinClashInvoke('setRoadRank',2)"),
    'Expected index.html to expose clickable Road Rank controls.'
  );
  assert(
    html.includes("__spinClashInvoke('selectChallengeNode'")
      || fs.readFileSync(path.join(repoRoot, 'src', 'loadout-ui-tools.js'), 'utf8').includes("selectChallengeNode"),
    'Expected challenge route node markers to expose a selectChallengeNode action.'
  );
}

function checkUiEntryToolsAction() {
  const text = fs.readFileSync(path.join(repoRoot, 'src', 'ui-entry-tools.js'), 'utf8');
  assert(
    /setRoadRank\s*:/.test(text) || /\bsetRoadRank\b/.test(text),
    'Expected src/ui-entry-tools.js to expose a setRoadRank UI action.'
  );
}

function checkLoadoutUiTools() {
  const context = vm.createContext({
    console,
    window: {},
    document: createDocument()
  });
  context.window = context;
  context.SpinClash = {};

  loadScript(path.join('src', 'loadout-ui-tools.js'), context);

  const state = {
    selectedRoadRankIndex: 1
  };
  const analyticsEvents = [];
  const roadRanks = [
    { id: 'rank_i', label: 'RANK I', rewardMul: 1, description: 'Base championship tuning.' },
    { id: 'rank_ii', label: 'RANK II', rewardMul: 1.2, description: 'Sharper enemies and a measured reward bonus.' },
    { id: 'rank_iii', label: 'RANK III', rewardMul: 1.38, description: 'Final road pressure.' }
  ];

  const tools = context.SpinClash.createLoadoutUiTools({
    uiText: {
      challengeSubtitle: 'CHAMPIONSHIP PATH',
      quickBattleSubtitle: 'QUICK BATTLE',
      challengeButton: 'ENTER PATH',
      fightButton: 'START MATCH',
      loadoutHintChallenge: 'Path hint',
      loadoutHintQuick: 'Quick hint',
      challengeLocked: 'LOCKED',
      challengeComplete: 'COMPLETE',
      currencyLabel: 'SCRAP',
      roadRankTitle: 'ROAD RANK',
      roadRankLocked: 'LOCKED',
      roadRankHint: 'Select a higher rank for stronger enemies and better rewards.'
    },
    tops: [],
    arenas: [],
    researchTracks: [],
    modifiers: { standard: { id: 'standard', label: 'STANDARD', description: 'No rules.' } },
    enemyPresets: {},
    challengeRoad: [
      {
        id: 'node-1',
        name: 'Qualifier',
        chapterId: 'qualifier',
        chapterLabel: 'QUALIFIER',
        previewLabel: 'OPENING',
        previewDesc: 'Stable opener.',
        arenaIndex: 0,
        modifierId: 'standard',
        reward: 20
      }
    ],
    roadRanks,
    getSave() {
      return {
        currency: 0,
        unlocks: { arenas: [], tops: [] },
        challenge: {
          unlockedNodeIndex: 9,
          checkpointNodeIndex: 5,
          completedNodes: [0, 1, 2, 3, 4, 5, 6, 7, 8],
          unlockedRankIndex: 1,
          selectedRankIndex: 1,
          rankProgress: {
            0: { unlockedNodeIndex: 9, checkpointNodeIndex: 5, completedNodes: [0, 1, 2, 3, 4, 5, 6, 7, 8], lastNodeIndex: 8 },
            1: { unlockedNodeIndex: 0, checkpointNodeIndex: 0, completedNodes: [], lastNodeIndex: null }
          }
        }
      };
    },
    saveProgress(mutator) {
      return mutator(this.getSave ? this.getSave() : {});
    },
    getCurrentMode() {
      return 'challenge';
    },
    analyticsService: {
      track(name, payload) {
        analyticsEvents.push({ name, payload });
      }
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
      return 1;
    },
    getSelectedRoadRankIndex() {
      return state.selectedRoadRankIndex;
    },
    getRoadRankProgress(index) {
      const progress = {
        0: { unlockedNodeIndex: 9, checkpointNodeIndex: 5, completedNodes: [0, 1, 2, 3, 4, 5, 6, 7, 8], lastNodeIndex: 8 },
        1: { unlockedNodeIndex: 0, checkpointNodeIndex: 0, completedNodes: [], lastNodeIndex: null }
      };
      return progress[index] || { unlockedNodeIndex: 0, checkpointNodeIndex: 0, completedNodes: [] };
    },
    getRoadRankProgressIndex(index) {
      const progress = {
        0: { unlockedNodeIndex: 9 },
        1: { unlockedNodeIndex: 0 }
      };
      return progress[index] ? progress[index].unlockedNodeIndex : 0;
    },
    setSelectedRoadRankIndex(index) {
      state.selectedRoadRankIndex = index;
      return index;
    },
    setCurrentArena() {},
    rewardService: null,
    showMsg() {},
    refresh() {}
  });

  assert(typeof tools.selectRoadRank === 'function', 'Expected loadout UI tools to expose selectRoadRank.');

  tools.updateModeUI();

  const rank0 = context.document.getElementById('challenge-rank-0');
  const rank1 = context.document.getElementById('challenge-rank-1');
  const rank2 = context.document.getElementById('challenge-rank-2');
  const note = context.document.getElementById('challenge-rank-note');
  const progress = context.document.getElementById('challenge-progress');

  assert(rank0.disabled === false, 'Expected Rank I button to be enabled.');
  assert(rank1.disabled === false, 'Expected Rank II button to be enabled once unlocked.');
  assert(rank2.disabled === true, 'Expected Rank III button to stay disabled while locked.');
  assert(note.textContent.indexOf('RANK II') >= 0, 'Expected rank note to describe the selected rank.');
  assert(progress.textContent.indexOf('RANK II') >= 0, 'Expected challenge progress line to surface the selected rank.');
  assert(
    context.document.getElementById('challenge-route-strip').innerHTML.indexOf('<button') >= 0,
    'Expected road route nodes to render as buttons so unlocked nodes can be replayed.'
  );
  assert(
    context.document.getElementById('challenge-route-strip').innerHTML.indexOf('class="route-node current"') >= 0,
    'Expected selected Rank II to display node 1 as current instead of inheriting Rank I final-node progress.'
  );

  tools.selectRoadRank(0);
  assert(state.selectedRoadRankIndex === 0, 'Expected selectRoadRank to delegate rank selection.');
  const selectEvent = analyticsEvents.find((event) => event.name === 'road_rank_select');
  assert(selectEvent, 'Expected selectRoadRank to emit road_rank_select analytics.');
  assert(selectEvent.payload.fromRankIndex === 1, 'Expected road_rank_select to preserve fromRankIndex.');
  assert(selectEvent.payload.toRankIndex === 0, 'Expected road_rank_select to preserve toRankIndex.');
  assert(selectEvent.payload.toRankId === 'rank_i', 'Expected road_rank_select to preserve toRankId.');
  assert(selectEvent.payload.mode === 'challenge', 'Expected road_rank_select to preserve mode.');
}

function main() {
  checkIndexHtml();
  checkUiEntryToolsAction();
  checkLoadoutUiTools();
  console.log('Road rank UI check passed.');
}

try {
  main();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
