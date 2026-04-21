# Content Config Design

## Config Philosophy
Content expansion should come mostly from structured data and existing code paths. Code owns rules; config chooses combinations, values, and presentation.

## Arena Schema
```js
{
  id: 'arena_circle',
  nameKey: 'arena.circle.name',
  type: 'circle',
  visualTheme: 'neon_blue',
  shape: {
    sides: 8,
    radiusScale: 0.97,
    rotation: Math.PI / 8
  },
  geometry: {
    radius: 8,
    bowlHeight: 0.58,
    hazardStart: 6.5,
    ringOutRadius: 9.0,
    hazardScale: 0.82,
    nearWallScale: 0.94
  },
  physics: {
    slopeForce: 5.5,
    wallBounceBase: 1.38,
    wallBounceSpeedBonus: 0.28,
    radialPull: 0.6,
    wallPush: 0.42
  },
  pickups: {
    orbSpawnPoints: [{ x: -2.5, z: 0 }, { x: 2.5, z: 0 }],
    respawnMs: 9500
  },
  renderer: {
    centerMarkerColor: '#00ffcc',
    rimColor: '#0055ff',
    hazardColor: '#ff2200',
    accentColor: '#1a3355'
  }
}
```

Current implementation note:
- `src/config-arenas.js` now supports same-family arena expansion by parameterizing `shape`, `geometry`, `physics`, and `renderer`.
- New arena families still require code, but new arenas within the existing `circle`, `heart`, and polygon/`hex` families can stay config-driven.

## Top Schema
```js
{
  id: 'top_impact',
  variant: 'core',
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

Notes:
- `nameKey` is the player-facing machine name, while the shared gameplay bucket should continue to come from the family/class mapping.
- Loadout type copy should render the shared family tier (`Assault / Bulwark / Skirmish`, localized per locale) instead of repeating a top's individual variant title.
- Locale content may also attach a `reading` field for Japanese-only furigana on proper names. This is presentation metadata, not gameplay identity.
- Japanese `reading` should only render on name-learning surfaces such as Home, Loadout cards, featured top, Quick Battle selection, and Path preview panels. HUD/result/share text should remain plain text.
- `variant` is the hook for balance/render differentiation inside the same top family.
- `meshFamily` can point at family-scoped variants such as `impact_nova` or `armor_mammoth` when the same skill family needs a distinct silhouette.
- Loadout top cards should be generated from the config roster length rather than hardcoded DOM slots.

## Enemy Preset Schema
Current implementation status:
- `src/config-enemy-presets.js` is now the live enemy preset table.
- Challenge Road nodes now reference `enemyPresetId` instead of `enemyTopId`.
- Presets currently own enemy top selection plus differentiated AI tuning values, while reward tuning stays outside the preset.

```js
{
  id: 'armor_standard',
  label: 'ARMOR STANDARD',
  topId: 'armor',
  ai: {
    seekForce: 6.5,
    speedCapScale: 0.9,
    inwardBiasRadius: 5.9,
    inwardBiasForce: 7,
    dashRange: 4.5,
    dashScale: 2.2,
    dashCooldownScaleMin: 0.8,
    dashCooldownScaleMax: 1.3,
    useSkillOnBurstReady: true
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
  id: 'node-5',
  name: 'Tight Clock',
  arenaIndex: 2,
  enemyPresetId: 'trick_standard',
  modifierId: 'suddenDeath',
  reward: 40,
  unlockTopId: 'trick'
}
```

## Unlock / Tuning Schema
Current implementation status:
- `src/config-economy.js` now owns the shared result reward and continue/runtime tuning values.
- Arena/top unlock costs remain with arena/top content configs because they are content-specific, not global economy rules.
- Challenge node reward bonuses remain on the node config because they are node-specific.

```js
{
  rewards: {
    winBase: 20,
    lossBase: 8,
    doubleRewardMultiplier: 2
  },
  runtime: {
    defaultRoundTimer: 30,
    challengeContinueEnabled: true,
    challengeContinueLimit: 1
  }
}
```

## What Can Be Config-Only
- Top roster metadata and base stats.
- Top family variants that still reuse an existing skill behavior family.
- Arena parameter values when using existing geometry families.
- Enemy presets and AI tuning numbers.
- Modifier values.
- Challenge Road node ordering and rewards.
- Loadout roster card count and per-top presentation copy.
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
