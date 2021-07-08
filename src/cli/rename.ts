import { exists, selectScript } from "../utils.js"

let { command, filePath } = await selectScript(
  `Which script do you want to rename?`
)

let newCommand = await arg({
  placeholder: `Enter the new script name:`,
  validate: exists,
})

let lenientCommand = newCommand.replace(/(?<!\.js)$/, ".js")

let newFilePath = kenvPath("scripts", lenientCommand)

mv(filePath, newFilePath)

let oldBin = kenvPath("bin", command.replace(".js", ""))
await trash(oldBin)
await cli("create-bin", "scripts", lenientCommand)
edit(newFilePath, kenvPath())

export {}
