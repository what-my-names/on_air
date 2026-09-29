function Screen(ctx) {
    /*
     * 随机上线 — 参数页（v1.9.0 二级页面）
     * X（离开时长）/ 公式 a·b·c / 唤醒冷却 / 角色卡名 / 停止上限
     */
    var scheme = (ctx.MaterialTheme && ctx.MaterialTheme.colorScheme) ? ctx.MaterialTheme.colorScheme : {};
    var onSurface = scheme.onSurface || "#222222";
    var onSurfaceVariant = scheme.onSurfaceVariant || "#666666";
    var surfaceVariant = scheme.surfaceVariant || "#F2F2F2";
    var primary = scheme.primary || "#222222";

    var xS = ctx.useState("q_x", "");  var xv = xS[0], setXv = xS[1];
    var aS = ctx.useState("q_a", "");  var av = aS[0], setAv = aS[1];
    var bS = ctx.useState("q_b", "");  var bv = bS[0], setBv = bS[1];
    var cS = ctx.useState("q_c", "");  var cv = cS[0], setCv = cS[1];
    var coolS = ctx.useState("q_cool", ""); var coolv = coolS[0], setCoolv = coolS[1];
    var cardS = ctx.useState("q_card", ""); var cardv = cardS[0], setCardv = cardS[1];
    var stopS = ctx.useState("q_stop", ""); var stopv = stopS[0], setStopv = stopS[1];
    var msgS = ctx.useState("q_msg", ""); var msg = msgS[0], setMsg = msgS[1];
    var busyS = ctx.useState("q_busy", false); var busy = busyS[0], setBusy = busyS[1];
    var loadedS = ctx.useState("q_loaded", false); var loaded = loadedS[0], setLoaded = loadedS[1];

    async function load() {
        try {
            var r = await ctx.callTool("on_air:get_formula", {});
            var d = (r && r.success && r.data) ? r.data : null;
            if (d) {
                setAv(String(d.a)); setBv(String(d.b)); setCv(String(d.c));
                setCoolv(String(d.cooldown_minutes != null ? d.cooldown_minutes : ""));
                setCardv(String(d.character_card_name || ""));
                setStopv(String(d.max_wake_stops != null ? d.max_wake_stops : 5));
            }
        } catch (e) {}
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
            var r = await ctx.callTool("on_air:update_formula", extra);
            setMsg(r && r.success ? okText : ("保存失败：" + ((r && r.message) || "")));
        } catch (e) { setMsg("保存出错：" + String((e && e.message) || e)); }
        setBusy(false);
    }

    function goHome() { if (ctx.navigate) ctx.navigate("toolpkg:com.operit.on_air:ui:on_air_sidebar"); }

    var yp = yPreview();
    var children = [];
    children.push(ctx.UI.Text({ text: "参数", style: "titleMedium", fontWeight: "semiBold", color: onSurface }));

    var box = [];
    box.push(ctx.UI.Text({ text: "X（离开时长 / 分钟）", style: "bodySmall", color: onSurfaceVariant }));
    box.push(ctx.UI.TextField({ value: xv, onValueChange: setXv, singleLine: true, placeholder: ctx.UI.Text({ text: "如 21", color: onSurfaceVariant }), style: { color: onSurface } }));
    box.push(ctx.UI.Text({ text: "写入后 y ≈ " + (yp != null ? yp + "%" : "—"), style: "bodySmall", color: onSurfaceVariant }));
    box.push(ctx.UI.Button({ contentColor: surfaceVariant, color: surfaceVariant, textColor: surfaceVariant, containerColor: primary, shape: { cornerRadius: 12, type: "rounded" }, text: busy ? "写入中…" : "写入 X", fillMaxWidth: true, onClick: async function () {
        setBusy(true);
        try {
            var r = await ctx.callTool("on_air:set_x", { x: parseFloat(xv) });
            setMsg(r && r.success ? "X 已写入：" + xv : ("写入失败：" + ((r && r.message) || "")));
        } catch (e) { setMsg("写入出错：" + String((e && e.message) || e)); }
        setBusy(false);
    } }));
    children.push(ctx.UI.Card({ containerColor: surfaceVariant, backgroundColor: surfaceVariant, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
        ctx.UI.Column({ backgroundColor: surfaceVariant, fillMaxWidth: true, padding: 14, spacing: 6 }, box)
    ]));

    var box2 = [];
    box2.push(ctx.UI.Text({ text: "公式参数（f = a·x + b·x^c）", style: "bodySmall", color: onSurfaceVariant }));
    box2.push(ctx.UI.TextField({ value: av, onValueChange: setAv, singleLine: true, placeholder: ctx.UI.Text({ text: "a 如 0.007078203", color: onSurfaceVariant }), style: { color: onSurface } }));
    box2.push(ctx.UI.TextField({ value: bv, onValueChange: setBv, singleLine: true, placeholder: ctx.UI.Text({ text: "b 如 6.00914e-07", color: onSurfaceVariant }), style: { color: onSurface } }));
    box2.push(ctx.UI.TextField({ value: cv, onValueChange: setCv, singleLine: true, placeholder: ctx.UI.Text({ text: "c 如 3.15168", color: onSurfaceVariant }), style: { color: onSurface } }));
    box2.push(ctx.UI.Button({ contentColor: surfaceVariant, color: surfaceVariant, textColor: surfaceVariant, containerColor: primary, shape: { cornerRadius: 12, type: "rounded" }, text: busy ? "保存中…" : "保存公式参数", fillMaxWidth: true, onClick: function () { save({ a: av, b: bv, c: cv }, "公式参数已保存"); } }));
    children.push(ctx.UI.Card({ containerColor: surfaceVariant, backgroundColor: surfaceVariant, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
        ctx.UI.Column({ backgroundColor: surfaceVariant, fillMaxWidth: true, padding: 14, spacing: 6 }, box2)
    ]));

    var box3 = [];
    box3.push(ctx.UI.Text({ text: "唤醒后冷却（分钟）", style: "bodySmall", color: onSurfaceVariant }));
    box3.push(ctx.UI.TextField({ value: coolv, onValueChange: setCoolv, singleLine: true, placeholder: ctx.UI.Text({ text: "15", color: onSurfaceVariant }), style: { color: onSurface } }));
    box3.push(ctx.UI.Button({ contentColor: surfaceVariant, color: surfaceVariant, textColor: surfaceVariant, containerColor: primary, shape: { cornerRadius: 12, type: "rounded" }, text: "保存冷却", fillMaxWidth: true, onClick: function () { save({ cooldown_minutes: coolv }, "冷却时间已保存"); } }));
    box3.push(ctx.UI.Text({ text: "角色卡名字（留空 = 跟随当前对话）", style: "bodySmall", color: onSurfaceVariant }));
    box3.push(ctx.UI.TextField({ value: cardv, onValueChange: setCardv, singleLine: true, placeholder: ctx.UI.Text({ text: "如 小喵", color: onSurfaceVariant }), style: { color: onSurface } }));
    box3.push(ctx.UI.Button({ contentColor: surfaceVariant, color: surfaceVariant, textColor: surfaceVariant, containerColor: primary, shape: { cornerRadius: 12, type: "rounded" }, text: "保存角色卡", fillMaxWidth: true, onClick: function () { save({ character_card_name: cardv }, "角色卡名字已保存"); } }));
    box3.push(ctx.UI.Text({ text: "连续命中停止上限 max_wake_stops（默认 5）", style: "bodySmall", color: onSurfaceVariant }));
    box3.push(ctx.UI.TextField({ value: stopv, onValueChange: setStopv, singleLine: true, placeholder: ctx.UI.Text({ text: "5", color: onSurfaceVariant }), style: { color: onSurface } }));
    box3.push(ctx.UI.Button({ contentColor: surfaceVariant, color: surfaceVariant, textColor: surfaceVariant, containerColor: primary, shape: { cornerRadius: 12, type: "rounded" }, text: "保存停止上限", fillMaxWidth: true, onClick: function () { save({ max_wake_stops: stopv }, "停止上限已保存"); } }));
    children.push(ctx.UI.Card({ containerColor: surfaceVariant, backgroundColor: surfaceVariant, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
        ctx.UI.Column({ backgroundColor: surfaceVariant, fillMaxWidth: true, padding: 14, spacing: 6 }, box3)
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
