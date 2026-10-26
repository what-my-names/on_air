# on_air 后续扩展 · 实施计划（2026-10-20）

基线：v2.0.0（正式版）已发布

## 0. 前置铁律（每个版本都走）
1. 开工先 basic_memory 检索（铁律）→ 再读源码，不凭记忆改
2. 开发文件只写 /sdcard/x/
3. 构建前全量 node --check；METADATA 单独 json.loads 校验
4. 发布：文件与 tag 用 **git push**（GitHub 仓库即正本，本地只 clone 到 /tmp）；Release 说明 + 资产用 code_runner/MCP 调 REST。**不再写 push 脚本**
5. 每阶段完成后：日志三保险 + 踩坑（若新坑）+ 记忆

## 1. 版本路线

| 版本 | 内容 | 优先级 |
|---|---|---|
| v2.1.0 | 字段驱动重构（FIELD_SPEC）+ 7 项默认提示词强化 | ✅ 已发 |
| v2.1.1 | reset_prompts 改清空 + _provided 标记 + saveFormula 过滤内部字段 | ✅ 已发 |
| v2.1.2 | 删静默解除通知（5 处调用点）+ 面板移除该项 | ✅ 已发（当前） |
| v2.2.0 | 在场感知（detectDeviceActivity 复用） | 待做 |
| v2.2.1 | 唤醒时段权重 | 待做 |
| 备选 | 心情系统 / 多对话 / 上下文贴合 / 唤醒后跟进 | — |

## 2. v2.1.0 心情账本 · 分阶段

### P0 准备
- 建 /sdcard/x/on_air/v2.1.0/（复制 v2.0.0），改版本号
- basic_memory 检索「心情 / 账本 / ai_gateway」（已完成）

### P1 后端（packages/on_air.js）
1. DEFAULT_FORMULA 新增：
   - `mood_enabled: true`（开关）
   - `mood_value: 50`（0-100）
   - `mood_decay_per_hour: 0`（默认关；开启后长时间没人聊慢慢回落）
2. 新增函数：`loadMood()` / `saveMood()` / `moodLabel(v)`（分数→标签：低落/平静/愉快/雀跃）
3. 新增工具 3 个：
   - `get_mood` → `{value, label, updated_at, history[]}`
   - `set_mood {value?, label?, reason?}`
   - `mood_log {delta, reason?}`
4. 自动挂钩（心情自然变化）：
   - `check_activity` 检测到用户回话 → +3（reason：用户回话了）
   - `maybe_awake` 未命中 → -1（reason：没人理）
   - 达到 `max_wake_stops` 爆表 → -8（reason：被冷落）
5. 占位符：`{心情}` / `{心情值}` → 在 buildPrompt / fillPrompt 调用处注入

### P2 面板（ui/）
- 新建 `ui/mood_panel/index.ui.js`：当前心情大字 + 标签 + 最近 10 条变化 + 手动调整（+3 / -3 / 直接设值）+ 开关
- `main.js` 注册 `on_air_mood`（路由 6 → 7）
- 主页入口卡加「心情」（5 → 6 张）
- 沿用 v1.9.4 UI 规范：无 emoji/图标，纯排版层次，parseResult 包装，onLoad 每次读

### P3 提示词页
- 顶部占位符说明补 `{心情}` `{心情值}`
- 默认 `prompt_auto_default` 末尾加一句「语气贴合当前心情：{心情}」
- **不新增模板项**（保持 11 项，降低学习成本）

### P4 验证
- 8 个 js 文件 node --check
- METADATA json.loads
- 真机：`get_mood` 返回 50/平静；`set_mood {value:80}` 生效；`mood_log` 历史累加
- 自动：发一条消息后 `get_mood` 应 +3

### P5 发布
打包 → 重装 → curl 推送（13 文件 + tag + Release + 资产）→ README/RELEASE_NOTES → 远端逐文件 md5 验收

## 3. 验收标准
- `get_mood` 返回 `{success:true, data:{value,label,updated_at,history}}`
- `set_mood {value:80}` → value=80、label 自动映射
- `mood_log {delta:-5, reason:"测试"}` → history 多一条
- 面板与工具返回值一致

## 4. 风险与兜底
| 风险 | 兜底 |
|---|---|
| 心情文件损坏 | loadMood try/catch → 默认 50 |
| 心情影响过大 | 只作为提示词参考，不改 A1/A2 / 静默 / 唤醒概率 |
| 老 formula.json 无字段 | `||` 默认值兜底（v1.9.2 教训） |
| 占位符未提供 | fillPrompt 保留原样（现有逻辑） |

## 5. 待确认（3 条）
1. 版本号用 v2.1.0 吗？
2. 心情自动变化幅度（+3 / -1 / -8）可以吗？
3. P1 做完先停，还是连着做 P2、P3？

## 6. 长期发展路线（2026-10-20 定）

### 产品定位
on_air = 「装成真人的 Operit AI 插件——不是定时器，是概率」。核心动词：**主动**（AI 主动来找你），而不是等你叫它。
路线围绕一件事：**让“主动”变得可信、有性格、有来有回。**

### 阶段一·可靠（已基本完成，v2.0.0）
目标：不出错、可调、可观测。
- 配置读取/保存/发送稳定
- 提示词 11 项全可自定义
- 控制台（工具直调 + 全量读数 + API 文档）
- 话术占位防护

### 阶段二·有性格（原计划；心情系统已砍，仅存备选，实际推进以第 10/11 节为准）
目标：主动行为**有状态、有变化**，而不是每次一样。
- **v2.1 心情系统**：心情值 + 账本（历史）；心情影响语气；工具 get_mood / set_mood / mood_log
- **v2.2 唤醒时段权重**：按作息习惯（复用 suggest_quiet 的发言样本）调整唤醒概率
- **v2.3 话题延续**：从最近上下文提取「上次聊到的事」，唤醒时主动接上（不读无关隐私，仅用最近对话）

### 阶段三·有来有回（v2.4 ~ v2.6）
目标：能感知“你有没有理它”，并因此改变行为。
- **v2.4 唤醒后跟进**：没回应 → 隔段时间再试 / 换话题 / 主动收手（不再是 5 次一刀切）
- **v2.5 多对话/多角色**：一个插件服务多个角色卡或对话，各自独立配置（心情、话术、上限）
- **v2.6 回应质量反馈**：你回得积极 → 小幅上调；冷淡 → 自动降低频率（避免刷屏）

### 阶段四·可观测与生态（v2.7+）
- **统计面板**：x/y 曲线、唤醒次数、回应率、心情曲线
- **API 生态**：其它插件/工作流可读写心情、查询状态、触发唤醒（已有一半）
- **配置云同步**（跨设备）· **多语言话术库**

### 依赖关系
- 阶段三的「跟进/反馈」依赖阶段二的「心情/权重」提供状态
- 阶段四的「统计」依赖前三阶段的事件数据（需要从现在就埋点）
- 多对话（v2.5）会影响心情/话术的存储结构 → 建议在 v2.5 前先把存储结构做成「按对话名索引」的可扩展形态

### 边界（明确不做）
- 不上传任何聊天内容到外部服务器
- 不依赖外部 AI 网关（旧 ai_gateway 已删除，不复活）
- 不改宿主行为、不抢其它插件入口
- 不做“聊天内容分析/画像”，只用消息时间与最近上下文

### 节奏
- 每个小版本一个主题，不做“大杂烩发布”
- 每个版本都要：可回滚（上一版目录保留）+ 可验收（工具级验证）
***

## 7. 已完成基线 · 提示词体系（v2.0.0 代码核实，2026-10-20）

> 本节记录的均已实现，作为后续版本的**不可回退基线**（新功能只能在此基础上叠加，不能破坏）

### 7.1 可自定义内容（9 项文本 + 2 项选择）
| # | 字段 | 用途 | 占位符 |
|---|---|---|---|
| 1 | prompt_manual_default | 手动触发·AI 自己发挥 | — |
| 2 | prompt_manual_prefix | 手动触发·自定义前缀 | {话术} |
| 3 | prompt_auto_default | 自动触发·AI 自己发挥 | {档位}{次数} |
| 4 | prompt_auto_prefix | 自动触发·自定义前缀 | {话术}{档位}{次数} |
| 5 | prompt_gentle | 温柔巡检通道 | — |
| 6 | prompt_stop | 置气消息 | {次数}{上限} |
| 7 | prompt_quiet_lifted | 静默解除通知 | {原因}{静默时段} |
| 8 | jealousy_tiers | 档位话术库（4 档 × N 条） | — |
| 9 | awake_messages | 话术库（随机抽） | — |
| 10 | awake_mode | default / custom | 选择项 |
| 11 | send_mode | A1 / A2 | 选择项 |

### 7.2 已实现的机制（代码级）
- **PROMPT_KEYS**（L466）：7 个字符串模板统一遍历校验 / 读写
- **pickPrompt**（L472）：空、非字符串 → 回落内置默认；超 2000 字截断
- **fillPrompt**（L480）：占位符替换；无对应值保留原样，不改写用户文本
- **buildTalkPrompt**（L492）：有 {话术} 就替换，没有就追加到末尾（兼容旧行为）
- **buildPrompt**（L498）：模板 + 变量填充
- **pickTierList**（L526）：按档位取话术库候选，越界回落最后一档
- **reset_prompts**（L1528）：一键恢复全部默认
- **prompt_customized**（L1657）：逐字段“是否改过”标记（UI 显示〔默认/已改〕）
- **isUsableTalk / pickUsableTalk**（L503/L514，v2.0.0）：占位/过短话术跳过；全部不可用回落 default

### 7.3 占位符总表（当前可用）
`{话术}` `{档位}` `{次数}` `{时间}` `{原因}` `{静默时段}` `{上限}`

### 7.4 面板能力（已实现）
- 提示词页 11 项分三组折叠（触发引导 4 / 特殊场景 3 / 话术与发送 4）
- 每格**预填当前生效文案**，并标注「何时用 · 可用占位符」
- 保存时 **baseline diff 跳过未改动字段**，不误标〔已改〕
- 读不到配置时**页面顶部显示原因 + 原始返回片段**（不静默）

### 7.5 后续版本约束（写死在计划里）
1. 新增提示词字段 → 必须同步：`DEFAULT_FORMULA` + `PROMPT_KEYS`（若为字符串模板）+ `update_formula` 白名单 + `get_formula` 返回 + 面板项
2. 新增占位符 → 必须在 `buildPrompt` / `buildTalkPrompt` 调用处传值，并同步面板说明
3. 不得回退：话术占位防护、baseline diff、读失败报错、默认值兜底
***

## 9. 三链状态机（源码事实，2026-10-20 核实）

> 位置：`packages/on_air.js` L138-147 注释；工作流节点 n1_* / n3_*

| 链 | 时机 | 干什么 |
|---|---|---|
| **1 号链** | 运行态·每分钟 | x +1 → 掷骰 → 命中转 2 号链 |
| **2 号链** | 命中时 | 发主动消息（AI 自由发挥 / 话术库） |
| **3 号链** | 空闲态·每 15 分钟 | 查日志 → 沉默超阈值 → enter_running 进运行态并挂起 3 号链 |

- **用户真正回复** → x 归零、3 号链恢复、回空闲态（1 号链内 check_activity 也会实时归零）
- **已有能力**：
  - `detectDeviceActivity()` (L1073)：信号①Operit 窗口打开 ②最近 10 分钟发过消息 —— **目前只用于静默解除**
  - `collectUserHourStats()` (L1819)：发言小时分布（suggest_quiet 用）
  - `max_wake_stops`：连续命中上限（默认 5）

**结论：沉默检测 / 回复归零 / 无回应停止 —— 均已存在，不重复做。**

## 10. v2.2.0 计划（重出）—— 在场感知

### 主题
发送前判断「主人现在是否可能在」，不在就**这次不发**。

### 改什么
1. `FIELD_SPEC` 加两行（享受 v2.1.0 重构红利，其余自动跟上）：
   - `presence_check: { type:"bool", group:"params", label:"在场感知", order:14 }`
2. `maybe_awake` 发送前：
   - `presence_check` 开启 且 `detectDeviceActivity()` 返回 `active=false` → **返回 `skipped:"absent"`，不发消息、不加计数、不进冷却**
   - ⚠️ **只作用于自动触发**；`manual_awake`（手动点按钮）永不被跳过
3. 面板：参数页自动出现新开关（FIELD_SPEC 已驱动）

### 默认值
- **`presence_check: false`（默认关）** —— 因为 detectDeviceActivity 只有 2 个信号，可能误判；用户自行开启

### 验收
- `get_formula` 含 `presence_check`
- 关闭时：行为与 v2.1.0 完全一致（回归测试）
- 开启且不在场：`maybe_awake` 返回 `skipped:"absent"`，state 不变
- 开启且在场：正常掷骰

## 11. v2.2.1 计划 —— 时段权重
- `FIELD_SPEC` 加 `hour_weight_enabled: { type:"bool", default:false }`
- 用 `collectUserHourStats()` 生成 24 小时权重表（缓存到 state，避免每次算）
- `maybe_awake` 掷骰时：`y × 权重(0.5~1.5)`，限制在 0~100
- 默认关

## 12. 明确砍掉的提案
- ~~无回应自降~~ —— 与三链（1 号链持续掷骰）+ `max_wake_stops` 重复
- ~~心情系统（心情账本）~~ —— 主人认为方向不好，转备选

## 13. v2.1.1 / v2.1.2 实录（2026-10-20/24）

### v2.1.1（prompt_customized 与重置修正）
- **问题**：`reset_prompts` 原来是把 `DEFAULT_FORMULA` 的值**写回**字段 → 字段非空 → `prompt_customized` 永远显示〔已改〕
- **改法**：
  1. `reset_prompts` 改为 **清空字段**（`patch[KEY] = ""`、`jealousy_tiers = []`、`awake_messages = []`）
  2. `loadFormula` 新增 `_provided` 对象：记录**哪些字段是配置文件里显式存在的**
  3. `saveFormula` 新增过滤：以 `_` 开头的内部字段**不落盘**
  4. `prompt_customized` 改为 `_provided[pck] && 非空` → 重置后能正确变回〔默认〕
- 注：设备端可能因**宿主脚本缓存**仍返回旧值 → **需重启 Operit** 验证

### v2.1.2（删掉静默解除通知）
- **问题（坑71）**：静默时段内任何工具调用（increment_x/check_activity/roll_dice/maybe_awake/enter_running 共 5 处）会先跑 `detectDeviceActivity()`；而它的信号①`getChatId()` 非空 = **主人正开着对话窗口** → 误判为“设备活动” → `notifyQuietLifted()` → `sendToAi()` **把通知写成 user 消息并拉起整轮 AI 生成**
- **定性**：把“主人正在跟我说”误判为“沉默后设备活动”，在正常对话里插系统通知、白跑一轮生成
- **改法（主人选方案 A）**：**删掉 5 处 `notifyQuietLifted` 调用**（函数定义保留不调用）；提示词页**移除「7 静默解除通知」**项（字段保留以兼容老配置）
- **附带修复**：运行目录 `/plugins/on_air/src/` 里的 v1.8 旧源码会被宿主当成第二个包（`Duplicate package name`）→ 已挪到 `deprecated_packages/runtime_src_v18_20261024`

### 教训
1. **“内部状态变化”不要走对话通道**：会变成 AI 说的话，还会触发一整轮生成
2. 检测“设备活动”时，“对话窗口开着”≠“用户已从静默中醒来”
3. 改内部字段名（下划线开头）必须同步落盘过滤，否则污染 formula.json

## 14. v2.2.0 实录（已完成·2026-10-25）

**主题**：自动检查更新（方案 A 面板横幅）+ UI 规范化

| # | 改动 | 提交 |
|---|---|---|
| A | 3 页静默 catch 改报错 + 清理 quiet 重复状态 | e02d5e2 |
| B | 主页瘦身：7 卡 → 3 卡 | 6e42685 |
| C | 视觉细化：入口按钮轻量化、状态文字主色加粗 | 5713af6 |
| D1 | 后端更新检测：cmpVersion / fetchLatestRelease / check_update / download_update / skip_update | ffaf68b |
| D2 | 主页更新横幅（下载 / 稍后 / 跳过） | 963f277 |
| - | manifest 描述 + 打包 74109B/11 文件 | d8a7582 |

**发布**：git push main（2df08b7）+ tag v2.2.0；Release 与资产（74109B）走 code_runner REST；远端 13/13 文件 md5 SAME。
**坑**：坑72（/tmp 克隆正本消失）· 坑73（heredoc 后续命令被吞）
**下版必看**：`CURRENT_VERSION` 硬编码在 on_air.js，发版必须与 manifest.json 同步。


## 15. v2.2.1 实录（已完成·2026-10-25）

**主题**：更新检查重做 + 下载加固 + 面板白屏/联动修复（无功能删减）

### 一、更新检查
- 缓存里的 tag 比 `CURRENT_VERSION` 旧 → 自动失效重拉（发版后不再念旧版本）
- `check_update` 支持 `force`；主页底部新增「检查更新」按钮（doForceCheck）
- Release 正文清洗为纯文本：跳过 `#` 标题 / `>` 引用 / 分隔线，取前 6 行（上限 900 字）；空说明显示「该版本未写更新说明」
- `cmpVersion` 支持 `+build`（当第 4 段比较）
- 面板摘要显示行数 3 → 6

### 二、下载更新包
- 重试 3 次（2s/4s）；**404 不重试**、403 提示限流
- 用 `asset.size` 校验字节数，不符报「文件不完整」并删残包
- 原子写入：`.part` → 校验 → 删旧 → `Tools.Files.move` 改名
- ENOSPC / No space → 「磁盘空间不足」提示
- 面板下载前强制 `force:true` 刷新；显示「已下载 X KB → 路径」；下载中屏蔽重复点击

### 三、修复
- 提示词页白屏 ×2：`summary(it.val())` 对 `val:null` 项调用；`ctx.UI.Spacer` 运行时未实现（改 Box）
- 按钮共用 busy → 点一个整页变「…」：去掉文案绑定
- 免打扰页重复的「AI 静默建议」块 + 重复 `doSuggestQuiet` 定义

### 四、发布
- 本地 git：`d841d49`
- 远端：commit `a20f9542` + tag **v2.2.1** + Release + 资产 77491 B；远端 13/13 文件 md5 一致
- 设备：已装 v2.2.1（77491 B / 11 文件）

### 五、本轮坑（补充）
- 宿主**不支持 8 位 `#AARRGGBB` 做透明色**（被当不透明 → 淡色块变实心蓝、蓝底蓝字）
- `types` 里有 `Spacer`，但运行时未实现 → 用 `Box({height})`



## 16. v2.2.2 实录（进行中·2026-10-25）

开版：`/sdcard/x/on_air/v2.2.2/`（git ac0bf13），包 `releases/v2.2.2/com.operit.on_air-v2.2.2.toolpkg` 82067 B / 11 文件。

### 相对 v2.2.1（77978）修了什么
| 类别 | 内容 |
|---|---|
| 下载线路 | 改走 `api.github.com/repos/.../releases/assets/{id}` + `Accept: application/octet-stream`。实测 `github.com` 直连超时，`api.github.com` 200/5.5s，`objects.githubusercontent.com` 通 |
| 单请求 | 删除 probe 预下载，一个包只下一次（以前下两遍） |
| 假数字 | 删除 base64 累计进度，不再出现“76KB 的包显示 132KB” |
| 失败态 | 失败时 received 归零，不再“已下载100% + 下载失败”共存 |
| 幂等 | 文件已存在且字节数一致 → 直接返回“已存在”，连点/重开都不重下 |
| 版本显示 | 面板标题与底部读真实 `CURRENT_VERSION`（之前写死 2.2.1，误导） |
| 恢复 | 下载状态恢复块移到 `alreadyInited` 判断外，重开面板能看到进行中 |
| 轮询 | `startPollOnce` 单例，避免多个 600ms 循环互盖 |
| 超时 | 45s / 重试 2 次；连接类错误转人话“连不上 GitHub（网络/代理）” |
| 删功能 | `install_package` / `open_package` / `import_package` 全部移除（不自己做安装） |

### 已验证
- 真机：`download_update` 走新线路一次成功 77978 B（attempts=1）
- 真机：文件已存在时返回「更新包已存在（76 KB），不用重复下载」

### 待办
1. 推送 GitHub（commit + tag v2.2.2 + Release + 资产）—— 等主人发话
2. Issue #1 市场文案（中英描述去技术化，贴仓库链接）
3. 面板配色是否重做（主人曾经说“算了撤销”）


## 17. 版本号收叙（2026-10-25）

- GitHub 上 `2.2.1+1`（Beta，80645 B）对应旧的「2.2.2 修复集」，已改名
- 本地 `2.2.1+2`（当前开发版）是后续所有修复的归宿，未推送
- `v2.1.1` / `v2.1.3` / `v2.2.0+2` 为本地内部版本，从未发布
- `prompt_quiet_lifted`（第7项）已从面板移除，字段保留兼容；`notifyQuietLifted` 按计划保留不调用


## 18. v2.2.1+2 实录（2026-10-25 夜）

**目录**：`/sdcard/x/on_air/2.2.1+2/`（原 v2.2.2 改名）　**包**：83464 B / 11 文件
**git**：e8b2c4b（两轮审计修复）→ 9103500（工作流+文档）→ 3c81ca8（UI 拍平）→ 2e3d902（撤销误写归档）

### 一、下载（审计 DL 组）
- `__dlRunning` 模块级单例 + 整段 try/finally；10 分钟自愈；连点只跑一次
- 判死 5→10 分钟且执行中不判死；忙等加 250 次上限；失败返回带 `busy:false/status/reason`
- UI：轮询改模块级 `__dlPolling` + 代数令牌 `__dlPollGen`；`applyDl` 内容相同不 set；本地状态空时先问后端
### 二、多对话（审计 N 组）
- 每对话各自算沉默/冷却/未命中（`state.chat_meta[chatId]`）；爆表后 break
- 外层全局冷却不拦多对话；静默期活动检测只查当前对话
- 角色卡入口从面板移除，`character_card_name` 清空

### 三、配置校验
- N1 落盘剔除 `_provided`；N14 a/c/cooldown 允许 0；N2 话术误判修正

### 四、工作流
- 阈值去硬编码；trigger 字段类型修正；手动链重构 `n1_manual → n1_mrun → n1_awake`

### 五、UI
- 参数页只剩冷却 / 停止上限 / 目标对话（多选）；标签色提亮；onClick 返回 Promise
- UI 文件拍平：`ui/<名>/index.ui.js` → `ui/<名>.ui.js`，main.js require 同步

### 六、清理
- 删 partialJealousyScore / seen2 / 6 份 wa() / 12 个 do* / history / 未用 tierIndex
- 保留（计划内）：`notifyQuietLifted`、`ToolPkg._m`

### 七、文档
- README 中英：版本号→2.2.1+2、删 ai_gateway、API 表补 7 个工具

### 待验证（真机）
1. 下载：成功后再点一次应回「已存在」，不是「正在下载中（已进行 X 秒）」
2. 参数页：目标对话点一次就勾上
3. 手动触发：空闲态也能真发出消息

## 19. v2.2.2 实录（2026-10-26）

### 零、基本信息

- 版本：**2.2.2**（manifest / VERSION.txt / 代码常量 三处一致）
- 开发目录：`/sdcard/x/on_air/v2.2.2/`（2026-10-26 改名，原 2.2.1+2）
- 产物：`releases/v2.2.2/com.operit.on_air-2.2.2.toolpkg`，83880 B，11 文件
- 提交：363a96b（功能）→ 6b24e3a（提示）→ a38a7d7（样式）→ 387a3e1（刷新重做）

### 一、节假日表换源（真 bug）

- 旧源 `timor.tech` 已被 Cloudflare 拦截，返回 HTML 挑战页 → JSON 解析必失败 → 永远只用内置 2026 表
- 改：NateScarlet/holiday-cn 静态 JSON，三路镜像依次尝试（fastly.jsdelivr → gcore.jsdelivr → ghproxy.net）
- 只取 `isOffDay===true` 的 `date`；年份 = 当年 + 次年
- 面板显示分年计数：「2026 年 N 天 · 2027 年 0 天（官方尚未公布）」
- 事实：2027.json 存在但放假天数为 0，国务院未公布，不造假

### 二、日期页交互

- 点日历提示语用**本次写入结果**判断，不再读返回值里的 quiet_dates（不同步导致提示反了）
- 文案：「已开启 / 已关闭 YYYY-MM-DD 的全天静默」
- 「立即更新节假日表」文案用专用 `holBusy`，不再跟着整页 busy 串台

### 三、UI 统一

- 色板：标题/正文 onSurface、次要 onSurfaceVariant、强调 primary、按钮字 onPrimary、边框 outlineVariant
- 修：params 主按钮字色写成 surfaceVariant（浅字压主色底，几乎看不见）3 处
- 卡片底统一 `cardBg = surfaceVariant`（原 cardBg / innerBg / surfaceVariant / C.soft 四种混用）
- 次要按钮全部加 `border: { width:1, color: outlineVariant }`（主页9 / 参数1 / 日期2 / 免打扰2 / 控制台2 / 提示词4）
- 删重复：右上角「刷新」删掉，保留左下「刷新状态」

### 四、主页刷新（重点·踩坑见六）

- 最终方案：在 `onLoad`（action 分发期）内做 `for(40){ await sleepMs(3000); await refresh(); }`，约 2 分钟
- 另加模块级缓存 `__xyCache`：`st`/`fm` 初值取缓存，`loading` 初值 `!__xyCache.st`，页面重建不再出现「未加载」闪断
- 保底：左下「刷新状态」按钮随时手动拉

### 五、提示与反馈

- 后端 helper `notifyUser(msg, title)`：`Tools.System.toast` + 可选 `sendNotification`
- 覆盖：保存参数（已保存：xxx）、节假日拉取成败、手动触发成败（带通知）、下载开始/完成/失败
- 前端主页 `showMsg` 同步 `ctx.showToast`

### 六、踩坑：compose_dsl 异步 setState 不重绘

- 现象：轮询/定时器里 setState，数据变了画面不动
- 根因（skill 源码级）：UI 树只在「初始渲染 / action 分发 / 文本输入 / 平台 rerender」时重建；异步回调里的 setState 只写 stateStore，无订阅者即丢弃
- 错法：render 里判断刷新（被丢）、setInterval 里 refresh（不重绘）
- 正法：把周期刷新放进 `onLoad` 体内（onLoad 期间订阅 stateChange，setState 能触发中间渲染）
- 同理：手势滑回子页不跑 onLoad，所以刷不靠“返回事件”，靠 onLoad 内的长驻循环

### 七、删除

- 「生成建议」「生成并应用」：免打扰页整块 + 控制台页一行 + 两处函数（约 3 KB）
- 免打扰页 onPrimary 未定义导致白屏（本轮自己改出的回归，已修）

### 待办

1. 版本号仍写死在代码常量，应改为运行时读 manifest.version（打包时已三处同步，未根治）
2. 2.2.2 未推 GitHub（tag / Release / 资产）
3. 开发目录已改名 `v2.2.2/`，releases 同步为 `v2.2.2/`、`v2.2.1+2/`（已完成）
4. 无头“自动安装”能力：宿主无文件安装 API，只能下载后手动导入


### 八、发布（2026-10-26）

| 项 | 值 |
|---|---|
| GitHub commit | 4bb2cc3c |
| tag | v2.2.2 |
| Release | on_air 2.2.2（正式，prerelease=false） |
| 资产 | com.operit.on_air-2.2.2.toolpkg 83582 B |
| md5 | `36ae7e57c56893421729d51d78e5f648`（11 文件） |
| 验收 | 远端 16 文件与本地逐个 sha 一致，无多无少 |
| 文案 | 885 字：总述 + 【新增】【优化】【修复】【调整】+【升级方式】 |

### 九、文案规范（本次新定）

- GitHub Release：一句总述讲清“这版在干什么”，再分四组；每条一行、写用户能感知的变化，不写内部实现
- 市场（Operit 市场）版本说明：纯用户视角、无技术细节、600 字内、8 条左右；**不要直接贴 GitHub 那份**（市场不渲染代码块，技术细节会糊成一坨）
- 两份文案的位置：`/sdcard/x/tmp/v2.2.2-release.md`（已推 GitHub）、`/sdcard/x/tmp/v2.2.2-market.md`（市场用）
- 教训：v2.2.1+2、2.2.1+1 两个 Release 正文开头误写成「随机上线 v2.2.2（Beta）」，是复制粘贴没改版本号；以后发版先把标题与 tag 对一遍

### 十、记忆

- MCP 记忆已写：`xmemory/on-air/on_air v2.2.2 发布记录（2026-10-26）`

## 20. v2.2.2+1 实录：on_air.js 多文件拆分（2026-10-26 夜）

### 一、目标与背景
- `packages/on_air.js` 已 2904 行（实代码约 2511），单文件维护成本过高
- 前置实验（lab 包）已验证 ToolPkg 支持多文件 require，实验包已删

### 二、ToolPkg 多文件四条硬规则（实测确认）
| 规则 | 说明 |
|---|---|
| require 相对路径 | 相对**当前文件自身目录**：`packages/x.js` 写 `./y.js`，不是 `./packages/y.js` |
| METADATA | 只有子包入口文件需要，被 require 的模块不需要 |
| UI 注册 | `registerUiRoute` + `registerNavigationEntry` 两个都要，route 为 `toolpkg:<id>:ui:<route>` |
| 文件格式 | `.toolpkg` 即 zip 改名 |

### 三、目录与版本规矩（本轮确立）
- 开发目录只有一份：升版本用 `git mv` 改名，**不复制目录**
- `releases/` 只放 zip 产物，不当源码使用
- 版本四处一致：manifest.version / description.zh / description.en / VERSION.txt / CURRENT_VERSION
- 版本号带 v（市场审核要求），代码里不再拼第二个 v

### 四、拆分方案（六块）
| 文件 | 内容 | 预计行数 | 状态 |
|---|---|---|---|
| `on_air_update.js` | 常量 + cmpVersion + mdToPlain* + fetchLatestRelease + check_update / download_update / get_download_status / open_url / skip_update | ~370 | ✅ 完成 |
| `on_air_holidays.js` | 日历 + 节假日拉取（fetchHolidayYear / fetchHolidaysAll / fetch_holidays） | ~240 | 待做 |
| `on_air_config.js` | FIELD_SPEC 字段表 + 校验与类型转换 | ~425 | 待做 |
| `on_air_chat.js` | 多对话：每对话沉默/冷却/未命中 + 发送 + 平台兼容 | ~349 | 待做 |
| `on_air_prompts.js` | 提示词与占位符替换 | ~180 | 待做 |
| `on_air.js` | 入口 + 工具注册 + 其余 | 剩余 | 保留 |

### 五、拆分写法（统一工厂模式）
- 新模块导出 `createXxxModule(deps)`，deps 注入主文件私有函数（loadState / saveState / notifyUser 等）
- 模块内部工具从 `exports.x = async function` 改为 `var x = async function`，最后 `return { tools: {...} }`
- 主文件：`var X = createXxxModule({...})` + `exports.x = X.tools.x`
- 宿主全局（Tools / OkHttp / complete）不需要注入

### 六、第一块（update）执行结果
- 搬出范围：原 765-888 + 2625-2838
- 主文件 2904 → 2584 行（-320），工具数仍 24
- 包：`releases/v2.2.2+1/com.operit.on_air-v2.2.2+1.toolpkg` 84665 B / 13 文件

实测四项全部通过：
| 工具 | 结果 |
|---|---|
| get_xy | current_version = v2.2.2+1 |
| check_update | 「已是最新版本 v2.2.2+1」，本地 > 远端 v2.2.1+2 判定正确 |
| get_download_status | 正常返回 status / received / path |
| fetch_holidays | 33 个日期，联网成功 |

### 七、本轮踩坑
1. require 写包根路径 → `Cannot resolve module`
2. 按行号切代码块少切一行 → 主文件多 `}`、新文件少 `}`；切前必须 `sed -n 'a,bp' | cat -n` 看清首尾
3. 复制开发目录 → 应 `git mv`
4. 版本号自带 v 后代码又拼 v → 出现 `vv2.2.2+1`，已去掉拼接

### 八、验收清单（每块拆完都要做）
1. `node --check` 全部 js（含 ui）
2. 旧句消失 + 新句存在（双向校验）
3. `grep -c '^exports\.'` 工具数 == 24
4. 打包 → 安装 → 逐工具实测（不只看语法）

### 九、执行结果（全部完成）
| 文件 | 行数 | 状态 |
|---|---|---|
| `on_air.js` | 1901 | 完成（原 2904） |
| `on_air_update.js` | 369 | 完成 |
| `on_air_holidays.js` | 285 | 完成 |
| `on_air_chat.js` | 251 | 完成 |
| `on_air_config.js` | 173 | 完成 |
| `on_air_prompts.js` | 92 | 完成 |
| 合计 | 3071 | 工具数仍 24 |

六个文件全部 `node --check` 通过；装包后实测：

| 工具 | 结果 |
|---|---|
| get_xy | current_version = v2.2.2+1 |
| check_update | 「已是最新版本 v2.2.2+1」 |
| fetch_holidays | 33 个日期，联网成功 |
| update_formula | 字段校验正常，回写成功 |
| get_chats | 16 个对话 |
| compute_y | y=0%（x=0, f=0） |

### 十、发布
| 项 | 值 |
|---|---|
| 包 | `releases/v2.2.2+1/com.operit.on_air-v2.2.2+1.toolpkg` 89724 B / 17 文件 |
| md5 | 2f2109520b89595140383bf594904769 |
| 本地 commit | b19a573 |
| 远端 commit | 01a682eb |
| tag | v2.2.2+1 |
| Release 正文 | 1035 字（v2.2.2+1 拆分说明） |
| 资产 | com.operit.on_air-v2.2.2+1.toolpkg 89724 B |
| 远端文件 | 22 个，与本地逐个 sha 一致 |

### 十一、本轮新增踩坑
1. 拆块按行号切要动态定位：拆完一块后所有后续行号都会偏移，写死行号必错
2. 函数调用式依赖分析抓不到大写变量（如 DEFAULT_FORMULA），必须单独扫 `[A-Z][A-Z0-9_]{3,}`
3. GitHub 上传资产时 name 里的 `+` 会被转义成 `.`（`-v2.2.2+1` → `-v2.2.2.1`），必须 `urllib.parse.quote(name, safe='')`
