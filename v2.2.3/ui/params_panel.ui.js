function Screen(ctx) {
    // 给主题色加透明度：#RRGGBB -> #AARRGGBB（不依赖 backgroundAlpha）
        // ===== 工具调用辅助（v1.9.2）：兼容 UI 侧 callTool 返回（字符串/对象/裸数据）=====
    function unwrapRaw(o) {
        if (!o || typeof o !== "object") return o;
        var keys = [];
        for (var k in o) { keys.push(k); }
        if (keys.length === 1) {
            var only = keys[0];
            if (only === "result" || only === "content" || only === "text") {
                var v = o[only];
                if (typeof v === "string") { try { return JSON.parse(v); } catch (e3) { return v; } }
                return v;
            }
        }
        return o;
    }
    function parseResult(raw) {
        raw = unwrapRaw(raw);
        if (typeof raw === "string") {
            try { return JSON.parse(raw); } catch (e) { return { success: false, message: raw }; }
        }
        if (raw && typeof raw === "object") {
            if (raw.success !== undefined) return raw;
            if (raw.data !== undefined) return { success: true, data: raw.data, message: raw.message };
            return { success: true, data: raw };
        }
        return { success: false, message: "空返回" };
    }
    async function callTool(toolName, params) {
        try {
            var raw = await ctx.callTool(toolName, params || {});
            var res = parseResult(raw);
            if (res && res.success === false) {
                try { res.rawPreview = (typeof raw === "string") ? String(raw).slice(0, 150) : JSON.stringify(raw).slice(0, 150); } catch (e4) { res.rawPreview = ""; }
            }
            return res;
        } catch (e) {
            return { success: false, message: String((e && e.message) || e) };
        }
    }

    /*
     * 随机上线 — 参数页（v1.9.0 二级页面）
     * X（离开时长）/ 公式 a·b·c / 唤醒冷却 / 目标对话 / 停止上限
     */
    var scheme = (ctx.MaterialTheme && ctx.MaterialTheme.colorScheme) ? ctx.MaterialTheme.colorScheme : {};
    var onSurface = scheme.onSurface || "#222222";
    // 标签统一用主文字色：深色主题下 onSurfaceVariant 太暗，看不清
    var onSurfaceVariant = scheme.onSurface || scheme.onSurfaceVariant || "#666666";
    var surfaceVariant = scheme.surfaceVariant || "#F2F2F2";
    var primary = scheme.primary || "#222222";
    var onPrimary = scheme.onPrimary || "#FFFFFF";
    var outlineVariant = scheme.outlineVariant || scheme.outline || "#C9C9C9";
    var cardBg = surfaceVariant;
    var innerBg = scheme.surfaceContainerHigh || surfaceVariant;

    var xS = ctx.useState("q_x", "");  var xv = xS[0], setXv = xS[1];
    var aS = ctx.useState("q_a", "");  var av = aS[0], setAv = aS[1];
    var bS = ctx.useState("q_b", "");  var bv = bS[0], setBv = bS[1];
    var cS = ctx.useState("q_c", "");  var cv = cS[0], setCv = cS[1];
    var thrS = ctx.useState("q_thr", ""); var thrv = thrS[0], setThrv = thrS[1];
    var coolS = ctx.useState("q_cool", ""); var coolv = coolS[0], setCoolv = coolS[1];
    var stopS = ctx.useState("q_stop", ""); var stopv = stopS[0], setStopv = stopS[1];
    var msgS = ctx.useState("q_msg", ""); var msg = msgS[0], setMsg = msgS[1];
    var busyS = ctx.useState("q_busy", false); var busy = busyS[0], setBusy = busyS[1];
    var errS2 = ctx.useState("q_err", ""); var errMsg = errS2[0], setErrMsg = errS2[1];
    var loadedS = ctx.useState("q_loaded", false); var loaded = loadedS[0], setLoaded = loadedS[1];
    var cardsS = ctx.useState("q_cards", null); var cards = cardsS[0], setCards = cardsS[1];
    var cardOpenS = ctx.useState("q_card_open", false); var cardOpen = cardOpenS[0], setCardOpen = cardOpenS[1];
    var chatsS = ctx.useState("q_chats", null); var chats = chatsS[0], setChats = chatsS[1];
    var chatOpenS = ctx.useState("q_chat_open", false); var chatOpen = chatOpenS[0], setChatOpen = chatOpenS[1];
    var chatIdsS = ctx.useState("q_chat_ids", []); var chatIds = chatIdsS[0], setChatIds = chatIdsS[1];

    async function load() {
        try {
            var r = await callTool("on_air:get_formula", {});
            var d = (r && r.success && r.data) ? r.data : null;
            if (d) {
                setAv(String(d.a)); setBv(String(d.b)); setCv(String(d.c));
                setCoolv(String(d.cooldown_minutes != null ? d.cooldown_minutes : ""));
                setThrv(String(d.idle_threshold_minutes != null ? d.idle_threshold_minutes : ""));
                setChatIds(Array.isArray(d.chat_ids) ? d.chat_ids : []);
                setStopv(String(d.max_wake_stops != null ? d.max_wake_stops : 5));
            }
        } catch (e) { setErrMsg("读取失败：" + String((e && e.message) || e)); }
        setLoaded(true);
    }

    function yPreview() {
        var a = parseFloat(av), b = parseFloat(bv), c = parseFloat(cv), x = parseFloat(xv);
        if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(x) || x < 0) return null;
        var f = a * x + b * Math.pow(x, c);
        return Math.round(100 * f / (1 + f) * 10) / 10;
    }

    async function save(extra, okText) {
        setBusy(true);
        try {
            var r = await callTool("on_air:update_formula", extra);
            setMsg(r && r.success ? okText : ("保存失败：" + ((r && r.message) || "")));
        } catch (e) { setMsg("保存出错：" + String((e && e.message) || e)); }
        setBusy(false);
    }

    async function loadChats() {
        if (chats && chats.length) { setChatOpen(!chatOpen); return; }
        var r = await callTool("on_air:get_chats");
        if (r && r.success && r.data && r.data.chats) { setChats(r.data.chats); setChatOpen(true); }
        else setMsg("读取对话失败：" + ((r && r.message) || ""));
    }
    async function saveChatIds(list) {
        setChatIds(list);
        setMsg(list.length ? ("正在保存 " + list.length + " 个对话") : "正在改为只用当前对话");
        var r = await callTool("on_air:update_formula", { chat_ids: list });
        setMsg(r && r.success ? (list.length ? ("已绑定 " + list.length + " 个对话") : "已改为只用当前对话") : ("保存失败：" + ((r && r.message) || "")));
    }
    function toggleChat(id) {
        var cur = (chatIds || []).slice();
        var i = cur.indexOf(id);
        if (i >= 0) cur.splice(i, 1); else cur.push(id);
        saveChatIds(cur);
    }
    function goHome() { if (ctx.navigate) ctx.navigate("toolpkg:com.operit.on_air:ui:on_air_sidebar"); }

    var yp = yPreview();
    var children = [];
    if (errMsg) {
        children.push(ctx.UI.Text({ text: errMsg, style: "bodySmall", color: (scheme.error || "#B00020") }));
    }
    children.push(ctx.UI.Text({ text: "参数", fontSize: 24, fontWeight: "bold", color: primary }));

    var box = [];
    box.push(ctx.UI.Text({ text: "X（离开时长 / 分钟）", style: "bodySmall", color: onSurfaceVariant }));
    box.push(ctx.UI.TextField({ value: xv, onValueChange: setXv, singleLine: true, placeholder: ctx.UI.Text({ text: "如 21", color: onSurfaceVariant }), style: { color: onSurface } }));
    box.push(ctx.UI.Text({ text: "写入后 y ≈ " + (yp != null ? yp + "%" : "—"), style: "bodySmall", color: onSurfaceVariant }));
    box.push(ctx.UI.Button({ contentColor: onPrimary, color: onPrimary, textColor: onPrimary, containerColor: primary, shape: { cornerRadius: 12, type: "rounded" }, text: "写入 X", fillMaxWidth: true, onClick: async function () {
        setBusy(true);
        try {
            var r = await callTool("on_air:set_x", { x: parseFloat(xv) });
            setMsg(r && r.success ? "X 已写入：" + xv : ("写入失败：" + ((r && r.message) || "")));
        } catch (e) { setMsg("写入出错：" + String((e && e.message) || e)); }
        setBusy(false);
    } }));
    children.push(ctx.UI.Card({ containerColor: surfaceVariant, border: { width: 1, color: scheme.outline || surfaceVariant }, backgroundColor: cardBg, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
        ctx.UI.Column({ backgroundColor: cardBg, fillMaxWidth: true, padding: 14, spacing: 6 }, box)
    ]));

    var box2 = [];
    box2.push(ctx.UI.Text({ text: "公式参数（f = a·x + b·x^c）", style: "bodySmall", color: onSurfaceVariant }));
    box2.push(ctx.UI.TextField({ value: av, onValueChange: setAv, singleLine: true, placeholder: ctx.UI.Text({ text: "a 如 0.007078203", color: onSurfaceVariant }), style: { color: onSurface } }));
    box2.push(ctx.UI.TextField({ value: bv, onValueChange: setBv, singleLine: true, placeholder: ctx.UI.Text({ text: "b 如 6.00914e-07", color: onSurfaceVariant }), style: { color: onSurface } }));
    box2.push(ctx.UI.TextField({ value: cv, onValueChange: setCv, singleLine: true, placeholder: ctx.UI.Text({ text: "c 如 3.15168", color: onSurfaceVariant }), style: { color: onSurface } }));
    box2.push(ctx.UI.Button({ contentColor: onPrimary, color: onPrimary, textColor: onPrimary, containerColor: primary, shape: { cornerRadius: 12, type: "rounded" }, text: "保存公式参数", fillMaxWidth: true, onClick: function () { save({ a: av, b: bv, c: cv }, "公式参数已保存"); } }));
    children.push(ctx.UI.Card({ containerColor: surfaceVariant, border: { width: 1, color: scheme.outline || surfaceVariant }, backgroundColor: cardBg, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
        ctx.UI.Column({ backgroundColor: cardBg, fillMaxWidth: true, padding: 14, spacing: 6 }, box2)
    ]));

    var box3 = [];
    box3.push(ctx.UI.Text({ text: "沉默阈值（分钟）：你多久不说话才开始累计 X，调大 = 更不容易被想起来", style: "bodySmall", color: onSurfaceVariant }));
    box3.push(ctx.UI.TextField({ value: thrv, onValueChange: setThrv, singleLine: true, placeholder: ctx.UI.Text({ text: "10", color: onSurfaceVariant }), style: { color: onSurface } }));
    box3.push(ctx.UI.Button({ contentColor: onPrimary, color: onPrimary, textColor: onPrimary, containerColor: primary, shape: { cornerRadius: 12, type: "rounded" }, text: "保存沉默阈值", fillMaxWidth: true, onClick: function () { save({ idle_threshold_minutes: thrv }, "沉默阈值已保存"); } }));
    box3.push(ctx.UI.Text({ text: "唤醒后冷却（分钟）", style: "bodySmall", color: onSurfaceVariant }));
    box3.push(ctx.UI.TextField({ value: coolv, onValueChange: setCoolv, singleLine: true, placeholder: ctx.UI.Text({ text: "15", color: onSurfaceVariant }), style: { color: onSurface } }));
    box3.push(ctx.UI.Button({ contentColor: onPrimary, color: onPrimary, textColor: onPrimary, containerColor: primary, shape: { cornerRadius: 12, type: "rounded" }, text: "保存冷却", fillMaxWidth: true, onClick: function () { save({ cooldown_minutes: coolv }, "冷却时间已保存"); } }));
    box3.push(ctx.UI.Text({ text: "连续命中停止上限 max_wake_stops（默认 5）", style: "bodySmall", color: onSurfaceVariant }));
    box3.push(ctx.UI.TextField({ value: stopv, onValueChange: setStopv, singleLine: true, placeholder: ctx.UI.Text({ text: "5", color: onSurfaceVariant }), style: { color: onSurface } }));
    box3.push(ctx.UI.Button({ containerColor: primary, textColor: onPrimary, contentColor: onPrimary, fillMaxWidth: true, shape: { cornerRadius: 12, type: "rounded" }, text: "保存停止上限", onClick: function () { save({ max_wake_stops: stopv }, "停止上限已保存"); } }));
    // ===== 目标对话（可多选）=====
    // box3 卡片渲染（冷却 / 停止上限）
    children.push(ctx.UI.Card({ containerColor: surfaceVariant, border: { width: 1, color: scheme.outline || surfaceVariant }, backgroundColor: cardBg, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
        ctx.UI.Column({ backgroundColor: cardBg, fillMaxWidth: true, padding: 14, spacing: 10 }, box3)
    ]));
    var chatBox = [];
    chatBox.push(ctx.UI.Text({ text: "目标对话（可多选）", fontSize: 13, fontWeight: "bold", color: onSurface }));
    chatBox.push(ctx.UI.Text({ text: (chatIds && chatIds.length) ? ("已绑定 " + chatIds.length + " 个对话") : "当前：只用当前对话", fontSize: 15, fontWeight: "bold", color: primary }));
    chatBox.push(ctx.UI.Button({ containerColor: primary, textColor: onPrimary, contentColor: onPrimary, fillMaxWidth: true, shape: { cornerRadius: 12, type: "rounded" }, text: (!chatIds || !chatIds.length) ? "已是只用当前对话" : "改为只用当前对话", onClick: function () { return saveChatIds([]); } }));
    chatBox.push(ctx.UI.Button({ containerColor: primary, textColor: onPrimary, contentColor: onPrimary, fillMaxWidth: true, shape: { cornerRadius: 12, type: "rounded" }, text: (chatOpen ? "收起对话列表" : ("选择对话" + (chats && chats.length ? ("（共 " + chats.length + " 个）") : ""))), onClick: function () { return loadChats(); } }));
    if (chatOpen) {
        var chatList = (chats && chats.length) ? chats : [];
        if (!chatList.length) chatBox.push(ctx.UI.Text({ text: "没有读到对话", fontSize: 12, color: onSurfaceVariant }));
        for (var qi = 0; qi < chatList.length; qi++) {
            chatBox.push((function (c) {
                var cid = String(c.id || "");
                var on = (chatIds || []).indexOf(cid) >= 0;
                return ctx.UI.Row({
                    fillMaxWidth: true, verticalAlignment: "center",
                    padding: { horizontal: 12, vertical: 12 },
                    backgroundColor: cardBg, backgroundShape: { cornerRadius: 10, type: "rounded" },
                    onClick: function () { return toggleChat(cid); }
                }, [
                    ctx.UI.Text({ text: (on ? "✓ " : "") + String(c.title || "（无标题）"), fontSize: 14, fontWeight: on ? "bold" : "normal", color: on ? primary : onSurface, weight: 1, maxLines: 1, overflow: "ellipsis" }),
                    ctx.UI.Text({ text: on ? "已选" : "点我选", fontSize: 12, color: on ? primary : onSurfaceVariant })
                ]);
            })(chatList[qi]));
        }
    }
    children.push(ctx.UI.Card({ containerColor: surfaceVariant, border: { width: 1, color: scheme.outline || surfaceVariant }, backgroundColor: cardBg, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
        ctx.UI.Column({ backgroundColor: cardBg, fillMaxWidth: true, padding: 14, spacing: 10 }, chatBox)
    ]));
    children.push(ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: cardBg, border: { width: 1, color: outlineVariant }, shape: { cornerRadius: 12, type: "rounded" }, text: "返回主页", fillMaxWidth: true, onClick: goHome }));
    if (msg) {
        children.push(ctx.UI.Card({ containerColor: surfaceVariant, border: { width: 1, color: scheme.outline || surfaceVariant }, backgroundColor: cardBg, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
            ctx.UI.Row({ backgroundColor: cardBg, fillMaxWidth: true, padding: 14, verticalAlignment: "center" }, [
                ctx.UI.Text({ text: msg, style: "bodyMedium", color: onSurface, weight: 1 })
            ])
        ]));
    }

    return ctx.UI.LazyColumn({
        onLoad: async function () { await load(); },
        fillMaxSize: true, padding: 16, spacing: 12
    }, children);
}

module.exports = Screen;
module.exports.default = Screen;
module.exports.Screen = Screen;
