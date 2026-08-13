/*
METADATA
{
    "name": "random_chain",
    "display_name": {
        "zh": "随机连三链",
        "en": "Random Chain"
    },
    "description": {
        "zh": "随机连三链系统：空闲态每15分钟查日志判断用户是否沉默，运行态每分钟x累加、按公式算y(概率)、掷骰子命中则主动发消息。支持面板实时查看xy状态、手动触发、公式编辑与冷却配置。",
        "en": "Random triple-chain system: idle checks logs every 15min, running increments x each minute, computes y via formula, rolls dice to call owner proactively."
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
            "description": { "zh": "安抚：复位连续未回复计数（jealousy_count/jealousy_stopped清零），并联动温柔巡检回落", "en": "Coax: reset jealousy and link gentle guardian" },
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
                 { "name": "awake_mode", "type": "string", "description": "话术模式：default=唤醒AI自己发挥(带最近上下文，无需API) / custom=用本地自定义话术库", "required": false },
                  { "name": "max_wake_stops", "type": "number", "description": "连续命中主动消息停止上限(默认5；装有温柔巡检时可改为4给温柔巡检让位)", "required": false },
                  { "name": "character_card_name", "type": "string", "description": "角色卡名字：唤醒时按名字定位角色卡（留空=跟随当前对话绑定的角色卡）", "required": false }
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
            "name": "api_docs",
            "description": { "zh": "返回全部工具的 API 文档（名称、参数、返回格式、调用示例），供其他插件/工作流接入", "en": "Return full API docs of all tools for other plugins" },
            "parameters": []
        }
    ]
}
*/

/*
 * random_chain — 随机连三链系统的业务逻辑层
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
 *   - 工具被框架自动注册暴露，workflow 可直接调用 random_chain:xxx
 */

// ============ 路径常量：全插件只定义这一次 ============
var BASE_DIR = "/sdcard/Download/Operit/plugins/random_chain/";
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
    }
};

// ============ 时间工具：本地时间 ============
function localTime() {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " +
        pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
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

// 取最近聊天消息作为上下文（尽力而为，失败则返回空串）
async function getRecentChatContext(formula) {
    try {
        if (Tools && Tools.Chat && typeof Tools.Chat.getMessages === "function") {
            var msgs = await Tools.Chat.getMessages({
                chat_id: formula.chat_id,
                limit: 12
            });
            if (msgs && Array.isArray(msgs) && msgs.length) {
                // 取正文文本，简单拼成对话上下文
                var lines = [];
                for (var i = 0; i < msgs.length; i++) {
                    var m = msgs[i];
                    var role = (m && (m.role === "user" ? "用户" : m.role === "assistant" ? "AI" : "系统")) || "未知";
                    var text = (m && (m.content || m.text || m.message)) || "";
                    if (typeof text !== "string") text = String(text);
                    if (text) lines.push(role + ": " + text);
                }
                if (lines.length) return lines.slice(-12).join("\n");
            }
        }
    } catch (e) { /* 静默失败 */ }
    return "";
}

// 直调 AI 网关生成话术。成功返回 { ok:true, msg }；失败返回 { ok:false, error }（key/base_url 不进返回）。
async function callAiGateway(formula, state, gentleRunning, gentleDelta, tierIndex) {
    var cfg = formula.ai_gateway;
    if (!cfg || !cfg.apis || !cfg.apis.length) return { ok: false, error: "AI 网关未配置" };
    var api = cfg.apis[cfg.current_api] || cfg.apis[0];
    var base = normBaseUrl(api && api.base_url);
    var key = (api && api.api_key) || "";
    var model = (api && api.current_model) || "";
    if (!base || !base.trim()) return { ok: false, error: "缺少 BaseURL" };
    if (!key) return { ok: false, error: "先到 AI 网关面板填入 API Key" };
    if (!model) return { ok: false, error: "未选择模型（可先点『自动探测模型』）" };

    // 组装 system prompt：AI 身份 + 计数档位 + 温柔巡检状态
    var tier = (typeof tierIndex === "number" ? tierIndex : 0) + 1;
    var systemPrompt = "你是一个常驻的 AI 助手，现在要通过一条消息主动给用户发一句问候。"
        + "请以你自己的身份、用自然友好的语气（可以关心近况/找话题/轻轻提醒），"
        + "自然地说出一句话来引起用户注意。这次是主动消息，不是聊天对话。"
        + "语气要贴合当前计数档位（第" + tier + "档，档位越高越要认真走心），"
        + (gentleRunning ? "当前温柔巡检正在联动（计数已同步）。" : "")
        + "请只直接输出你想对用户说的那句话本身（一句话，不要太长，20~60字左右），不要加引号、不要加前缀、不要解释。"
        + "必须用中文输出。"

    var ctx = await getRecentChatContext(formula);
    var userPrompt = (ctx ? "最近聊天对话：\n" + ctx + "\n\n" : "")
        + "输出一句你想对用户说的话：";

    try {
        var client = createHttpClient(4e4);
        var req = client.newRequest()
            .url(base + "/chat/completions")
            .method("POST")
            .headers({
                "Authorization": "Bearer " + key,
                "Content-Type": "application/json"
            })
            .body(JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                max_tokens: 120,
                temperature: 1.1
            }), "json")
            .build();
        var resp = await req.execute();
        if (!resp.isSuccessful()) {
            return { ok: false, error: "API HTTP " + resp.statusCode + " " + (resp.statusMessage || "") };
        }
        var data = resp.json();
        var content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (typeof content !== "string" || !content.trim()) {
            return { ok: false, error: "AI 未返回内容" };
        }
        var msg = content.trim();
        // 去可能的引号包裹
        msg = msg.replace(/^["“”]+|["“”]+$/g, "").trim();
        // 限制长度，避免刷屏
        if (msg.length > 120) msg = msg.slice(0, 120);
        return { ok: true, msg: msg, model: model };
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
// 若未安装 -> random_chain 自己维护计数(回退到本地的 partial_jealousy)。
// 不融合温柔巡检的档位惩罚（hide60=藏应用 / coax90=停用），只借用它的数值存储。
// random_chain 自己的计数档位：前三档(1/2/3)封顶 <60，第四档概率往60上靠但不必然到60。

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
        // 这里由 random_chain 先算好 delta，保证结果<60，传输只负责落盘
        var newVal = Math.max(0, Math.round((state.jealousy + delta) * 10) / 10);
        if (!Array.isArray(state.history)) state.history = [];
        state.history.push({
            time: localTime(),
            delta: Math.round(delta * 10) / 10,
            value: newVal,
            reason: reason || "随机连三链联动计数"
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
// random_chain 自己的计数档位：前三档的"数值"封顶 <60（绝不触发 hide60 藏应用）；
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

// ============ 读取用户最后说话时间(实时)：读对话最后消息，返回最后一条 user 消息的毫秒时间戳 ============
// 数据源：Tools.Chat.getMessages(chatId, {order:'desc', limit:8})，与平台对话模块同源。
// 若读取失败或读不到 user 消息，返回 null；此时上层按"未知"处理。
async function readLastUserTs() {
    try {
        var formula = await loadFormula();
        if (!formula.chat_id) return null;
        var result = await Tools.Chat.getMessages(formula.chat_id, { order: "desc", limit: 8 });
        var messages = result && result.messages;
        if (!messages || !Array.isArray(messages)) return null;
        for (var i = 0; i < messages.length; i++) {
            var m = messages[i];
            if (m && m.sender === "user" && m.timestamp) {
                return m.timestamp;
            }
        }
        return null;
    } catch (e) {
        return null;
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
            gentle_jealousy: gentleJealousy
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

// increment_x：x累加1。运行态每分钟调用一次
exports.increment_x = async function (params) {
    var state = await loadState();
    var formula = await loadFormula();
    // 进入运行态就自动标记，并清除冷却
    state.x = state.x + 1;
    state.running = true;
    if (!state.started_at) state.started_at = localTime();
    if (state.cooldown_until) state.cooldown_until = null; // 进入累加即解除冷却
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
        message: "手动触发主动消息一次（已发送唤醒消息）",
        data: { x: state.x, last_hit_at: state.last_hit_at, message: msg, reply: chatRef, sent_by: "tool" }
    });
};

// coax：安抚重置。复位随机连自身计数（jealousy_count/jealousy_stopped 清零），并联动温柔巡检回落。
exports.coax = async function (params) {
    var state = await loadState();
    state.jealousy_count = 0;
    state.jealousy_stopped = false;
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
        message: "安抚完成" + gentleMsg,
        data: { jealousy_count: 0, jealousy_stopped: false }
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
    var merged = {};
    var k;
    for (k in formula) merged[k] = formula[k];
    for (k in patch) merged[k] = patch[k];
    await saveFormula(merged);
    complete({
        success: true,
        message: "公式参数已更新",
        data: { a: merged.a, b: merged.b, c: merged.c, idle_threshold_minutes: merged.idle_threshold_minutes, cooldown_minutes: merged.cooldown_minutes, send_mode: merged.send_mode, max_wake_stops: merged.max_wake_stops, character_card_name: merged.character_card_name || "", awake_messages: merged.awake_messages }
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
            awake_messages: formula.awake_messages
        }
    });
};

// maybe_awake：运行态核心。按当前y掷骰，命中才真正把主动消息发出去。
// workflow 用无条件 on_success 连接即可，命中与否的判断封装在工具内部。
// 锁定版新增：命中时联动计数到温柔巡检 + 接回复逻辑(温柔巡检跑则借它回复，否则自回)
exports.maybe_awake = async function (params) {
    var state = await loadState();
    var formula = await loadFormula();
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
    // 未装 -> random_chain 自己唤醒AI回复
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

// api_docs：对外 API 文档。其他插件/工作流直接调 random_chain:api_docs 即可拿到全部接入说明。
exports.api_docs = async function (params) {
    var docs = {
        prefix: "random_chain",
        plugin: "随机连三链 / Random Chain",
        note: "调用格式：random_chain:工具名，参数传对象，返回 {success, message, data}。",
        tools: [
            { name: "get_xy", zh: "读取当前随机连状态", params: [], returns: "data: {x, y, f, running, miss_count, last_hit_at, last_user_ts, cooldown_until, idle_threshold_minutes, a, b, c, character_card_name, gentle_installed, gentle_jealousy}", example: "random_chain:get_xy" },
            { name: "compute_y", zh: "按公式 y=100*f/(1+f), f=a*x+b*x^c 计算概率", params: [{ name: "x", type: "number", required: false, desc: "缺省用状态里的 x" }], returns: "data: {x, f, y}", example: "random_chain:compute_y {x:20}" },
            { name: "set_x", zh: "手动设置 x 值", params: [{ name: "x", type: "number", required: true }], returns: "data: {x, y}", example: "random_chain:set_x {x:5}" },
            { name: "increment_x", zh: "x 累加 1（运行态每分钟）", params: [], returns: "data: {x, y, running}", example: "random_chain:increment_x" },
            { name: "check_activity", zh: "检查用户最后一次说话时间；阈值内说过话则清嫉妒计数", params: [{ name: "threshold_minutes", type: "number", required: false, desc: "沉默阈值分钟数(可选)" }], returns: "data: {last_user_ts, minutes_since, silent_str, cleared}", example: "random_chain:check_activity {threshold_minutes:10}" },
            { name: "roll_dice", zh: "按当前 y 为概率掷骰，roll<=y*10 判为命中", params: [], returns: "data: {roll, y, hit}", example: "random_chain:roll_dice" },
            { name: "manual_awake", zh: "手动触发一次主动唤醒消息", params: [], returns: "data: {hit, message, cooldown_until}", example: "random_chain:manual_awake" },
            { name: "coax", zh: "安抚：复位嫉妒计数并联动温柔巡检回落", params: [], returns: "data: {jealousy_count, jealousy_stopped, gentle_jealousy}", example: "random_chain:coax" },
            { name: "reset_cooldown", zh: "重置/设置冷却", params: [{ name: "minutes", type: "number", required: true, desc: ">0 设 N 分钟后结束；<=0 立即清除" }], returns: "data: {cooldown_until}", example: "random_chain:reset_cooldown {minutes:0}" },
            { name: "update_formula", zh: "更新公式与配置参数", params: [{ name: "a/b/c", type: "number", required: false }, { name: "idle_threshold_minutes", type: "number", required: false }, { name: "cooldown_minutes", type: "number", required: false }, { name: "awake_messages", type: "string(json数组)", required: false }, { name: "send_mode", type: "string(A1/A2)", required: false }, { name: "awake_mode", type: "string(default/custom)", required: false }, { name: "max_wake_stops", type: "number", required: false }, { name: "character_card_name", type: "string", required: false }], returns: "data: {formula}", example: "random_chain:update_formula {a:0.007,b:0.0000006,c:3.15}" },
            { name: "get_formula", zh: "读取当前公式与配置", params: [], returns: "data: {a, b, c, idle_threshold_minutes, cooldown_minutes, send_mode, awake_mode, max_wake_stops, character_card_name}", example: "random_chain:get_formula" },
            { name: "maybe_awake", zh: "运行态核心：按 y 掷骰命中才发消息(未命中静默)，含冷却判断", params: [], returns: "data: {roll, y, hit, jealousy_count, message, cooldown_until, send_mode, awake_mode, reply}", example: "random_chain:maybe_awake" },
            { name: "enter_running", zh: "进入运行态并启动 x 累加", params: [], returns: "data: {running, x, y}", example: "random_chain:enter_running" },
            { name: "api_docs", zh: "返回本文档", params: [], returns: "data: {prefix, plugin, note, tools[]}", example: "random_chain:api_docs" }
        ]
    };
    complete({ success: true, message: "API 文档已生成，共 " + docs.tools.length + " 个工具", data: docs });
};
