const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const failures = [];

function read(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function fail(message) {
  failures.push(message);
}

function expectIncludes(text, pattern, message) {
  if (!text.includes(pattern)) {
    fail(message);
  }
}

function expectExcludes(text, pattern, message) {
  if (text.includes(pattern)) {
    fail(message);
  }
}

function main() {
  const mainText = read('src/main.js');
  const uiShellText = read('src/ui-shell-tools.js');
  const battleViewText = read('src/battle-view-tools.js');
  const battleSimText = read('src/battle-sim-tools.js');
  const scratchText = read('src/scratch-layer-tools.js');
  const trailText = read('src/trail-render-tools.js');
  const battleEffectsText = read('src/battle-effects-tools.js');

  expectIncludes(
    mainText,
    'battlePerfMetrics',
    'Expected src/main.js to define a battlePerfMetrics runtime collector.'
  );
  expectIncludes(
    mainText,
    'recordBattlePerfPhase',
    'Expected src/main.js to record named battle perf phases for frame-time analysis.'
  );
  expectIncludes(
    mainText,
    'battlePerformanceMode',
    'Expected src/main.js to expose a battlePerformanceMode hook for mobile-only downgrade control.'
  );
  expectExcludes(
    uiShellText,
    "querySelector('#burst-ring circle')",
    'Expected src/ui-shell-tools.js to avoid per-frame querySelector lookups inside battle HUD updates.'
  );
  expectIncludes(
    uiShellText,
    'battleHudRefs',
    'Expected src/ui-shell-tools.js to cache battle HUD DOM references.'
  );
  expectExcludes(
    battleViewText,
    'Date.now()',
    'Expected src/battle-view-tools.js to avoid Date.now() in active battle animation paths.'
  );
  expectExcludes(
    battleSimText,
    'Date.now()',
    'Expected src/battle-sim-tools.js to avoid Date.now() in active battle simulation visuals.'
  );
  expectIncludes(
    battleViewText,
    'shouldRefreshHud',
    'Expected src/battle-view-tools.js to throttle battle HUD refresh cadence.'
  );
  expectIncludes(
    scratchText,
    'textureDirty',
    'Expected src/scratch-layer-tools.js to batch scratch texture uploads instead of uploading every draw.'
  );
  expectIncludes(
    trailText,
    'getTrailMinDistanceSq',
    'Expected src/trail-render-tools.js to gate trail sampling by movement thresholds.'
  );
  expectIncludes(
    battleEffectsText,
    'inactiveParticles',
    'Expected src/battle-effects-tools.js to reuse particle instances instead of allocating every collision burst.'
  );

  if (failures.length) {
    console.error('Battle performance check failed:');
    failures.forEach((message) => console.error(`- ${message}`));
    process.exit(1);
  }

  console.log('Battle performance check passed.');
}

main();
