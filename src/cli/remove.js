"use strict";
// Description: Remove a script
Object.defineProperty(exports, "__esModule", { value: true });
const utils_js_1 = require("../utils.js");
let command, filePath;
let hint = command
    ? `Removed ${command}. Remove another?`
    : ``;
({ command, filePath } = await (0, utils_js_1.selectScript)({
    placeholder: `Remove a script:`,
    hint,
}));
let confirm = global?.flag?.confirm ||
    (await arg({
        placeholder: `Remove ${command}?`,
        hint: filePath,
    }, [
        { name: "No, cancel.", value: false },
        { name: `Yes, remove ${command}`, value: true },
    ]));
if (confirm) {
    await trash([filePath, kenvPath("bin", command)]);
    await cli("refresh-scripts-db");
}
