function Screen(ctx) {
    // 给主题色加透明度：#RRGGBB -> #AARRGGBB（不依赖 backgroundAlpha）
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
    var outlineVariant = scheme.outlineVariant || scheme.outline || "#C9C9C9";
    var surfaceVariant = scheme.surfaceVariant || "#F2F2F2";
    var cardBg = scheme.surfaceContainerHigh || surfaceVariant;
    var innerBg = scheme.surfaceContainerLow || scheme.surface || "#FFFFFF";   // 直接兜底，不依赖局部变量
    var primary = scheme.primary || "#222222";
    var onPrimary = scheme.onPrimary || "#FFFFFF";
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
        var s1 = (r && r.success && r.data) ? r.data : {};
        var f1 = (r2 && r2.success && r2.data) ? r2.data : {};
        var fv = (s1.f != null && typeof s1.f === "number") ? (Math.round(s1.f * 10000) / 10000) : "—";
        var qd = f1.quiet_dates || {};
        var lines = [
            "x = " + (s1.x != null ? s1.x : "—") + "　y = " + (s1.y != null ? s1.y + "%" : "—") + "　f = " + fv,
            "运行中：" + (s1.running ? "是" : "否") + "　未命中：" + (s1.miss_count != null ? s1.miss_count : "—"),
            "上次命中：" + (s1.last_hit_at || "—"),
            "冷却到：" + (s1.cooldown_until || "无"),
            "沉默阈值：" + (s1.idle_threshold_minutes != null ? s1.idle_threshold_minutes : "—") + " 分钟",
            "目标对话：" + ((s1.chat_ids && s1.chat_ids.length) ? s1.chat_ids.length + " 个" : "只用当前对话"),
            "版本：" + (s1.current_version || "—"),
            "静默总开关：" + (f1.quiet_enabled ? "开" : "关") + "　白天 " + (f1.quiet_day_start || "—") + "~" + (f1.quiet_day_end || "—") + "　夜间 " + (f1.quiet_night_start || "—") + "~" + (f1.quiet_night_end || "—"),
            "日期静默：" + (f1.date_quiet_enabled ? "开" : "关") + "　上学日自动：" + (f1.school_day_auto_quiet ? "开" : "关") + "　学生模式：" + (f1.student_mode ? "开" : "关"),
            "手动静默日：" + Object.keys(qd).length + " 天",
            "节假日表：" + ((f1.holiday_dates && f1.holiday_dates.length) ? f1.holiday_dates.length + " 天" : "未拉取") + "（更新于 " + (f1.holiday_fetch_date || "—") + "）"
        ];
        setRawRead(lines.join(String.fromCharCode(10)));
        if (f1.idle_threshold_minutes != null) setThr(String(f1.idle_threshold_minutes));
        if (!r.success && !r2.success) setErrMsg("读取失败：" + (r.message || ""));
    }
    async function saveThreshold() {
        var v = parseFloat(thr);
        if (isNaN(v) || v <= 0) { setErrMsg("沉默阈值需要是正数"); return; }
        var r = await run("thr", "on_air:update_formula", { idle_threshold_minutes: v });
        if (r.success) setMsg("沉默阈值已保存：" + v + " 分钟");
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
        return ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: surfaceVariant, border: { width: 1, color: outlineVariant }, shape: { cornerRadius: 10, type: "rounded" }, text: label, fillMaxWidth: true, onClick: onTap });
    }
    function softBtnRow(items) {
        var btns = [];
        for (var i = 0; i < items.length; i++) {
            btns.push(ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: surfaceVariant, border: { width: 1, color: outlineVariant }, shape: { cornerRadius: 10, type: "rounded" }, text: items[i][0], weight: 1, onClick: items[i][1] }));
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
    g2.push(note("只列关键读数；提示词与话术不在本页（提示词页可改）。"));
    g2.push(softBtn("刷新读数", function () { load(); }));
    if (rawRead) g2.push(resultBlock(rawRead));
    children.push(card("二、全量读数", g2));

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
