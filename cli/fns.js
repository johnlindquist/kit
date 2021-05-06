export let exists = async (input) => {
    let check = (await cli("exists", input)).exists;
    return check;
};
export let info = async (input) => await cli("info", input);
export let findScript = async (input) => {
    return (await cli("find-script", input)).found;
};
export let scripts = async () => (await cli("scripts")).scripts;
export let buildMenu = async (fromCache = true) => {
    let menuCachePath = kenvPath("cache", "menu-cache.json");
    if (fromCache && (await isFile(menuCachePath))) {
        return getScripts();
    }
    return await (await cli("menu")).menu;
};
export let enhancedMenu = async (fromCache = true) => {
    console.log(`ENHANCED MENU`);
    let { formatDistanceToNowStrict, format } = await npm("date-fns");
    let menuItems = await buildMenu(fromCache);
    let { tasks, schedule } = await global.getScriptsState();
    return menuItems.map(script => {
        if (script.background) {
            let task = tasks.find(task => task.filePath === script.filePath);
            script.description = `${script.description || ""}${task
                ? `🟢  Uptime: ${formatDistanceToNowStrict(new Date(task.process.start))} PID: ${task.process.pid}`
                : "🛑 isn't running"}`;
        }
        if (script.schedule) {
            let s = schedule.find(s => s.filePath === script.filePath);
            if (s) {
                let date = new Date(s.date);
                let next = `Next ${formatDistanceToNowStrict(date)}`;
                let cal = `${format(date, "MMM eo, h:mm:ssa ")}`;
                script.description = `${script.description || ``} ${next} - ${cal} - ${script.schedule}`;
            }
        }
        if (script.watch) {
            script.description = `${script.description || ``} Watching: ${script.watch}`;
        }
        return script;
    });
};
export let menu = async (fromCache = true) => {
    return process?.send
        ? enhancedMenu(fromCache)
        : buildMenu(fromCache);
};
export let scriptValue = (pluck, fromCache) => async () => {
    let menuItems = await menu(fromCache);
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
        send("TOGGLE_BACKGROUND", { filePath: script.filePath });
    }
    if (toggleOrLog === "edit") {
        await edit(script.filePath, kenvPath());
    }
    if (toggleOrLog === "log") {
        await edit(kenvPath("logs", `${script.command}.log`), kenvPath());
    }
};
