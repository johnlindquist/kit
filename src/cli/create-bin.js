"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enum_1 = require("@core/enum");
const utils_js_1 = require("../utils.js");
let type = await arg("Select type:", Object.values(enum_1.Bin));
let script = await (0, utils_js_1.selectScript)(`Create bin from which script?`, false);
await (0, utils_js_1.createBinFromScript)(type, script);
