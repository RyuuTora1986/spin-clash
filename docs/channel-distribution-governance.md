# 渠道外发治理

## 结论

这个项目后续不应该靠“人记住当前要发哪个版本”来操作。

应当固定成三层：

1. 仓库里的 `channel registry`
2. 由 registry 驱动的构建 / 检查脚本
3. 最后才是给 AI 或人工操作用的说明

## 为什么不是先做 skill

`skill` 适合描述流程，不适合强制阻止错误构建。

渠道错误的本质通常是：

- 平台包里混进了外部广告
- 自建站包没有带正确的广告 / 后端配置
- 渠道要求变了，但构建脚本没跟着改

这些都属于“构建物和规则不一致”，必须由脚本直接检查。

## 当前渠道

当前 registry 在：

`distribution/channel-registry.json`

现阶段明确了 3 条渠道：

1. `direct_web_google`
2. `crazygames_basic`
3. `crazygames_full`

其中：

- `direct_web_google`：自建站 + Google H5
- `crazygames_basic`：CrazyGames Basic Launch 提交包
- `crazygames_full`：保留为后续 Full Launch 规划，不应默认启用

## 当前约束方式

### 1. 单一事实源

每个渠道都在 registry 里声明：

- 构建脚本
- 输出目录
- 运行时平台
- 广告规则
- 账号规则
- 后端规则
- 操作员必须满足的环境变量
- 渠道专属检查项

### 2. 统一构建入口

查看渠道：

```powershell
npm run channel:list
```

按渠道构建：

```powershell
npm run build:channel -- --channel crazygames_basic
```

```powershell
npm run build:channel -- --channel direct_web_google
```

### 3. 统一检查入口

单独检查某个渠道的输出物：

```powershell
npm run check:channel -- --channel crazygames_basic
```

```powershell
npm run check:channel -- --channel direct_web_google
```

## 当前建议

### 现在就该做的

把“先看 registry，再决定构建哪个渠道”变成固定操作。

也就是说：

- 要发自建站，就走 `direct_web_google`
- 要交 CrazyGames，就走 `crazygames_basic`
- 不要再手工凭印象直接跑某个脚本

### 不要现在就做的

不要马上把这套逻辑抽成 skill 作为唯一约束。

原因很简单：

- `skill` 不能阻止错误 zip 被产出
- `skill` 不能直接校验打包结果
- `skill` 更适合在规则稳定后做成助手操作层

## 对其他游戏项目的推广建议

最好的顺序不是“先做全局顶层规则”，也不是“先做 skill”。

最好的顺序是：

1. 先在单个项目里把 `channel registry + build/check wrapper` 跑顺
2. 等 2 到 3 个游戏项目都采用了接近的 schema，再抽成一个本地 CLI 工具
3. 最后再补一个 skill，要求 AI 先读 registry、再调用 CLI，不允许跳过

## 适合未来抽出去的部分

如果后面你要把这套东西推广到别的本地游戏项目，真正值得抽出去的是：

- registry schema
- `build:channel`
- `check:channel`
- release manifest 输出

不值得最先抽出去的是：

- 这个项目自己的平台细节
- 某个单独平台的一次性运营文案
- 与当前游戏耦合过深的提交素材脚本

## 现在这套结构的判断

这是“项目内可执行约束”，不是最终平台。

但这一步是对的，因为它已经能解决最容易出错的问题：

- 先弄清渠道规则
- 再构建对应渠道
- 再检查输出物是否符合该渠道

等这套在多个项目里稳定以后，再上升为共享工具。
