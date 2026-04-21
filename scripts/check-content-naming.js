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
    console,
    Math
  };
  vm.createContext(context);
  vm.runInContext(code, context, { filename: absPath });
}

function assertMap(actual, expected, label) {
  Object.entries(expected).forEach(([key, value]) => {
    if (actual[key] !== value) {
      fail(`${label} mismatch for ${key}: expected "${value}", got "${actual[key]}"`);
    }
  });
}

function main() {
  const root = { config: {}, services: {}, state: {}, debug: {} };
  [
    'src/bootstrap-app-globals.js',
    'src/config-text.js',
    'src/config-tops.js',
    'src/config-arenas.js'
  ].forEach((relPath) => loadConfigScript(relPath, root));

  const topNameMap = Object.fromEntries((root.config.tops || []).map((top) => [top.id, top.name]));
  const arenaLabelMap = Object.fromEntries((root.config.arenas || []).map((arena) => [arena.id, arena.label]));
  const localeContent = root.config.contentLocales || {};
  const zhTopMap = Object.fromEntries(Object.entries((localeContent.zh && localeContent.zh.tops) || {}).map(([id, entry]) => [id, entry.name]));
  const jaTopMap = Object.fromEntries(Object.entries((localeContent.ja && localeContent.ja.tops) || {}).map(([id, entry]) => [id, entry.name]));
  const zhArenaMap = Object.fromEntries(Object.entries((localeContent.zh && localeContent.zh.arenas) || {}).map(([id, entry]) => [id, entry.label]));
  const jaArenaMap = Object.fromEntries(Object.entries((localeContent.ja && localeContent.ja.arenas) || {}).map(([id, entry]) => [id, entry.label]));
  const locales = root.config.textLocales || {};

  assertMap(topNameMap, {
    impact: 'Crimson Edge',
    armor: 'Azure Bastion',
    trick: 'Night Gale',
    impact_breaker: 'Warbreak Pike',
    trick_raider: 'Shadowraid',
    impact_vanguard: 'Peak Ram',
    impact_nova: 'Starflare Descend',
    impact_tremor: 'Quakeguard Edge',
    armor_bastion: 'Stillkeep Crown',
    armor_aegis: 'Halo Ward',
    armor_mammoth: 'Stone Tusk Gate',
    armor_mirror: 'Mirror Array',
    trick_venom: 'Moonvenom',
    trick_orbit: 'Orbit Rite',
    trick_glitch: 'Foxfire Breach'
  }, 'English top name');

  assertMap(arenaLabelMap, {
    circle_bowl: 'Azure Ring Court',
    heart_bowl: 'Scarlet Heart Verge',
    hex_bowl: 'Shard Hex Array',
    cyclone_bowl: 'Tempest Maw Depth',
    rose_bowl: 'Thornbloom Snare',
    octa_bowl: 'Prism Arcade'
  }, 'English arena label');

  assertMap(zhTopMap, {
    impact: '赤霄锋',
    armor: '苍甲垣',
    trick: '夜岚游锋',
    impact_breaker: '破军断戟',
    trick_raider: '逐影袭星',
    impact_vanguard: '镇岳冲角',
    impact_nova: '星陨流焰',
    impact_tremor: '撼岳重锋',
    armor_bastion: '不动天城',
    armor_aegis: '光轮御壁',
    armor_mammoth: '磐象镇阙',
    armor_mirror: '镜轮返界',
    trick_venom: '碧牙蚀月',
    trick_orbit: '回天环轨',
    trick_glitch: '狐火断界'
  }, 'Chinese top name');

  assertMap(jaTopMap, {
    impact: '赤霄鋒',
    armor: '蒼甲垣',
    trick: '夜嵐遊鋒',
    impact_breaker: '破軍断戟',
    trick_raider: '逐影襲星',
    impact_vanguard: '鎮岳衝角',
    impact_nova: '星隕流焔',
    impact_tremor: '撼岳重鋒',
    armor_bastion: '不動天城',
    armor_aegis: '光輪御壁',
    armor_mammoth: '磐象鎮塁',
    armor_mirror: '鏡輪返界',
    trick_venom: '碧牙蝕月',
    trick_orbit: '回天環軌',
    trick_glitch: '狐火断界'
  }, 'Japanese top name');

  assertMap(zhArenaMap, {
    circle_bowl: '苍轮斗庭',
    heart_bowl: '绯心曲域',
    hex_bowl: '断棱角阵',
    cyclone_bowl: '岚涡深渊',
    rose_bowl: '棘华幽阱',
    octa_bowl: '八镜回廊'
  }, 'Chinese arena label');

  assertMap(jaArenaMap, {
    circle_bowl: '蒼輪闘庭',
    heart_bowl: '緋心曲域',
    hex_bowl: '断稜角陣',
    cyclone_bowl: '嵐渦深淵',
    rose_bowl: '棘華幽檻',
    octa_bowl: '八鏡回廊'
  }, 'Japanese arena label');

  const expectedTypes = {
    en: ['ASSAULT', 'BULWARK', 'SKIRMISH'],
    zh: ['强攻型', '守御型', '奇袭型'],
    ja: ['強攻型', '守御型', '奇襲型']
  };

  Object.entries(expectedTypes).forEach(([locale, allowedTypes]) => {
    const cards = (locales[locale] && locales[locale].cards) || [];
    const actualTypes = [...new Set(cards.map((card) => card && card.type).filter(Boolean))].sort();
    const expectedSorted = [...allowedTypes].sort();
    if (JSON.stringify(actualTypes) !== JSON.stringify(expectedSorted)) {
      fail(`${locale} card types mismatch: expected ${expectedSorted.join(', ')}, got ${actualTypes.join(', ')}`);
    }
  });

  if (failures.length) {
    console.error('Content naming check failed:');
    failures.forEach((message) => console.error(`- ${message}`));
    process.exit(1);
  }

  console.log('Content naming check passed.');
}

main();
