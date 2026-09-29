function Screen(ctx) {
    /* 随机上线 — 免打扰（静默）页（v1.9.0 二级页面） */
    var scheme = (ctx.MaterialTheme && ctx.MaterialTheme.colorScheme) ? ctx.MaterialTheme.colorScheme : {};
    var onSurface = scheme.onSurface || "#222222";
    var onSurfaceVariant = scheme.onSurfaceVariant || "#666666";
    var surfaceVariant = scheme.surfaceVariant || "#F2F2F2";
    var primary = scheme.primary || "#222222";

    var onS = ctx.useState("r_on", false); var on = onS[0], setOn = onS[1];
    var dOnS = ctx.useState("r_don", true); var dOn = dOnS[0], setDOn = dOnS[1];
    var dStartS = ctx.useState("r_ds", "09:00"); var dStart = dStartS[0], setDStart = dStartS[1];
    var dEndS = ctx.useState("r_de", "18:00"); var dEnd = dEndS[0], setDEnd = dEndS[1];
    var nOnS = ctx.useState("r_non", true); var nOn = nOnS[0], setNOn = nOnS[1];
    var nStartS = ctx.useState("r_ns", "22:00"); var nStart = nStartS[0], setNStart = nStartS[1];
    var nEndS = ctx.useState("r_ne", "09:00"); var nEnd = nEndS[0], setNEnd = nEndS[1];
    var chatS = ctx.useState("r_chat", ""); var chatName = chatS[0], setChatName = chatS[1];
    var linkS = ctx.useState("r_link", ""); var linked = linkS[0], setLinked = linkS[1];
    var msgS = ctx.useState("r_msg", ""); var msg = msgS[0], setMsg = msgS[1];
    var busyS = ctx.useState("r_busy", false); var busy = busyS[0], setBusy = busyS[1];
    var loadedS = ctx.useState("r_loaded", false); var loaded = loadedS[0], setLoaded = loadedS[1];

    async function load() {
        try {
            var r = await ctx.callTool("on_air:get_formula", {});
            var d = (r && r.success && r.data) ? r.data : null;
            if (d) {
                setOn(!!d.quiet_enabled);
                setDOn(d.quiet_day_enabled !== false);
                setNOn(d.quiet_night_enabled !== false);
                if (d.quiet_day_start) setDStart(String(d.quiet_day_start));
                if (d.quiet_day_end) setDEnd(String(d.quiet_day_end));
                if (d.quiet_night_start) setNStart(String(d.quiet_night_start));
                if (d.quiet_night_end) setNEnd(String(d.quiet_night_end));
                if (d.character_card_name) setChatName(String(d.character_card_name));
            }
        } catch (e) {}
        setLoaded(true);
    }

    async function doSave() {
        setBusy(true);
        try {
            var r = await ctx.callTool("on_air:update_formula", {
                quiet_enabled: on, quiet_day_enabled: dOn, quiet_night_enabled: nOn,
                quiet_day_start: String(dStart || "").trim(), quiet_day_end: String(dEnd || "").trim(),
                quiet_night_start: String(nStart || "").trim(), quiet_night_end: String(nEnd || "").trim()
            });
            setMsg(r && r.success ? "静默设置已保存" : ("保存失败：" + ((r && r.message) || "")));
        } catch (e) { setMsg("保存出错：" + String((e && e.message) || e)); }
        setBusy(false);
    }

    async function doLink() {
        setBusy(true);
        try {
            var r = await ctx.callTool("on_air:link_agent", { chat_name: String(chatName || "").trim() });
            if (r && r.success) {
                setLinked(String((r.data && r.data.chat_id) || ""));
                setMsg("已选中对话（无消息发出）");
            } else {
                setMsg("查找失败：" + ((r && r.message) || ""));
            }
        } catch (e) { setMsg("出错：" + String((e && e.message) || e)); }
        setBusy(false);
    }

    function goHome() { if (ctx.navigate) ctx.navigate("toolpkg:com.operit.on_air:ui:on_air_sidebar"); }

    var children = [];
    children.push(ctx.UI.Text({ text: "免打扰（静默）", style: "titleMedium", fontWeight: "semiBold", color: onSurface }));
    children.push(ctx.UI.Text({ text: "静默时段内停止 X 累加与主动唤醒；检测到设备活动会自动解除并告知。", style: "bodySmall", color: onSurfaceVariant }));

    var b1 = [];
    b1.push(ctx.UI.Row({ spacing: 8, fillMaxWidth: true }, [
        ctx.UI.Button({ contentColor: surfaceVariant, color: surfaceVariant, textColor: surfaceVariant, containerColor: on ? primary : surfaceVariant, shape: { cornerRadius: 12, type: "rounded" }, text: (on ? "✔ " : "") + "开启", weight: 1, onClick: function () { setOn(true); } }),
        ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: !on ? primary : surfaceVariant, shape: { cornerRadius: 12, type: "rounded" }, text: (!on ? "✔ " : "") + "关闭", weight: 1, onClick: function () { setOn(false); } })
    ]));
    children.push(ctx.UI.Card({ containerColor: surfaceVariant, backgroundColor: surfaceVariant, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
        ctx.UI.Column({ backgroundColor: surfaceVariant, fillMaxWidth: true, padding: 14, spacing: 6 }, b1)
    ]));

    var b2 = [];
    b2.push(ctx.UI.Text({ text: "白天段（如白天补觉 09:00~18:00）", style: "bodySmall", color: onSurfaceVariant }));
    b2.push(ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: surfaceVariant, shape: { cornerRadius: 12, type: "rounded" }, text: dOn ? "白天静默：开（点击切换）" : "白天静默：关（点击切换）", fillMaxWidth: true, onClick: function () { setDOn(!dOn); } }));
    b2.push(ctx.UI.Row({ spacing: 8, fillMaxWidth: true }, [
        ctx.UI.Column({ weight: 1 }, [
            ctx.UI.Text({ text: "开始 HH:MM", style: "bodySmall", color: onSurfaceVariant }),
            ctx.UI.TextField({ value: dStart, onValueChange: setDStart, singleLine: true, placeholder: ctx.UI.Text({ text: "09:00", color: onSurfaceVariant }), style: { color: onSurface } })
        ]),
        ctx.UI.Column({ weight: 1 }, [
            ctx.UI.Text({ text: "结束 HH:MM", style: "bodySmall", color: onSurfaceVariant }),
            ctx.UI.TextField({ value: dEnd, onValueChange: setDEnd, singleLine: true, placeholder: ctx.UI.Text({ text: "18:00", color: onSurfaceVariant }), style: { color: onSurface } })
        ])
    ]));
    children.push(ctx.UI.Card({ containerColor: surfaceVariant, backgroundColor: surfaceVariant, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
        ctx.UI.Column({ backgroundColor: surfaceVariant, fillMaxWidth: true, padding: 14, spacing: 6 }, b2)
    ]));

    var b3 = [];
    b3.push(ctx.UI.Text({ text: "夜间段（如睡觉 22:00~09:00，支持跨天）", style: "bodySmall", color: onSurfaceVariant }));
    b3.push(ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: surfaceVariant, shape: { cornerRadius: 12, type: "rounded" }, text: nOn ? "夜间静默：开（点击切换）" : "夜间静默：关（点击切换）", fillMaxWidth: true, onClick: function () { setNOn(!nOn); } }));
    b3.push(ctx.UI.Row({ spacing: 8, fillMaxWidth: true }, [
        ctx.UI.Column({ weight: 1 }, [
            ctx.UI.Text({ text: "开始 HH:MM", style: "bodySmall", color: onSurfaceVariant }),
            ctx.UI.TextField({ value: nStart, onValueChange: setNStart, singleLine: true, placeholder: ctx.UI.Text({ text: "22:00", color: onSurfaceVariant }), style: { color: onSurface } })
        ]),
        ctx.UI.Column({ weight: 1 }, [
            ctx.UI.Text({ text: "结束 HH:MM", style: "bodySmall", color: onSurfaceVariant }),
            ctx.UI.TextField({ value: nEnd, onValueChange: setNEnd, singleLine: true, placeholder: ctx.UI.Text({ text: "09:00", color: onSurfaceVariant }), style: { color: onSurface } })
        ])
    ]));
    b3.push(ctx.UI.Button({ contentColor: surfaceVariant, color: surfaceVariant, textColor: surfaceVariant, containerColor: primary, shape: { cornerRadius: 12, type: "rounded" }, text: busy ? "保存中…" : "保存静默设置", fillMaxWidth: true, onClick: doSave }));
    children.push(ctx.UI.Card({ containerColor: surfaceVariant, backgroundColor: surfaceVariant, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
        ctx.UI.Column({ backgroundColor: surfaceVariant, fillMaxWidth: true, padding: 14, spacing: 6 }, b3)
    ]));

    var b4 = [];
    b4.push(ctx.UI.Text({ text: "目标对话（用对话名字反查，不发任何消息）", style: "bodySmall", color: onSurfaceVariant }));
    b4.push(ctx.UI.TextField({ value: chatName, onValueChange: setChatName, singleLine: true, placeholder: ctx.UI.Text({ text: "对话的名字，如：猫娘", color: onSurfaceVariant }), style: { color: onSurface } }));
    b4.push(ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: surfaceVariant, shape: { cornerRadius: 12, type: "rounded" }, text: busy ? "查找中…" : "按名字选中对话", fillMaxWidth: true, onClick: doLink }));
    if (linked) b4.push(ctx.UI.Text({ text: "已选中对话 ID：" + linked, style: "bodySmall", color: onSurfaceVariant }));
    children.push(ctx.UI.Card({ containerColor: surfaceVariant, backgroundColor: surfaceVariant, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
        ctx.UI.Column({ backgroundColor: surfaceVariant, fillMaxWidth: true, padding: 14, spacing: 6 }, b4)
    ]));

    children.push(ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: surfaceVariant, shape: { cornerRadius: 12, type: "rounded" }, text: "← 返回主页", fillMaxWidth: true, onClick: goHome }));
    if (msg) {
        children.push(ctx.UI.Card({ containerColor: surfaceVariant, backgroundColor: surfaceVariant, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
            ctx.UI.Row({ backgroundColor: surfaceVariant, fillMaxWidth: true, padding: 14, verticalAlignment: "center" }, [
                ctx.UI.Text({ text: msg, style: "bodyMedium", color: onSurface, weight: 1 })
            ])
        ]));
    }

    return ctx.UI.LazyColumn({
        onLoad: async function () { if (!loaded) await load(); },
        fillMaxSize: true, padding: 16, spacing: 12
    }, children);
}

module.exports = Screen;
module.exports.default = Screen;
module.exports.Screen = Screen;
