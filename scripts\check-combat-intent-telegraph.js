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
    className: '',
    disabled: false,
    style: {},
    dataset: {},
    classList: createClassList(),
    addEventListener() {},
    traverse() {},
    offsetWidth: 0
  };
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
    addEventListener() {},
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

function createBattleSimTools() {
  const tracker = { skills: 0 };
  const context = vm.createContext({
    console,
    window: {},
    Math
  });
  context.window = context;
  context.SpinClash = {};
  loadScript(path.join('src', 'battle-sim-tools.js'), context);
  const tools = context.SpinClash.createBattleSimTools({
    friction: 0.9996,
    spinDrain: 1,
    hazardDrain: 6,
    arenaRadius: 8,
    topRadius: 0.55,
    hexPoints: [],
    getTimeScale() {
      return 1;
    },
    setTimeScale() {},
    getCamShake() {
      return 0;
    },
    setCamShake() {},
    getPlayerTrailPositions() {
      return [];
    },
    getEnemyTrailPositions() {
      return [];
    },
    isCircleArena() {
      return true;
    },
    isHeartArena() {
      return false;
    },
    isHexArena() {
      return false;
    },
    heartNearWall() {
      return false;
    },
    heartWallNormal() {
      return { nx: 0, nz: 0 };
    },
    heartInHaz() {
      return false;
    },
    heartCrossed() {
      return false;
    },
    heartRingOut() {
      return false;
    },
    polygonContains() {
      return false;
    },
    nearestPolygonEdgeData() {
      return { dist: Infinity, nx: 0, nz: 0 };
    },
    scalePolygon(points) {
      return points;
    },
    getEnemyAiConfig() {
      return {
        useSkillOnBurstReady: true,
        intentSkillLead: 0.36,
        intentGuardLead: 0.28,
        intentDashLead: 0.18
      };
    },
    spawnParts() {},
    showMsg() {},
    sfxWall() {},
    sfxRingOut() {},
    sfxCollide() {},
    endRound() {},
    fireSkill() {
      tracker.skills += 1;
    },
    scene: {
      remove() {}
    }
  });
  return { tools, tracker };
}

function createUiShellTools() {
  const document = createDocument();
  const context = vm.createContext({
    console,
    window: {},
    document,
    setTimeout(fn) {
      fn();
      return 1;
    },
    clearTimeout() {}
  });
  context.window = context;
  context.SpinClash = {};
  loadScript(path.join('src', 'ui-shell-tools.js'), context);
  const state = {
    tp: {
      hp: 82,
      maxHp: 100,
      spin: 65,
      maxSpin: 100,
      burst: 40,
      dashCD: 0,
      DASH_CD: 2.5,
      guardCD: 0,
      GUARD_CD: 4,
      guardT: 0,
      skillCD: 3,
      SKILL_CD: 8,
      guarding: false,
      template: {
        id: 'impact',
        name: 'Impact',
        skill: 'Fly Charge'
      }
    },
    te: {
      hp: 90,
      maxHp: 100,
      spin: 74,
      maxSpin: 100,
      burst: 100,
      dashCD: 0,
      DASH_CD: 2.5,
      guardCD: 0,
      GUARD_CD: 4,
      guardT: 0,
      skillCD: 0,
      SKILL_CD: 8,
      guarding: false,
      intentType: 'skill',
      intentT: 0.24,
      intentLead: 0.36,
      intentSkillId: 'Fortress Pulse',
      template: {
        id: 'armor',
        name: 'Armor',
        skill: 'Fortress Pulse',
        combat: {
          actions: {
            signature: { skillId: 'Fortress Pulse' }
          }
        }
      }
    }
  };
  const tools = context.SpinClash.createUiShellTools({
    uiText: {
      skillLabels: {
        'Fly Charge': 'Fly Charge',
        'Fortress Pulse': 'Fortress Pulse'
      },
      playerRole: 'YOU',
      enemyRole: 'CPU',
      statusReady: 'READY',
      statusGuarding: 'GUARD',
      statusIntentSkill: 'SKILL',
      statusIntentDash: 'DASH',
      statusIntentGuard: 'GUARD',
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
      'Fortress Pulse': {
        icon: 'FP',
        hudAccent: {
          chargeStroke: 'rgba(125,215,255,0.62)',
          readyStroke: 'rgba(140,225,255,0.94)',
          readyHintColor: '#9fe7ff'
        }
      }
    },
    getGameState() {
      return 'active';
    },
    getSelectedArenaIndex() {
      return 0;
    },
    getScore() {
      return [1, 1];
    },
    getPlayerTopId() {
      return 0;
    },
    getTp() {
      return state.tp;
    },
    getTe() {
      return state.te;
    }
  });
  return { document, state, tools };
}

function createRoundFlowTools() {
  const context = vm.createContext({
    console,
    window: {},
    document: {
      getElementById() {
        return createElement();
      }
    },
    clearTimeout() {}
  });
  context.window = context;
  context.SpinClash = {};
  loadScript(path.join('src', 'round-flow-tools.js'), context);
  const tools = context.SpinClash.createRoundFlowTools({
    uiText: {},
    tops: [],
    economy: {},
    getCurrentMode() {
      return 'quick';
    },
    getCurrentChallengeNode() {
      return null;
    },
    getModifierById() {
      return { id: 'standard', player: {}, enemy: {}, rules: {} };
    },
    getArenaLabel() {
      return 'CIRCLE BOWL';
    },
    getActiveChallengeIndex() {
      return 0;
    },
    getCurrentArena() {
      return 0;
    },
    setCurrentArena() {},
    setSelectedArenaIndex() {},
    getEnemyPresetById() {
      return null;
    },
    getCurrentEnemyPresetId() {
      return null;
    },
    getCurrentEnemyPresetLabel() {
      return null;
    },
    setCurrentEnemyPresetId() {},
    getEnemyTopId() {
      return 0;
    },
    setEnemyTopId() {},
    getPlayerTopId() {
      return 0;
    },
    getRound() {
      return 1;
    },
    setRound() {},
    getScore() {
      return [0, 0];
    },
    setScore() {},
    getTp() {
      return null;
    },
    setTp() {},
    getTe() {
      return null;
    },
    setTe() {},
    getOrbObjects() {
      return [];
    },
    getPartPool() {
      return [];
    },
    getPTrailPos() {
      return [];
    },
    getETrailPos() {
      return [];
    },
    setupArena() {},
    mkTop() {
      return { position: { set() {} } };
    },
    scene: {
      add() {},
      remove() {}
    },
    showMsg() {},
    updateSkillIcon() {},
    updateHUD() {},
    refreshPips() {},
    syncDebugPanel() {},
    showMatchResult() {},
    spawnOrbs() {},
    sfxLaunch() {},
    startMusic() {},
    sfxRoundWin() {},
    sfxRoundLose() {},
    setGameState() {},
    setEndLock() {},
    getPhysTick() {
      return null;
    },
    getTimeScale() {
      return 1;
    },
    setTimeScale() {},
    getAimLine() {
      return null;
    },
    getCurrentModifier() {
      return { id: 'standard', player: {}, enemy: {}, rules: {} };
    },
    setCurrentModifier() {},
    setRoundTimer() {},
    setRoundRewardGranted() {},
    setDoubleRewardUsed() {},
    setPendingContinue() {},
    setLastRoundEndReason() {},
    getMatchStartedAt() {
      return null;
    },
    setMatchStartedAt() {},
    isHeartArena() {
      return false;
    }
  });
  return tools;
}

function createDebugRuntimeTools(enemyTop) {
  const context = vm.createContext({
    console,
    window: {},
    document: {
      getElementById() {
        return {
          textContent: '',
          classList: {
            contains() {
              return false;
            }
          }
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
    }
  });
  context.window = context;
  context.SpinClash = {};
  loadScript(path.join('src', 'debug-runtime-tools.js'), context);
  return context.SpinClash.createDebugRuntimeTools({
    storageService: {
      version: 1,
      isPersistent() {
        return true;
      },
      getPersistenceMode() {
        return 'local';
      },
      getDiagnostics() {
        return { ok: true };
      }
    },
    analyticsService: {
      track() {},
      list() {
        return [];
      },
      getAdapterInfo() {
        return {
          adapter: 'none',
          forwardingEnabled: false,
          ready: false,
          loading: false,
          lastForwardReason: null,
          initialized: false,
          queuedEvents: 0
        };
      }
    },
    rewardService: {
      getAdapterInfo() {
        return {
          adapter: 'none',
          ready: false,
          loading: false,
          lastAvailabilityReason: null,
          lastRequestReason: null,
          activePlacement: null
        };
      }
    },
    shareService: {},
    debugService: null,
    economy: {},
    tops: [
      { id: 'impact', name: 'Impact' },
      { id: 'armor', name: 'Armor' }
    ],
    arenas: [
      { id: 'circle_bowl', label: 'CIRCLE BOWL' }
    ],
    researchTracks: [],
    roadRanks: [],
    challengeRoad: [],
    enemyPresets: {},
    getSave() {
      return {
        currency: 0,
        challenge: {},
        unlocks: { arenas: [], tops: [] }
      };
    },
    saveProgress(mutator) {
      return mutator(this.getSave ? this.getSave() : {});
    },
    addCurrency() {},
    getResearchBonuses() {
      return { hpMul: 1, maxSpinMul: 1, brateMul: 1 };
    },
    getUnlockedRoadRankIndex() {
      return 0;
    },
    getSelectedRoadRankIndex() {
      return 0;
    },
    getCurrentRoadRank() {
      return null;
    },
    unlockArenaById() {},
    unlockTopById() {},
    setChallengeProgress() {},
    resetDebugProgress() {},
    getArenaLabel() {
      return 'CIRCLE BOWL';
    },
    getCurrentChallengeNode() {
      return null;
    },
    getCurrentMode() {
      return 'quick';
    },
    getCurrentArena() {
      return 0;
    },
    getPlayerTopId() {
      return 0;
    },
    getEnemyTopId() {
      return 1;
    },
    getCurrentEnemyPresetId() {
      return null;
    },
    getCurrentEnemyPresetLabel() {
      return null;
    },
    getCurrentEnemyAiConfig() {
      return { intentSkillLead: 0.36 };
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
      return 23;
    },
    getGameState() {
      return 'active';
    },
    getTimeScale() {
      return 1;
    },
    getTp() {
      return null;
    },
    getTe() {
      return enemyTop;
    },
    getOrbObjects() {
      return [];
    },
    getSessionTrialArenaIds() {
      return new Set();
    },
    getHintText() {
      return 'Hint text';
    },
    getMessageText() {
      return 'Message text';
    },
    syncAfterReset() {}
  });
}

function createAiTop(overrides) {
  return Object.assign({
    alive: true,
    x: 0,
    z: 0,
    vx: 0,
    vz: 0,
    dashCD: 0,
    DASH_CD: 2.5,
    dashT: 0,
    dashing: false,
    guardCD: 0,
    GUARD_CD: 4,
    guardT: 0,
    guarding: false,
    skillCD: 0,
    SKILL_CD: 8,
    burst: 0,
    phantom: false,
    phantomT: 0,
    roleBiasBoost: 0,
    roleBiasBoostT: 0,
    template: {
      id: 'armor',
      name: 'Armor',
      family: 'armor',
      spd: 10,
      mass: 1,
      combat: {
        actions: {
          guard: { enabled: true, cooldown: 4.0, duration: 0.82 },
          signature: { skillId: 'Fortress Pulse' }
        }
      }
    }
  }, overrides || {});
}

function checkRoundFlowRuntimeFields() {
  const tools = createRoundFlowTools();
  const runtimeTop = tools.mkTopData({
    id: 'impact',
    name: 'Impact',
    family: 'impact',
    hp: 120,
    maxSpin: 120,
    spd: 8,
    mass: 1,
    brate: 1,
    skill: 'Fly Charge',
    combat: {
      actions: {
        signature: { skillId: 'Fly Charge' }
      }
    }
  }, true);
  assert(Object.prototype.hasOwnProperty.call(runtimeTop, 'intentType'), 'Expected runtime tops to initialize intentType.');
  assert(Object.prototype.hasOwnProperty.call(runtimeTop, 'intentT'), 'Expected runtime tops to initialize intentT.');
  assert(runtimeTop.intentT === 0, 'Expected runtime tops to start with no active intent timer.');
}

function checkAiSkillTelegraph() {
  const { tools, tracker } = createBattleSimTools();
  const ai = createAiTop({
    burst: 100
  });
  const player = {
    alive: true,
    x: 2,
    z: 0,
    vx: 14,
    vz: 0,
    dashing: true,
    burst: 100
  };
  tools.aiTick(ai, player, 0.1);
  assert(ai.intentType === 'skill', 'Expected burst-ready AI to telegraph skill intent before firing.');
  assert(ai.burst === 100, 'Expected skill telegraph to preserve burst before the intent resolves.');
  assert(tracker.skills === 0, 'Expected skill telegraph to defer skill firing until the lead-in resolves.');
  tools.aiTick(ai, player, 0.5);
  assert(tracker.skills === 1, 'Expected skill intent to resolve into a real signature fire.');
  assert(ai.burst === 0, 'Expected skill execution to spend burst after the telegraph window.');
}

function checkAiGuardTelegraph() {
  const { tools } = createBattleSimTools();
  const ai = createAiTop({
    burst: 20
  });
  const player = {
    alive: true,
    x: 2.2,
    z: 0,
    vx: 16,
    vz: 0,
    dashing: true,
    burst: 60
  };
  tools.aiTick(ai, player, 0.1);
  assert(ai.intentType === 'guard', 'Expected close-range defensive AI to telegraph guard intent.');
  assert(ai.guarding === false, 'Expected guard telegraph to happen before the guard state begins.');
  tools.aiTick(ai, player, 0.4);
  assert(ai.guarding === true, 'Expected guard intent to resolve into the guard state.');
}

function checkAiDashTelegraph() {
  const { tools } = createBattleSimTools();
  const ai = createAiTop({
    burst: 20
  });
  const player = {
    alive: true,
    x: 3.5,
    z: 0,
    vx: 0,
    vz: 0,
    dashing: false,
    burst: 20
  };
  tools.aiTick(ai, player, 0.1);
  assert(ai.intentType === 'dash', 'Expected close-range pursuit AI to telegraph dash intent.');
  assert(ai.dashing === false, 'Expected dash telegraph to happen before the dash begins.');
  tools.aiTick(ai, player, 0.3);
  assert(ai.dashing === true, 'Expected dash intent to resolve into an actual dash.');
}

function checkUiIntentLabels() {
  const { document, tools } = createUiShellTools();
  tools.updateHUD();
  assert(
    document.getElementById('e-role').textContent.indexOf('SKILL') >= 0,
    'Expected enemy HUD label to surface SKILL intent during the lead-in.'
  );
  assert(
    document.getElementById('e-role').style.color === '#9fe7ff',
    'Expected enemy skill intent label to adopt the signature accent color.'
  );
}

function checkDebugRuntimeSnapshot() {
  const enemyTop = {
    x: 1,
    z: 0,
    vx: 3,
    vz: 0,
    hp: 90,
    spin: 80,
    burst: 100,
    dashCD: 0,
    guardCD: 0,
    guarding: false,
    skillCD: 0,
    alive: true,
    intentType: 'skill',
    intentT: 0.24,
    intentLead: 0.36,
    intentSkillId: 'Fortress Pulse',
    template: {
      name: 'Armor',
      skill: 'Fortress Pulse',
      combat: {
        actions: {
          signature: { skillId: 'Fortress Pulse' }
        }
      }
    }
  };
  const tools = createDebugRuntimeTools(enemyTop);
  const payload = JSON.parse(tools.renderGameToText());
  assert(payload.enemy && payload.enemy.intent, 'Expected debug runtime text to include enemy intent data.');
  assert(payload.enemy.intent.type === 'skill', 'Expected debug runtime text to preserve enemy intent type.');
  assert(payload.enemy.intent.skillId === 'Fortress Pulse', 'Expected debug runtime text to preserve intent skillId.');
}

function main() {
  checkRoundFlowRuntimeFields();
  checkAiSkillTelegraph();
  checkAiGuardTelegraph();
  checkAiDashTelegraph();
  checkUiIntentLabels();
  checkDebugRuntimeSnapshot();
  console.log('Combat intent telegraph check passed.');
}

try {
  main();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
