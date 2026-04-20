# Skill Extraction Design 2026-04-19

This spec captures the design for two new reusable skills extracted from the `spin-clash` project history.

The goal is not to document `spin-clash` itself again.

The goal is to turn the project's reusable engineering patterns into two cross-assistant skills with clear boundaries:
- `mock-first-provider-rollout`
- `prototype-hardening-with-phase-gates`

These two skills are intentionally independent.

They can be used in the same project, but they should not collapse into one generic "software process" skill.

## Why These Two Skills Exist

The `spin-clash` history exposed two different kinds of engineering work:

1. turning a fragile single-file prototype into a deployable, inspectable, phase-gated static product foundation
2. integrating external providers safely without letting unstable account, host, or approval dependencies contaminate the core product flow

Those are related, but they are not the same job.

The prototype-hardening work is about:
- structuring the project
- protecting high-risk runtime code
- creating minimum validation and handoff control

The provider-rollout work is about:
- mock-first integration
- safe defaults
- live override discipline
- external blocker management

If these are merged into one skill, future retrieval will be weaker and the guidance will become vague.

## Skill 1: `mock-first-provider-rollout`

### Purpose

This skill is a strict discipline skill for bringing external providers into a project safely.

It exists for situations where a product already has a working local or host baseline, and the next step is integrating external services such as:
- ads
- analytics
- payments
- auth
- sharing SDKs
- other third-party client-side providers

### Tone

Strict.

This skill should behave more like a gatekeeper than a suggestion list.

It should stop unsafe rollout behavior instead of merely advising against it.

### Trigger Boundary

Use when:
- a project is preparing to integrate a real external provider
- live configuration, credentials, or provider accounts are not yet fully stable
- the assistant may otherwise be tempted to wire live behavior too early
- provider rollout order matters more than raw implementation speed

Do not use when:
- the project is still mostly a fragile prototype
- there is no stable local or host baseline yet
- the work is still about core product structure rather than provider rollout

### Core Principle

External integrations should enter through a mock-first, service-boundary-first path with safe defaults and explicit live rollout gates.

### Required Workflow

1. Verify preconditions.
   - The project must already have a minimally stable baseline.
   - There must already be a known local/manual validation path.
   - If host behavior matters, one host/browser target should be identified before live rollout starts.

2. Lock the business-facing contract first.
   - Product code must call a project-owned service boundary.
   - Product code must not talk directly to provider SDK globals.

3. Implement mock-first behavior before live behavior.
   - Default config must remain safe.
   - Mock, deny, unavailable, timeout, and error paths must be representable.

4. Keep live behavior behind explicit switches.
   - Live provider usage must be opt-in.
   - Prefer deploy-time overrides or controlled environment configuration.
   - Never make real provider defaults the committed baseline.

5. Prove fallback behavior before proving live behavior.
   - Mock path must work.
   - Failure paths must not break product flow.
   - Debug state must explain why live behavior is unavailable.

6. Narrow live scope.
   - Start from allowlisted placements, routes, or capabilities.
   - Do not widen rollout just because the first live path appears to work.

7. Stop when the blocker is external.
   - If the remaining blocker is account review, permission, DNS, HTTPS, back-office setup, provider approval, or human action, stop coding.
   - Switch to blocker management, operator notes, next-step checklists, and evidence capture.

8. Treat closeout as external proof, not code readiness.
   - Live rollout is not complete until the real host, real account, real config, and real manual validation all line up.

### Hard Gates

The skill should explicitly forbid:
- wiring provider SDKs directly into gameplay or business logic
- setting live adapters as committed defaults
- starting live rollout before mock and fallback behavior are proven
- expanding live scope before the first narrow path is validated
- continuing to code after the problem has clearly become an external blocker

### Red Flags

The skill should explicitly flag thoughts like:
- "Let's just wire the live SDK first and clean up later."
- "We can skip mock mode because the account is almost ready."
- "It's fine if one screen talks directly to the SDK."
- "Host validation can wait until after live rollout."
- "The account review is pending, but I can keep fixing code in the meantime."

### Expected Outputs

The skill should push toward concrete outputs such as:
- service boundary contract
- safe default config
- live override path
- debug state surface
- allowlist for first live scope
- blocker note
- operator checklist
- live closeout checklist

### What This Skill Is Not

It is not:
- a general prototype refactor skill
- a guide to splitting monoliths
- a product architecture skill
- a substitute for host validation

It begins only after a project is sufficiently real to justify provider work.

## Skill 2: `prototype-hardening-with-phase-gates`

### Purpose

This skill is a recommended workflow skill for turning a single-file or similarly fragile prototype into a deployable, inspectable, minimally productized foundation.

It is intended primarily for the user's common personal project shape:
- one-file browser prototype
- fast concept demo
- rough local toy that now needs to survive real iteration

### Tone

Strong recommendation, not hard discipline.

It should still be opinionated, but it should guide judgment rather than acting like a rigid gatekeeper.

### Trigger Boundary

Use when:
- a single-file or fragile prototype already works enough to be worth preserving
- the next goal is productization, deployment readiness, inspectability, or handoff clarity
- the assistant needs to harden structure without destroying the core feel

Do not use when:
- the work is only a normal feature request in an already mature project
- the main problem is external provider rollout rather than prototype hardening
- the prototype is so disposable that no hardening is justified

### Core Principle

Do not rewrite a fragile but valuable prototype all at once.

Harden it through visible phases, minimal validation, and careful protection of the high-risk core.

### Recommended Workflow

1. Identify the high-risk core.
   - Separate core behavior from surrounding shell code.
   - Core timing, interaction feel, simulation loops, and other fragile kernel logic should be treated as protected zones.

2. Establish a minimum validation stack early.
   - Add the smallest useful checks before large refactors.
   - Add at least one stable manual regression path.
   - Add debug visibility if runtime inspection is otherwise weak.

3. Write or refine project control docs.
   - Status
   - Handoff
   - Checklist
   - Blockers
   - Current release interpretation

4. Split low-risk edges before touching the kernel.
   - Config
   - UI glue
   - service boundaries
   - debug helpers
   - documentation

5. Move in phases, not in one rewrite.
   - A phase should have a clear purpose.
   - A phase should have an explicit stop condition.
   - A phase should not silently expand because the assistant notices adjacent cleanup opportunities.

6. Use deployment and host readiness as real gates.
   - Local hardening does not end at code structure.
   - A deployable foundation needs preflight checks, packaging clarity, and host validation.

7. Stop when the remaining issue is no longer structural.
   - If the blocker has shifted to host, browser, environment, account, or provider setup, stop restructuring and record the blocker.

### Suggested Phase Shape

This skill should recommend, not mandate, a stage order similar to:
- current-state and boundary mapping
- minimum validation stack
- safe split of low-risk modules
- debug and observability improvements
- deployment preflight
- host validation
- provider preparation only after the above is stable

### Safe Split Guidance

The skill should encourage:
- extracting config before rewriting logic
- extracting UI shell and service seams before rewriting core simulation
- preserving the working kernel unless there is a concrete defect

The skill should discourage:
- refactoring the highest-risk core for style alone
- deep structural churn without a supporting validation stack
- "clean architecture" rewrites that erase the useful prototype behavior

### Red Flags

The skill should explicitly flag thoughts like:
- "Let's just rewrite the whole thing cleanly."
- "We can add tests and docs after the refactor."
- "The kernel is ugly, so we should split it further even if nothing is broken."
- "This phase is basically done, but we may as well add a few more things."
- "The blocker is really deployment or account setup, but let's keep polishing local structure."

### Expected Outputs

The skill should guide toward outputs such as:
- phase map
- validation stack
- debug surface
- handoff/status docs
- preflight checklist
- release interpretation
- blocker log

### What This Skill Is Not

It is not:
- a live provider integration skill
- a backend migration plan
- a general enterprise architecture framework
- a demand to modularize every high-risk core file

It is specifically about making a fragile prototype survivable without losing the thing that made it worth keeping.

## Relationship Between The Two Skills

These skills are intentionally independent, but they can appear in the same project.

The correct order is:
1. `prototype-hardening-with-phase-gates`
2. `mock-first-provider-rollout`

The first skill gets the project to a stable enough shape that provider work becomes sane.

The second skill keeps provider work from corrupting that newly stabilized project.

They should cross-reference each other lightly, but neither should depend on the other to be understandable.

## Shared Principle: Stop Coding When The Blocker Is External

Both skills should include a common stop rule:

When the real blocker is external, the assistant should stop pretending that more code is the answer.

Typical external blockers:
- account approval
- permission access
- DNS propagation
- HTTPS issuance
- provider-side review
- back-office configuration
- human sign-in or approval steps

At that point the assistant should switch from code work to:
- blocker documentation
- operator notes
- explicit next steps
- evidence capture
- re-entry guidance

## Writing Strategy

Because these are meant to be cross-assistant reusable skills:
- descriptions should be trigger-based, not Codex-specific
- environment-specific details should be examples, not prerequisites
- the reusable logic should stay at the workflow and judgment level

Because these two skills have different personalities:
- `mock-first-provider-rollout` should read like a discipline skill
- `prototype-hardening-with-phase-gates` should read like a strong but flexible workflow guide

## Testing Strategy Before Writing The Skills

These skills should not be written blind.

Per `writing-skills`, both need baseline failure evidence first.

### Baseline Tests For `mock-first-provider-rollout`

Create pressure scenarios that tempt the assistant to:
- wire live provider code directly into product code
- make live config the default
- skip mock/fallback proof
- continue coding after the blocker becomes provider approval or account access

Expected failure without the skill:
- unsafe rollout ordering
- SDK leakage
- poor blocker discipline

### Baseline Tests For `prototype-hardening-with-phase-gates`

Create pressure scenarios that tempt the assistant to:
- rewrite too much too early
- refactor the high-risk core before establishing validation
- skip docs and status/control artifacts
- keep expanding scope after a phase is already good enough

Expected failure without the skill:
- structural churn
- weak gating
- missing control surfaces

### Pass Criteria

The skills are successful only if they materially change assistant behavior under those pressure scenarios.

They are not successful merely because they describe the `spin-clash` history well.

## Open Implementation Notes

- These skills should likely live as two separate directories.
- Each should have a short YAML description optimized for search.
- Each should include:
  - overview
  - when to use
  - when not to use
  - workflow
  - stop rules
  - red flags
  - common mistakes
- `mock-first-provider-rollout` should likely include a small rollout-order flowchart.
- `prototype-hardening-with-phase-gates` may or may not need a flowchart; only include one if it improves phase-choice clarity.

## Decision Summary

Locked decisions:
- build two separate skills, not one merged skill
- make both cross-assistant reusable
- make `mock-first-provider-rollout` strict
- make `prototype-hardening-with-phase-gates` recommendation-driven
- include explicit stop rules for external blockers in both
- keep their boundaries hard so retrieval remains clean
