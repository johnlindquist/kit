"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("@core/util");
const db_1 = require("@core/db");
global.getScripts = db_1.getScripts;
global.cwd = process.cwd;
global.pid = process.pid;
global.stderr = process.stderr;
global.stdin = process.stdin;
global.stdout = process.stdout;
global.uptime = process.uptime;
global.path = await Promise.resolve().then(() => __importStar(require("path")));
await Promise.resolve().then(() => __importStar(require("./packages/axios.js")));
await Promise.resolve().then(() => __importStar(require("./packages/chalk.js")));
await Promise.resolve().then(() => __importStar(require("./packages/clipboardy.js")));
await Promise.resolve().then(() => __importStar(require("./packages/child_process.js")));
await Promise.resolve().then(() => __importStar(require("./packages/degit.js")));
await Promise.resolve().then(() => __importStar(require("./packages/download.js")));
await Promise.resolve().then(() => __importStar(require("./packages/fs.js")));
await Promise.resolve().then(() => __importStar(require("./packages/fsPromises.js")));
await Promise.resolve().then(() => __importStar(require("./packages/handlebars.js")));
await Promise.resolve().then(() => __importStar(require("./packages/lodash.js")));
await Promise.resolve().then(() => __importStar(require("./packages/lowdb.js")));
await Promise.resolve().then(() => __importStar(require("./packages/marked.js")));
await Promise.resolve().then(() => __importStar(require("./packages/node-fetch.js")));
await Promise.resolve().then(() => __importStar(require("./packages/node-notifier.js")));
await Promise.resolve().then(() => __importStar(require("./packages/shelljs.js")));
await Promise.resolve().then(() => __importStar(require("./packages/trash.js")));
await Promise.resolve().then(() => __importStar(require("./packages/uuid.js")));
await Promise.resolve().then(() => __importStar(require("./packages/zx.js")));
global.env = async (envKey, promptConfig) => {
    if (promptConfig?.reset !== true) {
        if (global.env[envKey])
            return global.env[envKey];
    }
    let input = typeof promptConfig === "function"
        ? await promptConfig()
        : await global.kitPrompt({
            placeholder: `Set ${envKey} to:`,
            ...promptConfig,
        });
    if (input.startsWith("~"))
        input = input.replace("~", (0, util_1.home)());
    await global.cli("set-env-var", envKey, input);
    global.env[envKey] = input;
    return input;
};
(0, util_1.assignPropsTo)(process.env, global.env);
global.wait = util_1.wait;
global.kitPath = util_1.kitPath;
global.kenvPath = util_1.kenvPath;
global.isBin = util_1.isBin;
global.isDir = util_1.isDir;
global.isFile = util_1.isFile;
global.home = util_1.home;
global.memoryMap = new Map();
