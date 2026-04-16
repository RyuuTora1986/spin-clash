# Reverse Engineering

## Repository Reality
- The workspace currently contains one source file: `spin_clash.html`.
- There is no Git repository metadata in `C:\Users\29940\spin-clash`.
- The prototype is a self-contained static page with inline CSS, HTML, and JavaScript.
- External runtime dependencies are loaded from CDNs: Google Fonts and `three.js` r128.
- The source includes mojibake in comments and some UI strings, indicating an encoding mismatch already happened before this session.

## What The Current Game Actually Is
- A static 3D spinning-top duel game built with Three.js and Web Audio API.
- Match structure is best-of-3 rounds.
- Core mode is a one-on-one duel against one CPU opponent.
- The player chooses one of three top archetypes and one of two arenas before the match.
- The player launches by drag-aiming in a prepare state, then uses dash and a burst skill during the active fight.
- Win conditions per round are ring-out, spin-out, HP depletion, or time decision by remaining HP ratio.

## Source Layout Inside The Monolith
- CSS and responsive HUD/layout rules occupy roughly lines 1-439.
- Menu, HUD, and overlay markup occupy roughly lines 441-597.
- Runtime script starts at line 598.
- Audio engine and music/SFX generation: lines 604-885.
- Arena geometry and scratch-mark rendering: lines 887-1249.
- Top textures and top mesh construction: lines 1251-1413.
- Input, combat state, physics, AI, round flow, HUD updates, and UI events: lines 1472-2060.

## Gameplay Loop
1. Title overlay opens.
2. Player enters loadout screen and selects arena plus one top.
3. `initRound()` sets state to `prepare`, spawns both tops, resets timer, HUD, particles, trails, and arena state.
4. Player drag-aims on the arena plane; releasing with enough drag calls `launch()`.
5. `launch()` sets state to `active`, starts music, assigns initial CPU velocity, spawns energy orbs, and begins the round.
6. `physTick()` runs the live loop: timer, movement, AI steering, collisions, orb collection, particles, scratch layer, trails, camera shake, top wobble, and HUD refresh.
7. `endRound()` resolves the winner and either advances to the next round or finishes the match.
8. `showMatchResult()` presents the best-of-3 result and allows replay or return to loadout.

## Match Flow
- Match score is tracked by `score = [playerWins, enemyWins]` at line 1484.
- A match ends when either side reaches 2 round wins in `endRound()` at lines 1878-1882.
- `resetMatch()` resets score and round count, then starts a fresh round.

## Round Flow
- `initRound()` creates fresh `tp` and `te` state objects from template data and places them in the chosen arena.
- State starts in `prepare` so the player can aim the launch.
- `launch()` transitions to `active` and seeds the CPU with a first burst toward the player.
- `physTick()` decrements `roundTimer` from 30 seconds.
- A round ends from timeout, ring-out, zero spin, or zero HP.

## Result Flow
- `endRound(reason)` maps end reasons to display text and winner resolution.
- Timeout uses HP ratio as the tiebreaker, which preserves the arcade feel without deeper scoring logic.
- The round overlay is shown for about 2.2 to 2.4 seconds before next action.
- Match result overlay only exposes replay or swap/rematch; there is no progression, reward, or persistence layer yet.

## State Machine
- `title`: initial overlay.
- `prepare`: tops are spawned, player can drag-aim and optionally return to loadout.
- `active`: live round simulation.
- `roundResult`: round overlay is visible and input is effectively suspended.
- `matchResult`: match overlay is visible.

## Player Input Model
- Mouse and touch drag on the renderer canvas set launch direction and strength through raycast-to-plane conversion in `xyToArena()` and drag handlers at lines 1490-1526.
- Keyboard inputs during `active` state:
  - `Space`: dash.
  - `Q`: burst skill.
- Mobile touch bindings exist for dash and skill buttons.
- There is no pause, settings, remappable controls, accessibility option, or fullscreen support.

## Enemy AI Behavior
- CPU AI is a simple seek-and-pressure controller in `aiTick()` at lines 1837-1852.
- It constantly accelerates toward the player, caps speed, nudges itself inward if it drifts too wide, dashes when close, and auto-fires its skill when burst reaches 100.
- AI always uses template index `1` (`AI_ID = 1`), so the opponent roster is effectively fixed.
- There is no content-driven enemy preset system yet.

## Rendering Structure
- Three.js renderer, scene, fog, camera, and lights are created once at lines 967-999.
- Arena meshes are rebuilt on round start.
- Tops are custom-composed mesh groups built from primitive geometry rather than imported assets.
- Motion readability is improved by trails, particle bursts, crown markers, camera shake, and a dynamic scratch layer.
- The visual stack is stronger than expected for a single-file prototype because the arena glow, top silhouettes, impact particles, and wobble all support legibility.

## Arena Generation Structure
- Arena selection is controlled by `currentArena`.
- Arena 0 is a circular bowl built from procedural ring geometry in `buildCircleArena()`.
- Arena 1 is a heart-shaped bowl derived from precomputed 2D boundary points and `ShapeGeometry` in `buildHeartArena()`.
- Arena rules are partly geometry-driven and partly hardcoded in physics helpers:
  - circle hazard threshold at radius 6.5.
  - circle ring-out beyond `AR + 1.0`.
  - heart wall/hazard/ring-out resolved by `heartContains`, `heartNearWall`, `heartInHaz`, `heartCrossed`, and `heartRingOut`.
- Arena definitions are not data-driven yet; geometry and rules are fused into code.

## Top Template Structure
- `TMPL` at lines 960-964 contains three archetypes with:
  - `name`
  - `skill`
  - `color`
  - `emi`
  - `hp`
  - `maxSpin`
  - `spd`
  - `mass`
  - `brate`
- These values already prove that content can be parameterized, but the system stops at top stats and does not yet cover unlocks, AI presets, or progression metadata.

## Skills And Cooldowns
- Every top has two active combat verbs:
  - universal dash on a 2.5 second cooldown.
  - template-specific burst skill on an 8 second cooldown after burst reaches 100.
- Skill families currently implemented:
  - `Impact / fly charge`: direct homing rush.
  - `Armor / shield`: temporary defensive state.
  - `Trick / phantom`: speed spike plus semi-intangible look and knock influence.
- Burst meter is earned mainly from collisions and orb pickups.
- Skill execution is handled by `fireSkill()` with top-specific branches, so the concept exists but is still hardcoded.

## Audio / Music / SFX Structure
- Audio is entirely synthesized with Web Audio API.
- Background music is procedurally sequenced with kick, snare, hats, bass, stabs, and lead parts.
- Collision, wall hit, launch, dash, orb, skill, ring-out, round win/loss, and countdown all have dedicated synthesis code.
- This is a major strength worth preserving because it avoids asset pipeline overhead while keeping strong match intensity.
- Audio only initializes after the first user interaction, which aligns with browser autoplay restrictions.

## HUD / Overlay / UI Structure
- In-match UI includes:
  - player and enemy panels with HP, spin, and burst.
  - dash and skill buttons with cooldown overlays.
  - top-center round pips and timer.
  - transient center-screen message text.
  - hint bar.
- Overlays include title, loadout, round result, and match result.
- The current UI is structurally usable but text is not centralized and menu flow is tightly coupled to inline DOM selectors.

## Hardcoded Content And Tuning Values
- Three player archetypes; one fixed CPU archetype.
- Two arenas only.
- Best-of-3 match format.
- 30 second rounds.
- Circle arena radius `AR = 8`, top radius `TOP_R = 0.55`.
- Shared friction and spin drain constants: `FRIC = 0.9996`, `SPIN_D = 1.2`, `SPIN_HAZ = 6`.
- Dash cooldown 2.5 seconds and skill cooldown 8 seconds for all templates.
- Energy orbs spawn at two fixed positions and respawn after 9.5 seconds once consumed.
- Collision damage, burst gain, wall bounce, and slow-motion triggers are all directly coded constants.

## External Dependencies And Deployment Risks
- `three.js` is pulled from Cloudflare CDN, which introduces third-party uptime and version pinning risk for a commercial launch.
- Google Fonts are pulled from `fonts.googleapis.com`, which is another external dependency and may affect load speed, privacy posture, and offline reproducibility.
- The malformed duplicate CSS block beginning around line 408 appears outside a `<style>` tag, which is invalid HTML and should be corrected before launch.
- Mojibake indicates the source text has already experienced encoding corruption. That is a maintainability risk and a documentation risk.
- There is no local persistence, analytics, ad abstraction, sharing abstraction, or content config layer.
- There is no packaging of external libraries for deterministic static deployment.

## What Is Already Surprisingly Good
- The battle core is readable and energetic.
- The launch-to-impact arc is immediate and arcade-friendly.
- Procedural audio gives the match a strong identity without content bloat.
- Arena scratch marks, trails, particles, and wobble make collisions feel expensive.
- The top silhouettes are distinct enough to communicate class fantasy.
- The best-of-3 flow is already a good short-session structure.

## What Most Threatens Commercialization And Maintainability
- Everything is in one file, so any feature addition risks accidental regressions across UI, rendering, physics, and flow.
- Text, comments, and identifiers are not normalized; some are already corrupted.
- The content model is too hardcoded to scale into challenge nodes, unlocks, or enemy presets safely.
- There is no persistence or versioned save schema.
- There is no analytics event surface, so monetization and retention decisions would be blind.
- There is no ad or share abstraction.
- CDN dependencies are unmanaged.
- The project cannot currently answer core commercial questions like retention, challenge clear rates, rewarded-ad uptake, or return-session behavior.
