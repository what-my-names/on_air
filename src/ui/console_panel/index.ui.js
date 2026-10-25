function Screen(ctx) {
    // 给主题色加透明度：#RRGGBB -> #AARRGGBB（不依赖 backgroundAlpha）
    function wa(c, a) {
        if (typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c)) return "#" + a + c.slice(1);
        return c;
    }
    // ===== 工具调用辅助（与其它页一致）=====
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
     * 随机上线 — 控制台（v1.9.4 重设计：无图标/无 emoji，靠排版层次一眼看懂）
     * 层次：页面标题 / 分组卡标题 / 动作标题 / 说明 / 主次按钮 / 结果块
     */
    var scheme = (ctx.MaterialTheme && ctx.MaterialTheme.colorScheme) ? ctx.MaterialTheme.colorScheme : {};
    var onSurface = scheme.onSurface || "#222222";
    var onSurfaceVariant = scheme.onSurfaceVariant || "#666666";
    var surface = scheme.surface || "#FFFFFF";
    var surfaceVariant = scheme.surfaceVariant || "#F2F2F2";
    var cardBg = scheme.surfaceContainerHigh || surfaceVariant;
    var innerBg = scheme.surfaceContainerLow || surface;
    var primary = scheme.primary || "#222222";
    var onPrimary = scheme.onPrimary || "#FFFFFF";
    var primaryContainer = scheme.primaryContainer || primary;
    var onPrimaryContainer = scheme.onPrimaryContainer || onPrimary;
    var outline = scheme.outline || "#CCCCCC";
    var errColor = scheme.error || "#B00020";
    var errContainer = scheme.errorContainer || surfaceVariant;
    var onErrContainer = scheme.onErrorContainer || errColor;
    var busyS = ctx.useState("c_busy", ""); var busy = busyS[0], setBusy = busyS[1];
    var msgS = ctx.useState("c_msg", ""); var msg = msgS[0], setMsg = msgS[1];
    var errS = ctx.useState("c_err", ""); var errMsg = errS[0], setErrMsg = errS[1];
    var outS = ctx.useState("c_out", "{}"); var outRaw = outS[0], setOut = outS[1];
    var rawS = ctx.useState("c_raw", ""); var rawRead = rawS[0], setRawRead = rawS[1];
    var docsS = ctx.useState("c_docs", ""); var docs = docsS[0], setDocs = docsS[1];
    var dOpenS = ctx.useState("c_dopen", false); var dOpen = dOpenS[0], setDOpen = dOpenS[1];
    var thrS = ctx.useState("c_thr", ""); var thr = thrS[0], setThr = thrS[1];
    var xsetS = ctx.useState("c_xset", ""); var xsetVal = xsetS[0], setXset = xsetS[1];
    var chatS = ctx.useState("c_chat", ""); var chatName = chatS[0], setChatName = chatS[1];
    var sugS = ctx.useState("c_sug", ""); var sugText = sugS[0], setSug = sugS[1];
    var out = {};
    try { out = JSON.parse(outRaw || "{}"); } catch (e1) { out = {}; }
    function putOut(k, text) {
        var m = {};
        for (var kk in out) { m[kk] = out[kk]; }
        m[k] = text;
        setOut(JSON.stringify(m));
    }
    function summarize(r) {
        if (!r) return "无返回";
        if (r.success === false) return "失败：" + (r.message || "") + (r.rawPreview ? "（原始：" + r.rawPreview + "）" : "");
        var head = r.message ? r.message + "　" : "";
        var body = "";
        try { body = JSON.stringify(r.data); } catch (e5) { body = String(r.data); }
        if (body && body.length > 240) body = body.slice(0, 240) + "...";
        return head + body;
    }
    async function run(key, toolName, params) {
        setBusy(key);
        setErrMsg("");
        var r = await callTool(toolName, params);
        putOut(key, summarize(r));
        if (!r.success) setErrMsg("调用失败：" + (r.message || ""));
        setBusy("");
        return r;
    }
    async function load() {
        setErrMsg("");
        var r = await callTool("on_air:get_xy");
        var r2 = await callTool("on_air:get_formula");
        var pack = { get_xy: r.success ? r.data : { error: r.message }, get_formula: r2.success ? r2.data : { error: r2.message } };
        try { setRawRead(JSON.stringify(pack, null, 2)); } catch (e6) { setRawRead(String(pack)); }
        if (r2.success && r2.data && r2.data.idle_threshold_minutes != null) setThr(String(r2.data.idle_threshold_minutes));
        if (!r.success && !r2.success) setErrMsg("读取失败：" + (r.message || "") + (r.rawPreview ? "（原始：" + r.rawPreview + "）" : ""));
    }
    async function loadDocs() {
        setBusy("docs");
        setErrMsg("");
        var r = await callTool("on_air:api_docs");
        if (r.success) {
            var t = "";
            try { t = JSON.stringify(r.data, null, 2); } catch (e7) { t = String(r.data); }
            setDocs(t);
            setDOpen(true);
        } else {
            setErrMsg("文档加载失败：" + (r.message || ""));
        }
        setBusy("");
    }
    async function saveThreshold() {
        var v = parseFloat(thr);
        if (isNaN(v) || v <= 0) { setErrMsg("沉默阈值需要是正数"); return; }
        var r = await run("thr", "on_air:update_formula", { idle_threshold_minutes: v });
        if (r.success) setMsg("沉默阈值已保存：" + v + " 分钟");
    }
    async function doSuggest(apply) {
        setBusy(apply ? "sug_apply" : "sug_preview");
        setErrMsg("");
        var params = {};
        if (String(chatName || "").trim()) params.chat_name = String(chatName).trim();
        if (apply) params.apply = true;
        var r = await callTool("on_air:suggest_quiet", params);
        if (r.success) {
            var d = r.data || {};
            var sg = d.suggestion || {};
            setSug("白天段 " + (sg.day_start || "?") + " 至 " + (sg.day_end || "?") + "　夜间段 " + (sg.night_start || "?") + " 至 " + (sg.night_end || "?") + "　样本 " + (d.sample_count != null ? d.sample_count : "?") + " 条" + (apply ? "（已应用并开启静默）" : "") + "　理由：" + (sg.reason || ""));
        } else {
            setErrMsg("生成失败：" + (r.message || ""));
        }
        setBusy("");
    }
    function goHome() { if (ctx.navigate) ctx.navigate("toolpkg:com.operit.on_air:ui:on_air_sidebar"); }
    function goPrompts() { if (ctx.navigate) ctx.navigate("toolpkg:com.operit.on_air:ui:on_air_prompts"); }
    function goParams() { if (ctx.navigate) ctx.navigate("toolpkg:com.operit.on_air:ui:on_air_params"); }
    function goQuiet() { if (ctx.navigate) ctx.navigate("toolpkg:com.operit.on_air:ui:on_air_quiet"); }
    function goDates() { if (ctx.navigate) ctx.navigate("toolpkg:com.operit.on_air:ui:on_air_dates"); }
    // ===== 排版组件（层次感来源：卡片 > 动作标题 > 说明 > 按钮 > 结果块）=====
    function card(title, bodyArr) {
        var box = [];
        box.push(ctx.UI.Text({ text: title, style: "titleSmall", fontWeight: "bold", color: primary }));
        for (var i = 0; i < bodyArr.length; i++) { box.push(bodyArr[i]); }
        return ctx.UI.Card({ containerColor: cardBg, border: { width: 1, color: scheme.outline || surfaceVariant }, backgroundColor: cardBg, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
            ctx.UI.Column({ backgroundColor: cardBg, fillMaxWidth: true, padding: 16, spacing: 16 }, box)
        ]);
    }
    function note(t) { return ctx.UI.Text({ text: t, style: "bodySmall", color: onSurfaceVariant }); }
    function resultBlock(text) {
        return ctx.UI.Card({ containerColor: innerBg, backgroundColor: innerBg, shape: { cornerRadius: 10, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
            ctx.UI.Row({ backgroundColor: innerBg, fillMaxWidth: true, padding: 10 }, [
                ctx.UI.Text({ text: text, style: "bodySmall", color: onSurfaceVariant, weight: 1 })
            ])
        ]);
    }
    function mainBtn(label, onTap) {
        return ctx.UI.Button({ contentColor: onPrimary, color: onPrimary, textColor: onPrimary, containerColor: primary, shape: { cornerRadius: 10, type: "rounded" }, text: label, fillMaxWidth: true, onClick: onTap });
    }
    function softBtn(label, onTap) {
        return ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: surfaceVariant, shape: { cornerRadius: 10, type: "rounded" }, text: label, fillMaxWidth: true, onClick: onTap });
    }
    function softBtnRow(items) {
        var btns = [];
        for (var i = 0; i < items.length; i++) {
            btns.push(ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: surfaceVariant, shape: { cornerRadius: 10, type: "rounded" }, text: items[i][0], weight: 1, onClick: items[i][1] }));
        }
        return ctx.UI.Row({ spacing: 8, fillMaxWidth: true }, btns);
    }
    // 动作块：标题 + 说明 + 按钮（+ 结果）
    function action(label, desc, btnLabel, key, toolName, params, isPrimary) {
        var box = [];
        box.push(ctx.UI.Text({ text: label, style: "labelLarge", fontWeight: "bold", color: onSurface }));
        if (desc) box.push(note(desc));
        box.push((isPrimary ? mainBtn : softBtn)(busy === key ? "执行中..." : btnLabel, function () { run(key, toolName, params); }));
        if (out[key]) box.push(resultBlock(out[key]));
        return ctx.UI.Column({ backgroundColor: cardBg, fillMaxWidth: true, spacing: 6 }, box);
    }
    function inputRow(label, value, onChange, ph) {
        return ctx.UI.Column({ backgroundColor: cardBg, fillMaxWidth: true, spacing: 4 }, [
            note(label),
            ctx.UI.TextField({ value: value, onValueChange: onChange, singleLine: true, placeholder: ctx.UI.Text({ text: ph || "", color: onSurfaceVariant }), style: { color: onSurface } })
        ]);
    }
    var children = [];
    children.push(ctx.UI.Text({ text: "控制台", fontSize: 24, fontWeight: "bold", color: primary }));
    children.push(note("这里是别处点不到的 API。常用操作在主页，常规配置在参数 / 免打扰 / 日期页。"));
    if (errMsg) {
        children.push(ctx.UI.Card({ containerColor: errContainer, backgroundColor: errContainer, shape: { cornerRadius: 12, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
            ctx.UI.Row({ backgroundColor: errContainer, fillMaxWidth: true, padding: 12 }, [
                ctx.UI.Text({ text: errMsg, style: "bodySmall", color: onErrContainer, weight: 1 })
            ])
        ]));
    }
    var g1 = [];
    g1.push(note("每个接口的返回值会直接显示在按钮下方。"));
    g1.push(action("掷骰一次", "走真实流程：含冷却 / 静默 / 上限判断，命中才真发消息。", "掷骰一次", "ma", "on_air:maybe_awake", {}, true));
    g1.push(action("只掷骰不发送", "只看当前概率与骰子结果，不发任何消息。", "只掷骰", "rd", "on_air:roll_dice", {}));
    g1.push(action("检查沉默状态", "看你沉默了多久、是否会清零计数。", "检查沉默", "ca", "on_air:check_activity", {}));
    g1.push(action("进入运行态", "手动开始 X 累加（平时由工作流调用）。", "进入运行态", "er", "on_air:enter_running", {}));
    g1.push(inputRow("手动设 X（分钟）", xsetVal, setXset, "如 30"));
    g1.push(softBtn(busy === "sx" ? "执行中..." : "写入 X", function () { run("sx", "on_air:set_x", { x: parseFloat(xsetVal) }); }));
    if (out["sx"]) g1.push(resultBlock(out["sx"]));
    children.push(card("一、运行调试", g1));
    var g2 = [];
    g2.push(note("get_xy 与 get_formula 的完整返回；主页只显示摘要。"));
    g2.push(softBtn("刷新读数", function () { load(); }));
    if (rawRead) g2.push(resultBlock(rawRead));
    children.push(card("二、全量读数", g2));
    var g3 = [];
    g3.push(note("沉默阈值：你多久不说话才开始累计 X（默认 10 分钟）。调大 = 更不容易被想起来。"));
    g3.push(ctx.UI.TextField({ value: thr, onValueChange: setThr, singleLine: true, placeholder: ctx.UI.Text({ text: "10", color: onSurfaceVariant }), style: { color: onSurface } }));
    g3.push(mainBtn(busy === "thr" ? "保存中..." : "保存沉默阈值", saveThreshold));
    if (out["thr"]) g3.push(resultBlock(out["thr"]));
    g3.push(note("静默时间建议：按你的发言习惯算（可选填对话名，留空用已配置的目标对话）。"));
    g3.push(ctx.UI.TextField({ value: chatName, onValueChange: setChatName, singleLine: true, placeholder: ctx.UI.Text({ text: "对话名（可留空）", color: onSurfaceVariant }), style: { color: onSurface } }));
    g3.push(softBtnRow([["生成建议", function () { doSuggest(false); }], ["生成并应用", function () { doSuggest(true); }]]));
    if (sugText) g3.push(resultBlock(sugText));
    g3.push(action("立即拉取节假日", "联网更新今年与明年的法定节假日表，平时每天 12 点会自动拉一次。", "拉取节假日", "fh", "on_air:fetch_holidays", {}));
    g3.push(softBtnRow([["去参数页", goParams], ["去免打扰页", goQuiet], ["去日期页", goDates]]));
    children.push(card("三、补漏配置", g3));
    var g4 = [];
    g4.push(note("本插件共 17 个工具，其它插件 / 工作流可直接调用（前缀 on_air:）。括号里是它在哪个页面能点到。"));
    g4.push(note("get_xy 读状态（主页）｜ compute_y 算概率（参数页）｜ set_x 设 X（参数页 / 本页）｜ increment_x X+1（工作流）｜ check_activity 查沉默（本页）｜ roll_dice 掷骰（本页）｜ manual_awake 手动唤醒（主页）｜ coax 安抚复位（主页）｜ reset_cooldown 重置冷却（主页）｜ update_formula 改配置（各页保存）｜ get_formula 读配置（各页加载）｜ maybe_awake 运行态掷骰（本页）｜ enter_running 进运行态（本页）｜ suggest_quiet 静默建议（本页 / 免打扰页）｜ link_agent 目标对话（免打扰页）｜ fetch_holidays 拉节假日（本页 / 日期页）｜ api_docs 本文档"));
    g4.push(mainBtn(busy === "docs" ? "加载中..." : (dOpen && docs ? "收起 API 文档" : "加载完整 API 文档"), function () { if (dOpen && docs) { setDOpen(false); } else { loadDocs(); } }));
    if (dOpen && docs) g4.push(resultBlock(docs));
    g4.push(softBtn("去提示词页（发消息的每一句话都能改）", goPrompts));
    children.push(card("四、API 清单与文档", g4));
    children.push(softBtn("返回主页", goHome));
    if (msg) {
        children.push(ctx.UI.Card({ containerColor: cardBg, border: { width: 1, color: scheme.outline || surfaceVariant }, backgroundColor: cardBg, shape: { cornerRadius: 12, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
            ctx.UI.Row({ backgroundColor: cardBg, fillMaxWidth: true, padding: 12 }, [
                ctx.UI.Text({ text: msg, style: "bodyMedium", color: onSurface, weight: 1 })
            ])
        ]));
    }
    return ctx.UI.LazyColumn({
        onLoad: async function () { await load(); },
        fillMaxSize: true, padding: 16, spacing: 14
    }, children);
}
module.exports = Screen;
module.exports.default = Screen;
module.exports.Screen = Screen;
