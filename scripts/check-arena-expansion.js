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

function main() {
  const context = vm.createContext({
    console,
    window: {}
  });
  context.window = context;
  context.SpinClash = {};

  loadScript(path.join('src', 'bootstrap-app-globals.js'), context);
  loadScript(path.join('src', 'config-arenas.js'), context);
  loadScript(path.join('src', 'arena-math-tools.js'), context);

  const root = context.SpinClash;
  const arenas = root.config.arenas || [];
  const tools = root.createArenaMathTools();

  const arenaIds = arenas.map((arena) => arena.id);
  ['circle_bowl', 'heart_bowl', 'hex_bowl', 'cyclone_bowl', 'rose_bowl', 'octa_bowl'].forEach((arenaId) => {
    assert(arenaIds.includes(arenaId), `Expected expanded arena config to include ${arenaId}.`);
  });

  assert(typeof tools.createHeartPoints === 'function', 'Expected arena math tools to expose createHeartPoints.');
  assert(typeof tools.createRegularPolygonPoints === 'function', 'Expected arena math tools to expose createRegularPolygonPoints.');
  assert(typeof tools.getArenaProfile === 'function', 'Expected arena math tools to expose getArenaProfile.');

  const alteredHeart = tools.createHeartPoints({ scaleX: 1.08, scaleZ: 0.92, pinch: 0.22 });
  assert(alteredHeart.length === tools.HEART_PTS.length, 'Expected altered heart point count to match base heart profile.');
  assert(
    Math.abs(alteredHeart[0].x - tools.HEART_PTS[0].x) > 0.001 || Math.abs(alteredHeart[0].z - tools.HEART_PTS[0].z) > 0.001,
    'Expected altered heart profile to differ from the base heart points.'
  );

  const octagon = tools.createRegularPolygonPoints(8, 7.1, Math.PI / 8);
  assert(octagon.length === 8, 'Expected regular polygon helper to create the requested number of points.');
  assert(Math.abs(octagon[0].x - 7.1) > 0.001, 'Expected polygon rotation to affect the first point.');

  const roseArena = arenas.find((arena) => arena.id === 'rose_bowl');
  const octaArena = arenas.find((arena) => arena.id === 'octa_bowl');
  const roseProfile = tools.getArenaProfile(roseArena);
  const octaProfile = tools.getArenaProfile(octaArena);

  assert(roseProfile.type === 'heart', 'Expected rose_bowl profile to stay in the heart family.');
  assert(Array.isArray(roseProfile.heartPoints) && roseProfile.heartPoints.length === tools.HEART_PTS.length, 'Expected rose_bowl profile to expose heart points.');
  assert(roseProfile.hazardScale < 1, 'Expected rose_bowl profile to define a narrower heart hazard band.');
  assert(Array.isArray(octaProfile.polygonPoints) && octaProfile.polygonPoints.length === 8, 'Expected octa_bowl profile to expose an octagon polygon.');
  assert(octaProfile.outerScale > 1, 'Expected octa_bowl profile to define an outer polygon used for ring-out detection.');

  console.log('Arena expansion check passed.');
}

try {
  main();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
