# Analytics Events

This document maps the analytics events that are actually emitted today and where they fire.

## Current Event Pipeline
- Adapter: `src/analytics-service.js`
- Storage: events are appended into local save state under `save.analytics`
- Buffer cap: latest `200` events
- Debug visibility: events are logged to console when debug mode is enabled

Event shape:

```js
{
  name: 'event_name',
  payload: { ... },
  at: '2026-04-16T12:34:56.000Z',
  forwarding: {
    forwarded: false,
    reason: 'local_only'
  }
}
```

Forwarding contract notes:
- `forwarding` is attached by `src/analytics-service.js`, not by gameplay callers
- local/default mode records `reason: 'local_only'`
- PostHog mode records either:
  - `{ forwarded: true }`, or
  - `{ forwarded: false, reason: 'posthog_loading' | 'posthog_config_missing' | 'posthog_unavailable' }`
- local save buffering remains the source of truth even when forwarding is enabled

## Implemented Events

### `session_start`
- Source: `src/debug-runtime-tools.js`
- Trigger: first boot when saved session count was `0`
- Payload:
  - `sessions`
  - `saveVersion`
  - `hasProgress`
  - `currency`
  - `challengeUnlockedNodeIndex`
  - `challengeCheckpointNodeIndex`
  - `unlockedArenaCount`
  - `unlockedTopCount`

### `return_session`
- Source: `src/debug-runtime-tools.js`
- Trigger: boot when saved session count was already greater than `0`
- Payload:
  - `sessions`
  - `saveVersion`
  - `hasProgress`
  - `currency`
  - `challengeUnlockedNodeIndex`
  - `challengeCheckpointNodeIndex`
  - `unlockedArenaCount`
  - `unlockedTopCount`

### `session_end`
- Source: `src/debug-runtime-tools.js`
- Trigger:
  - `pagehide`
  - `beforeunload`
- Payload:
  - `reason`
  - `durationSec`
  - `saveVersion`
  - `persistenceMode`
  - `currency`
  - `challengeUnlockedNodeIndex`
  - `unlockedArenaCount`
  - `unlockedTopCount`
  - `lastMode`
  - `lastArenaId`

### `match_start`
- Source: `src/round-flow-tools.js`
- Trigger: `launch()`
- Payload:
  - `mode`
  - `arena`
  - `arenaId`
  - `playerTop`
  - `playerTopLabel`
  - `enemyTop`
  - `enemyTopLabel`
  - `enemyPresetId`
  - `enemyPresetLabel`
  - `challengeNode`
  - `modifier`

### `match_end`
- Source: `src/match-flow-tools.js`
- Trigger: `showMatchResult()`
- Payload:
  - `mode`
  - `arena`
  - `arenaId`
  - `playerTop`
  - `playerTopLabel`
  - `enemyTop`
  - `enemyTopLabel`
  - `enemyPresetId`
  - `enemyPresetLabel`
  - `roadRankId`
  - `roadRankLabel`
  - `chapterId`
  - `chapterLabel`
  - `tier`
  - `checkpointOnClear`
  - `result`
  - `endReason`
  - `roundCount`
  - `durationSec`
  - `score`
  - `roadRankRewardMul`
  - `challengeNode`
  - `challengeNodeId`
  - `modifier`
  - `reward`

### `challenge_fail`
- Source: `src/match-flow-tools.js`
- Trigger: Challenge Road result screen after a loss
- Payload:
  - `nodeIndex`
  - `nodeId`

### `challenge_node_start`
- Source: `src/round-flow-tools.js`
- Trigger: Challenge Road node initialization on round `1`
- Payload:
  - `nodeIndex`
  - `nodeId`
  - `chapterId`
  - `chapterLabel`
  - `tier`
  - `checkpointOnClear`
  - `reward`
  - `roadRankId`
  - `roadRankLabel`
  - `arena`
  - `playerTop`
  - `enemyTop`
  - `enemyPresetId`
  - `enemyPresetLabel`
  - `modifier`

### `challenge_clear`
- Source: `src/match-flow-tools.js`
- Trigger: Challenge Road result screen after a node win
- Payload:
  - `nodeIndex`
  - `nodeId`
  - `chapterId`
  - `chapterLabel`
  - `tier`
  - `arena`
  - `roadRankId`
  - `roadRankLabel`
  - `checkpointReached`
  - `resumeNodeIndex`
  - `firstClear`
  - `reward`
  - `rewardBase`
  - `rewardNode`
  - `rewardFirstClearBonus`
  - `rewardRankBonus`

### `championship_checkpoint`
- Source: `src/match-flow-tools.js`
- Trigger: Championship Path checkpoint node clear that advances the stored resume node
- Payload:
  - `nodeIndex`
  - `nodeId`
  - `chapterId`
  - `chapterLabel`
  - `tier`
  - `resumeNodeIndex`
  - `roadRankIndex`
  - `roadRankId`
  - `roadRankLabel`

### `reward_offer_show`
- Source: `src/reward-service.js`
- Trigger: every `rewardService.request(...)`
- Payload:
  - `placement`
  - `context`
  - `adapter`
  - `resultValue`
  - `mockMode`

### `reward_complete`
- Source: `src/reward-service.js`
- Trigger: resolved mock reward completion
- Payload:
  - `placement`
  - `context`
  - `granted`
  - `adapter`
  - `resultValue`
  - `mockMode`

### `reward_decline`
- Source: `src/reward-service.js`
- Trigger:
  - reward request resolves with `granted:false`, or
  - reward request rejects
- Payload:
  - `placement`
  - `context`
  - `granted`
  - `adapter`
  - `resultValue`
  - `reason`
  - `mockMode`

### `share_click`
- Source: `src/share-service.js`
- Trigger: every share attempt
- Payload:
  - `kind`
  - `mode`
  - `result`
  - `moment`
  - `arenaId`
  - `arenaLabel`
  - `playerTop`
  - `playerTopLabel`
  - `enemyTop`
  - `enemyTopLabel`
  - `enemyPreset`
  - `enemyPresetLabel`
  - `challengeNode`
  - `scorePlayer`
  - `scoreEnemy`

### `share_complete`
- Source: `src/share-service.js`
- Trigger: share flow completes through native share or fallback handling
- Payload:
  - `kind`
  - `mode`
  - `result`
  - `moment`
  - `arenaId`
  - `arenaLabel`
  - `playerTop`
  - `playerTopLabel`
  - `enemyTop`
  - `enemyTopLabel`
  - `enemyPreset`
  - `enemyPresetLabel`
  - `challengeNode`
  - `scorePlayer`
  - `scoreEnemy`
  - `method`
  - `artifact`

### `unlock_purchase`
- Source: `src/loadout-ui-tools.js`
- Trigger: SCRAP-based permanent arena unlock in Quick Battle loadout
- Trigger: SCRAP-based permanent top unlock in loadout
- Payload:
  - `kind`
  - optional `arenaId`
  - optional `arenaLabel`
  - optional `topId`
  - optional `topLabel`
  - `cost`
  - `currencyBefore`
  - `currencyAfter`

### `research_purchase`
- Source: `src/loadout-ui-tools.js`
- Trigger: Workshop Research upgrade purchased with SCRAP from the loadout workshop panel
- Payload:
  - `trackId`
  - `trackLabel`
  - `levelBefore`
  - `levelAfter`
  - `maxLevel`
  - `remainingLevels`
  - `cost`
  - `currencyBefore`
  - `currencyAfter`
  - `preview`
  - `mode`

### `road_rank_select`
- Source: `src/loadout-ui-tools.js`
- Trigger: player selects a different unlocked Road Rank in Championship Path loadout
- Payload:
  - `mode`
  - `source`
  - `unlockedRankIndex`
  - `fromRankIndex`
  - `fromRankId`
  - `fromRankLabel`
  - `toRankIndex`
  - `toRankId`
  - `toRankLabel`

### `road_rank_unlock`
- Source: `src/match-flow-tools.js`
- Trigger: final Championship Path clear on the current highest unlocked Road Rank
- Payload:
  - `mode`
  - `fromRankIndex`
  - `fromRankId`
  - `fromRankLabel`
  - `toRankIndex`
  - `toRankId`
  - `toRankLabel`
  - `challengeNode`
  - `challengeNodeId`

### `unlock_grant`
- Source:
  - `src/loadout-ui-tools.js`
  - `src/match-flow-tools.js`
- Trigger:
  - permanent arena unlock purchased with SCRAP in Quick Battle
  - permanent top unlock purchased with SCRAP in loadout
  - first Challenge Road clear that grants permanent arena access
  - first Challenge Road clear that grants a permanent top unlock
- Payload:
  - `kind`
  - `grantType`
  - `source`
  - `mode`
  - optional `arenaId`
  - optional `arenaLabel`
  - optional `topId`
  - optional `topLabel`
  - optional `cost`
  - optional `currencyBefore`
  - optional `currencyAfter`
  - optional `nodeIndex`
  - optional `nodeId`

### `trial_unlock_start`
- Source: `src/loadout-ui-tools.js`
- Trigger: locked arena trial reward request begins in Quick Battle loadout
- Payload:
  - `kind`
  - `mode`
  - `arenaId`
  - `arenaLabel`

### `trial_unlock_complete`
- Source: `src/loadout-ui-tools.js`
- Trigger: locked arena trial reward resolves and the session trial access is granted
- Payload:
  - `kind`
  - `mode`
  - `arenaId`
  - `arenaLabel`

### `continue_used`
- Source: `src/match-flow-tools.js`
- Trigger: Challenge Road continue reward completes and the retry state is applied
- Payload:
  - `nodeIndex`
  - `nodeId`

## Implemented Event Coverage By Flow

### Boot
- `session_start`
- `return_session`
- `session_end`

### Quick Battle
- `match_start`
- `match_end`

### Challenge Road
- `challenge_node_start`
- `match_start`
- `match_end`
- `challenge_fail`
- `challenge_clear`
- `championship_checkpoint`
- `road_rank_unlock`

### Rewarded Flows
- `reward_offer_show`
- `reward_complete`
- `reward_decline`
- `trial_unlock_start`
- `trial_unlock_complete`
- `continue_used`

### Share
- `share_click`
- `share_complete`

### Unlocks
- `unlock_grant`
- `unlock_purchase`

### Workshop
- `research_purchase`

### Loadout / Path Entry
- `road_rank_select`

## Recommended Next Implementation Order
1. validate whether `session_end` lifecycle coverage is good enough across the main target browsers before depending on it for retention reporting
2. keep event payload growth additive and normalized through service layers only
3. add deeper reward funnel or share-card outcome detail only if a real analytics sink needs it

## Current Practical Rule
- Do not add vendor-specific analytics logic in gameplay code
- Emit normalized events through `analyticsService.track(...)`
- Keep event names stable and payloads additive
