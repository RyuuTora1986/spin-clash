# Shared Backend Optional Bridge

## Goal

Give `spin-clash` a real shared-backend entry path without changing its default static-game behavior.

## Runtime Switch

Default remains local-only.

Enable the bridge explicitly with:

```text
?backend=shared&backendBaseUrl=https://<worker-url>
```

## What Syncs

- progression-shaped save state
- currency
- challenge progress
- unlocks
- research levels
- settings
- selected arena / top snapshot

## What Uses Shared Reward Validation

- `double_reward`
- `continue_once`
- `trial_unlock_arena`

Current boundary:

- the backend validates reward claim intent and replay protection
- dynamic match-side reward effects still resolve in the client, then persist through progression commit

## Files

- runtime config: `src/shared-backend-config.js`
- shared bridge: `src/shared-backend-bridge.js`
- reward adapter switch: `src/reward-service.js`
- runtime hydrate + persisted selection sync: `src/main.js`

## Non-goals

- server-authoritative battle simulation
- login UI
- cross-device conflict resolution
- full reward amount authority for match-derived payouts
## 2026-04-23 更新

- 推荐共享后端验收入口：
  - `?backend=shared-dev`
  - `?backend=shared-prod`
- 如果需要连自定义 Worker 地址，仍然可以使用：
  - `?backend=shared&backendBaseUrl=https://<worker-url>`
- 当页面进入共享后端模式后，右上角会显示状态条：
  - 当前环境标签：`DEV / PROD / CUSTOM`
  - 当前状态：初始化中 / 同步中 / 已连接 / 同步异常
