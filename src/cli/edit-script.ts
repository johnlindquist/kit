import {
  escapeShortcut,
  closeShortcut,
  cmd,
} from "../core/utils.js"

let isApp = process.env.KIT_CONTEXT === "app"
let isKitEditor = process.env.KIT_EDITOR === "kit"

if (isApp && !isKitEditor) {
  await hide()
}

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

if (isApp && isKitEditor) {
  let value = await readFile(scriptPath, "utf-8")
  let extraLibs = await global.getExtraLibs()
  await editor({
    value,
    description: scriptPath,
    extraLibs,
    language: path.extname(scriptPath).slice(1),
    shortcuts: [
      {
        ...escapeShortcut,
        onPress: async input => {
          await writeFile(scriptPath, input)
          await wait(200)
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
          await wait(200)
          await mainScript()
        },
        bar: "right",
      },
      {
        name: `Run`,
        key: `${cmd}+o`,
        onPress: async input => {
          await writeFile(scriptPath, input)
          await run(scriptPath)
        },
        bar: "right",
      },
    ],
  })
} else {
  await edit(scriptPath, kenvPath())
}
