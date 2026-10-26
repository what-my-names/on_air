/*
 * on_air_config.js — 字段规格表 + 默认公式 + 按规格校验
 * v2.2.2+1：从 on_air.js 拆出
 * 无外部依赖：纯数据 + 纯函数
 */
// ============ 默认公式参数 ============
// ===== v2.1.0：字段规格表 FIELD_SPEC =====
// 目的：一个字段的「类型 / 分组 / 面板标签 / 占位符 / 顺序」只在这里定义一次。
// 默认值仍以 DEFAULT_FORMULA 为唯一来源（不在这里重复，避免两处打架）。
// 后续新增字段：SPEC 加一行 + get/update 自动遍历，不再手抄 4 遍。
var FIELD_SPEC = {
    // ---- 公式 ----
    a: { type: "number", group: "formula", label: "a 线性系数", min: 0, order: 1 },
    b: { type: "number", group: "formula", label: "b 幂项系数", min: 0, order: 2 },
    c: { type: "number", group: "formula", label: "c 幂指数", min: 0, order: 3 },
    // ---- 基础参数 ----
    idle_threshold_minutes: { type: "number", group: "params", label: "沉默阈值（分钟）", min: 1, int: true, order: 10 },
    cooldown_minutes: { type: "number", group: "params", label: "唤醒后冷却（分钟）", min: 0, int: true, order: 11 },
    max_wake_stops: { type: "number", group: "params", label: "连续命中停止上限", min: 2, int: true, order: 12 },
    character_card_name: { type: "string", group: "params", label: "角色卡名字", order: 13 },
    // ---- 发送 ----
    send_mode: { type: "enum", group: "send", label: "发送方式", values: ["A1", "A2"], order: 20 },
    awake_mode: { type: "enum", group: "send", label: "话术模式", values: ["default", "custom"], order: 21 },
    // ---- 提示词 7 项 ----
    prompt_manual_default: { type: "prompt", group: "prompt", label: "1 手动触发·默认模式", slots: [], order: 30 },
    prompt_manual_prefix: { type: "prompt", group: "prompt", label: "2 手动触发·自定义前缀", slots: ["话术"], order: 31 },
    prompt_auto_default: { type: "prompt", group: "prompt", label: "3 自动触发·默认模式", slots: ["档位", "次数"], order: 32 },
    prompt_auto_prefix: { type: "prompt", group: "prompt", label: "4 自动触发·自定义前缀", slots: ["话术", "档位", "次数"], order: 33 },
    prompt_gentle: { type: "prompt", group: "prompt", label: "5 温柔巡检通道", slots: [], order: 34 },
    prompt_stop: { type: "prompt", group: "prompt", label: "6 置气消息", slots: ["次数", "上限"], order: 35 },
    prompt_quiet_lifted: { type: "prompt", group: "prompt", label: "7 静默解除通知", slots: ["原因", "静默时段"], order: 36 },
    // ---- 话术库 ----
    jealousy_tiers: { type: "tiers", group: "prompt", label: "8 档位话术库", order: 37 },
    awake_messages: { type: "lines", group: "prompt", label: "9 话术库", order: 38 },
    // ---- 静默 ----
    quiet_enabled: { type: "bool", group: "quiet", label: "静默总开关", order: 40 },
    quiet_day_enabled: { type: "bool", group: "quiet", label: "白天段开关", order: 41 },
    quiet_night_enabled: { type: "bool", group: "quiet", label: "夜间段开关", order: 42 },
    quiet_day_start: { type: "time", group: "quiet", label: "白天段开始", order: 43 },
    quiet_day_end: { type: "time", group: "quiet", label: "白天段结束", order: 44 },
    quiet_night_start: { type: "time", group: "quiet", label: "夜间段开始", order: 45 },
    quiet_night_end: { type: "time", group: "quiet", label: "夜间段结束", order: 46 },
    quiet_dates: { type: "date_map", group: "dates", label: "全天静默日", order: 50 },
    school_day_auto_quiet: { type: "bool", group: "dates", label: "上学日自动静默", order: 51 },
    student_mode: { type: "bool", group: "dates", label: "学生模式", order: 52 },
    date_quiet_enabled: { type: "bool", group: "dates", label: "日期静默总开关", order: 53 },
    // ---- 内部字段（不接受用户修改、不上面板）----
    chat_id: { type: "internal", order: 90 },
    chat_ids: { type: "internal", order: 92 },
    chat_id_source: { type: "internal", order: 91 },
    prompt_customized: { type: "internal", order: 92 },
    quiet_suggest: { type: "internal", order: 93 },
    holiday_dates: { type: "internal", order: 94 },
    holiday_fetch_date: { type: "internal", order: 95 },
    skipped_version: { type: "internal", order: 96 }
};

// 按 SPEC 取某个分组下、按 order 排序的字段名
function specKeysOfGroup(group) {
    var arr = [];
    for (var k in FIELD_SPEC) {
        if (FIELD_SPEC[k].group === group) arr.push(k);
    }
    arr.sort(function (x, y) { return (FIELD_SPEC[x].order || 0) - (FIELD_SPEC[y].order || 0); });
    return arr;
}

var DEFAULT_FORMULA = {
    a: 0.007078203,                 // 线性系数：f = a*x + b*x^c
    b: 6.00914e-07,                 // 幂项系数：f = a*x + b*x^c
    c: 3.15168,                     // 幂指数：f = a*x + b*x^c
    idle_threshold_minutes: 10,     // 沉默阈值（锁定版：10分钟窗口）：用户超过10分钟没说话就启动x累加
    cooldown_minutes: 15,           // 冷却分钟数(预留)
    awake_mode: "default",          // 话术模式：default=唤醒AI自己发挥(带最近上下文，无需API) / custom=用本地自定义话术库
    send_mode: "A1",                // 发送通道：A1=on_air 自己唤醒 AI（默认）/ A2=借温柔巡检的自动回复通道（未装温柔巡检时自动回落 A1）
    // 说明：A1为默认。诉求"要AI自己主动发，而不是让工作流(作为用户端)发"。
    // A1 = maybe_awake 内部用 sendToAi(Tools.Chat.sendMessage, 带 hide_user_message:true + persist_turn:true)直接唤醒AI发言。
    max_wake_stops: 5,              // 连续命中主动消息停止上限：第N次命中计数爆表停止主动消息(默认5；装有温柔巡检时面板可改为4给温柔巡检让位)
    chat_id: "",                    // 目标对话ID（首次使用需配置；可在面板或 formula.json 中填写）
    chat_ids: [],                    // 目标对话ID列表（空=当前对话；可多选，多个对话都会收到主动消息）
    skipped_version: "",             // v2.2.0：用户选择“跳过此版本”时记录的 tag
    character_card_name: "",        // 角色卡名：唤醒时按名字定位角色卡（留空=跟随当前对话绑定的角色卡）
    awake_messages: [               // 主动话术：AI自由发挥的起点提示
        "想你了，你现在在忙吗？",
        "好久没听到你的消息了，有点惦记你",
        "突然想到你，就来找你聊天了",
        "你在干嘛呀？今天过得怎么样？",
        "忙完了吗？有空聊两句吗？"
    ],
    // ===== v1.9.0 可自定义提示词（8 处）：默认值 = 旧版硬编码原文，保证老用户行为不变 =====
    // 占位符（可选）：{档位} {次数} {话术} {时间}；不写占位符也能直接用
    prompt_manual_default: "（主动消息·内部提醒）请以你自己的身份，结合最近 3~5 轮聊天上下文，用中文给用户发一句自然的主动问候（20~60 字）。\n要求：\n1）像一个真实的人突然想起对方那样开口，可带一点具体细节（比如上次聊到的事、此刻的时间感）；\n2）不要用「在吗」「你好」这类通用开场，也不要每次都同一句式；\n3）不要提及触发、唤醒、提醒、插件、系统等任何机制性内容，不要暴露这是一条被安排的消息；\n4）只输出要发送的那一句话本身，不加解释、不加引号。",
    prompt_manual_prefix: "（主动消息·内部提醒）下面这句话是你想对用户说的话（底稿），请以你自己的身份自然地把它说出来：{话术}\n\n【要求】\n1）可以润色措词让它更像你平时说话，但不要改变原意、不要增加新信息；\n2）中文，20~60 字，只输出这一句话本身；\n3）不要复述、不要引用、不要说「我收到的是…」「有人说…」之类的话；\n4）如果这句话不像一句能对用户说的自然话（例如只是标记、占位或空内容），就改用你自己的话自然开口，绝不要把它原样念出来。",
    prompt_auto_default: "（主动消息·内部提醒）请以你自己的身份，结合最近聊天上下文，用中文给用户发一句自然的主动消息（20~60 字）。\n当前状态：这是你第 {档位} 次主动找他（已累计 {次数} 次）。\n要求：\n1）语气贴合档位：第 1 档像随口想起，越往后可以越带一点委屈和在意；\n2）不要重复上一条说过的话，不要用「在吗」这类通用开场；\n3）不要提及触发、唤醒、提醒、插件、系统等任何机制性内容；\n4）只输出要发送的那一句话本身。",
    prompt_auto_prefix: "（主动消息·内部提醒）下面这句话是你想对用户说的话（底稿），请以你自己的身份自然地把它说出来：{话术}\n\n【要求】\n1）可润色不改原意；中文 20~60 字；只输出这一句；\n2）当前是你第 {档位} 次主动找他（累计 {次数} 次），语气可以贴合这个程度；\n3）不要复述、不要引用、不要说「我收到的是…」；\n4）不像自然话（标记、占位、空内容）就用自己的话开口，绝不原样念出。",
    prompt_gentle: "（主动消息·内部提醒）请以你自己的身份，结合最近聊天上下文，用中文给用户发一句自然的主动消息（20~60 字）。\n要求：\n1）语气里带一点惦记和轻轻的醋意，但要自然、不审问、不指责；\n2）可以问一句具体的事（比如「刚刚在忙什么呀」），不要泛泛而谈；\n3）不要提及触发、唤醒、提醒、巡检、插件等任何机制性内容；\n4）只输出要发送的那一句话本身。",
    prompt_stop: "我已经主动找了你 {次数} 次啦，一条回应都没等到……说实话有点难过，也有点小委屈，但还是想再问一句：你现在方便理我一下吗？",
    prompt_quiet_lifted: "静默解除通知：{原因}。{静默时段}检测到设备活动，已临时解除静默，本轮恢复正常计算与唤醒。",
    jealousy_tiers: [
        ["想你了，你在忙什么呀？", "有空吗？陪我聊聊天好不好？"],
        ["又不理我，是不是在忙别的？我有点失落了", "都不回我消息，我可要闹了！"],
        ["都找你好几次啦还不够吗……你再不回应，我可真的要伤心了", "我的耐心快用完了，你理理我好不好嘛……"],
        ["第{次数}次了！你再不理我，我就不主动找你了～", "你到底在忙什么呀！我都急得团团转了，快理理我！"]
    ],
    // ===== 静默状态（免打扰）：静默时段内停止 x 累加、掷骰与主动唤醒，避免睡觉/上课时被计算打扰 =====
    // 支持两段自定义静默区间：白天段 + 夜间段（都可跨天，如夜间 22:00~09:00）
    // 静默中若检测到设备活动（打开 Operit 窗口 / 主人发消息）会立即解除静默并主动告知。
quiet_enabled: false,           // 静默总开关：true=启用静默时段
     quiet_day_enabled: true,        // 白天段独立开关：假期白天全天在线时可单独关掉白天静默
     quiet_night_enabled: true,      // 夜间段独立开关：可单独关掉夜间静默
     quiet_day_start: "09:00",       // 白天段开始 HH:MM（默认备注：适配白天黑夜倒班人群白天补觉；也可自定义为自己的上课/工作时间段）
    quiet_day_end: "18:00",         // 白天段结束 HH:MM（默认18点）
    quiet_night_start: "22:00",     // 夜间段开始 HH:MM（默认晚上10点）
    quiet_night_end: "09:00",       // 夜间段结束 HH:MM（默认早上9点，跨天区间）
    // 旧字段兼容：quiet_start/quiet_end 读取时映射到夜间段（新版本不再使用）
    // AI 智能建议：suggest_quiet 工具生成的结果（含建议区间、理由、生成时间），面板可显示并一键应用
    quiet_suggest: null,
    // ===== 日历与节假日（v1.5.8 起 / v1.6.10 起逻辑反转 / v1.7.11 起学生模式+总开关）=====
    quiet_dates: {},                 // 用户点选的全天静默日：{ "YYYY-MM-DD": "full" }（任意日期都可点选；硬静默不因设备活动解除）
    school_day_auto_quiet: false,    // 上学日自动静默：开启后普通日（非节假日、非周六周日、非寒暑假）自动全天硬静默
    student_mode: true,              // 学生模式：开启=寒暑假算特殊日（保持彩色不静默）；关闭=成年人模式，寒暑假按普通日处理
    date_quiet_enabled: true,        // 日期静默总开关：关闭后点选静默日与上学日自动静默全部失效
    holiday_dates: [],               // 已获取的节假日日期列表 ["YYYY-MM-DD", ...]（内置2026年中国法定节假日兜底，联网成功后可更新）
    holiday_fetch_date: ""           // 上次联网拉取节假日的日期 YYYY-MM-DD（每天12点后只拉一次，防重复）
};
// ===== v2.1.0：按 FIELD_SPEC 做类型校验/转换（新增字段自动生效）=====
function validateBySpec(key, spec, raw) {
    var t = spec.type;
    if (t === "number") {
        var n = parseFloat(raw);
        if (isNaN(n)) return { ok: false, msg: key + " 需要是数字" };
        if (spec.min !== undefined && n < spec.min) return { ok: false, msg: key + " 不能小于 " + spec.min };
        if (spec.int && Math.floor(n) !== n) return { ok: false, msg: key + " 需要是整数" };
        return { ok: true, value: n };
    }
    if (t === "bool") {
        var bv = raw;
        if (typeof bv === "string") bv = (bv === "true" || bv === "1" || bv === "on");
        if (typeof bv !== "boolean") return { ok: false, msg: key + " 需要是 true/false" };
        return { ok: true, value: bv };
    }
    if (t === "enum") {
        var ev = String(raw);
        if (spec.values && spec.values.indexOf(ev) < 0) return { ok: false, msg: key + " 只能是 " + spec.values.join(" / ") };
        return { ok: true, value: ev };
    }
    if (t === "time") {
        var tv = String(raw).trim();
        if (!/^\d{1,2}:\d{2}$/.test(tv)) return { ok: false, msg: key + " 需要 HH:MM 格式" };
        return { ok: true, value: tv };
    }
    if (t === "prompt") {
        var pv = String(raw);
        if (pv.length > 2000) return { ok: false, msg: key + " 超过 2000 字" };
        return { ok: true, value: pv };
    }
    if (t === "lines" || t === "tiers") {
        var arr = raw;
        if (typeof raw === "string") {
            try { arr = JSON.parse(raw); } catch (e) { return { ok: false, msg: key + " 需要是 JSON 数组" }; }
        }
        if (!Array.isArray(arr)) return { ok: false, msg: key + " 需要是数组" };
        return { ok: true, value: arr };
    }
    if (t === "string") return { ok: true, value: String(raw) };
    return { ok: false, msg: key + " 类型不支持" };
}
module.exports = {
    FIELD_SPEC: FIELD_SPEC,
    specKeysOfGroup: specKeysOfGroup,
    DEFAULT_FORMULA: DEFAULT_FORMULA,
    validateBySpec: validateBySpec
};
