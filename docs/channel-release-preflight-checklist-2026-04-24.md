# 发版前渠道检查清单

日期：2026-04-24

## 目的

这个清单只解决一件事：

**准备发某个渠道包之前，确保你发的是“正确渠道、正确规则、正确构建、正确行为”的版本。**

不是泛泛的 QA 清单，而是渠道外发清单。

## 统一原则

发版前不要靠记忆。

先跑：

```powershell
npm run channel:list
```

确认：

- 目标渠道是哪一个
- 当前渠道的广告规则
- 当前渠道的收入状态
- 当前渠道是否有行为契约

## 通用发版前步骤

无论发哪个渠道，都先做：

1. 确认本次改动的功能分类
   参考：
   - `docs/channel-change-classification-rules-2026-04-24.md`

2. 确认目标渠道
   只能是：
   - `direct_web_google`
   - `crazygames_basic`
   - 以后如被邀请再启用 `crazygames_full`

3. 跑对应验证

```powershell
npm run verify:channel -- --channel <channel_id>
```

4. 如果改动属于 `core_gameplay` 或 `shared_capability`
   再跑：

```powershell
npm run verify:channels
```

5. 看最近 smoke / report 是否符合预期

## `direct_web_google` 清单

### 发版前必须确认

- 渠道是 `direct_web_google`
- Google H5 环境变量链是完整的
- 当前构建不是 CrazyGames 包
- 自建站该有的广告/后端桥接没有被删掉

### 必跑

```powershell
npm run verify:channel -- --channel direct_web_google
```

### 发布前额外确认

- 真实 host 环境变量是否正确
- 自建站部署后能实际打开
- 广告不是测试态误留
- 自建站专属逻辑没有被平台渠道 override 冲掉

## `crazygames_basic` 清单

### 发版前必须确认

- 渠道是 `crazygames_basic`
- 仍然处在 Basic 阶段，而不是误开 `crazygames_full`
- 包里没有外部广告
- 没有无效 rewarded 按钮
- 渠道行为契约仍然成立

### 必跑

```powershell
npm run verify:channel -- --channel crazygames_basic
```

### 重点观察项

- 首页主 CTA 是否还是 `Path-first`
- Quick Battle 锁定场地是否还是 `GO TO PATH`
- 锁定后点击是否真的会去 `Path`
- Quick / Path 的文案关系有没有被母体更新冲掉
- 结果页引导是否还在强调 Path 是主推进路线

### 提交前人工确认

- 预览环境里再看一次 `CrazyGames` iframe
- 确认封面、视频、zip 是同一批提交版本

## `crazygames_full` 清单

当前默认不使用。  
只有在 CrazyGames 明确通知可以进 Full 后，才允许启用。

### 发版前必须确认

- 已被平台邀请进入 Full
- 广告只走 CrazyGames SDK
- 不存在外部广告残留
- Full 阶段要求的账号/数据/广告规则已补齐

### 必跑

```powershell
npm run verify:channel -- --channel crazygames_full --allow-planned
```

## 渠道差异保护清单

如果本次改动涉及以下任一类，发版前必须额外确认：

- 首页 CTA 调整
- 锁定内容 fallback 行为
- 奖励按钮显隐
- 结果页引导
- 平台专属文案
- 平台专属经济包装

确认项：

1. 差异是否写进了渠道代码层
2. 差异是否写进了 `behaviorContracts`
3. 差异是否被 `check/smoke` 覆盖

如果 3 条里缺任何一条，这个差异就不算真正安全。

## 发版前最后一问

在真的上传或部署前，必须能回答这 4 个问题：

1. 我现在发的是哪个渠道？
2. 这个渠道允许什么，不允许什么？
3. 这次新功能属于哪一类变更？
4. 我已经跑过哪条验证链来证明旧的渠道差异没被冲掉？

如果其中任何一个答不上来，不要发。
