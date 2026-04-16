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
3. Trigger `MOCK REWARD` in `REWARD GRANT` mode.
4. Switch to `REWARD DENY` and trigger `MOCK REWARD`.
5. Switch to `REWARD ERROR` and trigger `MOCK REWARD`.
6. Use `COPY EVENTS`.
7. Use `CLEAR EVENTS`.
8. Confirm analytics count returns to `0`.

Expected:
- share fallback still opens or copies text
- reward success, decline, and error paths all remain controllable
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

## Suggested Usage
- For general regression after a code batch:
  - run Batch 1 + Batch 3
- For progression changes:
  - run Batch 2 + Batch 4
- Before treating a build as release-candidate:
  - run all four batches
