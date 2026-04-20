# Commercialization Design

## Product Positioning
The smallest commercially meaningful version is not a content-heavy game. It is a high-energy duel toy with a retention shell, local progression, opt-in rewards, and shareable result moments.

## Monetization Principle
Use opt-in value exchange only. The game should remain playable and respectable without forced interruption ads.

## MVP Rewarded Placements
1. Continue once after failing a Challenge Road node.
   - Offer only one continue per run.
   - Resume the failed node with a controlled recovery state, not full rewind complexity.
2. Session-limited trial unlock.
   - Temporary access to the locked arena for the current session.
   - Keep top trial unlock as an optional later extension, not an MVP requirement.
3. Double result reward.
   - On battle or node completion, offer a doubled soft-currency payout.

## Progression Shell
- Main shell: `Challenge Road`.
- Structure: 6 to 8 sequential nodes.
- Each node is a duel package with:
  - arena id
  - enemy preset id
  - optional modifier id list
  - base reward
- Node clear advances progression and records best progress.
- Failing a node allows retry, optional rewarded continue, or exit.

## Soft Currency Role
- One currency only.
- Used for permanent unlocks and possibly one low-cost retry convenience if needed later.
- Do not create separate shards, parts, keys, or premium currencies.
- Currency economy should stay transparent and inspectable.

## Retention Loop
- Immediate loop: fast duel -> result -> reward -> next attempt.
- Mid-term loop: unlock next top or arena -> push farther in Challenge Road.
- Return loop: saved progress plus visible unfinished unlock goals.
- No backend streak systems or daily pressure required for MVP.

## Share Surfaces Worth Building First
1. First clear of a new arena.
2. Challenge Road milestone clear.
3. Ring-out finish.
4. Perfect or near-perfect win.
5. Revenge link prompt after a close loss.

## Share Implementation Direction
- Current MVP implementation now generates a lightweight SVG result card for result shares.
- Current runtime now classifies result shares into `road_clear`, `challenge_clear`, `ring_out`, `perfect_win`, `close_loss`, `victory`, and `defeat`.
- Result-card raster export and stronger social-template polish remain later refinements, not current dependencies.
- Preferred fallback order:
  - Web Share API with file share if available.
  - Web Share API with text only.
  - SVG result-card download plus copied text.
- No invite-economy logic.
- No backend referral state.

## Why This Scope Is Commercially Sensible
- It gives the player a reason to come back without needing a server.
- It supports rewarded value exchange at natural emotional moments.
- It keeps engineering and operational cost low.
- It creates measurable surfaces for monetization and retention before content expansion.
- It avoids fake scale. The product wins by immediacy and replayability, not system count.
