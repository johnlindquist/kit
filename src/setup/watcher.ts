process.title = `Kit Watcher`

import path from "path"
import os from "os"

let { default: chokidar } = await import("chokidar")

let home = (...pathParts) => {
  return path.resolve(os.homedir(), ...pathParts)
}
//app
let kitPath = (...parts: string[]) =>
  path.join(
    process.env.KIT || home(".kit"),
    ...parts.filter(Boolean)
  )
// //app
let kenvPath = (...parts: string[]) => {
  return path.join(
    process.env.KENV || home(".kenv"),
    ...parts.filter(Boolean)
  )
}
let shortcutsPath = kitPath("db", "shortcuts.json")
let appDbPath = kitPath("db", "app.json")
let kenvScriptsWatcher = chokidar.watch(
  path.resolve(kenvPath("scripts", "*")),
  {
    depth: 0,
  }
)
chokidar
  .watch([appDbPath, shortcutsPath])
  .on("all", (eventName, filePath) => {
    process.send({ eventName, filePath })
  })
kenvScriptsWatcher.on("all", (eventName, filePath) => {
  // only if .ts or .js
  if (!filePath.match(/\.(ts|js)$/)) return
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
