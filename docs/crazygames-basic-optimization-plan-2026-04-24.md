# CrazyGames Basic 阶段优化方案

日期：2026-04-24

## 结论

`Spin Clash` 现在的 `crazygames_basic` 版本已经基本合规，但还不是最有利于晋级 `Full Launch` 的玩法包装。

当前最大风险不是“广告没接上”，而是：

1. 去掉广告奖励后，原本承担“扩内容、加速进度、挽回失败、延长单次会话”的 3 个入口同时消失了。
2. 游戏内虽然仍然有非广告的成长路径，但这条路径当前没有被明确地、强势地告诉玩家。
3. `CrazyGames Basic` 测的不是变现，而是纯玩法吸引力；如果玩家在前 1 到 2 个会话里看不懂正确推进路线，`conversion / playtime / retention` 都会被拖低。

这意味着，`CrazyGames Basic` 不应该只是“Google 版去掉广告按钮”，而应该是：

**把 `Championship Path` 提升为该渠道的主循环，把广告奖励承担的用户价值替换成更直接的路径引导、失败恢复、和非广告进度甜头。**

## 官方评估口径

CrazyGames 官方当前公开说明：

- `Basic Launch` 会关闭广告，目的就是测真实的有机兴趣与留存，而不是广告干扰后的表现。
- 晋级 `Full Launch` 主要看：
  - `average playtime`
  - `gameplay conversion`
  - `retention`
- 平台会在 Developer Dashboard 提供：
  - `Players`
  - `Average playtime`
  - `Gameplay conversion`
  - `Retention`
  - `Revenue`

官方资料：

- [CrazyGames Introduction](https://docs.crazygames.com/requirements/intro/)
- [CrazyGames Advertisement Requirements](https://docs.crazygames.com/requirements/ads/)
- [CrazyGames FAQ](https://docs.crazygames.com/faq/)
- [CrazyGames Gameplay Requirements](https://docs.crazygames.com/requirements/gameplay/)
- [CrazyGames Quality Guidelines](https://docs.crazygames.com/requirements/quality/)

## 当前项目的客观事实

### 1. `crazygames_basic` 现在确实会隐藏广告奖励入口

当前渠道规则和运行时行为已经明确：

- 锁定场地不再展示 `WATCH AD TRIAL`
- 结果页不再展示 `DOUBLE REWARD`
- 挑战失败后不再展示 `CONTINUE +AD`

对应项目证据：

- [distribution/channel-registry.json](C:/Users/29940/spin-clash/distribution/channel-registry.json)
- [src/loadout-ui-tools.js](C:/Users/29940/spin-clash/src/loadout-ui-tools.js)
- [src/match-flow-tools.js](C:/Users/29940/spin-clash/src/match-flow-tools.js)

### 2. 这 3 个入口原本承担的是 3 种不同的用户价值

它们不是单纯“变现按钮”，而是：

1. `试玩场地`
   - 让玩家在资源不足时也能提前体验新内容
   - 作用：减少死胡同，增加内容探索

2. `双倍奖励`
   - 让每场结算更兴奋、更有推进感
   - 作用：增强结果页停留、加快成长体感

3. `广告继续`
   - 在失败时给一次挽回机会
   - 作用：降低挫败感、延长单次会话

因此，隐藏它们之后，如果什么都不补，伤到的不是广告收入，而是 `Basic` 最关心的指标。

### 3. 游戏里其实已经有一条足够强的“非广告成长主线”，只是没被强调出来

这是当前最重要的发现。

#### 经济与解锁现状

- Quick Battle 基础奖励：
  - 胜利 `16`
  - 失败 `6`
- Championship Path 基础奖励：
  - 胜利基础 `20`
  - 失败基础 `12`
- 第一个锁定场地 `hex_bowl` 解锁价：
  - `120 SCRAP`

对应文件：

- [src/config-economy.js](C:/Users/29940/spin-clash/src/config-economy.js)
- [src/config-arenas.js](C:/Users/29940/spin-clash/src/config-arenas.js)

#### 前三关 Path 的实际回报

`RANK I` 下，前 3 个节点首次通关奖励分别是：

1. `node-1`：`20 + 14 = 34`
2. `node-2`：`20 + 18 = 38`
3. `node-3`：`20 + 24 + 6 = 50`

累计：`122 SCRAP`

也就是说：

**玩家只要顺着 Path 打到第一个 checkpoint，就已经足够买下第一个锁定场地。**

更进一步，挑战模式还会在通关时自动解锁当前场地，并且在 rank clear 后解锁路径奖励陀螺。

对应文件：

- [src/config-challenge-road.js](C:/Users/29940/spin-clash/src/config-challenge-road.js)
- [src/config-road-ranks.js](C:/Users/29940/spin-clash/src/config-road-ranks.js)
- [src/match-flow-tools.js](C:/Users/29940/spin-clash/src/match-flow-tools.js)

这说明：

**`CrazyGames Basic` 版并不缺“成长路径”，缺的是把玩家清楚地送进这条路径。**

## 风险拆解：去掉广告奖励后，会具体伤到哪些指标

## `Gameplay Conversion` 风险

### 风险 1：Quick Battle 的锁定场地在资源不足时会变成死胡同

当前 `crazygames_basic` 的锁定场地提示会退化成纯锁定提示。  
从合规看，这是对的。  
但从 `Basic` 指标看，这会带来两个问题：

- 玩家知道内容存在，但看不到立即可行的行动
- 玩家容易把“这个游戏不给我玩更多内容”误读成“这个游戏内容少/推进慢”

更严重的是，当前 Basic 覆盖文案写的是“先赚更多 SCRAP”，但没有明确告诉玩家：

- 继续打 `Championship Path` 是更快的路
- 前三个节点就足以买第一个锁定场地
- Path 本身还会直接解锁场地和奖励陀螺

这不是数值问题，而是 **路径可理解性问题**。

### 风险 2：当前项目仍然像“双主循环”，但两个循环的早期效率已不对等

在 Google 自建站版里：

- Quick Battle 可以配合广告试用和双倍奖励
- 它可以承担“轻会话 + 也能拿好处”的职责

但在 CrazyGames Basic 里：

- Quick Battle 没有广告试用
- 结果页也没有双倍奖励
- 它在前期成长上的吸引力明显弱于 Path

这意味着：

**同样的首页结构，到了 CrazyGames Basic，不该再把 Quick 和 Path 放成几乎同权重。**

如果仍然这样做，很多玩家会走进“低推进效率”的那条路，进而拖低 `conversion` 和前几分钟的满意度。

## `Average Playtime` 风险

### 风险 3：结果页失去“继续停留”的刺激点

在 Google 版，结果页至少还有两个延长会话的因素：

- 双倍奖励
- 继续一次

在 CrazyGames Basic，这两个都没了。  
结果页就更容易变成“看一下结算，然后退出或返回”。

当前结果页的基础结构并没有错，但在 `crazygames_basic` 下，它少了一个新的主目标来接住玩家。

如果没有新的停留理由，平均游玩时长会更容易下滑。

### 风险 4：挑战失败后的情绪恢复能力变弱

当前挑战模式其实已经有两个缓冲：

- 失败也有基础 SCRAP
- 第 3 / 6 节点有 checkpoint

但广告继续入口消失后，玩家在关键失败时少了一个“我还没彻底断”的心理缓冲。

这会直接伤到：

- 本次会话是否马上结束
- 玩家是否愿意立刻再开一局

## `Retention` 风险

### 风险 5：失去“临时甜头”后，成长成就感需要被重新包装

广告试玩、双倍、继续，本质上都在提供即时甜头。

去掉它们后，如果仍然只靠基础结算，玩家对成长的主观感受会变慢。  
尤其在 `Basic` 阶段，平台就是在看“用户不靠外部刺激，自己愿不愿意留下来”。

因此不能只是把按钮拿掉，而要把“留下来的理由”换一种方式重新给出来。

### 风险 6：当前 Basic 文案没有把“为什么明天还回来”讲清楚

如果玩家退出前没有形成明确的下一个目标，例如：

- 再打 1 到 2 节点就能解锁新场地
- 再打一轮就能拿到 checkpoint
- 再推一段就能拿到下一只奖励陀螺

那么留存会比实际内容储备更差。

## 优化总原则

`CrazyGames Basic` 的方案不应该是：

- 假装广告还在
- 或者彻底删空，什么都不补

而应该遵守 4 条原则：

1. **不出现无效 rewarded 按钮**
2. **不把 Google 版的经济心智硬搬过来**
3. **把 `Championship Path` 变成 CrazyGames Basic 的推荐主循环**
4. **用非广告的方式补回“扩内容、加速推进、挽回失败”这 3 种用户价值**

## 推荐方案

## P0：发包前必须做

### 1. 把 `Championship Path` 提升为 CrazyGames Basic 的主推荐入口

这是当前最重要的调整。

原因：

- Path 的前 3 节点就能给出 `122 SCRAP`
- Path 天然有节点目标、checkpoint、首通奖励、rank 奖励、场地解锁、奖励陀螺
- Path 比 Quick 更适合支撑 `Basic` 需要的 `playtime` 与 `retention`

具体建议：

- 在 `crazygames_basic` 下，把 `ENTER PATH` 设成首页主 CTA
- 把 `QUICK BATTLE` 改成次级入口
- 在 Path 入口附近明确写：
  - 这是最快的 `SCRAP` 获取方式
  - 这是解锁场地和奖励陀螺的主要路线

### 2. 消灭 Quick Battle 锁定场地的“死胡同”

现在的正确方向不是恢复广告试玩，而是：

- 当场地锁定且买不起时
- 主按钮不要只是 `ARENA LOCKED`
- 应该直接引导玩家去 `Championship Path`

推荐做法：

- 将 `crazygames_basic` 下的该状态主按钮改成：
  - `GO TO PATH`
  - 或 `EARN SCRAP IN PATH`
- hint 改成明确的双路径文案，例如：
  - `Clear deeper Championship Path nodes to unlock this arena permanently, or earn 120 SCRAP to buy it now.`

这样做的价值：

- 不再让锁定内容成为体验死点
- 把“锁定”变成“明确可达成目标”
- 直接提高 `conversion to gameplay`

### 3. 重写 `crazygames_basic` 的结果页引导文案与动作层级

当前结果页隐藏广告后，动作虽然合规，但对 `Basic` 来说还不够强。

建议：

- 挑战失败时：
  - 主按钮优先回到 `Path retry / same node retry`
  - 明确写出：
    - 本局仍拿到多少 SCRAP
    - checkpoint 是否已保留
    - 下一次回来的最近目标是什么
- Quick 结算时：
  - 如果玩家还在早期成长阶段，明确提示：
    - `Championship Path` 才是更快解锁新场地/新陀螺的路线

### 4. 对 `crazygames_basic` 做一次英语可见文案审计

目标不是删源码字符串，而是确保玩家可见层不再沿用 Google 版的广告心智。

至少要检查：

- 锁定场地 hint
- Path 入口说明
- 结果页失败引导
- 首通奖励、checkpoint、rank 奖励的表达是否足够清晰

## P1：强烈建议在 Basic 前就做

### 5. 补一个“非广告版的即时甜头”

我不建议一开始就补 3 个完整替代系统。  
最稳的是先补 **1 个最便宜、最清晰的非广告甜头**。

推荐优先级：

#### 方案 A，推荐：`Championship Path` 首次通关奖励加成

例如：

- 每个会话第一次 Path clear：
  - `+25%` 或 `+50%` SCRAP
- 或前 3 个首次 Path clear 带轻度加成

优点：

- 实现最简单
- 直接加强主循环
- 不会制造假广告心智
- 能补回部分“双倍奖励”缺失带来的爽感下降

#### 方案 B：每个会话一次免费挑战重赛

例如：

- 每次会话第一次 Championship 失败后
- 给一次“同节点立即重赛”
- 不跨节点、不保底通关、不恢复整条 run

优点：

- 对 `playtime` 有直接帮助
- 能缓解“广告继续”消失后的挫败感

缺点：

- 设计和实现都比方案 A 稍重

#### 当前建议

先做 `A`，再视数据决定要不要加 `B`。

## P2：看 Basic 数据后再决定

### 6. 是否要补“免费预览新场地”的替代福利

我不建议在发包前就急着做“无广告场地试玩替代品”，原因是：

- Path 本身已经能较快解锁第一个锁定场地
- 当前更大的问题是玩家是否被正确引导到 Path

如果上线后仍然出现：

- Quick Battle 入口点击高
- 锁定场地查看高
- 但进入 Path 的转化低

再考虑补以下其中一个：

- 每日一个免费 featured arena
- 首次见到新场地时给 1 次免费体验
- 达到某个 checkpoint 后发放一次快速预览权

## 推荐的落地顺序

### 第一阶段：发包前必须完成

1. Path 主 CTA 化
2. 锁定场地死胡同改成 Path 引导
3. Basic 结果页引导重写
4. 英语可见文案审计

### 第二阶段：发包前如有时间，补 1 个轻量福利

5. `Championship Path` 首次通关加成

### 第三阶段：看 Basic 数据再决定

6. 会话免费重赛
7. 新场地免费预览

## 上线后该怎么看数据

优先看 CrazyGames Developer Dashboard 的：

1. `Gameplay conversion`
2. `Average playtime`
3. `Retention`

建议的判断方式：

### 如果 `Gameplay conversion` 低

优先怀疑：

- 首页主循环引导不清
- Quick / Path 权重放错
- 锁定场地仍然像死胡同

### 如果 `Average playtime` 低

优先怀疑：

- 失败后没有恢复动力
- 结果页没有给下一步强目标
- 进度甜头不够明显

### 如果 `Retention` 低

优先怀疑：

- 下一个可解锁目标不清晰
- 玩家退出前没有形成“明天回来干什么”的理由
- 无广告版经济体验偏慢

## 对当前版本的最终判断

当前 `crazygames_basic`：

- 合规：是
- 可提交：是
- 足够干净：是
- 足够有利于晋级 `Full`：还不够

最关键的不是补回广告，而是：

**把 CrazyGames Basic 明确改造成“Path-first、目标清晰、无死胡同、带少量非广告甜头”的版本。**

如果只保留现在这种“广告入口隐藏，但核心引导不改”的版本，能上线，但会白白损失一部分 `Basic` 阶段最关键的自然表现。
