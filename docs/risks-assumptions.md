# Risks And Assumptions

## Technical Risks
- The current file already shows encoding corruption, so careless extraction could spread mojibake into newly created modules.
- The malformed CSS block outside `<style>` indicates the prototype markup is not fully trustworthy and should be normalized carefully.
- Physics feel can regress easily during refactor because movement, collision, particles, audio, and camera feedback are tightly coupled.
- Some current visual effects mutate materials by traversing full mesh trees each frame; that can become a performance issue if content count grows.
- The current AI is simple enough to preserve, but Challenge Road may expose its predictability quickly unless enemy presets meaningfully vary tuning.

## Product Risks
- Without analytics, it is easy to overbuild content before learning whether players return after the first few sessions.
- Rewarded placements can feel cheap if offered too often or at weak emotional moments.
- A static-only game with no social graph must rely on highly shareable moments and short-session replay value to grow.
- If unlock pacing is too slow, the game will feel grindy; if too fast, monetization and retention surfaces collapse.

## Maintainability Risks
- If config and code boundaries are not enforced early, the refactor will recreate the monolith in multiple files.
- If player-facing text is not centralized during extraction, the encoding problem will keep returning.
- If services are allowed to leak provider details into gameplay code, later integration cost will spike.

## Dependency Risks
- CDN-hosted Three.js and fonts are a launch risk for uptime, privacy, and deterministic builds.
- Rewarded ads on static web can be provider-constrained depending on host platform and browser capabilities; the abstraction must assume mock-first, provider-later.
- Web Share API support varies; fallback design is mandatory.

## Assumptions
- The original duel feel is worth preserving and is the product's strongest asset.
- Static hosting is a hard constraint for MVP.
- The user wants incremental refactor, not a framework rewrite.
- Real ad SDK integration may not be immediately available, so mocks are required.
- Persistence can rely on browser-side storage abstractions for MVP, but durable long-term progression still assumes `localStorage` is available on the target host/browser.

## Fallback Paths
- If a no-build module split becomes too brittle for vendor packaging, add a minimal build only for dependency bundling while keeping source modules human-readable.
- If real rewarded ads are not practical on the chosen host, ship with mock reward hooks during prototype validation and only enable live monetization on supported platforms later.
- If share-card image generation is too costly in MVP, ship text and screenshot-oriented share payloads first.
- If the third arena geometry proves riskier than expected, keep the same bowl math and vary the boundary polygon rather than inventing a new arena system.
