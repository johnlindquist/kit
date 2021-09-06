"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_js_1 = require("../utils.js");
let { filePath, command } = await (0, utils_js_1.selectScript)(`Open database for which script?`);
edit(path.resolve(filePath, "..", "..", "db", `_${command}.json`));
