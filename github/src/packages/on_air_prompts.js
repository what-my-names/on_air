/*
 * on_air_prompts.js — 提示词取值 / 占位符替换 / 话术筛选
 * v2.2.2+1：从 on_air.js 拆出（原 449-521）
 * 依赖注入：DEFAULT_FORMULA（默认值回落用）
 */
function createPromptsModule(deps) {
    var DEFAULT_FORMULA = deps.DEFAULT_FORMULA;
// ===== v1.9.0 提示词取值 / 占位符替换（全部调用点统一走这里） =====
// 规则：用户在 formula 里改过的用用户的；空/非法/超长回落默认；占位符无值则原样保留。
var PROMPT_KEYS = [
    "prompt_manual_default", "prompt_manual_prefix",
    "prompt_auto_default", "prompt_auto_prefix",
    "prompt_gentle", "prompt_stop", "prompt_quiet_lifted"
];

function pickPrompt(formula, key) {
    var def = DEFAULT_FORMULA[key] || "";
    var v = (formula && typeof formula[key] === "string") ? formula[key] : "";
    if (!v.trim()) return def;
    if (v.length > 2000) return v.slice(0, 2000);
    return v;
}

function fillPrompt(tpl, vars) {
    var s = String(tpl || "");
    if (!vars) return s;
    for (var k in vars) {
        var val = vars[k];
        if (val === undefined || val === null) continue;
        s = s.split("{" + k + "}").join(String(val));
    }
    return s;
}

// 带话术的模板：有 {话术} 就替换，没有就追加到末尾（兼容旧行为）
function buildTalkPrompt(formula, key, talk) {
    var tpl = pickPrompt(formula, key);
    if (tpl.indexOf("{话术}") >= 0) return fillPrompt(tpl, { "话术": talk });
    return fillPrompt(tpl, null) + String(talk || "");
}

function buildPrompt(formula, key, vars) {
    return fillPrompt(pickPrompt(formula, key), vars);
}

// v2.0.0：话术可用性校验 —— 挡掉占位/测试串，避免 AI 把它原样念给用户
function isUsableTalk(s) {
    if (typeof s !== "string") return false;
    var t = s.trim();
    if (t.length < 2) return false;
    // N2：只认明确的占位标记；含“话术”二字的正常句子不能误判
    var bad = ["占位", "placeholder", "todo", "TODO"];
    for (var i = 0; i < bad.length; i++) {
        if (t.indexOf(bad[i]) >= 0) return false;
    }
    return true;
}
// 从候选里随机抽一条可用的；全部不可用则返回 ""（调用方回落 default 模式）
function pickUsableTalk(list) {
    var good = [];
    if (Array.isArray(list)) {
        for (var i = 0; i < list.length; i++) {
            if (isUsableTalk(list[i])) good.push(list[i]);
        }
    }
    if (!good.length) return "";
    return good[Math.floor(Math.random() * good.length)];
}

// 取档位话术库（用户可自定义）：返回指定档位的候选数组
function pickTierList(formula, tierIndex) {
    var tiers = (formula && Array.isArray(formula.jealousy_tiers) && formula.jealousy_tiers.length)
        ? formula.jealousy_tiers : DEFAULT_FORMULA.jealousy_tiers;
    var idx = tierIndex;
    if (!(idx >= 0)) idx = 0;
    if (idx >= tiers.length) idx = tiers.length - 1;
    var list = tiers[idx];
    if (!Array.isArray(list) || !list.length) list = DEFAULT_FORMULA.jealousy_tiers[DEFAULT_FORMULA.jealousy_tiers.length - 1];
    return list;
}
    return {
        PROMPT_KEYS: PROMPT_KEYS,
        pickPrompt: pickPrompt,
        fillPrompt: fillPrompt,
        buildTalkPrompt: buildTalkPrompt,
        buildPrompt: buildPrompt,
        isUsableTalk: isUsableTalk,
        pickUsableTalk: pickUsableTalk,
        pickTierList: pickTierList
    };
}
module.exports = createPromptsModule;
