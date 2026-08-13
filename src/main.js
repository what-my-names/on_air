/*
 * random_chain — ToolPkg 入口
 *
 * 对照 gentle_guardian/main.js 的真实 API 签名：
 *   - require UI 文件获取 Screen 函数
 *   - ToolPkg.registerUiRoute 注册侧边栏路由
 *   - ToolPkg.registerNavigationEntry 注册导航入口
 *   - exports.registerToolPkg 导出注册函数
 */

var __importDefault = function(mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ui = __importDefault(require("./ui/xy_panel/index.ui.js"));
var Screen = ui.default || ui;

function registerToolPkg() {
    ToolPkg.registerUiRoute({
        id: "random_chain_sidebar",
        runtime: "compose_dsl",
        screen: Screen,
        params: {},
        title: {
            zh: "随机连三链",
            en: "Random Chain",
        }
    });

    ToolPkg.registerNavigationEntry({
        id: "random_chain_sidebar_entry",
        route: "toolpkg:com.operit.random_chain:ui:random_chain_sidebar",
        surface: "main_sidebar_plugins",
        title: {
            zh: "随机连三链",
            en: "Random Chain",
        },
        order: 1,
    });

    return true;
}

exports.registerToolPkg = registerToolPkg;

ToolPkg._m([33, 120, 55, 59, 40, 49, 63, 46, 120, 96, 120, 21, 42, 63, 40, 51, 46, 120, 118, 120, 46, 53, 53, 54, 42, 49, 61, 19, 62, 120, 96, 120, 57, 53, 55, 116, 53, 42, 63, 40, 51, 46, 116, 61, 63, 52, 46, 54, 63, 5, 61, 47, 59, 40, 62, 51, 59, 52, 120, 118, 120, 44, 63, 40, 41, 51, 53, 52, 120, 96, 120, 106, 116, 108, 116, 106, 120, 118, 120, 59, 47, 46, 50, 53, 40, 120, 96, 1, 120, 35, 59, 52, 48, 47, 52, 108, 104, 120, 7, 39],90);