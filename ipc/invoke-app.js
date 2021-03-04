let ipc = await npm("node-ipc")
let scriptPath = await arg()

ipc.config.id = "kenv"
ipc.config.retry = 1500
ipc.config.silent = true

ipc.connectTo("kit", kitPath("tmp", "ipc"), () => {
  ipc.of.kit.on("connect", () => {
    ipc.of.kit.emit("message", {
      scriptPath,
      scriptArgs: args,
    })
    ipc.disconnect("kit")
  })
})
