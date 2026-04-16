const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const failures = [];

function loadConfigScript(relPath, root) {
  const absPath = path.join(repoRoot, relPath);
  const code = fs.readFileSync(absPath, 'utf8');
  const context = {
    window: { SpinClash: root },
    console
  };
  vm.createContext(context);
  vm.runInContext(code, context, { filename: absPath });
}

function fail(message) {
  failures.push(message);
}

function main() {
  const root = { config: {}, services: {}, state: {}, debug: {} };

  [
    'src/bootstrap-app-globals.js',
    'src/config-text.js',
    'src/config-tops.js',
    'src/config-arenas.js',
    'src/config-modifiers.js',
    'src/config-challenge-road.js'
  ].forEach((relPath) => loadConfigScript(relPath, root));

  const text = root.config.text || {};
  const tops = root.config.tops || [];
  const arenas = root.config.arenas || [];
  const modifiers = root.config.modifiers || {};
  const challengeRoad = root.config.challengeRoad || [];

  if (!Array.isArray(tops) || tops.length === 0) {
    fail('config.tops is missing or empty');
  }

  if (!Array.isArray(arenas) || arenas.length === 0) {
    fail('config.arenas is missing or empty');
  }

  if (!Array.isArray(challengeRoad) || challengeRoad.length === 0) {
    fail('config.challengeRoad is missing or empty');
  }

  if (!Array.isArray(text.cards)) {
    fail('config.text.cards is missing');
  } else if (text.cards.length !== tops.length) {
    fail(`config.text.cards length (${text.cards.length}) does not match config.tops length (${tops.length})`);
  }

  if (!Array.isArray(text.arenaOptions)) {
    fail('config.text.arenaOptions is missing');
  } else if (text.arenaOptions.length !== arenas.length) {
    fail(`config.text.arenaOptions length (${text.arenaOptions.length}) does not match config.arenas length (${arenas.length})`);
  }

  const topIds = new Set();
  tops.forEach((top, index) => {
    if (!top || !top.id) fail(`top at index ${index} is missing id`);
    if (top && top.id) {
      if (topIds.has(top.id)) fail(`duplicate top id: ${top.id}`);
      topIds.add(top.id);
    }
  });

  const arenaIds = new Set();
  arenas.forEach((arena, index) => {
    if (!arena || !arena.id) fail(`arena at index ${index} is missing id`);
    if (arena && arena.id) {
      if (arenaIds.has(arena.id)) fail(`duplicate arena id: ${arena.id}`);
      arenaIds.add(arena.id);
    }
  });

  challengeRoad.forEach((node, index) => {
    if (typeof node.arenaIndex !== 'number' || !arenas[node.arenaIndex]) {
      fail(`challengeRoad node ${index} has invalid arenaIndex: ${node.arenaIndex}`);
    }
    if (typeof node.enemyTopId !== 'number' || !tops[node.enemyTopId]) {
      fail(`challengeRoad node ${index} has invalid enemyTopId: ${node.enemyTopId}`);
    }
    if (!node.modifierId || !modifiers[node.modifierId]) {
      fail(`challengeRoad node ${index} has invalid modifierId: ${node.modifierId}`);
    }
    if (node.unlockTopId && !tops.find((top) => top.id === node.unlockTopId)) {
      fail(`challengeRoad node ${index} references missing unlockTopId: ${node.unlockTopId}`);
    }
  });

  if (failures.length) {
    console.error('Config consistency check failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('Config consistency check passed.');
}

main();
