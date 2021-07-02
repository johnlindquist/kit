// Description: Run the selected script
let { toggleBackground, selectScript } = await import("../utils.js");
let script = await selectScript(`Which script do you want to run?`);
let shouldEdit = script.watch || script.schedule || script.system;
if (script.background) {
    toggleBackground(script);
}
else if (shouldEdit) {
    await edit(script.filePath, kenvPath());
}
else {
    await run(script.filePath);
}
export {};
