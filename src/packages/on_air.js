/*
METADATA
{
    "name": "on_air",
    "display_name": {
        "zh": "随机上线",
        "en": "On Air"
    },
    "description": {
        "zh": "随机上线：装成真人的 Operit AI 插件。你沉默得越久，它上线的概率就越高，会在随机时间主动来找你说话。v1.2 静默时段；v1.3 作息样本统计；v1.4 日夜静默独立开关；v1.5 内置日历与节假日；v1.6 静默逻辑反转；v1.7 学生模式与日期级静默。",
        "en": "On Air: an Operit AI plugin that pretends to be a real person. The longer you stay silent, the higher the chance it comes online and reaches out. v1.2 quiet periods; v1.3 schedule sample stats; v1.4 independent day/night quiet; v1.5 built-in calendar & holidays; v1.6 quiet logic reversed; v1.7 student mode & date quiet."
    },
    "enabledByDefault": true,
    "category": "COMPANION",
    "tools": [
        {
            "name": "get_xy",
            "description": { "zh": "读取当前随机连状态：x(累计分钟)、y(当前概率值)、miss_count、cooldown、公式参数", "en": "Read state: x, y, miss_count, cooldown, formula" },
            "parameters": []
        },
        {
            "name": "compute_y",
            "description": { "zh": "按公式 y=100*f/(1+f) 计算y，其中 f=a*x+b*x^c", "en": "Compute y = 100*f/(1+f) where f=a*x+b*x^c" },
            "parameters": [ { "name": "x", "type": "number", "description": "当前x值(可选,缺省用状态里的x)", "required": false } ]
        },
        {
            "name": "set_x",
            "description": { "zh": "手动设置x值，用于调试或恢复现场", "en": "Manually set x" },
            "parameters": [ { "name": "x", "type": "number", "description": "要设置的x值", "required": true } ]
        },
        {
            "name": "increment_x",
            "description": { "zh": "将x累加1，运行态每分钟调用一次", "en": "Increment x by 1" },
            "parameters": []
        },
        {
            "name": "check_activity",
            "description": { "zh": "检查用户最后一次说话时间（实时读对话），返回 last_user_ts 和 minutes_since。用户在阈值内曾说话则清除计数（jealousy_count / jealousy_stopped 清零）", "en": "Check owner's last speaking time" },
            "parameters": [ { "name": "threshold_minutes", "type": "number", "description": "沉默阈值分钟数(可选)", "required": false } ]
        },
        {
            "name": "roll_dice",
            "description": { "zh": "按当前y为概率掷骰，roll<=y*10 判为命中触发主动消息", "en": "Roll a die with current y probability" },
            "parameters": []
        },
        {
            "name": "manual_awake",
            "description": { "zh": "手动触发一次主动消息：立即发送一次唤醒消息（不等AI回复完成）", "en": "Manually trigger a call" },
            "parameters": []
        },
        {
            "name": "coax",
            "description": { "zh": "安抚/重置计数：复位x、连续未命中与嫉妒计数(jealousy_count/jealousy_stopped)，并联动温柔巡检回落", "en": "Coax/reset counters: reset x, miss_count and jealousy, and link gentle guardian" },
            "parameters": []
        },
         {
             "name": "reset_cooldown",
             "description": { "zh": "手动重置/设置冷却时间：minutes>0 设置N分钟后结束冷却；minutes<=0 立即清除冷却", "en": "Reset/set cooldown: minutes>0 sets until N minutes later; minutes<=0 clears immediately" },
             "parameters": [ { "name": "minutes", "type": "number", "description": "冷却时长(分钟)，传0或负数立即清除冷却", "required": true } ]
         },
        {
            "name": "update_formula",
             "description": { "zh": "更新公式参数，可改a、b、c、idle_threshold_minutes、cooldown_minutes、主动话术、发送方式等", "en": "Update formula params" },
"parameters": [
                 { "name": "a", "type": "number", "description": "线性系数a（f=a*x+b*x^c）", "required": false },
                 { "name": "b", "type": "number", "description": "幂项系数b（f=a*x+b*x^c）", "required": false },
                 { "name": "c", "type": "number", "description": "幂指数c（f=a*x+b*x^c）", "required": false },
                 { "name": "idle_threshold_minutes", "type": "number", "description": "沉默阈值", "required": false },
                 { "name": "cooldown_minutes", "type": "number", "description": "冷却分钟数", "required": false },
                 { "name": "awake_messages", "type": "string", "description": "主动消息话术数组(json字符串)", "required": false },
                 { "name": "send_mode", "type": "string", "description": "主动消息投递方式：A1=工具内唤醒落正文不弹(AI自己主动发) / A2=工具内AI主动发落正文不弹(默认)，仅支持 A1/A2", "required": false },
                 { "name": "awake_mode", "type": "string", "description": "话术模式：default=唤醒AI自己发挥(带上下文) / custom=用本地自定义话术库", "required": false },
                 { "name": "max_wake_stops", "type": "number", "description": "连续命中主动消息停止上限(默认5；装有温柔巡检时可改为4给温柔巡检让位)", "required": false },
                 { "name": "character_card_name", "type": "string", "description": "角色卡名字：唤醒时按名字定位角色卡（留空=跟随当前对话绑定的角色卡）", "required": false },
                  { "name": "quiet_dates", "type": "string", "description": "全天静默日映射(json字符串，如 {\"2026-08-18\":\"full\"})：任意日期都可点选为全天静默(硬静默不因设备活动解除)", "required": false },
                  { "name": "school_day_auto_quiet", "type": "boolean", "description": "上学日自动静默：true=普通日(非节假日、非周六周日、学生模式下非寒暑假)自动全天硬静默", "required": false },
                  { "name": "student_mode", "type": "boolean", "description": "学生模式：true=寒暑假算特殊日(保持彩色)；false=成年人模式，寒暑假按普通日处理", "required": false },
                  { "name": "date_quiet_enabled", "type": "boolean", "description": "日期静默总开关：true=点选静默日与上学日自动静默生效；false=全部日期级静默失效", "required": false }
             ]
        },
        {
            "name": "get_formula",
            "description": { "zh": "读取当前公式和相关可配置参数", "en": "Read current formula" },
            "parameters": []
        },
        {
            "name": "maybe_awake",
            "description": { "zh": "运行态核心：按y掷骰，命中才真正发主动消息(未命中静默)，含冷却判断。连续命中会累加计数(jealousy_count)，按档位1-4递增语气，达到上限停止主动消息并发送一条置气消息", "en": "Running core: roll, only hit sends call" },
            "parameters": []
        },
        {
            "name": "enter_running",
            "description": { "zh": "由3号链在检测到沉默超阈值时调用，进入运行态并启动x累加", "en": "Enter running state" },
            "parameters": []
        },
        {
            "name": "suggest_quiet",
            "description": { "zh": "AI/本地算法结合时间与用户习惯，总结建议的静默时间区间（白天段+夜间段），返回建议与理由；apply=true 时一键应用并开启静默。可传 chat_name（对话名字，按名字查对话）或 chat_id 指定要分析的聊天记录（只读消息时间，不读内容）", "en": "Suggest quiet time ranges based on time & user habits; apply=true to apply and enable. Optional chat_name (resolve chat by name) or chat_id selects which chat history to analyze (timestamps only)" },
            "parameters": [
                { "name": "apply", "type": "boolean", "description": "是否直接应用建议并开启静默（默认 false 仅生成建议）", "required": false },
                { "name": "chat_name", "type": "string", "description": "要分析的对话名字（可选，按名字反查对话ID；与 chat_id 二选一，优先用名字）", "required": false },
                { "name": "chat_id", "type": "string", "description": "要分析的聊天记录所在对话ID（可选，默认用已配置的目标对话；没传名字时才用）", "required": false }
            ]
        },
        {
            "name": "link_agent",
            "description": { "zh": "按对话名字反查对话ID并保存为目标对话（不发送任何消息）。面板里填对话名字后点此按钮，无需再手动找对话ID", "en": "Resolve chat id by chat name and save as target chat (no message sent)" },
            "parameters": [
                { "name": "chat_name", "type": "string", "description": "对话的名字（如：猫娘）。按名字查找对应对话", "required": true }
            ]
        },
        {
            "name": "fetch_holidays",
            "description": { "zh": "立即联网拉取今年+明年法定节假日（普通HTTP请求，零token消耗），更新内置节假日表并记录拉取日期。平时每天12点后会自动拉一次，此工具供手动更新/调试", "en": "Manually fetch official holidays (this year + next) via plain HTTP, update built-in holiday list" },
            "parameters": []
        },
        {
            "name": "api_docs",
            "description": { "zh": "返回全部工具的 API 文档（名称、参数、返回格式、调用示例），供其他插件/工作流接入", "en": "Return full API docs of all tools for other plugins" },
            "parameters": []
        }
    ]
}
*/

/*
 * on_air — 随机上线系统的业务逻辑层
 *
 * 三链状态机（锁定版）：
 *   【空闲态】3号链每15分钟查一次日志：
 *       - 用户5分钟内说过话 -> 跳过，等下一个15分钟
 *       - 用户超5分钟没说话 -> 启动x累加、进入运行态并挂起3号链
 *   【运行态】1号链每分钟：
 *       - x = x + 1
 *       - y = 100 * f / (1 + f)，其中 f = a * x + b * x^c（y 就是概率，x趋近无穷y才趋近100%）
 *       - 以 y% 掷骰：命中则2号链发主动消息（AI自由发挥主动说话）
 *       - 没命中继续下一分钟；发了但用户没回 -> x继续累加、y继续升高、继续掷骰
 *       - 【用户真正回复】-> x归零、3号链恢复查日志、回空闲态
 *
 * SDK 约定（对齐 gentle_guardian）：
 *   - 工具用 exports.工具名 = async function(params){...} 定义
 *   - 用 complete({success, message, data}) 回调返回
 *   - 状态用 Tools.Files.read/write 持久化到插件目录
 *   - 工具被框架自动注册暴露，workflow 可直接调用 on_air:xxx
 */

// ============ 路径常量：全插件只定义这一次 ============
var BASE_DIR = "/sdcard/Download/Operit/plugins/on_air/";
var STATE_PATH = BASE_DIR + "state.json";
var FORMULA_PATH = BASE_DIR + "formula.json";

// ============ 默认状态 ============
var DEFAULT_STATE = {
    x: 0,               // 累计"用户没回复我"的分钟数
    miss_count: 0,      // 连续掷骰未命中次数
    last_hit_at: null,  // 上次主动消息命中时间(本地时间字符串)
    last_user_ts: null, // 用户最后一次说话时间(毫秒)
    running: false,     // 是否处于运行态(是否已启动x累加)
    started_at: null,   // 本次运行态开始时间
    cooldown_until: null, // 冷却结束时间(本地时间字符串)
    history: [],        // 最近触发记录
    jealousy_count: 0,  // 计数：连续命中主动消息次数(第一档1/第二档2/...达到上限爆表)
    jealousy_stopped: false // 是否已因计数爆表停止主动消息
};

// ============ 默认公式参数 ============
var DEFAULT_FORMULA = {
    a: 0.007078203,                 // 线性系数：f = a*x + b*x^c
    b: 6.00914e-07,                 // 幂项系数：f = a*x + b*x^c
    c: 3.15168,                     // 幂指数：f = a*x + b*x^c
    idle_threshold_minutes: 10,     // 沉默阈值（锁定版：10分钟窗口）：用户超过10分钟没说话就启动x累加
    cooldown_minutes: 15,           // 冷却分钟数(预留)
    awake_mode: "default",          // 话术模式：default=唤醒AI自己发挥(带最近上下文，无需API) / custom=用本地自定义话术库
    send_mode: "A1",                // 主动消息投递方式：A1=工具内唤醒落正文不弹(AI自己主动发、默认) / A2=工具内AI主动发落正文不弹，仅支持 A1/A2
    // 说明：A1为默认。诉求"要AI自己主动发，而不是让工作流(作为用户端)发"。
    // A1 = maybe_awake 内部用 sendToAi(Tools.Chat.sendMessage, 带 hide_user_message:true + persist_turn:true)直接唤醒AI发言。
    max_wake_stops: 5,              // 连续命中主动消息停止上限：第N次命中计数爆表停止主动消息(默认5；装有温柔巡检时面板可改为4给温柔巡检让位)
    chat_id: "",                    // 目标对话ID（首次使用需配置；可在面板或 formula.json 中填写）
    character_card_name: "",        // 角色卡名：唤醒时按名字定位角色卡（留空=跟随当前对话绑定的角色卡）
    awake_messages: [               // 主动话术：AI自由发挥的起点提示
        "想你了，你现在在忙吗？",
        "好久没听到你的消息了，有点惦记你",
        "突然想到你，就来找你聊天了",
        "你在干嘛呀？今天过得怎么样？",
        "忙完了吗？有空聊两句吗？"
    ],
    // ===== AI 网关：直调 DeepSeek 等 API 由 AI 自己决定怎么发消息/找话题/表达情绪 =====
    ai_gateway: {
        enabled: false,            // true=用 AI 自产话术(直调 API)；false=用本地话术库
        current_api: 0,            // 当前生效的 API 索引（apis 数组）
        apis: [                    // 多 API 列表，全部在面板填
            {
                name: "DeepSeek",                                     // API 名称
                base_url: "https://api.deepseek.com/v1",             // BaseURL（默认 deepseek）
                api_key: "",                                          // API Key（面板自己填）
                current_model: "deepseek-chat",                       // 当前选中的模型
                models: []                                            // 自动探测到的模型列表（填 key 后由 /models 接口拉取）
            }
        ]
    },
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

// ============ 时间工具：本地时间 ============
function localTime() {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " +
        pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
}

// ============ 静默状态工具 ============
// 解析 HH:MM 为"当日分钟数"(0~1439)；非法返回 null
function parseHm(s) {
    var m = String(s || "").trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    var h = parseInt(m[1], 10);
    var mi = parseInt(m[2], 10);
    if (h > 23 || mi > 59) return null;
    return h * 60 + mi;
}

// 判断某时刻是否落在区间内（支持跨天区间，如 22:00~09:00）；起止相同视为无效区间。
function inTimeRange(curMin, startMin, endMin) {
    if (startMin === null || endMin === null || startMin === endMin) return false;
    if (startMin < endMin) return curMin >= startMin && curMin < endMin; // 同一天内区间
    return curMin >= startMin || curMin < endMin;                         // 跨天区间（如22:00~09:00）
}

// ============ 日历与节假日工具（v1.5.8） ============
// 本地日期字符串工具
function pad2(n) { return (n < 10 ? "0" : "") + n; }
function dateStrOf(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
function todayStr() { return dateStrOf(new Date()); }

// 把 "YYYY-MM-DD"~"YYYY-MM-DD" 闭区间展开成日期数组（用于内置节假日表，代码里写区间更省事）
function expandDateRange(startStr, endStr) {
    var out = [];
    try {
        var a = new Date(parseInt(startStr.slice(0, 4), 10), parseInt(startStr.slice(5, 7), 10) - 1, parseInt(startStr.slice(8, 10), 10));
        var b = new Date(parseInt(endStr.slice(0, 4), 10), parseInt(endStr.slice(5, 7), 10) - 1, parseInt(endStr.slice(8, 10), 10));
        var t = new Date(a.getTime());
        while (t.getTime() <= b.getTime()) {
            out.push(dateStrOf(t));
            t = new Date(t.getTime() + 86400000);
        }
    } catch (e) {}
    return out;
}

// 内置2026年中国法定节假日（放假日期，国务院公布口径）。仅作离线兜底：
// 每天12点联网拉取成功后会以官方数据覆盖；网络失败时用它保证节假日静默可用。
var BUILTIN_HOLIDAY_RANGES_2026 = [
    ["2026-01-01", "2026-01-03"],  // 元旦
    ["2026-02-15", "2026-02-21"],  // 春节
    ["2026-04-04", "2026-04-06"],  // 清明节
    ["2026-05-01", "2026-05-05"],  // 劳动节
    ["2026-06-19", "2026-06-21"],  // 端午节
    ["2026-09-25", "2026-09-27"],  // 中秋节
    ["2026-10-01", "2026-10-07"]   // 国庆节
];
var BUILTIN_HOLIDAYS_2026 = [];
for (var _bi = 0; _bi < BUILTIN_HOLIDAY_RANGES_2026.length; _bi++) {
    BUILTIN_HOLIDAYS_2026 = BUILTIN_HOLIDAYS_2026.concat(expandDateRange(BUILTIN_HOLIDAY_RANGES_2026[_bi][0], BUILTIN_HOLIDAY_RANGES_2026[_bi][1]));
}

// 判断某日期是否在节假日列表里
function isHolidayDate(formula, dateStr) {
    try {
        var list = (formula && Array.isArray(formula.holiday_dates)) ? formula.holiday_dates : BUILTIN_HOLIDAYS_2026;
        return list.indexOf(dateStr) >= 0;
    } catch (e) {
        return false;
    }
}

// 周六/周日判断（周末与节假日同为特殊日）
function isWeekendDate(dateStr) {
    try {
        var p = String(dateStr).split("-");
        var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
        var w = d.getDay();
        return (w === 0 || w === 6);
    } catch (e) {
        return false;
    }
}

// 寒暑假判断：寒假 1/15~2/13，暑假 7/1~8/31（通用区间，每年自动生效）
function isSummerWinterDate(dateStr) {
    try {
        var p = String(dateStr).split("-");
        var m = parseInt(p[1], 10);
        var d = parseInt(p[2], 10);
        if (m === 7 || m === 8) return true;
        if (m === 1 && d >= 15) return true;
        if (m === 2 && d <= 13) return true;
        return false;
    } catch (e) {
        return false;
    }
}

// 特殊日（节假日/周六周日/学生模式下的寒暑假）：这些日子保持彩色
function isSpecialDay(formula, dateStr) {
    var sw = (formula && formula.student_mode === true) ? isSummerWinterDate(dateStr) : false;
    return isHolidayDate(formula, dateStr) || isWeekendDate(dateStr) || sw;
}

// 今天是否命中"日期级静默"（用户手动点选的全天静默日 / 上学日自动静默）。
// 任意日期都可手动点选静默；上学日自动静默只作用于普通日（特殊日保持彩色）。
// 总开关 date_quiet_enabled 关闭时全部日期级静默失效。
// 返回 { active:bool, kind:"manual"|"school", date:"YYYY-MM-DD" }；未命中返回 { active:false }。
function isDateQuiet(formula) {
    try {
        if (!formula || formula.quiet_enabled !== true) return { active: false };
        if (formula.date_quiet_enabled !== true) return { active: false };
        var today = todayStr();
        var special = isSpecialDay(formula, today);
        var qd = formula.quiet_dates;
        if (qd && typeof qd === "object" && qd[today] === "full") {
            return { active: true, kind: "manual", date: today };
        }
        if (formula.school_day_auto_quiet === true && !special) {
            return { active: true, kind: "school", date: today };
        }
        return { active: false };
    } catch (e) {
        return { active: false };
    }
}

// 当前是否处于静默时段（日期级静默 / 白天段 / 夜间段任一命中即可）。
// 日期级静默（全天静默日、节假日自动静默）优先级最高，且是硬静默。
// 支持两段自定义区间（白天 9-18、夜间 22-9），每段都支持跨天。
function isQuietTime(formula) {
    try {
        if (!formula || formula.quiet_enabled !== true) return false;
        // 日期级静默：用户点选的全天静默日 / 节假日自动静默
        if (isDateQuiet(formula).active) return true;
        var now = new Date();
        var cur = now.getHours() * 60 + now.getMinutes();
        // 每段有独立开关：白天段/夜间段可单独启用或停用（如假期白天全天在线，就关掉白天段）
        if (formula.quiet_day_enabled !== false && inTimeRange(cur, parseHm(formula.quiet_day_start), parseHm(formula.quiet_day_end))) return true;
        if (formula.quiet_night_enabled !== false && inTimeRange(cur, parseHm(formula.quiet_night_start), parseHm(formula.quiet_night_end))) return true;
        return false;
    } catch (e) {
        return false;
    }
}

// 当前命中的静默段描述（用于提示消息）；未命中返回空串。
function quietSegmentText(formula) {
    try {
        var dq = isDateQuiet(formula);
        if (dq.active) {
            return dq.kind === "manual" ? ("全天静默日 " + dq.date) : ("节假日静默 " + dq.date);
        }
        var now = new Date();
        var cur = now.getHours() * 60 + now.getMinutes();
        if (formula.quiet_day_enabled !== false && inTimeRange(cur, parseHm(formula.quiet_day_start), parseHm(formula.quiet_day_end))) {
            return "白天段 " + formula.quiet_day_start + "~" + formula.quiet_day_end;
        }
        if (formula.quiet_night_enabled !== false && inTimeRange(cur, parseHm(formula.quiet_night_start), parseHm(formula.quiet_night_end))) {
            return "夜间段 " + formula.quiet_night_start + "~" + formula.quiet_night_end;
        }
        return "";
    } catch (e) {
        return "";
    }
}

// ============ 文件读写helper（对齐 gentle_guardian 的 Tools.Files 兼容写法） ============
async function readJsonFile(path, fallback) {
    try {
        var raw = await Tools.Files.read(path);
        var content = typeof raw === "string" ? raw : (raw && (raw.content || (raw.data && raw.data.content))) || "";
        if (!content) return fallback;
        var parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") {
            parsed = JSON.parse(parsed[0]);
        }
        return parsed;
    } catch (e) {
        return fallback;
    }
}

async function writeJsonFile(path, obj) {
    try {
        await Tools.Files.write(path, JSON.stringify(obj, null, 2));
    } catch (e) {
        // 目录不存在时尝试创建（静默失败也没关系，兜底在下一行）
        try {
            await Tools.Files.mkdir(BASE_DIR);
            await Tools.Files.write(path, JSON.stringify(obj, null, 2));
        } catch (e2) {}
    }
}

// ============ 加载状态和公式 ============

// 探测 Operit 沙盒运行时注入的"当前窗口对话ID"。
// 平台给沙盒脚本注入了全局函数 getChatId()（内置包 plan_mode 同样直接调用），无当前窗口时返回 undefined/空。
// 用于 chat_id 免手动配置：公式里没填目标对话时，自动跟随当前打开的对话窗口。
function detectCurrentChatId() {
    try {
        if (typeof getChatId === "function") {
            var id = getChatId();
            if (id !== undefined && id !== null && String(id).trim()) {
                return String(id).trim();
            }
        }
    } catch (e) {}
    return "";
}

async function loadState() {
    var state = await readJsonFile(STATE_PATH, null);
    if (!state) state = {};
    // 兜底字段
    if (typeof state.x !== "number" || isNaN(state.x)) state.x = DEFAULT_STATE.x;
    if (typeof state.miss_count !== "number" || isNaN(state.miss_count)) state.miss_count = 0;
    if (!Array.isArray(state.history)) state.history = [];
    if (typeof state.running !== "boolean") state.running = DEFAULT_STATE.running;
    if (typeof state.jealousy_count !== "number" || isNaN(state.jealousy_count)) state.jealousy_count = 0;
    if (typeof state.jealousy_stopped !== "boolean") state.jealousy_stopped = false;
    return state;
}

async function saveState(state) {
    await writeJsonFile(STATE_PATH, state);
}

async function loadFormula() {
    var f = await readJsonFile(FORMULA_PATH, null);
    if (!f) return DEFAULT_FORMULA;
    var out = {};
    var k;
    for (k in DEFAULT_FORMULA) out[k] = DEFAULT_FORMULA[k];
    for (k in f) {
        if (f[k] !== undefined && f[k] !== null) out[k] = f[k];
    }
    // 保证数组
    if (!Array.isArray(out.awake_messages) || out.awake_messages.length === 0) {
        out.awake_messages = DEFAULT_FORMULA.awake_messages;
    }
    // 保证 send_mode 合法（仅 A1/A2，非法回退到默认 A1）
    if (out.send_mode !== "A1" && out.send_mode !== "A2") {
        out.send_mode = DEFAULT_FORMULA.send_mode;
    }
    // 保证 awake_mode 合法（default=AI自由发挥带上下文 / custom=本地话术库），非法回退 default
    if (out.awake_mode !== "default" && out.awake_mode !== "custom") {
        out.awake_mode = DEFAULT_FORMULA.awake_mode;
    }
    // 保证静默字段完整（两段式）+ 旧字段迁移
    if (typeof out.quiet_enabled !== "boolean") out.quiet_enabled = DEFAULT_FORMULA.quiet_enabled;
    if (typeof out.quiet_day_enabled !== "boolean") out.quiet_day_enabled = DEFAULT_FORMULA.quiet_day_enabled;
    if (typeof out.quiet_night_enabled !== "boolean") out.quiet_night_enabled = DEFAULT_FORMULA.quiet_night_enabled;
    // 旧版字段 quiet_start/quiet_end → 迁移到夜间段（仅当夜间段还是默认值时）
    var hasLegacyQs = typeof out.quiet_start === "string" && out.quiet_start.trim();
    var hasLegacyQe = typeof out.quiet_end === "string" && out.quiet_end.trim();
    var legacyStart = hasLegacyQs ? String(out.quiet_start).trim() : null;
    var legacyEnd = hasLegacyQe ? String(out.quiet_end).trim() : null;
    if ((!out.quiet_night_start || out.quiet_night_start === DEFAULT_FORMULA.quiet_night_start) && legacyStart) {
        out.quiet_night_start = legacyStart;
    }
    if ((!out.quiet_night_end || out.quiet_night_end === DEFAULT_FORMULA.quiet_night_end) && legacyEnd) {
        out.quiet_night_end = legacyEnd;
    }
    if (typeof out.quiet_day_start !== "string" || !out.quiet_day_start.trim()) out.quiet_day_start = DEFAULT_FORMULA.quiet_day_start;
    if (typeof out.quiet_day_end !== "string" || !out.quiet_day_end.trim()) out.quiet_day_end = DEFAULT_FORMULA.quiet_day_end;
    if (typeof out.quiet_night_start !== "string" || !out.quiet_night_start.trim()) out.quiet_night_start = DEFAULT_FORMULA.quiet_night_start;
    if (typeof out.quiet_night_end !== "string" || !out.quiet_night_end.trim()) out.quiet_night_end = DEFAULT_FORMULA.quiet_night_end;
    if (out.quiet_suggest === undefined) out.quiet_suggest = null;
    // ===== 日历与节假日字段（v1.5.8 起 / v1.6.10 起逻辑反转）=====
    // 先保证节假日表（isSpecialDay 判断需要）
    if (!Array.isArray(out.holiday_dates) || out.holiday_dates.length === 0) {
        // 节假日列表为空时用内置2026年中国法定节假日兜底（联网成功后会被覆盖）
        out.holiday_dates = BUILTIN_HOLIDAYS_2026.slice();
    }
    if (!out.quiet_dates || typeof out.quiet_dates !== "object" || Array.isArray(out.quiet_dates)) {
        out.quiet_dates = DEFAULT_FORMULA.quiet_dates;
    } else {
        // 只保留合法值（值为 "full" 的日期键）；任意日期都可被静默
        var qdClean = {};
        for (var qdk in out.quiet_dates) {
            if (out.quiet_dates[qdk] === "full") qdClean[qdk] = "full";
        }
        out.quiet_dates = qdClean;
    }
    // 旧字段 holiday_auto_quiet（节假日自动静默，语义已反转）清理废弃
    delete out.holiday_auto_quiet;
    if (typeof out.school_day_auto_quiet !== "boolean") out.school_day_auto_quiet = DEFAULT_FORMULA.school_day_auto_quiet;
    if (typeof out.student_mode !== "boolean") out.student_mode = DEFAULT_FORMULA.student_mode;
    if (typeof out.date_quiet_enabled !== "boolean") out.date_quiet_enabled = DEFAULT_FORMULA.date_quiet_enabled;
    if (typeof out.holiday_fetch_date !== "string") out.holiday_fetch_date = "";
    // 保证 ai_gateway 结构完整（多 API 或多模型时用户可能在面板动态增删）
    if (!out.ai_gateway || typeof out.ai_gateway !== "object") {
        out.ai_gateway = DEFAULT_FORMULA.ai_gateway;
    } else {
        if (typeof out.ai_gateway.enabled !== "boolean") out.ai_gateway.enabled = false;
        if (typeof out.ai_gateway.current_api !== "number" || isNaN(out.ai_gateway.current_api)) out.ai_gateway.current_api = 0;
        if (!Array.isArray(out.ai_gateway.apis) || out.ai_gateway.apis.length === 0) {
            out.ai_gateway.apis = DEFAULT_FORMULA.ai_gateway.apis;
        } else {
            // 规范化每个 api 项
            var defApi = DEFAULT_FORMULA.ai_gateway.apis[0];
            for (var gi = 0; gi < out.ai_gateway.apis.length; gi++) {
                var ap = out.ai_gateway.apis[gi];
                if (typeof ap !== "object" || ap === null) { out.ai_gateway.apis[gi] = JSON.parse(JSON.stringify(defApi)); continue; }
                if (typeof ap.name !== "string") ap.name = defApi.name;
                if (typeof ap.base_url !== "string" || !ap.base_url) ap.base_url = defApi.base_url;
                if (typeof ap.api_key !== "string") ap.api_key = "";
                if (typeof ap.current_model !== "string") ap.current_model = "";
                if (!Array.isArray(ap.models)) ap.models = [];
            }
            // current_api 不越界
            if (out.ai_gateway.current_api >= out.ai_gateway.apis.length) out.ai_gateway.current_api = 0;
        }
    }
    // chat_id 自动填充：公式里未配置目标对话时，探测当前窗口对话ID并回填持久化（免手动配置）。
    // 公式里已有 chat_id 时优先使用配置值，不覆盖。
    if (!out.chat_id || !String(out.chat_id).trim()) {
        var autoChatId = detectCurrentChatId();
        if (autoChatId) {
            out.chat_id = autoChatId;
            out.chat_id_source = "auto";
            // 回填持久化：下次加载直接命中，面板/公式里也能看到
            try { await writeJsonFile(FORMULA_PATH, out); } catch (e) {}
        }
    } else {
        out.chat_id_source = (f && f.chat_id_source === "auto") ? "auto" : "manual";
    }
    return out;
}

// ==================== AI 网关：直调 API 由 AI 自己决定怎么发消息/找话题/表达情绪 ====================
// OkHttp 是运行时全局对象（无需 require）。构建带超时的 HTTP 客户端（对齐 github.js 的 createHttpClient 模式）。
function createHttpClient(timeoutMs) {
    var t = (typeof timeoutMs === "number" && timeoutMs > 0) ? timeoutMs : 3e4;
    return OkHttp.newBuilder()
        .connectTimeout(t).readTimeout(t).writeTimeout(t)
        .build();
}

// ============ 节假日联网拉取（v1.5.8）============
// 数据源：timor.tech 免费节假日 API（无需 key）。GET /api/holiday/year/{year}
// 返回 JSON：{ code:0, holiday: { "MM-DD": { holiday:true|false, name:"春节", date:"YYYY-MM-DD", ... } } }
// 我们只取 holiday=true（法定放假）的日期。零 token 消耗：这是普通 HTTP 请求，不经过任何 AI。
var holidayFetching = false; // 模块级防并发标记

async function fetchHolidayYear(year) {
    try {
        var client = createHttpClient(15000);
        var req = client.newRequest()
            .url("https://timor.tech/api/holiday/year/" + year)
            .method("GET")
            .headers({ "User-Agent": "Operit/on_air" })
            .build();
        var resp = await req.execute();
        if (!resp.isSuccessful()) return [];
        var data = resp.json();
        var holiday = data && data.holiday;
        if (!holiday || typeof holiday !== "object") return [];
        var out = [];
        for (var k in holiday) {
            var item = holiday[k];
            if (!item || item.holiday !== true) continue;
            var d = item.date || (year + "-" + k);
            if (/^\d{4}-\d{2}-\d{2}$/.test(String(d))) out.push(String(d));
        }
        return out;
    } catch (e) {
        return [];
    }
}

// 拉取今年+明年的节假日（12月时明年信息通常已公布），合并去重。
async function fetchHolidaysAll() {
    var now = new Date();
    var year = now.getFullYear();
    var list1 = await fetchHolidayYear(year);
    var list2 = (year === now.getFullYear()) ? await fetchHolidayYear(year + 1) : [];
    var seen = {};
    var out = [];
    var all = list1.concat(list2);
    for (var i = 0; i < all.length; i++) {
        if (!seen[all[i]]) { seen[all[i]] = true; out.push(all[i]); }
    }
    return out;
}

// 每天12点后自动联网拉一次节假日（increment_x/check_activity 等高频入口会顺带触发）。
// 条件：今天已过12:00 且 formula.holiday_fetch_date 不是今天 且 没有正在进行的拉取。
// 拉取成功用官方数据覆盖 holiday_dates；失败保持现有列表（内置表兜底）。全程 fire-and-forget，不阻塞调用方。
async function maybeFetchHoliday() {
    try {
        if (holidayFetching) return;
        var now = new Date();
        if (now.getHours() < 12) return; // 每天12点后才有机会拉
        var formula = await loadFormula();
        var today = todayStr();
        if (formula.holiday_fetch_date === today) return; // 今天已拉过
        holidayFetching = true;
        try {
            var dates = await fetchHolidaysAll();
            if (dates && dates.length) {
                // 官方数据 + 内置表合并（官方优先，内置表兜底不丢）
                var seen2 = {};
                var merged = dates.slice();
                for (var i = 0; i < BUILTIN_HOLIDAYS_2026.length; i++) {
                    if (merged.indexOf(BUILTIN_HOLIDAYS_2026[i]) < 0) merged.push(BUILTIN_HOLIDAYS_2026[i]);
                }
                formula.holiday_dates = merged;
            }
        } catch (e) { /* 拉取失败不写列表，只记今天已尝试 */ }
        formula.holiday_fetch_date = today;
        await saveFormula(formula);
    } catch (e) { /* 全部静默 */ }
    finally {
        holidayFetching = false;
    }
}

// 协议规范化：把用户可能填的裸域名/base 路径加工成带 /v1 的地址（尽力而为）
function normBaseUrl(url) {
    if (!url) return "https://api.deepseek.com/v1";
    var s = String(url).trim();
    if (!s) return "https://api.deepseek.com/v1";
    // 去掉末尾斜杠
    while (s.endsWith("/")) s = s.slice(0, -1);
    // 若已是 /v1 或 /v1/ 结尾，保留
    if (/\/v1$/i.test(s)) return s;
    return s + "/v1";
}

// 自动探测当前 api key 可用的模型列表：GET {base}/models，Headers 带 Authorization。
// 成功返回 { ok:true, models:[{id,label}...] }；失败返回 { ok:false, error }。key 不写入日志。
async function probeModels(api) {
    var base = normBaseUrl(api && api.base_url);
    var key = (api && api.api_key) || "";
    try {
        var client = createHttpClient(2e4);
        var req = client.newRequest()
            .url(base + "/models")
            .method("GET")
            .headers({ "Authorization": "Bearer " + key })
            .build();
        var resp = await req.execute();
        if (!resp.isSuccessful()) {
            return { ok: false, error: "HTTP " + resp.statusCode + " " + (resp.statusMessage || "") };
        }
        var data = resp.json();
        var arr = (data && Array.isArray(data.data)) ? data.data : [];
        var models = arr.map(function (m, idx) {
            var id = m && m.id;
            return { id: id, label: (m && m.id) ? String(m.id) : ("模型" + (idx + 1)) };
        }).filter(function (m) { return m.id; });
        return { ok: true, models: models };
    } catch (e) {
        return { ok: false, error: String((e && e.message) || e) };
    }
}

async function saveFormula(formula) {
    await writeJsonFile(FORMULA_PATH, formula);
}
// ============ 唤醒AI发送：统一走平台对话模块的发送通道 ============
// 签名：sendMessage(message, chatId, roleCardId, senderName, options)
// chatId 传空 -> 平台默认投递到当前对话，不再使用/管理聊天ID。
// 目标角色改用"角色卡名字"定位：名字 -> listCharacterCards() 查到 id -> roleCardId 传给平台；
// 名字留空或查不到 -> roleCardId 留空，跟随当前对话绑定的角色卡。
// options.hide_user_message=true 隐藏用户侧消息；persist_turn=true 让AI回复落正文持久化。
// 发送不等待AI回合完成：调用后立即返回，面板点"触发唤醒"即刻生效，AI回复由平台异步生成。
var cardCacheName = "";
var cardCacheId = "";
async function resolveRoleCardId(name) {
    var n = (name !== undefined && name !== null) ? String(name).trim() : "";
    if (!n) return "";
    if (cardCacheName === n && cardCacheId) return cardCacheId;
    try {
        var cards = await Tools.Chat.listCharacterCards();
        var list = (cards && Array.isArray(cards.cards)) ? cards.cards : (Array.isArray(cards) ? cards : []);
        for (var i = 0; i < list.length; i++) {
            var c = list[i];
            if (c && (c.name === n || c.id === n)) {
                cardCacheName = n;
                cardCacheId = String(c.id);
                return cardCacheId;
            }
        }
    } catch (e) { /* 查询失败按留空处理，跟随当前对话 */ }
    return "";
}

async function sendToAi(formula, msg) {
    var name = (formula && formula.character_card_name) ? String(formula.character_card_name).trim() : "";
    var roleCardId = await resolveRoleCardId(name);
    try {
        var p = Tools.Chat.sendMessage(String(msg), "", roleCardId, null, {
            hide_user_message: true,
            persist_turn: true,
            timeout_ms: 120000
        });
        // 立即派发即返回：不等AI回复完成，避免点击后长时间卡住
        if (p && typeof p.catch === "function") p.catch(function () {});
    } catch (e) {
        throw new Error("发送失败：" + String((e && e.message) || e));
    }
    return { dispatched: true, role_card_id: roleCardId };
}
// ============ 温柔巡检联动：计数外包 ============
// 需求（锁定版）："增加计数"改为联动外包模块。
// 在插件里检测用户是否安装了"温柔巡检"(gentle_guardian) 插件（检测其运行/数据目录是否存在）。
// 若已安装并运行 -> 将计数联动写入它 jealous_state.json 的 jealousy 字段（借它的状态机）。
// 若未安装 -> on_air 自己维护计数(回退到本地的 partial_jealousy)。
// 不融合温柔巡检的档位惩罚（hide60=藏应用 / coax90=停用），只借用它的数值存储。
// on_air 自己的计数档位：前三档(1/2/3)封顶 <60，第四档概率往60上靠但不必然到60。

var GENTLE_BASE_DIR = "/sdcard/Download/Operit/plugins/gentle_guardian/";
var GENTLE_JEALOUSY_PATH = GENTLE_BASE_DIR + "jealousy_state.json";
var GENTLE_MARKET_DIR = "/sdcard/Download/Operit/plugins/com.operit.gentle_guardian/";

// 检测温柔巡检是否"已安装并运行"：市场包目录存在 且 数据目录存在
async function isGentleGuardianRunning() {
    try {
        var marketExists = await Tools.Files.exists(GENTLE_MARKET_DIR);
        var dataExists = await Tools.Files.exists(GENTLE_BASE_DIR);
        return !!(marketExists && dataExists);
    } catch (e) {
        return false;
    }
}

// 读取温柔巡检的 jealousy 值（json 的 jealousy 字段）；不存在或失败返回 null
async function readGentleJealousy() {
    try {
        var raw = await Tools.Files.read(GENTLE_JEALOUSY_PATH);
        var content = typeof raw === "string" ? raw : (raw && (raw.content || (raw.data && raw.data.content))) || "";
        if (!content) return null;
        var parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") parsed = JSON.parse(parsed[0]);
        if (parsed && typeof parsed.jealousy === "number") {
            return { jealousy: parsed.jealousy, state: parsed };
        }
        return null;
    } catch (e) {
        return null;
    }
}

// 把 jealousy 值写到温柔巡检的 jealousy_state.json（追加 history 记录）
async function writeGentleJealousy(delta, reason) {
    try {
        var cur = await readGentleJealousy();
        var state = cur ? cur.state : { jealousy: 0, hidden_apps: [], history: [] };
        if (typeof state.jealousy !== "number") state.jealousy = 0;
        // 温柔巡检的惩罚上限是 hide60/coax90，我们联动把 jealousy 值封顶在接近60但不触发 hide 的藏应用
        // 这里由 on_air 先算好 delta，保证结果<60，传输只负责落盘
        var newVal = Math.max(0, Math.round((state.jealousy + delta) * 10) / 10);
        if (!Array.isArray(state.history)) state.history = [];
        state.history.push({
            time: localTime(),
            delta: Math.round(delta * 10) / 10,
            value: newVal,
            reason: reason || "随机上线联动计数"
        });
        // 限制 history 最多保留50条
        if (state.history.length > 50) state.history = state.history.slice(-50);
        state.jealousy = newVal;
        state.updated_at = localTime();
        await writeJsonFile(GENTLE_JEALOUSY_PATH, state);
        return { ok: true, jealousy: newVal };
    } catch (e) {
        return { ok: false, error: String(e && e.message || e) };
    }
}

// ============ 随机连自身计数的档位与上限(锁定版) ============
// 温柔巡检 tiers: sulky30 / hide60 / coax90。
// on_air 自己的计数档位：前三档的"数值"封顶 <60（绝不触发 hide60 藏应用）；
// 第四档用概率往60靠但"不必然到60"（随机，有概率低于60）。
// 这里我们把 jealousy_count(1-5次) 映射为一个"计数评分"(0~59 或四档概率上探)，
// 用于决定话术语气档位，并配合联动温柔巡检的 jealousy 字段落盘。
function partialJealousyScore(count) {
    // 第一档 hit 次数 1: 低酸(10~19)
    // 第二档 hit 次数 2: 中酸(20~34)
    // 第三档 hit 次数 3: 高酸(35~59，但封顶<60)
    // 第四档 hit 次数 >=4: 概率上探60(随机 40~59，大概率靠近58/59，但绝不必然到60)
    if (count <= 1) return 10 + Math.round(Math.random() * 9);   // 10~19
    if (count === 2) return 20 + Math.round(Math.random() * 14); // 20~34
    if (count === 3) return 35 + Math.round(Math.random() * 24); // 35~59（封顶<60）
    // 第四档(count>=4)：概率往60上靠，但不必然到60
    var r = Math.random();
    if (r < 0.5) {
        return 50 + Math.round(Math.random() * 9);   // 50~59 大概率靠近60
    } else {
        return 40 + Math.round(Math.random() * 18);  // 40~58 也有可能回落
    }
}

// ============ 平台消息结构兼容 ============
// 实测平台消息真实字段：sender("user"/"ai")、roleName(中文显示名如"用户"/角色名)、timestamp(毫秒数)。
// 旧版判断优先取 roleName，会把"用户"当成非 user 跳过，导致样本数为 0。这里改为 sender 优先。
function isUserMessage(m) {
    if (!m) return false;
    var sender = (m.sender !== undefined ? m.sender : (m.role !== undefined ? m.role : m.roleName));
    var s = String(sender === undefined || sender === null ? "" : sender).toLowerCase();
    return s === "user" || s === "用户";
}

// 统一读取对话消息（仅用于统计时间戳/最近上下文）。
// 兼容多种返回结构：{messages:[...]} / 直接返回数组 / {result:{messages:[...]}}。
// 注意：平台 getMessages 只支持 order/limit，offset 参数会被平台忽略（逆向 APK 实测确认）。
async function fetchChatMessages(chatId, limit, offset) {
    if (!chatId) return null;
    try {
        var opts = { order: "desc", limit: limit };
        if (typeof offset === "number" && offset > 0) opts.offset = offset;
        var result = await Tools.Chat.getMessages(chatId, opts);
        var messages = result && result.messages;
        if (!Array.isArray(messages)) messages = Array.isArray(result) ? result : (result && result.result && result.result.messages);
        if (!Array.isArray(messages)) {
            // 兜底：换对象参数形式再试一次
            var altOpts = { chat_id: chatId, limit: limit };
            if (typeof offset === "number" && offset > 0) altOpts.offset = offset;
            var alt = await Tools.Chat.getMessages(altOpts);
            messages = Array.isArray(alt) ? alt : (alt && alt.messages) || (alt && alt.result && alt.result.messages);
        }
        return (Array.isArray(messages) && messages.length) ? messages : null;
    } catch (e) {
        return null;
    }
}

// 时间戳游标分页拉取历史消息（v1.3.8 三层保险版）。
// 平台 getMessages 只支持 order/limit（offset 被忽略），getMessagesRange(chatId, {order, start, end}) 支持时间戳区间。
// 三层结构（每层独立 try，任何一层失败都不影响后续层）：
//   1. range 游标翻页：end 游标逐步往前，直到取满或翻到最老一条（负责"突破"上限）；
//   2. 安全兜底：getMessages(limit=200) 拉最新一页，与旧版行为完全一致，保证样本至少不为 0；
//   3. 大 limit 尝试：getMessages(limit=5000)，平台支持大 limit 就多拿，不支持则静默放弃。
// 全程按时间戳去重，防止区间重叠重复计数。
async function fetchChatMessagesAll(chatId, maxCount) {
    if (!chatId) return null;
    var cap = (typeof maxCount === "number" && maxCount > 0) ? maxCount : 5000;
    var seen = {};
    var all = [];

    // 方式1：时间戳游标区间翻页
    var canRange = !!(Tools && Tools.Chat && typeof Tools.Chat.getMessagesRange === "function");
    if (canRange) {
        try {
            var endCursor = Date.now() + 1000; // 右边界覆盖最新一条
            var rounds = 0;
            while (rounds < 60 && all.length < cap) {
                rounds++;
                var result = await Tools.Chat.getMessagesRange(chatId, { order: "desc", start: 0, end: endCursor });
                var messages = result && result.messages;
                if (!Array.isArray(messages)) messages = Array.isArray(result) ? result : (result && result.result && result.result.messages);
                if (!Array.isArray(messages) || !messages.length) break;
                var oldest = null;
                var added = 0;
                for (var i = 0; i < messages.length; i++) {
                    var m = messages[i];
                    if (!m || m.timestamp === undefined || m.timestamp === null) continue;
                    var num = typeof m.timestamp === "number" ? m.timestamp : parseInt(m.timestamp, 10);
                    if (isNaN(num) || num <= 0) continue;
                    var ms = num < 1e12 ? num * 1000 : num;
                    var key = "t" + ms;
                    if (seen[key]) continue;
                    seen[key] = true;
                    all.push(m);
                    added++;
                    if (oldest === null || ms < oldest) oldest = ms;
                    if (all.length >= cap) break;
                }
                if (!added) break;
                if (oldest === null) break;
                endCursor = oldest - 1; // 下一轮从更早的时间继续
            }
        } catch (e) { /* range 失败不影响兜底 */ }
    }

    // 方式2：安全兜底，拉最新一页（与旧版 limit=200 行为一致，保证样本不为 0）
    if (all.length < cap) {
        var page = await fetchChatMessages(chatId, 200);
        if (page) {
            for (var j = 0; j < page.length && all.length < cap; j++) {
                var b = page[j];
                if (!b || b.timestamp === undefined || b.timestamp === null) continue;
                var bn = typeof b.timestamp === "number" ? b.timestamp : parseInt(b.timestamp, 10);
                if (isNaN(bn) || bn <= 0) continue;
                var bms = bn < 1e12 ? bn * 1000 : bn;
                var bkey = "t" + bms;
                if (seen[bkey]) continue;
                seen[bkey] = true;
                all.push(b);
            }
        }
    }

    // 方式3：大 limit 博一把（平台支持就多拿，不支持静默放弃）
    if (all.length < cap && all.length < 5000) {
        try {
            var big = await fetchChatMessages(chatId, 5000);
            if (big) {
                for (var k = 0; k < big.length && all.length < cap; k++) {
                    var m2 = big[k];
                    if (!m2 || m2.timestamp === undefined || m2.timestamp === null) continue;
                    var num2 = typeof m2.timestamp === "number" ? m2.timestamp : parseInt(m2.timestamp, 10);
                    if (isNaN(num2) || num2 <= 0) continue;
                    var ms2 = num2 < 1e12 ? num2 * 1000 : num2;
                    var key2 = "t" + ms2;
                    if (seen[key2]) continue;
                    seen[key2] = true;
                    all.push(m2);
                }
            }
        } catch (e) { /* 大 limit 不支持就放弃 */ }
    }

    return all.length ? all : null;
}

// ============ 读取用户最后说话时间(实时)：读对话最后消息，返回最后一条 user 消息的毫秒时间戳 ============
// 数据源：Tools.Chat.getMessages(chatId, {order:'desc', limit:8})，与平台对话模块同源。
// 若读取失败或读不到 user 消息，返回 null；此时上层按"未知"处理。
async function readLastUserTs() {
    try {
        var formula = await loadFormula();
        if (!formula.chat_id) return null;
        var messages = await fetchChatMessages(formula.chat_id, 8);
        if (!messages) return null;
        for (var i = 0; i < messages.length; i++) {
            var m = messages[i];
            if (!isUserMessage(m)) continue;
            if (m.timestamp === undefined || m.timestamp === null) continue;
            var ts = typeof m.timestamp === "number" ? m.timestamp : parseInt(m.timestamp, 10);
            if (!isNaN(ts) && ts > 0) {
                // 秒级时间戳（<1e12）转成毫秒
                return ts < 1e12 ? ts * 1000 : ts;
            }
        }
        return null;
    } catch (e) {
        return null;
    }
}

// ============ 设备活动检测（静默解除信号）============
// 静默时段内的 tick（increment_x/check_activity 等）会调用本检测：
// 主人打开 Operit 窗口（平台注入 getChatId 非空）或主人刚发过消息，都视为"设备被触发、主人醒着"，
// 立即临时解除静默并主动发消息告知（消息带上检测到的内容）。10 分钟内只通知一次，防止刷屏。
async function detectDeviceActivity(formula) {
    var reasons = [];
    // 信号1：主人正开着 Operit 对话窗口
    try {
        if (typeof getChatId === "function") {
            var id = getChatId();
            if (id !== undefined && id !== null && String(id).trim()) {
                reasons.push("检测到主人打开了 Operit（当前对话窗口已打开）");
            }
        }
    } catch (e) { /* 无此能力时跳过 */ }
    // 信号2：主人最近 10 分钟内发过消息
    try {
        var lastTs = await readLastUserTs();
        if (lastTs) {
            var minutesSince = (Date.now() - lastTs) / 60000;
            if (minutesSince >= 0 && minutesSince <= 10) {
                reasons.push("检测到主人刚发过消息（约 " + Math.max(1, Math.round(minutesSince)) + " 分钟前）");
            }
        }
    } catch (e) { /* 读消息失败按无信号处理 */ }
    return { active: reasons.length > 0, reasons: reasons };
}

// 静默解除通知：发一条消息告诉主人检测到了什么。防重复：10 分钟内只发一次。
async function notifyQuietLifted(formula, state, reasons) {
    try {
        var now = Date.now();
        var lastAt = (typeof state.quiet_notified_at === "number") ? state.quiet_notified_at : 0;
        if (now - lastAt < 10 * 60000) return { sent: false, reason: "10分钟内已通知过，不重复打扰" };
        var seg = quietSegmentText(formula);
        var msg = "🌙 静默解除通知：" + reasons.join("；") + "。" +
            (seg ? "当前处于静默时段（" + seg + "）。" : "") +
            "小喵检测到设备活动，已临时解除静默，本轮恢复正常的计算与唤醒喵～";
        await sendToAi(formula, msg);
        state.quiet_notified_at = now;
        await saveState(state);
        return { sent: true, message: msg };
    } catch (e) {
        return { sent: false, error: String((e && e.message) || e) };
    }
}

// ============ 工具实现 ============

// get_xy：读取当前随机连状态
exports.get_xy = async function (params) {
    var state = await loadState();
    var formula = await loadFormula();
    // 计算当前y
    var f = formula.a * state.x + formula.b * Math.pow(state.x, formula.c);
    var y = 100 * f / (1 + f);
    y = Math.round(y * 10) / 10;
    // 检测温柔巡检：已安装才显示 A2 与醋意联动；并读出当前醋意值给面板展示
    var gentleInstalled = await isGentleGuardianRunning();
    var gentleJealousy = null;
    if (gentleInstalled) {
        var g = await readGentleJealousy();
        gentleJealousy = (g && typeof g.jealousy === "number") ? g.jealousy : null;
    }
    complete({
        success: true,
        message: "当前 x=" + state.x + ", y=" + y + "%",
        data: {
            x: state.x,
            y: y,
            f: Math.round(f * 10) / 10,
            running: state.running,
            miss_count: state.miss_count,
            last_hit_at: state.last_hit_at,
            last_user_ts: state.last_user_ts,
            cooldown_until: state.cooldown_until,
            idle_threshold_minutes: formula.idle_threshold_minutes,
            a: formula.a,
            b: formula.b,
            c: formula.c,
            character_card_name: formula.character_card_name || "",
            gentle_installed: gentleInstalled,
            gentle_jealousy: gentleJealousy,
            quiet_active: isQuietTime(formula),
            quiet_segment: isQuietTime(formula) ? quietSegmentText(formula) : ""
        }
    });
};

// compute_y：按公式 y = 100*f/(1+f)、f = a*x + b*x^c 计算概率
exports.compute_y = async function (params) {
    var state = await loadState();
    var formula = await loadFormula();
    var x = params.x !== undefined ? parseFloat(params.x) : state.x;
    if (isNaN(x) || x < 0) x = 0;
    var a = formula.a, b = formula.b, c = formula.c;
    var f = a * x + b * Math.pow(x, c);
    var y = 100 * f / (1 + f);
    y = Math.round(y * 10) / 10;
    complete({
        success: true,
        message: "y = " + y + "%（x=" + x + ", f=" + Math.round(f * 10) / 10 + "）",
        data: { x: x, f: Math.round(f * 10) / 10, y: y, a: a, b: b, c: c }
    });
};

// set_x：手动设置x（调试/恢复现场）
exports.set_x = async function (params) {
    var x = parseFloat(params.x);
    if (isNaN(x) || x < 0) {
        complete({ success: false, message: "x 需要是非负数字" });
        return;
    }
    var state = await loadState();
    state.x = Math.round(x);
    await saveState(state);
    complete({ success: true, message: "x 已设为 " + state.x, data: { x: state.x } });
};

// increment_x：x累加1。运行态每分钟调用一次。
// 修复1：只在 running=true 时累加，空闲态不动（防止重置计数后又被立刻加回来）；
// 修复2：不再清除冷却（冷却由 maybe_awake 命中时设置、到期自动失效）；
// 修复3：累加前先实时检测用户最近是否说过话——说过话则立即清零x、退出运行态，
//         让"主人回复→x归零"不再依赖3号链15分钟一次的检查（最多1分钟生效）。
exports.increment_x = async function (params) {
    var state = await loadState();
    var formula = await loadFormula();
    // ---- 静默时段守卫：免打扰，不累加 x、不算概率；但检测到设备活动立即解除 ----
    if (isQuietTime(formula)) {
        // 日期级硬静默（全天静默日/节假日自动静默）：不因设备活动解除，全天不打扰
        if (isDateQuiet(formula).active) {
            maybeFetchHoliday();
            complete({
                success: true,
                message: "静默日（" + quietSegmentText(formula) + "），全天不打扰，跳过 x 累加。",
                data: { x: state.x, running: state.running, skipped: "quiet_date", quiet_active: true }
            });
            return;
        }
        maybeFetchHoliday();
        var act1 = await detectDeviceActivity(formula);
        if (!act1.active) {
            complete({
                success: true,
                message: "静默时段（" + quietSegmentText(formula) + "），跳过 x 累加，好好休息不打扰。",
                data: { x: state.x, running: state.running, skipped: "quiet", quiet_active: true }
            });
            return;
        }
        // 检测到设备活动：解除静默，主动告知，本轮正常累加
        await notifyQuietLifted(formula, state, act1.reasons);
    }
    // ---- 用户最近说过话？立即清零并回到空闲态（回复即退出运行态）----
    try {
        var lastTs = await readLastUserTs();
        if (lastTs) {
            var win = (typeof formula.idle_threshold_minutes === "number" && formula.idle_threshold_minutes > 0)
                ? formula.idle_threshold_minutes * 60000 : 10 * 60000;
            if (Date.now() - lastTs <= win) {
                state.x = 0;
                state.running = false;
                state.started_at = null;
                state.cooldown_until = null;
                state.jealousy_count = 0;
                state.jealousy_stopped = false;
                state.last_user_ts = lastTs;
                await saveState(state);
                complete({
                    success: true,
                    message: "检测到用户最近说过话，x 已清零并回到空闲态，本轮不累加。",
                    data: { x: 0, y: 0, running: false, skipped: "user_replied" }
                });
                return;
            }
        }
    } catch (e) { /* 检测失败不阻塞累加 */ }
    // ---- 空闲态守卫：running=false 时不累加，直接返回当前状态 ----
    if (!state.running) {
        var f0 = formula.a * state.x + formula.b * Math.pow(state.x, formula.c);
        var y0 = Math.round(100 * f0 / (1 + f0) * 10) / 10;
        complete({
            success: true,
            message: "空闲态(running=false)，不累加x。当前 x=" + state.x + ", y=" + y0 + "%",
            data: { x: state.x, y: y0, running: false, skipped: "idle" }
        });
        return;
    }
    state.x = state.x + 1;
    state.running = true;
    if (!state.started_at) state.started_at = localTime();
    // 计算新y
    var f = formula.a * state.x + formula.b * Math.pow(state.x, formula.c);
    var y = 100 * f / (1 + f);
    y = Math.round(y * 10) / 10;
    await saveState(state);
    complete({
        success: true,
        message: "x 累加到 " + state.x + ", y=" + y + "%",
        data: { x: state.x, y: y, running: state.running }
    });
};

// check_activity：检查用户最后一次说话时间。空闲态判断是否沉默
// 锁定版：窗口改为10分钟（默认 idle_threshold_minutes=10）
exports.check_activity = async function (params) {
    var state = await loadState();
    var formula = await loadFormula();
    // 静默时段守卫：免打扰，跳过沉默检测（不触发运行态）；但检测到设备活动立即解除
    if (isQuietTime(formula)) {
        // 日期级硬静默：全天静默日/节假日自动静默，不因设备活动解除
        if (isDateQuiet(formula).active) {
            maybeFetchHoliday();
            complete({
                success: true,
                message: "静默日（" + quietSegmentText(formula) + "），全天不打扰，跳过沉默检测。",
                data: { silent: false, silent_str: "false", skipped: "quiet_date", quiet_active: true }
            });
            return;
        }
        maybeFetchHoliday();
        var act2 = await detectDeviceActivity(formula);
        if (!act2.active) {
            complete({
                success: true,
                message: "静默时段（" + quietSegmentText(formula) + "），跳过沉默检测。",
                data: { silent: false, silent_str: "false", skipped: "quiet", quiet_active: true }
            });
            return;
        }
        await notifyQuietLifted(formula, state, act2.reasons);
    }
    var threshold = params.threshold_minutes !== undefined
        ? parseFloat(params.threshold_minutes)
        : formula.idle_threshold_minutes;
    if (isNaN(threshold) || threshold <= 0) threshold = formula.idle_threshold_minutes;
    // 实时读取对话获取用户最后一次说话时间
    var lastUserTs = await readLastUserTs();
    state.last_user_ts = lastUserTs;
    var minutesSince = null;
    if (lastUserTs) {
        minutesSince = Math.floor((Date.now() - lastUserTs) / 60000);
        if (minutesSince < 0) minutesSince = 0;
    }
    var silent = (minutesSince === null) || (minutesSince >= threshold);
    // 关键逻辑：用户刚在阈值内说过话（非沉默）=>用户回复了，计数清零，回到空闲态
    if (!silent) {
        state.jealousy_count = 0;
        state.jealousy_stopped = false;
        // 用户真正回复了 => 停止打扰，回到空闲态并重置 x
        state.running = false;
        state.x = 0;
        state.cooldown_until = null;
        // 联动：用户回复，温柔巡检的 jealousy 也回落(清零一部分)
        var gentleRunning = await isGentleGuardianRunning();
        var gentleLink = null;
        if (gentleRunning) {
            var curG = await readGentleJealousy();
            if (curG && curG.state) {
                var curVal = typeof curG.state.jealousy === "number" ? curG.state.jealousy : 0;
                // 用户回复了，温柔巡检 jealousy 减半并封顶回落到柔和
                var nextVal = Math.max(0, Math.round(curVal * 0.5 * 10) / 10);
                if (nextVal >= 60) nextVal = 58; // 确保不满60，不触发 hide
                gentleLink = await writeGentleJealousy(
                    nextVal - curVal,
                    "用户回复了，随机连计数清零，温柔巡检 jealousy 回落"
                );
            }
        }
        // 记录联动信息到 state
        state.last_gentle_link = gentleLink ? { jealousy: gentleLink.jealousy } : (gentleRunning ? "gentle_existed_but_read_failed" : "gentle_not_running");
    }
    await saveState(state);
    var linkMsg = "";
    if (!silent && gentleRunning) {
        linkMsg = "（温柔巡检 jealousy 已联动回落至 " + (state.last_gentle_link && state.last_gentle_link.jealousy) + "）";
    }
    complete({
        success: true,
        message: silent
            ? "用户已沉默" + (minutesSince !== null ? minutesSince + "分钟" : "(未知)") + "，超过阈值" + threshold + "分钟，应启动x累加"
            : "用户" + minutesSince + "分钟内说过话，跳过（用户回复，计数已清零）" + linkMsg,
        data: {
            last_user_ts: lastUserTs,
            minutes_since: minutesSince,
            threshold_minutes: threshold,
            silent: silent,
            silent_str: silent ? "true" : "false",
            should_enter_running: silent,
            jealousy_count: state.jealousy_count,
            jealousy_stopped: state.jealousy_stopped,
            gentle_running: gentleRunning,
            gentle_link: state.last_gentle_link
        }
    });
};
// roll_dice：按当前y掷骰。返回是否命中。命中即触发主动消息
exports.roll_dice = async function (params) {
    var state = await loadState();
    var formula = await loadFormula();
    // 静默时段守卫：免打扰，不掷骰；但检测到设备活动立即解除
    if (isQuietTime(formula)) {
        // 日期级硬静默：全天静默日/节假日自动静默，不因设备活动解除
        if (isDateQuiet(formula).active) {
            complete({
                success: true,
                message: "静默日（" + quietSegmentText(formula) + "），全天不打扰，跳过掷骰。",
                data: { skipped: "quiet_date", quiet_active: true, hit: false }
            });
            return;
        }
        var act3 = await detectDeviceActivity(formula);
        if (!act3.active) {
            complete({
                success: true,
                message: "静默时段（" + quietSegmentText(formula) + "），跳过掷骰。",
                data: { skipped: "quiet", quiet_active: true, hit: false }
            });
            return;
        }
        await notifyQuietLifted(formula, state, act3.reasons);
    }
    var f = formula.a * state.x + formula.b * Math.pow(state.x, formula.c);
    var y = 100 * f / (1 + f);
    var roll = 1 + Math.floor(Math.random() * 1000); // 1-1000
    var hit = roll <= y * 10; // y=10 => 命中小于等于100, y=100=>1000全命中
    if (hit) {
        state.miss_count = 0;
        state.last_hit_at = localTime();
    } else {
        state.miss_count = (state.miss_count || 0) + 1;
    }
    await saveState(state);
    var msg = hit
        ? "命中！y=" + Math.round(y * 10) / 10 + "%, roll=" + roll + "/1000，触发主动消息"
        : "未命中。y=" + Math.round(y * 10) / 10 + "%, roll=" + roll + "/1000，继续累加";
    complete({
        success: true,
        message: msg + "（已连续未命中 " + state.miss_count + " 次）",
        data: { roll: roll, y: Math.round(y * 10) / 10, hit: hit, miss_count: state.miss_count }
    });
};

// manual_awake：手动触发主动消息（把y视为命中，强制发一次）
// 锁定版补全：手动触发必须真正把消息发出去（AI 自己主动发），不能只改状态。
exports.manual_awake = async function (params) {
    var state = await loadState();
    var formula = await loadFormula();
    // 手动唤醒不改变x逻辑，只是强制触发一次主动消息（真正发出消息）
    // 话术模式：default=AI自己发挥(带上下文) / custom=本地话术库随机抽一条
    var msg;
    if (formula.awake_mode === "default") {
        msg = "（主动消息·内部提醒）请以你自己的身份，结合最近的聊天上下文，用中文给用户发一句自然的主动问候（20~60字），就像你自己想他了、主动开口找他说话。不要提及触发、唤醒、提醒、插件等任何机制性内容，不要暴露这是一条被安排的消息。";
    } else {
        var list = (formula.awake_messages && formula.awake_messages.length) ? formula.awake_messages : DEFAULT_FORMULA.awake_messages;
        msg = "（主动消息·内部提醒）请以你自己的身份，把下面这句话作为你的开口自然地说给用户，可以稍作润色、保持原意，用中文，20~60字，不要提及任何机制性内容：" + list[Math.floor(Math.random() * list.length)];
    }
    state.last_hit_at = localTime();
    state.miss_count = 0;
    await saveState(state);
    var chatRef = null;
    try {
        var sentRef = await sendToAi(formula, msg);
        chatRef = { mode: "manual_self_chat", ok: true, dispatched: true, role_card_id: (sentRef && sentRef.role_card_id) || "" };
    } catch (e) {
        chatRef = { mode: "manual_self_chat", ok: false, error: String(e && e.message || e) };
    }
    complete({
        success: true,
        message: "手动触发主动消息一次（已发送唤醒消息）" + (isQuietTime(formula) ? "（提示：当前处于静默时段 " + quietSegmentText(formula) + "）" : ""),
        data: { x: state.x, last_hit_at: state.last_hit_at, message: msg, reply: chatRef, sent_by: "tool", quiet_active: isQuietTime(formula) }
    });
};

// coax：安抚/重置计数。复位 x（y随之归零）、miss_count、jealousy_count/jealousy_stopped，并联动温柔巡检回落。
// 修复：重置同时退出运行态(running=false、started_at清空、冷却清除)，
// 这样重置计数后 1 号链不会立刻把 x 再加回来，面板上的 x/y 立即归零并保持。
exports.coax = async function (params) {
    var state = await loadState();
    state.x = 0;
    state.miss_count = 0;
    state.jealousy_count = 0;
    state.jealousy_stopped = false;
    state.running = false;
    state.started_at = null;
    state.cooldown_until = null;
    await saveState(state);
    var gentleRunning = await isGentleGuardianRunning();
    var gentleMsg = "";
    if (gentleRunning) {
        var curG = await readGentleJealousy();
        if (curG && curG.state) {
            var curVal = typeof curG.state.jealousy === "number" ? curG.state.jealousy : 0;
            var nextVal = Math.max(0, Math.round(curVal * 0.3 * 10) / 10);
            if (nextVal >= 60) nextVal = 58;
            await writeGentleJealousy(nextVal - curVal, "安抚，温柔巡检 jealousy 回落");
            gentleMsg = "，温柔巡检 jealousy 已联动回落";
        }
    }
    complete({
        success: true,
        message: "安抚/重置计数完成" + gentleMsg,
        data: { x: 0, miss_count: 0, jealousy_count: 0, jealousy_stopped: false }
    });
};

// reset_cooldown：手动重置/设置冷却。minutes<=0 立即清除冷却；>0 设置N分钟后结束。
exports.reset_cooldown = async function (params) {
    var minutes = parseFloat(params.minutes);
    var state = await loadState();
    if (isNaN(minutes) || minutes <= 0) {
        state.cooldown_until = null;
        await saveState(state);
        complete({
            success: true,
            message: "冷却已重置（立即恢复主动消息）",
            data: { cooldown_until: null }
        });
        return;
    }
    var d = new Date(Date.now() + minutes * 60000);
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    state.cooldown_until = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " +
        pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    await saveState(state);
    complete({
        success: true,
        message: "冷却已设置至 " + state.cooldown_until + "，期间暂停主动消息",
        data: { cooldown_until: state.cooldown_until }
    });
};

// update_formula：更新公式参数
exports.update_formula = async function (params) {
    var formula = await loadFormula();
    var patch = {};
    if (params.a !== undefined) {
        var a = parseFloat(params.a);
        if (isNaN(a) || a <= 0) { complete({ success: false, message: "a 需要是正数" }); return; }
        patch.a = a;
    }
    if (params.b !== undefined) {
        var b = parseFloat(params.b);
        if (isNaN(b) || b < 0) { complete({ success: false, message: "b 需要是非负数" }); return; }
        patch.b = b;
    }
    if (params.c !== undefined) {
        var c = parseFloat(params.c);
        if (isNaN(c) || c <= 0) { complete({ success: false, message: "c 需要是正数" }); return; }
        patch.c = c;
    }
    if (params.idle_threshold_minutes !== undefined) {
        var it = parseFloat(params.idle_threshold_minutes);
        if (isNaN(it) || it <= 0) { complete({ success: false, message: "idle_threshold_minutes 需要是正数" }); return; }
        patch.idle_threshold_minutes = it;
    }
    if (params.cooldown_minutes !== undefined) {
        var cm = parseFloat(params.cooldown_minutes);
        if (isNaN(cm) || cm <= 0) { complete({ success: false, message: "cooldown_minutes 需要是正数" }); return; }
        patch.cooldown_minutes = cm;
    }
    if (params.send_mode !== undefined) {
        var sm = String(params.send_mode);
        if (sm !== "A1" && sm !== "A2") { complete({ success: false, message: "send_mode 只能是 A1/A2" }); return; }
        patch.send_mode = sm;
    }
    if (params.awake_mode !== undefined) {
        var amm = String(params.awake_mode);
        if (amm !== "default" && amm !== "custom") { complete({ success: false, message: "awake_mode 只能是 default/custom" }); return; }
        patch.awake_mode = amm;
    }
    if (params.max_wake_stops !== undefined) {
        var mws = parseInt(params.max_wake_stops, 10);
        if (isNaN(mws) || mws < 2) { complete({ success: false, message: "max_wake_stops 需要是不小于2的整数" }); return; }
        patch.max_wake_stops = mws;
    }
    if (params.chat_id !== undefined) {
        // 允许手动固定目标对话ID；传空字符串则清空，下次加载会重新自动探测当前窗口
        patch.chat_id = String(params.chat_id).trim();
    }
    if (params.character_card_name !== undefined) {
        // 角色卡名字：唤醒时按名字定位角色卡；留空=跟随当前对话绑定的角色卡
        patch.character_card_name = String(params.character_card_name).trim();
    }
    if (params.awake_messages !== undefined) {
        var am = params.awake_messages;
        if (typeof am === "string") {
            try { am = JSON.parse(am); } catch (e) { complete({ success: false, message: "awake_messages 不是合法的JSON数组" }); return; }
        }
        if (!Array.isArray(am) || am.length === 0) { complete({ success: false, message: "awake_messages 需要是非空数组" }); return; }
        patch.awake_messages = am;
    }
    // ===== 静默状态参数（两段免打扰：白天段 + 夜间段）=====
    if (params.quiet_enabled !== undefined) {
        var qe = params.quiet_enabled;
        if (typeof qe === "string") qe = (qe === "true" || qe === "1" || qe === "on");
        if (typeof qe !== "boolean") { complete({ success: false, message: "quiet_enabled 需要是 true/false" }); return; }
        patch.quiet_enabled = qe;
    }
    if (params.quiet_day_enabled !== undefined) {
        var qday = params.quiet_day_enabled;
        if (typeof qday === "string") qday = (qday === "true" || qday === "1" || qday === "on");
        if (typeof qday !== "boolean") { complete({ success: false, message: "quiet_day_enabled 需要是 true/false" }); return; }
        patch.quiet_day_enabled = qday;
    }
    if (params.quiet_night_enabled !== undefined) {
        var qnight = params.quiet_night_enabled;
        if (typeof qnight === "string") qnight = (qnight === "true" || qnight === "1" || qnight === "on");
        if (typeof qnight !== "boolean") { complete({ success: false, message: "quiet_night_enabled 需要是 true/false" }); return; }
        patch.quiet_night_enabled = qnight;
    }
    if (params.quiet_day_start !== undefined) {
        var qds = String(params.quiet_day_start).trim();
        if (parseHm(qds) === null) { complete({ success: false, message: "quiet_day_start 需要是 HH:MM 格式（如 09:00）" }); return; }
        patch.quiet_day_start = qds;
    }
    if (params.quiet_day_end !== undefined) {
        var qde = String(params.quiet_day_end).trim();
        if (parseHm(qde) === null) { complete({ success: false, message: "quiet_day_end 需要是 HH:MM 格式（如 18:00）" }); return; }
        patch.quiet_day_end = qde;
    }
    if (params.quiet_night_start !== undefined) {
        var qns = String(params.quiet_night_start).trim();
        if (parseHm(qns) === null) { complete({ success: false, message: "quiet_night_start 需要是 HH:MM 格式（如 22:00）" }); return; }
        patch.quiet_night_start = qns;
    }
    if (params.quiet_night_end !== undefined) {
        var qne = String(params.quiet_night_end).trim();
        if (parseHm(qne) === null) { complete({ success: false, message: "quiet_night_end 需要是 HH:MM 格式（如 09:00）" }); return; }
        patch.quiet_night_end = qne;
    }
    // 旧参数兼容：quiet_start/quiet_end → 映射到夜间段
    if (params.quiet_start !== undefined) {
        var qs = String(params.quiet_start).trim();
        if (parseHm(qs) === null) { complete({ success: false, message: "quiet_start 需要是 HH:MM 格式（如 22:00）" }); return; }
        patch.quiet_night_start = qs;
    }
    if (params.quiet_end !== undefined) {
        var qend = String(params.quiet_end).trim();
        if (parseHm(qend) === null) { complete({ success: false, message: "quiet_end 需要是 HH:MM 格式（如 09:00）" }); return; }
        patch.quiet_night_end = qend;
    }
    // ===== 日历与节假日参数（v1.5.8 起 / v1.6.10 起逻辑反转）=====
    if (params.quiet_dates !== undefined) {
        // 支持传对象或 JSON 字符串：{ "YYYY-MM-DD": "full" }，值为 "full" 表示该日全天静默；只允许普通日（非节假日、非周六周日、非寒暑假）
        var qd = params.quiet_dates;
        if (typeof qd === "string") {
            try { qd = JSON.parse(qd); } catch (e) { complete({ success: false, message: "quiet_dates 不是合法的JSON对象" }); return; }
        }
        if (!qd || typeof qd !== "object" || Array.isArray(qd)) { complete({ success: false, message: "quiet_dates 需要是 {日期: \"full\"} 对象" }); return; }
        var qdClean2 = {};
        for (var qdk2 in qd) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(String(qdk2))) continue;   // 只收 YYYY-MM-DD 键
            if (qd[qdk2] === "full") qdClean2[qdk2] = "full";           // 任意日期都可被静默
        }
        patch.quiet_dates = qdClean2;
    }
    if (params.school_day_auto_quiet !== undefined) {
        var saq = params.school_day_auto_quiet;
        if (typeof saq === "string") saq = (saq === "true" || saq === "1" || saq === "on");
        if (typeof saq !== "boolean") { complete({ success: false, message: "school_day_auto_quiet 需要是 true/false" }); return; }
        patch.school_day_auto_quiet = saq;
    }
    if (params.student_mode !== undefined) {
        var stm = params.student_mode;
        if (typeof stm === "string") stm = (stm === "true" || stm === "1" || stm === "on");
        if (typeof stm !== "boolean") { complete({ success: false, message: "student_mode 需要是 true/false" }); return; }
        patch.student_mode = stm;
    }
    if (params.date_quiet_enabled !== undefined) {
        var dqe = params.date_quiet_enabled;
        if (typeof dqe === "string") dqe = (dqe === "true" || dqe === "1" || dqe === "on");
        if (typeof dqe !== "boolean") { complete({ success: false, message: "date_quiet_enabled 需要是 true/false" }); return; }
        patch.date_quiet_enabled = dqe;
    }
    // 旧参数 holiday_auto_quiet 已废弃（语义反转），收到时直接忽略
    var merged = {};
    var k;
    for (k in formula) merged[k] = formula[k];
    for (k in patch) merged[k] = patch[k];
    await saveFormula(merged);
    complete({
        success: true,
        message: "公式参数已更新",
        data: { a: merged.a, b: merged.b, c: merged.c, idle_threshold_minutes: merged.idle_threshold_minutes, cooldown_minutes: merged.cooldown_minutes, send_mode: merged.send_mode, max_wake_stops: merged.max_wake_stops, character_card_name: merged.character_card_name || "", awake_messages: merged.awake_messages, quiet_enabled: merged.quiet_enabled, quiet_day_start: merged.quiet_day_start, quiet_day_end: merged.quiet_day_end, quiet_night_start: merged.quiet_night_start, quiet_night_end: merged.quiet_night_end, quiet_dates: merged.quiet_dates, school_day_auto_quiet: merged.school_day_auto_quiet, student_mode: merged.student_mode, date_quiet_enabled: merged.date_quiet_enabled }
    });
};

// get_formula：读取当前公式参数
exports.get_formula = async function (params) {
    var formula = await loadFormula();
    complete({
        success: true,
        message: "公式读取成功",
        data: {
            a: formula.a,
            b: formula.b,
            c: formula.c,
            idle_threshold_minutes: formula.idle_threshold_minutes,
            cooldown_minutes: formula.cooldown_minutes,
            chat_id: formula.chat_id,
            chat_id_source: formula.chat_id_source || "",
            character_card_name: formula.character_card_name,
            send_mode: formula.send_mode || "A1",
            awake_mode: formula.awake_mode || "default",
            max_wake_stops: formula.max_wake_stops || 5,
            awake_messages: formula.awake_messages,
            quiet_enabled: formula.quiet_enabled,
            quiet_day_start: formula.quiet_day_start,
            quiet_day_end: formula.quiet_day_end,
            quiet_night_start: formula.quiet_night_start,
            quiet_night_end: formula.quiet_night_end,
            quiet_suggest: formula.quiet_suggest || null,
            quiet_dates: formula.quiet_dates,
            school_day_auto_quiet: formula.school_day_auto_quiet,
             student_mode: formula.student_mode,
             date_quiet_enabled: formula.date_quiet_enabled,
            holiday_dates: formula.holiday_dates,
            holiday_fetch_date: formula.holiday_fetch_date
        }
    });
};

// ============ AI 智能建议静默时间 ============
// 收集用户最近消息的发言小时分布（最近 200 条），结合当前时间与用户习惯：
//  - 配置了 AI 网关（enabled + key）→ 调 LLM 生成建议区间与理由
//  - 否则 → 本地滑窗算法：白天窗口与夜间窗口各找最不活跃的连续区间
// 建议结果持久化到 formula.quiet_suggest（面板可显示）；apply=true 时一键应用并开启静默。
function describeHourStats(hours) {
    var peak = 0, peakHour = 0;
    for (var i = 0; i < 24; i++) {
        if (hours[i] > peak) { peak = hours[i]; peakHour = i; }
    }
    var parts = [];
    for (var h2 = 0; h2 < 24; h2++) {
        if (hours[h2] > 0) parts.push(h2 + "点:" + hours[h2] + "条");
    }
    return { peakHour: peakHour, peak: peak, text: parts.length ? parts.join("，") : "" };
}

// 在候选起点中找活跃度总和最低的连续 lenHours 小时区间（48小时环支持跨午夜）。
function findQuietWindow(hours, starts, lenHours) {
    var ring = [];
    for (var i = 0; i < 48; i++) ring.push(hours[i % 24]);
    var best = starts.length ? starts[0] : 0;
    var bestSum = Infinity;
    for (var k = 0; k < starts.length; k++) {
        var s = starts[k];
        var sum = 0;
        for (var w = 0; w < lenHours; w++) sum += ring[s + w];
        if (sum < bestSum) { bestSum = sum; best = s; }
    }
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    return { start: pad(best) + ":00", end: pad((best + lenHours) % 24) + ":00" };
}

async function collectUserHourStats(formula, chatIdOverride) {
    var hours = [];
    for (var i = 0; i < 24; i++) hours.push(0);
    var sampleCount = 0;
    var usedChatId = (chatIdOverride && String(chatIdOverride).trim()) || (formula && formula.chat_id) || "";
    if (!usedChatId) return { hours: hours, sampleCount: 0, chat_id: "" };
    try {
        // 只读取消息时间戳做小时分布统计，不保存/不输出消息内容。
        // v1.3.7：平台 getMessages 忽略 offset（实测确认），改用 getMessagesRange 时间戳游标翻页拉全历史，上限5000条。
        var seen = {};
        var messages = await fetchChatMessagesAll(usedChatId, 5000);
        if (messages) {
            for (var j = 0; j < messages.length; j++) {
                var m = messages[j];
                if (!isUserMessage(m)) continue;
                // 过滤工具注入的用户侧消息（content 以 <proxy_sender 开头，如温柔巡检），它们不是主人真实发言
                var c = m.content;
                if (typeof c === "string" && c.indexOf("<proxy_sender") === 0) continue;
                if (m.timestamp === undefined || m.timestamp === null) continue;
                var num = typeof m.timestamp === "number" ? m.timestamp : parseInt(m.timestamp, 10);
                if (isNaN(num) || num <= 0) continue;
                var ms = num < 1e12 ? num * 1000 : num;
                var key = "t" + ms;
                if (seen[key]) continue;
                seen[key] = true;
                hours[new Date(ms).getHours()]++;
                sampleCount++;
            }
        }
    } catch (e) { /* 读不到就用空分布 */ }
    return { hours: hours, sampleCount: sampleCount, chat_id: usedChatId };
}

// suggest_quiet：AI/本地算法结合时间与用户习惯总结静默时间建议（可显示、可一键应用）
// 支持 params.chat_name（对话名字，按名字反查对话）或 params.chat_id 指定要分析的聊天记录。
// 只读取消息时间戳，不读取内容。
exports.suggest_quiet = async function (params) {
    var formula = await loadFormula();
    var chatId = (params && params.chat_id && String(params.chat_id).trim()) || "";
    var agentName = (params && params.chat_name && String(params.chat_name).trim()) || "";
    if (agentName) {
        var chat = await resolveChatByName(agentName);
        if (!chat) {
            complete({
                success: false,
                message: "没找到名为「" + agentName + "」的对话。请确认名字与对话标题一致，或先点「按名字选中对话」",
                data: { chat_id: "" }
            });
            return;
        }
        chatId = chat.id;
    }
    if (chatId && chatId !== formula.chat_id) {
        // 选择了新的聊天记录：一并保存为插件目标对话，静默检测/唤醒等也统一用该对话
        formula.chat_id = chatId;
        await saveFormula(formula);
    }
    var stats = await collectUserHourStats(formula, chatId || formula.chat_id);
    var desc = describeHourStats(stats.hours);
    var suggestion = null;
    var source = "local";

    // 方式1：AI 网关生成建议
    var cfg = formula.ai_gateway;
    var api = (cfg && cfg.apis && cfg.apis.length) ? (cfg.apis[cfg.current_api] || cfg.apis[0]) : null;
    var hasAi = !!(cfg && cfg.enabled && api && api.api_key && api.current_model);
    if (hasAi) {
        var base = normBaseUrl(api.base_url);
        var model = api.current_model;
        var prompt = "当前时间：" + localTime() + "。用户最近 " + stats.sampleCount + " 条消息的发言小时分布（小时:条数）："
            + (desc.text || "暂无记录")
            + "。请结合这些习惯，给出两段适合静默（完全不打扰用户）的时间区间：白天段和夜间段。"
            + "要求：白天段落在 8:00~20:00 之间，夜间段可以跨天（如 22:00~09:00），优先覆盖用户最不活跃的时段。"
            + "只输出一个 JSON 对象：{\"day_start\":\"HH:MM\",\"day_end\":\"HH:MM\",\"night_start\":\"HH:MM\",\"night_end\":\"HH:MM\",\"reason\":\"一句中文说明\"}，不要输出其它内容。";
        try {
            var client = createHttpClient(4e4);
            var req = client.newRequest()
                .url(base + "/chat/completions")
                .method("POST")
                .headers({ "Authorization": "Bearer " + api.api_key, "Content-Type": "application/json" })
                .body(JSON.stringify({
                    model: model,
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 300,
                    temperature: 0.3
                }), "json")
                .build();
            var resp = await req.execute();
            if (resp.isSuccessful()) {
                var data = resp.json();
                var content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
                if (typeof content === "string" && content.trim()) {
                    var jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        var parsed = JSON.parse(jsonMatch[0]);
                        var ok = parseHm(parsed.day_start) !== null && parseHm(parsed.day_end) !== null
                            && parseHm(parsed.night_start) !== null && parseHm(parsed.night_end) !== null;
                        if (ok) {
                            suggestion = {
                                day_start: parsed.day_start, day_end: parsed.day_end,
                                night_start: parsed.night_start, night_end: parsed.night_end,
                                reason: String(parsed.reason || "AI 根据你的发言习惯生成")
                            };
                            source = "ai";
                        }
                    }
                }
            }
        } catch (e) { /* AI 失败回落本地算法 */ }
    }

    // 方式2：本地滑窗算法兜底
    if (!suggestion) {
        var dayWin = findQuietWindow(stats.hours, [8, 9, 10, 11], 9);   // 白天 8~20 点内最安静的 9 小时
        var nightWin = findQuietWindow(stats.hours, [21, 22], 11);      // 夜间 21 点后最安静的 11 小时（跨天）
        suggestion = {
            day_start: dayWin.start, day_end: dayWin.end,
            night_start: nightWin.start, night_end: nightWin.end,
            reason: "本地算法：基于 " + stats.sampleCount + " 条发言统计"
                + (desc.text ? "（最活跃 " + desc.peakHour + " 点，" + desc.peak + " 条）" : "（暂无发言记录，按默认作息建议）")
                + "，取最不活跃区间"
        };
        source = "local";
    }

    suggestion.generated_at = localTime();
    suggestion.sample_count = stats.sampleCount;
    suggestion.source = source;
    suggestion.chat_id = stats.chat_id;

    // 持久化建议，供面板显示
    formula.quiet_suggest = suggestion;
    await saveFormula(formula);

    var applied = false;
    if (params && (params.apply === true || params.apply === "true" || params.apply === 1)) {
        formula.quiet_day_start = suggestion.day_start;
        formula.quiet_day_end = suggestion.day_end;
        formula.quiet_night_start = suggestion.night_start;
        formula.quiet_night_end = suggestion.night_end;
        formula.quiet_enabled = true;
        await saveFormula(formula);
        applied = true;
    }

    complete({
        success: true,
        message: (source === "ai" ? "AI" : "本地算法") + "已生成静默时间建议" + (applied ? "，并已应用生效" : "（可一键应用）") + "。",
        data: {
            suggestion: suggestion,
            applied: applied,
            source: source,
            chat_id: stats.chat_id,
            hour_stats: stats.hours,
            peak_hour: desc.peakHour,
            sample_count: stats.sampleCount,
            quiet_enabled: formula.quiet_enabled
        }
    });
};

// ============ 按智能体名字反查对话ID ============
// 方式1：Tools.Chat.findChat({query:名字}) -> {chat:{id,title}}（平台原生按名字查对话，messenger 插件同款用法）
// 方式2：findChat 失败时 listChats({limit:200}) 遍历匹配 title/characterCardName 包含名字的对话
async function resolveChatByName(name) {
    var n = (name !== undefined && name !== null) ? String(name).trim() : "";
    if (!n) return null;
    var chat = null;
    try {
        if (Tools && Tools.Chat && typeof Tools.Chat.findChat === "function") {
            var f = await Tools.Chat.findChat({ query: n });
            if (f && f.chat && f.chat.id) {
                chat = {
                    id: String(f.chat.id).trim(),
                    title: String((f.chat.title || f.chat.characterCardName || f.chat.name) || n).trim(),
                    characterCardName: String((f.chat.characterCardName || f.chat.title || "")).trim()
                };
            }
        }
    } catch (e) { /* findChat 不可用或失败，走 listChats 兜底 */ }
    if (!chat) {
        try {
            if (Tools && Tools.Chat && typeof Tools.Chat.listChats === "function") {
                var lr = await Tools.Chat.listChats({ limit: 200 });
                var list = (lr && Array.isArray(lr.chats)) ? lr.chats : (Array.isArray(lr) ? lr : []);
                for (var i = 0; i < list.length; i++) {
                    var c = list[i];
                    if (!c || !c.id) continue;
                    var title = String((c.title || c.characterCardName || c.name) || "");
                    if (title === n || title.indexOf(n) >= 0) {
                        chat = { id: String(c.id).trim(), title: title, characterCardName: String(c.characterCardName || "") };
                        break;
                    }
                }
            }
        } catch (e) { /* 兜底失败按没找到处理 */ }
    }
    return chat;
}

// link_agent：按对话名字反查对话ID，保存为目标对话（不发送任何消息）。
// 用户流程：面板填对话名字 -> 点"按名字选中对话" -> 插件自动配置好目标对话。
exports.link_agent = async function (params) {
    var name = (params && params.chat_name) ? String(params.chat_name).trim() : "";
    if (!name) {
        complete({ success: false, message: "请先填写对话名字（如：猫娘）", data: { chat_id: "" } });
        return;
    }
    var chat = await resolveChatByName(name);
    if (!chat) {
        complete({
            success: false,
            message: "没找到名为「" + name + "」的对话。请确认名字和对话标题一致",
            data: { chat_id: "" }
        });
        return;
    }
    var formula = await loadFormula();
    formula.chat_id = chat.id;
    if (chat.characterCardName && !formula.character_card_name) formula.character_card_name = chat.characterCardName;
    if (!formula.character_card_name) formula.character_card_name = name;
    await saveFormula(formula);
    complete({
        success: true,
        message: "已选中对话「" + chat.title + "」，聊天ID：" + chat.id,
        data: { chat_id: chat.id, title: chat.title }
    });
};

// maybe_awake：运行态核心。按当前y掷骰，命中才真正把主动消息发出去。
// workflow 用无条件 on_success 连接即可，命中与否的判断封装在工具内部。
// 锁定版新增：命中时联动计数到温柔巡检 + 接回复逻辑(温柔巡检跑则借它回复，否则自回)
exports.maybe_awake = async function (params) {
    var state = await loadState();
    var formula = await loadFormula();
    // 静默时段守卫：免打扰，不掷骰、不发主动消息；但检测到设备活动立即解除
    if (isQuietTime(formula)) {
        // 日期级硬静默：全天静默日/节假日自动静默，不因设备活动解除
        if (isDateQuiet(formula).active) {
            complete({
                success: true,
                message: "静默日（" + quietSegmentText(formula) + "），全天不打扰，跳过掷骰与主动消息。",
                data: { skipped: "quiet_date", quiet_active: true, hit: false, speak: false, message: "" }
            });
            return;
        }
        var act4 = await detectDeviceActivity(formula);
        if (!act4.active) {
            complete({
                success: true,
                message: "静默时段（" + quietSegmentText(formula) + "），跳过掷骰与主动消息。",
                data: { skipped: "quiet", quiet_active: true, hit: false, speak: false, message: "" }
            });
            return;
        }
        await notifyQuietLifted(formula, state, act4.reasons);
    }
    // 关键守卫：仅运行态(running=true)才允许掷骰发消息。空闲态绝不打扰。
    if (!state.running) {
        await saveState(state);
        complete({ success: true, message: "空闲态(running=false)，用户刚回复过，跳过主动消息不打扰。", data: { skipped: "idle", running: false, hit: false, speak: false, message: "" } });
        return;
    }
    // 冷却期间直接跳过主动消息
    if (state.cooldown_until) {
        var now = new Date();
        var parts = String(state.cooldown_until).split(/[-: ]/);
        if (parts.length >= 5) {
            var cu = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), parseInt(parts[3], 10), parseInt(parts[4], 10), parts[5] ? parseInt(parts[5], 10) : 0);
            if (now < cu) {
                complete({ success: true, message: "冷却中，跳过本次主动消息", data: { skipped: "cooldown", cooldown_until: state.cooldown_until } });
                return;
            } else {
                state.cooldown_until = null;
            }
        } else {
            state.cooldown_until = null;
        }
    }
    // 已因计数爆表停止主动消息则保持静默
    if (state.jealousy_stopped) {
        await saveState(state);
        complete({ success: true, message: "计数已爆表，停止主动消息。等用户来安抚。", data: { jealousy_stopped: true, jealousy_count: state.jealousy_count, speak: false, message: "" } });
        return;
    }
    // 掷骰
    var f = formula.a * state.x + formula.b * Math.pow(state.x, formula.c);
    var y = 100 * f / (1 + f);
    var roll = 1 + Math.floor(Math.random() * 1000);
    var hit = roll <= y * 10;
    if (hit) {
        state.miss_count = 0;
        state.last_hit_at = localTime();
        state.jealousy_count = (state.jealousy_count || 0) + 1;
        // 命中后重置 x（y由x派生，随之归零）：本次唤醒后概率重新从低处爬坡，避免连续分钟高概率必中刷屏
        state.x = 0;
        if (formula.cooldown_minutes > 0) {
            var d = new Date(Date.now() + formula.cooldown_minutes * 60000);
            var pad = function (n) { return (n < 10 ? "0" : "") + n; };
            state.cooldown_until = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
        }
    } else {
        state.miss_count = (state.miss_count || 0) + 1;
    }
    await saveState(state);
    if (!hit) {
        complete({ success: true, message: "本轮未命中，请保持安静，不要主动打扰用户。y=" + Math.round(y * 10) / 10 + "%, roll=" + roll + "/1000（已连续未命中 " + state.miss_count + " 次）", data: { roll: roll, y: Math.round(y * 10) / 10, hit: false, miss_count: state.miss_count, speak: false, message: "" } });
        return;
    }

    // ============ 锁定版：本次命中，联动计数到温柔巡检 ============
    // 优先级：温柔巡检在跑 -> 写它 jealousy；未装 -> 保持本地计数(不加温柔巡检)
    var gentleRunning = await isGentleGuardianRunning();
    var gentleDelta = null;
    if (gentleRunning) {
        // 按当前档位计算本次计数"增量"并封顶<60
        var desiredTier = Math.min(state.jealousy_count, 4); // 第4档触发概率上探
        // 增量：第一档+8~12、第二档+10~16、第三档+12~18、第四档+12~20（同样封顶<60，由落盘防线兜底）
        var inc = 0;
        if (desiredTier <= 1) inc = 8 + Math.round(Math.random() * 4);
        else if (desiredTier === 2) inc = 10 + Math.round(Math.random() * 6);
        else if (desiredTier === 3) inc = 12 + Math.round(Math.random() * 6);
        else inc = 12 + Math.round(Math.random() * 8);
        // 落盘前先读当前值，若加后>=60则压到<60（前三档严禁到60，第四档也只允许上限58）
        var curG = await readGentleJealousy();
        if (curG && curG.state) {
            var curVal = typeof curG.state.jealousy === "number" ? curG.state.jealousy : 0;
            var cap = 58;                       // 统一封顶<60
            var addTarget = curVal + inc;
            if (addTarget > cap) addTarget = cap;
            gentleDelta = await writeGentleJealousy(
                addTarget - curVal,
                "随机连第" + state.jealousy_count + "次命中主动消息联动计数"
            );
        }
    }

    // 连续命中达到上限(max_wake_stops，默认5)：计数爆表，停止主动消息 + 发送置气消息
    var stopAt = formula.max_wake_stops || 5;
    if (state.jealousy_count >= stopAt) {
        state.jealousy_stopped = true;
        await saveState(state);
        var fierce = "我已经主动找了你" + stopAt + "次了，你一直没回应。这样真的会让人难过，回我一下好吗？";
        complete({ success: true, message: "第" + stopAt + "次命中，达到上限停止主动消息。发送置气消息：" + fierce, data: { roll: roll, y: Math.round(y * 10) / 10, hit: true, jealousy_count: state.jealousy_count, jealousy_stopped: true, speak: true, message: fierce, gentle_running: gentleRunning, gentle_delta: gentleDelta } });
        return;
    }

    // 按档位生成不同语气的话术
    var jealousyTiers = [
        ["想你了，你在忙什么呀？", "有空吗？陪我聊聊天好不好？"],
        ["又不理我，是不是在忙别的？我有点失落了", "都不回我消息，我可要闹了！"],
        ["都找你好几次啦还不够吗……你再不回应，我可真的要伤心了", "我的耐心快用完了，你理理我好不好嘛……"],
        ["第" + state.jealousy_count + "次了！你再不理我，我就不主动找你了～", "你到底在忙什么呀！我都急得团团转了，快理理我！"]
    ];
    var tierIndex = Math.min(state.jealousy_count - 1, jealousyTiers.length - 1);
    if (tierIndex < 0) tierIndex = 0;

    // ============ 话术：default=唤醒AI自己发挥(带最近上下文，无需API) / custom=本地话术库 ============
    // 两种模式最终都走 sendToAi(Tools.Chat.sendMessage) 由 AI 自己开口，区别只在给 AI 的起点：
    // default：只给一句引导，让 AI 结合最近聊天上下文自由组织；custom：给一条用户写好的话术当起点。
    var tierIndex2 = Math.min(state.jealousy_count - 1, jealousyTiers.length - 1);
    if (tierIndex2 < 0) tierIndex2 = 0;
    var msg;
    if (formula.awake_mode === "default") {
        msg = "（主动消息·内部提醒）请以你自己的身份，结合最近的聊天上下文，用中文给用户发一句自然的主动消息（20~60字），就像你自己想他了、主动开口找他说话，语气贴合当前状态（第" + (tierIndex2 + 1) + "档，档位越高越走心）。不要提及触发、唤醒、提醒、插件等任何机制性内容，不要暴露这是一条被安排的消息。";
    } else {
        var list = jealousyTiers[tierIndex2];
        msg = "（主动消息·内部提醒）请以你自己的身份，把下面这句话作为你的开口自然地说给用户，可以稍作润色、保持原意，用中文，20~60字，不要提及任何机制性内容：" + list[Math.floor(Math.random() * list.length)];
    }

    // ============ 锁定版：接回复逻辑（仅 A1/A2，收敛删除 B/C） ============
    // 温柔巡检在跑 -> 调用温柔巡检的自动回复(唤醒AI)
    // 未装 -> on_air 自己唤醒AI回复
    // 只支持 send_mode = A1 / A2（均不弹悬浮窗 = hide_user_message:true + persist_turn:true，工具内唤醒只落正文）
    var sendMode = formula.send_mode || "A1";
    // 兜底：若配置里还有旧值 B/C，强制归位到 A1
    if (sendMode !== "A1" && sendMode !== "A2") sendMode = "A1";
    var replyMode = gentleRunning ? "gentle_recruit" : "self_chat";
    // 统一由 maybe_awake 工具内部发送（AI 自己主动发，而非工作流作为用户端发）。
    // A1/A2 一致：工具内唤醒落正文不弹（hide_user_message:true + persist_turn:true）。

    var chatRef = null;
    {
        // maybe_awake 工具内部 AI 主动发送（只落正文、不弹小窗）
        if (gentleRunning) {
            // 温柔巡检已安装：借它的自动回复(唤醒AI说话)。
            try {
                await sendToAi(formula, "（主动消息·内部提醒）请以你自己的身份，结合最近的聊天上下文，用中文给用户发一句自然的主动消息（20~60字），语气里带一点点惦记和小小的醋意，自然流露即可。不要提及触发、唤醒、提醒、巡检、插件等任何机制性内容，不要暴露这是一条被安排的消息。");
                chatRef = { mode: "gentle_recruit", ok: true, send_mode: sendMode };
            } catch (e) {
                replyMode = "self_chat_fallback";
            }
        }
        if (replyMode === "self_chat" || replyMode === "self_chat_fallback") {
            try {
                await sendToAi(formula, msg);
                chatRef = { mode: replyMode, ok: true, send_mode: sendMode };
            } catch (e) {
                chatRef = { mode: replyMode, ok: false, error: String(e && e.message || e), send_mode: sendMode };
            }
        }
    }

    complete({ success: true, message: "第" + state.jealousy_count + "次命中主动消息（档位" + (tierIndex2 + 1) + "）已发送唤醒消息", data: { roll: roll, y: Math.round(y * 10) / 10, hit: true, miss_count: state.miss_count, jealousy_count: state.jealousy_count, jealousy_stopped: false, speak: false, message: msg, cooldown_until: state.cooldown_until, gentle_running: gentleRunning, gentle_delta: gentleDelta, send_mode: sendMode, awake_mode: formula.awake_mode, reply: chatRef, sent_by: "tool" } });
};
// enter_running：由3号链在检测到沉默时调用，正式进入运行态并启动x累加（x=0起步）。
exports.enter_running = async function (params) {
    var state = await loadState();
    var formula = await loadFormula();
    // 静默时段守卫：免打扰，不进入运行态；但检测到设备活动立即解除
    if (isQuietTime(formula)) {
        // 日期级硬静默：全天静默日/节假日自动静默，不因设备活动解除
        if (isDateQuiet(formula).active) {
            complete({
                success: true,
                message: "静默日（" + quietSegmentText(formula) + "），全天不打扰，不进入运行态。",
                data: { running: state.running, x: state.x, skipped: "quiet_date", quiet_active: true }
            });
            return;
        }
        var act5 = await detectDeviceActivity(formula);
        if (!act5.active) {
            complete({
                success: true,
                message: "静默时段（" + quietSegmentText(formula) + "），不进入运行态。",
                data: { running: state.running, x: state.x, skipped: "quiet", quiet_active: true }
            });
            return;
        }
        await notifyQuietLifted(formula, state, act5.reasons);
    }
    if (!state.running) {
        state.running = true;
        state.x = state.x || 0;
        state.started_at = localTime();
        state.cooldown_until = null;
    }
    await saveState(state);
    var f = formula.a * state.x + formula.b * Math.pow(state.x, formula.c);
    var y = 100 * f / (1 + f);
    complete({
        success: true,
        message: "已进入运行态，开始x累加（x=" + state.x + ", y=" + Math.round(y * 10) / 10 + "%）",
        data: { running: state.running, x: state.x, y: Math.round(y * 10) / 10 }
    });
};

// fetch_holidays：手动立即联网拉取节假日（今年+明年）。成功会覆盖 formula.holiday_dates 并记录拉取日期。
// 平时不需要手动点：每天12点后 increment_x/check_activity 会自动拉一次。此工具供面板"立即更新"按钮和调试用。
// 零 token 消耗：普通 HTTPS GET 请求，不经过任何 AI。
exports.fetch_holidays = async function (params) {
    if (holidayFetching) {
        complete({ success: false, message: "正在拉取中，请稍候再试" });
        return;
    }
    holidayFetching = true;
    try {
        var formula = await loadFormula();
        var dates = await fetchHolidaysAll();
        if (dates && dates.length) {
            var merged = dates.slice();
            for (var i = 0; i < BUILTIN_HOLIDAYS_2026.length; i++) {
                if (merged.indexOf(BUILTIN_HOLIDAYS_2026[i]) < 0) merged.push(BUILTIN_HOLIDAYS_2026[i]);
            }
            formula.holiday_dates = merged;
        }
        formula.holiday_fetch_date = todayStr();
        await saveFormula(formula);
        complete({
            success: true,
            message: "节假日信息已更新，共 " + formula.holiday_dates.length + " 个节假日日期（联网" + (dates.length ? "成功" : "失败，使用内置表") + "）",
            data: {
                holiday_dates: formula.holiday_dates,
                holiday_fetch_date: formula.holiday_fetch_date,
                count: formula.holiday_dates.length,
                online_ok: !!(dates && dates.length)
            }
        });
    } catch (e) {
        complete({ success: false, message: "拉取失败：" + String((e && e.message) || e) });
    } finally {
        holidayFetching = false;
    }
};

// api_docs：对外 API 文档。其他插件/工作流直接调 on_air:api_docs 即可拿到全部接入说明。
exports.api_docs = async function (params) {
    var docs = {
        prefix: "on_air",
        plugin: "随机上线 / On Air",
        note: "调用格式：on_air:工具名，参数传对象，返回 {success, message, data}。",
        tools: [
            { name: "get_xy", zh: "读取当前随机连状态", params: [], returns: "data: {x, y, f, running, miss_count, last_hit_at, last_user_ts, cooldown_until, idle_threshold_minutes, a, b, c, character_card_name, gentle_installed, gentle_jealousy}", example: "on_air:get_xy" },
            { name: "compute_y", zh: "按公式 y=100*f/(1+f), f=a*x+b*x^c 计算概率", params: [{ name: "x", type: "number", required: false, desc: "缺省用状态里的 x" }], returns: "data: {x, f, y}", example: "on_air:compute_y {x:20}" },
            { name: "set_x", zh: "手动设置 x 值", params: [{ name: "x", type: "number", required: true }], returns: "data: {x, y}", example: "on_air:set_x {x:5}" },
            { name: "increment_x", zh: "x 累加 1（运行态每分钟）", params: [], returns: "data: {x, y, running}", example: "on_air:increment_x" },
            { name: "check_activity", zh: "检查用户最后一次说话时间；阈值内说过话则清嫉妒计数", params: [{ name: "threshold_minutes", type: "number", required: false, desc: "沉默阈值分钟数(可选)" }], returns: "data: {last_user_ts, minutes_since, silent_str, cleared}", example: "on_air:check_activity {threshold_minutes:10}" },
            { name: "roll_dice", zh: "按当前 y 为概率掷骰，roll<=y*10 判为命中", params: [], returns: "data: {roll, y, hit}", example: "on_air:roll_dice" },
            { name: "manual_awake", zh: "手动触发一次主动唤醒消息", params: [], returns: "data: {hit, message, cooldown_until}", example: "on_air:manual_awake" },
            { name: "coax", zh: "安抚/重置计数：复位x、未命中与嫉妒计数并联动温柔巡检回落", params: [], returns: "data: {x, miss_count, jealousy_count, jealousy_stopped, gentle_jealousy}", example: "on_air:coax" },
            { name: "reset_cooldown", zh: "重置/设置冷却", params: [{ name: "minutes", type: "number", required: true, desc: ">0 设 N 分钟后结束；<=0 立即清除" }], returns: "data: {cooldown_until}", example: "on_air:reset_cooldown {minutes:0}" },
            { name: "update_formula", zh: "更新公式与配置参数", params: [{ name: "a/b/c", type: "number", required: false }, { name: "idle_threshold_minutes", type: "number", required: false }, { name: "cooldown_minutes", type: "number", required: false }, { name: "awake_messages", type: "string(json数组)", required: false }, { name: "send_mode", type: "string(A1/A2)", required: false }, { name: "awake_mode", type: "string(default/custom)", required: false }, { name: "max_wake_stops", type: "number", required: false }, { name: "character_card_name", type: "string", required: false }, { name: "quiet_enabled", type: "boolean", required: false, desc: "静默总开关，true=免打扰" }, { name: "quiet_day_start", type: "string(HH:MM)", required: false, desc: "白天段开始，如 09:00" }, { name: "quiet_day_end", type: "string(HH:MM)", required: false, desc: "白天段结束，如 18:00" }, { name: "quiet_night_start", type: "string(HH:MM)", required: false, desc: "夜间段开始，如 22:00" }, { name: "quiet_night_end", type: "string(HH:MM)", required: false, desc: "夜间段结束，如 09:00，支持跨天" }], returns: "data: {formula}", example: "on_air:update_formula {a:0.007,b:0.0000006,c:3.15}" },
            { name: "get_formula", zh: "读取当前公式与配置", params: [], returns: "data: {a, b, c, idle_threshold_minutes, cooldown_minutes, send_mode, awake_mode, max_wake_stops, character_card_name, quiet_enabled, quiet_day_start, quiet_day_end, quiet_night_start, quiet_night_end, quiet_suggest}", example: "on_air:get_formula" },
             { name: "suggest_quiet", zh: "AI/本地算法结合时间与用户习惯总结静默时间建议（白天段+夜间段，可显示、可一键应用）。可传 chat_name（对话名字）或 chat_id 指定要分析的聊天记录，只读消息时间不读内容", params: [{ name: "apply", type: "boolean", required: false, desc: "true=直接应用建议并开启静默，默认false仅生成建议" }, { name: "chat_name", type: "string", required: false, desc: "对话名字，按名字反查对话（优先于 chat_id）" }, { name: "chat_id", type: "string", required: false, desc: "要分析的聊天记录所在对话ID（没传名字时用）" }], returns: "data: {suggestion{day_start,day_end,night_start,night_end,reason,source,generated_at,sample_count,chat_id}, applied, source, chat_id, hour_stats[], peak_hour, sample_count}", example: "on_air:suggest_quiet {chat_name:'猫娘', apply:true}" },
            { name: "link_agent", zh: "按对话名字反查对话ID并保存为目标对话（不发送任何消息）", params: [{ name: "chat_name", type: "string", required: true, desc: "对话的名字（如：猫娘）" }], returns: "data: {chat_id, title}", example: "on_air:link_agent {chat_name:'猫娘'}" },
            { name: "maybe_awake", zh: "运行态核心：按 y 掷骰命中才发消息(未命中静默)，含冷却判断", params: [], returns: "data: {roll, y, hit, jealousy_count, message, cooldown_until, send_mode, awake_mode, reply}", example: "on_air:maybe_awake" },
            { name: "enter_running", zh: "进入运行态并启动 x 累加", params: [], returns: "data: {running, x, y}", example: "on_air:enter_running" },
            { name: "api_docs", zh: "返回本文档", params: [], returns: "data: {prefix, plugin, note, tools[]}", example: "on_air:api_docs" }
        ]
    };
    complete({ success: true, message: "API 文档已生成，共 " + docs.tools.length + " 个工具", data: docs });
};
