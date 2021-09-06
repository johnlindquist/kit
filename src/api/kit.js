"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorPrompt = void 0;
const enum_1 = require("@core/enum");
const util_1 = require("@core/util");
const strip_ansi_1 = __importDefault(require("strip-ansi"));
let errorPrompt = async (error) => {
    if (process.env.KIT_CONTEXT === "app") {
        console.warn(`☠️ ERROR PROMPT SHOULD SHOW ☠️`);
        let stackWithoutId = error.stack.replace(/\?[^:]*/, "");
        // console.warn(stackWithoutId)
        let errorFile = global.kitScript;
        let line = "1";
        let col = "1";
        let secondLine = stackWithoutId.split("\n")[1] || "";
        if (secondLine?.match("at file://")) {
            errorFile = secondLine
                .replace("at file://", "")
                .replace(/:.*/, "")
                .trim();
            [, line, col] = secondLine
                .replace("at file://", "")
                .split(":");
        }
        let script = global.kitScript.replace(/.*\//, "");
        let errorToCopy = `${error.message}\n${error.stack}`;
        let dashedDate = () => new Date()
            .toISOString()
            .replace("T", "-")
            .replace(/:/g, "-")
            .split(".")[0];
        let errorJsonPath = global.tmp(`error-${dashedDate()}.txt`);
        await writeFile(errorJsonPath, errorToCopy);
        // .replaceAll('"', '\\"')
        // .replaceAll(/(?:\r\n|\r|\n)/gm, "$newline$")
        let child = spawnSync((0, util_1.kitPath)("bin", "sk"), [
            (0, util_1.kitPath)("cli", "error-action.js"),
            script,
            errorJsonPath,
            errorFile,
            line,
            col,
        ]);
    }
    else {
        console.log(error);
    }
};
exports.errorPrompt = errorPrompt;
global.attemptImport = async (path, ..._args) => {
    try {
        global.updateArgs(_args);
        //import caches loaded scripts, so we cache-bust with a uuid in case we want to load a script twice
        //must use `import` for ESM
        return await Promise.resolve().then(() => __importStar(require(path + "?uuid=" + global.uuid())));
    }
    catch (error) {
        console.warn(error.message);
        console.warn(error.stack);
        await (0, exports.errorPrompt)(error);
    }
};
global.runSub = async (scriptPath, ...runArgs) => {
    return new Promise(async (res, rej) => {
        let values = [];
        if (!scriptPath.includes("/")) {
            scriptPath = (0, util_1.kenvPath)("scripts", scriptPath);
        }
        if (!scriptPath.startsWith(global.path.sep)) {
            scriptPath = (0, util_1.kenvPath)(scriptPath);
        }
        if (!scriptPath.endsWith(".js"))
            scriptPath = scriptPath + ".js";
        // console.log({ scriptPath, args, argOpts, runArgs })
        let scriptArgs = [
            ...global.args,
            ...runArgs,
            ...global.argOpts,
        ].filter(arg => {
            if (typeof arg === "string")
                return arg.length > 0;
            return arg;
        });
        let child = fork(scriptPath, scriptArgs, {
            stdio: "inherit",
            execArgv: [
                "--require",
                "dotenv/config",
                "--require",
                (0, util_1.kitPath)("preload/api.js"),
                "--require",
                (0, util_1.kitPath)("preload/kit.js"),
                "--require",
                (0, util_1.kitPath)("preload/mac.js"),
            ],
            //Manually set node. Shouldn't have to worry about PATH
            execPath: (0, util_1.kitPath)("node", "bin", "node"),
            env: {
                ...global.env,
                KIT_PARENT_NAME: global.env.KIT_PARENT_NAME ||
                    global.env.KIT_SCRIPT_NAME,
                KIT_ARGS: global.env.KIT_ARGS || scriptArgs.join("."),
            },
        });
        let name = process.argv[2].replace((0, util_1.kenvPath)() + global.path.sep, "");
        let childName = scriptPath.replace((0, util_1.kenvPath)() + global.path.sep, "");
        console.log(childName, child.pid);
        let forwardToChild = message => {
            console.log(name, "->", childName);
            child.send(message);
        };
        process.on("message", forwardToChild);
        child.on("message", (message) => {
            console.log(name, "<-", childName);
            global.send(message);
            values.push(message);
        });
        child.on("error", error => {
            console.warn(error);
            values.push(error);
            rej(values);
        });
        child.on("close", code => {
            process.off("message", forwardToChild);
            res(values);
        });
    });
};
process.on("uncaughtException", async (err) => {
    await (0, exports.errorPrompt)(err);
});
global.send = async (channel, data) => {
    if (process?.send) {
        process.send({
            pid: process.pid,
            kitScript: global.kitScript,
            channel,
            ...data,
        });
    }
    else {
        // console.log(from, ...args)
    }
};
if (process?.send) {
    let _consoleLog = console.log.bind(console);
    let _consoleWarn = console.warn.bind(console);
    let _consoleClear = console.clear.bind(console);
    console.log = (...args) => {
        let log = args
            .map(a => typeof a != "string" ? JSON.stringify(a) : a)
            .join(" ");
        global.send(enum_1.Channel.CONSOLE_LOG, {
            log,
        });
    };
    console.warn = (...args) => {
        let warn = args
            .map(a => typeof a != "string" ? JSON.stringify(a) : a)
            .join(" ");
        global.send(enum_1.Channel.CONSOLE_WARN, {
            warn,
        });
    };
    console.clear = () => {
        global.send(enum_1.Channel.CONSOLE_CLEAR, {});
    };
}
global.show = (html, options) => {
    global.send(enum_1.Channel.SHOW, { options, html });
};
global.showImage = (image, options) => {
    global.send(enum_1.Channel.SHOW_IMAGE, {
        options,
        image: typeof image === "string" ? { src: image } : image,
    });
};
global.setPlaceholder = text => {
    global.send(enum_1.Channel.SET_PLACEHOLDER, {
        text: (0, strip_ansi_1.default)(text),
    });
};
global.run = async (command, ..._args) => {
    let [scriptToRun, ...scriptArgs] = command.split(" ");
    let resolvedScript = (0, util_1.resolveToScriptPath)(scriptToRun);
    global.onTabs = [];
    global.kitScript = resolvedScript;
    let script = await (0, util_1.info)(global.kitScript);
    global.send(enum_1.Channel.SET_SCRIPT, {
        script,
    });
    return global.attemptImport(resolvedScript, ...scriptArgs, ..._args);
};
global.main = async (scriptPath, ..._args) => {
    let kitScriptPath = (0, util_1.kitPath)("main", scriptPath) + ".js";
    return await global.attemptImport(kitScriptPath, ..._args);
};
global.lib = async (lib, ..._args) => {
    let libScriptPath = (0, util_1.kenvPath)("lib", lib) + ".js";
    return await global.attemptImport(libScriptPath, ..._args);
};
global.cli = async (cliPath, ..._args) => {
    let cliScriptPath = (0, util_1.kitPath)("cli/" + cliPath) + ".js";
    return await global.attemptImport(cliScriptPath, ..._args);
};
global.setup = async (setupPath, ..._args) => {
    global.setPlaceholder(`>_ setup: ${setupPath}...`);
    let setupScriptPath = (0, util_1.kitPath)("setup/" + setupPath) + ".js";
    return await global.attemptImport(setupScriptPath, ..._args);
};
global.tmp = (...parts) => {
    let command = (0, util_1.resolveScriptToCommand)(global.kitScript);
    let scriptTmpDir = (0, util_1.kenvPath)("tmp", command, ...parts);
    mkdir("-p", path.dirname(scriptTmpDir));
    return scriptTmpDir;
};
global.inspect = async (data, extension) => {
    let dashedDate = () => new Date()
        .toISOString()
        .replace("T", "-")
        .replace(/:/g, "-")
        .split(".")[0];
    let formattedData = data;
    let tmpFullPath = "";
    if (typeof data === "object") {
        formattedData = JSON.stringify(data, null, "\t");
    }
    if (extension) {
        tmpFullPath = global.tmp(`${dashedDate()}.${extension}`);
    }
    else if (typeof data === "object") {
        tmpFullPath = global.tmp(`${dashedDate()}.json`);
    }
    else {
        tmpFullPath = global.tmp(`${dashedDate()}.txt`);
    }
    await writeFile(tmpFullPath, formattedData);
    await global.edit(tmpFullPath);
};
global.compileTemplate = async (template, vars) => {
    let templateContent = await readFile((0, util_1.kenvPath)("templates", template), "utf8");
    let templateCompiler = compile(templateContent);
    return templateCompiler(vars);
};
global.currentOnTab = null;
global.onTabs = [];
global.onTabIndex = 0;
global.onTab = (name, fn) => {
    global.onTabs.push({ name, fn });
    if (global.flag?.tab) {
        if (global.flag?.tab === name) {
            let tabIndex = global.onTabs.length - 1;
            global.onTabIndex = tabIndex;
            global.send(enum_1.Channel.SET_TAB_INDEX, {
                tabIndex,
            });
            global.currentOnTab = fn();
        }
    }
    else if (global.onTabs.length === 1) {
        global.onTabIndex = 0;
        global.send(enum_1.Channel.SET_TAB_INDEX, { tabIndex: 0 });
        global.currentOnTab = fn();
    }
};
global.kitPrevChoices = [];
global.setChoices = async (choices, className = "") => {
    if (typeof choices === "object") {
        choices = choices.map(choice => {
            if (typeof choice === "string") {
                return {
                    name: choice,
                    value: choice,
                    className,
                    id: global.uuid(),
                };
            }
            if (typeof choice === "object") {
                if (!choice?.id) {
                    choice.id = global.uuid();
                }
                if (typeof choice.value === "undefined") {
                    return {
                        className,
                        ...choice,
                        value: choice,
                    };
                }
            }
            return choice;
        });
    }
    global.send(enum_1.Channel.SET_CHOICES, {
        choices,
        scripts: true,
    });
    global.kitPrevChoices = choices;
};
let dirs = ["cli", "main"];
let kitGet = (_target, key, _receiver) => {
    if (global[key] && !dirs.includes(key)) {
        return global[key];
    }
    try {
        return new Proxy({}, {
            get: async (_target, module, _receiver) => {
                let modulePath = `../${key}/${module}.js?${global.uuid()}`;
                return await Promise.resolve().then(() => __importStar(require(modulePath)));
            },
        });
    }
    catch (error) {
        console.warn(error);
    }
};
async function kit(command) {
    let [script, ...args] = command.split(" ");
    let file = `${script}.js`;
    let scriptsFilePath = (0, util_1.kitPath)("scripts", file);
    let kenvScriptPath = (0, util_1.kenvPath)("scripts", file);
    if (test("-f", kenvScriptPath)) {
        cp(kenvScriptPath, scriptsFilePath);
    }
    return (await run(scriptsFilePath, ...args)).default;
}
global.kit = new Proxy(kit, {
    get: kitGet,
});
global.flag = {};
global.setFlags = (flags) => {
    let validFlags = {};
    for (let [key, value] of Object.entries(flags)) {
        validFlags[key] = {
            name: value?.name || key,
            shortcut: value?.shortcut || "",
            description: value?.description || "",
            value: key,
        };
    }
    send(enum_1.Channel.SET_FLAGS, { flags: validFlags });
};
global.hide = () => {
    send(enum_1.Channel.HIDE_APP);
};
