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
onTab("Hot 🔥", async () => {
    await main("hot");
});
onTab("Help", async () => {
    await main("help");
});
onTab("Kit", async () => {
    await main("kit");
});
export {};
