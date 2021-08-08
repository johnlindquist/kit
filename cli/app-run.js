// Description: Run the selected script
import { toggleBackground, selectScript } from "../utils.js";
setFlags({
    [""]: {
        name: "Run script",
        shortcut: "enter",
    },
    open: {
        name: "Open script in editor",
        shortcut: "cmd+o",
    },
    ["share-copy"]: {
        name: "Copy script content to clipboard",
        shortcut: "cmd+c",
    },
    duplicate: {
        name: "Duplicate script",
        shortcut: "cmd+d",
    },
    rename: {
        name: "Rename script",
        shortcut: "cmd+r",
    },
    remove: {
        name: "Remove script",
        shortcut: "cmd+delete",
    },
    ["open-script-log"]: {
        name: `Open script log`,
        shortcut: "cmd+l",
    },
    ["share-script"]: {
        name: "Share as Gist",
        shortcut: "cmd+g",
    },
    ["share-script-as-link"]: {
        name: "Share as URL",
        shortcut: "cmd+u",
    },
    ["share-script-as-discussion"]: {
        name: "Prep for discussion",
        shortcut: "cmd+p",
    },
    ["change-shortcut"]: {
        name: "Change shortcut",
    },
});
let script = await selectScript(`Run script`, true, scripts => scripts.filter(script => !script?.exclude));
let shouldEdit = script.watch ||
    script.schedule ||
    script.system ||
    flags?.open;
if (script.background) {
    toggleBackground(script);
}
else if (shouldEdit) {
    await edit(script.filePath, kenvPath());
}
else {
    let flag = Object.keys(flags).find(Boolean);
    if (flag) {
        await cli(flag, script.filePath);
    }
    else {
        await run(script.filePath);
    }
}
