export let assignPropsTo = (source, target) => {
    Object.entries(source).forEach(([key, value]) => {
        target[key] = value;
    });
};
export let resolveToScriptPath = script => {
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
export let resolveScriptToCommand = script => {
    return script.replace(/.*\//, "").replace(".js", "");
};
