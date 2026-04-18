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
    'src/config-text.js',
    'src/config-tops.js'
  ].forEach((relPath) => loadConfigScript(relPath, root));

  const tops = root.config.tops || [];
  const text = root.config.text || {};
  const html = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
  const topIds = tops.map((top) => top && top.id).filter(Boolean);
  const reusableSkills = new Set(['Fly Charge', 'Fortress Pulse', 'Phantom']);

  if (tops.length !== 5) {
    fail(`config.tops must contain 5 entries for the expanded roster, found ${tops.length}`);
  }

  ['impact_breaker', 'trick_raider'].forEach((topId) => {
    if (!topIds.includes(topId)) {
      fail(`config.tops is missing required derived top: ${topId}`);
    }
  });

  tops.forEach((top, index) => {
    if (!top || typeof top !== 'object') {
      fail(`top at index ${index} is not an object`);
      return;
    }
    if (typeof top.family !== 'string' || !top.family) {
      fail(`top ${top.id || index} is missing family`);
    }
    if (typeof top.variant !== 'string' || !top.variant) {
      fail(`top ${top.id || index} is missing variant`);
    }
    if (typeof top.unlockSource !== 'string' || !top.unlockSource) {
      fail(`top ${top.id || index} is missing unlockSource`);
    }
    if (!reusableSkills.has(top.skill)) {
      fail(`top ${top.id || index} uses non-reusable skill family: ${top.skill}`);
    }
  });

  if (!Array.isArray(text.cards) || text.cards.length !== 5) {
    fail(`config.text.cards must contain 5 entries for the expanded roster, found ${Array.isArray(text.cards) ? text.cards.length : 'none'}`);
  }

  const cardMatches = [...html.matchAll(/class="card\b[^"]*"\s+data-id="(\d+)"/g)].map((match) => Number(match[1]));
  if (cardMatches.length !== 5) {
    fail(`index.html must contain 5 top card elements, found ${cardMatches.length}`);
  }

  for (let index = 0; index < 5; index += 1) {
    if (!cardMatches.includes(index)) {
      fail(`index.html is missing top card with data-id="${index}"`);
    }
    ['icon', 'name', 'type', 'stats', 'skill'].forEach((suffix) => {
      const id = `card-${suffix}-${index}`;
      if (!html.includes(`id="${id}"`)) {
        fail(`index.html is missing element id="${id}"`);
      }
    });
  }

  if (failures.length) {
    console.error('Roster shell check failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('Roster shell check passed.');
}

main();
