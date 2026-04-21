# Public Info Pages For AdSense Readiness Design

## Summary
- Date: `2026-04-21`
- Project: `Spin Clash`
- Goal:
  - add a minimal, truthful, player-facing public information surface inside the game shell so the site reads as a more complete and reviewable product during AdSense site review
- Non-goal:
  - fabricate legal or corporate facts
  - ship lawyer-grade jurisdiction-specific clauses
  - convert the site into a separate marketing website

## Confirmed Facts Only
The design may use only the following confirmed facts unless the user explicitly provides more:

- product name:
  - `Spin Clash`
- live domain:
  - `hakurokudo.com`
  - live host currently used by players:
    - `https://play.hakurokudo.com/`
- operator / public-facing entity name:
  - `HAKUROKUDO K.K.`
- support email:
  - `contact@hakurokudo.com`
- already observable current site footer copy:
  - currently shows `© 2026 Hakuro Kudo / Lumos`
  - this design does not rely on that as the legal entity name

The design must not introduce:

- street address
- phone number
- registration number
- country or region if not disclosed
- real-person legal representative details
- promises about response times, refunds, uptime, or warranties that are not already committed elsewhere

## Problem Statement
Current evidence shows the AdSense site state for `hakurokudo.com` is still `正在准备`, not `已就绪`.

Observed account-side facts:

- site ownership verification is complete
- review has been requested
- `ads.txt` is authorized
- policy center currently reports no issues

Observed site-side gap:

- the live game homepage currently presents the playable shell only
- there are no clearly exposed player-facing public information pages for:
  - about
  - contact
  - privacy
  - terms

This design does not claim that missing public pages are the sole reason for delayed review. It does treat them as a meaningful product-completeness and reviewability gap worth fixing.

## Product Intent
Add a formal in-game information surface that:

- stays inside the current site shell
- is readable on mobile
- is easy for players and reviewers to find
- communicates only truthful, currently supportable information
- fits the existing static-runtime architecture and localization model

## Chosen Approach
Use a dedicated in-shell `Info Shell` view, not a lightweight modal and not separate standalone HTML pages.

Why this is the chosen approach:

- modal-style long-form copy is weak on mobile and reads as a patch
- separate static pages conflict with the user’s requested interaction model
- an in-shell view gives better readability, stronger product legitimacy, and cleaner reuse of the current overlay/shell patterns

## Scope
### In scope
- add four public information views inside the game shell:
  - `About`
  - `Contact`
  - `Privacy`
  - `Terms`
- expose entry points from:
  - title/home shell
  - settings shell
- wire the content into the existing locale system:
  - `English`
  - `中文`
  - `日本語`
- write factual, minimal, non-fabricated copy for each page
- ensure mobile-safe long-form reading behavior

### Out of scope
- independent `/privacy.html` or `/terms.html` routes
- collecting user-submitted support tickets inside the game
- adding region-specific legal language that needs lawyer review
- cookie-consent banners
- new analytics or ad product changes beyond what is needed to reference the current system truthfully

## Information Architecture
The new public information surface consists of one shared shell and four content panels.

### Shared shell behavior
- one reusable `Info Shell` is opened from the current runtime
- it behaves like a formal full-screen informational overlay/view
- it has:
  - back button
  - page title
  - scrollable content body
- it does not include promotional CTAs or ad-like elements
- it traps the user’s reading focus without feeling like a system alert

### Page set
#### 1. About
Purpose:
- explain what `Spin Clash` is
- identify `HAKUROKUDO K.K.` as the public-facing operator name
- frame the game as a browser-based product without inventing company history

Allowed content:
- short description of the game
- current public product framing
- operator name
- link or pointer to contact and policy pages

Disallowed content:
- origin story
- office location
- team size
- unsupported business claims

#### 2. Contact
Purpose:
- give a clear support path for users and reviewers

Allowed content:
- support email:
  - `contact@hakurokudo.com`
- short explanation of what this email can be used for:
  - support
  - feedback
  - general inquiries

Disallowed content:
- phone support
- office visit instructions
- guaranteed response windows
- legal service address

#### 3. Privacy
Purpose:
- describe the current site’s real data behavior in plain language

Allowed content must be derived from current implementation truth, including:

- browser-local save/progression storage
- local analytics event buffering in save state
- optional analytics forwarding path when configured
- rewarded-ad related event handling
- third-party ad serving and measurement relevance where currently true

Disallowed content:
- claims that no data is processed at all
- claims about categories the current product does not actually collect
- claims about third-party processors not actually present in the current stack

#### 4. Terms
Purpose:
- provide a minimal use-policy layer without pretending to be jurisdiction-specific counsel

Allowed content:
- service provided as-is
- gameplay, balance, and progression may change
- users must not abuse, interfere with, or exploit the service
- virtual progression and access may be suspended or changed if misuse occurs

Disallowed content:
- detailed governing-law language
- arbitration clauses
- liability caps with made-up figures
- refund rules not tied to an actual payment product

## UI And UX Rules
### Entry points
Add visible, stable entry points in two places:

- title/home shell footer area
- settings shell

Required labels:

- `About`
- `Contact`
- `Privacy`
- `Terms`

Entry points must not be hidden behind debug mode, secondary dialogs, or novelty UI.

### Reading experience
The `Info Shell` must prioritize readability over spectacle.

Required behavior:

- fixed, stable top bar with back action
- single-column long-form reading layout
- left-aligned body copy
- bounded text width
- reliable vertical scroll
- no gesture conflict with the game canvas underneath

### Mobile-first constraints
Because the main review and player environment is mobile web, the information pages must be legible on short iPhone-class screens.

Required rules:

- opening the `Info Shell` fully suppresses gameplay interaction behind it
- first screen immediately communicates that this is a formal information page, not a toast or popup
- title must remain readable without collapsing into one-line clipping
- the content body must not rely on hover, small tap targets, or horizontal scrolling

### Visual language
The information pages should still belong to `Spin Clash`, but they must use a calmer register than battle UI.

Required visual direction:

- preserve the existing shell aesthetic and type system where practical
- reduce visual aggression and HUD-like urgency
- avoid alarm-card styling
- avoid “temporary modal” visual language

## Localization Rules
The page set is part of the main runtime, so it must be localized through the same core text/config system as the rest of the shell.

Rules:

- no locale may fall back to hard-coded English legal placeholders
- page titles, section labels, and body copy must exist in all three supported locales
- the content may be concise, but the meaning must remain aligned across locales
- if a legal nuance cannot be translated precisely without fabricating extra meaning, choose the simpler shared meaning

## Content Truth Rules
This design is governed by a strict truth-first policy.

### Allowed writing moves
- explain what the current game does
- explain how the current site stores local progression
- explain that analytics and ad services may process interaction-related data where currently true
- identify the currently confirmed operator name and support email

### Forbidden writing moves
- invent company metadata
- invent compliance claims
- invent security certifications
- invent age-gating, payment, or refund systems
- invent categories of personal data not evidenced by the product
- invent “legal completeness” just to resemble boilerplate

## Current Implementation Truth That Privacy Copy Must Respect
At design time, the current repo indicates:

- local save stores progression state in-browser
- analytics events are appended into local save state under `save.analytics`
- the default analytics mode is local buffering, with optional forwarding behavior
- reward flow currently supports a real AdSense H5 rewarded path through deploy-time configuration

The privacy page must be written after re-reading the relevant current code/docs during implementation so the final copy stays aligned with shipped behavior.

## Runtime Architecture Fit
The new surface should integrate with the current shell/runtime composition rather than introducing a separate app layer.

Expected implementation shape:

- one dedicated shell/view module for public information rendering and navigation
- localized copy stored in the existing text/config localization surface
- small additions to title/settings entry wiring
- minimal CSS additions for the information reading layout

This should behave like another first-class shell view, not like a foreign microsite embedded in the game.

## Analytics And Tracking
No new tracking is required for the design to be valid.

Optional future enhancement:
- lightweight page-open events for the four public info pages

But this is not required for initial release and should not expand scope unless needed for implementation consistency.

## Acceptance Criteria
The design is complete only if all of the following are true:

- the live game exposes visible entry points to `About`, `Contact`, `Privacy`, and `Terms`
- those pages open inside the site shell without leaving the current site
- the pages are readable on mobile and do not feel like a temporary alert
- all copy is supported by facts already confirmed by the user or current implementation
- no fabricated corporate or legal details are introduced
- all page content is localized for `English`, `中文`, and `日本語`
- the resulting public-information surface makes the site look more complete and reviewable to a human reviewer

## Risks
### Risk 1: false sense of legal completeness
Adding these pages improves product completeness, but does not guarantee AdSense approval or legal sufficiency for every jurisdiction.

Mitigation:
- keep claims minimal
- avoid pretending that the pages are comprehensive legal counsel

### Risk 2: privacy copy drifting from implementation truth
The project’s analytics/provider configuration can evolve over time.

Mitigation:
- derive final privacy copy from current code/docs at implementation time
- keep the statements generic enough to remain accurate as long as the current architecture remains materially the same

### Risk 3: review benefit is real but not decisive
The current AdSense blocker may still mainly be queue timing or site review processing.

Mitigation:
- treat this as a product-readiness improvement, not a magic approval switch

## Recommendation
Proceed with this design as the minimum truthful public-information layer for `Spin Clash`.

It is worth doing because it closes a real completeness gap, helps human reviewability, and does so without fabricating legal identity or turning the game into a separate content site.
