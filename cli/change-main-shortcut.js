let { shortcut } = await hotkey("Type a key combo");
let confirm = await arg(`Accept: "${shortcut}"`, [
    {
        name: `Yes`,
        value: true,
    },
    {
        name: `Retry`,
        value: false,
    },
]);
if (confirm) {
    let kitDb = db("kit", { shortcuts: { main: "" } });
    kitDb.set("shortcuts.kit.main.index", shortcut).write();
}
else {
    await cli("change-main-shortcut");
}
export {};
