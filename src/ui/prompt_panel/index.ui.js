function Screen(ctx) {
    /*
     * 随机上线 — 提示词与话术设置页（v1.9.1）
     *
     * 三组折叠式：
     *   一、触发引导（4）  二、特殊场景（3）  三、话术与发送（3）
     * 收起时只看标题 + 状态 + 摘要，点标题展开文本框。
     * 留空 = 回落内置默认；支持一键恢复默认。
     * 占位符（可选）：{档位} {次数} {话术} {时间} {原因} {静默时段} {上限}
     */
    var scheme = (ctx.MaterialTheme && ctx.MaterialTheme.colorScheme) ? ctx.MaterialTheme.colorScheme : {};
    var onSurface = scheme.onSurface || "#222222";
    var onSurfaceVariant = scheme.onSurfaceVariant || "#666666";
    var surfaceVariant = scheme.surfaceVariant || "#F2F2F2";
    var primary = scheme.primary || "#222222";
    var errColor = scheme.error || "#B00020";

    // ===== 输入值状态 =====
    var mdS = ctx.useState("q1_md", ""); var vMD = mdS[0], setMD = mdS[1];
    var mpS = ctx.useState("q1_mp", ""); var vMP = mpS[0], setMP = mpS[1];
    var adS = ctx.useState("q1_ad", ""); var vAD = adS[0], setAD = adS[1];
    var apS = ctx.useState("q1_ap", ""); var vAP = apS[0], setAP = apS[1];
    var gS = ctx.useState("q1_g", ""); var vG = gS[0], setG = gS[1];
    var sS = ctx.useState("q1_s", ""); var vS = sS[0], setS = sS[1];
    var qS = ctx.useState("q1_q", ""); var vQ = qS[0], setQ = qS[1];
    var tS = ctx.useState("q1_t", ""); var vT = tS[0], setT = tS[1];
    var talkS = ctx.useState("q1_talk", ""); var vTalk = talkS[0], setTalk = talkS[1];
    var modeS = ctx.useState("q1_mode", "default"); var vMode = modeS[0], setMode = modeS[1];
    var sendS = ctx.useState("q1_send", "A1"); var vSend = sendS[0], setSend = sendS[1];

    // ===== 页面状态 =====
    var msgS = ctx.useState("q1_msg", ""); var msg = msgS[0], setMsg = msgS[1];
    var errS = ctx.useState("q1_err", ""); var errMsg = errS[0], setErrMsg = errS[1];
    var busyS = ctx.useState("q1_busy", false); var busy = busyS[0], setBusy = busyS[1];
    var custS = ctx.useState("q1_cust", "{}"); var custRaw = custS[0], setCust = custS[1];
    var openS = ctx.useState("q1_open", "{}"); var openRaw = openS[0], setOpen = openS[1];

    var cust = {};
    try { cust = JSON.parse(custRaw || "{}"); } catch (e) { cust = {}; }
    var openObj = {};
    try { openObj = JSON.parse(openRaw || "{}"); } catch (e) { openObj = {}; }

    // ===== 分组定义 =====
    var GROUPS = [
        { title: "一、触发引导（4 处）", items: [
            { k: "prompt_manual_default", label: "1 手动触发 · 默认模式", hint: "AI 自己组织语言", val: function () { return vMD; }, set: setMD },
            { k: "prompt_manual_prefix", label: "2 手动触发 · 自定义前缀", hint: "可用 {话术} 指定插入点", val: function () { return vMP; }, set: setMP },
            { k: "prompt_auto_default", label: "3 自动触发 · 默认模式", hint: "可用 {档位} {次数}", val: function () { return vAD; }, set: setAD },
            { k: "prompt_auto_prefix", label: "4 自动触发 · 自定义前缀", hint: "可用 {话术} {档位} {次数}", val: function () { return vAP; }, set: setAP }
        ]},
        { title: "二、特殊场景（3 处）", items: [
            { k: "prompt_gentle", label: "5 温柔巡检通道", hint: "装了温柔巡检时走这条", val: function () { return vG; }, set: setG },
            { k: "prompt_stop", label: "6 置气消息", hint: "连续命中达上限时发出；可用 {次数} {上限}", val: function () { return vS; }, set: setS },
            { k: "prompt_quiet_lifted", label: "7 静默解除通知", hint: "可用 {原因} {静默时段}", val: function () { return vQ; }, set: setQ }
        ]},
        { title: "三、话术与发送（3 项）", items: [
            { k: "jealousy_tiers", label: "8 档位话术库", hint: "一行一档，档内多条用 | 分隔", val: function () { return vT; }, set: setT },
            { k: "awake_messages", label: "9 话术库", hint: "每行一句；custom 模式下随机抽一句", val: function () { return vTalk; }, set: setTalk },
            { k: "awake_mode", label: "10 话术模式", hint: "default=AI 自己发挥 / custom=用话术库", val: null, set: null },
            { k: "send_mode", label: "11 发送方式", hint: "A1=自己唤醒 / A2=借温柔巡检通道（需装温柔巡检，未装自动回落 A1）", val: null, set: null }
        ]}
    ];

    function isOpen(k) { return !!openObj[k]; }
    function toggle(k) {
        var m = {};
        for (var kk in openObj) { m[kk] = openObj[kk]; }
        if (m[k]) { delete m[k]; } else { m[k] = true; }
        setOpen(JSON.stringify(m));
    }
    function setAll(v) {
        var m = {};
        if (v) {
            for (var gi = 0; gi < GROUPS.length; gi++) {
                for (var ii = 0; ii < GROUPS[gi].items.length; ii++) { m[GROUPS[gi].items[ii].k] = true; }
            }
        }
        setOpen(JSON.stringify(m));
    }
    function summary(txt, n) {
        var s = String(txt == null ? "" : txt).replace(/\n/g, " ").trim();
        return s.length > n ? s.slice(0, n) + "…" : s;
    }
    function isCustom(k) { return !!cust[k]; }

    // ===== 读取（v1.9.1：失败要显示，不再静默）=====
    async function load() {
        setErrMsg("");
        try {
            var r = await ctx.callTool("on_air:get_formula", {});
            if (!r || !r.success || !r.data) {
                setErrMsg("读取配置失败：" + ((r && r.message) || "返回为空"));
                return;
            }
            var d = r.data;
            setMD(d.prompt_manual_default || "");
            setMP(d.prompt_manual_prefix || "");
            setAD(d.prompt_auto_default || "");
            setAP(d.prompt_auto_prefix || "");
            setG(d.prompt_gentle || "");
            setS(d.prompt_stop || "");
            setQ(d.prompt_quiet_lifted || "");
            var t = d.jealousy_tiers;
            if (Array.isArray(t)) {
                var lines = [];
                for (var i = 0; i < t.length; i++) { lines.push(Array.isArray(t[i]) ? t[i].join("|") : ""); }
                setT(lines.join("\n"));
            }
            setTalk(Array.isArray(d.awake_messages) ? d.awake_messages.join("\n") : "");
            setMode(d.awake_mode || "default");
            setSend(d.send_mode || "A1");
            setCust(JSON.stringify(d.prompt_customized || {}));
        } catch (e) {
            setErrMsg("读取出错：" + String((e && e.message) || e));
        }
    }

    async function doSave() {
        setBusy(true);
        setErrMsg("");
        try {
            var params = {
                prompt_manual_default: String(vMD || ""),
                prompt_manual_prefix: String(vMP || ""),
                prompt_auto_default: String(vAD || ""),
                prompt_auto_prefix: String(vAP || ""),
                prompt_gentle: String(vG || ""),
                prompt_stop: String(vS || ""),
                prompt_quiet_lifted: String(vQ || ""),
                awake_mode: vMode,
                send_mode: vSend
            };
            var tl = String(vT || "").split("\n");
            var tiers = [];
            for (var i = 0; i < tl.length; i++) {
                var line = tl[i].trim();
                if (!line) continue;
                var parts = [];
                var segs = line.split("|");
                for (var j = 0; j < segs.length; j++) { var x = segs[j].trim(); if (x) parts.push(x); }
                if (parts.length) tiers.push(parts);
            }
            if (tiers.length) params.jealousy_tiers = JSON.stringify(tiers);
            var tkl = String(vTalk || "").split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
            if (tkl.length) params.awake_messages = JSON.stringify(tkl);
            var r = await ctx.callTool("on_air:update_formula", params);
            setMsg(r && r.success ? "已保存（留空的格子会回落内置默认）" : "");
            if (!r || !r.success) setErrMsg("保存失败：" + ((r && r.message) || ""));
            if (r && r.success) await load();
        } catch (e) {
            setErrMsg("保存出错：" + String((e && e.message) || e));
        }
        setBusy(false);
    }

    async function doReset() {
        setBusy(true);
        setErrMsg("");
        try {
            var r = await ctx.callTool("on_air:update_formula", { reset_prompts: true });
            if (r && r.success) { setMsg("已恢复全部默认"); await load(); }
            else { setErrMsg("恢复失败：" + ((r && r.message) || "")); }
        } catch (e) { setErrMsg("恢复出错：" + String((e && e.message) || e)); }
        setBusy(false);
    }

    function goHome() { if (ctx.navigate) ctx.navigate("toolpkg:com.operit.on_air:ui:on_air_sidebar"); }

    // ===== 渲染 =====
    var children = [];
    children.push(ctx.UI.Text({ text: "提示词与话术", style: "titleMedium", fontWeight: "semiBold", color: onSurface }));
    children.push(ctx.UI.Text({ text: "这里是插件递给 AI 的全部内容。收起时看摘要，点标题展开编辑；留空 = 用内置默认。", style: "bodySmall", color: onSurfaceVariant }));
    children.push(ctx.UI.Text({ text: "可选占位符：{档位} {次数} {话术} {时间} {原因} {静默时段} {上限}", style: "bodySmall", color: onSurfaceVariant }));

    if (errMsg) {
        children.push(ctx.UI.Card({ containerColor: surfaceVariant, backgroundColor: surfaceVariant, shape: { cornerRadius: 12, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
            ctx.UI.Row({ backgroundColor: surfaceVariant, fillMaxWidth: true, padding: 12 }, [
                ctx.UI.Text({ text: "⚠ " + errMsg, style: "bodySmall", color: errColor, weight: 1 })
            ])
        ]));
    }

    children.push(ctx.UI.Row({ spacing: 8, fillMaxWidth: true }, [
        ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: surfaceVariant, shape: { cornerRadius: 12, type: "rounded" }, text: "全部展开", weight: 1, onClick: function () { setAll(true); } }),
        ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: surfaceVariant, shape: { cornerRadius: 12, type: "rounded" }, text: "全部收起", weight: 1, onClick: function () { setAll(false); } }),
        ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: surfaceVariant, shape: { cornerRadius: 12, type: "rounded" }, text: busy ? "…" : "恢复默认", weight: 1, onClick: doReset })
    ]));

    for (var gi2 = 0; gi2 < GROUPS.length; gi2++) {
        var grp = GROUPS[gi2];
        var box = [];
        box.push(ctx.UI.Text({ text: grp.title, style: "titleSmall", fontWeight: "semiBold", color: onSurface }));
        for (var ii2 = 0; ii2 < grp.items.length; ii2++) {
            (function (it) {
                var openIt = isOpen(it.k);
                var yes = isCustom(it.k);
                var headText = (openIt ? "▾ " : "▸ ") + it.label + "    " + (yes ? "〔已改〕" : "〔默认〕");
                box.push(ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: surfaceVariant, shape: { cornerRadius: 10, type: "rounded" }, text: headText, fillMaxWidth: true, onClick: function () { toggle(it.k); } }));
                if (it.k === "awake_mode") {
                    if (openIt) {
                        box.push(ctx.UI.Text({ text: it.hint, style: "bodySmall", color: onSurfaceVariant }));
                        box.push(ctx.UI.Row({ spacing: 8, fillMaxWidth: true }, [
                            ctx.UI.Button({ contentColor: vMode === "default" ? surfaceVariant : onSurface, color: vMode === "default" ? surfaceVariant : onSurface, textColor: vMode === "default" ? surfaceVariant : onSurface, containerColor: vMode === "default" ? primary : surfaceVariant, shape: { cornerRadius: 10, type: "rounded" }, text: (vMode === "default" ? "✔ " : "") + "AI 自己发挥", weight: 1, onClick: function () { setMode("default"); } }),
                            ctx.UI.Button({ contentColor: vMode === "custom" ? surfaceVariant : onSurface, color: vMode === "custom" ? surfaceVariant : onSurface, textColor: vMode === "custom" ? surfaceVariant : onSurface, containerColor: vMode === "custom" ? primary : surfaceVariant, shape: { cornerRadius: 10, type: "rounded" }, text: (vMode === "custom" ? "✔ " : "") + "用话术库", weight: 1, onClick: function () { setMode("custom"); } })
                        ]));
                    } else {
                        box.push(ctx.UI.Text({ text: "   当前：" + (vMode === "custom" ? "用话术库" : "AI 自己发挥"), style: "bodySmall", color: onSurfaceVariant }));
                    }
                    return;
                }
                if (it.k === "send_mode") {
                    if (openIt) {
                        box.push(ctx.UI.Text({ text: it.hint, style: "bodySmall", color: onSurfaceVariant }));
                        box.push(ctx.UI.Row({ spacing: 8, fillMaxWidth: true }, [
                            ctx.UI.Button({ contentColor: vSend === "A1" ? surfaceVariant : onSurface, color: vSend === "A1" ? surfaceVariant : onSurface, textColor: vSend === "A1" ? surfaceVariant : onSurface, containerColor: vSend === "A1" ? primary : surfaceVariant, shape: { cornerRadius: 10, type: "rounded" }, text: (vSend === "A1" ? "✔ " : "") + "A1 自己唤醒", weight: 1, onClick: function () { setSend("A1"); } }),
                            ctx.UI.Button({ contentColor: vSend === "A2" ? surfaceVariant : onSurface, color: vSend === "A2" ? surfaceVariant : onSurface, textColor: vSend === "A2" ? surfaceVariant : onSurface, containerColor: vSend === "A2" ? primary : surfaceVariant, shape: { cornerRadius: 10, type: "rounded" }, text: (vSend === "A2" ? "✔ " : "") + "A2 温柔巡检", weight: 1, onClick: function () { setSend("A2"); } })
                        ]));
                    } else {
                        box.push(ctx.UI.Text({ text: "   当前：" + (vSend === "A2" ? "A2 借温柔巡检通道" : "A1 自己唤醒"), style: "bodySmall", color: onSurfaceVariant }));
                    }
                    return;
                }
                if (openIt) {
                    box.push(ctx.UI.Text({ text: it.hint, style: "bodySmall", color: onSurfaceVariant }));
                    box.push(ctx.UI.TextField({ value: it.val(), onValueChange: it.set, singleLine: false, placeholder: ctx.UI.Text({ text: "（留空 = 使用内置默认）", color: onSurfaceVariant }), style: { color: onSurface } }));
                } else {
                    box.push(ctx.UI.Text({ text: "   " + summary(it.val(), 30), style: "bodySmall", color: onSurfaceVariant }));
                }
            })(grp.items[ii2]);
        }
        children.push(ctx.UI.Card({ containerColor: surfaceVariant, backgroundColor: surfaceVariant, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
            ctx.UI.Column({ backgroundColor: surfaceVariant, fillMaxWidth: true, padding: 14, spacing: 8 }, box)
        ]));
    }

    children.push(ctx.UI.Button({ contentColor: surfaceVariant, color: surfaceVariant, textColor: surfaceVariant, containerColor: primary, shape: { cornerRadius: 12, type: "rounded" }, text: busy ? "保存中…" : "保存全部", fillMaxWidth: true, onClick: doSave }));
    children.push(ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: surfaceVariant, shape: { cornerRadius: 12, type: "rounded" }, text: "← 返回主页", fillMaxWidth: true, onClick: goHome }));
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
