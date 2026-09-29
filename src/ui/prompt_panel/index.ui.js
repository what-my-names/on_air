function Screen(ctx) {
    /*
     * 随机上线 — 提示词设置页（v1.9.0 新增）
     *
     * 让用户自定义插件递给 AI 的每一句话（8 处）：
     *   1 手动触发·默认模式    2 手动触发·自定义前缀
     *   3 自动触发·默认模式    4 自动触发·自定义前缀
     *   5 温柔巡检通道        6 置气消息
     *   7 静默解除通知        8 档位话术库（每行一档，档内多条用 | 分隔）
     *
     * 规则：留空 = 回落内置默认；每格可整段重写；「恢复默认」一键还原。
     * 占位符（可选，不写也能用）：{档位} {次数} {话术} {时间} {原因} {静默时段} {上限}
     */
    var scheme = (ctx.MaterialTheme && ctx.MaterialTheme.colorScheme) ? ctx.MaterialTheme.colorScheme : {};
    var onSurface = scheme.onSurface || "#222222";
    var onSurfaceVariant = scheme.onSurfaceVariant || "#666666";
    var surfaceVariant = scheme.surfaceVariant || "#F2F2F2";
    var primary = scheme.primary || "#222222";

    // ===== 输入框状态（显式声明 8 个，不在循环里调 hook）=====
    var sMD = ctx.useState("p_md", "");
    var sMP = ctx.useState("p_mp", "");
    var sAD = ctx.useState("p_ad", "");
    var sAP = ctx.useState("p_ap", "");
    var sG = ctx.useState("p_g", "");
    var sS = ctx.useState("p_s", "");
    var sQ = ctx.useState("p_q", "");
    var sT = ctx.useState("p_t", "");
    var vMD = sMD[0], setMD = sMD[1];
    var vMP = sMP[0], setMP = sMP[1];
    var vAD = sAD[0], setAD = sAD[1];
    var vAP = sAP[0], setAP = sAP[1];
    var vG = sG[0], setG = sG[1];
    var vS = sS[0], setS = sS[1];
    var vQ = sQ[0], setQ = sQ[1];
    var vT = sT[0], setT = sT[1];

    // ===== 页面状态 =====
    var msgState = ctx.useState("p_msg", "");
    var msg = msgState[0], setMsg = msgState[1];
    var busyState = ctx.useState("p_busy", false);
    var busy = busyState[0], setBusy = busyState[1];
    var loadedState = ctx.useState("p_loaded", false);
    var loaded = loadedState[0], setLoaded = loadedState[1];

    // ===== 读取当前值 =====
    async function load() {
        try {
            var r = await ctx.callTool("on_air:get_formula", {});
            var d = (r && r.success && r.data) ? r.data : null;
            if (d) {
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
                    for (var i = 0; i < t.length; i++) {
                        lines.push(Array.isArray(t[i]) ? t[i].join("|") : "");
                    }
                    setT(lines.join("\n"));
                }
            }
        } catch (e) { /* 读取失败保持空 */ }
        setLoaded(true);
    }

    // ===== 保存 =====
    async function doSave() {
        setBusy(true);
        try {
            var params = {
                prompt_manual_default: String(vMD == null ? "" : vMD),
                prompt_manual_prefix: String(vMP == null ? "" : vMP),
                prompt_auto_default: String(vAD == null ? "" : vAD),
                prompt_auto_prefix: String(vAP == null ? "" : vAP),
                prompt_gentle: String(vG == null ? "" : vG),
                prompt_stop: String(vS == null ? "" : vS),
                prompt_quiet_lifted: String(vQ == null ? "" : vQ)
            };
            var lines = String(vT == null ? "" : vT).split("\n");
            var tiers = [];
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (!line) continue;
                var parts = [];
                var segs = line.split("|");
                for (var j = 0; j < segs.length; j++) {
                    var s = segs[j].trim();
                    if (s) parts.push(s);
                }
                if (parts.length) tiers.push(parts);
            }
            if (tiers.length) params.jealousy_tiers = JSON.stringify(tiers);
            var r = await ctx.callTool("on_air:update_formula", params);
            setMsg(r && r.success ? "已保存（留空的格子会用内置默认）" : ("保存失败：" + ((r && r.message) || "")));
        } catch (e) {
            setMsg("保存出错：" + String((e && e.message) || e));
        }
        setBusy(false);
    }

    // ===== 恢复默认 =====
    async function doReset() {
        setBusy(true);
        try {
            var r = await ctx.callTool("on_air:update_formula", { reset_prompts: true });
            if (r && r.success) {
                setMsg("已恢复全部默认提示词");
                await load();
            } else {
                setMsg("恢复失败：" + ((r && r.message) || ""));
            }
        } catch (e) {
            setMsg("恢复出错：" + String((e && e.message) || e));
        }
        setBusy(false);
    }

    // ===== 返回主页 =====
    function goHome() {
        if (ctx.navigate) ctx.navigate("toolpkg:com.operit.on_air:ui:on_air_sidebar");
    }

    // ===== 渲染 =====
    var children = [];
    children.push(ctx.UI.Text({ text: "提示词设置", style: "titleMedium", fontWeight: "semiBold", color: onSurface }));
    children.push(ctx.UI.Text({ text: "把插件递给 AI 的话改成你自己想要的。留空 = 用内置默认。", style: "bodySmall", color: onSurfaceVariant }));
    children.push(ctx.UI.Text({ text: "可选占位符：{档位} {次数} {话术} {时间} {原因} {静默时段} {上限}", style: "bodySmall", color: onSurfaceVariant }));

    var BLOCKS = [
        ["1 手动触发 · 默认模式", "AI 自己组织语言", vMD, setMD],
        ["2 手动触发 · 自定义前缀", "可用 {话术} 指定话术插入点", vMP, setMP],
        ["3 自动触发 · 默认模式", "可用 {档位} {次数}", vAD, setAD],
        ["4 自动触发 · 自定义前缀", "可用 {话术} {档位} {次数}", vAP, setAP],
        ["5 温柔巡检通道", "装了温柔巡检时走这条", vG, setG],
        ["6 置气消息", "可用 {次数} {上限}", vS, setS],
        ["7 静默解除通知", "可用 {原因} {静默时段}", vQ, setQ]
    ];
    for (var bi = 0; bi < BLOCKS.length; bi++) {
        var blk = BLOCKS[bi];
        var box = [];
        box.push(ctx.UI.Text({ text: blk[0], style: "bodyMedium", fontWeight: "semiBold", color: onSurface }));
        box.push(ctx.UI.Text({ text: blk[1], style: "bodySmall", color: onSurfaceVariant }));
        box.push(ctx.UI.TextField({
            value: blk[2],
            onValueChange: blk[3],
            singleLine: false,
            placeholder: ctx.UI.Text({ text: "（留空 = 使用内置默认）", color: onSurfaceVariant }),
            style: { color: onSurface }
        }));
        children.push(ctx.UI.Card({ containerColor: surfaceVariant, backgroundColor: surfaceVariant, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
            ctx.UI.Column({ backgroundColor: surfaceVariant, fillMaxWidth: true, padding: 14, spacing: 6 }, box)
        ]));
    }

    // 8 档位话术库
    children.push(ctx.UI.Card({ containerColor: surfaceVariant, backgroundColor: surfaceVariant, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
        ctx.UI.Column({ backgroundColor: surfaceVariant, fillMaxWidth: true, padding: 14, spacing: 6 }, [
            ctx.UI.Text({ text: "8 档位话术库", style: "bodyMedium", fontWeight: "semiBold", color: onSurface }),
            ctx.UI.Text({ text: "一行一档，档内多条话术用 | 分隔（第 1 行 = 第 1 档）", style: "bodySmall", color: onSurfaceVariant }),
            ctx.UI.TextField({
                value: vT,
                onValueChange: setT,
                singleLine: false,
                placeholder: ctx.UI.Text({ text: "想你了，你在忙什么呀？|有空吗？陪我聊聊天好不好？", color: onSurfaceVariant }),
                style: { color: onSurface }
            })
        ])
    ]));

    // 操作行
    children.push(ctx.UI.Row({ spacing: 8, fillMaxWidth: true }, [
        ctx.UI.Button({ contentColor: surfaceVariant, color: surfaceVariant, textColor: surfaceVariant, containerColor: primary, shape: { cornerRadius: 12, type: "rounded" }, text: busy ? "保存中…" : "保存", fillMaxWidth: true, weight: 1, onClick: doSave }),
        ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: surfaceVariant, shape: { cornerRadius: 12, type: "rounded" }, text: "恢复默认", fillMaxWidth: true, weight: 1, onClick: doReset })
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
        onLoad: async function () {
            if (!loaded) await load();
        },
        fillMaxSize: true,
        padding: 16,
        spacing: 12
    }, children);
}

module.exports = Screen;
module.exports.default = Screen;
module.exports.Screen = Screen;
