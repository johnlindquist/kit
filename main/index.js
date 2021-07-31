// Menu: Main
// Description: Script Kit
// Placeholder: Which script do you want to run?
// UI: arg
global.onTabs = [];
onTab("Run", async () => {
    await cli("app-run");
});
// onTab("Edit", async () => {
//   await main("edit")
// })
onTab("New", async () => {
    await main("new");
});
// onTab("Share", async () => {
//   await cli("share")
// })
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
