import {
  backToMainShortcut,
  closeShortcut,
  cmd,
} from "../core/utils.js"
let scriptPath = await arg()
if (process.env.KIT_EDITOR === "kit") {
  let value = await readFile(scriptPath, "utf-8")
  await editor({
    value,
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
        name: `Save and Run`,
        key: `${cmd}+shift+s`,
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
