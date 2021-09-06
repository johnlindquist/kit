"use strict";
// Description: Git Push Kenv Repo
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("@core/util");
let dir = await arg("Push which kenv", (await (0, util_1.getKenvs)()).map(value => ({
    name: (0, util_1.getLastSlashSeparated)(value, 1),
    value,
})));
await $ `cd ${dir} && git add . && git commit -m "pushed from Script Kit" && git push`;
await getScripts(false);
