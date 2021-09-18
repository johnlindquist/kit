import { resolveToScriptPath } from "../core/utils.js"

let ipc = await npm("node-ipc")

ipc.config.id = "kenv"
ipc.config.retry = 1500
ipc.config.silent = true

ipc.connectTo("kit", kitPath("tmp", "ipc"), () => {
  ipc.of.kit.on("connect", async () => {
    let [, , , scriptPath, ...runArgs] = process.argv

    let { scriptPath: resolvedScriptPath } =
      await resolveToScriptPath(scriptPath)
    ipc.of.kit.emit("message", [
      resolvedScriptPath,
      ...runArgs,
    ])
    ipc.disconnect("kit")
  })
})

export {}
