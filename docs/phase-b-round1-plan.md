# Phase B Round 1 Plan

## Scope
This round executes the first four implementation tasks approved after Phase A:
- preserve an untouched backup of the original prototype HTML
- fix the malformed HTML/CSS structure blocking safe launch
- establish a minimal static shell with `index.html`, `css/`, and `src/main.js`
- move the current Quick Battle experience onto that shell with behavior kept as close as practical

## Deliverables
- original source backup under `originals/`
- static entry page and extracted assets/code structure
- local-vendored Three.js dependency
- centralized player-facing text table for the extracted code path
- current Quick Battle running from the new shell

## Validation
- app loads from a static file server
- title -> loadout -> fight flow still works
- both current arenas still load
- all three current player tops remain selectable
- drag launch, dash, skill, round result, and match result still function
- no malformed CSS remains in the shipped entry HTML
