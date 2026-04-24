# 游戏文字包新手引导分析报告

- 项目：Spin Clash
- 类型：web spinning-top arena battle
- 服务版本：1.3.0
- 文件数：1
- 文本条目数：1775
- 新手引导候选条目：386

## 节点覆盖

- `goal_statement`：17
- `operation_instruction`：39
- `unlock_prompt`：97
- `risk_correction`：27
- `system_explanation`：6
- `resource_guidance`：53
- `flow_transition`：87
- `correction_prompt`：56

## 主要缺口

- 当前文字包已覆盖基础引导信号，下一步应做项目内体验验证。

## 短样本

- `config-text.js::line_5`：if(Array.isArray(value)) return value.map(cloneLocale);
- `config-text.js::line_8`：Object.keys(value).forEach(function(key){
- `config-text.js::line_11`：return result;
- `config-text.js::line_13`：return value;
- `config-text.js::line_21`：titleGoalLabel:'NEXT TARGET',
- `config-text.js::line_28`：continuePath:'CONTINUE PATH',
- `config-text.js::line_29`：enterBattle:'CONTINUE PATH',
- `config-text.js::line_30`：loadoutTitle:'SELECT YOUR TOP',
- `config-text.js::line_31`：featuredTopTitle:'SELECTED TOP',
- `config-text.js::line_34`：homeTopCountLabel:'UNLOCKED',
- `config-text.js::line_35`：homeTopUnlocked:'UNLOCKED',
- `config-text.js::line_39`：topSourceWorkshop:'SCRAP UNLOCK',

## 建议教程蓝图

### 1. 首局目标
- 目的：把第一次体验收束到一个可完成目标。
- 建议文案：当前目标：titleGoalLabel:'NEXT TARGET',。
- 建议模式：objective_instruction

### 2. 操作路径
- 目的：把目标拆成对象明确、动作明确、结果可检查的步骤。
- 建议文案：围绕文字包、任务文本、提示文本、纠错文本设计一步一提示，并在每步后检查结果。
- 建议模式：control_context_hint，step_prompt_and_recheck

### 3. 解锁与反馈
- 目的：让新系统在玩家遇到需求后出现，并立刻给第一次使用任务。
- 建议文案：当玩家完成当前目标后，说明新能力解决什么问题，并给出第一步使用任务。
- 建议模式：system_unlock_ladder，unlock_feedback_handoff

### 4. 失败诊断
- 目的：为卡住、失败或资源不足准备状态、影响、修正动作三段式提示。
- 建议文案：如果出现“quickStartBlockedHint:'You cannot enter battle with a locked top. Return Home and switch to an unlocked top.',”，先说明状态，再说明影响，最后给出一个可执行修正。
- 建议模式：failure_state_diagnosis，risk_correction_prompt

## 写入游戏建议

- 把本报告写入项目文档后，先由开发或策划确认需要新增、改写或删除的文案 key。
- 把“建议文案”和“风险检查”转成游戏项目内的本地化文本、任务配置或引导脚本变更。
- 每次改动后，用同一份文字包重新分析，确认目标句、操作句、解锁提示和纠错提示都有覆盖。

## 边界

- 导入的文字包被视为项目私有输入，只在目标项目文档中保留短样本和分析结论，不进入 public_knowledge。

## 命中的公共知识

### 游戏卡

### 模式卡
- `system_unlock_ladder`
- `unlock_feedback_handoff`
- `facility_role_flow_chain`
- `economy_day_cycle_teaching`
- `failure_state_diagnosis`
- `risk_correction_prompt`
- `tutorial_card_system_prompt_layers`
- `control_context_hint`
- `objective_instruction`
- `step_prompt_and_recheck`
