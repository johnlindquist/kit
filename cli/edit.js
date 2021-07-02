// Description: Opens the selected script in your editor
let { selectScript } = await import("../utils.js");
let script = await selectScript(`Select script to open in ${env.KIT_EDITOR}?`);
edit(await script.filePath, kenvPath());
export {};
