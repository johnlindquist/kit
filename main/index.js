// Menu: Main
let { getPrefs } = await import("../utils.js");
// Description: Script Kit
global.onTabs = [];
onTab("Run", async () => {
    await cli("app-run");
});
onTab("Edit", async () => {
    await main("edit");
});
onTab("New", async () => {
    await main("new");
});
onTab("Share", async () => {
    await cli("share");
});
onTab("Hot 🔥", async () => {
    await main("hot");
});
onTab("Help", async () => {
    await main("help");
});
let { join } = await getPrefs();
if (join !== "false") {
    onTab("Join", async () => {
        await cli("join");
    });
}
export {};
