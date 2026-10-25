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
  var scheme = (ctx.MaterialTheme && ctx.MaterialTheme.colorScheme) ? ctx.MaterialTheme.colorScheme : {};
  var P = {
    bg: scheme.background || "#FFFFFF", card: scheme.surfaceVariant || "#F5F5F5",
    btn: scheme.primary || "#222222", accent: scheme.primary || "#222222",
    text: scheme.onSurface || "#222222", quietDay: scheme.primary || "#222222",
    normalDay: scheme.surfaceVariant || "#F0F0F0", today: scheme.onSurfaceVariant || "#555555",
    specialDay: scheme.outline || "#C0C0C0", btnText: scheme.onPrimary || "#FFFFFF",
    dim: scheme.onSurfaceVariant || "#666666"
  };
  // ===== 状态 =====
  var loadingState = ctx.useState("loading", true);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  var msgState = ctx.useState("msg", "");
  var msg = msgState[0];
  var setMsg = msgState[1];
  var updS = ctx.useState("upd", ""); var updRaw = updS[0], setUpd = updS[1];
  var updOpenS = ctx.useState("x_upd_open", false); var updOpen = updOpenS[0], setUpdOpen = updOpenS[1];
  var updPathS = ctx.useState("x_upd_path", ""); var updPath = updPathS[0], setUpdPath = updPathS[1];
  var updHideS = ctx.useState("upd_hide", false); var updHide = updHideS[0], setUpdHide = updHideS[1];
  var updMsgS = ctx.useState("upd_msg", ""); var updMsg = updMsgS[0], setUpdMsg = updMsgS[1];
  var dlS = ctx.useState("x_dl", ""); var dlRaw = dlS[0], setDl = dlS[1];
  var dlBusyS = ctx.useState("x_dl_busy", false); var dlBusy = dlBusyS[0], setDlBusy = dlBusyS[1];
  var pollingS = ctx.useState("x_dl_polling", false); var polling = pollingS[0], setPolling = pollingS[1];
  var dl = {};
  try { dl = JSON.parse(dlRaw || "{}"); } catch (eDl) { dl = {}; }
  var updData = {};
  try { updData = JSON.parse(updRaw || "{}"); } catch (e0) { updData = {}; }

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
    var alreadyInited = initedState[0];
    setInited(true);
    var fresh = await refresh();   // v1.9.2：数据每次进入都刷新
    // 下载状态：每次进面板都读一次（不依赖 alreadyInited，避免重开面板后还是空白）
    try {
      var d0 = await callTool('on_air:get_download_status');
      if (d0 && d0.success && d0.data && d0.data.status && d0.data.status !== 'idle') {
        applyDl(d0.data);
        if (d0.data.status === 'running') startPollOnce();
      }
    } catch (eD0) { }
    if (alreadyInited) return;     // 输入框只在首次回填，避免覆盖正在编辑的内容
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

  // ===== v2.2.0：更新检查 =====
  async function checkUpdateUI(force) {
    try {
      var r = await callTool("on_air:check_update", force ? { force: true } : {});
      if (r && r.success && r.data && r.data.hasUpdate && !r.data.skipped) {
        setUpd(JSON.stringify(r.data));
      } else {
        setUpd("");
      }
    } catch (e) { /* 检查失败不影响主页 */ }
  }
  async function doOpenSite() {
    try {
      var u = String((updData && updData.url) || "");
      if (!u) { await showMsg("没有可打开的链接"); return; }
      var r = await callTool("on_air:open_url", { url: u });
      if (!(r && r.success)) await showMsg("打开失败：" + ((r && r.message) || ""));
    } catch (e) { await showMsg("打开出错：" + String((e && e.message) || e)); }
  }
  async function doForceCheck() {
    try {
      var r = await callTool("on_air:check_update", { force: true });
      if (r && r.success && r.data) {
        if (r.data.hasUpdate && !r.data.skipped) { setUpd(JSON.stringify(r.data)); await showMsg("发现新版本 " + r.data.latest); }
        else { setUpd(""); await showMsg("已是最新版本 v" + r.data.current); }
      } else {
        await showMsg("检查失败：" + ((r && r.message) || ""));
      }
    } catch (e) { await showMsg("检查出错：" + String((e && e.message) || e)); }
  }
  function sleepMs(ms) {
    return new Promise(function (res) { try { setTimeout(res, ms); } catch (e) { res(); } });
  }
  function kbTxt(n) {
    n = Number(n) || 0;
    if (n >= 1048576) return (Math.round(n / 104857.6) / 10) + ' MB';
    if (n >= 1024) return Math.round(n / 1024) + ' KB';
    return n + ' B';
  }
  function applyDl(d) {
    if (!d) return;
    var prevMsg = '';
    try { prevMsg = String((dl && dl.message) || ''); } catch (ePM) { }
    setDl(JSON.stringify(d));
    if (d.status === 'done' && d.path) setUpdPath(String(d.path));
    // 只在内容真变化时才改提示，避免 onLoad 反复触发导致提示乱跳
    if (d.message && String(d.message) !== prevMsg) setUpdMsg(String(d.message));
  }
  async function pollDownload() {
    for (var i = 0; i < 400; i++) {
      var r = null;
      try { r = await callTool('on_air:get_download_status'); } catch (e0) { r = null; }
      if (r && r.success && r.data) {
        applyDl(r.data);
        var s0 = String(r.data.status || '');
        if (s0 === 'done' || s0 === 'failed' || s0 === 'missing' || s0 === 'idle') return;
      }
      await sleepMs(600);
    }
  }
  function startPollOnce() {
    if (polling) return;
    setPolling(true);
    pollDownload().then(function () { setPolling(false); }).catch(function () { setPolling(false); });
  }
  async function doDownloadUpdate() {
    // 连点保护：一次点击只发起一次下载，避免两次请求互相覆盖状态
    if (dlBusy) return;
    setDlBusy(true);
    try {
      if (dl && dl.status === 'running') { startPollOnce(); return; }
      var total0 = Number((updData && updData.asset_size) || 0);
      setDl(JSON.stringify({ status: 'running', received: 0, total: total0, percent: 0, message: '正在获取最新版本信息…' }));
      setUpdMsg('正在获取最新版本信息…');
      callTool('on_air:download_update', { force: true }).then(function (r) {
        if (r && r.data && r.success) applyDl({ status: 'done', received: r.data.size || 0, total: r.data.total || r.data.size || 0, percent: 100, path: r.data.path, message: r.message });
        else if (r && !r.success) {
          var isBusy = !!(r.data && r.data.busy);
          setUpdMsg(isBusy ? '下载仍在进行中，等它完成就好' : ('下载失败：' + ((r && r.message) || '')));
        }
      });
      startPollOnce();
    } finally { setDlBusy(false); }
  }
  async function doSkipUpdate() {
    try {
      await callTool("on_air:skip_update", { version: String((updData && updData.latest) || "") });
      setUpd("");
    } catch (e) { /* 忽略 */ }
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

  var NAV_ITEMS = [
    ["提示词设置", "toolpkg:com.operit.on_air:ui:on_air_prompts", "递给 AI 的每一句话：触发引导 / 前缀 / 温柔巡检 / 置气 / 档位话术", "Article"],
    ["参数设置", "toolpkg:com.operit.on_air:ui:on_air_params", "X 值、公式 a·b·c、冷却、角色卡名字、连续上限", "Tune"],
    ["免打扰", "toolpkg:com.operit.on_air:ui:on_air_quiet", "静默时段、目标对话、AI 静默建议", "Notifications"],
    ["日期静默", "toolpkg:com.operit.on_air:ui:on_air_dates", "日历点选静默、上学日、学生模式、节假日表", "CalendarMonth"],
    ["控制台", "toolpkg:com.operit.on_air:ui:on_air_console", "直调 API：掷骰 / 查沉默 / 全量读数 / 工具清单", "Terminal"]
  ];

  // ===== 渲染（v2.2.1 视觉层次）=====
  function wa(c, a) {
    if (typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c)) return "#" + a + c.slice(1);
    return c;
  }
  var C = {
    bg: P.bg,
    card: P.card,
    line: scheme.outlineVariant || scheme.outline || P.dim,
    primary: P.accent,
    text: P.text,
    dim: P.dim,
    onPrimary: P.btnText,
    soft: scheme.secondaryContainer || P.card
  };
  function sectionLabel(txt) {
    return ctx.UI.Row({ fillMaxWidth: true, verticalAlignment: "center", spacing: 8 }, [
      ctx.UI.Box({ width: 3, height: 14, background: C.primary, shape: { cornerRadius: 2, type: "rounded" } }),
      ctx.UI.Text({ text: txt, fontSize: 12, fontWeight: "bold", color: C.primary })
    ]);
  }
  function metric(label, value, color) {
    return ctx.UI.Column({ spacing: 2 }, [
      ctx.UI.Text({ text: label, fontSize: 11, color: C.dim, maxLines: 1 }),
      ctx.UI.Text({ text: value, fontSize: 13, fontWeight: "bold", color: color || C.text, maxLines: 1, overflow: "ellipsis" })
    ]);
  }
  function navRow(iconName, title, desc, route) {
    return ctx.UI.Row({
      fillMaxWidth: true, horizontalArrangement: "spaceBetween", verticalAlignment: "center",
      padding: { horizontal: 14, vertical: 12 },
      onClick: function () { if (ctx.navigate) ctx.navigate(route); }
    }, [
      ctx.UI.Row({ spacing: 12, verticalAlignment: "center" }, [
        ctx.UI.Icon({ name: iconName, size: 22, tint: C.primary }),
        ctx.UI.Column({ spacing: 3 }, [
          ctx.UI.Text({ text: title, fontSize: 15, fontWeight: "bold", color: C.text, maxLines: 1 }),
          ctx.UI.Text({ text: desc, fontSize: 12, color: C.dim, maxLines: 2, overflow: "ellipsis" })
        ])
      ]),
      ctx.UI.Icon({ name: "ChevronRight", size: 20, tint: C.dim })
    ]);
  }
  var children = [];

  // ---- 顶部标题 / 状态 ----
  children.push(ctx.UI.Row({ fillMaxWidth: true, horizontalArrangement: "spaceBetween", verticalAlignment: "center" }, [
    ctx.UI.Column({ spacing: 3 }, [
      ctx.UI.Text({ text: "随机上线", fontSize: 26, fontWeight: "bold", color: C.text }),
      ctx.UI.Text({ text: "装成真人的主动消息 · v" + ((st && st.current_version) ? String(st.current_version) : '—'), fontSize: 12, color: C.dim })
    ]),
    ctx.UI.Surface({ containerColor: C.primary, alpha: 0.14, shape: { cornerRadius: 100, type: "rounded" } }, [
      ctx.UI.Row({ padding: { horizontal: 10, vertical: 6 }, spacing: 6, verticalAlignment: "center" }, [
        ctx.UI.Box({ width: 7, height: 7, background: C.primary, shape: { cornerRadius: 4, type: "rounded" } }),
        ctx.UI.Text({ text: statusText(), fontSize: 11, fontWeight: "bold", color: C.primary, maxLines: 1 })
      ])
    ])
  ]));

  // ---- 更新横幅 ----
  if (updData && updData.hasUpdate && !updHide) {
    var notesShort = (String(updData.notes || "").replace(/\r/g, "").trim() || "（该版本未写更新说明）");
    notesShort = notesShort.split("\n").filter(function (x) { return String(x).trim() !== ""; }).slice(0, 6).join("\n");
    var notesFull = String(updData.notes_full || "").replace(/\r/g, "").trim();
    var canExpand = !!(notesFull && notesFull.length > notesShort.length);
    var banner = [
      ctx.UI.Row({ fillMaxWidth: true, verticalAlignment: "center", spacing: 8 }, [
        ctx.UI.Icon({ name: "SystemUpdate", size: 20, tint: C.primary }),
        ctx.UI.Text({ text: "发现新版本 " + String(updData.latest || ""), fontSize: 15, fontWeight: "bold", color: C.primary, maxLines: 1 }),
        ctx.UI.Text({ text: "当前 v" + String(updData.current || ""), fontSize: 11, color: C.dim, maxLines: 1 })
      ]),
      ctx.UI.Text({ text: notesShort, fontSize: 12, color: C.text })
    ];
    if (canExpand) {
      banner.push(ctx.UI.Row({ fillMaxWidth: true, horizontalArrangement: "spaceBetween", verticalAlignment: "center", padding: { vertical: 2 }, onClick: function () { setUpdOpen(!updOpen); } }, [
        ctx.UI.Text({ text: updOpen ? "收起完整说明" : "展开完整说明（含技术实现）", fontSize: 11, color: C.primary }),
        ctx.UI.Icon({ name: updOpen ? "ExpandLess" : "ExpandMore", size: 18, tint: C.primary })
      ]));
      if (updOpen) banner.push(ctx.UI.Text({ text: notesFull, fontSize: 12, color: C.dim }));
    }
    var dlSt = String((dl && dl.status) || '');
    if (dlSt === 'running') {
      var dTotalR = Number((dl && dl.total) || 0);
      banner.push(ctx.UI.Text({ text: '正在下载…' + (dTotalR > 0 ? '（共 ' + kbTxt(dTotalR) + '）' : '') + ' 请稍候', fontSize: 12, color: C.primary }));
    } else if (dlSt === 'done') {
      var dGotD = Number((dl && dl.received) || 0);
      var dTotalD = Number((dl && dl.total) || 0);
      banner.push(ctx.UI.Text({ text: '已下载 ' + kbTxt(dGotD) + (dTotalD > 0 ? ' / 共 ' + kbTxt(dTotalD) : ''), fontSize: 11, color: C.primary }));
    } else if (dlSt === 'failed' || dlSt === 'missing') {
      banner.push(ctx.UI.Text({ text: String((dl && dl.message) || '下载失败'), fontSize: 11, color: '#D32F2F' }));
    }
    banner.push(ctx.UI.Row({ spacing: 8, fillMaxWidth: true }, [
      ctx.UI.Button({ containerColor: C.primary, contentColor: C.onPrimary, shape: { cornerRadius: 12, type: "rounded" }, text: (dlSt === 'running' ? '正在下载…' : (dlSt === 'done' ? '重新下载' : '下载更新包')), onClick: doDownloadUpdate, fillMaxWidth: true, weight: 1 }),
      ctx.UI.Button({ containerColor: C.card, contentColor: C.text, shape: { cornerRadius: 12, type: "rounded" }, text: "稍后", onClick: function () { setUpdHide(true); }, weight: 1 }),
      ctx.UI.Button({ containerColor: C.card, contentColor: C.text, shape: { cornerRadius: 12, type: "rounded" }, text: "跳过此版本", onClick: doSkipUpdate, weight: 1 })
    ]));
    banner.push(ctx.UI.Row({ spacing: 8, fillMaxWidth: true }, [
      ctx.UI.Button({ containerColor: C.card, contentColor: C.text, shape: { cornerRadius: 12, type: "rounded" }, text: "打开官网下载", onClick: doOpenSite, fillMaxWidth: true })
    ]));
    if (updPath) banner.push(ctx.UI.Text({ text: '已下载到 ' + updPath + '（用「包管理 → 导入」安装）', fontSize: 11, color: C.dim }));
    if (updMsg && dlSt !== 'done') banner.push(ctx.UI.Text({ text: updMsg, fontSize: 12, color: C.dim }));
    children.push(ctx.UI.Card({ containerColor: C.soft, shape: { cornerRadius: 16, type: "rounded" }, border: { width: 1, color: C.primary, alpha: 0.4 }, elevation: 0, fillMaxWidth: true }, [
      ctx.UI.Column({ padding: 14, spacing: 10, fillMaxWidth: true }, banner)
    ]));
  }
  // ---- 主状态卡 ----
  var yTxt = (stY != null) ? String(stY) : "--";
  var xTxt = (stX != null) ? String(stX) : "--";
  var coolTxt = (stCool != null) ? "冷却中" : "无冷却";
  var cardTxt = stCardName ? stCardName : "跟随当前对话";
  children.push(ctx.UI.Card({
    containerColor: C.card, shape: { cornerRadius: 20, type: "rounded" },
    border: { width: 1, color: C.line }, elevation: 2, fillMaxWidth: true
  }, [
    ctx.UI.Column({ padding: 18, spacing: 12, fillMaxWidth: true }, [
      ctx.UI.Row({ fillMaxWidth: true, horizontalArrangement: "spaceBetween", verticalAlignment: "center" }, [
        ctx.UI.Text({ text: "唤醒概率 Y", fontSize: 12, fontWeight: "bold", color: C.dim }),
        ctx.UI.Text({ text: "X = " + xTxt + " 分钟", fontSize: 12, color: C.dim })
      ]),
      ctx.UI.Row({ verticalAlignment: "end", spacing: 3 }, [
        ctx.UI.Text({ text: yTxt, fontSize: 46, fontWeight: "bold", color: C.primary, maxLines: 1 }),
        ctx.UI.Text({ text: "%", fontSize: 20, fontWeight: "bold", color: C.primary }),
        ctx.UI.Text({ text: "每分钟掷一次", fontSize: 11, color: C.dim, padding: { horizontal: 8, vertical: 6 } })
      ]),
      ctx.UI.HorizontalDivider({ thickness: 1, color: C.line }),
      ctx.UI.Row({ fillMaxWidth: true, horizontalArrangement: "spaceBetween" }, [
        metric("未命中", (stMiss != null) ? String(stMiss) + " 次" : "--"),
        metric("上一次命中", stLastHit ? String(stLastHit).slice(5, 16) : "没有过"),
        metric("冷却", coolTxt, stCool ? C.primary : C.text),
        metric("角色卡", cardTxt)
      ])
    ])
  ]));

  // ---- 入口 ----
  children.push(sectionLabel("设置与工具"));
  var navRows = [];
  for (var ni = 0; ni < NAV_ITEMS.length; ni++) {
    if (ni > 0) navRows.push(ctx.UI.HorizontalDivider({ thickness: 1, color: C.line }));
    navRows.push((function (it) {
      return navRow(it[3], it[0], it[2], it[1]);
    })(NAV_ITEMS[ni]));
  }
  children.push(ctx.UI.Card({ containerColor: C.card, shape: { cornerRadius: 18, type: "rounded" }, border: { width: 1, color: C.line }, elevation: 1, fillMaxWidth: true }, [
    ctx.UI.Column({ padding: 0, spacing: 0, fillMaxWidth: true }, navRows)
  ]));

  // ---- 操作 ----
  children.push(sectionLabel("操作"));
  children.push(ctx.UI.Button({
    containerColor: C.primary, contentColor: C.onPrimary, shape: { cornerRadius: 14, type: "rounded" },
    text: "立即触发唤醒", fillMaxWidth: true, onClick: doAwake
  }));
  children.push(ctx.UI.Row({ spacing: 8, fillMaxWidth: true }, [
    ctx.UI.Button({ containerColor: C.card, contentColor: C.text, shape: { cornerRadius: 12, type: "rounded" }, text: "刷新状态", weight: 1, onClick: doRefresh }),
    ctx.UI.Button({ containerColor: C.card, contentColor: C.text, shape: { cornerRadius: 12, type: "rounded" }, text: "重置冷却", weight: 1, onClick: doResetCool }),
    ctx.UI.Button({ containerColor: C.card, contentColor: C.text, shape: { cornerRadius: 12, type: "rounded" }, text: "重置计数", weight: 1, onClick: doCoax })
  ]));

  // ---- 消息 ----
  if (msg) {
    children.push(ctx.UI.Card({ containerColor: C.soft, shape: { cornerRadius: 12, type: "rounded" }, elevation: 0, fillMaxWidth: true }, [
      ctx.UI.Row({ padding: 12, verticalAlignment: "center", spacing: 8, fillMaxWidth: true }, [
        ctx.UI.Icon({ name: "CheckCircle", size: 18, tint: C.primary }),
        ctx.UI.Text({ text: msg, fontSize: 13, color: C.text })
      ])
    ]));
  }
  children.push(ctx.UI.Button({ containerColor: C.card, contentColor: C.text, shape: { cornerRadius: 12, type: "rounded" }, text: "检查更新", fillMaxWidth: true, onClick: doForceCheck }));
  children.push(ctx.UI.Text({ text: 'v' + ((st && st.current_version) ? String(st.current_version) : '—') + ' · 打开面板时自动检查更新', fontSize: 11, color: C.dim }));

  return ctx.UI.LazyColumn({ containerColor: P.bg, backgroundColor: P.bg,
    onLoad: async function () {
      await initOnce();
      await checkUpdateUI();
    },
    fillMaxSize: true,
    padding: 16,
    spacing: 14
  }, children);

// ===== 导出：compose_dsl 运行时从这里找入口函数 =====
}
module.exports = Screen;
module.exports.default = Screen;
module.exports.Screen = Screen;
