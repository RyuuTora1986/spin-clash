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

function createTools() {
  const context = vm.createContext({
    console,
    window: {},
    document: {}
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

function main() {
  const tools = createTools();
  assert(typeof tools.buildImpactProfile === 'function', 'Expected buildImpactProfile helper export.');
  assert(typeof tools.resolveCollisionRoles === 'function', 'Expected resolveCollisionRoles helper export.');
  assert(typeof tools.buildCollisionOutcome === 'function', 'Expected buildCollisionOutcome helper export.');

  const impactA = tools.buildImpactProfile(
    { x: 1, z: 0, vx: -8, vz: 0, template: { mass: 1, combat: { collision: { roleBias: 1.15 } } } },
    { x: 0, z: 0, vx: 0, vz: 0, template: { mass: 1, combat: { collision: { roleBias: 0.92 } } } }
  );
  const rolesA = tools.resolveCollisionRoles(
    { isPlayer: true },
    { isPlayer: false },
    impactA
  );
  assert(rolesA.aggressor === 'A', 'Expected top A to resolve as aggressor when carrying clear closing speed.');
  assert(rolesA.defender === 'B', 'Expected top B to resolve as defender when stationary into impact.');
  const outcomeA = tools.buildCollisionOutcome(
    { phantom: false, shielded: false, template: { mass: 1, combat: { collision: { roleBias: 1.15 } } } },
    { phantom: false, shielded: false, template: { mass: 1, combat: { collision: { roleBias: 0.92 } } } },
    impactA,
    rolesA
  );
  assert(outcomeA.hpDamageB > outcomeA.hpDamageA, 'Expected defender to take more hp damage under a clear aggressor advantage.');
  assert(outcomeA.spinDamageB > outcomeA.spinDamageA, 'Expected defender to take more spin damage under a clear aggressor advantage.');

  const impactEven = tools.buildImpactProfile(
    { x: 1, z: 0, vx: -4, vz: 0, template: { mass: 1, combat: { collision: { roleBias: 1 } } } },
    { x: 0, z: 0, vx: 4, vz: 0, template: { mass: 1, combat: { collision: { roleBias: 1 } } } }
  );
  const rolesEven = tools.resolveCollisionRoles(
    { isPlayer: true },
    { isPlayer: false },
    impactEven
  );
  assert(rolesEven.aggressor === null, 'Expected equal head-on collision to keep aggressor unresolved.');
  assert(rolesEven.defender === null, 'Expected equal head-on collision to keep defender unresolved.');
  const outcomeEven = tools.buildCollisionOutcome(
    { phantom: false, shielded: false, template: { mass: 1, combat: { collision: { roleBias: 1 } } } },
    { phantom: false, shielded: false, template: { mass: 1, combat: { collision: { roleBias: 1 } } } },
    impactEven,
    rolesEven
  );
  assert(Math.abs(outcomeEven.hpDamageA - outcomeEven.hpDamageB) < 0.0001, 'Expected unresolved collision hp damage to stay symmetric.');
  assert(Math.abs(outcomeEven.spinDamageA - outcomeEven.spinDamageB) < 0.0001, 'Expected unresolved collision spin damage to stay symmetric.');

  const impactB = tools.buildImpactProfile(
    { x: 1, z: 0, vx: 0, vz: 0, template: { mass: 1, combat: { collision: { roleBias: 0.92 } } } },
    { x: 0, z: 0, vx: 8, vz: 0, template: { mass: 1, combat: { collision: { roleBias: 1.08 } } } }
  );
  const rolesB = tools.resolveCollisionRoles(
    { isPlayer: true },
    { isPlayer: false },
    impactB
  );
  assert(rolesB.aggressor === 'B', 'Expected top B to resolve as aggressor when carrying clear closing speed.');
  assert(rolesB.defender === 'A', 'Expected top A to resolve as defender when absorbing the hit.');

  const armorTop = {
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
    skillCD: 0,
    wallCD: 0,
    dashing: false,
    shielded: false,
    phantom: false,
    template: {
      color: 0xffffff,
      combat: { attrition: { hpDecayPerSec: 0.05 } }
    }
  };
  const trickTop = {
    alive: true,
    isPlayer: false,
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
    skillCD: 0,
    wallCD: 0,
    dashing: false,
    shielded: false,
    phantom: false,
    template: {
      color: 0xffffff,
      combat: { attrition: { hpDecayPerSec: 0.11 } }
    }
  };
  tools.movTop(armorTop, 1);
  tools.movTop(trickTop, 1);
  assert(armorTop.hp < 100, 'Expected passive combat attrition to reduce armor hp slightly over time.');
  assert(trickTop.hp < armorTop.hp, 'Expected trick-family attrition to tick faster than armor-family attrition.');

  console.log('Collision helper check passed.');
}

try {
  main();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
