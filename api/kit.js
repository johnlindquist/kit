//cjs is required to load/assign the content of this script synchronously
//we may be able to convert this to .js if an "--import" flag is added
//https://github.com/nodejs/node/issues/35103
import { resolveScriptToCommand, resolveToScriptPath, } from "../utils.js";
global.attemptImport = async (path, ..._args) => {
    try {
        global.updateArgs(_args);
        //import caches loaded scripts, so we cache-bust with a uuid in case we want to load a script twice
        //must use `import` for ESM
        return await import(path + "?uuid=" + global.uuid());
    }
    catch (error) {
        console.warn(error);
        try {
            let stackWithoutId = error.stack.replace(/\?[^:]*/, "");
            // console.warn(stackWithoutId)
            let errorFile = global.kitScript;
            let line = 0;
            let col = 0;
            let secondLine = stackWithoutId.split("\n")[1];
            if (secondLine.match("at file://")) {
                errorFile = secondLine
                    .replace("at file://", "")
                    .replace(/:.*/, "")
                    .trim();
                [, line, col] = secondLine
                    .replace("at file://", "")
                    .split(":");
            }
            console.log({ errorFile, line, col });
            global.edit(errorFile, global.kenvPath(), line, col);
        }
        catch { }
        if (env.KIT_CONTEXT === "app") {
            await arg(`🤕 Error in ${global.kitScript.replace(/.*\//, "")}`, error.stack);
        }
    }
};
global.runSub = async (scriptPath, ...runArgs) => {
    return new Promise(async (res, rej) => {
        let values = [];
        if (!scriptPath.includes("/")) {
            scriptPath = global.kenvPath("scripts", scriptPath);
        }
        if (!scriptPath.startsWith(global.path.sep)) {
            scriptPath = global.kenvPath(scriptPath);
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
                global.kitPath("preload/api.js"),
                "--require",
                global.kitPath("preload/kit.js"),
                "--require",
                global.kitPath("preload/mac.js"),
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
        let name = process.argv[2].replace(global.kenvPath() + global.path.sep, "");
        let childName = scriptPath.replace(global.kenvPath() + global.path.sep, "");
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
    console.warn(`UNCAUGHT EXCEPTION: ${err}`);
    process.exit();
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
    console.log = async (...args) => {
        global.send("CONSOLE_LOG", {
            log: args
                .map(a => typeof a != "string" ? JSON.stringify(a) : a)
                .join(" "),
        });
    };
    console.warn = async (...args) => {
        global.send("CONSOLE_WARN", {
            warn: args
                .map(a => typeof a != "string" ? JSON.stringify(a) : a)
                .join(" "),
        });
    };
}
global.show = (html, options) => {
    global.send("SHOW", { options, html });
};
global.showImage = (image, options) => {
    global.send("SHOW_IMAGE", {
        options,
        image: typeof image === "string" ? { src: image } : image,
    });
};
global.setPlaceholder = text => {
    global.send("SET_PLACEHOLDER", {
        text,
    });
};
global.run = async (script, ..._args) => {
    let resolvedScript = resolveToScriptPath(script);
    global.onTabs = [];
    global.kitScript = resolvedScript;
    global.send("RUN_SCRIPT", {
        name: resolvedScript,
        args: _args,
    });
    return global.attemptImport(resolvedScript, ..._args);
};
global.main = async (scriptPath, ..._args) => {
    let kitScriptPath = global.kitPath("main", scriptPath) + ".js";
    return await global.attemptImport(kitScriptPath, ..._args);
};
global.lib = async (scriptPath, ..._args) => {
    let libScriptPath = global.libPath(scriptPath) + ".js";
    return await global.attemptImport(libScriptPath, ..._args);
};
global.cli = async (cliPath, ..._args) => {
    let cliScriptPath = global.kitPath("cli/" + cliPath) + ".js";
    return await global.attemptImport(cliScriptPath, ..._args);
};
global.setup = async (setupPath, ..._args) => {
    global.setPlaceholder(`>_ setup: ${setupPath}...`);
    let setupScriptPath = global.kitPath("setup/" + setupPath) + ".js";
    return await global.attemptImport(setupScriptPath, ..._args);
};
global.tmp = (...parts) => {
    let command = resolveScriptToCommand(global.kitScript);
    let scriptTmpDir = global.kenvPath("tmp", command, ...parts);
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
    let templateContent = await readFile(global.kenvPath("templates", template), "utf8");
    let templateCompiler = compile(templateContent);
    return templateCompiler(vars);
};
global.currentOnTab = null;
global.onTabs = [];
global.onTabIndex = 0;
global.onTab = async (name, fn) => {
    global.onTabs.push({ name, fn });
    if (global.arg.tab) {
        if (global.arg.tab === name) {
            let tabIndex = global.onTabs.length - 1;
            global.onTabIndex = tabIndex;
            global.send("SET_TAB_INDEX", {
                tabIndex,
            });
            global.currentOnTab = await fn();
        }
    }
    else if (global.onTabs.length === 1) {
        global.onTabIndex = 0;
        global.send("SET_TAB_INDEX", { tabIndex: 0 });
        global.currentOnTab = await fn();
    }
};
global.kitPrevChoices = [];
global.setChoices = async (choices) => {
    if (typeof choices === "object") {
        choices = choices.map(choice => {
            if (typeof choice === "string") {
                return {
                    name: choice,
                    value: choice,
                    id: global.uuid(),
                };
            }
            if (typeof choice === "object") {
                if (!choice?.id) {
                    choice.id = global.uuid();
                }
            }
            return choice;
        });
    }
    global.send("SET_CHOICES", { choices });
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
let kitFn = async (_target, _obj, [scriptPath, ..._args]) => {
    let kitScriptPath = global.kitPath("lib", scriptPath) + ".js";
    return await global.attemptImport(kitScriptPath, ..._args);
};
global.kit = new Proxy(() => { }, {
    get: kitGet,
    apply: kitFn,
});
