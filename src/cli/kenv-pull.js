"use strict";
// Description: Git Pull Kenv Repo
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("@core/util");
let dir = await arg("Update which kenv", (await (0, util_1.getKenvs)()).map(value => ({
    name: (0, util_1.getLastSlashSeparated)(value, 1),
    value,
})));
await $ `cd ${dir} && git stash && git pull`;
await getScripts(false);
