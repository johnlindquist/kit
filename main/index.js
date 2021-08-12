// Menu: Main
// Description: Script Kit
// Placeholder: Run script
// UI: arg
global.onTabs = [];
onTab("Run", async () => {
    await cli("app-run");
});
onTab("New", async () => {
    await main("new");
});
onTab("Kit", async () => {
    await main("kit");
});
onTab("Help", async () => {
    await main("help");
});
onTab("Hot 🔥", async () => {
    await main("hot");
});
export {};
