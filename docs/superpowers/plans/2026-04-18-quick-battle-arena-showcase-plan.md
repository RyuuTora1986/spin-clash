# Quick Battle Arena Showcase Plan

> **Goal:** keep the current shell route split, but rebuild `Quick Battle` into a route where the arena becomes the primary preview target and the chosen top becomes a smaller confirmation element.

## Direction Lock
- Keep the current static `HTML/CSS/JS` architecture.
- Preserve the current visual style and avoid a broad redesign.
- Keep `Home` as the main place where the player understands and changes the active top.
- Make `Quick Battle` responsible for arena browsing and match start only.

## Target UX
- The top half of `Quick Battle` becomes a large arena preview stage with left/right switching.
- The arena stage shows:
  - arena name
  - lock state
  - short arena description
- The lower area becomes a compact ready strip:
  - left: small current-top model, display-only
  - right: start button and one-line readiness hint
- Locked arenas remain previewable.
- If the current top is locked for any reason, the start button becomes blocked and warning-colored with an explicit hint.

## Implementation Shape
- Add a dedicated quick-battle preview DOM section instead of reusing the old arena chips + top-card wall.
- Add an isolated `quick-battle-preview-tools` renderer so arena preview and small-top preview stay out of battle rendering.
- Reuse existing `top-render-tools` for the small-top model to stay consistent with `Home` and battle.
- Move arena switching to explicit `prevQuickArena` / `nextQuickArena` actions.
- Keep actual arena unlock/trial resolution at `startFight`, not while merely browsing.

## Verification
- Extend `scripts/check-shell-presentation.js` first so it fails until:
  - the new quick-battle DOM exists
  - quick arena cycling actions are exposed
  - quick route copy renders arena + current-top state
  - blocked start state appears when the top is locked
- Then run:
  - `npm run check:shellpresentation`
  - `npm run check:ui`
  - `npm run check:syntax`
- After code is stable, attach to the current Chrome session and capture full-page regression screenshots for the quick route.
