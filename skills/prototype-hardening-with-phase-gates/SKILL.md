---
name: prototype-hardening-with-phase-gates
description: Use when a single-file or similarly fragile prototype already works and now needs to become deployable, inspectable, and safe to iterate on without losing the core behavior that makes it valuable.
---

# Prototype Hardening With Phase Gates

## Overview

Do not "clean rewrite" a working prototype just because it is messy.

Harden it in visible phases, with minimum validation and explicit stop conditions.

## When to Use

Use when:
- a single-file or rough prototype is worth preserving
- the next goal is productization, deployment readiness, or handoff clarity
- the core interaction works, but the project is structurally fragile

Do not use when:
- this is just ordinary feature work in a mature codebase
- the main problem is live provider rollout
- the prototype is disposable and not worth hardening

## Core Pattern

Protect the high-risk core. Split the low-risk edges first.

High-risk areas are things like:
- timing-sensitive loops
- fragile interaction feel
- core state transitions
- simulation or gameplay kernels

Low-risk areas are things like:
- config tables
- UI glue
- docs
- debug surfaces
- service boundaries

## Recommended Phase Order

| Phase | Goal |
| --- | --- |
| Current state | Map what works, what is risky, what is missing |
| Minimum validation | Add the smallest useful checks and manual path |
| Safe split | Extract config, UI glue, services, debug, docs |
| Control surface | Add checklist, handoff, blocker, release interpretation |
| Deployment preflight | Confirm package, host assumptions, and validation path |
| Host validation | Test on the real target before more expansion |

## Guidance

- Add guardrails before large refactors.
- Keep the prototype playable after each meaningful slice.
- Prefer thin vertical slices over a full architecture rewrite.
- Use docs as control surfaces, not as end-of-project cleanup.
- Give each phase an explicit stop condition so scope does not leak.

## Stop Rules

Stop restructuring when:
- the remaining blocker is host, browser, account, DNS, HTTPS, or provider setup
- the current phase already achieved its purpose
- further cleanup is happening only because the code still looks ugly

At that point:
- record blockers
- write re-entry guidance
- preserve evidence
- move to validation or closeout work

## Red Flags

- "Let's split the whole file cleanly first."
- "Tests, docs, and debug can come later."
- "The kernel is ugly, so we should refactor it before anything else."
- "This phase is basically done, but we may as well keep going."
- "The problem is now deployment or environment, but let's keep polishing structure."

## Common Mistakes

- Confusing hardening with rewriting.
- Touching the highest-risk core before adding guardrails.
- Waiting too long to create handoff, checklist, or blocker docs.
- Letting phase boundaries dissolve into endless cleanup.
- Treating deployment and host validation as afterthoughts.

## What Good Output Looks Like

- a visible phase map
- a minimum validation stack
- a debug or inspection surface
- status, handoff, and blocker docs
- a deployment preflight path
- a clear release interpretation

## What This Skill Is Not

This is not a provider-rollout skill and not a demand for perfect architecture.

It is a way to make a valuable prototype survivable without killing the behavior that made it worth keeping.
