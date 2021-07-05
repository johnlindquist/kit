import { Channel } from "kit-bridge/esm/enum";
import { getScripts, getScriptFromString, } from "kit-bridge/esm/db";
export let selectScript = async (message = "Select a script", fromCache = true) => {
    let script = await arg(message, await getScripts(fromCache));
    if (typeof script === "string") {
        return await getScriptFromString(script);
    }
    return script;
};
//validator
export let exists = async (input) => (await isBin(kenvPath("bin", input)))
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
export let toggleBackground = async (script) => {
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
        send(Channel.TOGGLE_BACKGROUND, {
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
export let createBinFromScript = async (type, { kenv, command }) => {
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
