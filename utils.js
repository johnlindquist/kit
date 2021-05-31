import { Channel } from "./enums.js";
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
export let exists = async (input) => {
    let check = (await cli("exists", input)).exists;
    return check;
};
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
let getByMarker = (marker) => (lines) => lines
    ?.find(line => line.match(new RegExp(`^\/\/\\s*${marker}\\s*`, "gim")))
    ?.split(marker)[1]
    ?.trim();
export let info = async (infoFor) => {
    let file = infoFor || (await arg("Get info for:"));
    !file.endsWith(".js") && (file = `${file}.js`); //Append .js if you only give script name
    let filePath = file.startsWith("/scripts")
        ? kenvPath(file)
        : file.startsWith(path.sep)
            ? file
            : kenvPath(!file.includes("/") && "scripts", file);
    let fileContents = await readFile(filePath, "utf8");
    let fileLines = fileContents.split("\n");
    let command = file.replace(".js", "");
    let shortcut = getByMarker("Shortcut:")(fileLines);
    let menu = getByMarker("Menu:")(fileLines);
    return {
        command,
        shortcut,
        menu,
        name: (menu || command) + (shortcut ? `: ${shortcut}` : ``),
        description: getByMarker("Description:")(fileLines),
        alias: getByMarker("Alias:")(fileLines),
        author: getByMarker("Author:")(fileLines),
        twitter: getByMarker("Twitter:")(fileLines),
        shortcode: getByMarker("Shortcode:")(fileLines),
        exclude: getByMarker("Exclude:")(fileLines),
        schedule: getByMarker("Schedule:")(fileLines),
        watch: getByMarker("Watch:")(fileLines),
        system: getByMarker("System:")(fileLines),
        background: getByMarker("Background:")(fileLines),
        file,
        id: filePath,
        filePath,
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
