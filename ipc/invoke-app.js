import { resolveToScriptPath } from "../utils.js";
let ipc = await npm("node-ipc");
ipc.config.id = "kenv";
ipc.config.retry = 1500;
ipc.config.silent = true;
ipc.connectTo("kit", kitPath("tmp", "ipc"), () => {
    ipc.of.kit.on("connect", () => {
        let [, , , scriptPath, ...runArgs] = process.argv;
        ipc.of.kit.emit("message", [
            resolveToScriptPath(scriptPath),
            ...runArgs,
        ]);
        ipc.disconnect("kit");
    });
});
