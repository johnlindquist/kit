"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trashBinFromScript = exports.createBinFromName = exports.createBinFromScript = exports.toggleBackground = exports.exists = exports.selectScript = void 0;
const enum_1 = require("@core/enum");
const db_1 = require("@core/db");
let selectScript = async (message = "Select a script", fromCache = true, xf = x => x) => {
    let script = await arg(message, xf(await (0, db_1.getScripts)(fromCache)));
    if (typeof script === "string") {
        return await (0, db_1.getScriptFromString)(script);
    }
    return script;
};
exports.selectScript = selectScript;
//validator
let exists = async (input) => {
    return (await isBin(kenvPath("bin", input)))
        ? chalk `{red.bold ${input}} already exists. Try again:`
        : (await isDir(kenvPath("bin", input)))
            ? chalk `{red.bold ${input}} exists as group. Enter different name:`
            : exec(`command -v ${input}`, {
                silent: true,
            }).stdout
                ? chalk `{red.bold ${input}} is a system command. Enter different name:`
                : !input.match(/^([a-z]|[0-9]|\-|\/)+$/g)
                    ? chalk `{red.bold ${input}} can only include lowercase, numbers, and -. Enter different name:`
                    : true;
};
exports.exists = exists;
let toggleBackground = async (script) => {
    let { tasks } = await global.getBackgroundTasks();
    let task = tasks.find(task => task.filePath === script.filePath);
    let toggleOrLog = await arg(`${script.command} is ${task ? `running` : `stopped`}`, [
        {
            name: `${task ? `Stop` : `Start`} ${script.command}`,
            value: `toggle`,
        },
        { name: `Edit ${script.command}`, value: `edit` },
        { name: `View ${script.command}.log`, value: `log` },
    ]);
    if (toggleOrLog === "toggle") {
        send(enum_1.Channel.TOGGLE_BACKGROUND, {
            filePath: script.filePath,
        });
    }
    if (toggleOrLog === "edit") {
        await edit(script.filePath, kenvPath());
    }
    if (toggleOrLog === "log") {
        await edit(kenvPath("logs", `${script.command}.log`), kenvPath());
    }
};
exports.toggleBackground = toggleBackground;
let createBinFromScript = async (type, { kenv, command }) => {
    let binTemplate = await readFile(kitPath("templates", "bin", "template"), "utf8");
    let targetPath = (...parts) => kenvPath(kenv && `kenvs/${kenv}`, ...parts);
    let binTemplateCompiler = compile(binTemplate);
    let compiledBinTemplate = binTemplateCompiler({
        command,
        type,
        ...env,
        TARGET_PATH: targetPath(),
    });
    let binFilePath = targetPath("bin", command);
    mkdir("-p", path.dirname(binFilePath));
    await writeFile(binFilePath, compiledBinTemplate);
    chmod(755, binFilePath);
};
exports.createBinFromScript = createBinFromScript;
let createBinFromName = async (command, kenv) => {
    let binTemplate = await readFile(kitPath("templates", "bin", "template"), "utf8");
    let binTemplateCompiler = compile(binTemplate);
    let compiledBinTemplate = binTemplateCompiler({
        command,
        type: enum_1.Bin.scripts,
        ...env,
        TARGET_PATH: kenv,
    });
    let binFilePath = path.resolve(kenv, "bin", command);
    mkdir("-p", path.dirname(binFilePath));
    await writeFile(binFilePath, compiledBinTemplate);
    chmod(755, binFilePath);
};
exports.createBinFromName = createBinFromName;
let trashBinFromScript = async (script) => {
    trash([
        kenvPath(script.kenv && `kenvs/${script.kenv}`, "bin", script.command),
    ]);
};
exports.trashBinFromScript = trashBinFromScript;
