// Description: Rename Script

import { exists, selectScript } from "../utils.js"

let { command, filePath } = await selectScript(
  `Which script do you want to rename?`
)

let newCommand = await arg({
  placeholder: `Enter the new script name:`,
  selected: filePath,
  validate: exists,
})

let lenientCommand = newCommand.replace(/(?<!\.js)$/, ".js")

let newFilePath = path.resolve(
  path.dirname(filePath),
  lenientCommand
)

mv(filePath, newFilePath)

let oldBin = path.resolve(
  path.dirname(filePath),
  "..",
  "bin",
  command
)
await trash([oldBin])
await cli("create-bin", "scripts", newFilePath)
edit(newFilePath, kenvPath())

export {}
