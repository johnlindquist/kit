"use strict";
//Description: An error has occurred
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("@core/util");
const enum_1 = require("@core/enum");
let script = await arg();
let stackFile = await arg();
let errorFile = await arg();
let line = await arg();
let col = await arg();
let stack = await readFile(stackFile, "utf-8");
let errorLog = `${(0, util_1.getLastSlashSeparated)(errorFile, 1).replace(/\.js$/, "")}.log`;
let errorLogPath = kenvPath("logs", errorLog);
let errorActions = {
    [enum_1.ErrorAction.Open]: async () => {
        edit(errorFile, kenvPath(), line, col);
    },
    [enum_1.ErrorAction.KitLog]: async () => {
        edit(kitPath("logs", "kit.log"), kenvPath());
    },
    [enum_1.ErrorAction.Log]: async () => {
        edit(errorLogPath, kenvPath());
    },
    [enum_1.ErrorAction.Ask]: async () => {
        copy(stack);
        exec(`open "https://github.com/johnlindquist/kit/discussions/categories/errors"`);
    },
};
console.log(stack);
let errorAction = await arg({
    placeholder: `🤕 Error in ${script}`,
    ignoreBlur: true,
    hint: stack.split("\n")[0],
}, [
    {
        name: `Open ${script} in editor`,
        value: enum_1.ErrorAction.Open,
    },
    {
        name: `Open ${errorLog} in editor`,
        value: enum_1.ErrorAction.Log,
    },
    {
        name: `Open log kit.log in editor`,
        value: enum_1.ErrorAction.KitLog,
    },
    {
        name: `Ask for help on forum`,
        description: `Copy error to clipboard and open discussions in browser`,
        value: enum_1.ErrorAction.Ask,
    },
]);
await errorActions[errorAction]();
