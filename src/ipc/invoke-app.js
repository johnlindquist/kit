"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("@core/util");
let ipc = await npm("node-ipc");
ipc.config.id = "kenv";
ipc.config.retry = 1500;
ipc.config.silent = true;
ipc.connectTo("kit", kitPath("tmp", "ipc"), () => {
    ipc.of.kit.on("connect", async () => {
        let [, , , scriptPath, ...runArgs] = process.argv;
        ipc.of.kit.emit("message", [
            await (0, util_1.resolveToScriptPath)(scriptPath),
            ...runArgs,
        ]);
        ipc.disconnect("kit");
    });
});
