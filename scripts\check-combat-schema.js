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
    'src/config-tops.js'
  ].forEach((relPath) => loadConfigScript(relPath, root));

  const tops = root.config.tops || [];
  if (!Array.isArray(tops) || tops.length === 0) {
    fail('config.tops is missing or empty');
  }

  const coreFamilies = {};
  tops.forEach((top, index) => {
    const combat = top && top.combat;
    if (!combat || typeof combat !== 'object') {
      fail(`top ${top && top.id ? top.id : index} is missing combat schema`);
      return;
    }
    const actions = combat.actions || {};
    if (!actions.dash || actions.dash.id !== 'dash') {
      fail(`top ${top.id} is missing combat.actions.dash`);
    }
    if (!actions.guard || actions.guard.id !== 'guard') {
      fail(`top ${top.id} is missing combat.actions.guard`);
    } else {
      if (typeof actions.guard.cooldown !== 'number' || actions.guard.cooldown <= 0) {
        fail(`top ${top.id} is missing combat.actions.guard.cooldown`);
      }
      if (typeof actions.guard.duration !== 'number' || actions.guard.duration <= 0) {
        fail(`top ${top.id} is missing combat.actions.guard.duration`);
      }
    }
    if (!actions.signature || typeof actions.signature.skillId !== 'string' || !actions.signature.skillId) {
      fail(`top ${top.id} is missing combat.actions.signature.skillId`);
    } else if (actions.signature.skillId !== top.skill) {
      fail(`top ${top.id} signature skill mismatch: combat=${actions.signature.skillId} skill=${top.skill}`);
    }
    if (!combat.collision || typeof combat.collision.roleBias !== 'number' || !Number.isFinite(combat.collision.roleBias)) {
      fail(`top ${top.id} is missing combat.collision.roleBias`);
    }
    if (!combat.attrition || typeof combat.attrition.hpDecayPerSec !== 'number' || combat.attrition.hpDecayPerSec < 0) {
      fail(`top ${top.id} is missing combat.attrition.hpDecayPerSec`);
    }
    if (top.variant === 'core') {
      coreFamilies[top.family] = combat.attrition.hpDecayPerSec;
    }
  });

  const armor = tops.find((top) => top && top.id === 'armor');
  if (!armor) {
    fail('armor top is missing');
  } else if (armor.skill !== 'Fortress Pulse') {
    fail(`armor signature skill should be Fortress Pulse after guard activation, found ${armor.skill}`);
  } else if (Math.abs(armor.combat.collision.roleBias - 0.95) > 0.0001) {
    fail(`armor roleBias should stay at 0.95 for the current balance baseline, found ${armor.combat.collision.roleBias}`);
  }

  if (
    typeof coreFamilies.armor === 'number'
    && typeof coreFamilies.impact === 'number'
    && typeof coreFamilies.trick === 'number'
  ) {
    if (!(coreFamilies.armor <= coreFamilies.impact && coreFamilies.impact <= coreFamilies.trick)) {
      fail('core family attrition ordering must stay armor <= impact <= trick');
    }
  }

  if (failures.length) {
    console.error('Combat schema check failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('Combat schema check passed.');
}

main();
