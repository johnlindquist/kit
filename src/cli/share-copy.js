"use strict";
//Menu: Copy Script to Clipboard
//Description: Copies Script to Clipboard
Object.defineProperty(exports, "__esModule", { value: true });
const utils_js_1 = require("../utils.js");
let { filePath, command } = await (0, utils_js_1.selectScript)(`Share which script?`);
copy(await readFile(filePath, "utf8"));
console.log(`Copied content of "${command}.js" to clipboard`);
await wait(2000);
