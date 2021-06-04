// Menu: Main
let { getPrefs, getScripts } = await import("../utils.js");
// Description: Script Kit
global.onTabs = [];
let { showJoin } = await getPrefs();
let scripts = await getScripts();
if (scripts.length) {
    onTab("Run", async () => {
        await cli("app-run");
    });
    onTab("Edit", async () => {
        await main("edit");
    });
}
onTab("New", async () => {
    await main("new");
});
if (scripts.length) {
    onTab("Share", async () => {
        await cli("share");
    });
}
onTab("Hot 🔥", async () => {
    await main("hot");
});
onTab("Help", async () => {
    await main("help");
});
if (showJoin !== "false") {
    onTab("Join", async () => {
        await cli("join");
    });
}
export {};
