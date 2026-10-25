# on_air v1.9.0-dev 开发契约（Phase1 冻结）

## 需求
让用户可自定义全部「递给 AI 的提示词」（8 处），支持一键恢复默认。

## 字段契约（存 formula.json）
| 字段名 | 对应位置 | 默认值 |
|---|---|---|
| prompt_manual_default | A 手动触发 default | 现 L1321 原文 |
| prompt_manual_prefix | B 手动触发 custom 前缀 | 现 L1324 原文 |
| prompt_auto_default | C 自动触发 default | 现 L1989 原文 |
| prompt_auto_prefix | D 自动触发 custom 前缀 | 现 L1992 原文 |
| prompt_gentle | E 温柔巡检通道 | 现 L2012 原文 |
| prompt_stop | F 置气消息 | 现 L1968 原文 |
| prompt_quiet_lifted | H 静默解除通知 | 现 L1006-1008 原文 |
| jealousy_tiers | G 档位话术库（二维） | 现 L1974-1979 的 4x2 |

## 占位符（可选配件，不填也能用）
- 支持：{档位} {次数} {话术} {时间}
- 无对应值 → 原样保留占位符，不改写用户文本
- {话术} 缺失时仅提示，不强制拦截

## 兜底规则
- 非字符串 / 空 / 纯空白 → 回落默认
- 长度上限 2000 字符，超出拒绝保存并提示
- jealousy_tiers JSON 解析失败 → 回落默认
- 老 formula.json 无新字段 → 行为与 1.8.3 逐字一致

## 附带修复
- F：爆表分支补 sendToAi（原 bug：置气消息从未发出）
- H：抽掉硬编码「小喵」

## UI 改造
- 拆多路由子页（registerUiRoute + ctx.navigate）
- 配色改 ctx.MaterialTheme.colorScheme，去掉硬编码黑白
- 页面：home / params / prompt / quiet / dates

## 版本
1.9.0-beta；目录 /sdcard/x/on_air/v1.9.0-beta/
