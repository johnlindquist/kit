"use strict";
// Description: Rename Script
Object.defineProperty(exports, "__esModule", { value: true });
const utils_js_1 = require("../utils.js");
let { command, filePath } = await (0, utils_js_1.selectScript)(`Which script do you want to rename?`);
let newCommand = await arg({
    placeholder: `Enter the new script name:`,
    selected: filePath,
    validate: utils_js_1.exists,
});
let lenientCommand = newCommand.replace(/(?<!\.js)$/, ".js");
let newFilePath = path.resolve(path.dirname(filePath), lenientCommand);
mv(filePath, newFilePath);
let oldBin = path.resolve(path.dirname(filePath), "..", "bin", command);
await trash([oldBin]);
await cli("create-bin", "scripts", newFilePath);
edit(newFilePath, kenvPath());
