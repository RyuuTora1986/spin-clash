# Content Post-Merge Execution Plan 2026-04-20

This document is the mainline execution plan for the next content-only phase after the arena, balance, and top-expansion sandboxes were merged back.

It exists to keep gameplay/content work moving while:
- ad-platform approval is still externally blocked
- rewarded/provider runtime files remain frozen

## 1. Guardrails

Do not reopen the ad integration boundary during this phase.

Still frozen:
- `src/reward-service.js`
- `src/config-providers.js`
- `src/config-providers-runtime.js`
- `src/config-providers-override.js`
- `src/main.js`

Allowed work:
- content config
- progression / unlock rules
- non-provider UI clarity
- localization
- validation docs
- manual acceptance preparation

## 2. Recommended Execution Order

### Phase 1A: 15-top balance and unlock-experience validation
Goal:
- verify whether the current `starter / road / shop` split is structurally sound before polishing the UI around it

Output:
- one written validation pack
- one issue list ranked by severity
- one keep / adjust / revert decision per major unlock rule

Reference:
- `docs/top-balance-validation-plan-2026-04-20.md`

### Phase 1B: Config-only balance corrections
Goal:
- make the smallest possible config-layer corrections based on Phase 1A findings

Allowed files:
- `src/config-tops.js`
- `src/config-road-ranks.js`
- `src/config-challenge-road.js`
- `src/config-economy.js`
- `src/config-text.js`

Success bar:
- no single top dominates early/mid progression
- starter tops remain sufficient for first-path progression
- rank reward tops feel like strong milestones, not mandatory fixes for a broken economy

### Phase 2A: Unlock-source UI design lock
Goal:
- define one consistent player-facing language for:
  - starter tops
  - road reward tops
  - workshop tops

Output:
- one UI wording/layout note
- one narrow implementation scope

Reference:
- `docs/unlock-source-ui-design-2026-04-20.md`

### Phase 2B: Unlock-source UI implementation
Goal:
- make the unlock path obvious in home/loadout/rank reward surfaces without reopening core runtime systems

Likely files:
- `src/loadout-ui-tools.js`
- `src/ui-entry-tools.js`
- `src/config-text.js`
- `index.html` only if a shell hook is truly needed

Success bar:
- road-only tops no longer look like generic locked content
- workshop tops clearly show purchase path
- starter tops clearly show why they are immediately usable

### Phase 3: Human playtest gate
Goal:
- after Phases 1 and 2 are complete, request one focused manual play session from the user

Focus:
- onboarding clarity
- unlock motivation
- shop vs rank reward understanding
- whether specific tops feel obviously overpowered or underpriced

This is the first point where the user should be pulled back in for direct experience validation.

## 3. Stop Conditions

Pause and re-evaluate before continuing if any of the following becomes true:
- an external ad platform approves and exposes a real integration path
- validation shows the new 15-top split is structurally wrong rather than lightly imbalanced
- Phase 2 UI needs a larger shell restructure instead of a narrow presentation pass

## 4. Verification Expectations

For doc-only steps:
- `npm run check:docs`

For config/runtime changes in later phases:
- `npm run check:config`
- `npm run check:roster`
- `npm run check:roadrank`
- `npm run check:nextphase`
- `npm run check:loadout`
- `npm run check:ui`
- `npm run preflight`

## 5. Current Immediate Next Step

Proceed with:
- Phase 1A

Do not start UI work first.

If the unlock economy is wrong, polished UI will only make the wrong system easier to notice.
