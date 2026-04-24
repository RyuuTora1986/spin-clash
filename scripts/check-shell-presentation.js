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
    querySelectorAll(selector) {
      if (selector === '.card' || selector === '.arena-opt') {
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

function createBaseContext() {
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

function checkIndexHtml() {
  const html = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
  [
    'home-hero-panel',
    'home-command-panel',
    'title-progress',
    'btn-enter-quick',
    'btn-enter-workshop',
    'btn-enter-settings',
    'btn-home-top-prev',
    'btn-home-top-next',
    'home-top-stage',
    'home-top-kicker',
    'home-top-name',
    'home-top-count',
    'home-top-type',
    'home-top-skill',
    'home-top-traits',
    'quick-battle-panel',
    'quick-ready-band',
    'btn-quick-arena-prev',
    'btn-quick-arena-next',
    'quick-arena-stage',
    'quick-arena-kicker',
    'quick-arena-name',
    'quick-arena-status',
    'quick-arena-desc',
    'quick-selected-top-stage',
    'quick-selected-top-kicker',
    'quick-selected-top-name',
    'quick-selected-top-status',
    'quick-start-hint',
    'btn-route-back',
    'featured-top-name',
    'featured-top-skill',
    'featured-top-traits',
    'challenge-route-strip',
    'settings-panel',
    'settings-language-label',
    'settings-music-label',
    'settings-sfx-label',
    'locale-settings-switcher',
    'btn-settings-music',
    'btn-settings-sfx',
    'act-guard',
    'guard-icon',
    'guard-name',
    'guard-state',
    'guard-cd',
    'guard-cd-txt',
    'dash-state',
    'skill-state',
    'battle-intro',
    'battle-intro-title',
    'battle-intro-meta',
    'mt-breakdown',
    'mt-next'
  ].forEach((id) => {
    assert(html.includes(`id="${id}"`), `Expected index.html to define #${id}.`);
  });

  assert(
    html.includes("__spinClashInvoke('goPath')")
      && html.includes("__spinClashInvoke('goQuick')")
      && html.includes("__spinClashInvoke('goWorkshop')")
      && html.includes("__spinClashInvoke('goSettings')")
      && html.includes("__spinClashInvoke('homeTopAction')")
      && html.includes("__spinClashInvoke('quickTopAction')")
      && html.includes("__spinClashInvoke('prevHomeTop')")
      && html.includes("__spinClashInvoke('nextHomeTop')")
      && html.includes("__spinClashInvoke('prevQuickArena')")
      && html.includes("__spinClashInvoke('nextQuickArena')"),
    'Expected index.html to expose explicit shell route title actions.'
  );
}

function checkUiActions() {
  const text = fs.readFileSync(path.join(repoRoot, 'src', 'ui-entry-tools.js'), 'utf8');
  assert(text.includes('enterQuickBattle'), 'Expected ui-entry-tools to expose enterQuickBattle.');
  assert(text.includes('enterWorkshop'), 'Expected ui-entry-tools to expose enterWorkshop.');
  assert(text.includes('doPlayerGuard'), 'Expected ui-entry-tools to expose doPlayerGuard binding.');
  assert(text.includes('prevQuickArena'), 'Expected ui-entry-tools to expose prevQuickArena.');
  assert(text.includes('nextQuickArena'), 'Expected ui-entry-tools to expose nextQuickArena.');
}

function checkTitleOverlaySafeAreaContract() {
  const css = fs.readFileSync(path.join(repoRoot, 'css', 'game.css'), 'utf8');
  const titleBlockMatch = css.match(/#ov-title\s*\{[^}]+\}/);
  assert(titleBlockMatch, 'Expected game.css to define a dedicated #ov-title layout block.');
  const titleBlock = titleBlockMatch[0];

  assert(
    titleBlock.includes('padding-top') || titleBlock.includes('padding-top:'),
    'Expected #ov-title to reserve explicit top spacing for the storage notice / safe area.'
  );
}

function checkLoadoutOverlaySafeAreaContract() {
  const css = fs.readFileSync(path.join(repoRoot, 'css', 'game.css'), 'utf8');
  const loadoutBlockMatch = css.match(/#ov-loadout\s*\{[^}]+\}/);
  assert(loadoutBlockMatch, 'Expected game.css to define a dedicated #ov-loadout layout block.');
  const loadoutBlock = loadoutBlockMatch[0];

  assert(
    loadoutBlock.includes('padding-top'),
    'Expected #ov-loadout to reserve explicit top spacing for the storage notice / safe area.'
  );
  assert(
    loadoutBlock.includes('justify-content:flex-start'),
    'Expected #ov-loadout to top-anchor the shell stack so long route pages do not push headings under the storage notice.'
  );
}

function checkShortViewportTitleCompressionContract() {
  const css = fs.readFileSync(path.join(repoRoot, 'css', 'game.css'), 'utf8');
  const shortViewportMatch = css.match(/@media\(max-height:900px\)\s*\{[\s\S]*?\n\}/);
  assert(shortViewportMatch, 'Expected game.css to define a short-viewport title compression block.');
  const shortViewportBlock = shortViewportMatch[0];

  assert(
    shortViewportBlock.includes('.home-top-stage-shell') && shortViewportBlock.includes('height:220px'),
    'Expected the short-viewport title compression block to give the home showcase stage an explicit reduced height.'
  );
}

function checkHeroAndQuickBandContracts() {
  const html = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(repoRoot, 'css', 'game.css'), 'utf8');

  assert(
    html.includes('id="home-hero-panel"') && html.includes('id="home-command-panel"'),
    'Expected Home to define a dedicated hero wrapper that binds command UI and showcase into one composition.'
  );
  assert(
    html.includes('id="quick-ready-band"'),
    'Expected Quick Battle to define a dedicated decision band wrapper for the selected top and launch CTA.'
  );
  assert(
    css.includes('.home-hero-panel') && css.includes('.home-command-panel'),
    'Expected game.css to define layout rules for the new Home hero composition.'
  );
  assert(
    css.includes('.quick-ready-band'),
    'Expected game.css to define layout rules for the Quick Battle decision band.'
  );
}

function checkQuickBattlePreviewSourceContract() {
  const previewText = fs.readFileSync(path.join(repoRoot, 'src', 'quick-battle-preview-tools.js'), 'utf8');
  const mainText = fs.readFileSync(path.join(repoRoot, 'src', 'main.js'), 'utf8');

  assert(
    previewText.includes('arenaMathTools.HEART_PTS'),
    'Expected quick battle heart preview to reuse the runtime heart arena point set instead of a separate bespoke shape.'
  );
  assert(
    !previewText.includes('function createHeartShape('),
    'Expected quick battle heart preview to stop maintaining a separate custom heart-shape generator.'
  );
  assert(
    mainText.includes('arenaMathTools,'),
    'Expected main.js to pass arenaMathTools into quick battle preview tools.'
  );
  assert(
    previewText.includes('lockedHexTopPlate') && previewText.includes('lockedHexInsetLine'),
    'Expected the locked hex quick-battle preview to define an explicit top plate and inset line so the locked silhouette stays readable.'
  );
}

function checkLoadoutPresentation() {
  const { context, document } = createBaseContext();
  loadScript('src/loadout-ui-tools.js', context);

  let selectedRoadRankIndex = 1;
  const tools = context.SpinClash.createLoadoutUiTools({
    uiText: {
      challengeSubtitle: 'CHAMPIONSHIP PATH',
      quickBattleSubtitle: 'QUICK BATTLE',
      challengeButton: 'ENTER PATH',
      fightButton: 'START MATCH',
      challengeLocked: 'LOCKED',
      challengeComplete: 'COMPLETE',
      challengePreviewLabel: 'NEXT DUEL',
      featuredTopTitle: 'SELECTED TOP',
      featuredTraitsTitle: 'TRACK TRAITS',
      homeTopTitle: 'CURRENT TOP',
      homeTopUnlocked: 'UNLOCKED',
      homeTopLocked: 'LOCKED',
      homeTopLockedSkill: 'Silhouette only. Full ability data unlocks later.',
      homeTopLockedHint: 'Unlock this top on the path or in the workshop.',
      homeTopPrev: '<',
      homeTopNext: '>',
      homeTopEmpty: 'Choose an unlocked top to preview its strengths.',
      roadRankTitle: 'ROAD RANK',
      roadRankHint: 'Select a higher rank.',
      currencyLabel: 'SCRAP',
      settingsLanguageLabel: 'LANGUAGE',
      settingsMusicLabel: 'MUSIC',
      settingsSfxLabel: 'SFX',
      settingsToggleOn: 'ON',
      settingsToggleOff: 'OFF',
      challengeArenaInfo: 'Arena {value}',
      challengeEnemyInfo: 'Enemy {value}',
      challengeRuleInfo: 'Rule {value}',
      challengeRewardInfo: 'Reward {value}',
      challengeFirstClearInfo: 'First Clear +{value}',
      challengeRankInfo: '{rank} x{multiplier}',
      challengeCheckpointInfo: 'Checkpoint on clear',
      cards: [
        {
          icon: 'I',
          type: 'IMPACT',
          stats: 'HP 80',
          skill: 'FLY CHARGE',
          pitch: 'Aggressive line breaker.',
          traits: ['Burst opener', 'Fast contact']
        },
        {
          icon: 'T',
          type: 'TRICK',
          stats: 'HP 70',
          skill: 'PHANTOM',
          pitch: 'Edge hunter.',
          traits: ['High drift', 'Low stability']
        }
      ]
    },
    tops: [
      {
        id: 'impact',
        name: 'Impact',
        unlockCost: 0,
        skill: 'Fly Charge',
        family: 'impact',
        variant: 'base'
      },
      {
        id: 'trick',
        name: 'Trick',
        unlockCost: 90,
        skill: 'Phantom',
        family: 'trick',
        variant: 'base'
      }
    ],
    arenas: [
      { id: 'circle_bowl', label: 'CIRCLE BOWL', unlockCost: 0 }
    ],
    researchTracks: [],
    roadRanks: [
      { id: 'rank_i', label: 'RANK I', rewardMul: 1, description: 'Base tuning.' },
      { id: 'rank_ii', label: 'RANK II', rewardMul: 1.25, description: 'Sharper enemies.' },
      { id: 'rank_iii', label: 'RANK III', rewardMul: 1.5, description: 'Final pressure.' }
    ],
    modifiers: {
      standard: { id: 'standard', label: 'STANDARD', description: 'No rules.' }
    },
    enemyPresets: {
      impact_blitz: { id: 'impact_blitz', label: 'IMPACT BLITZ', topId: 'impact' }
    },
    challengeRoad: [
      {
        id: 'node-4',
        name: 'Arena Circuit',
        chapterId: 'arena_circuit',
        chapterLabel: 'ARENA CIRCUIT',
        previewLabel: 'BOSS GATE',
        previewDesc: 'Pressure test.',
        arenaIndex: 0,
        modifierId: 'standard',
        enemyPresetId: 'impact_blitz',
        reward: 40,
        firstClearBonus: 15,
        checkpointOnClear: true
      }
    ],
    getSave() {
      return {
        currency: 120,
        unlocks: { arenas: ['circle_bowl'], tops: ['impact'] },
        challenge: {
          unlockedNodeIndex: 0,
          checkpointNodeIndex: 0,
          completedNodes: [],
          unlockedRankIndex: 1,
          selectedRankIndex: selectedRoadRankIndex
        }
      };
    },
    saveProgress(mutator) {
      const save = this.getSave ? this.getSave() : {};
      return mutator(save);
    },
    getResearchLevel() {
      return 0;
    },
    getResearchBonuses() {
      return { hpMul: 1, maxSpinMul: 1, brateMul: 1 };
    },
    buyResearchLevel() {
      return { ok: false, reason: 'unavailable' };
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
    getHomePreviewTopId() {
      return 1;
    },
    getSessionTrialArenaIds() {
      return new Set();
    },
    getUnlockedRoadRankIndex() {
      return 1;
    },
    getSelectedRoadRankIndex() {
      return selectedRoadRankIndex;
    },
    setSelectedRoadRankIndex(index) {
      selectedRoadRankIndex = index;
      return index;
    },
    setCurrentArena() {},
    rewardService: null,
    showMsg() {},
    refresh() {}
  });

  tools.updateModeUI();

  assert(
    document.getElementById('featured-top-name').textContent.indexOf('Impact') >= 0,
    'Expected loadout presentation to surface the selected top name.'
  );
  assert(
    document.getElementById('featured-top-skill').textContent.indexOf('Aggressive line breaker.') >= 0,
    'Expected loadout presentation to surface the selected top pitch.'
  );
  assert(
    document.getElementById('featured-top-traits').textContent.indexOf('Burst opener') >= 0,
    'Expected loadout presentation to surface selected top traits.'
  );
  assert(
    document.getElementById('home-top-name').textContent.indexOf('Trick') >= 0,
    'Expected home presentation to surface the current preview top name, including locked tops.'
  );
  assert(
    document.getElementById('home-top-count').textContent.indexOf('/') === -1,
    'Expected home presentation status to stop rendering unlocked counts.'
  );
  assert(
    document.getElementById('home-top-count').textContent.indexOf('LOCKED') >= 0,
    'Expected home presentation to surface lock state for a locked preview top.'
  );
  assert(
    document.getElementById('home-top-skill').textContent.indexOf('Silhouette only') >= 0,
    'Expected locked home preview to hide full skill text behind teaser copy.'
  );
  assert(
    document.getElementById('home-top-traits').textContent.indexOf('Unlock this top') >= 0,
    'Expected locked home preview to surface unlock guidance instead of full pitch.'
  );
  assert(
    document.getElementById('btn-enter').disabled === true,
    'Expected home path entry to disable when the previewed top is locked.'
  );
  assert(
    document.getElementById('btn-enter-quick').disabled === true,
    'Expected home quick entry to disable when the previewed top is locked.'
  );
  assert(
    document.getElementById('challenge-route-strip').innerHTML.indexOf('route-node') >= 0,
    'Expected challenge route strip to render node markers.'
  );
}

function checkSettingsPresentation() {
  const { context, document } = createBaseContext();
  loadScript('src/loadout-ui-tools.js', context);

  const tools = context.SpinClash.createLoadoutUiTools({
    uiText: {
      settingsLanguageLabel: 'LANGUAGE',
      settingsMusicLabel: 'MUSIC',
      settingsSfxLabel: 'SFX',
      settingsToggleOn: 'ON',
      settingsToggleOff: 'OFF',
      fightButton: 'START MATCH',
      challengeButton: 'ENTER PATH',
      quickMode: 'QUICK BATTLE',
      challengeMode: 'CHAMPIONSHIP PATH',
      featuredTopTitle: 'SELECTED TOP',
      featuredTraitsTitle: 'TRACK TRAITS',
      currencyLabel: 'SCRAP'
    },
    tops: [],
    arenas: [],
    researchTracks: [],
    roadRanks: [],
    modifiers: {},
    enemyPresets: {},
    challengeRoad: [],
    getSave() {
      return {
        currency: 0,
        unlocks: { arenas: [], tops: [] },
        challenge: { unlockedNodeIndex: 0, checkpointNodeIndex: 0, completedNodes: [] }
      };
    },
    saveProgress(mutator) {
      const save = this.getSave ? this.getSave() : {};
      return mutator(save);
    },
    getCurrentMode() {
      return 'quick';
    },
    getUiRoute() {
      return 'settings';
    },
    getUiRouteFrom() {
      return 'quick';
    },
    getCurrentLocale() {
      return 'en';
    },
    getMusicEnabled() {
      return false;
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

  assert(
    document.getElementById('settings-language-label').textContent === 'LANGUAGE',
    'Expected settings presentation to render a formal language label.'
  );
  assert(
    document.getElementById('settings-music-label').textContent === 'MUSIC',
    'Expected settings presentation to render a formal music label.'
  );
  assert(
    document.getElementById('settings-sfx-label').textContent === 'SFX',
    'Expected settings presentation to render a formal SFX label.'
  );
  assert(
    document.getElementById('btn-settings-music').textContent === 'OFF',
    'Expected settings presentation to render route-aware music toggle text.'
  );
  assert(
    document.getElementById('btn-settings-sfx').textContent === 'ON',
    'Expected settings presentation to render route-aware SFX toggle text.'
  );
}

function checkQuickBattlePresentation() {
  function renderQuickBattleScenario(config) {
    const { context, document } = createBaseContext();
    loadScript('src/loadout-ui-tools.js', context);
    const tools = context.SpinClash.createLoadoutUiTools({
      uiText: {
        quickMode: 'QUICK BATTLE',
        challengeMode: 'CHAMPIONSHIP PATH',
        fightButton: 'START MATCH',
        challengeButton: 'ENTER PATH',
        loadoutHintQuick: 'Choose an arena. Your top comes from Home.',
        loadoutHintChallenge: 'Challenge hint',
        featuredTopTitle: 'SELECTED TOP',
        featuredTraitsTitle: 'TRACK TRAITS',
        currencyLabel: 'SCRAP',
        lockedTop: 'LOCKED',
        quickArenaTitle: 'SELECTED ARENA',
        quickArenaUnlocked: 'UNLOCKED',
        quickArenaLocked: 'LOCKED',
        quickArenaDescriptions: {
          heart_bowl: 'Heart bowl that exaggerates angle pressure and edge decisions.',
          hex_bowl: 'Hex bowl with harsher rebounds and tighter escape lanes.'
        },
        quickTopTitle: 'DEPLOYED TOP',
        topSourceStarter: 'STARTER',
        quickTopOwnedStarterHint: 'Ready from start',
        quickTopLockedHint: 'Locked tops cannot enter quick battle.',
        quickStartBlockedHint: 'You cannot enter battle with a locked top.',
        quickStartBlockedButton: 'TOP LOCKED',
        quickStartReadyHint: 'Arena selected. Start when ready.',
        quickStartArenaLockedHint: 'Start to unlock this arena or activate a trial.',
        quickStartArenaUnlockButton: 'UNLOCK + START',
        quickStartArenaUnlockHint: 'Spend {cost} SCRAP to unlock this arena, then begin immediately.',
        quickStartArenaTrialButton: 'WATCH AD TRIAL',
        quickStartArenaTrialHint: 'SCRAP is short. Watch an ad to activate a session trial for this arena.',
        homeTopTitle: 'CURRENT TOP',
        homeTopUnlocked: 'UNLOCKED',
        homeTopLocked: 'LOCKED',
        homeTopLockedSkill: 'Silhouette only. Full ability data unlocks later.',
        homeTopLockedHint: 'Unlock this top on the path or in the workshop.',
        homeTopPrev: '<',
        homeTopNext: '>',
        homeTopEmpty: 'Choose an unlocked top to preview its strengths.'
      },
      tops: [
        { id: 'impact', name: 'Impact', unlockCost: 0, family: 'impact', unlockSource: 'starter' },
        { id: 'trick', name: 'Trick', unlockCost: 90, family: 'trick' }
      ],
      arenas: [
        { id: 'circle_bowl', label: 'CIRCLE BOWL', unlockCost: 0, type: 'circle' },
        { id: 'heart_bowl', label: 'HEART BOWL', unlockCost: 0, type: 'heart' },
        { id: 'hex_bowl', label: 'HEX BOWL', unlockCost: 120, type: 'hex' }
      ],
      researchTracks: [],
      roadRanks: [],
      modifiers: {},
      enemyPresets: {},
      challengeRoad: [],
      getSave() {
        return {
          currency: config.currency,
          unlocks: { arenas: ['circle_bowl', 'heart_bowl'], tops: config.unlockedTops || ['impact'] },
          challenge: { unlockedNodeIndex: 0, checkpointNodeIndex: 0, completedNodes: [] }
        };
      },
      saveProgress(mutator) {
        const save = this.getSave ? this.getSave() : {};
        return mutator(save);
      },
      getResearchLevel() {
        return 0;
      },
      getResearchBonuses() {
        return { hpMul: 1, maxSpinMul: 1, brateMul: 1 };
      },
      buyResearchLevel() {
        return { ok: false, reason: 'unavailable' };
      },
      getCurrentMode() {
        return 'quick';
      },
      getUiRoute() {
        return 'quick';
      },
      getUiRouteFrom() {
        return 'home';
      },
      getCurrentLocale() {
        return 'en';
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
        return config.arenaIndex;
      },
      getPlayerTopId() {
        return config.topIndex;
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
      isRewardPlacementAvailable(placement) {
        return { available: placement === 'trial_unlock_arena' };
      },
      showMsg() {},
      refresh() {}
    });

    tools.updateModeUI();
    return document;
  }

  const blockedDocument = renderQuickBattleScenario({
    currency: 50,
    arenaIndex: 1,
    topIndex: 1
  });

  assert(
    blockedDocument.getElementById('quick-arena-name').textContent.indexOf('HEART BOWL') >= 0,
    'Expected quick battle presentation to surface the selected arena name.'
  );
  assert(
    blockedDocument.getElementById('quick-arena-desc').textContent.indexOf('Heart bowl') >= 0,
    'Expected quick battle presentation to surface arena description copy.'
  );
  assert(
    blockedDocument.getElementById('quick-selected-top-name').textContent.indexOf('Trick') >= 0,
    'Expected quick battle presentation to surface the deployed top name.'
  );
  assert(
    blockedDocument.getElementById('quick-selected-top-status').textContent.indexOf('LOCKED') >= 0,
    'Expected quick battle presentation to surface a concise selected-top state badge for locked tops.'
  );
  assert(
    blockedDocument.getElementById('quick-start-hint').textContent.indexOf('locked top') >= 0,
    'Expected quick battle presentation to explain why a locked top cannot start.'
  );
  assert(
    blockedDocument.getElementById('btn-fight').disabled === true,
    'Expected quick battle start to be disabled when the deployed top is locked.'
  );
  assert(
    blockedDocument.querySelector('.cards').style.display === 'none',
    'Expected Quick Battle to hide the old bottom top-card strip so it cannot be clipped on phones.'
  );

  const starterDocument = renderQuickBattleScenario({
    currency: 0,
    arenaIndex: 0,
    topIndex: 0
  });
  const starterLines = [
    starterDocument.getElementById('quick-selected-top-status').textContent,
    starterDocument.getElementById('quick-selected-top-source').textContent,
    starterDocument.getElementById('quick-selected-top-requirement').textContent
  ].map((value) => value.trim().toLowerCase()).filter(Boolean);
  assert(
    new Set(starterLines).size === starterLines.length,
    'Expected Quick Battle selected-top panel to suppress duplicated status/source/requirement copy.'
  );

  const unlockDocument = renderQuickBattleScenario({
    currency: 140,
    arenaIndex: 2,
    topIndex: 0
  });

  assert(
    unlockDocument.getElementById('btn-fight').textContent === 'UNLOCK + START',
    'Expected locked arena CTA to switch to an explicit unlock-and-start button when SCRAP is sufficient.'
  );
  assert(
    unlockDocument.getElementById('quick-start-hint').textContent.indexOf('120 SCRAP') >= 0,
    'Expected locked arena purchase hint to surface the exact unlock cost.'
  );
  assert(
    unlockDocument.getElementById('btn-fight').disabled === false,
    'Expected arena unlock CTA to remain clickable when the top is available.'
  );

  const trialDocument = renderQuickBattleScenario({
    currency: 50,
    arenaIndex: 2,
    topIndex: 0
  });

  assert(
    trialDocument.getElementById('btn-fight').textContent === 'WATCH AD TRIAL',
    'Expected locked arena CTA to switch to an explicit ad-trial button when SCRAP is insufficient.'
  );
  assert(
    trialDocument.getElementById('quick-start-hint').textContent.indexOf('session trial') >= 0,
    'Expected locked arena trial hint to explain the session-trial behavior.'
  );
  assert(
    trialDocument.getElementById('btn-fight').disabled === false,
    'Expected trial CTA to stay clickable when the top itself is unlocked.'
  );
}

function checkBattleHudPresentation() {
  const { context, document } = createBaseContext();
  loadScript('src/ui-shell-tools.js', context);

  const state = {
    score: [1, 0],
    playerTopId: 0,
    tp: {
      hp: 18,
      maxHp: 100,
      spin: 12,
      maxSpin: 100,
      burst: 100,
      guarding: false,
      dashCD: 0,
      DASH_CD: 2.5,
      skillCD: 0,
      SKILL_CD: 8,
      template: { name: 'Impact', skill: 'Fly Charge' }
    },
    te: {
      hp: 24,
      maxHp: 100,
      spin: 16,
      maxSpin: 100,
      burst: 100,
      guarding: true,
      dashCD: 1,
      DASH_CD: 2.5,
      skillCD: 0,
      SKILL_CD: 8,
      template: { name: 'Armor', skill: 'Fortress Pulse' }
    }
  };

  const tools = context.SpinClash.createUiShellTools({
    uiText: {
      skillLabels: { 'Fly Charge': 'Fly Charge' },
      playerRole: 'YOU',
      enemyRole: 'CPU',
      statusReady: 'READY',
      statusGuarding: 'GUARD',
      hintActive: 'SPACE to dash | E to guard | Q to use your burst skill.',
      hintSkillReady: 'Q READY',
      hintAim: 'Drag to aim, then release to launch.'
    },
    tops: [
      { id: 'impact', skill: 'Fly Charge' }
    ],
    signatureSkills: {
      'Fly Charge': {
        icon: 'FC',
        hudAccent: {
          chargeStroke: 'rgba(255,170,0,0.58)',
          readyStroke: 'rgba(255,210,0,0.9)',
          readyHintColor: '#ffd257'
        }
      },
      'Fortress Pulse': { icon: 'FP' }
    },
    getGameState() {
      return 'active';
    },
    getSelectedArenaIndex() {
      return 0;
    },
    getScore() {
      return state.score;
    },
    getPlayerTopId() {
      return state.playerTopId;
    },
    getTp() {
      return state.tp;
    },
    getTe() {
      return state.te;
    }
  });

  assert(typeof tools.showBattleIntro === 'function', 'Expected ui-shell-tools to expose showBattleIntro.');

  tools.updateSkillIcon();
  tools.updateHUD();
  tools.showBattleIntro({
    playerTopLabel: 'Impact',
    enemyTopLabel: 'Armor',
    arenaLabel: 'HEX BOWL',
    roadRankLabel: 'RANK II'
  });

  assert(
    document.getElementById('battle-intro-title').textContent.indexOf('Impact') >= 0,
    'Expected battle intro to render player top label.'
  );
  assert(
    document.getElementById('battle-intro-meta').textContent.indexOf('HEX BOWL') >= 0,
    'Expected battle intro to render arena metadata.'
  );
  assert(
    document.getElementById('sk-icon').textContent === 'FC',
    'Expected battle HUD skill icon to resolve from the signature registry path.'
  );
  assert(
    document.getElementById('hint-bar').textContent.indexOf('Q READY') >= 0,
    'Expected battle HUD to surface a skill-ready hint when burst is full.'
  );
  assert(
    document.getElementById('hint-bar').style.color === '#ffd257',
    'Expected battle HUD ready hint to adopt the signature accent color.'
  );
  assert(
    document.querySelector('#burst-ring circle').style.stroke === 'rgba(255,210,0,0.9)',
    'Expected battle HUD ready ring to adopt the signature ready accent.'
  );
  assert(
    document.getElementById('p-role').textContent.indexOf('READY') >= 0,
    'Expected player HUD role label to surface READY status.'
  );
  assert(
    document.getElementById('e-role').textContent.indexOf('GUARD') >= 0,
    'Expected enemy HUD role label to surface GUARD status.'
  );
}

function checkMobileBattleHudTopRailContract() {
  const css = fs.readFileSync(path.join(repoRoot, 'css', 'game.css'), 'utf8');
  const mobilePortraitMatch = css.match(/@media\(max-width:540px\) and \(orientation:portrait\)\{[\s\S]*?\n\}/);
  assert(mobilePortraitMatch, 'Expected game.css to define a mobile portrait battle HUD contract block.');
  const mobilePortraitBlock = mobilePortraitMatch[0];

  assert(
    mobilePortraitBlock.includes('#p-panel{') && mobilePortraitBlock.includes('top:')
      && mobilePortraitBlock.includes('bottom:auto'),
    'Expected the mobile portrait HUD contract to move the player status panel into a top rail position.'
  );
  assert(
    mobilePortraitBlock.includes('#e-panel{') && mobilePortraitBlock.includes('top:')
      && mobilePortraitBlock.includes('bottom:auto'),
    'Expected the mobile portrait HUD contract to move the enemy status panel into a top rail position.'
  );
  assert(
    mobilePortraitBlock.includes('#skill-panel{')
      && mobilePortraitBlock.includes('left:50%')
      && mobilePortraitBlock.includes('bottom:max('),
    'Expected the mobile portrait HUD contract to keep the skill cluster in the bottom action zone.'
  );
  assert(
    mobilePortraitBlock.includes('#act-swap{') && mobilePortraitBlock.includes('top:auto'),
    'Expected the mobile portrait HUD contract to relocate the swap control away from the top-corner status rails.'
  );
}

function checkMobileRoundResultTakeoverContract() {
  const css = fs.readFileSync(path.join(repoRoot, 'css', 'game.css'), 'utf8');
  const mobilePortraitMatch = css.match(/@media\(max-width:540px\) and \(orientation:portrait\)\{[\s\S]*?\n\}/);
  assert(mobilePortraitMatch, 'Expected game.css to define a mobile portrait result contract block.');
  const mobilePortraitBlock = mobilePortraitMatch[0];

  function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function getMobilePortraitRuleBlock(selectors) {
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];
    const pattern = new RegExp(
      selectorList.map(escapeRegex).join('\\s*,\\s*') + '\\s*\\{[\\s\\S]*?\\}',
      'm'
    );
    const match = mobilePortraitBlock.match(pattern);
    assert(
      match,
      `Expected game.css to define a mobile portrait rule block for ${selectorList.join(', ')}.`
    );
    return match[0];
  }

  function assertRuleBlockIncludes(selectors, expectedTokens, message) {
    const ruleBlock = getMobilePortraitRuleBlock(selectors);
    expectedTokens.forEach((token) => {
      assert(ruleBlock.includes(token), message);
    });
  }

  assert(
    css.includes('body.round-result-takeover'),
    'Expected game.css to define a body.round-result-takeover hook for mobile round settlement.'
  );

  assertRuleBlockIncludes(
    [
      'body.round-result-takeover #p-panel',
      'body.round-result-takeover #e-panel',
      'body.round-result-takeover #skill-panel',
      'body.round-result-takeover #act-swap',
      'body.round-result-takeover #hint-bar',
      'body.round-result-takeover #msg-txt'
    ],
    ['display:none', 'visibility:hidden', 'opacity:0'],
    'Expected the mobile round-result takeover contract to hide the battle HUD surfaces.'
  );
  assertRuleBlockIncludes(
    'body.round-result-takeover #ov-round.result-overlay',
    ['justify-content:flex-start', 'background:'],
    'Expected the mobile round-result takeover contract to strengthen the round-result overlay background.'
  );
  assertRuleBlockIncludes(
    'body.round-result-takeover .round-result-shell',
    ['padding:', 'box-shadow:', 'border-radius:', 'background:'],
    'Expected the mobile round-result takeover contract to strengthen the dedicated round-result shell.'
  );
}

function checkResultPresentation() {
  const { context, document } = createBaseContext();
  loadScript('src/match-flow-tools.js', context);

  const state = {
    score: [2, 1],
    round: 3,
    activeChallengeIndex: 8,
    currentMode: 'challenge',
    currentArena: 2,
    playerTopId: 3,
    enemyTopId: 1,
    activeModifier: { id: 'launchSurge' },
    lastRoundEndReason: 'ringout',
    matchStartedAt: Date.now() - 8000,
    challengeContinueUsed: false,
    roundRewardGranted: false,
    doubleRewardUsed: false,
    save: {
      currency: 0,
      challenge: { unlockedNodeIndex: 8, checkpointNodeIndex: 5, completedNodes: [] },
      unlocks: { arenas: ['circle_bowl', 'heart_bowl', 'hex_bowl'], tops: ['impact', 'armor', 'impact_breaker'] }
    }
  };

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
      resultReturnToPath: 'RETURN TO PATH',
      resultReturnToQuick: 'RETURN TO QUICK',
      resultReturnToHome: 'RETURN HOME',
      resultAdjustPath: 'ADJUST PATH LOADOUT',
      resultAdjustQuick: 'ADJUST QUICK LOADOUT',
      resultAdjustHome: 'CHANGE TOP',
      replay: 'PLAY AGAIN',
      nextNode: 'NEXT NODE',
      retryNode: 'RETRY NODE',
      roadClear: 'ROAD CLEAR',
      shareResult: 'SHARE RESULT',
      resultBreakdownBase: 'BASE',
      resultBreakdownNode: 'NODE',
      resultBreakdownFirstClear: 'FIRST CLEAR',
      resultBreakdownRank: 'RANK BONUS',
      resultNextNodeLabel: 'Next',
      resultRetryLabel: 'Retry',
      resultRoadLabel: 'Road',
      resultArenaLabel: 'Arena',
      resultNodeLabel: 'Node',
      resultReasonLabel: 'Finish',
      resultShareLabel: 'Share moment',
      unlockTopReward: 'ROAD REWARD UNLOCKED'
    },
    tops: [
      { id: 'impact', name: 'Impact' },
      { id: 'armor', name: 'Armor' },
      { id: 'trick', name: 'Trick' },
      { id: 'impact_breaker', name: 'Breaker' }
    ],
    challengeRoad: new Array(10).fill(null).map((_, index) => ({
      id: 'node-' + (index + 1),
      name: 'Node ' + (index + 1),
      reward: index === 8 ? 55 : 20,
      firstClearBonus: index === 8 ? 15 : 0
    })),
    roadRanks: [
      { id: 'rank_i', label: 'RANK I', rewardMul: 1, enemy: {} },
      { id: 'rank_ii', label: 'RANK II', rewardMul: 1.25, enemy: {} }
    ],
    economy: {
      rewards: { winBase: 20, lossBase: 8, doubleRewardMultiplier: 2 }
    },
    rewardService: null,
    isRewardPlacementAvailable(placement) {
      return { available: placement === 'double_reward' || placement === 'continue_once' };
    },
    shareService: null,
    analyticsService: null,
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
      return state.activeModifier;
    },
    getCurrentChallengeNode() {
      return { id: 'node-9', name: 'Node 9', reward: 55, firstClearBonus: 15 };
    },
    getArenaLabel() {
      return 'HEX BOWL';
    },
    getArenaConfig() {
      return { id: 'hex_bowl', label: 'HEX BOWL' };
    },
    getSave() {
      return state.save;
    },
    saveProgress(mutator) {
      state.save = mutator(state.save);
      return state.save;
    },
    getSelectedRoadRankIndex() {
      return 1;
    },
    getCurrentRoadRank() {
      return { id: 'rank_ii', label: 'RANK II', rewardMul: 1.25, enemy: {} };
    },
    getBattleReturnRoute() {
      return 'quick';
    },
    showMsg() {},
    updateCurrencyUI() {},
    updateModeUI() {
      document.getElementById('btn-replay').textContent = 'PLAY AGAIN';
    },
    syncDebugPanel() {},
    initRound() {},
    getChallengeContinueUsed() {
      return state.challengeContinueUsed;
    },
    setChallengeContinueUsed(next) {
      state.challengeContinueUsed = next;
    },
    getRoundRewardGranted() {
      return state.roundRewardGranted;
    },
    setRoundRewardGranted(next) {
      state.roundRewardGranted = next;
    },
    getDoubleRewardUsed() {
      return state.doubleRewardUsed;
    },
    setDoubleRewardUsed(next) {
      state.doubleRewardUsed = next;
    },
    getLastRoundEndReason() {
      return state.lastRoundEndReason;
    },
    setLastRoundEndReason(next) {
      state.lastRoundEndReason = next;
    },
    getMatchStartedAt() {
      return state.matchStartedAt;
    },
    setMatchStartedAt(next) {
      state.matchStartedAt = next;
    }
  });

  tools.showMatchResult();

  assert(
    document.getElementById('mt-breakdown').textContent.indexOf('RANK BONUS') >= 0,
    'Expected result presentation to render a reward breakdown.'
  );
  assert(
    document.getElementById('mt-next').textContent.indexOf('Next') >= 0,
    'Expected result presentation to render a next-step recommendation.'
  );
  assert(
    document.getElementById('mt-guidance').textContent.indexOf('next node is ready') >= 0,
    'Expected result presentation to render route-aware guidance that explains the recommended next step.'
  );
  assert(
    document.getElementById('btn-replay').textContent === 'NEXT NODE',
    'Expected result primary CTA wording to reflect progression-first guidance after a challenge win.'
  );
  assert(
    document.getElementById('btn-replay').style.order === '1'
      && document.getElementById('btn-double-reward').style.order === '2'
      && document.getElementById('btn-swap-rematch').style.order === '3',
    'Expected result CTA hierarchy to prioritize progression first, then optional reward, then loadout adjustment.'
  );
  assert(
    document.getElementById('btn-continue').style.display === 'none',
    'Expected continue CTA to stay hidden after a challenge win.'
  );
  assert(
    document.getElementById('btn-replay').classList.contains('result-action-primary'),
    'Expected the result primary CTA to receive the primary action styling contract.'
  );
  assert(
    document.getElementById('btn-swap-rematch').textContent === 'ADJUST QUICK LOADOUT',
    'Expected result secondary CTA wording to reflect the route-aware loadout-adjust action.'
  );
}

function main() {
  checkIndexHtml();
  checkUiActions();
  checkTitleOverlaySafeAreaContract();
  checkLoadoutOverlaySafeAreaContract();
  checkShortViewportTitleCompressionContract();
  checkHeroAndQuickBandContracts();
  checkQuickBattlePreviewSourceContract();
  checkLoadoutPresentation();
  checkQuickBattlePresentation();
  checkSettingsPresentation();
  checkBattleHudPresentation();
  checkMobileBattleHudTopRailContract();
  checkResultPresentation();
  checkMobileRoundResultTakeoverContract();
  console.log('Shell presentation check passed.');
}

try {
  main();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
