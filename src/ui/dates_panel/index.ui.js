function Screen(ctx) {
    /* 随机上线 — 日期静默页（v1.9.0 二级页面）：日历点选 / 上学日 / 学生模式 / 节假日 */
    var scheme = (ctx.MaterialTheme && ctx.MaterialTheme.colorScheme) ? ctx.MaterialTheme.colorScheme : {};
    var onSurface = scheme.onSurface || "#222222";
    var onSurfaceVariant = scheme.onSurfaceVariant || "#666666";
    var surfaceVariant = scheme.surfaceVariant || "#F2F2F2";
    var primary = scheme.primary || "#222222";

    var nd = new Date();
    var yS = ctx.useState("s_y", nd.getFullYear()); var cy = yS[0], setCy = yS[1];
    var mS = ctx.useState("s_m", nd.getMonth()); var cm = mS[0], setCm = mS[1];
    var qdS = ctx.useState("s_qd", {}); var quietDates = qdS[0], setQuietDates = qdS[1];
    var holS = ctx.useState("s_hol", []); var holidays = holS[0], setHolidays = holS[1];
    var holFetchS = ctx.useState("s_hf", ""); var holFetch = holFetchS[0], setHolFetch = holFetchS[1];
    var busyS = ctx.useState("s_busy", false); var busy = busyS[0], setBusy = busyS[1];
    var onS = ctx.useState("s_on", true); var dateQuietOn = onS[0], setDateQuietOn = onS[1];
    var schS = ctx.useState("s_sch", false); var schoolAuto = schS[0], setSchoolAuto = schS[1];
    var stuS = ctx.useState("s_stu", true); var studentMode = stuS[0], setStudentMode = stuS[1];
    var msgS = ctx.useState("s_msg", ""); var msg = msgS[0], setMsg = msgS[1];
    var loadedS = ctx.useState("s_loaded", false); var loaded = loadedS[0], setLoaded = loadedS[1];

    function pad2(n) { return (n < 10 ? "0" : "") + n; }
    function ds(y, m, d) { return y + "-" + pad2(m + 1) + "-" + pad2(d); }

    async function load() {
        try {
            var r = await ctx.callTool("on_air:get_formula", {});
            var d = (r && r.success && r.data) ? r.data : null;
            if (d) {
                setQuietDates(d.quiet_dates && typeof d.quiet_dates === "object" ? d.quiet_dates : {});
                setHolidays(Array.isArray(d.holiday_dates) ? d.holiday_dates : []);
                setHolFetch(String(d.holiday_fetch_date || ""));
                setDateQuietOn(d.date_quiet_enabled !== false);
                setSchoolAuto(!!d.school_day_auto_quiet);
                setStudentMode(d.student_mode !== false);
            }
        } catch (e) {}
        setLoaded(true);
    }

    async function toggleDate(key) {
        var next = {};
        for (var k in quietDates) { if (quietDates[k] === "full") next[k] = "full"; }
        if (next[key]) { delete next[key]; } else { next[key] = "full"; }
        setQuietDates(next);
        setBusy(true);
        try {
            var r = await ctx.callTool("on_air:update_formula", { quiet_dates: JSON.stringify(next) });
            setMsg(r && r.success ? (key + (r.data && r.data.quiet_dates && r.data.quiet_dates[key] ? " 已设为全天静默" : " 已取消静默")) : ("保存失败：" + ((r && r.message) || "")));
        } catch (e) { setMsg("出错：" + String((e && e.message) || e)); }
        setBusy(false);
    }

    async function saveFlag(extra, okText) {
        setBusy(true);
        try {
            var r = await ctx.callTool("on_air:update_formula", extra);
            setMsg(r && r.success ? okText : ("保存失败：" + ((r && r.message) || "")));
        } catch (e) { setMsg("出错：" + String((e && e.message) || e)); }
        setBusy(false);
    }

    async function doFetchHolidays() {
        setBusy(true);
        try {
            var r = await ctx.callTool("on_air:fetch_holidays", {});
            setMsg(r && r.success ? "节假日表已更新" : ("更新失败：" + ((r && r.message) || "")));
            if (r && r.success) await load();
        } catch (e) { setMsg("出错：" + String((e && e.message) || e)); }
        setBusy(false);
    }

    function goHome() { if (ctx.navigate) ctx.navigate("toolpkg:com.operit.on_air:ui:on_air_sidebar"); }

    var first = new Date(cy, cm, 1);
    var startDow = first.getDay();
    var dim = new Date(cy, cm + 1, 0).getDate();
    var cells = [];
    for (var i = 0; i < startDow; i++) cells.push(null);
    for (var d2 = 1; d2 <= dim; d2++) cells.push(d2);
    while (cells.length % 7 !== 0) cells.push(null);

    var children = [];
    children.push(ctx.UI.Text({ text: "日期静默", style: "titleMedium", fontWeight: "semiBold", color: onSurface }));
    children.push(ctx.UI.Text({ text: "点选日期 = 全天硬静默（不因设备活动解除）；蓝色=已静默", style: "bodySmall", color: onSurfaceVariant }));

    var head = [];
    head.push(ctx.UI.Row({ spacing: 8, fillMaxWidth: true }, [
        ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: surfaceVariant, shape: { cornerRadius: 12, type: "rounded" }, text: "← 上月", weight: 1, onClick: function () { var nm = cm - 1; var ny = cy; if (nm < 0) { nm = 11; ny = ny - 1; } setCm(nm); setCy(ny); } }),
        ctx.UI.Text({ text: cy + " 年 " + (cm + 1) + " 月", style: "bodyMedium", color: onSurface, weight: 1 }),
        ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: surfaceVariant, shape: { cornerRadius: 12, type: "rounded" }, text: "下月 →", weight: 1, onClick: function () { var nm = cm + 1; var ny = cy; if (nm > 11) { nm = 0; ny = ny + 1; } setCm(nm); setCy(ny); } })
    ]));
    head.push(ctx.UI.Row({ spacing: 4, fillMaxWidth: true }, ["日", "一", "二", "三", "四", "五", "六"].map(function (w) {
        return ctx.UI.Text({ text: w, style: "bodySmall", color: onSurfaceVariant, weight: 1 });
    })));
    for (var r2 = 0; r2 < cells.length; r2 += 7) {
        var week = cells.slice(r2, r2 + 7);
        var rowKids = [];
        for (var j = 0; j < 7; j++) {
            var dn = week[j];
            if (dn == null) {
                rowKids.push(ctx.UI.Text({ text: "", weight: 1 }));
            } else {
                var key = ds(cy, cm, dn);
                var isQ = !!quietDates[key];
                rowKids.push(ctx.UI.Button({ contentColor: isQ ? surfaceVariant : onSurface, color: isQ ? surfaceVariant : onSurface, textColor: isQ ? surfaceVariant : onSurface, containerColor: isQ ? primary : surfaceVariant, shape: { cornerRadius: 10, type: "rounded" }, text: String(dn), weight: 1, onClick: (function (k2) { return function () { toggleDate(k2); }; })(key) }));
            }
        }
        head.push(ctx.UI.Row({ spacing: 4, fillMaxWidth: true }, rowKids));
    }
    children.push(ctx.UI.Card({ containerColor: surfaceVariant, backgroundColor: surfaceVariant, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
        ctx.UI.Column({ backgroundColor: surfaceVariant, fillMaxWidth: true, padding: 14, spacing: 6 }, head)
    ]));

    var flags = [];
    flags.push(ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: dateQuietOn ? primary : surfaceVariant, shape: { cornerRadius: 12, type: "rounded" }, text: dateQuietOn ? "日期静默总开关：开" : "日期静默总开关：关", fillMaxWidth: true, onClick: function () { var v = !dateQuietOn; setDateQuietOn(v); saveFlag({ date_quiet_enabled: v }, v ? "总开关已开启" : "总开关已关闭"); } }));
    flags.push(ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: schoolAuto ? primary : surfaceVariant, shape: { cornerRadius: 12, type: "rounded" }, text: schoolAuto ? "上学日自动静默：开" : "上学日自动静默：关", fillMaxWidth: true, onClick: function () { var v = !schoolAuto; setSchoolAuto(v); saveFlag({ school_day_auto_quiet: v }, v ? "上学日静默已开启" : "上学日静默已关闭"); } }));
    flags.push(ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: studentMode ? primary : surfaceVariant, shape: { cornerRadius: 12, type: "rounded" }, text: studentMode ? "学生模式：开（寒暑假算特殊日）" : "学生模式：关（成年人）", fillMaxWidth: true, onClick: function () { var v = !studentMode; setStudentMode(v); saveFlag({ student_mode: v }, v ? "学生模式已开启" : "学生模式已关闭"); } }));
    flags.push(ctx.UI.Text({ text: holFetch ? ("节假日表更新于 " + holFetch + "，共 " + holidays.length + " 天") : "节假日表尚未联网更新（暂用内置表）", style: "bodySmall", color: onSurfaceVariant }));
    flags.push(ctx.UI.Button({ contentColor: onSurface, color: onSurface, textColor: onSurface, containerColor: surfaceVariant, shape: { cornerRadius: 12, type: "rounded" }, text: busy ? "处理中…" : "立即更新节假日表", fillMaxWidth: true, onClick: doFetchHolidays }));
    children.push(ctx.UI.Card({ containerColor: surfaceVariant, backgroundColor: surfaceVariant, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
        ctx.UI.Column({ backgroundColor: surfaceVariant, fillMaxWidth: true, padding: 14, spacing: 6 }, flags)
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
