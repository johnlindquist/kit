import { appDbPath, shortcutsPath } from "../core/utils.js"

// TODO: This loads all of kit, but we only need chokidar
let { default: chokidar } = await import("chokidar")

let kenvScriptsWatcher = chokidar.watch(
  [
    path.resolve(kenvPath("scripts", "*")),
    path.normalize(appDbPath),
    path.normalize(shortcutsPath),
  ],
  {
    depth: 0,
  }
)

kenvScriptsWatcher.on("all", (eventName, filePath) => {
  process.send({
    eventName,
    filePath,
  })
})

let kenvsWatcher = chokidar.watch(kenvPath("kenvs"), {
  ignoreInitial: false,
  depth: 0,
})

kenvsWatcher.on("addDir", filePath => {
  kenvScriptsWatcher.add(
    path.resolve(filePath, "scripts", "*")
  )
})

kenvsWatcher.on("unlink", filePath => {
  kenvScriptsWatcher.unwatch(
    path.resolve(filePath, "scripts", "*")
  )
})

export {}
