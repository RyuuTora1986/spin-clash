const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const failures = [];

function fail(message) {
  failures.push(message);
}

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

function main() {
  const root = { config: {}, services: {}, state: {}, debug: {} };

  [
    'src/bootstrap-app-globals.js',
    'src/config-enemy-presets.js',
    'src/config-modifiers.js',
    'src/config-challenge-road.js'
  ].forEach((relPath) => loadConfigScript(relPath, root));

  const enemyPresets = root.config.enemyPresets || {};
  const modifiers = root.config.modifiers || {};
  const challengeRoad = root.config.challengeRoad || [];
  const enemyPresetIds = Object.keys(enemyPresets);
  const modifierIds = Object.keys(modifiers);
  const requiredEnemyPresets = ['armor_ram', 'trick_drifter', 'impact_blitz'];
  const requiredModifiers = ['launchSurge', 'grindCore', 'lowSpin'];

  if (enemyPresetIds.length < 6) {
    fail(`config.enemyPresets must contain at least 6 presets after the encounter pack, found ${enemyPresetIds.length}`);
  }

  if (modifierIds.length < 9) {
    fail(`config.modifiers must contain at least 9 modifiers after the encounter pack, found ${modifierIds.length}`);
  }

  requiredEnemyPresets.forEach((presetId) => {
    if (!enemyPresets[presetId]) {
      fail(`config.enemyPresets is missing required preset: ${presetId}`);
    }
  });

  requiredModifiers.forEach((modifierId) => {
    if (!modifiers[modifierId]) {
      fail(`config.modifiers is missing required modifier: ${modifierId}`);
    }
  });

  requiredEnemyPresets.forEach((presetId) => {
    if (!challengeRoad.some((node) => node && node.enemyPresetId === presetId)) {
      fail(`config.challengeRoad does not use required encounter preset: ${presetId}`);
    }
  });

  requiredModifiers.forEach((modifierId) => {
    if (!challengeRoad.some((node) => node && node.modifierId === modifierId)) {
      fail(`config.challengeRoad does not use required modifier: ${modifierId}`);
    }
  });

  if (failures.length) {
    console.error('Encounter pack check failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('Encounter pack check passed.');
}

main();
