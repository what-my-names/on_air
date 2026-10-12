function Screen(ctx) {
    // ===== 工具调用辅助（与其它页一致：兼容 字符串 / 对象 / 裸数据）=====
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
        return { success: false, message: "KONG" };
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
     * 随机上线 — 控制台（v1.9.3）
     * 定位：把「其它页面点不到」的 API 开放出来（与主页 / 参数页 / 免打扰页 不重复）
     *  组1 运行调试：maybe_awake / roll_dice / check_activity / enter_running / set_x
     *  组2 全量读数：get_xy + get_formula 原始返回
     *  组3 补漏配置：idle_threshold_minutes / suggest_quiet / fetch_holidays
     *  组4 API 开放性：17 工具清单 + api_docs 全文 + 提示词页跳转
     */
    var scheme = (ctx.MaterialTheme && ctx.MaterialTheme.colorScheme) ? ctx.MaterialTheme.colorScheme : {};
    var onSurface = scheme.onSurface || "#222222";
    var onSurfaceVariant = scheme.onSurfaceVariant || "#666666";
    var surfaceVariant = scheme.surfaceVariant || "#F2F2F2";
    var primary = scheme.primary || "#222222";
    var errColor = scheme.error || "#B00020";
    var busyS = ctx.useState("c_busy", ""); var busy = busyS[0], setBusy = busyS[1];
    var msgS = ctx.useState("c_msg", ""); var msg = msgS[0], setMsg = msgS[1];
    var errS = ctx.useState("c_err", ""); var errMsg = errS[0], setErrMsg = errS[1];
    var outS = ctx.useState("c_out", "{}"); var outRaw = outS[0], setOut = outS[1];
    var rawS = ctx.useState("c_raw", ""); var rawRead = rawS[0], setRawRead = rawS[1];
    var docsS = ctx.useState("c_docs", ""); var docs = docsS[0], setDocs = docsS[1];
    var openS = ctx.useState("c_open", "{}"); var openRaw = openS[0], setOpen = openS[1];
    var thrS = ctx.useState("c_thr", ""); var thr = thrS[0], setThr = thrS[1];
    var xsetS = ctx.useState("c_xset", ""); var xsetVal = xsetS[0], setXset = xsetS[1];
    var chatS = ctx.useState("c_chat", ""); var chatName = chatS[0], setChatName = chatS[1];
    var sugS = ctx.useState("c_sug", ""); var sugText = sugS[0], setSug = sugS[1];
    var out = {};
    try { out = JSON.parse(outRaw || "{}"); } catch (e1) { out = {}; }
    var openObj = {};
    try { openObj = JSON.parse(openRaw || "{}"); } catch (e2) { openObj = {}; }
    function isOpen(k) { return !!openObj[k]; }
    function toggle(k) {
        var m = {};
        for (var kk in openObj) { m[kk] = openObj[kk]; }
        if (m[k]) { delete m[k]; } else { m[k] = true; }
        setOpen(JSON.stringify(m));
    }
    function putOut(k, text) {
        var m = {};
        for (var kk in out) { m[kk] = out[kk]; }
        m[k] = text;
        setOut(JSON.stringify(m));
    }
    function summarize(r) {
        if (!r) return "无返回";
        if (r.success === false) return "失败：" + (r.message || "") + (r.rawPreview ? " 原始:" + r.rawPreview : "");
        var head = r.message ? r.message + "  " : "";
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
        if (!r.success && !r2.success) setErrMsg("读取失败：" + (r.message || "") + (r.rawPreview ? " 原始:" + r.rawPreview : ""));
    }
    async function loadDocs() {
        setBusy("docs");
        setErrMsg("");
        var r = await callTool("on_air:api_docs");
        if (r.success) {
            var t = "";
            try { t = JSON.stringify(r.data, null, 2); } catch (e7) { t = String(r.data); }
            setDocs(t);
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
            var s = d.suggestion || {};
            setSug("白天段 " + (s.day_start || "?") + "~" + (s.day_end || "?") + "  夜间段 " + (s.night_start || "?") + "~" + (s.night_end || "?") + "  样本 " + (d.sample_count != null ? d.sample_count : "?") + " 条" + (apply ? "（已应用）" : "") + "  理由：" + (s.reason || ""));
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
    function textRow(t) { return ctx.UI.Text({ text: t, style: "bodySmall", color: onSurfaceVariant }); }
    function actBtn(label, key, toolName, params) {
        return ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: surfaceVariant, shape: { cornerRadius: 10, type: "rounded" }, text: (busy === key ? "... " : "") + label, fillMaxWidth: true, onClick: function () { run(key, toolName, params); } });
    }
    function navBtn(label, onTap) {
        return ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: surfaceVariant, shape: { cornerRadius: 10, type: "rounded" }, text: label, weight: 1, onClick: onTap });
    }
    function bigBtn(label, onTap) {
        return ctx.UI.Button({ contentColor: surfaceVariant, color: surfaceVariant, textColor: surfaceVariant, containerColor: primary, shape: { cornerRadius: 12, type: "rounded" }, text: label, fillMaxWidth: true, onClick: onTap });
    }
    function outOf(key) {
        var t = out[key];
        if (!t) return null;
        return textRow("：" + t);
    }
    function group(title, openKey, bodyFn) {
        var box = [];
        box.push(ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: surfaceVariant, shape: { cornerRadius: 10, type: "rounded" }, text: (isOpen(openKey) ? "[-] " : "[+] ") + title, fillMaxWidth: true, onClick: function () { toggle(openKey); } }));
        if (isOpen(openKey)) { bodyFn(box); }
        return ctx.UI.Card({ containerColor: surfaceVariant, backgroundColor: surfaceVariant, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
            ctx.UI.Column({ backgroundColor: surfaceVariant, fillMaxWidth: true, padding: 14, spacing: 8 }, box)
        ]);
    }
    var children = [];
    children.push(ctx.UI.Text({ text: "控制台", style: "titleMedium", fontWeight: "semiBold", color: onSurface }));
    children.push(textRow("这里放的是「其它页面点不到」的 API：运行调试、全量读数、补漏配置、完整工具清单。"));
    children.push(textRow("常驻操作（触发唤醒 / 重置冷却 / 重置计数）在主页；公式与冷却在参数页；静默在免打扰页。"));
    if (errMsg) {
        children.push(ctx.UI.Card({ containerColor: surfaceVariant, backgroundColor: surfaceVariant, shape: { cornerRadius: 12, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
            ctx.UI.Row({ backgroundColor: surfaceVariant, fillMaxWidth: true, padding: 12 }, [
                ctx.UI.Text({ text: "! " + errMsg, style: "bodySmall", color: errColor, weight: 1 })
            ])
        ]));
    }
    children.push(group("一、运行调试（直调 API）", "g1", function (box) {
        box.push(textRow("掷骰一次（真实流程）：含冷却、静默、上限判断，命中才真发消息。"));
        box.push(actBtn("掷骰一次  maybe_awake", "ma", "on_air:maybe_awake"));
        var o1 = outOf("ma"); if (o1) box.push(o1);
        box.push(actBtn("只掷骰不发送  roll_dice", "rd", "on_air:roll_dice"));
        var o2 = outOf("rd"); if (o2) box.push(o2);
        box.push(actBtn("检查沉默状态  check_activity", "ca", "on_air:check_activity"));
        var o3 = outOf("ca"); if (o3) box.push(o3);
        box.push(actBtn("进入运行态  enter_running", "er", "on_air:enter_running"));
        var o4 = outOf("er"); if (o4) box.push(o4);
        box.push(textRow("手动设 X（分钟）："));
        box.push(ctx.UI.TextField({ value: xsetVal, onValueChange: setXset, singleLine: true, placeholder: ctx.UI.Text({ text: "如 30", color: onSurfaceVariant }), style: { color: onSurface } }));
        box.push(actBtn("写入 X  set_x", "sx", "on_air:set_x", { x: parseFloat(xsetVal) }));
        var o5 = outOf("sx"); if (o5) box.push(o5);
    }));
    children.push(group("二、全量读数（原始返回）", "g2", function (box) {
        box.push(textRow("get_xy + get_formula 的完整返回；主页只显示摘要。"));
        box.push(navBtn("刷新读数", function () { load(); }));
        if (rawRead) box.push(ctx.UI.Text({ text: rawRead, style: "bodySmall", color: onSurfaceVariant }));
    }));
    children.push(group("三、补漏配置（这些以前没有入口）", "g3", function (box) {
        box.push(textRow("沉默阈值：你多久不说话才开始累计 X（默认 10 分钟）。"));
        box.push(ctx.UI.TextField({ value: thr, onValueChange: setThr, singleLine: true, placeholder: ctx.UI.Text({ text: "10", color: onSurfaceVariant }), style: { color: onSurface } }));
        box.push(bigBtn("保存沉默阈值", saveThreshold));
        var o6 = outOf("thr"); if (o6) box.push(o6);
        box.push(textRow("静默时间建议：按你的发言习惯算（可选填对话名，留空用已配置的目标对话）。"));
        box.push(ctx.UI.TextField({ value: chatName, onValueChange: setChatName, singleLine: true, placeholder: ctx.UI.Text({ text: "对话名（可留空）", color: onSurfaceVariant }), style: { color: onSurface } }));
        box.push(ctx.UI.Row({ spacing: 8, fillMaxWidth: true }, [
            navBtn("生成建议", function () { doSuggest(false); }),
            navBtn("生成并应用", function () { doSuggest(true); })
        ]));
        if (sugText) box.push(textRow(sugText));
        box.push(actBtn("立即联网拉取节假日  fetch_holidays", "fh", "on_air:fetch_holidays"));
        var o7 = outOf("fh"); if (o7) box.push(o7);
        box.push(ctx.UI.Row({ spacing: 8, fillMaxWidth: true }, [
            navBtn("去参数页", goParams),
            navBtn("去免打扰页", goQuiet),
            navBtn("去日期页", goDates)
        ]));
    }));
    children.push(group("四、API 清单与文档（对外开放性）", "g4", function (box) {
        box.push(textRow("本插件共 17 个工具，其它插件/工作流可直接调用（前缀 on_air:）。会发消息的提示词都能在「提示词页」改。"));
        var L = [
            "get_xy 读状态（主页状态卡）",
            "compute_y 算概率（参数页预览）",
            "set_x 设 X（参数页 / 本页组一）",
            "increment_x X+1（工作流每分钟调用）",
            "check_activity 查沉默（本页组一）",
            "roll_dice 掷骰（本页组一）",
            "manual_awake 手动唤醒（主页）",
            "coax 安抚复位（主页）",
            "reset_cooldown 重置冷却（主页）",
            "update_formula 改配置（各页保存时）",
            "get_formula 读配置（各页加载时）",
            "maybe_awake 运行态掷骰（本页组一）",
            "enter_running 进运行态（本页组一）",
            "suggest_quiet 静默建议（本页组三 / 免打扰页）",
            "link_agent 目标对话（免打扰页）",
            "fetch_holidays 拉节假日（本页组三 / 日期页）",
            "api_docs 本文档"
        ];
        for (var i = 0; i < L.length; i++) { box.push(textRow("· " + L[i])); }
        box.push(bigBtn(busy === "docs" ? "加载中..." : "加载完整 API 文档", loadDocs));
        if (docs) box.push(ctx.UI.Text({ text: docs, style: "bodySmall", color: onSurfaceVariant }));
        box.push(textRow("发消息用到的每一句话，都可在提示词页整段改写："));
        box.push(bigBtn("去提示词页 ->", goPrompts));
    }));
    children.push(ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: surfaceVariant, shape: { cornerRadius: 12, type: "rounded" }, text: "<- 返回主页", fillMaxWidth: true, onClick: goHome }));
    if (msg) {
        children.push(ctx.UI.Card({ containerColor: surfaceVariant, backgroundColor: surfaceVariant, shape: { cornerRadius: 12, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
            ctx.UI.Row({ backgroundColor: surfaceVariant, fillMaxWidth: true, padding: 12 }, [
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
