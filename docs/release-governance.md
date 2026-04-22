# Release Governance

## Version Source

- Canonical version source: `package.json`
- Derived release surfaces that must stay aligned:
  - `index.html` asset cache-busting query params
  - `src/config-text.js` build-version labels

## Release Workflow

1. Update `package.json` with the target version.
2. Update `CHANGELOG.md` with a checked-in entry for that version.
3. Run `npm run sync:staticversion`.
4. Run `npm run verify:release`.
5. Merge the release branch into `main`.
6. Push the release commit to GitHub.

## Blocking Rule

- Do not push a player-visible release to `main` when version, changelog, and synced asset labels are out of alignment.
