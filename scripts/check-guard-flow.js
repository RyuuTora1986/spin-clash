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

function createElement() {
  return {
    textContent: '',
    style: {},
    className: '',
    dataset: {},
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() { return false; }
    },
    addEventListener() {},
    traverse() {},
    offsetWidth: 0
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
    addEventListener() {},
    querySelector() {
      return createElement();
    }
  };
}

function createBattleTools() {
  const context = vm.createContext({
    console,
    window: {},
    document: createDocument()
  });
  context.window = context;
  context.SpinClash = {};
  loadScript(path.join('src', 'battle-sim-tools.js'), context);
  return context.SpinClash.createBattleSimTools({
    uiText: {},
    friction: 0.98,
    spinDrain: 1,
    hazardDrain: 1,
    arenaRadius: 7,
    topRadius: 0.55,
    hexPoints: [[0, 0], [1, 0], [1, 1]],
    getTimeScale: () => 1,
    setTimeScale() {},
    getCamShake: () => 0,
    setCamShake() {},
    getPlayerTrailPositions: () => [],
    getEnemyTrailPositions: () => [],
    isCircleArena: () => true,
    isHeartArena: () => false,
    isHexArena: () => false,
    heartNearWall: () => false,
    heartWallNormal: () => ({ nx: 0, nz: 0 }),
    heartInHaz: () => false,
    heartCrossed: () => false,
    heartRingOut: () => false,
    polygonContains: () => false,
    nearestPolygonEdgeData: () => ({ dist: 1, nx: 0, nz: 0 }),
    scalePolygon: (points) => points,
    spawnParts() {},
    showMsg() {},
    sfxWall() {},
    sfxRingOut() {},
    sfxCollide() {},
    endRound() {},
    fireSkill() {},
    scene: { remove() {} }
  });
}

function createCombatActionTools(state, tracker) {
  const document = createDocument();
  const renderer = { domElement: { addEventListener() {} } };
  const context = vm.createContext({
    console,
    window: {},
    document,
    renderer,
    setTimeout(fn) {
      fn();
      return 1;
    }
  });
  context.window = context;
  context.SpinClash = {};
  loadScript(path.join('src', 'combat-action-tools.js'), context);
  return context.SpinClash.createCombatActionTools({
    uiText: {
      messageGuard: 'GUARD!'
    },
    renderer,
    getGameState: () => 'active',
    getTp: () => state.tp,
    getTe: () => state.te,
    showMsg(message) {
      tracker.messages.push(message);
    },
    sfxDash() {},
    sfxSkill() {},
    sfxGuard() {
      tracker.guardSfx += 1;
    },
    spawnParts() {},
    launch() {},
    onDragStart() {},
    onDragMove() {},
    onDragEnd() {}
  });
}

function makeTop(overrides) {
  return Object.assign({
    alive: true,
    isPlayer: true,
    x: 0,
    z: 0,
    vx: 0,
    vz: 0,
    hp: 100,
    maxHp: 100,
    spin: 100,
    maxSpin: 100,
    burst: 0,
    dashCD: 0,
    DASH_CD: 2.5,
    guardCD: 0,
    GUARD_CD: 4,
    guardT: 0,
    guarding: false,
    skillCD: 0,
    SKILL_CD: 8,
    wallCD: 0,
    dashing: false,
    dashT: 0,
    shielded: false,
    shieldT: 0,
    phantom: false,
    phantomT: 0,
    tiltVX: 0,
    tiltVZ: 0,
    template: {
      spd: 10,
      mass: 1,
      brate: 1,
      color: 0xffffff,
      combat: {
        collision: { roleBias: 1 },
        attrition: { hpDecayPerSec: 0.08 },
        actions: {
          guard: { enabled: true }
        }
      }
    }
  }, overrides || {});
}

function main() {
  const battleTools = createBattleTools();
  const state = {
    tp: makeTop(),
    te: makeTop({
      isPlayer: false,
      template: {
        spd: 10,
        mass: 1,
        brate: 1,
        color: 0xffffff,
        combat: {
          collision: { roleBias: 1 },
          attrition: { hpDecayPerSec: 0.11 },
          actions: {
            guard: { enabled: true }
          }
        }
      }
    })
  };
  const tracker = { messages: [], guardSfx: 0 };
  const actionTools = createCombatActionTools(state, tracker);

  assert(typeof actionTools.doPlayerGuard === 'function', 'Expected doPlayerGuard action export.');
  actionTools.doPlayerGuard();
  assert(state.tp.guarding === true, 'Expected player guard action to activate guarding state.');
  assert(state.tp.guardCD > 0, 'Expected player guard action to start guard cooldown.');
  assert(state.tp.guardT > 0, 'Expected player guard action to start guard duration.');
  assert(tracker.guardSfx === 1, 'Expected player guard action to trigger guard SFX.');
  assert(tracker.messages.includes('GUARD!'), 'Expected player guard action to announce guard activation.');

  const impactProfile = battleTools.buildImpactProfile(
    Object.assign({}, state.tp, { x: 1, z: 0, vx: -7, vz: 0, template: Object.assign({}, state.tp.template, { mass: 1 }) }),
    Object.assign({}, state.te, { x: 0, z: 0, vx: 0, vz: 0, template: Object.assign({}, state.te.template, { mass: 1 }) })
  );
  const roles = battleTools.resolveCollisionRoles(state.tp, state.te, impactProfile);
  const guardedOutcome = battleTools.buildCollisionOutcome(
    Object.assign({}, state.tp, { guarding: true, phantom: false, shielded: false }),
    Object.assign({}, state.te, { guarding: false, phantom: false, shielded: false }),
    impactProfile,
    roles
  );
  const plainOutcome = battleTools.buildCollisionOutcome(
    Object.assign({}, state.tp, { guarding: false, phantom: false, shielded: false }),
    Object.assign({}, state.te, { guarding: false, phantom: false, shielded: false }),
    impactProfile,
    roles
  );
  assert(guardedOutcome.hpDamageA < plainOutcome.hpDamageA, 'Expected guarding target to take less hp damage than plain state.');
  assert(guardedOutcome.spinDamageA < plainOutcome.spinDamageA, 'Expected guarding target to take less spin damage than plain state.');

  const decayTop = makeTop({ hp: 100, spin: 100, guarding: true, guardT: 1, guardCD: 3 });
  battleTools.movTop(decayTop, 0.5);
  assert(decayTop.guarding === true, 'Expected guard state to persist while guard duration remains.');
  assert(decayTop.guardT < 1, 'Expected guard timer to tick down during movement.');
  assert(decayTop.guardCD < 3, 'Expected guard cooldown to tick down during movement.');
  battleTools.movTop(decayTop, 1);
  assert(decayTop.guarding === false, 'Expected guard state to clear after duration expires.');

  console.log('Guard flow check passed.');
}

try {
  main();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
