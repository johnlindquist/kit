import { Channel } from "kit-bridge/esm/enum";
import { kitPath, kenvPath, info, resolveScriptToCommand, resolveToScriptPath, } from "kit-bridge/esm/util";
import stripAnsi from "strip-ansi";
import tree from "tree-cli";
export let errorPrompt = async (error) => {
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
        let child = spawnSync(kitPath("bin", "sk"), [
            kitPath("cli", "error-action.js"),
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
global.attemptImport = async (path, ..._args) => {
    try {
        global.updateArgs(_args);
        //import caches loaded scripts, so we cache-bust with a uuid in case we want to load a script twice
        //must use `import` for ESM
        return await import(path + "?uuid=" + global.uuid());
    }
    catch (error) {
        console.warn(error.message);
        console.warn(error.stack);
        await errorPrompt(error);
    }
};
global.runSub = async (scriptPath, ...runArgs) => {
    return new Promise(async (res, rej) => {
        let values = [];
        if (!scriptPath.includes("/")) {
            scriptPath = kenvPath("scripts", scriptPath);
        }
        if (!scriptPath.startsWith(global.path.sep)) {
            scriptPath = kenvPath(scriptPath);
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
                kitPath("preload/api.js"),
                "--require",
                kitPath("preload/kit.js"),
                "--require",
                kitPath("preload/mac.js"),
            ],
            //Manually set node. Shouldn't have to worry about PATH
            execPath: kitPath("node", "bin", "node"),
            env: {
                ...global.env,
                KIT_PARENT_NAME: global.env.KIT_PARENT_NAME ||
                    global.env.KIT_SCRIPT_NAME,
                KIT_ARGS: global.env.KIT_ARGS || scriptArgs.join("."),
            },
        });
        let name = process.argv[2].replace(kenvPath() + global.path.sep, "");
        let childName = scriptPath.replace(kenvPath() + global.path.sep, "");
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
    await errorPrompt(err);
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
        global.send(Channel.CONSOLE_LOG, {
            log,
        });
    };
    console.warn = (...args) => {
        let warn = args
            .map(a => typeof a != "string" ? JSON.stringify(a) : a)
            .join(" ");
        global.send(Channel.CONSOLE_WARN, {
            warn,
        });
    };
    console.clear = () => {
        global.send(Channel.CONSOLE_CLEAR, {});
    };
}
global.show = (html, options) => {
    global.send(Channel.SHOW, { options, html });
};
global.showImage = (image, options) => {
    global.send(Channel.SHOW_IMAGE, {
        options,
        image: typeof image === "string" ? { src: image } : image,
    });
};
global.setPlaceholder = text => {
    global.send(Channel.SET_PLACEHOLDER, {
        text: stripAnsi(text),
    });
};
global.run = async (command, ..._args) => {
    let [scriptToRun, ...scriptArgs] = command.split(" ");
    let resolvedScript = resolveToScriptPath(scriptToRun);
    global.onTabs = [];
    global.kitScript = resolvedScript;
    let script = await info(global.kitScript);
    global.send(Channel.SET_SCRIPT, {
        script,
    });
    return global.attemptImport(resolvedScript, ...scriptArgs, ..._args);
};
global.main = async (scriptPath, ..._args) => {
    let kitScriptPath = kitPath("main", scriptPath) + ".js";
    return await global.attemptImport(kitScriptPath, ..._args);
};
global.lib = async (lib, ..._args) => {
    let libScriptPath = kenvPath("lib", lib) + ".js";
    return await global.attemptImport(libScriptPath, ..._args);
};
global.cli = async (cliPath, ..._args) => {
    let cliScriptPath = kitPath("cli/" + cliPath) + ".js";
    return await global.attemptImport(cliScriptPath, ..._args);
};
global.setup = async (setupPath, ..._args) => {
    global.setPlaceholder(`>_ setup: ${setupPath}...`);
    let setupScriptPath = kitPath("setup/" + setupPath) + ".js";
    return await global.attemptImport(setupScriptPath, ..._args);
};
global.tmp = (...parts) => {
    let command = resolveScriptToCommand(global.kitScript);
    let scriptTmpDir = kenvPath("tmp", command, ...parts);
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
    let templateContent = await readFile(kenvPath("templates", template), "utf8");
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
            global.send(Channel.SET_TAB_INDEX, {
                tabIndex,
            });
            global.currentOnTab = fn();
        }
    }
    else if (global.onTabs.length === 1) {
        global.onTabIndex = 0;
        global.send(Channel.SET_TAB_INDEX, { tabIndex: 0 });
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
    global.send(Channel.SET_CHOICES, {
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
                return await import(modulePath);
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
    console.log(_.upperCase(`Tree Kit`));
    let t = await tree({ base: kitPath(), l: 2 });
    console.log(t?.report);
    return t?.report;
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
    send(Channel.SET_FLAGS, { flags: validFlags });
};
global.hide = () => {
    send(Channel.HIDE_APP);
};
