/*
 * on_air — ToolPkg 入口
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
var ui = __importDefault(require("./ui/xy_panel.ui.js"));
var Screen = ui.default || ui;
var promptUi = __importDefault(require("./ui/prompt_panel.ui.js"));
var PromptScreen = promptUi.default || promptUi;
var paramsUi = __importDefault(require("./ui/params_panel.ui.js"));
var ParamsScreen = paramsUi.default || paramsUi;
var quietUi = __importDefault(require("./ui/quiet_panel.ui.js"));
var QuietScreen = quietUi.default || quietUi;
var datesUi = __importDefault(require("./ui/dates_panel.ui.js"));
var DatesScreen = datesUi.default || datesUi;
var consoleUi = __importDefault(require("./ui/console_panel.ui.js"));
var ConsoleScreen = consoleUi.default || consoleUi;

function registerToolPkg() {
    ToolPkg.registerUiRoute({
        id: "on_air_sidebar",
        runtime: "compose_dsl",
        screen: Screen,
        params: {},
        title: {
            zh: "随机上线",
            en: "On Air",
        }
    });

    ToolPkg.registerUiRoute({
        id: "on_air_prompts",
        runtime: "compose_dsl",
        screen: PromptScreen,
        params: {},
        title: {
            zh: "提示词设置",
            en: "Prompts"
        }
    });

    ToolPkg.registerUiRoute({
        id: "on_air_params",
        runtime: "compose_dsl",
        screen: ParamsScreen,
        params: {},
        title: { zh: "参数设置", en: "Params" }
    });

    ToolPkg.registerUiRoute({
        id: "on_air_quiet",
        runtime: "compose_dsl",
        screen: QuietScreen,
        params: {},
        title: { zh: "免打扰", en: "Quiet" }
    });

    ToolPkg.registerUiRoute({
        id: "on_air_dates",
        runtime: "compose_dsl",
        screen: DatesScreen,
        params: {},
        title: { zh: "日期静默", en: "Dates" }
    });
    ToolPkg.registerUiRoute({
        id: "on_air_console",
        runtime: "compose_dsl",
        screen: ConsoleScreen,
        params: {},
        title: { zh: "控制台", en: "Console" }
    });

    ToolPkg.registerNavigationEntry({
        id: "on_air_sidebar_entry",
        route: "toolpkg:com.operit.on_air:ui:on_air_sidebar",
        surface: "main_sidebar_plugins",
        title: {
            zh: "随机上线",
            en: "On Air",
        },
        order: 1,
    });

    return true;
}

exports.registerToolPkg = registerToolPkg;
