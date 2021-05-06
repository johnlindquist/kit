let ipc = await npm("node-ipc");
ipc.config.id = "kenv";
ipc.config.retry = 1500;
ipc.config.silent = true;
ipc.connectTo("kit", kitPath("tmp", "ipc"), () => {
    ipc.of.kit.on("connect", () => {
        ipc.of.kit.emit("message", process.argv);
        ipc.disconnect("kit");
    });
});
export {};
