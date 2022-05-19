import { appDbPath, shortcutsPath } from "../core/utils.js"

// TODO: This loads all of kit, but we only need chokidar
let { default: chokidar } = await import("chokidar")

let kenvScriptsWatcher = chokidar.watch([
  path.resolve(kenvPath("scripts", "*")),
  path.resolve(kenvPath("kenvs", "*", "scripts", "*")),
  path.normalize(appDbPath),
  path.normalize(shortcutsPath),
])

kenvScriptsWatcher.on("all", (eventName, filePath) => {
  process.send({
    eventName,
    filePath,
  })
})

export {}
