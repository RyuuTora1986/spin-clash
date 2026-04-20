# Manual Test Batches

Use this document to run grouped browser checks instead of ad hoc one-off confirmations.

## Batch 1: Core Entry And Match
Goal:
- prove the current static build still enters and resolves battles correctly

Steps:
1. Open `index.html`.
2. Confirm the title screen renders.
3. Enter loadout through `ENTER BATTLE`.
4. Switch between `Quick Battle` and `Challenge Road`.
5. Change arena and top selection.
6. Start a Quick Battle match.
7. Drag to launch.
8. Finish the match.
9. Confirm the result overlay appears and replay/swap still work.

Expected:
- no runtime error banner
- battle scene renders tops and arena
- round and match flow both resolve

## Batch 2: Progression And Unlocks
Goal:
- prove progression and unlock persistence still behave correctly

Steps:
1. Open `index.html?debug=1`.
2. Use `RESET SAVE`.
3. Add SCRAP with `+200 SCRAP`.
4. Buy `Trick`.
5. Refresh the same tab.
6. Confirm `Trick` remains unlocked.
7. In Quick Battle, select locked `Hex Bowl` without enough SCRAP and confirm trial flow.
8. In a funded save, permanently unlock `Hex Bowl`.
9. Enter `Challenge Road` and verify node progression still advances.

Expected:
- top unlock persists
- arena trial and permanent unlock both work
- challenge progress persists

## Batch 3: Services And Analytics
Goal:
- prove mock services and analytics surfaces still work without live providers

Steps:
1. Open `index.html?debug=1`.
2. Trigger `MOCK SHARE`.
3. Trigger `COPY SHARE SVG`.
4. Trigger `DOWNLOAD SHARE SVG`.
5. Trigger `MOCK REWARD` in `REWARD GRANT` mode.
6. Switch to `REWARD DENY` and trigger `MOCK REWARD`.
7. Switch to `REWARD ERROR` and trigger `MOCK REWARD`.
8. Confirm reward failure messaging is visible for deny/error paths instead of silent no-op.
9. Use `COPY EVENTS`.
10. Use `COPY PROVIDERS`.
11. Use `CLEAR EVENTS`.
12. Confirm analytics count returns to `0`.

Expected:
- share debug actions can export SVG directly
- share fallback still opens browser share or downloads a result-card SVG while copying text
- reward success, decline, and error paths all remain controllable
- reward decline/error paths now surface a clear runtime message
- analytics events are emitted and can be exported

## Batch 4: Persistence And Environment
Goal:
- prove save mode visibility and recovery tooling still match the actual browser environment

Steps:
1. Open `index.html?debug=1`.
2. Inspect:
   - `storagePersistent`
   - `persistenceMode`
   - `persistenceDiagnostic`
3. If persistence mode is not `local`, confirm the runtime warning banner is visible.
4. Use `COPY SAVE`.
5. Use `RESET SAVE`.
6. Use `IMPORT SAVE` and paste the copied save JSON.
7. Confirm the imported state is restored.

Expected:
- storage mode is inspectable
- warning banner matches the current fallback mode
- save export/import roundtrip works

## Batch 5: Championship Path / Workshop / Rank Regression
Goal:
- prove the expanded progression shell still behaves coherently as one connected system

Steps:
1. Open `index.html?debug=1`.
2. Use `RESET SAVE`.
3. Use `+200 SCRAP`.
4. Enter `WORKSHOP`.
5. Buy one `SPIN CORE` level and one `GUARD FRAME` level.
6. Use `COPY PROGRESSION`.
7. Switch to `CHAMPIONSHIP PATH`.
8. Confirm `RANK II` and `RANK III` are locked on a fresh save.
9. Clear through the first checkpoint node and confirm the run resumes from the checkpoint after reload.
10. Use `COPY EVENTS` and confirm `challenge_clear` and `championship_checkpoint` exist.
11. Use `RANK II` in debug mode, then select `RANK I` again from the loadout rank strip.
12. Confirm `road_rank_select` appears in the analytics export.
13. Jump to `FINAL NODE`, clear it, and confirm the next Road Rank unlocks.
14. Use `COPY EVENTS` again and confirm `road_rank_unlock` exists.
15. Use `COPY RUNTIME` during loadout and once during an active match.
16. Use `COPY TUNING`, lower one visible value such as `economy.rewards.winBase` or `tops` unlock cost in the copied JSON, then use `IMPORT TUNING`.
17. Confirm the debug panel reflects the new tuning value immediately.
18. Use `RESET TUNING` and confirm the value returns to baseline.

Expected:
- workshop upgrades spend SCRAP and persist
- checkpoint clears advance resume state correctly
- rank selection emits analytics without breaking the loadout flow
- final-node clear unlocks the next rank tier
- progression/runtime snapshots export without errors
- tuning import/reset works for progression-facing config, not only economy/enemy AI

## Batch 6: Tri-Language Localization Regression
Goal:
- prove the player-facing runtime can switch cleanly between English, Chinese, and Japanese without breaking flow or persistence

Steps:
1. Open `index.html`.
2. On the title screen, switch from `English` to `中文`, then to `日本語`.
3. Confirm the title CTA, subtitle, and menu labels update immediately.
4. Enter the next screen and confirm the selected language is preserved.
5. In loadout, switch to a different language again.
6. Confirm mode tabs, arena labels, top cards, Workshop text, and Championship Path preview update immediately.
7. Start a match and confirm the HUD fixed labels, intro banner, and result text use the selected language.
8. Trigger `SHARE` and confirm the browser share text or exported result-card copy uses the selected language.
9. Refresh the page.
10. Confirm the last selected language is restored automatically.
11. If possible, repeat one pass in each of the three languages and watch for clipping, overlap, or broken button text.

Expected:
- title and loadout switchers both work
- locale persists after refresh
- Quick Battle, Championship Path, Workshop, HUD, result, and share text all stay in sync
- no obvious text overflow or broken labels in Chinese or Japanese

## Suggested Usage
- For general regression after a code batch:
  - run Batch 1 + Batch 3
- For progression changes:
  - run Batch 2 + Batch 4
- For Championship Path, Workshop, Road Rank, or analytics/debug work:
  - run Batch 5
- For localization changes:
  - run Batch 6
- Before treating a build as release-candidate:
  - run all six batches
