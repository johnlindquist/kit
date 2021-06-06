// Menu: Main
// Description: Script Kit
// Placeholder: Which script do you want to run?
let { getPrefs, getScripts } = await import("../utils.js");
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
onTab("Kenv", async () => {
    await main("kenv");
});
onTab("Kit", async () => {
    await main("kit");
});
if (showJoin !== "false") {
    onTab("Join", async () => {
        await cli("join");
    });
}
export {};
