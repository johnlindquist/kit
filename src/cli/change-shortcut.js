"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Description: Change Script Shortcut
const util_1 = require("@core/util");
const utils_js_1 = require("../utils.js");
while (true) {
    let { filePath, command, menu } = await (0, utils_js_1.selectScript)(`Change shortcut of which script?`, true, scripts => scripts
        .sort((a, b) => {
        if (a?.shortcut && !b?.shortcut)
            return -1;
        if (b?.shortcut && !a?.shortcut)
            return 1;
        if (!a?.shortcut && !b?.shortcut)
            return 0;
        return a?.shortcut > b?.shortcut
            ? 1
            : a?.shortcut < b?.shortcut
                ? -1
                : 0;
    })
        .map((script) => {
        return {
            name: (script?.menu || script.command) +
                ` ` +
                (0, util_1.friendlyShortcut)(script?.shortcut),
            description: script?.description,
            value: script,
        };
    }));
    let { shortcut } = await hotkey();
    let fileContents = await readFile(filePath, "utf-8");
    let reg = /(?<=^\/\/\s*Shortcut:\s).*(?=$)/gim;
    if (fileContents.split("\n").some(line => line.match(reg))) {
        let newContents = fileContents.replace(reg, shortcut);
        await writeFile(filePath, newContents);
    }
    else {
        await writeFile(filePath, `//Shortcut: ${shortcut}\n${fileContents}`);
    }
    let message = `${shortcut} assigned to ${menu || command}`;
    console.log(message);
    await wait(1500);
}
