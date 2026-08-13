# 随机连三链（random_chain_v3）

> **当前发布状态**：测试版 v1.0.0（Pre-release），功能可用但仍在打磨，欢迎反馈。

> **创作声明**：本项目为"新手 AI 创作"——由新手开发者与 AI 助手协作开发，代码与文档尚在成长中，欢迎指正、提 Issue 或 PR。

> **平台声明**：本插件专为 **Operit AI**（Android 智能助手应用）开发，运行在其沙盒工具包（ToolPkg）运行时中，不适用于其他平台。
>
> - Operit 官方仓库：https://github.com/AAswordman/Operit
> - 脚本与工具包开发文档：https://cdn.jsdelivr.net/gh/AAswordman/Operit@main/docs/SCRIPT_DEV_SKILL.md

Operit AI 平台的沙盒工具包（ToolPkg）插件：让 AI 在用户沉默一段时间后，按一条平滑上升的概率曲线"自己主动"来找用户说话。

## 特性

- **三链状态机**：空闲态定时巡查、运行态每分钟累加、命中即唤醒 AI 主动发言
- **平滑概率公式**：`f = a·x + b·x^c`，`y = 100·f / (1 + f)`，x 为沉默分钟数
  - 默认参数 `a=0.007078203`、`b=6.00914e-07`、`c=3.15168`
  - 参考曲线：x=60 → 约 40%，x=120 → 约 75%，x=180 → 约 90%，单调递增、渐近 100%
- **自然唤醒文案**：发给 AI 的唤醒消息不暴露任何机制词，AI 会像自己主动想找用户说话一样开口
- **角色卡名字定位**：发送时按"角色卡名字"自动查表定位，不再需要手工配置对话编号；名字留空则跟随当前对话
- **立即触发**：手动触发发送即返回，不等待 AI 回复完成，面板点击即刻生效
- **中文回复约束**：所有唤醒话术强制中文输出
- **冷却与连续命中上限**：命中后进入冷却；连续命中达到上限自动停止主动消息
- **可联动温柔巡检**：检测到"温柔巡检"插件运行时，把计数联动到它的吃醋数值（封顶不触发惩罚档）
- **侧边栏面板**：实时查看 x/y 状态、手动触发、重置冷却/计数、编辑公式参数、角色卡名字、话术与发送方式

## 目录结构

```
src/
  main.js                          # 入口
  manifest.json                    # 工具包清单
  packages/random_chain.js         # 核心逻辑（工具实现）
  ui/xy_panel/index.ui.js          # 侧边栏面板
  resources/random_chain_workflow_market.json  # 工作流模板
formula.example.json               # 配置示例（复制为 formula.json 使用）
```

## 安装

1. 把整个目录放到设备上的 Operit AI 插件目录 `/sdcard/Download/Operit/plugins/random_chain/`
2. 在 Operit AI 应用内用"调试烧录"功能安装 `src/manifest.json`（或把打包好的 `.toolpkg` 导入外部包目录）
3. 导入 `resources/random_chain_workflow_market.json` 提供的工作流（三条链）
4. 在侧边栏面板打开"随机连三链"，按需修改参数

## 配置（formula.json）

| 字段 | 说明 |
| --- | --- |
| a / b / c | 公式参数：`f = a·x + b·x^c` |
| idle_threshold_minutes | 沉默阈值（分钟），超过即启动累加 |
| cooldown_minutes | 唤醒后冷却（分钟） |
| awake_mode | `default`=AI 自由发挥带上下文；`custom`=用本地话术库 |
| send_mode | 仅支持 A1/A2，均走对话内唤醒、只落正文 |
| max_wake_stops | 连续命中主动消息停止上限 |
| character_card_name | 唤醒时按名字定位的角色卡；留空跟随当前对话 |
| awake_messages | 自定义话术库（每行一句） |
| ai_gateway | 可选：直调大模型接口自产话术 |

真实运行数据（`formula.json`、`state.json`）不要提交到仓库。

## 许可

MIT License
