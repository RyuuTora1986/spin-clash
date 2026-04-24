# 渠道变现与经济策略

日期：2026-04-24

## 结论

`Spin Clash` 不应只有一套统一的“广告按钮策略”。
应该固定成：

1. 共享核心玩法与基础经济
2. 渠道决定“奖励入口是否存在、由谁付费、是否允许账号绑定、收益从哪里来”
3. 渠道差异写进 registry，而不是只靠会话记忆

## 当前渠道判断

### `direct_web_google`

- 适用目标：
  - 自建站
  - Google H5 rewarded
- 当前奖励策略：
  - `rewardedArenaTrial = enabled`
  - `doubleReward = enabled`
  - `continueAfterLoss = enabled`
- 当前收益来源：
  - 自建站流量上的 Google H5 rewarded 广告
- 运营含义：
  - 流量、留存、广告转化都由我们自己负责

### `crazygames_basic`

- 适用目标：
  - CrazyGames Basic Launch
- 官方硬约束：
  - 无 monetization
  - 不允许外部广告
  - 若已集成 SDK，广告禁用时游戏也必须正常运行
  - 不能有“点了没反应”的 rewarded 按钮
- 当前奖励策略：
  - `rewardedArenaTrial = hidden`
  - `doubleReward = hidden`
  - `continueAfterLoss = hidden`
- 当前收益来源：
  - 无
- 运营含义：
  - 这个阶段目标不是赚钱，是过 QA、拿真实玩家数据、争取 Full Launch

### `crazygames_full`

- 适用目标：
  - CrazyGames Full Launch
- 官方硬约束：
  - 只能走 CrazyGames SDK 广告
  - 进度应接入 CrazyGames 账号 / Data / APS 体系之一
  - 如接 IAP，需要 CrazyGames + Xsolla 邀请制支持
- 规划奖励策略：
  - `rewardedArenaTrial = enabled_via_crazygames_sdk`
  - `doubleReward = enabled_via_crazygames_sdk`
  - `continueAfterLoss = enabled_via_crazygames_sdk`
- 收益来源：
  - CrazyGames SDK 广告
  - 可选：invite-only 的 Xsolla IAP

## 当前代码层面的客观状态

### CrazyGames Basic 现在不是“广告不接”，而是“广告入口也不露”

当前代码已经按这个方向实现：

- Quick Battle 锁定场地：
  - 如果本渠道 reward placement 不可用，不会显示 `WATCH AD TRIAL`
  - 会退化成纯锁定提示和 `SCRAP` 进度要求
- Match Result：
  - `doubleRewardVisible` 只有在 placement 可用时才显示
  - `continueVisible` 只有在 placement 可用时才显示

已完成的自动化证据：

- 本地 CrazyGames smoke 已验证锁定场地不会再露出广告试玩文案
- 结果页奖励按钮的代码路径已经是“placement 不可用 -> 按钮隐藏”

## 仍待设计的问题

CrazyGames Basic 虽然现在合规了，但用户体验和 Google 渠道相比会少 3 个好处：

1. 锁定场地没有广告试玩
2. 结算页没有双倍奖励
3. 失败后没有广告继续

这不是 bug，而是渠道差异。
但它是一个设计问题，后续需要单独决定是否补“非广告替代方案”。

## 建议的渠道策略

### 现在先这样

#### `direct_web_google`

- 继续保留 rewarded 入口
- 作为自主经营和广告变现主线

#### `crazygames_basic`

- 保持奖励广告入口全部隐藏
- 不做假按钮
- 不做“点了以后提示广告不可用”的伪入口
- 只把它当：
  - QA 验证渠道
  - 指标验证渠道
  - 流量试水渠道

### 后续再决定是否补这些非广告替代

可讨论但尚未锁定的替代方案：

1. 每日一次免费场地试用
2. 首胜双倍基础奖励
3. 连胜 / 首局完成奖励
4. 挑战失败后的免费一次重开

这些都要单独平衡，不能直接从 Google 渠道照搬。

## 多渠道常见做法

这里是基于平台规则和行业经验的归纳，不是 CrazyGames 官方硬性要求。

### 浏览器自建站 + 广告

- 常见做法：
  - 用 rewarded ads 承担“继续 / 双倍 / 免费试用 / 免费开箱”这些可选收益入口
- 特点：
  - 变现强依赖流量与广告完成率

### CrazyGames Basic

- 常见做法：
  - 先提交一个不依赖广告的完整可玩版本
  - 先看留存、点击进入率、平均游玩时长
  - 等进入 Full，再恢复 reward surfaces
- 特点：
  - Basic 的核心不是 ARPDAU，而是通过平台筛选

### CrazyGames Full

- 常见做法：
  - 恢复 rewarded / midgame
  - 接 CrazyGames 账号同步
  - 如获邀，再考虑平台 IAP

### 移动端商店

- 常见做法：
  - “rewarded ads + IAP” 混合变现
  - reward 负责低付费用户
  - IAP 负责高价值用户和去广告包 / 起步包 / 货币包
- 平台硬约束：
  - Apple App Store：应用内数字内容解锁要走 In-App Purchase
  - Google Play：应用内数字商品/服务通常要走 Google Play Billing

## CrazyGames 收益模式，当前能确认的

### Basic Launch

- 不赚钱
- 官方明确：
  - ads disabled
  - no revenue will be shared

### Full Launch

- 靠 CrazyGames 平台流量 + 他们的广告体系赚钱
- 我们拿 revenue share
- 但官方没有公开一个固定百分比分成表

公开能确认的是：

- 收益取决于：
  - 游戏流量
  - 广告表现
  - 广告主需求
- 如果选择 2 个月浏览器独家且由 CrazyGames 托管：
  - 可获得 `50%` 的 compensation uplift

## 我们接下来该怎么做

1. 继续把 `crazygames_basic` 当“通过 Basic、看指标”的版本，不把它当当前赚钱主线
2. 继续让 `direct_web_google` 作为真钱变现主线
3. 在 registry 里长期保留 3 条渠道：
   - `direct_web_google`
   - `crazygames_basic`
   - `crazygames_full`
4. 后续单独做一个“渠道经济差异设计”小专题，决定 CrazyGames Basic 是否需要无广告替代福利

## 官方资料

- CrazyGames Launch phases: https://docs.crazygames.com/
- CrazyGames Intro / Requirements: https://docs.crazygames.com/requirements/intro
- CrazyGames Ads Requirements: https://docs.crazygames.com/requirements/ads/
- CrazyGames FAQ: https://docs.crazygames.com/faq/
- CrazyGames Payouts: https://docs.crazygames.com/payouts/
- CrazyGames In-game Purchases: https://docs.crazygames.com/sdk/in-game-purchases/
- CrazyGames Automatic Progress Save: https://docs.crazygames.com/other/aps/
- CrazyGames Account Integration: https://docs.crazygames.com/requirements/account-integration/
- CrazyGames Developer Terms (compensation / exclusivity): https://files.crazygames.com/documents/developer_terms_20240802.pdf
- Apple App Review Guidelines 3.1.1: https://developer.apple.com/app-store/review/guidelines/
- Google Play Payments policy: https://support.google.com/googleplay/android-developer/answer/10281818?hl=en-EN
