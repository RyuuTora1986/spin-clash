# Architecture Overview

## Goal
Split the monolith into the smallest static, inspectable project that preserves the current duel feel while adding the minimum shell required for progression, persistence, rewarded value exchange, and later content expansion.

Status note:
- This document was originally written as the target shape for the refactor.
- The current implementation intentionally stayed even lighter:
  - plain script factories under `src/`
  - one orchestrating `src/main.js`
  - vendored `assets/vendor/three.min.js`
- Do not treat the folder tree below as a mandatory migration target. It is a boundary guide, not a command to re-restructure the current working runtime.

## Design Principles
- Keep plain HTML, CSS, and JavaScript.
- Keep static hosting compatibility and avoid backend assumptions.
- Preserve the existing rendering, physics, SFX, and match loop concepts before adding new systems.
- Move hardcoded content into config before inventing new mechanics.
- Keep runtime dependencies minimal and vendor them locally.
- Optimize for low-maintenance deployment on a static host.

## Recommended Target Structure
```text
spin-clash/
  index.html
  assets/
    vendor/
      three.min.js
    audio/
      README.md
    icons/
  css/
    base.css
    hud.css
    overlays.css
  src/
    main.js
    bootstrap/
      app.js
      dom.js
      constants.js
    core/
      state-store.js
      game-loop.js
      events.js
      random.js
    config/
      tops.js
      arenas.js
      modifiers.js
      enemy-presets.js
      challenge-road.js
      economy.js
      text.js
    content/
      top-factory.js
      arena-factory.js
      orb-system.js
      particles.js
      trails.js
      scratch-layer.js
    gameplay/
      round-controller.js
      match-controller.js
      combat-system.js
      movement-system.js
      collision-system.js
      ai-system.js
      skill-system.js
      win-condition-system.js
    render/
      scene.js
      camera.js
      lighting.js
      hud-renderer.js
      overlay-renderer.js
    audio/
      audio-engine.js
      music-engine.js
      sfx-engine.js
    input/
      pointer-launch.js
      action-input.js
    services/
      storage-service.js
      analytics-service.js
      reward-service.js
      share-service.js
      debug-service.js
    modes/
      quick-battle-mode.js
      challenge-road-mode.js
    debug/
      debug-panel.js
      debug-query.js
  docs/
  originals/
    spin_clash.original.html
```

Current repo reality:
- `index.html`
- `css/game.css`
- `src/main.js`
- many focused `src/*-tools.js`, `src/*-service.js`, and `src/config-*.js` files
- `assets/vendor/three.min.js`

That current shape is acceptable and should be preserved unless a specific maintenance problem requires another split.

## Smallest Safe Split From The Monolith
1. `index.html`
   - minimal shell with mount nodes and script imports.
2. `css/*`
   - layout and overlay styling only.
3. `src/main.js`
   - bootstraps the app.
4. `src/audio/*`
   - preserve Web Audio synthesis as-is conceptually, just extracted.
5. `src/render/*`
   - scene, camera, arena mesh setup, top mesh factory, particles, trails, scratch layer.
6. `src/gameplay/*`
   - movement, collision, AI, skills, win conditions, round/match control.
7. `src/config/*`
   - content and text tables.
8. `src/services/*`
   - persistence, analytics, rewarded flow, sharing, debug hooks.

This is intentionally not a framework migration. It is still the same game, just split along responsibilities that already exist inside the single file.

## Module Boundaries
- `bootstrap`: app assembly, startup, environment flags, DOM wiring.
- `core`: global state container, lightweight event bus, deterministic update ordering.
- `config`: content-only data and tuning values.
- `content`: factories and reusable systems that create arena/top/orb/particle assets from config.
- `gameplay`: battle rules and state transitions.
- `render`: all scene-side drawing and HUD/overlay updates.
- `audio`: music and SFX generation.
- `input`: pointer drag and active skill controls.
- `services`: persistent and platform-facing abstractions.
- `modes`: thin wrappers defining what content/config gets loaded and what happens on completion/failure.
- `debug`: developer-only query-flag tooling and tuning readouts.

## What Should Move To Config First
- Top stats and metadata.
- Arena descriptors and hazard tuning.
- Enemy presets.
- Modifier definitions.
- Challenge node structure.
- Reward values and unlock costs.
- Player-facing text.

## What Should Stay Code-Driven For Now
- Physics resolution.
- Collision response.
- Arena mesh generation algorithms.
- Audio synthesis algorithms.
- Input handling.
- Core state transitions.
- Rewarded-ad provider adapters.

## Dependency Strategy
- Vendor Three.js locally instead of loading from CDN.
- Prefer local assets over third-party runtime dependencies.
- Google Fonts are still referenced today; treat local hosting or dependency removal as a later hardening task, not a prerequisite for continuing implementation.
- Keep zero build step initially.
- Keep the current no-build plain-script approach unless a concrete problem justifies changing it.
- Only introduce a build step later if asset bundling or code-splitting becomes necessary for measured reasons.

## Deployment Strategy
- Static host target: GitHub Pages, Netlify, Cloudflare Pages, Vercel static, or any plain CDN host.
- Runtime must work without server headers beyond standard static hosting.
- Save data currently routes through `StorageService` with fallback behavior:
  - `local`
  - `session`
  - `window_name`
  - `memory`
- Long-term durable progression still assumes `local` mode is available on the target host/browser.
- Rewarded ads and analytics default to mock adapters so the game remains playable when providers are absent.

## Why This Is The Right Architecture
- It preserves the prototype's strengths instead of replacing them.
- It creates narrow seams for progression and monetization without backend expansion.
- It supports config-driven content growth with minimal engineering overhead.
- It keeps the project inspectable for later tuning and ad-platform adaptation.
