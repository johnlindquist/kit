"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enum_1 = require("@core/enum");
const db_1 = require("@core/db");
const utils_js_1 = require("../utils.js");
await trash([
    `!${kenvPath("bin", ".gitignore")}`,
    kenvPath("bin", "*"),
]);
let scripts = await (0, db_1.getScripts)(false);
for await (let script of scripts) {
    await (0, utils_js_1.createBinFromScript)(enum_1.Bin.scripts, script);
}
