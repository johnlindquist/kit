import { determineOutFile } from "../api/kit.js"
import {
  backToMainShortcut,
  closeShortcut,
  cmd,
} from "../core/utils.js"
let scriptPath = await arg()
// TODO: centralize .ts/.js finding logic
if (scriptPath.endsWith(".mjs")) {
  let { name, dir } = path.parse(scriptPath)
  scriptPath = path.resolve(
    dir,
    "..",
    "scripts",
    name + ".ts"
  )
}
if (
  process.env.KIT_EDITOR === "kit" &&
  process.env.KIT_CONTEXT === "app"
) {
  let value = await readFile(scriptPath, "utf-8")
  await editor({
    value,
    description: scriptPath,
    extraLibs: await global.getExtraLibs(),
    language: path.extname(scriptPath).slice(1),
    shortcuts: [
      {
        ...backToMainShortcut,
        onPress: async input => {
          await writeFile(scriptPath, input)
          await mainScript()
        },
      },
      {
        name: `Duplicate`,
        key: `${cmd}+shift+d`,
        bar: "right",
        onPress: async () => {
          await run(
            kitPath("cli", "duplicate.js"),
            scriptPath
          )
        },
      },
      closeShortcut,
      {
        name: `Save`,
        key: `${cmd}+s`,
        onPress: async input => {
          await writeFile(scriptPath, input)
          await mainScript()
        },
        bar: "right",
      },
      {
        name: `Run`,
        key: `${cmd}+o`,
        onPress: async input => {
          let { default: chokidar } = await import(
            "chokidar"
          )
          let outfile = scriptPath
          if (scriptPath.match(/\.ts$/)) {
            outfile = determineOutFile(scriptPath)
          }
          let watcher = chokidar.watch(outfile)
          watcher.once("change", async () => {
            watcher.close()
            await run(scriptPath)
          })
          await writeFile(scriptPath, input)
        },
        bar: "right",
      },
    ],
  })
} else {
  await edit(scriptPath, kenvPath())
}
