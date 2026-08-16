# 随机上线（on_air）

[English](README.en.md)

> **当前发布状态**：测试版 v1.7.10-beta（Pre-release），功能可用但仍在打磨，欢迎反馈。

> **创作声明**：本项目为"新手 AI 创作"——由新手开发者与 AI 助手协作开发，代码与文档尚在成长中，欢迎指正、提 Issue 或 PR。

> **平台声明**：本插件专为 **Operit AI**（Android 智能助手应用）开发，运行在其沙盒工具包（ToolPkg）运行时中，不适用于其他平台。
>
> - Operit 官方仓库：https://github.com/AAswordman/Operit
> - 脚本与工具包开发文档：https://cdn.jsdelivr.net/gh/AAswordman/Operit@main/docs/SCRIPT_DEV_SKILL.md

> **支持版本**：本插件在 **Operit AI 1.12.1**（Android）上开发与测试；更早版本可能缺少部分 ToolPkg 能力，建议使用 1.12.1 或更新版本。

**随机上线**：装成真人的 Operit AI 插件。它不会定时打卡，而是在随机的时间悄悄上线，主动来找你说话。

- **不是定时器，是概率**：你沉默得越久，它上线的概率就越高。空闲时每 15 分钟看一眼你有没有说话，进入运行后每分钟掷一次骰子，掷中了就冒出来找你。
- **不是机器人，是"也许 ta 这会儿在"**：唤醒消息不暴露任何机制词，AI 会像自己突然想找你聊天一样开口，戏做全套。

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
- **静默时段**：白天段、夜间段两段静默独立开关，时段可自定义（适配倒班、补觉、上课等作息）
- **日历静默**：日历三色高亮（当前日期紫色、静默日深色、其余亮色），全部日子可点选全天硬静默，点一下即生效、再点取消
- **上学日自动静默**：开启后普通日（非节假日、非周末、学生模式下非寒暑假）自动全天硬静默
- **学生模式开关**：开=寒暑假算特殊日保持彩色；关=成年人模式，寒暑假按普通日处理
- **日期静默总开关**：一键关闭全部日期级静默（点选静默日与上学日自动静默）
- **内置 2026 中国法定节假日**：每天 12 点后联网拉取节假日，自动识别特殊日
- **样本统计（隐私保护）**：仅读取消息时间戳与发言人标识判断沉默，不读取、不保存正文内容
- **侧边栏面板**：实时查看 x/y 状态、手动触发、重置冷却/计数、编辑公式参数、角色卡名字、话术、静默与日历配置

## 目录结构

```
src/
  main.js                          # 入口
  manifest.json                    # 工具包清单
  packages/on_air.js               # 核心逻辑（工具实现）
  ui/xy_panel/index.ui.js          # 侧边栏面板
  resources/on_air_workflow_market.json  # 工作流模板
formula.example.json               # 配置示例（复制为 formula.json 使用）
```

## 安装

1. 把整个目录放到设备上的 Operit AI 插件目录 `/sdcard/Download/Operit/plugins/on_air/`
2. 在 Operit AI 应用内用"调试烧录"功能安装 `src/manifest.json`（或把打包好的 `.toolpkg` 导入外部包目录）
3. 导入 `resources/on_air_workflow_market.json` 提供的工作流（三条链）
4. 在侧边栏面板打开"随机上线"，按需修改参数

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
| quiet_enabled | 静默总开关（时段静默） |
| quiet_day_enabled / quiet_night_enabled | 白天段 / 夜间段独立开关 |
| quiet_day_start / quiet_day_end | 白天段起止 HH:MM（默认 09:00~18:00） |
| quiet_night_start / quiet_night_end | 夜间段起止 HH:MM（默认 22:00~09:00，跨天） |
| quiet_dates | 点选的全天静默日映射，如 `{"2026-08-18":"full"}` |
| school_day_auto_quiet | 上学日自动静默开关 |
| student_mode | 学生模式开关 |
| date_quiet_enabled | 日期静默总开关 |

真实运行数据（`formula.json`、`state.json`）不要提交到仓库。

## 对外 API（供其他插件/工作流调用）

本插件导出的全部工具由 Operit 框架自动注册，其他插件与工作流可直接调用，前缀为 `on_air:`。

**入门**：先调 `on_air:api_docs`，即可拿到全部工具的完整说明（参数、返回格式、调用示例）。

| 工具 | 功能 | 示例 |
| --- | --- | --- |
| get_xy | 读取当前状态（x、y、冷却、公式） | `on_air:get_xy` |
| compute_y | 按公式计算概率 y | `on_air:compute_y {x:20}` |
| set_x | 手动设置 x | `on_air:set_x {x:5}` |
| increment_x | x 累加 1 | `on_air:increment_x` |
| check_activity | 查用户最近说话时间 | `on_air:check_activity {threshold_minutes:10}` |
| roll_dice | 按 y 为概率掷骰 | `on_air:roll_dice` |
| manual_awake | 手动触发一次唤醒消息 | `on_air:manual_awake` |
| coax | 安抚复位计数并联动温柔巡检 | `on_air:coax` |
| reset_cooldown | 重置/设置冷却 | `on_air:reset_cooldown {minutes:0}` |
| update_formula | 更新公式与配置参数 | `on_air:update_formula {a:0.007}` |
| get_formula | 读取公式配置 | `on_air:get_formula` |
| maybe_awake | 运行态掷骰，命中才发消息 | `on_air:maybe_awake` |
| enter_running | 进入运行态并启动累加 | `on_air:enter_running` |
| api_docs | 返回全部工具的 API 文档 | `on_air:api_docs` |

所有工具统一返回 `{success, message, data}`；参数传对象，除标注必填外均可省略。

## 版本规则（SemVer）

版本号采用语义化版本 X.Y.Z，递增规则：

| 改动 | 版本变化 | 示例 |
| --- | --- | --- |
| 小修复（向下兼容的修正） | 修订号 +1 | v1.0.0 → v1.0.1 |
| 新功能/较大改进（向下兼容） | 次版本号 +1，修订号归零 | v1.0.5 → v1.1.0 |
| 大改动（不兼容变更） | 主版本号 +1，后两位归零 | v1.9.2 → v2.0.0 |

测试期版本带 `-beta` 后缀（如 `v1.0.0-beta`），正式版使用不带后缀的版本号。

## 许可

MIT License
