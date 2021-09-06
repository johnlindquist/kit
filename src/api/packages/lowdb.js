"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("@core/db");
const util_1 = require("@core/util");
global.db = async (key, defaults, fromCache = true) => {
    if (typeof defaults === "undefined" &&
        typeof key !== "string") {
        defaults = key;
        key = "_" + (0, util_1.resolveScriptToCommand)(global.kitScript);
    }
    return await (0, db_1.db)(key, defaults, fromCache);
};
