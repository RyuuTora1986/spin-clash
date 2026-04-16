# Content Config Design

## Config Philosophy
Content expansion should come mostly from structured data and existing code paths. Code owns rules; config chooses combinations, values, and presentation.

## Arena Schema
```js
{
  id: 'arena_circle',
  nameKey: 'arena.circle.name',
  type: 'circle_bowl',
  visualTheme: 'neon_blue',
  geometry: {
    radius: 8,
    bowlHeight: 0.58,
    hazardStart: 6.5,
    ringOutRadius: 9.0
  },
  physics: {
    slopeForce: 5.5,
    wallBounceBase: 1.38,
    wallBounceSpeedBonus: 0.28
  },
  pickups: {
    orbSpawnPoints: [{ x: -2.5, z: 0 }, { x: 2.5, z: 0 }],
    respawnMs: 9500
  },
  renderer: {
    centerMarkerColor: '#00ffcc',
    rimColor: '#0055ff',
    hazardColor: '#ff2200'
  }
}
```

## Top Schema
```js
{
  id: 'top_impact',
  nameKey: 'top.impact.name',
  classKey: 'top.impact.class',
  skillId: 'skill_charge',
  stats: {
    hp: 140,
    maxSpin: 3400,
    speed: 28,
    mass: 0.8,
    burstRate: 1.2
  },
  visuals: {
    color: 0xff4400,
    emissive: 0x551100,
    meshFamily: 'impact'
  },
  unlock: {
    cost: 0,
    defaultUnlocked: true
  }
}
```

## Enemy Preset Schema
```js
{
  id: 'enemy_armor_baseline',
  nameKey: 'enemy.armorBaseline.name',
  topId: 'top_armor',
  ai: {
    seekForce: 6.5,
    inwardBiasRadius: 5.9,
    inwardBiasForce: 7,
    dashRange: 4.5,
    dashScale: 2.2,
    dashCooldownScaleMin: 0.8,
    dashCooldownScaleMax: 1.3,
    preferredSkillUse: 'onReady'
  },
  reward: {
    payoutMultiplier: 1
  }
}
```

## Modifier Schema
```js
{
  id: 'modifier_hot_rim',
  nameKey: 'modifier.hotRim.name',
  descriptionKey: 'modifier.hotRim.desc',
  effects: {
    hazardSpinDrainBonus: 3,
    hazardDamagePerSecond: 0
  },
  ui: {
    icon: 'hot_rim'
  }
}
```

## Challenge Node Schema
```js
{
  id: 'road_03',
  order: 3,
  arenaId: 'arena_hex_bowl',
  enemyPresetId: 'enemy_trick_fast',
  modifierIds: ['modifier_fast_burst'],
  rewards: {
    clearCurrency: 40,
    firstClearBonus: 20
  },
  unlocksOnClear: {
    topIds: [],
    arenaIds: []
  }
}
```

## Unlock / Tuning Schema
```js
{
  economy: {
    resultWin: 20,
    resultLoss: 8,
    challengeFirstClearBonus: 20,
    rewardDoubleEnabled: true
  },
  unlocks: {
    top_armor_variant: 120,
    arena_hex_bowl: 180
  },
  runtime: {
    roundSeconds: 30,
    bestOfRounds: 3,
    continueEnabled: true,
    continueLimitPerRun: 1
  }
}
```

## What Can Be Config-Only
- Top roster metadata and base stats.
- Arena parameter values when using existing geometry families.
- Enemy presets and AI tuning numbers.
- Modifier values.
- Challenge Road node ordering and rewards.
- Unlock costs and economy numbers.
- Localized text strings.

## What Still Requires Code
- New arena geometry families.
- New skill behavior families.
- Core collision and movement logic.
- Save migrations.
- Reward provider integration.
- Result-card generation and share image pipeline.

## Cheapest Third Arena Recommendation
Use a procedural hex bowl.
- It is visually distinct from the circle and heart arenas.
- It can reuse most of the existing bowl logic.
- It only needs polygon boundary helpers rather than a new asset pipeline.
- It supports fresh wall-angle interactions without introducing new traversal mechanics.
