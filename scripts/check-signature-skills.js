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

function createCombatTools() {
  const elements = new Map();
  const context = vm.createContext({
    console,
    window: {},
    document: {
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
    },
    setTimeout(fn) {
      fn();
      return 1;
    }
  });
  context.window = context;
  context.SpinClash = {};
  loadScript(path.join('src', 'combat-action-tools.js'), context);
  const tracker = { messages: [], skills: [] };
  const tools = context.SpinClash.createCombatActionTools({
    signatureSkills: {
      'Fortress Pulse': {
        telegraph: { flashType: 'sustained', tone: 'major', playerDuration: 1, enemyDuration: 0.9 }
      }
    },
    uiText: {
      skillMessages: {
        player: {
          'Fortress Pulse': 'Fortress Pulse!'
        },
        enemy: {
          'Fortress Pulse': 'Enemy used Fortress Pulse!'
        }
      }
    },
    renderer: { domElement: { addEventListener() {} } },
    getGameState: () => 'active',
    getTp: () => null,
    getTe: () => null,
    showMsg(message, duration, tone) {
      tracker.messages.push({ message, duration, tone });
    },
    sfxDash() {},
    sfxGuard() {},
    sfxSkill(skillId) {
      tracker.skills.push(skillId);
    },
    spawnParts() {},
    launch() {},
    onDragStart() {},
    onDragMove() {},
    onDragEnd() {}
  });
  return { tools, tracker, elements };
}

function createVariantCombatTools() {
  const context = vm.createContext({
    console,
    window: {},
    document: {
      getElementById() {
        return createElement();
      },
      addEventListener() {},
      querySelector() {
        return createElement();
      }
    },
    setTimeout(fn) {
      fn();
      return 1;
    }
  });
  context.window = context;
  context.SpinClash = {};
  loadScript(path.join('src', 'combat-action-tools.js'), context);
  return context.SpinClash.createCombatActionTools({
    signatureSkills: rootSignatureSkills,
    uiText: {},
    renderer: { domElement: { addEventListener() {} } },
    getGameState: () => 'active',
    getTp: () => null,
    getTe: () => null,
    showMsg() {},
    sfxDash() {},
    sfxGuard() {},
    sfxSkill() {},
    spawnParts() {},
    launch() {},
    onDragStart() {},
    onDragMove() {},
    onDragEnd() {}
  });
}

let rootSignatureSkills = null;

function createRuntimeAudioTools(signatureSkills) {
  const root = { SpinClash: {} };
  const context = vm.createContext({
    console,
    window: Object.assign(root, {
      location: { href: 'http://localhost/' },
      addEventListener() {}
    }),
    document: {
      body: { appendChild() {} },
      createElement() {
        return { style: {}, textContent: '' };
      },
      getElementById() {
        return null;
      }
    },
    URL
  });
  context.window.window = context.window;
  loadScript(path.join('src', 'runtime-audio-tools.js'), context);
  return context.window.SpinClash.createRuntimeAudioTools({
    signatureSkills,
    storageService: {
      get() {
        return { settings: { musicEnabled: true, sfxEnabled: true } };
      }
    }
  });
}

function main() {
  const root = { config: {}, services: {}, state: {}, debug: {} };
  const configContext = vm.createContext({
    console,
    window: { SpinClash: root }
  });
  loadScript(path.join('src', 'bootstrap-app-globals.js'), configContext);
  loadScript(path.join('src', 'config-text.js'), configContext);
  loadScript(path.join('src', 'config-tops.js'), configContext);
  loadScript(path.join('src', 'config-signature-skills.js'), configContext);

  const tops = root.config.tops || [];
  const signatureSkills = root.config.signatureSkills || {};
  rootSignatureSkills = signatureSkills;
  const text = root.config.text || {};
  const armor = tops.find((top) => top && top.id === 'armor');
  assert(armor, 'Expected armor top to exist.');
  assert(armor.skill === 'Fortress Pulse', 'Expected armor signature skill to move off Shield to Fortress Pulse.');
  assert(
    armor.combat && armor.combat.actions && armor.combat.actions.signature && armor.combat.actions.signature.skillId === 'Fortress Pulse',
    'Expected armor combat signature skillId to be Fortress Pulse.'
  );
  assert(text.skillLabels && text.skillLabels['Fortress Pulse'] === 'Fortress Pulse', 'Expected text.skillLabels to include Fortress Pulse.');
  assert(
    text.cards && text.cards[1] && String(text.cards[1].skill).indexOf('Fortress Pulse') >= 0,
    'Expected armor loadout card text to reference Fortress Pulse.'
  );
  assert(signatureSkills['Fortress Pulse'], 'Expected signature registry to include Fortress Pulse.');
  assert(signatureSkills['Fortress Pulse'].icon === 'FP', 'Expected Fortress Pulse registry icon to be FP.');
  assert(signatureSkills['Fortress Pulse'].audioStyle === 'pulse', 'Expected Fortress Pulse registry audio style to be pulse.');
  assert(signatureSkills['Fortress Pulse'].telegraph && signatureSkills['Fortress Pulse'].telegraph.flashType === 'sustained', 'Expected Fortress Pulse telegraph flash type to be sustained.');
  assert(signatureSkills['Fortress Pulse'].hudAccent && signatureSkills['Fortress Pulse'].hudAccent.readyStroke, 'Expected Fortress Pulse registry to expose HUD accent colors.');
  assert(
    signatureSkills['Fly Charge'].variants && signatureSkills['Fly Charge'].variants.breaker,
    'Expected Fly Charge registry to define a Breaker variant tuning block.'
  );
  assert(
    signatureSkills['Phantom'].variants && signatureSkills['Phantom'].variants.raider,
    'Expected Phantom registry to define a Raider variant tuning block.'
  );
  tops
    .filter((top) => top && top.variant && top.variant !== 'core')
    .forEach((top) => {
      const skillId = top.combat && top.combat.actions && top.combat.actions.signature
        ? top.combat.actions.signature.skillId
        : top.skill;
      const registryEntry = signatureSkills[skillId];
      assert(registryEntry, `Expected signature registry entry for ${skillId}.`);
      assert(
        registryEntry.variants && registryEntry.variants[top.variant],
        `Expected ${skillId} registry to define a ${top.variant} variant tuning block for ${top.id}.`
      );
    });
  tops.forEach((top) => {
    const skillId = top && top.combat && top.combat.actions && top.combat.actions.signature
      ? top.combat.actions.signature.skillId
      : (top ? top.skill : null);
    assert(signatureSkills[skillId], `Expected signature registry entry for ${skillId}.`);
    assert(signatureSkills[skillId].audioStyle, `Expected ${skillId} registry entry to expose an audioStyle.`);
    assert(signatureSkills[skillId].hudAccent, `Expected ${skillId} registry entry to expose hudAccent metadata.`);
  });

  const audioTools = createRuntimeAudioTools(signatureSkills);
  assert(audioTools.resolveSignatureAudioStyle('Fly Charge') === 'charge', 'Expected Fly Charge to resolve to charge audio style.');
  assert(audioTools.resolveSignatureAudioStyle('Fortress Pulse') === 'pulse', 'Expected Fortress Pulse to resolve to pulse audio style.');
  assert(audioTools.resolveSignatureAudioStyle('Phantom') === 'phantom', 'Expected Phantom to resolve to phantom audio style.');

  const { tools, tracker, elements } = createCombatTools();
  const armorUser = {
    isPlayer: true,
    x: 0,
    z: 0,
    vx: 6,
    vz: 0,
    shielding: false,
    guarded: false,
    guarding: false,
    template: {
      spd: 10,
      skill: 'Fortress Pulse',
      combat: {
        actions: {
          signature: { skillId: 'Fortress Pulse' }
        }
      }
    }
  };
  const enemyTarget = {
    x: 2,
    z: 0,
    vx: 0,
    vz: 0,
    burst: 20
  };
  tools.fireSkill(armorUser, enemyTarget);
  assert(tracker.skills.includes('Fortress Pulse'), 'Expected Fortress Pulse to route through the signature SFX path.');
  assert(tracker.messages.some((entry) => entry.message === 'Fortress Pulse!'), 'Expected Fortress Pulse to emit its localized player message.');
  assert(tracker.messages.some((entry) => entry.tone === 'major' && entry.duration === 1), 'Expected Fortress Pulse telegraph to drive tone and duration from the registry.');
  assert(enemyTarget.vx > 0, 'Expected Fortress Pulse to knock the enemy away from Armor.');
  assert(enemyTarget.vx < 7.2, 'Expected Fortress Pulse knockback to stay below the earlier stronger baseline.');
  assert(Math.abs(armorUser.vx) < 6, 'Expected Fortress Pulse to steady Armor instead of preserving full forward dash momentum.');
  assert(elements.get('skill-flash').className === 'sustained', 'Expected Fortress Pulse telegraph to drive flash type from the registry.');

  const variantTools = createVariantCombatTools();
  const breakerTarget = { x: 2, z: 0, vx: 0, vz: 0 };
  const breakerUser = {
    isPlayer: true,
    x: 0,
    z: 0,
    vx: 0,
    vz: 0,
    template: {
      id: 'impact_breaker',
      variant: 'breaker',
      spd: 10,
      skill: 'Fly Charge',
      combat: {
        actions: {
          signature: { skillId: 'Fly Charge' }
        }
      }
    }
  };
  variantTools.fireSkill(breakerUser, breakerTarget);
  assert(breakerUser.vx > 24, 'Expected Breaker Fly Charge to push faster than the base charge scale.');
  assert(breakerUser.roleBiasBoost > 0, 'Expected Breaker Fly Charge to grant a temporary collision role bias boost.');
  assert(breakerUser.roleBiasBoostT > 0, 'Expected Breaker Fly Charge to grant a temporary role-bias window.');

  const raiderTarget = { x: 2, z: 0, vx: 0, vz: 0 };
  const raiderUser = {
    isPlayer: true,
    x: 0,
    z: 0,
    vx: 0,
    vz: 0,
    template: {
      id: 'trick_raider',
      variant: 'raider',
      spd: 10,
      skill: 'Phantom',
      combat: {
        actions: {
          signature: { skillId: 'Phantom' }
        }
      }
    }
  };
  variantTools.fireSkill(raiderUser, raiderTarget);
  assert(raiderUser.phantomT > 1.2, 'Expected Raider Phantom to extend the phantom window beyond the base skill.');
  assert(Math.abs(raiderUser.vz) > 0.5, 'Expected Raider Phantom to add a visible lateral drift component.');
  assert(raiderTarget.vx > 4.5, 'Expected Raider Phantom to push harder than the base Phantom knockback.');

  const novaTarget = { x: 2, z: 0, vx: 0, vz: 0 };
  const novaUser = {
    isPlayer: true,
    x: 0,
    z: 0,
    vx: 0,
    vz: 0,
    template: {
      id: 'impact_nova',
      variant: 'nova',
      spd: 10,
      skill: 'Fly Charge',
      combat: {
        actions: {
          signature: { skillId: 'Fly Charge' }
        }
      }
    }
  };
  variantTools.fireSkill(novaUser, novaTarget);
  assert(novaUser.vx > 24, 'Expected Nova Fly Charge to exceed the base charge speed.');
  assert(novaUser.dashT < 0.28, 'Expected Nova Fly Charge to shorten the direct dash window.');

  const mammothTarget = { x: 2, z: 0, vx: 0, vz: 0, spin: 100, hp: 40 };
  const mammothUser = {
    isPlayer: true,
    x: 0,
    z: 0,
    vx: 8,
    vz: 0,
    tiltVX: 1,
    tiltVZ: 0,
    template: {
      id: 'armor_mammoth',
      variant: 'mammoth',
      spd: 10,
      skill: 'Fortress Pulse',
      combat: {
        actions: {
          signature: { skillId: 'Fortress Pulse' }
        }
      }
    }
  };
  variantTools.fireSkill(mammothUser, mammothTarget);
  assert(mammothTarget.vx > 6.8, 'Expected Mammoth Fortress Pulse to knock harder than the base pulse.');
  assert(Math.abs(mammothUser.vx) < 2.08, 'Expected Mammoth Fortress Pulse to anchor the user harder than the base pulse.');

  const glitchTarget = { x: 2, z: 0, vx: 0, vz: 0 };
  const glitchUser = {
    isPlayer: true,
    x: 0,
    z: 0,
    vx: 0,
    vz: 0,
    template: {
      id: 'trick_glitch',
      variant: 'glitch',
      spd: 10,
      skill: 'Phantom',
      combat: {
        actions: {
          signature: { skillId: 'Phantom' }
        }
      }
    }
  };
  variantTools.fireSkill(glitchUser, glitchTarget);
  assert(glitchUser.phantomT > 1.2, 'Expected Glitch Phantom to extend the phantom window beyond the base skill.');
  assert(Math.abs(glitchUser.vz) > 1.2, 'Expected Glitch Phantom to add a stronger lateral drift component.');
  assert(glitchTarget.vx > 4.8, 'Expected Glitch Phantom to push harder than the base Phantom knockback.');

  console.log('Signature skill check passed.');
}

try {
  main();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
