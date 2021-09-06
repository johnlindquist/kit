"use strict";
// Description: Opens the selected script in your editor
Object.defineProperty(exports, "__esModule", { value: true });
const utils_js_1 = require("../utils.js");
let script = await (0, utils_js_1.selectScript)(`Select script to open in ${env.KIT_EDITOR}?`);
edit(await script.filePath, kenvPath());
