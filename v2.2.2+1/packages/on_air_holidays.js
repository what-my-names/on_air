/*
 * on_air_holidays.js — 日历/节假日判断 + 节假日联网拉取
 * v2.2.2+1：从 on_air.js 拆出（原 370-511 + 779-859 + 2520-2555）
 * 依赖注入：createHttpClient / loadFormula / saveFormula / notifyUser / parseHm / inTimeRange
 * 宿主全局：Tools / complete
 */
function createHolidaysModule(deps) {
    var createHttpClient = deps.createHttpClient;
    var loadFormula = deps.loadFormula;
    var saveFormula = deps.saveFormula;
    var notifyUser = deps.notifyUser;
    var parseHm = deps.parseHm;
    var inTimeRange = deps.inTimeRange;
// ============ 日历与节假日工具（v1.5.8） ============
// 本地日期字符串工具
function pad2(n) { return (n < 10 ? "0" : "") + n; }
function dateStrOf(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
function todayStr() { return dateStrOf(new Date()); }

// 把 "YYYY-MM-DD"~"YYYY-MM-DD" 闭区间展开成日期数组（用于内置节假日表，代码里写区间更省事）
function expandDateRange(startStr, endStr) {
    var out = [];
    try {
        var a = new Date(parseInt(startStr.slice(0, 4), 10), parseInt(startStr.slice(5, 7), 10) - 1, parseInt(startStr.slice(8, 10), 10));
        var b = new Date(parseInt(endStr.slice(0, 4), 10), parseInt(endStr.slice(5, 7), 10) - 1, parseInt(endStr.slice(8, 10), 10));
        var t = new Date(a.getTime());
        while (t.getTime() <= b.getTime()) {
            out.push(dateStrOf(t));
            t = new Date(t.getTime() + 86400000);
        }
    } catch (e) {}
    return out;
}

// 内置2026年中国法定节假日（放假日期，国务院公布口径）。仅作离线兜底：
// 每天12点联网拉取成功后会以官方数据覆盖；网络失败时用它保证节假日静默可用。
var BUILTIN_HOLIDAY_RANGES_2026 = [
    ["2026-01-01", "2026-01-03"],  // 元旦
    ["2026-02-15", "2026-02-21"],  // 春节
    ["2026-04-04", "2026-04-06"],  // 清明节
    ["2026-05-01", "2026-05-05"],  // 劳动节
    ["2026-06-19", "2026-06-21"],  // 端午节
    ["2026-09-25", "2026-09-27"],  // 中秋节
    ["2026-10-01", "2026-10-07"]   // 国庆节
];
var BUILTIN_HOLIDAYS_2026 = [];
for (var _bi = 0; _bi < BUILTIN_HOLIDAY_RANGES_2026.length; _bi++) {
    BUILTIN_HOLIDAYS_2026 = BUILTIN_HOLIDAYS_2026.concat(expandDateRange(BUILTIN_HOLIDAY_RANGES_2026[_bi][0], BUILTIN_HOLIDAY_RANGES_2026[_bi][1]));
}

// 判断某日期是否在节假日列表里
function isHolidayDate(formula, dateStr) {
    try {
        var list = (formula && Array.isArray(formula.holiday_dates)) ? formula.holiday_dates : BUILTIN_HOLIDAYS_2026;
        return list.indexOf(dateStr) >= 0;
    } catch (e) {
        return false;
    }
}

// 周六/周日判断（周末与节假日同为特殊日）
function isWeekendDate(dateStr) {
    try {
        var p = String(dateStr).split("-");
        var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
        var w = d.getDay();
        return (w === 0 || w === 6);
    } catch (e) {
        return false;
    }
}

// 寒暑假判断：寒假 1/15~2/13，暑假 7/1~8/31（通用区间，每年自动生效）
function isSummerWinterDate(dateStr) {
    try {
        var p = String(dateStr).split("-");
        var m = parseInt(p[1], 10);
        var d = parseInt(p[2], 10);
        if (m === 7 || m === 8) return true;
        if (m === 1 && d >= 15) return true;
        if (m === 2 && d <= 13) return true;
        return false;
    } catch (e) {
        return false;
    }
}

// 特殊日（节假日/周六周日/学生模式下的寒暑假）：这些日子保持彩色
function isSpecialDay(formula, dateStr) {
    var sw = (formula && formula.student_mode === true) ? isSummerWinterDate(dateStr) : false;
    return isHolidayDate(formula, dateStr) || isWeekendDate(dateStr) || sw;
}

// 今天是否命中"日期级静默"（用户手动点选的全天静默日 / 上学日自动静默）。
// 任意日期都可手动点选静默；上学日自动静默只作用于普通日（特殊日保持彩色）。
// 总开关 date_quiet_enabled 关闭时全部日期级静默失效。
// 返回 { active:bool, kind:"manual"|"school", date:"YYYY-MM-DD" }；未命中返回 { active:false }。
function isDateQuiet(formula) {
    try {
        if (!formula || formula.quiet_enabled !== true) return { active: false };
        if (formula.date_quiet_enabled !== true) return { active: false };
        var today = todayStr();
        var special = isSpecialDay(formula, today);
        var qd = formula.quiet_dates;
        if (qd && typeof qd === "object" && qd[today] === "full") {
            return { active: true, kind: "manual", date: today };
        }
        if (formula.school_day_auto_quiet === true && !special) {
            return { active: true, kind: "school", date: today };
        }
        return { active: false };
    } catch (e) {
        return { active: false };
    }
}

// 当前是否处于静默时段（日期级静默 / 白天段 / 夜间段任一命中即可）。
// 日期级静默（全天静默日、节假日自动静默）优先级最高，且是硬静默。
// 支持两段自定义区间（白天 9-18、夜间 22-9），每段都支持跨天。
function isQuietTime(formula) {
    try {
        if (!formula || formula.quiet_enabled !== true) return false;
        // 日期级静默：用户点选的全天静默日 / 节假日自动静默
        if (isDateQuiet(formula).active) return true;
        var now = new Date();
        var cur = now.getHours() * 60 + now.getMinutes();
        // 每段有独立开关：白天段/夜间段可单独启用或停用（如假期白天全天在线，就关掉白天段）
        if (formula.quiet_day_enabled !== false && inTimeRange(cur, parseHm(formula.quiet_day_start), parseHm(formula.quiet_day_end))) return true;
        if (formula.quiet_night_enabled !== false && inTimeRange(cur, parseHm(formula.quiet_night_start), parseHm(formula.quiet_night_end))) return true;
        return false;
    } catch (e) {
        return false;
    }
}

// 当前命中的静默段描述（用于提示消息）；未命中返回空串。
function quietSegmentText(formula) {
    try {
        var dq = isDateQuiet(formula);
        if (dq.active) {
            return dq.kind === "manual" ? ("全天静默日 " + dq.date) : ("节假日静默 " + dq.date);
        }
        var now = new Date();
        var cur = now.getHours() * 60 + now.getMinutes();
        if (formula.quiet_day_enabled !== false && inTimeRange(cur, parseHm(formula.quiet_day_start), parseHm(formula.quiet_day_end))) {
            return "白天段 " + formula.quiet_day_start + "~" + formula.quiet_day_end;
        }
        if (formula.quiet_night_enabled !== false && inTimeRange(cur, parseHm(formula.quiet_night_start), parseHm(formula.quiet_night_end))) {
            return "夜间段 " + formula.quiet_night_start + "~" + formula.quiet_night_end;
        }
        return "";
    } catch (e) {
        return "";
    }
}
// ============ 节假日联网拉取（v2.2.2 换源）============
// 旧源已被 Cloudflare 拦截（返回 HTML 挑战页，JSON 解析必失败），换用静态 JSON 镜像
// 数据：NateScarlet/holiday-cn，三路镜像依次尝试
// 结构：{ year, days: [{ date:"YYYY-MM-DD", isOffDay:true|false, name }] }，只取 isOffDay=true
var holidayFetching = false; // 模块级防并发标记
async function fetchHolidayYear(year) {
    var urls = [
        "https://fastly.jsdelivr.net/gh/NateScarlet/holiday-cn@master/" + year + ".json",
        "https://gcore.jsdelivr.net/gh/NateScarlet/holiday-cn@master/" + year + ".json",
        "https://ghproxy.net/https://raw.githubusercontent.com/NateScarlet/holiday-cn/master/" + year + ".json"
    ];
    for (var ui = 0; ui < urls.length; ui++) {
        try {
            var client = createHttpClient(15000);
            var req = client.newRequest()
                .url(urls[ui])
                .method("GET")
                .headers({ "User-Agent": "Operit/on_air", "Accept": "application/json" })
                .build();
            var resp = await req.execute();
            if (!resp.isSuccessful()) continue;
            var data = resp.json();
            var days = (data && data.days) || [];
            if (!days.length) continue;
            var out = [];
            for (var i = 0; i < days.length; i++) {
                var it = days[i];
                if (!it || it.isOffDay !== true) continue;
                var d = String(it.date || "");
                if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(d)) out.push(d);
            }
            if (out.length) return out;
        } catch (e) { }
    }
    return [];
}
// 拉取今年+明年的节假日（12月时明年信息通常已公布），合并去重。
async function fetchHolidaysAll() {
    var now = new Date();
    var year = now.getFullYear();
    var list1 = await fetchHolidayYear(year);
    var list2 = await fetchHolidayYear(year + 1);
    var seen = {};
    var out = [];
    var all = list1.concat(list2);
    for (var i = 0; i < all.length; i++) {
        if (!seen[all[i]]) { seen[all[i]] = true; out.push(all[i]); }
    }
    return out;
}

// 每天12点后自动联网拉一次节假日（increment_x/check_activity 等高频入口会顺带触发）。
// 条件：今天已过12:00 且 formula.holiday_fetch_date 不是今天 且 没有正在进行的拉取。
// 拉取成功用官方数据覆盖 holiday_dates；失败保持现有列表（内置表兜底）。全程 fire-and-forget，不阻塞调用方。
async function maybeFetchHoliday() {
    try {
        if (holidayFetching) return;
        var now = new Date();
        if (now.getHours() < 12) return; // 每天12点后才有机会拉
        var formula = await loadFormula();
        var today = todayStr();
        if (formula.holiday_fetch_date === today) return; // 今天已拉过
        holidayFetching = true;
        try {
            var dates = await fetchHolidaysAll();
            if (dates && dates.length) {
                // 官方数据 + 内置表合并（官方优先，内置表兜底不丢）
                var merged = dates.slice();
                for (var i = 0; i < BUILTIN_HOLIDAYS_2026.length; i++) {
                    if (merged.indexOf(BUILTIN_HOLIDAYS_2026[i]) < 0) merged.push(BUILTIN_HOLIDAYS_2026[i]);
                }
                formula.holiday_dates = merged;
            }
        } catch (e) { /* 拉取失败不写列表，只记今天已尝试 */ }
        formula.holiday_fetch_date = today;
        await saveFormula(formula);
    } catch (e) { /* 全部静默 */ }
    finally {
        holidayFetching = false;
    }
}
var fetch_holidays = async function (params) {
    if (holidayFetching) {
        complete({ success: false, message: "正在拉取中，请稍候再试" });
        return;
    }
    holidayFetching = true;
    try {
        var formula = await loadFormula();
        var dates = await fetchHolidaysAll();
        if (dates && dates.length) {
            var merged = dates.slice();
            for (var i = 0; i < BUILTIN_HOLIDAYS_2026.length; i++) {
                if (merged.indexOf(BUILTIN_HOLIDAYS_2026[i]) < 0) merged.push(BUILTIN_HOLIDAYS_2026[i]);
            }
            formula.holiday_dates = merged;
        }
        formula.holiday_fetch_date = todayStr();
        await saveFormula(formula);
        notifyUser("节假日表已更新：" + formula.holiday_dates.length + " 天" + (dates.length ? "" : "（联网失败，用内置表）"));
        complete({
            success: true,
            message: "节假日信息已更新，共 " + formula.holiday_dates.length + " 个节假日日期（联网" + (dates.length ? "成功" : "失败，使用内置表") + "）",
            data: {
                holiday_dates: formula.holiday_dates,
                holiday_fetch_date: formula.holiday_fetch_date,
                count: formula.holiday_dates.length,
                online_ok: !!(dates && dates.length)
            }
        });
    } catch (e) {
        notifyUser("节假日拉取失败：" + String((e && e.message) || e));
        complete({ success: false, message: "拉取失败：" + String((e && e.message) || e) });
    } finally {
        holidayFetching = false;
    }
};
    return {
        pad2: pad2, dateStrOf: dateStrOf, todayStr: todayStr, expandDateRange: expandDateRange,
        BUILTIN_HOLIDAY_RANGES_2026: BUILTIN_HOLIDAY_RANGES_2026,
        BUILTIN_HOLIDAYS_2026: BUILTIN_HOLIDAYS_2026,
        isHolidayDate: isHolidayDate, isWeekendDate: isWeekendDate, isSummerWinterDate: isSummerWinterDate,
        isSpecialDay: isSpecialDay, isDateQuiet: isDateQuiet, isQuietTime: isQuietTime,
        quietSegmentText: quietSegmentText,
        fetchHolidayYear: fetchHolidayYear, fetchHolidaysAll: fetchHolidaysAll,
        maybeFetchHoliday: maybeFetchHoliday,
        tools: { fetch_holidays: fetch_holidays }
    };
}
module.exports = createHolidaysModule;
