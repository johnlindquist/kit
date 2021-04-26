// Menu: Main
// Description: Script Kit
let { menu } = await cli("fns");
global.onTabs = [];
onTab("Run", async () => {
    await cli("run");
});
onTab("Edit", async () => {
    await main("edit");
});
onTab("New", async () => {
    await main("new");
});
onTab("Share", async () => {
    await main("share");
});
if ((await menu()).some(script => script?.schedule)) {
    onTab("Cron", async () => {
        await cli("schedule");
    });
}
onTab("Hot 🔥", async () => {
    await main("hot");
});
onTab("Help", async () => {
    await main("help");
});
let join = db("kit").get("join").value();
if (join !== "false") {
    onTab("Join", async () => {
        await cli("join");
    });
}
export {};
