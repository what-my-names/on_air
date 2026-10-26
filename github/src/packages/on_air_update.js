/*
 * on_air_update.js — 更新检测与下载
 * v2.2.2+1：从 on_air.js 拆出（原 765-888 + 2625-2838）
 * 依赖由主文件注入：createHttpClient / loadState / saveState / loadFormula / saveFormula
 * 宿主全局：Tools / OkHttp / complete
 */
function createUpdateModule(deps) {
    var createHttpClient = deps.createHttpClient;
    var loadState = deps.loadState;
    var saveState = deps.saveState;
    var loadFormula = deps.loadFormula;
    var saveFormula = deps.saveFormula;

// ==================== v2.2.0：GitHub Release 更新检测 ====================
var CURRENT_VERSION = "v2.2.2+1";  // 每次发布同步修改
var UPDATE_REPO = "what-my-names/on_air";
var UPDATE_API = 'https://api.github.com/repos/' + UPDATE_REPO + '/releases?per_page=5';
var UPDATE_TTL_MS = 6 * 60 * 60 * 1000; // 6 小时缓存

// 语义化版本比较：a>b 返回 1，a<b 返回 -1，相等 0（忽略前缀 v）
function cmpVersion(a, b) {
    var pa = String(a || "").replace(/^v/i, "").replace(/\+/g, ".").split(".");
    var pb = String(b || "").replace(/^v/i, "").replace(/\+/g, ".").split(".");
    var n = Math.max(pa.length, pb.length);
    for (var i = 0; i < n; i++) {
        var na = parseInt(pa[i] || "0", 10); if (isNaN(na)) na = 0;
        var nb = parseInt(pb[i] || "0", 10); if (isNaN(nb)) nb = 0;
        if (na > nb) return 1;
        if (na < nb) return -1;
    }
    return 0;
}


// 把 Release 的 Markdown 正文转成纯文本（面板不支持 Markdown 渲染）
function mdToPlain(md) {
    var s = String(md || "").replace(/\r/g, "");
    // 只取【更新内容】段落（到下一个【标题】为止）；没有标记则全文明细
    var i = s.indexOf("【更新内容】");
    if (i >= 0) {
        s = s.slice(i + "【更新内容】".length);
        var j = s.indexOf("【");
        if (j >= 0) s = s.slice(0, j);
    }
    s = s.replace(/```[\s\S]*?```/g, " ");
    s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
    s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
    var lines = s.split("\n");
    var out = [];
    for (var k = 0; k < lines.length; k++) {
        var line = String(lines[k]).replace(/^\s+|\s+$/g, "");
        if (!line) continue;
        if (/^#{1,6}\s/.test(line)) continue;
        if (/^>/.test(line)) continue;
        if (/^[-=*_]{3,}$/.test(line)) continue;
        line = line.replace(/^[·•]\s*/, "").replace(/^[-*+]\s+/, "").replace(/^\d+\.\s+/, "");
        line = line.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/`([^`]*)`/g, "$1");
        out.push(line);
        if (out.length >= 6) break;
    }
    return out.join("\n").slice(0, 900);
}
function mdToPlainAll(md) {
    var s = String(md || "").replace(/\r/g, "");
    s = s.replace(/```[\s\S]*?```/g, " ");
    s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
    s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
    var lines = s.split("\n");
    var out = [];
    for (var i = 0; i < lines.length; i++) {
        var line = String(lines[i]).replace(/^\s+|\s+$/g, "");
        if (!line) { if (out.length && out[out.length - 1] !== "") out.push(""); continue; }
        if (/^[-=*_]{3,}$/.test(line)) continue;
        line = line.replace(/^#{1,6}\s*/, "").replace(/^>\s?/, "");
        line = line.replace(/^[·•]\s*/, "").replace(/^[-*+]\s+/, "").replace(/^\d+\.\s+/, "");
        line = line.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/`([^`]*)`/g, "$1");
        out.push(line);
    }
    return out.join("\n").replace(/\n{3,}/g, "\n\n").slice(0, 2000);
}

// 拉取最新 Release（带 6h 缓存，缓存存在 state.update_cache）
async function fetchLatestRelease(state, opts) {
    try {
        var now = Date.now();
        var cache = state && state.update_cache;
        var cacheFresh = !!(cache && cache.checked_at && (now - cache.checked_at) < UPDATE_TTL_MS && cache.latest);
        // 发版后：缓存里的版本比当前版本还旧 → 视为失效，重新拉
        if (cacheFresh && cmpVersion(cache.latest.tag, CURRENT_VERSION) < 0) cacheFresh = false;
        if (cacheFresh && !(opts && opts.force)) {
            return { cached: true, release: cache.latest };
        }
        var client = createHttpClient(15000);
        var req = client.newRequest()
            .url(UPDATE_API)
            .method("GET")
            .headers({ "User-Agent": "Operit/on_air", "Accept": "application/vnd.github+json" })
            .build();
        var resp = await req.execute();
        if (!resp.isSuccessful()) return { cached: false, error: "HTTP " + resp.code() };
        var list = resp.json() || [];
        if (!Array.isArray(list)) return { cached: false, error: '返回格式异常' };
        // 取版本号最大的那个（列表按创建时间倒序，Beta 与正式版混排时取第一个会拿错）
        var data = null;
        for (var li = 0; li < list.length; li++) {
            var relOne = list[li];
            if (!relOne || relOne.draft) continue;
            if (!data || cmpVersion(relOne.tag_name, data.tag_name) > 0) data = relOne;
        }
        if (!data) return { cached: false, error: '没有可用的 Release' };
        var assetUrl = '', assetName = '', assetSize = 0, assetId = 0;
        var assets = Array.isArray(data.assets) ? data.assets : [];
        for (var i = 0; i < assets.length; i++) {
            if (assets[i] && /\.toolpkg$/i.test(String(assets[i].name || ""))) {
                assetUrl = assets[i].browser_download_url || "";
                assetName = assets[i].name || "";
                assetSize = assets[i].size || 0;
                assetId = assets[i].id || 0;
                break;
            }
        }
        var rel = {
            tag: String(data.tag_name || ""),
            name: String(data.name || ""),
            body: mdToPlain(String(data.body || "")),
            body_full: mdToPlainAll(String(data.body || "")),
            url: String(data.html_url || ""),
            published_at: String(data.published_at || ""),
            asset_url: assetUrl, asset_size: assetSize, asset_id: assetId,
            prerelease: !!data.prerelease,
            asset_name: assetName
        };
        if (state) { state.update_cache = { checked_at: now, latest: rel }; await saveState(state); }
        return { cached: false, release: rel };
    } catch (e) {
        return { cached: false, error: String((e && e.message) || e) };
    }
}
// ==================== v2.2.0：更新检测工具 ====================
var check_update = async function (params) {
    var formula = await loadFormula();
    var state = await loadState();
    var r = await fetchLatestRelease(state, { force: !!(params && params.force) });
    if (r.error) { complete({ success: false, message: "检查更新失败：" + r.error }); return; }
    var rel = r.release || {};
    var has = cmpVersion(rel.tag, CURRENT_VERSION) > 0;
    var skipped = String(formula.skipped_version || "") === String(rel.tag || "");
    complete({
        success: true,
        message: has ? ("发现新版本 " + rel.tag) : ("已是最新版本 " + CURRENT_VERSION),
        data: {
            hasUpdate: has, skipped: skipped, current: CURRENT_VERSION,
            latest: rel.tag, name: rel.name, notes: rel.body, notes_full: (rel.body_full || rel.body), url: rel.url,
            published_at: rel.published_at,
            asset_url: rel.asset_url, asset_name: rel.asset_name, asset_size: rel.asset_size || 0, prerelease: !!rel.prerelease, cached: !!r.cached
        }
    });
};

// ==================== v2.2.2: download state persistence ====================
function fmtSize(n) {
    n = Number(n) || 0;
    if (n >= 1048576) return (Math.round(n / 104857.6) / 10) + ' MB';
    if (n >= 1024) return Math.round(n / 1024) + ' KB';
    return n + ' B';
}
var __dlBusy = false;
async function writeDlState(patch) {
    // 串行化：连点下载时两次写盘会互相覆盖，导致后面的字段丢失
    var __waitN = 0;
    while (__dlBusy && __waitN < 250) { try { await new Promise(function (r) { setTimeout(r, 20); }); } catch (eW) { break; } __waitN++; }
    __dlBusy = true;
    try {
        var state = await loadState();
        var d = state.download || {};
        for (var k in patch) { if (Object.prototype.hasOwnProperty.call(patch, k)) d[k] = patch[k]; }
        d.updated_at = Date.now();
        state.download = d;
        await saveState(state);
        return d;
    } catch (e) { return null; }
    finally { __dlBusy = false; }
}
async function readDlState() {
    try { var state = await loadState(); return state.download || null; } catch (e) { return null; }
}
var get_download_status = async function (params) {
    var d = await readDlState();
    if (!d || !d.status || d.status === 'idle') {
        complete({ success: true, message: '当前没有下载任务', data: { status: 'idle', percent: 0 } });
        return;
    }
    // 先看文件：如果包已完整存在（大小对得上），直接判定完成，不要因为进程重启判成失败
    var earlyExists = false, earlySize = 0;
    if (d.path) {
        try { var ef0 = await Tools.Files.exists(d.path); earlyExists = !!(ef0 && ef0.exists); earlySize = Number(ef0 && ef0.size) || 0; } catch (e0) { }
    }
    var dTotal0 = Number(d.total) || 0;
    if (d.status === 'running' && earlyExists && dTotal0 > 0 && earlySize === dTotal0) {
        await writeDlState({ status: 'done', received: earlySize, message: '已下载 ' + fmtSize(earlySize) + ' / 共 ' + fmtSize(dTotal0) + ' → ' + d.path });
        d = await readDlState();
    }
    if (d.status === 'running' && !__dlRunning && d.updated_at && (Date.now() - d.updated_at > 600000)) {   // DL5：在执行中不判死，阈值放到 10 分钟
        await writeDlState({ status: 'failed', message: '上次下载中断了（App 或网络被中断），请重新点下载' });
        d = await readDlState();
    }
    var exists = false, fsize = 0;
    if (d.path) {
        try { var fe = await Tools.Files.exists(d.path); exists = !!(fe && fe.exists); fsize = Number(fe && fe.size) || 0; } catch (e) { exists = false; }
    }
    if (d.status === 'done' && !exists) {
        await writeDlState({ status: 'missing', message: '下载的更新包已不在原路径（可能被清理或移走了）' });
        d = await readDlState();
    }
    var total = Number(d.total) || 0;
    var got = Number(d.received) || 0;
    var percent = total > 0 ? Math.min(100, Math.floor(got * 100 / total)) : 0;
    complete({
        success: true, message: d.message || '',
        data: {
            status: d.status, received: got, total: total, percent: percent,
            received_text: fmtSize(got), total_text: total > 0 ? fmtSize(total) : '大小未知',
            path: d.path || '', version: d.version || '', attempts: d.attempts || 0,
            exists: exists, file_size: fsize, updated_at: d.updated_at || 0
        }
    });
};

var download_update = async function (params) {
    var needForce = !!(params && params.force);
    // DL1：整个下载过程只允许一个实例；超过 10 分钟自动失效（防止漏释放把功能卡死）
    if (__dlRunning && (Date.now() - __dlStartedAt) < 10 * 60000) {
        complete({ success: false, message: '正在下载中（已进行 ' + Math.round((Date.now() - __dlStartedAt) / 1000) + ' 秒），等它完成就好', data: { busy: true, status: 'running' } });
        return;
    }
    __dlRunning = true;
    __dlStartedAt = Date.now();
    try {
    // 连点保护：上一次还在跑就直接回 busy，不重置进度
    var st0 = await readDlState();
    if (st0 && st0.status === 'running' && st0.updated_at && (Date.now() - st0.updated_at) < 45000) {
        complete({ success: false, message: '正在下载中，请等它完成（' + (st0.message || '进行中') + '）', data: { busy: true, status: 'running' } });
        return;
    }
    var state = await loadState();
    await writeDlState({ status: 'running', received: 0, total: 0, path: '', version: '', attempts: 0, message: '正在获取最新版本信息…', started_at: Date.now() });
    var r = await fetchLatestRelease(state, { force: needForce });
    if (r.error) {
        await writeDlState({ status: 'failed', message: '检查更新失败：' + r.error + '（还没开始下载，没产生任何文件）' });
        complete({ success: false, message: '检查更新失败：' + r.error });
        return;
    }
    var rel = r.release || {};
    if (!rel.asset_url) {
        await writeDlState({ status: 'failed', message: '该版本没有可下载的 .toolpkg 资产（没产生任何文件）' });
        complete({ success: false, message: '该版本没有可下载的 .toolpkg 资产' });
        return;
    }
    var dir = '/storage/emulated/0/Download/Operit/';
    var fileName = rel.asset_name || ('com.operit.on_air-' + rel.tag + '.toolpkg');
    var path = dir + fileName;
    var part = path + '.part';
    var total = Number(rel.asset_size) || 0;
    try { await Tools.Files.mkdir(dir); } catch (e0) { }
    // 已经有完整包 → 直接算完成，不重复下载（连点、重开都逃不掉）
    try {
        var fe0 = await Tools.Files.exists(path);
        var sz0 = Number(fe0 && fe0.size) || 0;
        if (fe0 && fe0.exists && total > 0 && sz0 === total) {
            await writeDlState({ status: 'done', received: sz0, total: total, path: path, version: rel.tag, attempts: 0, message: '已下载 ' + fmtSize(sz0) + ' / 共 ' + fmtSize(total) + ' → ' + path });
            complete({ success: true, message: '更新包已存在（' + fmtSize(sz0) + '），不用重复下载', data: { path: path, size: sz0, total: total, version: rel.tag, cached_file: true } });
            return;
        }
    } catch (eEx) { }
    await writeDlState({ status: 'running', received: 0, total: total, path: path, version: rel.tag, attempts: 0, message: '正在连接…（共 ' + (total > 0 ? fmtSize(total) : '大小未知') + '）' });
    var lastErr = '';
    var maxTry = 2;
    for (var attempt = 1; attempt <= maxTry; attempt++) {
        try {
            await writeDlState({ attempts: attempt, received: 0, message: '第 ' + attempt + '/' + maxTry + ' 次尝试：正在连接…' + (total > 0 ? '（共 ' + fmtSize(total) + '）' : '') });
            var client = createHttpClient(45000);
            // 下载线路：走 api.github.com 的资产接口（github.com 在当前网络不可达）
            var dlUrl = rel.asset_id ? ('https://api.github.com/repos/' + UPDATE_REPO + '/releases/assets/' + rel.asset_id) : rel.asset_url;
            var req = client.newRequest().url(dlUrl).method('GET').headers({ 'User-Agent': 'Operit/on_air', 'Accept': 'application/octet-stream' }).build();
            // 只发一次请求：不再用 probe 预下载（那会把包下两遍，而且它的字节数是 base64 累计，会报出 132KB 这种假数字）
            await writeDlState({ received: 0, message: '正在下载…' + (total > 0 ? '（共 ' + fmtSize(total) + '）' : '') + ' 这期间进度不会跳动，下完会自动校验' });
            var resp = await req.execute();
            if (!resp.isSuccessful()) {
                var code = resp.code();
                if (code === 404) {
                    await writeDlState({ status: 'failed', message: '下载失败：404（该版本的资产没上传到 Release），未产生任何文件' });
                    complete({ success: false, message: '下载失败：404（该版本的资产没上传到 Release）' });
                    return;
                }
                lastErr = (code === 403) ? '403（GitHub 限流，稍后再试）' : ('HTTP ' + code);
                throw new Error(lastErr);
            }
            var b64 = null;
            try { b64 = resp.bodyAsBase64(); } catch (e1) { b64 = null; }
            if (!b64) throw new Error('拿不到二进制内容（空响应）');
            // 注意：流式执行时 resp.size 不是字节数（实测偏大），改用 base64 反推真实字节数
            var b64len = b64.length;
            var padN = 0;
            if (b64.charAt(b64len - 1) === '=') padN++;
            if (b64.charAt(b64len - 2) === '=') padN++;
            var realSize = Math.floor(b64len * 3 / 4) - padN;
            await writeDlState({ received: realSize, message: '校验文件大小…' });
            if (total > 0 && realSize !== total) {
                throw new Error('文件不完整（收到 ' + fmtSize(realSize) + ' / 应为 ' + fmtSize(total) + '）');
            }
            try { await Tools.Files.deleteFile(part); } catch (e2) { }
            await Tools.Files.writeBinary(part, b64);
            try { await Tools.Files.deleteFile(path); } catch (e3) { }
            await Tools.Files.move(part, path);
            var finTotal = total > 0 ? total : realSize;
            await writeDlState({ status: 'done', received: realSize, total: finTotal, path: path, version: rel.tag, attempts: attempt, message: '已下载 ' + fmtSize(realSize) + ' / 共 ' + fmtSize(finTotal) + ' → ' + path });
            try { if (Tools.System && Tools.System.sendNotification) Tools.System.sendNotification('更新包已下载（' + fmtSize(realSize) + '）：' + path + ' → 去包管理导入', '随机上线 更新下载完成'); } catch (eN) { }
            try { if (Tools.System && Tools.System.toast) Tools.System.toast('更新包已下载：' + fmtSize(realSize)); } catch (eT) { }
            complete({ success: true, message: '更新包已下载（' + fmtSize(realSize) + '）', data: { path: path, size: realSize, total: finTotal, version: rel.tag, attempts: attempt } });
            return;
        } catch (e) {
            lastErr = String((e && e.message) || e);
            if (/ENOSPC|No space|space left|磁盘/i.test(lastErr)) lastErr = '磁盘空间不足，清理后重试（明细：' + lastErr + '）';
            else if (/failed to connect|Connection|ECONNRESET|timeout|timed out/i.test(lastErr)) lastErr = '连不上 GitHub（网络/代理问题，换网络或开代理再试）';
            try { await Tools.Files.deleteFile(part); } catch (e4) { }
            if (attempt < maxTry) {
                await writeDlState({ status: 'running', message: '第 ' + attempt + ' 次失败：' + lastErr + '，正在自动重试…' });
                try { await new Promise(function (res) { setTimeout(res, attempt * 2000); }); } catch (e5) { }
            }
        }
    }
    var failMsg = '下载失败（已重试 ' + maxTry + ' 次）：' + lastErr;
    await writeDlState({ status: 'failed', received: 0, message: failMsg + '｜未完成的临时文件已清理，没留下半个包' });
    complete({ success: false, message: failMsg + '（未完成的临时文件已清理，没留下半个包）', data: { busy: false, status: 'failed', reason: lastErr } });
    } finally { __dlRunning = false; }
};
var open_url = async function (params) {
    var url = String((params && params.url) || "");
    if (!/^https?:/i.test(url)) { complete({ success: false, message: "只支持 http(s) 链接" }); return; }
    try {
        var r = await Tools.System.intent({ action: "android.intent.action.VIEW", uri: url, type: "activity" });
        complete({ success: true, message: "已在浏览器打开", data: { result: r } });
    } catch (e) { complete({ success: false, message: "打开失败：" + String((e && e.message) || e) }); }
};
var skip_update = async function (params) {
    var formula = await loadFormula();
    var v = String((params && params.version) || "");
    if (!v) { complete({ success: false, message: "需要 version 参数" }); return; }
    formula.skipped_version = v;
    await saveFormula(formula);
    complete({ success: true, message: "已跳过版本 " + v });
};
    return {
        CURRENT_VERSION: CURRENT_VERSION,
        UPDATE_REPO: UPDATE_REPO,
        UPDATE_API: UPDATE_API,
        UPDATE_TTL_MS: UPDATE_TTL_MS,
        cmpVersion: cmpVersion,
        fetchLatestRelease: fetchLatestRelease,
        tools: {
            check_update: check_update,
            get_download_status: get_download_status,
            download_update: download_update,
            open_url: open_url,
            skip_update: skip_update
        }
    };
}
module.exports = createUpdateModule;
