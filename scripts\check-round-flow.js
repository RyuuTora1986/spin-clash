const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');

function loadScript(relPath, context) {
  const absPath = path.join(repoRoot, relPath);
  const code = fs.readFileSync(absPath, 'utf8');
  vm.runInContext(code, context, { filename: relPath });
}

function createElement() {
  return {
    textContent: '',
    disabled: false,
    style: {},
    classList: {
      add() {},
      remove() {},
      contains() {
        return false;
      }
    }
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
    }
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createMesh() {
  return {
    position: {
      set() {}
    }
  };
}

function main() {
  const analyticsEvents = [];
  const document = createDocument();
  const context = vm.createContext({
    console,
    document,
    window: {},
    clearTimeout() {}
  });
  context.window = context;
  context.SpinClash = {};

  loadScript(path.join('src', 'round-flow-tools.js'), context);

  const tops = [
    { id: 'impact', name: 'Impact', family: 'impact', hp: 120, maxSpin: 120, spd: 7.5, mass: 1.2, brate: 1, skill: 'Fly Charge', color: '#fff', emi: '#fff' },
    { id: 'armor', name: 'Armor', family: 'armor', hp: 150, maxSpin: 100, spd: 6.5, mass: 1.4, brate: 1, skill: 'Fortress Pulse', color: '#fff', emi: '#fff' }
  ];
  const state = {
    currentMode: 'challenge',
    currentArena: 0,
    selectedArenaIndex: 0,
    currentEnemyPresetId: null,
    enemyTopId: 0,
    playerTopId: 0,
    round: 1,
    score: [0, 0],
    tp: null,
    te: null,
    currentModifier: { id: 'standard', player: {}, enemy: {}, rules: {} },
    gameState: 'title',
    endLock: false,
    roundTimer: 0,
    timeScale: 1
  };
  const node = {
    id: 'node-4',
    chapterId: 'arena_circuit',
    chapterLabel: 'ARENA CIRCUIT',
    tier: 'boss',
    checkpointOnClear: true,
    reward: 34,
    arenaIndex: 2,
    enemyPresetId: 'armor_standard',
    modifierId: 'ironwall'
  };
  const enemyPreset = { id: 'armor_standard', label: 'ARMOR STANDARD', topId: 'armor' };
  const scene = {
    add() {},
    remove() {}
  };

  const tools = context.SpinClash.createRoundFlowTools({
    tops,
    economy: {
      runtime: { defaultRoundTimer: 30 }
    },
    analyticsService: {
      track(name, payload) {
        analyticsEvents.push({ name, payload });
      }
    },
    getCurrentMode: () => state.currentMode,
    getCurrentChallengeNode: () => node,
    getModifierById: (id) => ({ id, player: {}, enemy: {}, rules: {} }),
    getArenaLabel: (index) => ['CIRCLE BOWL', 'HEART CORE', 'HEX BOWL'][index] || 'ARENA',
    getArenaConfig: (index) => [{ id: 'circle_bowl' }, { id: 'heart_core' }, { id: 'hex_bowl' }][index] || { id: 'unknown_arena' },
    getActiveChallengeIndex: () => 3,
    getCurrentArena: () => state.currentArena,
    setCurrentArena: (next) => { state.currentArena = next; },
    setSelectedArenaIndex: (next) => { state.selectedArenaIndex = next; },
    getEnemyPresetById: (id) => (id === enemyPreset.id ? enemyPreset : null),
    getCurrentEnemyPresetId: () => state.currentEnemyPresetId,
    getCurrentEnemyPresetLabel: () => enemyPreset.label,
    setCurrentEnemyPresetId: (next) => { state.currentEnemyPresetId = next; },
    getEnemyTopId: () => state.enemyTopId,
    setEnemyTopId: (next) => { state.enemyTopId = next; },
    getPlayerTopId: () => state.playerTopId,
    getRound: () => state.round,
    setRound: (next) => { state.round = next; },
    getScore: () => state.score,
    setScore: (next) => { state.score = next; },
    getTp: () => state.tp,
    setTp: (next) => { state.tp = next; },
    getTe: () => state.te,
    setTe: (next) => { state.te = next; },
    getOrbObjects: () => [],
    getPartPool: () => [],
    getPTrailPos: () => [],
    getETrailPos: () => [],
    setupArena() {},
    mkTop() {
      return createMesh();
    },
    scene,
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
    setGameState: (next) => { state.gameState = next; },
    setEndLock: (next) => { state.endLock = next; },
    getPhysTick: () => null,
    getTimeScale: () => state.timeScale,
    setTimeScale: (next) => { state.timeScale = next; },
    getAimLine: () => null,
    getCurrentModifier: () => state.currentModifier,
    setCurrentModifier: (next) => { state.currentModifier = next; },
    setRoundTimer: (next) => { state.roundTimer = next; },
    setRoundRewardGranted() {},
    setDoubleRewardUsed() {},
    setPendingContinue() {},
    setLastRoundEndReason() {},
    getMatchStartedAt: () => null,
    setMatchStartedAt() {},
    isHeartArena: () => false
  });

  tools.initRound();
  tools.launch();

  const challengeStart = analyticsEvents.find((event) => event.name === 'challenge_node_start');
  const matchStart = analyticsEvents.find((event) => event.name === 'match_start');

  assert(challengeStart, 'Expected challenge_node_start analytics to fire.');
  assert(challengeStart.payload.enemyPresetId === 'armor_standard', 'Expected challenge_node_start to preserve enemyPresetId.');
  assert(challengeStart.payload.enemyPresetLabel === 'ARMOR STANDARD', 'Expected challenge_node_start to preserve enemyPresetLabel.');
  assert(challengeStart.payload.chapterId === 'arena_circuit', 'Expected challenge_node_start to preserve chapterId.');
  assert(challengeStart.payload.chapterLabel === 'ARENA CIRCUIT', 'Expected challenge_node_start to preserve chapterLabel.');
  assert(challengeStart.payload.tier === 'boss', 'Expected challenge_node_start to preserve tier.');
  assert(challengeStart.payload.checkpointOnClear === true, 'Expected challenge_node_start to preserve checkpointOnClear.');
  assert(challengeStart.payload.reward === 34, 'Expected challenge_node_start to preserve reward.');
  assert(matchStart, 'Expected match_start analytics to fire.');
  assert(matchStart.payload.enemyPresetId === 'armor_standard', 'Expected match_start to preserve enemyPresetId.');
  assert(matchStart.payload.enemyPresetLabel === 'ARMOR STANDARD', 'Expected match_start to preserve enemyPresetLabel.');
  assert(state.tp && state.tp.template && state.tp.template.combat, 'Expected round-flow to normalize player combat schema.');
  assert(state.tp.template.combat.actions.signature.skillId === 'Fly Charge', 'Expected round-flow combat bridge to preserve legacy player signature skill.');
  assert(state.te && state.te.template && state.te.template.combat, 'Expected round-flow to normalize enemy combat schema.');
  assert(state.te.template.combat.actions.guard.id === 'guard', 'Expected round-flow combat bridge to expose universal guard action.');
  assert(typeof state.tp.template.combat.attrition.hpDecayPerSec === 'number', 'Expected round-flow combat bridge to preserve attrition metadata.');
  assert(state.tp.guarding === false, 'Expected runtime top data to initialize guarding state.');

  console.log('Round flow check passed.');
}

try {
  main();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
