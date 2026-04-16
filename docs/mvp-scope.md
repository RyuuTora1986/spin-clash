# MVP Scope

## MVP Must Include
- Static single-player web game.
- Preserved Quick Battle mode based on the current duel core.
- One additional mode: `Challenge Road`.
- Challenge Road with 6 to 8 nodes.
- Node variation driven by arena, enemy preset, and modifier combinations.
- One soft currency only.
- Lightweight unlock loop for a small set of tops and one extra arena.
- Local persistence with save versioning.
- RewardService abstraction with mock flow.
- ShareService abstraction with graceful browser fallback.
- AnalyticsService abstraction with inspectable local logging.
- One developer-only debug/tuning path via query flag.
- Documentation for local run and provider integration boundaries.

## MVP Should Preserve
- 3D arena presentation.
- Procedural SFX and music direction.
- Drag-to-launch input.
- Dash plus one burst skill per top.
- Best-of-3 duel structure inside battles.
- Ring-out, spin-out, HP-out, and timeout result logic.

## MVP Content Limits
- Keep the existing three top archetypes as the base roster.
- Add at most 1 to 2 unlockable variants derived from existing archetypes.
- Keep two current arenas plus exactly one new low-risk arena.
- Keep a small modifier list, roughly 5 to 8 total.
- Keep Challenge Road handcrafted only at the node table level; no procedural campaign generator.

## Explicit Cut List
- Multiplayer.
- PvP.
- Backend services.
- Accounts or login.
- Cloud save.
- Server-validated leaderboard.
- In-app purchases.
- Character parts inventory.
- Crafting.
- Deep roguelike build combinations.
- Open exploration map.
- Free roaming progression space.
- Daily missions or live-ops systems.
- Content editor product.
- Heavy framework adoption.
- Large build pipeline overhaul.
- Real money economy.

## Why Challenge Road Is The Right Progression Shell
- It reuses the existing duel core directly.
- It produces clear short-session goals with low implementation cost.
- It supports opt-in retry/continue rewards naturally.
- It can be expressed entirely through config plus light shell UI.
- It fits static storage and analytics without backend dependence.
- It is much cheaper than open exploration or a full roguelike layer because it does not require traversal, inventory, map state, or branching systemic content.

## Smallest Commercially Meaningful Loop
1. Play Quick Battle or enter Challenge Road.
2. Win or lose short duel nodes.
3. Earn soft currency.
4. Unlock or trial a top or arena.
5. Retry to clear deeper nodes.
6. Trigger rewarded continue, reward doubling, or temporary trial when useful.
7. Share standout results or milestone clears.
8. Return later because progress and unlock goals persist locally.
