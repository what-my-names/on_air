function Screen(ctx) {
  /*
   * 随机上线 — 侧边栏面板 v6（简洁版，纯 Compose DSL）
   *
   * 布局（按需求拍板）：
   *   顶部：标题 + 运行状态徽章
   *   大字号：唤醒概率 y（来自 get_xy 真实状态）
   *   卡1 参数：X 输入（带写入后 y 预览）+ 公式参数 a/b/c + 冷却时间输入
   *   卡2 话术：默认模式(显示 A1/A2) / 自定义模式(显示话术输入框)
   *   一行操作：触发唤醒 / 重置冷却 / 重置计数
   *   底部：连续未命中 / 上次命中 / 冷却截止（精简状态行）
   *
   * 全部交互走 ctx.callTool 调 on_air 工具，与后台 workflow 共用 state.json / formula.json。
   */

  // ===== 黑白极简（常驻：白底 + 黑字）=====
  // ===== 黑白极简（常驻）=====
  var P = {
    bg: "#FFFFFF", card: "#F5F5F5", btn: "#222222", accent: "#222222",
    text: "#222222", quietDay: "#222222", normalDay: "#F0F0F0", today: "#555555",
    specialDay: "#C0C0C0", btnText: "#FFFFFF"
  };
  // ===== 状态 =====
  var loadingState = ctx.useState("loading", true);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  var msgState = ctx.useState("msg", "");
  var msg = msgState[0];
  var setMsg = msgState[1];

  var stState = ctx.useState("st", null);   // get_xy 的 data
  var st = stState[0];
  var setSt = stState[1];

  var fmState = ctx.useState("fm", null);   // get_formula 的 data
  var fm = fmState[0];
  var setFm = fmState[1];

  var xInputState = ctx.useState("xInput", "");
  var xInput = xInputState[0];
  var setXInput = xInputState[1];

  var coolInputState = ctx.useState("coolInput", "");
  var coolInput = coolInputState[0];
  var setCoolInput = coolInputState[1];

  var cardNameInputState = ctx.useState("cardNameInput", "");
  var cardNameInput = cardNameInputState[0];
  var setCardNameInput = cardNameInputState[1];

  var aInputState = ctx.useState("aInput", "");
  var aInput = aInputState[0];
  var setAInput = aInputState[1];

  var bInputState = ctx.useState("bInput", "");
  var bInput = bInputState[0];
  var setBInput = bInputState[1];

  var cInputState = ctx.useState("cInput", "");
  var cInput = cInputState[0];
  var setCInput = cInputState[1];

  var talkInputState = ctx.useState("talkInput", "");
  var talkInput = talkInputState[0];
  var setTalkInput = talkInputState[1];

  var awakeModeState = ctx.useState("awakeMode", "default");
  var awakeMode = awakeModeState[0];
  var setAwakeMode = awakeModeState[1];

  var sendModeState = ctx.useState("sendMode", "A1");
  var sendMode = sendModeState[0];
  var setSendMode = sendModeState[1];

  var quietEnabledState = ctx.useState("quietEnabled", false);
  var quietEnabled = quietEnabledState[0];
  var setQuietEnabled = quietEnabledState[1];

  var quietDayOnState = ctx.useState("quietDayOn", true);
  var quietDayOn = quietDayOnState[0];
  var setQuietDayOn = quietDayOnState[1];

  var quietNightOnState = ctx.useState("quietNightOn", true);
  var quietNightOn = quietNightOnState[0];
  var setQuietNightOn = quietNightOnState[1];

  var quietDayStartState = ctx.useState("quietDayStart", "09:00");
  var quietDayStart = quietDayStartState[0];
  var setQuietDayStart = quietDayStartState[1];

  var quietDayEndState = ctx.useState("quietDayEnd", "18:00");
  var quietDayEnd = quietDayEndState[0];
  var setQuietDayEnd = quietDayEndState[1];

  var quietNightStartState = ctx.useState("quietNightStart", "22:00");
  var quietNightStart = quietNightStartState[0];
  var setQuietNightStart = quietNightStartState[1];

  var quietNightEndState = ctx.useState("quietNightEnd", "09:00");
  var quietNightEnd = quietNightEndState[0];
  var setQuietNightEnd = quietNightEndState[1];

  // ===== 日历与节假日状态（v1.5.8） =====
  var nowD = new Date();
  var calYearState = ctx.useState("calYear", nowD.getFullYear());
  var calYear = calYearState[0];
  var setCalYear = calYearState[1];

  var calMonthState = ctx.useState("calMonth", nowD.getMonth());   // 0-11
  var calMonth = calMonthState[0];
  var setCalMonth = calMonthState[1];

  var calDatesState = ctx.useState("calDates", {});   // { "YYYY-MM-DD": "full" } 全天静默日
  var calDates = calDatesState[0];
  var setCalDates = calDatesState[1];
  var quietDatesEdited = false;   // 用户点选过静默日后为 true，防止 initOnce 用旧值覆盖
  var switchEdited = { dateQuietOn: false, studentMode: false, schoolAuto: false };   // 用户点过开关后为 true，防止 initOnce 覆盖

  var schoolAutoState = ctx.useState("schoolAuto", false);
  var schoolAuto = schoolAutoState[0];
  var setSchoolAuto = schoolAutoState[1];

  var studentModeState = ctx.useState("studentMode", true);
  var studentMode = studentModeState[0];
  var setStudentMode = studentModeState[1];

  var dateQuietOnState = ctx.useState("dateQuietOn", true);
  var dateQuietOn = dateQuietOnState[0];
  var setDateQuietOn = dateQuietOnState[1];

  var holidayDatesState = ctx.useState("holidayDates", []);   // ["YYYY-MM-DD", ...]
  var holidayDates = holidayDatesState[0];
  var setHolidayDates = holidayDatesState[1];

  var holidayFetchDateState = ctx.useState("holidayFetchDate", "");
  var holidayFetchDate = holidayFetchDateState[0];
  var setHolidayFetchDate = holidayFetchDateState[1];

  var holidayBusyState = ctx.useState("holidayBusy", false);
  var holidayBusy = holidayBusyState[0];
  var setHolidayBusy = holidayBusyState[1];

  var suggestState = ctx.useState("suggest", null);   // suggest_quiet 的建议结果
  var suggest = suggestState[0];
  var setSuggest = suggestState[1];

  var suggestBusyState = ctx.useState("suggestBusy", false);
  var suggestBusy = suggestBusyState[0];
  var setSuggestBusy = suggestBusyState[1];

  var chatNameInputState = ctx.useState("chatNameInput", "");   // 对话名字（按名字反查对话ID）
  var chatNameInput = chatNameInputState[0];
  var setChatNameInput = chatNameInputState[1];

  var linkedChatState = ctx.useState("linkedChat", "");   // 已选中的对话ID（link_agent / suggest_quiet 回填）
  var linkedChat = linkedChatState[0];
  var setLinkedChat = linkedChatState[1];

  var initedState = ctx.useState("inited", false);
  var inited = initedState[0];
  var setInited = initedState[1];

  // ===== 工具调用辅助 =====
  function parseResult(raw) {
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
      return parseResult(raw);
    } catch (e) {
      return { success: false, message: String(e && e.message || e) };
    }
  }

  async function showMsg(text) {
    setMsg(text);
    try { await ctx.showToast(text); } catch (e) { /* 没有 toast 就只落 msg */ }
  }

  // ===== 计算 y 预览（与工具同公式） =====
  function computeY(x) {
    var a = (fm && typeof fm.a === "number") ? fm.a : 0.007078203;
    var b = (fm && typeof fm.b === "number") ? fm.b : 6.00914e-07;
    var c = (fm && typeof fm.c === "number") ? fm.c : 3.15168;
    var xx = parseFloat(x);
    if (isNaN(xx) || xx < 0) xx = 0;
    var f = a * xx + b * Math.pow(xx, c);
    return Math.round(100 * f / (1 + f) * 10) / 10;
  }

  // ===== 刷新状态 =====
  async function refresh() {
    setLoading(true);
    var r1 = await callTool("on_air:get_xy");
    if (r1.success && r1.data) setSt(r1.data);
    var r2 = await callTool("on_air:get_formula");
    if (r2.success && r2.data) setFm(r2.data);
    setLoading(false);
    return { st: r1.success ? r1.data : null, fm: r2.success ? r2.data : null };
  }

  async function initOnce() {
    if (initedState[0]) return;
    setInited(true);
    var fresh = await refresh();
    var s = fresh.st;
    var f = fresh.fm;
    if (s && typeof s.x === "number") setXInput(String(s.x));
    if (f) {
      if (typeof f.cooldown_minutes === "number") setCoolInput(String(f.cooldown_minutes));
      if (typeof f.a === "number") setAInput(String(f.a));
      if (typeof f.b === "number") setBInput(String(f.b));
      if (typeof f.c === "number") setCInput(String(f.c));
      if (Array.isArray(f.awake_messages)) setTalkInput(f.awake_messages.join("\n"));
      if (f.awake_mode) setAwakeMode(f.awake_mode);
      if (f.send_mode) {
        // 未安装温柔巡检时 A2 不可用，界面回落到 A1
        var hasGentle = !!(fresh.st && fresh.st.gentle_installed);
        setSendMode((f.send_mode === "A2" && !hasGentle) ? "A1" : f.send_mode);
      }
      if (f.character_card_name !== undefined) setCardNameInput(String(f.character_card_name || ""));
      if (f.quiet_enabled !== undefined) setQuietEnabled(f.quiet_enabled === true || f.quiet_enabled === "true");
      if (f.quiet_day_enabled !== undefined) setQuietDayOn(f.quiet_day_enabled !== false && f.quiet_day_enabled !== "false");
      if (f.quiet_night_enabled !== undefined) setQuietNightOn(f.quiet_night_enabled !== false && f.quiet_night_enabled !== "false");
      if (f.quiet_day_start) setQuietDayStart(String(f.quiet_day_start));
      if (f.quiet_day_end) setQuietDayEnd(String(f.quiet_day_end));
      if (f.quiet_night_start) setQuietNightStart(String(f.quiet_night_start));
      if (f.quiet_night_end) setQuietNightEnd(String(f.quiet_night_end));
      if (f.quiet_suggest) setSuggest(f.quiet_suggest);
      if (f.chat_id) setLinkedChat(String(f.chat_id));
      // 日历与节假日（v1.5.8 起 / v1.6.10 起逻辑反转 / v1.7.10 起学生模式+总开关）
      if (!quietDatesEdited && f.quiet_dates && typeof f.quiet_dates === "object") setCalDates(f.quiet_dates);
      if (!switchEdited.schoolAuto && f.school_day_auto_quiet !== undefined) setSchoolAuto(f.school_day_auto_quiet === true || f.school_day_auto_quiet === "true");
      if (!switchEdited.studentMode && f.student_mode !== undefined) setStudentMode(f.student_mode === true || f.student_mode === "true");
      if (!switchEdited.dateQuietOn && f.date_quiet_enabled !== undefined) setDateQuietOn(f.date_quiet_enabled !== false && f.date_quiet_enabled !== "false");
      if (Array.isArray(f.holiday_dates)) setHolidayDates(f.holiday_dates);
      if (f.holiday_fetch_date) setHolidayFetchDate(String(f.holiday_fetch_date));
    }
  }

  // ===== 静默时段本地判定（与后端 isQuietTime 同逻辑：两段区间，都支持跨天）=====
  function parseHmLocal(s) {
    var m = String(s || "").trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    var h = parseInt(m[1], 10), mi = parseInt(m[2], 10);
    if (h > 23 || mi > 59) return null;
    return h * 60 + mi;
  }
  function inRangeLocal(cur, startMin, endMin) {
    if (startMin === null || endMin === null || startMin === endMin) return false;
    if (startMin < endMin) return cur >= startMin && cur < endMin;
    return cur >= startMin || cur < endMin;
  }
  function isQuietNow() {
    if (quietEnabled !== true) return false;
    var d = new Date();
    var now = d.getHours() * 60 + d.getMinutes();
    if (inRangeLocal(now, parseHmLocal(quietDayStart), parseHmLocal(quietDayEnd))) return true;
    if (inRangeLocal(now, parseHmLocal(quietNightStart), parseHmLocal(quietNightEnd))) return true;
    return false;
  }

  // ===== 动作 =====
  async function doSaveX() {
    var r = await callTool("on_air:set_x", { x: xInput });
    await showMsg(r.success ? ("X 已写入：" + xInput) : ("写入失败：" + (r.message || "")));
    if (r.success) await refresh();
  }

  async function doSaveCool() {
    var r = await callTool("on_air:update_formula", { cooldown_minutes: coolInput });
    await showMsg(r.success ? ("冷却时间已保存：" + coolInput + " 分钟") : ("保存失败：" + (r.message || "")));
    if (r.success) await refresh();
  }

  async function doSaveCardName() {
    var r = await callTool("on_air:update_formula", { character_card_name: cardNameInput });
    await showMsg(r.success ? "角色卡名字已保存" : ("保存失败：" + (r.message || "")));
    if (r.success) await refresh();
  }

  async function doSaveQuiet() {
    var params = {
      quiet_enabled: quietEnabled === true,
      quiet_day_enabled: quietDayOn === true,
      quiet_night_enabled: quietNightOn === true
    };
    if (String(quietDayStart || "").trim()) params.quiet_day_start = String(quietDayStart).trim();
    if (String(quietDayEnd || "").trim()) params.quiet_day_end = String(quietDayEnd).trim();
    if (String(quietNightStart || "").trim()) params.quiet_night_start = String(quietNightStart).trim();
    if (String(quietNightEnd || "").trim()) params.quiet_night_end = String(quietNightEnd).trim();
    var r = await callTool("on_air:update_formula", params);
    if (r.success) {
      await showMsg("静默状态已保存：" + (params.quiet_enabled
        ? ("白天段" + (params.quiet_day_enabled ? "开" : "关") + "（" + (params.quiet_day_start || "—") + "~" + (params.quiet_day_end || "—") + "），夜间段" + (params.quiet_night_enabled ? "开" : "关") + "（" + (params.quiet_night_start || "—") + "~" + (params.quiet_night_end || "—") + "）")
        : "已关闭（总开关）"));
      await refresh();
    } else {
      await showMsg("保存失败：" + (r.message || ""));
    }
  }

  async function doSuggest() {
    setSuggestBusy(true);
    setMsg("正在分析聊天记录的时间分布…");
    var params = {};
    if (String(chatNameInput || "").trim()) params.chat_name = String(chatNameInput).trim();
    var r = await callTool("on_air:suggest_quiet", params);
    setSuggestBusy(false);
    if (r.success && r.data && r.data.suggestion) {
      setSuggest(r.data.suggestion);
      if (r.data.chat_id) setLinkedChat(String(r.data.chat_id));
      var sampleNote = (typeof r.data.sample_count === "number")
        ? ("（样本 " + r.data.sample_count + " 条）") : "";
      await showMsg((r.data.source === "ai" ? "AI" : "本地算法") + "建议已生成" + sampleNote + "：白天 " +
        r.data.suggestion.day_start + "~" + r.data.suggestion.day_end + "，夜间 " +
        r.data.suggestion.night_start + "~" + r.data.suggestion.night_end);
    } else {
      await showMsg("建议生成失败：" + (r.message || "未知错误"));
    }
  }

  async function doLinkAgent() {
    var name = String(chatNameInput || "").trim();
    if (!name) {
      await showMsg("请先填写对话名字（如：猫娘）");
      return;
    }
    setSuggestBusy(true);
    setMsg("正在按名字查找对话…");
    var r = await callTool("on_air:link_agent", { chat_name: name });
    setSuggestBusy(false);
    if (r.success && r.data && r.data.chat_id) {
      setLinkedChat(String(r.data.chat_id));
      await showMsg(r.message || "已选中对话「" + name + "」");
      await refresh();
    } else {
      await showMsg(r.message || "查找失败");
    }
  }

  async function doApplySuggest() {
    if (!suggest) {
      await showMsg("请先生成建议");
      return;
    }
    // 先把建议填进输入框，再走保存逻辑（一步到位）
    setQuietDayStart(String(suggest.day_start || ""));
    setQuietDayEnd(String(suggest.day_end || ""));
    setQuietNightStart(String(suggest.night_start || ""));
    setQuietNightEnd(String(suggest.night_end || ""));
    setQuietEnabled(true);
    setQuietDayOn(true);
    setQuietNightOn(true);
    var params = {
      quiet_enabled: true,
      quiet_day_enabled: true,
      quiet_night_enabled: true,
      quiet_day_start: String(suggest.day_start || ""),
      quiet_day_end: String(suggest.day_end || ""),
      quiet_night_start: String(suggest.night_start || ""),
      quiet_night_end: String(suggest.night_end || "")
    };
    var r = await callTool("on_air:update_formula", params);
    if (r.success) {
      await showMsg("AI 建议已应用并开启静默：白天 " + params.quiet_day_start + "~" + params.quiet_day_end +
        "，夜间 " + params.quiet_night_start + "~" + params.quiet_night_end);
      await refresh();
    } else {
      await showMsg("应用失败：" + (r.message || ""));
    }
  }

  // ===== 日历与节假日（v1.5.8）=====
  function pad2Local(n) { return (n < 10 ? "0" : "") + n; }
  function calDateStr(y, m, d) { return y + "-" + pad2Local(m + 1) + "-" + pad2Local(d); }
  function todayLocalStr() {
    var t = new Date();
    return calDateStr(t.getFullYear(), t.getMonth(), t.getDate());
  }
  function inHolidayList(dateStr) {
    return (holidayDates && holidayDates.indexOf(dateStr) >= 0);
  }
  // 寒暑假：寒假 1/15~2/13，暑假 7/1~8/31（与后端一致，每年自动生效）
  function isSummerWinter(dateStr) {
    var m = parseInt(dateStr.slice(5, 7), 10);
    var d = parseInt(dateStr.slice(8, 10), 10);
    if (m === 7 || m === 8) return true;
    if (m === 1 && d >= 15) return true;
    if (m === 2 && d <= 13) return true;
    return false;
  }
  // 特殊日：节假日、周六周日、学生模式下的寒暑假（保持彩色）
  function isSpecialDay(dateStr) {
    var p = dateStr.split("-");
    var wd = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)).getDay();
    var sw = (studentMode === true) ? isSummerWinter(dateStr) : false;
    return inHolidayList(dateStr) || wd === 0 || wd === 6 || sw;
  }
  // 当月格子：null=空白占位，数字=日期
  function calCells() {
    var first = new Date(calYear, calMonth, 1);
    var days = new Date(calYear, calMonth + 1, 0).getDate();
    var cells = [];
    for (var i = 0; i < first.getDay(); i++) cells.push(null);
    for (var d = 1; d <= days; d++) cells.push(d);
    return cells;
  }
  function doCalPrevMonth() {
    var y = calYear, m = calMonth - 1;
    if (m < 0) { m = 11; y = y - 1; }
    setCalYear(y); setCalMonth(m);
  }
  function doCalNextMonth() {
    var y = calYear, m = calMonth + 1;
    if (m > 11) { m = 0; y = y + 1; }
    setCalYear(y); setCalMonth(m);
  }
  async function doToggleQuietDate(dateStr) {
    // 任意日期（含节假日/周末/寒暑假）都可点选静默
    quietDatesEdited = true;   // 点击即标记，禁止 initOnce 覆盖
    var next = {};
    var k;
    for (k in calDates) { if (calDates[k] === "full") next[k] = "full"; }
    var willAdd;
    if (next[dateStr] === "full") {
      delete next[dateStr];
      willAdd = false;
    } else {
      next[dateStr] = "full";
      willAdd = true;
    }
    setCalDates(next);   // 乐观更新：点击瞬间立即变色，不等保存
    var r = await callTool("on_air:update_formula", { quiet_dates: JSON.stringify(next) });
    if (r.success) {
      var saved = (r.data && r.data.quiet_dates && typeof r.data.quiet_dates === "object") ? r.data.quiet_dates : next;
      setCalDates(saved);   // 与后端保存结果对齐
      await showMsg(willAdd
        ? (dateStr + " 已标记为全天静默日（硬静默，全天不打扰）")
        : (dateStr + " 已取消全天静默，恢复原本颜色"));
    } else {
      var back = {};
      for (k in calDates) { if (calDates[k] === "full") back[k] = "full"; }
      setCalDates(back);   // 保存失败回滚颜色
      await showMsg("保存失败：" + (r.message || ""));
    }
  }
  async function doSaveSchoolAuto(nv) {
    var v = (nv !== undefined && nv !== null) ? (nv === true) : (schoolAuto === true);
    var r = await callTool("on_air:update_formula", { school_day_auto_quiet: v });
    await showMsg(r.success ? (v ? "上学日静默：已开启" : "上学日静默：已关闭") : ("保存失败：" + (r.message || "")));
    if (r.success) await refresh();
  }
  async function doSaveStudentMode(nv) {
    var v = (nv !== undefined && nv !== null) ? (nv === true) : (studentMode === true);
    var r = await callTool("on_air:update_formula", { student_mode: v });
    await showMsg(r.success ? (v ? "学生模式：已开启" : "学生模式：已关闭") : ("保存失败：" + (r.message || "")));
    if (r.success) await refresh();
  }
  async function doSaveDateQuiet(nv) {
    var v = (nv !== undefined && nv !== null) ? (nv === true) : (dateQuietOn === true);
    var r = await callTool("on_air:update_formula", { date_quiet_enabled: v });
    await showMsg(r.success ? (v ? "日期静默总开关：已开启" : "日期静默总开关：已关闭") : ("保存失败：" + (r.message || "")));
    if (r.success) await refresh();
  }
  async function doFetchHolidays() {
    setHolidayBusy(true);
    setMsg("正在联网拉取节假日信息…");
    var r = await callTool("on_air:fetch_holidays");
    setHolidayBusy(false);
    await showMsg(r.message || (r.success ? "已更新" : "拉取失败"));
    if (r.success) await refresh();
  }

  async function doSaveAbc() {
    var params = {};
    if (String(aInput || "").trim()) params.a = aInput;
    if (String(bInput || "").trim()) params.b = bInput;
    if (String(cInput || "").trim()) params.c = cInput;
    if (!("a" in params) && !("b" in params) && !("c" in params)) {
      await showMsg("请先填写 a / b / c 再保存");
      return;
    }
    var r = await callTool("on_air:update_formula", params);
    await showMsg(r.success ? "公式参数已保存" : ("保存失败：" + (r.message || "")));
    if (r.success) await refresh();
  }

  async function doSaveTalk() {
    var lines = String(talkInput || "").split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
    // 未安装温柔巡检时强制 A1（A2 依赖温柔巡检的自动回复通道）
    var gentleOk = !!(st && st.gentle_installed);
    var params = { awake_mode: awakeMode, send_mode: gentleOk ? sendMode : "A1" };
    if (lines.length) params.awake_messages = JSON.stringify(lines);
    var r = await callTool("on_air:update_formula", params);
    await showMsg(r.success ? "已保存" : ("保存失败：" + (r.message || "")));
    if (r.success) await refresh();
  }

  async function doAwake() {
    setMsg("正在触发…");
    var r = await callTool("on_air:manual_awake");
    await showMsg(r.success ? "已触发唤醒" : ("唤醒失败：" + (r.message || "")));
    if (r.success) await refresh();
  }

  async function doResetCool() {
    var r = await callTool("on_air:reset_cooldown", { minutes: 0 });
    await showMsg(r.success ? "已重置冷却" : ("重置失败：" + (r.message || "")));
    if (r.success) await refresh();
  }

  async function doCoax() {
    var r = await callTool("on_air:coax");
    await showMsg(r.success ? "已重置计数" : ("重置失败：" + (r.message || "")));
    if (r.success) await refresh();
  }

  async function doRefresh() {
    await refresh();
    await showMsg("已刷新");
  }

  // ===== 派生显示 =====
  function statusText() {
    if (isQuietNow()) return "静默中";
    if (!st) return "加载中";
    if (st.cooldown_until) {
      try {
        var parts = String(st.cooldown_until).split(/[-: ]/);
        if (parts.length >= 5) {
          var cu = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), parseInt(parts[3], 10), parseInt(parts[4], 10), parts[5] ? parseInt(parts[5], 10) : 0);
          if (new Date() < cu) return "冷却中";
        }
      } catch (e) { /* 解析失败当没冷却 */ }
    }
    return st.running ? "运行中" : "空闲态";
  }

  var yPreview = computeY(xInput);
  var stX = (st && st.x != null) ? st.x : null;
  var stY = (st && st.y != null) ? st.y : null;
  var stMiss = (st && st.miss_count != null) ? st.miss_count : null;
  var stLastHit = (st && st.last_hit_at) ? st.last_hit_at : null;
  var stCool = (st && st.cooldown_until) ? st.cooldown_until : null;
  var stCardName = (fm && fm.character_card_name) ? String(fm.character_card_name) : "";

  // ===== 渲染 =====
  var children = [];

  // ---- 顶部：标题 + 状态 ----
  children.push(ctx.UI.Row({ verticalAlignment: "center", fillMaxWidth: true }, [
    ctx.UI.Text({ text: "随机上线", style: "headlineSmall", fontWeight: "bold", color: P.text, weight: 1 }),
    ctx.UI.Text({ text: statusText(), style: "labelLarge", color: P.text })
  ]));

  // ---- 大字号唤醒概率 y ----
  children.push(ctx.UI.Card({ containerColor: P.card, backgroundColor: P.card, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
    ctx.UI.Column({ backgroundColor: P.card, fillMaxWidth: true, padding: 14, spacing: 2 }, [
      ctx.UI.Text({ text: "唤醒概率 y", style: "bodySmall", color: P.text }),
      ctx.UI.Text({ text: (stY != null) ? String(stY) + "%" : "…%", style: "headlineLarge", fontWeight: "bold", color: P.accent }),
      ctx.UI.Text({ text: (stX != null) ? "当前 X = " + stX + " 分钟" : "状态读取中…", style: "bodySmall", color: P.text })
    ])
  ]));

  // ---- 卡1 参数 ----
  var card1 = [];
  card1.push(ctx.UI.Text({ text: "X（离开时长 / 分钟）", style: "bodySmall", color: P.text }));
  card1.push(ctx.UI.TextField({ 
    value: xInput,
    onValueChange: setXInput,
    singleLine: true,
    placeholder: (stX != null) ? String(stX) : "如 21"
  , style: { color: "#222222" } }));
  card1.push(ctx.UI.Row({ verticalAlignment: "center" }, [
    ctx.UI.Text({ text: "写入后 y ≈ " + yPreview + "%", style: "bodySmall", color: P.text, weight: 1 }),
    ctx.UI.Spacer({ width: 8 }),
    ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText, containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, text: "写入", onClick: doSaveX })
  ]));
  card1.push(ctx.UI.Spacer({ height: 4 }));
  card1.push(ctx.UI.Text({ text: "公式参数（f = a·x + b·x^c）", style: "bodySmall", color: P.text }));
  card1.push(ctx.UI.TextField({ 
    value: aInput,
    onValueChange: setAInput,
    singleLine: true,
    placeholder: ctx.UI.Text({ text: "a 如 0.007078203", color: "#222222" })
  , style: { color: "#222222" } }));
  card1.push(ctx.UI.TextField({ 
    value: bInput,
    onValueChange: setBInput,
    singleLine: true,
    placeholder: ctx.UI.Text({ text: "b 如 6.00914e-07", color: "#222222" })
  , style: { color: "#222222" } }));
  card1.push(ctx.UI.TextField({ 
    value: cInput,
    onValueChange: setCInput,
    singleLine: true,
    placeholder: ctx.UI.Text({ text: "c 如 3.15168", color: "#222222" })
  , style: { color: "#222222" } }));
  card1.push(ctx.UI.Row({ verticalAlignment: "center" }, [
    ctx.UI.Spacer({ weight: 1 }),
    ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText, containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, text: "保存参数", onClick: doSaveAbc })
  ]));
  card1.push(ctx.UI.Spacer({ height: 4 }));
  card1.push(ctx.UI.Text({ text: "唤醒后冷却（分钟）", style: "bodySmall", color: P.text }));
  card1.push(ctx.UI.TextField({ 
    value: coolInput,
    onValueChange: setCoolInput,
    singleLine: true,
    placeholder: ctx.UI.Text({ text: "15", color: "#222222" })
  , style: { color: "#222222" } }));
  card1.push(ctx.UI.Row({ verticalAlignment: "center" }, [
    ctx.UI.Spacer({ weight: 1 }),
    ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText, containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, text: "保存冷却", onClick: doSaveCool })
  ]));
  card1.push(ctx.UI.Spacer({ height: 4 }));
  card1.push(ctx.UI.Text({ text: "角色卡名字（唤醒时按名字用这张角色卡；留空=跟随当前对话）", style: "bodySmall", color: P.text }));
  card1.push(ctx.UI.TextField({ 
    value: cardNameInput,
    onValueChange: setCardNameInput,
    singleLine: true,
    placeholder: ctx.UI.Text({ text: "例如角色卡的名字", color: "#222222" })
  , style: { color: "#222222" } }));
  card1.push(ctx.UI.Row({ verticalAlignment: "center" }, [
    ctx.UI.Spacer({ weight: 1 }),
    ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText, containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, text: "保存角色卡", onClick: doSaveCardName })
  ]));
  children.push(ctx.UI.Card({ containerColor: P.card, backgroundColor: P.card, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
    ctx.UI.Column({ backgroundColor: P.card, fillMaxWidth: true, padding: 14, spacing: 8 }, [
      ctx.UI.Text({ text: "参数", style: "titleMedium", fontWeight: "semiBold", color: P.accent })
    ].concat(card1))
  ]));

  // ---- 卡2 话术 ----
  var card2 = [];
  card2.push(ctx.UI.Row({ spacing: 8 }, [
    ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText,containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, 
      text: (awakeMode === "default" ? "✔ " : "") + "默认模式",
      weight: 1,
      onClick: function () { setAwakeMode("default"); }
    }),
    ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText,containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, 
      text: (awakeMode === "custom" ? "✔ " : "") + "自定义",
      weight: 1,
      onClick: function () { setAwakeMode("custom"); }
    })
  ]));
  if (awakeMode === "custom") {
    card2.push(ctx.UI.Text({ text: "格式说明：每行写一句，命中后随机抽一句发送；想清空就把框留空保存", style: "bodySmall", color: P.text }));
    card2.push(ctx.UI.TextField({ 
      value: talkInput,
      onValueChange: setTalkInput,
      minLines: 4,
      placeholder: ctx.UI.Text({ text: "每行写一句，如：想你了，最近在忙吗？", color: "#222222" })
    , style: { color: "#222222" } }));
  }
  if (awakeMode === "default") {
    // 发送方式 A1/A2：只在"默认模式"下显示；A2 仅检测到温柔巡检时才出现
    var gentleOk2 = !!(st && st.gentle_installed);
    card2.push(ctx.UI.Text({ text: "发送方式", style: "bodySmall", color: P.text }));
    if (gentleOk2) {
      card2.push(ctx.UI.Row({ spacing: 8 }, [
        ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText,containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, 
          text: (sendMode === "A1" ? "✔ " : "") + "A1",
          weight: 1,
          onClick: function () { setSendMode("A1"); }
        }),
        ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText,containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, 
          text: (sendMode === "A2" ? "✔ " : "") + "A2",
          weight: 1,
          onClick: function () { setSendMode("A2"); }
        })
      ]));
    } else {
      card2.push(ctx.UI.Row({ spacing: 8 }, [
        ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText,containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, 
          text: (sendMode === "A1" ? "✔ " : "") + "A1",
          weight: 1,
          onClick: function () { setSendMode("A1"); }
        })
      ]));
    }
    card2.push(ctx.UI.Text({
      text: gentleOk2
        ? "A1：AI 主动发，只落对话正文不弹气泡（默认）。A2：装了温柔巡检时优先借它的自动回复通道。"
        : "未检测到温柔巡检，只能使用 A1；安装温柔巡检后会出现 A2 选项。",
      style: "bodySmall",
      color: P.text
    }));
  }
  card2.push(ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText, containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, text: "保存话术 / 发送方式", fillMaxWidth: true, onClick: doSaveTalk }));
  children.push(ctx.UI.Card({ containerColor: P.card, backgroundColor: P.card, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
    ctx.UI.Column({ backgroundColor: P.card, fillMaxWidth: true, padding: 14, spacing: 8 }, [
      ctx.UI.Text({ text: "话术", style: "titleMedium", fontWeight: "semiBold", color: P.accent })
    ].concat(card2))
  ]));

  // ---- 卡3 静默状态（两段免打扰 + AI 智能建议） ----
  var card3 = [];
  card3.push(ctx.UI.Text({
    text: "免打扰：静默时段内停止 X 累加、掷骰与主动唤醒。若检测到主人打开 Operit / 发消息，会自动解除静默并告知喵～",
    style: "bodySmall",
    color: P.text
  }));
  card3.push(ctx.UI.Row({ spacing: 8 }, [
    ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText,containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, 
      text: (quietEnabled ? "✔ " : "") + "开启",
      weight: 1,
      onClick: function () { setQuietEnabled(true); }
    }),
    ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText,containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, 
      text: (!quietEnabled ? "✔ " : "") + "关闭",
      weight: 1,
      onClick: function () { setQuietEnabled(false); }
    })
  ]));
  // 白天段（带独立开关：假期白天全天在线时可关掉）
  card3.push(ctx.UI.Row({ spacing: 8 }, [
    ctx.UI.Text({ text: "白天段（默认备注：给白天黑夜倒班的人群，如白天补觉 9:00~18:00）", style: "bodySmall", color: P.text, weight: 1 }),
    ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText,containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, 
      text: quietDayOn ? "白天静默：开" : "白天静默：关",
      onClick: function () { setQuietDayOn(!quietDayOn); }
    })
  ]));
  card3.push(ctx.UI.Row({ spacing: 8 }, [
    ctx.UI.Column({ weight: 1 }, [
      ctx.UI.Text({ text: "开始 HH:MM", style: "bodySmall", color: P.text }),
      ctx.UI.TextField({  value: quietDayStart, onValueChange: setQuietDayStart, singleLine: true, placeholder: ctx.UI.Text({ text: "09:00", color: "#222222" }) , style: { color: "#222222" } })
    ]),
    ctx.UI.Column({ weight: 1 }, [
      ctx.UI.Text({ text: "结束 HH:MM", style: "bodySmall", color: P.text }),
      ctx.UI.TextField({  value: quietDayEnd, onValueChange: setQuietDayEnd, singleLine: true, placeholder: ctx.UI.Text({ text: "18:00", color: "#222222" }) , style: { color: "#222222" } })
    ])
  ]));
  // 夜间段（带独立开关）
  card3.push(ctx.UI.Row({ spacing: 8 }, [
    ctx.UI.Text({ text: "夜间段（如睡觉 22:00~09:00，支持跨天）", style: "bodySmall", color: P.text, weight: 1 }),
    ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText,containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, 
      text: quietNightOn ? "夜间静默：开" : "夜间静默：关",
      onClick: function () { setQuietNightOn(!quietNightOn); }
    })
  ]));
  card3.push(ctx.UI.Row({ spacing: 8 }, [
    ctx.UI.Column({ weight: 1 }, [
      ctx.UI.Text({ text: "开始 HH:MM", style: "bodySmall", color: P.text }),
      ctx.UI.TextField({  value: quietNightStart, onValueChange: setQuietNightStart, singleLine: true, placeholder: ctx.UI.Text({ text: "22:00", color: "#222222" }) , style: { color: "#222222" } })
    ]),
    ctx.UI.Column({ weight: 1 }, [
      ctx.UI.Text({ text: "结束 HH:MM", style: "bodySmall", color: P.text }),
      ctx.UI.TextField({  value: quietNightEnd, onValueChange: setQuietNightEnd, singleLine: true, placeholder: ctx.UI.Text({ text: "09:00", color: "#222222" }) , style: { color: "#222222" } })
    ])
  ]));
  card3.push(ctx.UI.Text({
    text: isQuietNow() ? "当前正处于静默时段，系统暂停计算与唤醒（检测到设备活动会自动解除）。" : "提示：两段时间都可自定义，每段均支持跨天区间。",
    style: "bodySmall",
    color: P.text
  }));
  card3.push(ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText, containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, text: "保存静默设置", fillMaxWidth: true, onClick: doSaveQuiet }));
// AI 智能建议区
  card3.push(ctx.UI.Spacer({ height: 4 }));
  card3.push(ctx.UI.Text({ text: "AI 智能建议（结合时间与主人习惯，正在测试中）", style: "bodySmall", fontWeight: "semiBold", color: P.text }));
  card3.push(ctx.UI.Text({
    text: "使用你常用对话的聊天记录来分析作息，仅读取发言时间，不读取聊天内容。",
    style: "bodySmall",
    color: P.text
  }));
  // 聊天记录选择（对话名字）
  card3.push(ctx.UI.Text({ text: "对话名字（用它常用对话的聊天记录来分析）", style: "bodySmall", color: P.text }));
  card3.push(ctx.UI.TextField({  value: chatNameInput, onValueChange: setChatNameInput, singleLine: true, placeholder: ctx.UI.Text({ text: "对话的名字，如：猫娘", color: "#222222" }) , style: { color: "#222222" } }));
  card3.push(ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText, containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, text: (suggestBusy ? "查找中…" : "按名字选中对话"), fillMaxWidth: true, onClick: doLinkAgent }));
  if (linkedChat) {
    card3.push(ctx.UI.Text({
      text: "已选中对话ID：" + linkedChat,
      style: "bodySmall",
      color: P.text
    }));
  }
  card3.push(ctx.UI.Text({
    text: "点按钮后自动按名字找到对话并配置好，不需要发送任何消息。",
    style: "bodySmall",
    color: P.text
  }));
  card3.push(ctx.UI.Text({
    text: "提示：请开启 Operit 的额外信息（时间）输入，AI 才能结合当前时间分析。",
    style: "bodySmall",
    color: P.text
  }));
  card3.push(ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText,containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, 
    text: (suggestBusy ? "分析中…" : "分析常用对话聊天记录并建议静默时间"),
    fillMaxWidth: true,
    onClick: doSuggest
  }));
  if (suggest) {
    card3.push(ctx.UI.Card({ containerColor: P.card, backgroundColor: P.card, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
      ctx.UI.Column({ backgroundColor: P.card, fillMaxWidth: true, padding: 10, spacing: 4 }, [
        ctx.UI.Text({
          text: "建议：白天 " + (suggest.day_start || "—") + "~" + (suggest.day_end || "—") + "，夜间 " + (suggest.night_start || "—") + "~" + (suggest.night_end || "—"),
          style: "bodyMedium",
          fontWeight: "semiBold",
          color: P.text
        }),
        ctx.UI.Text({
          text: (suggest.reason || ""),
          style: "bodySmall",
          color: P.text
        }),
        ctx.UI.Text({
          text: "来源：" + (suggest.source === "ai" ? "AI 分析" : "本地算法") + " · " + (suggest.generated_at || "") + (suggest.sample_count != null ? " · 样本 " + suggest.sample_count + " 条" : ""),
          style: "bodySmall",
          color: P.text
        })
      ])
    ]));
    card3.push(ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText, containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, text: "一键应用建议并开启静默", fillMaxWidth: true, onClick: doApplySuggest }));
  }
  children.push(ctx.UI.Card({ containerColor: P.card, backgroundColor: P.card, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
    ctx.UI.Column({ backgroundColor: P.card, fillMaxWidth: true, padding: 14, spacing: 8 }, [
      ctx.UI.Text({ text: "静默状态", style: "titleMedium", fontWeight: "semiBold", color: P.accent })
    ].concat(card3))
  ]));

  // ---- 卡4 日历与节假日（v1.5.8） ----
  var card4 = [];
  card4.push(ctx.UI.Text({
    text: "内置日历：每天 12:00 后自动联网拉取节假日（普通 HTTP 请求，零 token 消耗）。所有日子点一下即可标记/取消全天静默。",
    style: "bodySmall",
    color: P.text
  }));
  // 月份导航
  card4.push(ctx.UI.Row({ spacing: 8, verticalAlignment: "center" }, [
    ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText, containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, text: "上月", onClick: doCalPrevMonth }),
    ctx.UI.Text({ text: calYear + " 年 " + (calMonth + 1) + " 月", style: "bodyMedium", fontWeight: "semiBold", color: P.text, weight: 1 }),
    ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText, containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, text: "下月", onClick: doCalNextMonth })
  ]));
  // 周标题
  var weekNames = ["日", "一", "二", "三", "四", "五", "六"];
  var headRow = [];
  for (var _wi = 0; _wi < 7; _wi++) {
    headRow.push(ctx.UI.Text({ text: weekNames[_wi], style: "labelSmall", color: P.text, weight: 1 }));
  }
  card4.push(ctx.UI.Row({ spacing: 2 }, headRow));
  // 日期网格：null=空白占位；点日期切换全天静默标记
  var cells = calCells();
  var todayLocal = todayLocalStr();
  for (var rowIdx = 0; rowIdx * 7 < cells.length; rowIdx++) {
    var rowItems = [];
    for (var cIdx = 0; cIdx < 7; cIdx++) {
      var cell = cells[rowIdx * 7 + cIdx];
      if (cell === null || cell === undefined) {
        rowItems.push(ctx.UI.Spacer({ weight: 1 }));
      } else {
        (function (dayNum) {
          var ds2 = calDateStr(calYear, calMonth, dayNum);
          var isH2 = inHolidayList(ds2);
          var isQ2 = (calDates && calDates[ds2] === "full");
          var isT2 = (ds2 === todayLocal);
          // 周末（周六/周日）、寒暑假与节假日同为特殊日（不参与自动静默）
          var wkDay = new Date(calYear, calMonth, dayNum).getDay();
          var isWk = (wkDay === 0 || wkDay === 6);
          var isSw = (studentMode === true) ? isSummerWinter(ds2) : false;
          var isSp = (isH2 || isWk || isSw);
          // 上学日自动静默：总开关开 + 上学日静默开 + 非节假日 + 非周末 + （学生模式时非寒暑假）
          var isAutoQuiet2 = (dateQuietOn === true && schoolAuto === true && !isH2 && !isWk && !(studentMode === true && isSw));
          // 黑白极简：静默日黑底白字（含上学日自动静默），今天深灰底白字，普通日浅灰底黑字
          var btnParams = {
            text: String(dayNum),
            weight: 1,
            onClick: function () { doToggleQuietDate(ds2); }
          };
          if ((dateQuietOn === true && (isQ2 || isAutoQuiet2))) { btnParams.containerColor = P.quietDay; btnParams.color = P.btnText; btnParams.textColor = P.btnText; btnParams.contentColor = P.btnText; }
          else if (isT2) { btnParams.containerColor = P.today; btnParams.color = P.btnText; btnParams.textColor = P.btnText; btnParams.contentColor = P.btnText; }
          else if (isSp) { btnParams.containerColor = P.specialDay; btnParams.color = P.btnText; btnParams.textColor = P.btnText; btnParams.contentColor = P.btnText; }
          else { btnParams.containerColor = P.normalDay; btnParams.color = P.text; btnParams.textColor = P.text; btnParams.contentColor = P.text; }
          rowItems.push(ctx.UI.Button(btnParams));
        })(cell);
      }
    }
    card4.push(ctx.UI.Row({ spacing: 2 }, rowItems));
  }
  card4.push(ctx.UI.Text({
    text: "颜色：纯黑=静默日；中灰=节假日/周末/寒暑假（学生模式开时）；浅灰=普通日；深灰=今天。点日子可静默/取消。",
    style: "bodySmall",
    color: P.text
  }));
  // 日期静默总开关（点一下立即保存）
  card4.push(ctx.UI.Row({ spacing: 8 }, [
    ctx.UI.Text({
      text: "日期静默总开关：关闭后点选静默日和上学日自动静默全部失效",
      style: "bodySmall",
      color: P.text,
      weight: 1
    }),
    ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText,containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, 
      text: dateQuietOn ? "总开关：开" : "总开关：关",
      onClick: function () {
        switchEdited.dateQuietOn = true;
        var nv = !dateQuietOn;
        setDateQuietOn(nv);
        doSaveDateQuiet(nv);
      }
    })
  ]));
  // 学生模式开关（点一下立即保存）
  card4.push(ctx.UI.Row({ spacing: 8 }, [
    ctx.UI.Text({
      text: "学生模式（寒暑假）：开=学生（寒暑假算特殊日保持彩色）；关=成年人（寒暑假按普通日处理）",
      style: "bodySmall",
      color: P.text,
      weight: 1
    }),
    ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText,containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, 
      text: studentMode ? "学生模式：开" : "学生模式：关",
      onClick: function () {
        switchEdited.studentMode = true;
        var nv = !studentMode;
        setStudentMode(nv);
        doSaveStudentMode(nv);
      }
    })
  ]));
  // 上学日自动静默开关（点一下立即保存）
  card4.push(ctx.UI.Row({ spacing: 8 }, [
    ctx.UI.Text({
      text: "上学日自动静默：普通日（非节假日、非周六周日、学生模式下非寒暑假）自动全天静默（硬静默，不因设备活动解除）",
      style: "bodySmall",
      color: P.text,
      weight: 1
    }),
    ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText,containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, 
      text: schoolAuto ? "上学日静默：开" : "上学日静默：关",
      onClick: function () {
        switchEdited.schoolAuto = true;
        var nv = !schoolAuto;
        setSchoolAuto(nv);
        doSaveSchoolAuto(nv);
      }
    })
  ]));
  // 节假日表状态 + 手动更新
  card4.push(ctx.UI.Row({ spacing: 8 }, [
    ctx.UI.Text({
      text: holidayFetchDate
        ? ("节假日表更新于 " + holidayFetchDate + "，共 " + (holidayDates ? holidayDates.length : 0) + " 天")
        : "节假日表尚未联网更新（暂用内置 2026 年表）",
      style: "bodySmall",
      color: P.text,
      weight: 1
    }),
    ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText, containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, text: holidayBusy ? "更新中…" : "立即更新", onClick: doFetchHolidays })
  ]));
  children.push(ctx.UI.Card({ containerColor: P.card, backgroundColor: P.card, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
    ctx.UI.Column({ backgroundColor: P.card, fillMaxWidth: true, padding: 14, spacing: 8 }, [
      ctx.UI.Text({ text: "日历与节假日", style: "titleMedium", fontWeight: "semiBold", color: P.accent })
    ].concat(card4))
  ]));

  // ---- 一行操作：触发 / 重置冷却 / 重置计数 ----
  children.push(ctx.UI.Row({ spacing: 8, fillMaxWidth: true }, [
    ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText, containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, text: "触发唤醒", fillMaxWidth: true, weight: 1, onClick: doAwake }),
    ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText, containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, text: "重置冷却", fillMaxWidth: true, weight: 1, onClick: doResetCool }),
    ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText, containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, text: "重置计数", fillMaxWidth: true, weight: 1, onClick: doCoax })
  ]));

  // ---- 底部精简状态 ----
  children.push(ctx.UI.Card({ containerColor: P.card, backgroundColor: P.card, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
    ctx.UI.Column({ backgroundColor: P.card, fillMaxWidth: true, padding: 14, spacing: 4 }, [
      ctx.UI.Text({ text: "连续未命中：" + (stMiss != null ? stMiss + " 次" : "…"), style: "bodySmall", color: P.text }),
      ctx.UI.Text({ text: "上次命中：" + (stLastHit || "—"), style: "bodySmall", color: P.text }),
      ctx.UI.Text({ text: "冷却截止：" + (stCool || "—"), style: "bodySmall", color: P.text }),
      ctx.UI.Text({ text: "角色卡：" + (stCardName || "跟随当前对话"), style: "bodySmall", color: P.text }),
      ctx.UI.Text({
        text: ((st && st.gentle_installed)
          ? ("温柔巡检：已安装，醋意联动开启" + (st.gentle_jealousy != null ? "（当前醋意值 " + st.gentle_jealousy + "）" : ""))
          : "温柔巡检：未安装，无醋意联动"),
        style: "bodySmall",
        color: P.text
      })
    ])
  ]));

  // ---- 消息提示 ----
  if (msg) {
    children.push(ctx.UI.Card({ containerColor: P.card, backgroundColor: P.card, shape: { cornerRadius: 16, type: "rounded" }, padding: 0, elevation: 0, fillMaxWidth: true }, [
      ctx.UI.Row({ backgroundColor: P.card, fillMaxWidth: true, padding: 14, verticalAlignment: "center" }, [
        ctx.UI.Text({ text: msg, style: "bodyMedium", color: P.text, weight: 1 })
      ])
    ]));
  }

  // ---- 刷新 ----
  children.push(ctx.UI.Button({ contentColor: P.btnText, color: P.btnText, textColor: P.btnText, containerColor: P.btn, shape: { cornerRadius: 12, type: "rounded" }, text: "刷新状态", fillMaxWidth: true, onClick: doRefresh }));

  return ctx.UI.LazyColumn({ containerColor: P.bg, backgroundColor: P.bg,
    onLoad: async function () {
      await initOnce();
    },
    fillMaxSize: true,
    padding: 16,
    spacing: 12
  }, children);
}

// ===== 导出：compose_dsl 运行时从这里找入口函数 =====
module.exports = Screen;
module.exports.default = Screen;
module.exports.Screen = Screen;
