---
status: in-progress
branch: main
timestamp: 2026-04-17T00:00:00+09:00
files_modified:
  - .gitignore
  - README.md
  - css/game.css
  - docs/architecture-overview.md
  - docs/balance-pass-2026-04-17.md
  - docs/commercialization-design.md
  - docs/content-config-design.md
  - docs/docs-index.md
  - docs/project-status-2026-04-17.md
  - docs/services-plan.md
  - docs/superpowers/specs/2026-04-17-next-phase-gameplay-expansion-design.md
  - docs/superpowers/specs/2026-04-17-ui-flow-combat-feedback-design.md
  - index.html
  - progress.md
  - src/main.js
---

## Working on: UI Flow And Combat Rework Prep

### Summary

`spin-clash` is already past the fragile prototype stage and now runs as a playable static web game foundation with progression, config-driven content, tri-language localization, debug tooling, analytics abstraction, and release verification.

The latest approved direction is not a visual redesign. It is a structural gameplay-product pass:
- split the overloaded shell into clearer player-facing routes
- make battle return paths predictable
- make collision and durability logic more directional and readable
- upgrade skills toward `Dash + Guard + Signature`

This work is approved in principle but not implemented yet.

### Decisions Made

- Preserve the current visual style. This is a hard constraint.
- Do not treat the current UX problem as an art problem. Treat it as route hierarchy and state-visibility debt.
- The current title entries all feed one overloaded loadout surface, so the shell should move from one super-screen to explicit player-facing routes.
- Approved target route hierarchy:
  - `Home`
  - `Championship Path`
  - `Quick Battle`
  - `Workshop`
  - `Settings`
  - plus `Battle` and `Result` runtime layers
- Approved implementation order:
  1. route hierarchy
  2. battle return-path logic
  3. collision and durability rules
  4. skill structure
  5. tuning and polish
- Approved combat direction:
  - collision should distinguish aggressor vs defender more clearly
  - durability should not rely only on spin drain
  - add light top-specific passive durability decay
  - move toward universal `Guard`, keeping `Dash` universal and one signature skill per top
- Rollback is mandatory.
  - keep separate checkpoints for shell route refactor, battle return refactor, collision/attrition refactor, and skill refactor
  - do not mix shell restructuring and combat system restructuring into one checkpoint
- The repo docs, not the shared `AI-Memory` pointer, are the source of truth for this project right now.
  - `C:\Users\29940\AI-Memory\tasks\codex\CURRENT.md` points to another project
  - do not use that pointer as the recovery source for `spin-clash`

### Remaining Work

1. Write the implementation plan for `Phase 1: Shell Route Refactor`.
2. Create rollback/change-log scaffolding before code changes:
   - `docs/change-records/2026-04-17-ui-flow-combat-rework-log.md`
3. Implement explicit route state in the shell:
   - `home`
   - `path`
   - `quick`
   - `workshop`
   - `settings`
   - `battle`
   - `result`
4. Split the overloaded current loadout experience into the approved screen hierarchy without changing art direction.
5. Add explicit `Back` behavior and route-origin tracking.
6. Make battle/result return to the originating screen.
7. Only after the route layer is stable, start collision, durability, and skill-structure refactors.

### Notes

- The current git worktree is intentionally very dirty. Do not revert unrelated changes.
- `npm run verify:release` was green after the latest balance pass.
- The repo has only one visible git commit in local history at the moment:
  - `dc241d2 chore: reset repo and establish static shell baseline`
- The current code findings behind the approved route refactor are documented in:
  - [2026-04-17-ui-flow-combat-feedback-design.md](C:\Users\29940\spin-clash\docs\superpowers\specs\2026-04-17-ui-flow-combat-feedback-design.md)
- The current product completion snapshot is documented in:
  - [project-status-2026-04-17.md](C:\Users\29940\spin-clash\docs\project-status-2026-04-17.md)
- The latest balance baseline is documented in:
  - [balance-pass-2026-04-17.md](C:\Users\29940\spin-clash\docs\balance-pass-2026-04-17.md)

## Resume Source Of Truth

If a new Codex session starts for this project, read these files in this order:

1. [session-handoff-2026-04-17.md](C:\Users\29940\spin-clash\docs\session-handoff-2026-04-17.md)
2. [2026-04-17-ui-flow-combat-feedback-design.md](C:\Users\29940\spin-clash\docs\superpowers\specs\2026-04-17-ui-flow-combat-feedback-design.md)
3. [2026-04-17-next-phase-gameplay-expansion-design.md](C:\Users\29940\spin-clash\docs\superpowers\specs\2026-04-17-next-phase-gameplay-expansion-design.md)
4. [project-status-2026-04-17.md](C:\Users\29940\spin-clash\docs\project-status-2026-04-17.md)
5. [balance-pass-2026-04-17.md](C:\Users\29940\spin-clash\docs\balance-pass-2026-04-17.md)
6. [progress.md](C:\Users\29940\spin-clash\progress.md)

Do not rely on the shared `AI-Memory` active pointer for this project.

## New Session Starter

Use this as the first message in a new Codex window:

```text
Project: C:\Users\29940\spin-clash

This is a continuation of the existing Spin Clash static web game project. Do not use AI-Memory CURRENT.md as the source of truth for this task, because it points to another project. Use the repository docs instead.

Read these files in order:
1. C:\Users\29940\spin-clash\docs\session-handoff-2026-04-17.md
2. C:\Users\29940\spin-clash\docs\superpowers\specs\2026-04-17-ui-flow-combat-feedback-design.md
3. C:\Users\29940\spin-clash\docs\superpowers\specs\2026-04-17-next-phase-gameplay-expansion-design.md
4. C:\Users\29940\spin-clash\docs\project-status-2026-04-17.md
5. C:\Users\29940\spin-clash\docs\balance-pass-2026-04-17.md
6. C:\Users\29940\spin-clash\progress.md

Hard constraints:
- preserve the current UI visual style
- keep plain HTML/CSS/JS static architecture
- do not start with a visual redesign
- leave rollback records
- do not revert unrelated dirty-worktree changes

Current approved direction:
- split the overloaded shell into real routes: Home, Championship Path, Quick Battle, Workshop, Settings
- make battle/result return to the originating screen
- later refactor combat into clearer aggressor/defender collision logic, light hp decay by top, and Dash + Guard + Signature skill structure

Start with Phase 1 only:
- write the implementation plan for the shell route refactor
- create rollback/change-log scaffolding
- then begin the route refactor in small verifiable steps
```

## Why This Checkpoint Exists

This project conversation became very long across multiple days.

The purpose of this file is to reduce dependence on old chat context and force future sessions to re-enter from stable repo artifacts instead of stale conversational memory.
