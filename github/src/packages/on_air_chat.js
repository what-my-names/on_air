/*
 * on_air_chat.js — 平台消息读写 / 发送通道 / 多对话辅助
 * v2.2.2+1：从 on_air.js 拆出
 * 无外部依赖：宿主全局 Tools
 */
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

// 目标对话：chat_ids 非空=逐个指定对话发送；空=当前对话
function targetChatIds(formula) {
    var arr = (formula && Array.isArray(formula.chat_ids)) ? formula.chat_ids : [];
    var out = [];
    for (var i = 0; i < arr.length; i++) {
        var id = String(arr[i] || "").trim();
        if (id && out.indexOf(id) === -1) out.push(id);
    }
    return out;
}
async function sendToAi(formula, msg) {
    var name = (formula && formula.character_card_name) ? String(formula.character_card_name).trim() : "";
    var roleCardId = await resolveRoleCardId(name);
    var ids = targetChatIds(formula);
    if (!ids.length) ids = [""];   // 空字符串 = 平台默认投递到当前对话
    var sent = [];
    var lastErr = null;
    for (var ci = 0; ci < ids.length; ci++) {
        try {
            var p = Tools.Chat.sendMessage(String(msg), ids[ci], roleCardId, null, {
                hide_user_message: true,
                persist_turn: true,
                timeout_ms: 120000
            });
            // 立即派发即返回：不等AI回复完成，避免点击后长时间卡住
            if (p && typeof p.catch === "function") p.catch(function () {});
            sent.push(ids[ci]);
        } catch (e) {
            lastErr = e;
        }
    }
    if (!sent.length && lastErr) throw new Error("发送失败：" + String((lastErr && lastErr.message) || lastErr));
    return { dispatched: true, count: sent.length, chat_ids: sent, role_card_id: roleCardId };
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

// ===== 多对话模式：每个对话各算各的沉默时长 / 冷却 / 未命中计数 =====
function chatMetaOf(state, cid) {
    if (!state.chat_meta || typeof state.chat_meta !== "object") state.chat_meta = {};
    var k = String(cid || "");
    if (!state.chat_meta[k] || typeof state.chat_meta[k] !== "object") {
        state.chat_meta[k] = { miss_count: 0, cooldown_until: null, last_hit_at: null };
    }
    return state.chat_meta[k];
}
function cooldownAlive(untilStr) {
    if (!untilStr) return false;
    var parts = String(untilStr).split(/[-: ]/);
    if (parts.length < 5) return false;
    var cu = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), parseInt(parts[3], 10), parseInt(parts[4], 10), parts[5] ? parseInt(parts[5], 10) : 0);
    return new Date() < cu;
}
function fmtCooldown(min) {
    var d = new Date(Date.now() + Number(min || 0) * 60000);
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
}
async function readLastUserTsOf(cid) {
    try {
        var messages = await fetchChatMessages(cid, 8);
        if (!messages) return null;
        for (var i = 0; i < messages.length; i++) {
            var m = messages[i];
            if (!isUserMessage(m)) continue;
            if (m.timestamp === undefined || m.timestamp === null) continue;
            var ts = typeof m.timestamp === "number" ? m.timestamp : parseInt(m.timestamp, 10);
            if (!isNaN(ts) && ts > 0) return ts < 1e12 ? ts * 1000 : ts;
        }
        return null;
    } catch (e) { return null; }
}
// 只发一个对话（多对话模式下用）
async function sendToAiOne(formula, msg, cid) {
    var name = (formula && formula.character_card_name) ? String(formula.character_card_name).trim() : "";
    var roleCardId = await resolveRoleCardId(name);
    var p = Tools.Chat.sendMessage(String(msg), cid, roleCardId, null, {
        hide_user_message: true,
        persist_turn: true,
        timeout_ms: 120000
    });
    if (p && typeof p.catch === "function") p.catch(function () {});
    return true;
}
module.exports = {
    isUserMessage: isUserMessage,
    fetchChatMessages: fetchChatMessages,
    fetchChatMessagesAll: fetchChatMessagesAll,
    resolveRoleCardId: resolveRoleCardId,
    targetChatIds: targetChatIds,
    sendToAi: sendToAi,
    chatMetaOf: chatMetaOf,
    cooldownAlive: cooldownAlive,
    fmtCooldown: fmtCooldown,
    readLastUserTsOf: readLastUserTsOf,
    sendToAiOne: sendToAiOne
};
