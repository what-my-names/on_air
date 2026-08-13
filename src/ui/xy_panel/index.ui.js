function Screen(ctx) {
  /*
   * 随机连三链 — 侧边栏面板 v6（简洁版，纯 Compose DSL）
   *
   * 布局（按需求拍板）：
   *   顶部：标题 + 运行状态徽章
   *   大字号：唤醒概率 y（来自 get_xy 真实状态）
   *   卡1 参数：X 输入（带写入后 y 预览）+ 公式参数 a/b/c + 冷却时间输入
   *   卡2 话术：默认模式(显示 A1/A2) / 自定义模式(显示话术输入框)
   *   一行操作：触发唤醒 / 重置冷却 / 重置计数
   *   底部：连续未命中 / 上次命中 / 冷却截止（精简状态行）
   *
   * 全部交互走 ctx.callTool 调 random_chain 工具，与后台 workflow 共用 state.json / formula.json。
   */

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
    var r1 = await callTool("random_chain:get_xy");
    if (r1.success && r1.data) setSt(r1.data);
    var r2 = await callTool("random_chain:get_formula");
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
    }
  }

  // ===== 动作 =====
  async function doSaveX() {
    var r = await callTool("random_chain:set_x", { x: xInput });
    await showMsg(r.success ? ("X 已写入：" + xInput) : ("写入失败：" + (r.message || "")));
    if (r.success) await refresh();
  }

  async function doSaveCool() {
    var r = await callTool("random_chain:update_formula", { cooldown_minutes: coolInput });
    await showMsg(r.success ? ("冷却时间已保存：" + coolInput + " 分钟") : ("保存失败：" + (r.message || "")));
    if (r.success) await refresh();
  }

  async function doSaveCardName() {
    var r = await callTool("random_chain:update_formula", { character_card_name: cardNameInput });
    await showMsg(r.success ? "角色卡名字已保存" : ("保存失败：" + (r.message || "")));
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
    var r = await callTool("random_chain:update_formula", params);
    await showMsg(r.success ? "公式参数已保存" : ("保存失败：" + (r.message || "")));
    if (r.success) await refresh();
  }

  async function doSaveTalk() {
    var lines = String(talkInput || "").split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
    // 未安装温柔巡检时强制 A1（A2 依赖温柔巡检的自动回复通道）
    var gentleOk = !!(st && st.gentle_installed);
    var params = { awake_mode: awakeMode, send_mode: gentleOk ? sendMode : "A1" };
    if (lines.length) params.awake_messages = JSON.stringify(lines);
    var r = await callTool("random_chain:update_formula", params);
    await showMsg(r.success ? "已保存" : ("保存失败：" + (r.message || "")));
    if (r.success) await refresh();
  }

  async function doAwake() {
    setMsg("正在触发…");
    var r = await callTool("random_chain:manual_awake");
    await showMsg(r.success ? "已触发唤醒" : ("唤醒失败：" + (r.message || "")));
    if (r.success) await refresh();
  }

  async function doResetCool() {
    var r = await callTool("random_chain:reset_cooldown", { minutes: 0 });
    await showMsg(r.success ? "已重置冷却" : ("重置失败：" + (r.message || "")));
    if (r.success) await refresh();
  }

  async function doCoax() {
    var r = await callTool("random_chain:coax");
    await showMsg(r.success ? "已重置计数" : ("重置失败：" + (r.message || "")));
    if (r.success) await refresh();
  }

  async function doRefresh() {
    await refresh();
    await showMsg("已刷新");
  }

  // ===== 派生显示 =====
  function statusText() {
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
    ctx.UI.Text({ text: "随机连三链", style: "headlineSmall", fontWeight: "bold", weight: 1 }),
    ctx.UI.Text({ text: statusText(), style: "labelLarge", color: statusText() === "运行中" ? "primary" : "onSurfaceVariant" })
  ]));

  // ---- 大字号唤醒概率 y ----
  children.push(ctx.UI.Card({ containerColor: "primaryContainer", fillMaxWidth: true }, [
    ctx.UI.Column({ padding: 14, spacing: 2 }, [
      ctx.UI.Text({ text: "唤醒概率 y", style: "bodySmall", color: "onPrimaryContainer" }),
      ctx.UI.Text({ text: (stY != null) ? String(stY) + "%" : "…%", style: "headlineLarge", fontWeight: "bold", color: "onPrimaryContainer" }),
      ctx.UI.Text({ text: (stX != null) ? "当前 X = " + stX + " 分钟" : "状态读取中…", style: "bodySmall", color: "onPrimaryContainer" })
    ])
  ]));

  // ---- 卡1 参数 ----
  var card1 = [];
  card1.push(ctx.UI.Text({ text: "X（离开时长 / 分钟）", style: "bodySmall", color: "onSurfaceVariant" }));
  card1.push(ctx.UI.TextField({
    value: xInput,
    onValueChange: setXInput,
    singleLine: true,
    placeholder: (stX != null) ? String(stX) : "如 21"
  }));
  card1.push(ctx.UI.Row({ verticalAlignment: "center" }, [
    ctx.UI.Text({ text: "写入后 y ≈ " + yPreview + "%", style: "bodySmall", color: "primary", weight: 1 }),
    ctx.UI.Spacer({ width: 8 }),
    ctx.UI.Button({ text: "写入", onClick: doSaveX })
  ]));
  card1.push(ctx.UI.Spacer({ height: 4 }));
  card1.push(ctx.UI.Text({ text: "公式参数（f = a·x + b·x^c）", style: "bodySmall", color: "onSurfaceVariant" }));
  card1.push(ctx.UI.TextField({
    value: aInput,
    onValueChange: setAInput,
    singleLine: true,
    placeholder: "a 如 0.007078203"
  }));
  card1.push(ctx.UI.TextField({
    value: bInput,
    onValueChange: setBInput,
    singleLine: true,
    placeholder: "b 如 6.00914e-07"
  }));
  card1.push(ctx.UI.TextField({
    value: cInput,
    onValueChange: setCInput,
    singleLine: true,
    placeholder: "c 如 3.15168"
  }));
  card1.push(ctx.UI.Row({ verticalAlignment: "center" }, [
    ctx.UI.Spacer({ weight: 1 }),
    ctx.UI.Button({ text: "保存参数", onClick: doSaveAbc })
  ]));
  card1.push(ctx.UI.Spacer({ height: 4 }));
  card1.push(ctx.UI.Text({ text: "唤醒后冷却（分钟）", style: "bodySmall", color: "onSurfaceVariant" }));
  card1.push(ctx.UI.TextField({
    value: coolInput,
    onValueChange: setCoolInput,
    singleLine: true,
    placeholder: "15"
  }));
  card1.push(ctx.UI.Row({ verticalAlignment: "center" }, [
    ctx.UI.Spacer({ weight: 1 }),
    ctx.UI.Button({ text: "保存冷却", onClick: doSaveCool })
  ]));
  card1.push(ctx.UI.Spacer({ height: 4 }));
  card1.push(ctx.UI.Text({ text: "角色卡名字（唤醒时按名字用这张角色卡；留空=跟随当前对话）", style: "bodySmall", color: "onSurfaceVariant" }));
  card1.push(ctx.UI.TextField({
    value: cardNameInput,
    onValueChange: setCardNameInput,
    singleLine: true,
    placeholder: "例如角色卡的名字"
  }));
  card1.push(ctx.UI.Row({ verticalAlignment: "center" }, [
    ctx.UI.Spacer({ weight: 1 }),
    ctx.UI.Button({ text: "保存角色卡", onClick: doSaveCardName })
  ]));
  children.push(ctx.UI.Card({ fillMaxWidth: true }, [
    ctx.UI.Column({ padding: 14, spacing: 8 }, [
      ctx.UI.Text({ text: "参数", style: "titleMedium", fontWeight: "semiBold", color: "primary" })
    ].concat(card1))
  ]));

  // ---- 卡2 话术 ----
  var card2 = [];
  card2.push(ctx.UI.Row({ spacing: 8 }, [
    ctx.UI.Button({
      text: (awakeMode === "default" ? "✔ " : "") + "默认模式",
      weight: 1,
      onClick: function () { setAwakeMode("default"); }
    }),
    ctx.UI.Button({
      text: (awakeMode === "custom" ? "✔ " : "") + "自定义",
      weight: 1,
      onClick: function () { setAwakeMode("custom"); }
    })
  ]));
  if (awakeMode === "custom") {
    card2.push(ctx.UI.TextField({
      value: talkInput,
      onValueChange: setTalkInput,
      minLines: 4,
      placeholder: "每行写一句，如：想你了，最近在忙吗？"
    }));
  }
  if (awakeMode === "default") {
    // 发送方式 A1/A2：只在"默认模式"下显示；A2 仅检测到温柔巡检时才出现
    var gentleOk2 = !!(st && st.gentle_installed);
    card2.push(ctx.UI.Text({ text: "发送方式", style: "bodySmall", color: "onSurfaceVariant" }));
    if (gentleOk2) {
      card2.push(ctx.UI.Row({ spacing: 8 }, [
        ctx.UI.Button({
          text: (sendMode === "A1" ? "✔ " : "") + "A1",
          weight: 1,
          onClick: function () { setSendMode("A1"); }
        }),
        ctx.UI.Button({
          text: (sendMode === "A2" ? "✔ " : "") + "A2",
          weight: 1,
          onClick: function () { setSendMode("A2"); }
        })
      ]));
    } else {
      card2.push(ctx.UI.Row({ spacing: 8 }, [
        ctx.UI.Button({
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
      color: "onSurfaceVariant"
    }));
  }
  card2.push(ctx.UI.Button({ text: "保存话术 / 发送方式", fillMaxWidth: true, onClick: doSaveTalk }));
  children.push(ctx.UI.Card({ fillMaxWidth: true }, [
    ctx.UI.Column({ padding: 14, spacing: 8 }, [
      ctx.UI.Text({ text: "话术", style: "titleMedium", fontWeight: "semiBold", color: "primary" })
    ].concat(card2))
  ]));

  // ---- 一行操作：触发 / 重置冷却 / 重置计数 ----
  children.push(ctx.UI.Row({ spacing: 8, fillMaxWidth: true }, [
    ctx.UI.Button({ text: "触发唤醒", fillMaxWidth: true, weight: 1, onClick: doAwake }),
    ctx.UI.Button({ text: "重置冷却", fillMaxWidth: true, weight: 1, onClick: doResetCool }),
    ctx.UI.Button({ text: "重置计数", fillMaxWidth: true, weight: 1, onClick: doCoax })
  ]));

  // ---- 底部精简状态 ----
  children.push(ctx.UI.Card({ fillMaxWidth: true }, [
    ctx.UI.Column({ padding: 14, spacing: 4 }, [
      ctx.UI.Text({ text: "连续未命中：" + (stMiss != null ? stMiss + " 次" : "…"), style: "bodySmall", color: "onSurfaceVariant" }),
      ctx.UI.Text({ text: "上次命中：" + (stLastHit || "—"), style: "bodySmall", color: "onSurfaceVariant" }),
      ctx.UI.Text({ text: "冷却截止：" + (stCool || "—"), style: "bodySmall", color: "onSurfaceVariant" }),
      ctx.UI.Text({ text: "角色卡：" + (stCardName || "跟随当前对话"), style: "bodySmall", color: "onSurfaceVariant" }),
      ctx.UI.Text({
        text: ((st && st.gentle_installed)
          ? ("温柔巡检：已安装，醋意联动开启" + (st.gentle_jealousy != null ? "（当前醋意值 " + st.gentle_jealousy + "）" : ""))
          : "温柔巡检：未安装，无醋意联动"),
        style: "bodySmall",
        color: "onSurfaceVariant"
      })
    ])
  ]));

  // ---- 消息提示 ----
  if (msg) {
    children.push(ctx.UI.Card({ containerColor: "primaryContainer", fillMaxWidth: true }, [
      ctx.UI.Row({ padding: 14, verticalAlignment: "center" }, [
        ctx.UI.Text({ text: msg, style: "bodyMedium", color: "onPrimaryContainer", weight: 1 })
      ])
    ]));
  }

  // ---- 刷新 ----
  children.push(ctx.UI.Button({ text: "刷新状态", fillMaxWidth: true, onClick: doRefresh }));

  return ctx.UI.LazyColumn({
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
