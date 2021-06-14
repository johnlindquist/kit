import { Channel, ProcessType } from "./enums.js";
export let assignPropsTo = (source, target) => {
    Object.entries(source).forEach(([key, value]) => {
        target[key] = value;
    });
};
export let resolveToScriptPath = (script) => {
    if (!script.endsWith(".js"))
        script += ".js";
    if (script.startsWith("."))
        script = path.resolve(process.cwd(), script);
    if (!script.includes(path.sep))
        return global.kenvPath("scripts", script);
    if (!script.includes(kenvPath()) &&
        !script.includes(kitPath())) {
        global.cp(script, kitPath("tmp"));
        let tmpScript = kitPath("tmp", script.replace(/.*\//gi, ""));
        return tmpScript;
    }
    return script;
};
export let resolveScriptToCommand = (script) => {
    return script.replace(/.*\//, "").replace(".js", "");
};
export let exists = async (input) => (await isBin(kenvPath("bin", input)))
    ? chalk `{red.bold ${input}} already exists. Try again:`
    : (await isDir(kenvPath("bin", input)))
        ? chalk `{red.bold ${input}} exists as group. Enter different name:`
        : exec(`command -v ${input}`, {
            silent: true,
        }).stdout
            ? chalk `{red.bold ${input}} is a system command. Enter different name:`
            : !input.match(/^([a-z]|[0-9]|\-|\/)+$/g)
                ? chalk `{red.bold ${input}} can only include lowercase, numbers, and -. Enter different name:`
                : true;
export let findScript = async (input) => {
    return (await cli("find-script", input)).found;
};
export let getScripts = async () => {
    let scriptsPath = kenvPath("scripts");
    if (arg.dir)
        scriptsPath = `${scriptsPath}/${arg.dir}`;
    let result = await readdir(scriptsPath, {
        withFileTypes: true,
    });
    return result
        .filter(file => file.isFile())
        .map(file => {
        let name = file.name;
        if (arg.dir)
            name = `${arg.dir}/${name}`;
        return name;
    })
        .filter(name => name.endsWith(".js"));
};
export let buildMainPromptChoices = async (fromCache = true) => {
    return (await db("scripts", async () => ({
        scripts: await writeScriptsDb(),
    }), fromCache)).scripts;
};
export let scriptValue = (pluck, fromCache) => async () => {
    let menuItems = await buildMainPromptChoices(fromCache);
    return menuItems.map((script) => ({
        ...script,
        value: script[pluck],
    }));
};
export let toggleBackground = async (script) => {
    let { tasks } = await global.getBackgroundTasks();
    let task = tasks.find(task => task.filePath === script.filePath);
    let toggleOrLog = await arg(`${script.command} is ${task ? `running` : `stopped`}`, [
        {
            name: `${task ? `Stop` : `Start`} ${script.command}`,
            value: `toggle`,
        },
        { name: `Edit ${script.command}`, value: `edit` },
        { name: `View ${script.command}.log`, value: `log` },
    ]);
    if (toggleOrLog === "toggle") {
        send(Channel.TOGGLE_BACKGROUND, {
            filePath: script.filePath,
        });
    }
    if (toggleOrLog === "edit") {
        await edit(script.filePath, kenvPath());
    }
    if (toggleOrLog === "log") {
        await edit(kenvPath("logs", `${script.command}.log`), kenvPath());
    }
};
export let scriptPathFromCommand = (command) => kenvPath("scripts", `${command}.js`);
export const shortcutNormalizer = (shortcut) => shortcut
    ? shortcut
        .replace(/(option|opt)/i, "Alt")
        .replace(/(command|cmd)/i, "CommandOrControl")
        .replace(/(ctl|cntrl|ctrl)/, "Control")
        .split(/\s/)
        .filter(Boolean)
        .map(part => (part[0].toUpperCase() + part.slice(1)).trim())
        .join("+")
    : "";
export let info = async (infoFor) => {
    let file = infoFor || (await arg("Get info for:"));
    !file.endsWith(".js") && (file = `${file}.js`); //Append .js if you only give script name
    let filePath = file.startsWith("/scripts")
        ? kenvPath(file)
        : file.startsWith(path.sep)
            ? file
            : kenvPath(!file.includes("/") && "scripts", file);
    let fileContents = await readFile(filePath, "utf8");
    let getByMarker = (marker) => fileContents
        .match(new RegExp(`(?<=^//\\s*${marker}\\s*).*`, "gim"))?.[0]
        .trim();
    let command = filePath
        .split(path.sep)
        ?.pop()
        ?.replace(".js", "");
    let shortcut = shortcutNormalizer(getByMarker("Shortcut:"));
    let menu = getByMarker("Menu:");
    let placeholder = getByMarker("Placeholder:") || menu;
    let schedule = getByMarker("Schedule:");
    let watch = getByMarker("Watch:");
    let system = getByMarker("System:");
    let background = getByMarker("Background:");
    let input = getByMarker("Input:") || "text";
    let timeout = parseInt(getByMarker("Timeout:"), 10);
    let tabs = fileContents.match(new RegExp(`(?<=onTab[(]['"]).*(?=\s*['"])`, "gim")) || [];
    let ui = (getByMarker("UI:") ||
        fileContents
            .match(/(?<=await )arg|textarea|hotkey|drop/g)?.[0]
            .trim() ||
        "none");
    let requiresPrompt = Boolean(ui);
    let type = schedule
        ? ProcessType.Schedule
        : watch
            ? ProcessType.Watch
            : system
                ? ProcessType.System
                : background
                    ? ProcessType.Background
                    : ProcessType.Prompt;
    return {
        command,
        type,
        shortcut,
        menu,
        name: (menu || command) + (shortcut ? `: ${shortcut}` : ``),
        placeholder,
        description: getByMarker("Description:"),
        alias: getByMarker("Alias:"),
        author: getByMarker("Author:"),
        twitter: getByMarker("Twitter:"),
        shortcode: getByMarker("Shortcode:"),
        exclude: getByMarker("Exclude:"),
        schedule,
        watch,
        system,
        background,
        file,
        id: filePath,
        filePath,
        requiresPrompt,
        timeout,
        tabs,
        input,
        ui,
    };
};
export let writeScriptsDb = async () => {
    let scriptFiles = await getScripts();
    let scriptInfo = await Promise.all(scriptFiles.map(info));
    return scriptInfo
        .filter((script) => !(script?.exclude && script?.exclude === "true"))
        .sort((a, b) => {
        let aName = a.name.toLowerCase();
        let bName = b.name.toLowerCase();
        return aName > bName ? 1 : aName < bName ? -1 : 0;
    });
};
export let getPrefs = async () => {
    return await db(kitPath("db", "prefs.json"));
};
