# Shared Backend Foundation Handoff 2026-04-23

This handoff records the decision to move the next architecture slice out of the current `spin-clash` repo and into a new shared foundation project.

The problem is no longer "how should `spin-clash` hide its browser code better?".

The real problem is:
- multiple current and planned game projects need a low-cost backend baseline
- that baseline must start cheap
- it must improve security and data authority versus pure local storage
- it must stay easy to extend later into stronger account, sync, reward, and live-ops support

## Decision Locked

- Do not build the shared backend foundation inside `spin-clash`.
- Create a new project directory and new repo for the shared backend foundation.
- Use a Cloudflare-first stack for v1:
  - Cloudflare Workers Paid
  - D1 as the primary database
  - optional KV only for cache / precomputed config, not as the primary save store
- Start with anonymous server-backed identity, not full email/password auth.
- Keep local storage as a cache / UX layer, not as the source of truth for rewards and progression.

## Why This Moved Out Of `spin-clash`

The current repo is a static browser game. Its packaging and trust model are project-local, but the next problem is cross-project:

- web games will need server-backed progression, reward validation, and daily config
- client games will likely need cloud save and identity migration later
- mobile games will eventually want reinstall recovery, device migration, and stronger account binding

If each project solves this separately, the result will be:
- duplicated backend work
- multiple identity models
- multiple storage models
- inconsistent reward / progression security
- higher long-term maintenance cost

The better move is a shared thin backend platform that all projects can consume.

## Recommended Product Shape For The New Project

The new project should be treated as a reusable game backend foundation, not as a `spin-clash` subfolder.

Suggested working name:
- `game-platform-foundation`
- or `shared-game-backend`

Suggested first target location:
- `D:\game-platform-foundation`

## Recommended V1 Architecture

### Runtime shape
- static frontends stay where they are
- each game calls a shared HTTP API hosted on Cloudflare Workers
- D1 stores project-scoped player data, progression state, reward ledger, and daily state
- local storage remains allowed for:
  - cached settings
  - last-known state for faster boot
  - offline-friendly UX hints

### Authority boundary
- browser / client is trusted for input and presentation only
- server is authoritative for:
  - progression commits
  - reward claims
  - daily seed / daily challenge state
  - unlock validation
  - anti-repeat reward checks

### What stays client-side at first
- battle simulation
- rendering
- moment-to-moment single-player combat logic
- non-critical local preferences

This keeps v1 cheap and fast to ship.

## Identity Model Recommendation

Do not start with full login.

Start with:
- anonymous player account created by the server
- local install token / session token stored on device
- later upgrade path for account binding

### V1 identity flow
1. first launch calls `POST /v1/install/register`
2. server creates:
   - `player_id`
   - `installation_id`
   - signed session token
3. client stores the returned token locally
4. future calls send that token
5. server can rotate / refresh the token without requiring a user-facing login UI

### Why this is the right first step
- no account UX friction
- no password reset burden
- no email pipeline needed
- strong enough for early progression and reward authority
- easy to extend later into:
  - email binding
  - Google login
  - Apple login
  - cross-device restore

## Minimum Shared API Surface For V1

The new project should start with a very small, reusable API surface.

### Core identity
- `POST /v1/install/register`
- `POST /v1/session/refresh`

### Bootstrap / config
- `GET /v1/projects/:projectKey/bootstrap`
- `GET /v1/projects/:projectKey/daily`

### Progression
- `GET /v1/projects/:projectKey/progression`
- `POST /v1/projects/:projectKey/progression/commit`

### Rewards
- `POST /v1/projects/:projectKey/rewards/claim`
- `GET /v1/projects/:projectKey/rewards/status`

### Optional next step, not required in v1
- `GET /v1/projects/:projectKey/leaderboard`
- `POST /v1/projects/:projectKey/account/bind`

## Minimum Data Model For V1

Recommended first tables:

- `projects`
  - project metadata and feature flags
- `players`
  - shared logical player identity
- `player_installations`
  - device / install binding, token version, status
- `player_progress`
  - current progression snapshot per project
- `reward_events`
  - append-only reward claim ledger
- `daily_state`
  - per-project daily seeds / daily windows / claim windows
- `project_configs`
  - versioned remote config payload references

Important rule:
- progression writes should be idempotent where possible
- reward claims should always have nonce / replay protection

## What `spin-clash` Should Migrate First Later

If `spin-clash` becomes the first integration target, migrate in this order:

1. daily config / daily challenge seed
2. progression read / commit
3. rewarded claim validation
4. unlock validation
5. optional cloud save reconciliation

Do not start by server-authoritizing the entire combat loop.

That is a later decision and not needed for the first security / product step.

## Cost Baseline, Verified On 2026-04-23

These numbers were checked against official vendor docs on 2026-04-23.

### Cloudflare Workers
- Workers Paid has a minimum charge of `$5 USD / month` per account
- includes:
  - `10 million` requests / month
  - `30 million` CPU milliseconds / month
- overage:
  - `$0.30 / million requests`
  - `$0.02 / million CPU ms`

Reference:
- https://developers.cloudflare.com/workers/platform/pricing/

### Cloudflare Pages / static assets
- static asset requests are free and unlimited
- Pages Functions are billed as Workers only when dynamic code runs

References:
- https://developers.cloudflare.com/pages/functions/pricing/
- https://www.cloudflare.com/developer-platform/products/pages/

### Cloudflare D1
- pricing is row-read / row-write / storage based
- free tier includes:
  - `5 million` rows read / day
  - `100,000` rows written / day
  - `5 GB` storage
- paid tier includes:
  - first `25 billion` rows read / month
  - first `50 million` rows written / month
  - first `5 GB` storage

Reference:
- https://developers.cloudflare.com/d1/platform/pricing/

### GitHub Pages
- GitHub Free includes GitHub Pages for public repositories

Reference:
- https://docs.github.com/en/get-started/learning-about-github/githubs-plans

### Practical cost recommendation
- realistic early target budget:
  - `~$5 / month`
- safer early operating budget:
  - `~$5 to $15 / month`

Reason:
- a single Cloudflare account can serve multiple early low-traffic projects
- this is much cheaper than spinning up separate heavier backend stacks per game

## What Not To Build In V1

Do not start the new shared project with:
- email/password auth
- full social profile system
- real-time multiplayer
- payment receipt validation
- chat
- inventory trading
- analytics warehouse
- admin CMS with broad scope

Those are not needed to solve the current problem.

The current problem is a thin, reusable authority layer.

## Recommended First Milestone For The New Project

The first milestone should produce a working backend skeleton that one game can integrate quickly.

Definition of done:
- one Cloudflare Worker project runs locally and deploys
- D1 schema exists
- anonymous install registration works
- signed session token flow works
- progression read / commit works
- reward claim ledger works
- one project key can fetch daily bootstrap config
- one sample game integration contract is documented

## Recommended New Session Plan

When opening the new project and new session, start with this exact order:

1. create the new repo / directory
2. write the backend product brief
3. lock the v1 non-goals
4. design the identity model
5. design the first D1 schema
6. scaffold the Worker routes
7. define one sample integration contract for `spin-clash`

Do not start by wiring UI, dashboards, or login screens.

## Re-entry Checklist For The Next Conversation

In the new session:

1. read this file
2. state that the new project is a shared backend foundation, not a `spin-clash` feature branch
3. keep the budget target at `~$5 / month`
4. keep identity anonymous-first
5. keep the first integration target narrow:
   - progression
   - reward validation
   - daily config

## Open Questions To Carry Forward

- final project name
- whether to keep one D1 database per environment or per project
- whether session tokens should be JWT-style or opaque signed tokens
- whether remote config should live directly in D1 or in versioned JSON blobs with cache
- when to add account binding:
  - before first mobile release
  - or after one project shows retention / monetization proof

## Bottom Line

The next step is not another `spin-clash` patch.

The next step is a new shared backend foundation project with:
- Cloudflare Workers Paid
- D1
- anonymous-first identity
- server-authoritative progression / rewards / daily config
- local-first UX cache

That gives the best balance of:
- low cost
- good enough security improvement
- fast time to first integration
- room to scale later
