"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("@core/db");
let scriptsCache = await (0, db_1.getScripts)();
let filePath = await arg("Which script do you want to edit?", scriptsCache
    .filter(script => script?.system)
    .map(script => {
    return {
        name: script?.menu || script.command,
        description: `Runs on ${script.system}`,
        value: script.filePath,
    };
}));
edit(filePath, kenvPath());
