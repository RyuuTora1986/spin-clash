# 新功能是否影响各渠道 模板

日期：2026-04-24

## 用法

每次准备加一个新功能、新系统、新玩法，先复制这份模板，填一版。  
目的不是写长文，而是强制回答：

- 这次改动属于什么类型
- 会不会影响渠道差异
- 需要补哪些验证

建议文件命名：

`docs/feature-impact-<feature-name>-YYYY-MM-DD.md`

---

## 基本信息

- 功能名称：
- 日期：
- 负责人：
- 目标：

## 变更分类

从以下类别中选 1 个主类，可附 1 个次类：

- `core_gameplay`
- `shared_capability`
- `channel_wrapper`
- `platform_integration`
- `content_only`
- `ops_only`

填写：

- 主类：
- 次类：
- 分类理由：

## 这次改动会动到哪一层

- [ ] 内部母体 `core_web_vanilla`
- [ ] 共享能力层
- [ ] 渠道 override / wrapper
- [ ] 渠道构建脚本
- [ ] 渠道检查脚本
- [ ] 渠道 smoke
- [ ] 文档 / 清单

说明：

## 渠道影响矩阵

### `direct_web_google`

- 是否受影响：`是 / 否`
- 影响类型：
- 是否需要改代码：
- 是否需要改环境变量或发布配置：
- 是否需要补验证：
- 风险点：

### `crazygames_basic`

- 是否受影响：`是 / 否`
- 影响类型：
- 是否需要改代码：
- 是否需要改 `behaviorContracts`：
- 是否需要补 smoke/check：
- 风险点：

### `crazygames_full`

- 是否受影响：`是 / 否 / 暂不处理`
- 影响类型：
- 是否只是未来预留：
- 风险点：

## 这次改动会不会冲掉已有渠道差异

重点检查：

- [ ] 首页 CTA
- [ ] 按钮显隐
- [ ] 锁定内容 fallback
- [ ] 结果页引导
- [ ] 渠道文案
- [ ] 广告/账号/平台 SDK
- [ ] 构建 meta / 注入脚本

如果会，说明：

- 哪个差异可能被冲掉：
- 怎么保护它：
  - [ ] 写进渠道代码层
  - [ ] 写进 `behaviorContracts`
  - [ ] 写进 `check/smoke`

## 需要补的渠道专属处理

这里只写真正的渠道差异，不写通用功能内容。

### `direct_web_google`

- 无 / 有：

### `crazygames_basic`

- 无 / 有：

### `crazygames_full`

- 无 / 有 / 暂不处理：

## 必跑验证

至少列出这次必须跑的命令。

### 单渠道

```powershell
npm run verify:channel -- --channel <channel_id>
```

### 全渠道

```powershell
npm run verify:channels
```

本次应跑：

- [ ] `npm run verify:channel -- --channel direct_web_google`
- [ ] `npm run verify:channel -- --channel crazygames_basic`
- [ ] `npm run verify:channels`
- [ ] 其他：

## 是否允许本次直接发包

- [ ] 允许
- [ ] 不允许

理由：

## 最终决定

- 先改哪里：
- 哪些渠道现在就跟进：
- 哪些渠道先不跟进：
- 发包前最后还缺什么：

---

## 填完后的判断规则

如果模板填完后出现以下任一情况，不要直接开工或发包：

1. 功能分类说不清
2. 不知道会不会影响 `crazygames_basic`
3. 已知会影响渠道差异，但没打算补 `behaviorContracts`
4. 不知道该跑哪些验证命令

这种情况下，先补规则，再动代码。
