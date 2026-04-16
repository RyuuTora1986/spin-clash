# GitHub Pages Deploy

This document defines the smallest safe GitHub Pages path for the current static build.

## Why GitHub Pages First
- already aligned with the existing GitHub repo
- cheap enough for repeated iteration
- good enough to validate static hosting, pathing, and persistence behavior
- no extra framework or deployment service is required

## Current Deploy Shape
The repository now includes:
- GitHub Actions workflow:
  - `.github/workflows/deploy-pages.yml`
- static release packaging script:
  - `scripts/build-static-release.js`

The workflow does not publish the whole repo.
It runs:
1. `npm ci`
2. `npm run verify:release`
3. uploads `dist-static/` to Pages

Published file set:
- `index.html`
- `css/`
- `src/`
- `assets/vendor/`

This keeps docs, originals, helper scripts, and local workflow files out of the live site.

## One-Time GitHub Setup
In the GitHub repository settings:
1. open `Settings`
2. open `Pages`
3. set `Source` to `GitHub Actions`

After that:
- every push to `main` can deploy
- `workflow_dispatch` can deploy manually from Actions

## Expected URL
For the current repo name:
- `https://ryuutora1986.github.io/spin-clash/`

Important:
- local asset references are already relative, so project-site subpath hosting should work

## Local Verification Before Push
Run:

```powershell
npm install
npm run verify:release
```

Then inspect:
- `dist-static/index.html`
- `dist-static/css/game.css`
- `dist-static/src/`
- `dist-static/assets/vendor/three.min.js`

## Host Validation After Deploy
Open:
- production URL
- production URL + `?debug=1`

Then run:
- `docs/manual-test-batches.md`
- `docs/host-validation-plan.md`

Record the result in:
- `docs/host-validation-report-template.md`

## Pass Criteria For This Host
- site loads from the Pages URL without path issues
- `persistenceMode === local`
- main manual batches pass
- no blocking runtime error banner
- share fallback and reward mock flows still work

## Known Limits
- Pages deployment solves hosting validation, not monetization readiness
- rewarded ads are still mock-only
- analytics are still local-only until a remote sink is chosen

## If Pages Fails
Use the failure report to decide the next host.
Do not add more gameplay scope before one real host is validated.
