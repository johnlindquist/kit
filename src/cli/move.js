"use strict";
// Description: Move script to different kenv
Object.defineProperty(exports, "__esModule", { value: true });
const utils_js_1 = require("../utils.js");
const enum_1 = require("@core/enum");
let script = await (0, utils_js_1.selectScript)();
let kenvDirs = (await readdir(kenvPath("kenvs"))) || [];
let selectedKenvDir = kenvPath();
selectedKenvDir = await arg({
    placeholder: `Select target kenv`,
    hint: script.filePath,
}, [
    {
        name: "home",
        description: `Your main kenv: ${kenvPath()}`,
        value: kenvPath(),
    },
    ...kenvDirs.map(kenvDir => {
        let value = kenvPath("kenvs", kenvDir);
        return {
            name: kenvDir,
            description: value,
            value,
        };
    }),
]);
let exists = false;
let target = filePath => path.join(selectedKenvDir, "scripts", path.basename(filePath));
while (true) {
    if (!script) {
        script = await (0, utils_js_1.selectScript)({
            placeholder: exists
                ? `Sorry, ${script.command} already exists. Pick another`
                : `Move another script to kenv?`,
            hint: selectedKenvDir,
        });
    }
    exists = await isFile(target(script.filePath));
    if (!exists) {
        (0, utils_js_1.trashBinFromScript)(script);
        mv(script.filePath, target(script.filePath));
        await getScripts(false);
        (0, utils_js_1.createBinFromScript)(enum_1.Bin.scripts, script);
    }
    script = null;
}
